from server.database import get_collection
from server.services.query_service import build_filter
from server.utils.neighborhoods import NEIGHBORHOOD_DISPLAY_NAMES, get_display_name


def _match_stage(args):
    query = build_filter(args)
    return {'$match': query} if query else None


def _has_route_ids(args):
    return bool(args.getlist('route_ids'))


def _neighborhood_field():
    """Build a $switch expression to extract neighborhood from route_id.
    Uses $indexOfCP (prefix match) instead of $regexpReplace for compatibility."""
    branches = [
        {'case': {'$eq': [{'$indexOfCP': ['$route_id', prefix]}, 0]}, 'then': prefix}
        for prefix in sorted(NEIGHBORHOOD_DISPLAY_NAMES.keys(), key=len, reverse=True)
    ]
    return {'$switch': {'branches': branches, 'default': '$route_id'}}


def congestion_over_time(args):
    collection = get_collection()
    granularity = args.get('granularity', 'hour')
    by_route = _has_route_ids(args)

    group_format = {
        '15min': '%Y-%m-%d %H:%M',
        'hour': '%Y-%m-%d %H:00',
        'day': '%Y-%m-%d',
        'week': '%Y-W%V',
    }.get(granularity, '%Y-%m-%d %H:00')

    pipeline = []
    match = _match_stage(args)
    if match:
        pipeline.append(match)

    pipeline.append({'$addFields': {
        'parsed_time': {'$dateFromString': {'dateString': '$local_time', 'format': '%Y-%m-%d %H:%M:%S'}},
    }})

    if by_route:
        pipeline.append({'$addFields': {
            'time_bucket': {'$dateToString': {'format': group_format, 'date': '$parsed_time'}},
        }})
        pipeline.extend([
            {'$group': {
                '_id': {'time': '$time_bucket', 'route_id': '$route_id', 'route_name': '$route_name'},
                'avg_congestion': {'$avg': '$congestion_ratio'},
                'max_congestion': {'$max': '$congestion_ratio'},
                'count': {'$sum': 1},
            }},
            {'$sort': {'_id.time': 1}},
        ])
        results = list(collection.aggregate(pipeline, allowDiskUse=True))
        return [{
            'time': r['_id']['time'],
            'route_id': r['_id']['route_id'],
            'route_name': r['_id']['route_name'],
            'avg_congestion': round(r['avg_congestion'], 3),
            'max_congestion': round(r['max_congestion'], 3),
            'count': r['count'],
        } for r in results]

    pipeline.append({'$addFields': {
        'time_bucket': {'$dateToString': {'format': group_format, 'date': '$parsed_time'}},
        'neighborhood': _neighborhood_field(),
    }})
    pipeline.extend([
        {'$group': {
            '_id': {'time': '$time_bucket', 'neighborhood': '$neighborhood'},
            'avg_congestion': {'$avg': '$congestion_ratio'},
            'max_congestion': {'$max': '$congestion_ratio'},
            'count': {'$sum': 1},
        }},
        {'$sort': {'_id.time': 1}},
    ])

    results = list(collection.aggregate(pipeline, allowDiskUse=True))
    return [{
        'time': r['_id']['time'],
        'neighborhood': r['_id']['neighborhood'],
        'neighborhood_display': get_display_name(r['_id']['neighborhood']),
        'avg_congestion': round(r['avg_congestion'], 3),
        'max_congestion': round(r['max_congestion'], 3),
        'count': r['count'],
    } for r in results]


def neighborhood_comparison(args):
    collection = get_collection()
    pipeline = []
    match = _match_stage(args)
    if match:
        pipeline.append(match)

    pipeline.extend([
        {'$addFields': {
            'neighborhood': _neighborhood_field(),
        }},
        {'$group': {
            '_id': '$neighborhood',
            'avg_congestion': {'$avg': '$congestion_ratio'},
            'max_congestion': {'$max': '$congestion_ratio'},
            'min_congestion': {'$min': '$congestion_ratio'},
            'count': {'$sum': 1},
        }},
        {'$sort': {'avg_congestion': -1}},
    ])

    results = list(collection.aggregate(pipeline))
    return [{
        'neighborhood': r['_id'],
        'neighborhood_display': get_display_name(r['_id']),
        'avg_congestion': round(r['avg_congestion'], 3),
        'max_congestion': round(r['max_congestion'], 3),
        'min_congestion': round(r['min_congestion'], 3),
        'count': r['count'],
    } for r in results]


def day_of_week(args):
    collection = get_collection()
    by_route = _has_route_ids(args)
    day_order = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

    pipeline = []
    match = _match_stage(args)
    if match:
        pipeline.append(match)

    if by_route:
        pipeline.extend([
            {'$group': {
                '_id': {'day': '$day_of_week', 'route_id': '$route_id', 'route_name': '$route_name'},
                'avg_congestion': {'$avg': '$congestion_ratio'},
                'count': {'$sum': 1},
            }},
            {'$sort': {'_id.day': 1}},
        ])
        results = list(collection.aggregate(pipeline))
        output = [{
            'day': r['_id']['day'],
            'route_id': r['_id']['route_id'],
            'route_name': r['_id']['route_name'],
            'avg_congestion': round(r['avg_congestion'], 3),
            'count': r['count'],
        } for r in results]
    else:
        pipeline.extend([
            {'$addFields': {
                'neighborhood': _neighborhood_field(),
            }},
            {'$group': {
                '_id': {'day': '$day_of_week', 'neighborhood': '$neighborhood'},
                'avg_congestion': {'$avg': '$congestion_ratio'},
                'count': {'$sum': 1},
            }},
            {'$sort': {'_id.day': 1}},
        ])
        results = list(collection.aggregate(pipeline))
        output = [{
            'day': r['_id']['day'],
            'neighborhood': r['_id']['neighborhood'],
            'neighborhood_display': get_display_name(r['_id']['neighborhood']),
            'avg_congestion': round(r['avg_congestion'], 3),
            'count': r['count'],
        } for r in results]

    output.sort(key=lambda row: day_order.index(row['day']) if row['day'] in day_order else 99)
    return output


def rush_hour_profile(args):
    collection = get_collection()
    by_route = _has_route_ids(args)
    pipeline = []
    match = _match_stage(args)
    if match:
        pipeline.append(match)

    pipeline.append({'$match': {'is_rush_hour': True}})
    pipeline.append({'$addFields': {
        'parsed_time': {'$dateFromString': {'dateString': '$local_time', 'format': '%Y-%m-%d %H:%M:%S'}},
    }})

    if by_route:
        pipeline.extend([
            {'$addFields': {
                'time_slot': {'$dateToString': {'format': '%H:%M', 'date': '$parsed_time'}},
            }},
            {'$group': {
                '_id': {'slot': '$time_slot', 'route_id': '$route_id', 'route_name': '$route_name'},
                'avg_congestion': {'$avg': '$congestion_ratio'},
                'count': {'$sum': 1},
            }},
            {'$sort': {'_id.slot': 1}},
        ])
        results = list(collection.aggregate(pipeline))
        return [{
            'time_slot': r['_id']['slot'],
            'route_id': r['_id']['route_id'],
            'route_name': r['_id']['route_name'],
            'avg_congestion': round(r['avg_congestion'], 3),
            'count': r['count'],
        } for r in results]

    pipeline.extend([
        {'$addFields': {
            'neighborhood': _neighborhood_field(),
            'time_slot': {'$dateToString': {'format': '%H:%M', 'date': '$parsed_time'}},
        }},
        {'$group': {
            '_id': {'slot': '$time_slot', 'neighborhood': '$neighborhood'},
            'avg_congestion': {'$avg': '$congestion_ratio'},
            'count': {'$sum': 1},
        }},
        {'$sort': {'_id.slot': 1}},
    ])

    results = list(collection.aggregate(pipeline))
    return [{
        'time_slot': r['_id']['slot'],
        'neighborhood': r['_id']['neighborhood'],
        'neighborhood_display': get_display_name(r['_id']['neighborhood']),
        'avg_congestion': round(r['avg_congestion'], 3),
        'count': r['count'],
    } for r in results]


def route_ranking(args):
    collection = get_collection()
    pipeline = []
    match = _match_stage(args)
    if match:
        pipeline.append(match)

    pipeline.extend([
        {'$addFields': {
            'neighborhood': _neighborhood_field(),
        }},
        {'$group': {
            '_id': {'route_id': '$route_id', 'route_name': '$route_name', 'neighborhood': '$neighborhood'},
            'avg_congestion': {'$avg': '$congestion_ratio'},
            'max_congestion': {'$max': '$congestion_ratio'},
            'count': {'$sum': 1},
        }},
        {'$sort': {'avg_congestion': -1}},
    ])

    results = list(collection.aggregate(pipeline))
    return [{
        'route_id': r['_id']['route_id'],
        'route_name': r['_id']['route_name'],
        'neighborhood': r['_id']['neighborhood'],
        'neighborhood_display': get_display_name(r['_id']['neighborhood']),
        'avg_congestion': round(r['avg_congestion'], 3),
        'max_congestion': round(r['max_congestion'], 3),
        'count': r['count'],
    } for r in results]


def congestion_distribution(args):
    collection = get_collection()
    pipeline = []
    match = _match_stage(args)
    if match:
        pipeline.append(match)

    pipeline.extend([
        {'$addFields': {
            'neighborhood': _neighborhood_field(),
        }},
        {'$bucket': {
            'groupBy': '$congestion_ratio',
            'boundaries': [0, 0.5, 1.0, 1.2, 1.5, 2.0, 2.5, 3.0, 4.0, 5.0, 100],
            'default': 'other',
            'output': {
                'count': {'$sum': 1},
                'neighborhoods': {'$addToSet': '$neighborhood'},
            },
        }},
        {'$sort': {'_id': 1}},
    ])

    results = list(collection.aggregate(pipeline))
    bucket_labels = {
        0: '0-0.5', 0.5: '0.5-1.0', 1.0: '1.0-1.2', 1.2: '1.2-1.5',
        1.5: '1.5-2.0', 2.0: '2.0-2.5', 2.5: '2.5-3.0', 3.0: '3.0-4.0',
        4.0: '4.0-5.0', 5.0: '5.0+',
    }

    return [{
        'bucket': bucket_labels.get(r['_id'], str(r['_id'])),
        'min': r['_id'] if isinstance(r['_id'], (int, float)) else 0,
        'count': r['count'],
    } for r in results]
