from server.utils.neighborhoods import extract_neighborhood


def build_filter(args):
    query = {}

    neighborhoods = args.getlist('neighborhoods')
    route_ids = args.getlist('route_ids')
    exclude_neighborhoods = args.getlist('exclude_neighborhoods')
    start_date = args.get('start_date')
    end_date = args.get('end_date')
    rush_hour_only = args.get('rush_hour_only')
    day_of_week = args.getlist('day_of_week')

    if route_ids:
        query['route_id'] = {'$in': route_ids}
    elif neighborhoods:
        query['route_id'] = {'$regex': build_neighborhood_regex(neighborhoods)}

    if exclude_neighborhoods:
        exclude_regex = build_neighborhood_regex(exclude_neighborhoods)
        exclude_filter = {'route_id': {'$not': {'$regex': exclude_regex}}}
        if 'route_id' in query:
            query = {'$and': [query, exclude_filter]}
        else:
            query.update(exclude_filter)

    exclude_hours = args.getlist('exclude_hours')
    if exclude_hours:
        hour_patterns = '|'.join(f' {int(h):02d}:' for h in exclude_hours)
        hour_filter = {'local_time': {'$not': {'$regex': hour_patterns}}}
        if isinstance(query, dict) and '$and' in query:
            query['$and'].append(hour_filter)
        elif isinstance(query, dict):
            query = {'$and': [query, hour_filter]} if query else hour_filter
        else:
            query.update(hour_filter)

    if start_date or end_date:
        date_filter = {}
        if start_date:
            date_filter['$gte'] = start_date
        if end_date:
            date_filter['$lte'] = end_date + ' 23:59:59'
        if isinstance(query, dict) and '$and' in query:
            query['$and'].append({'local_time': date_filter})
        else:
            query['local_time'] = date_filter

    if rush_hour_only == 'true':
        _add_condition(query, {'is_rush_hour': True})

    if day_of_week:
        _add_condition(query, {'day_of_week': {'$in': day_of_week}})

    return query


def _add_condition(query, condition):
    if '$and' in query:
        query['$and'].append(condition)
    else:
        query.update(condition)


def build_neighborhood_regex(neighborhoods):
    prefixes = '|'.join(f'^{n}\\d' for n in neighborhoods)
    return prefixes


def build_sort(args):
    sort_by = args.get('sort_by', 'local_time')
    sort_order = -1 if args.get('sort_order', 'desc') == 'desc' else 1
    return [(sort_by, sort_order)]


def paginate(args):
    limit = min(int(args.get('limit', 25)), 500)
    offset = int(args.get('offset', 0))
    return limit, offset


def serialize_doc(doc):
    doc['_id'] = str(doc['_id'])
    return doc
