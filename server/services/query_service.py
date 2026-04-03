from server.utils.neighborhoods import extract_neighborhood


def build_filter(args):
    query = {}

    neighborhoods = args.getlist('neighborhoods')
    route_ids = args.getlist('route_ids')
    start_date = args.get('start_date')
    end_date = args.get('end_date')
    rush_hour_only = args.get('rush_hour_only')
    day_of_week = args.getlist('day_of_week')

    if route_ids:
        query['route_id'] = {'$in': route_ids}
    elif neighborhoods:
        query['route_id'] = {'$regex': build_neighborhood_regex(neighborhoods)}

    if start_date or end_date:
        date_filter = {}
        if start_date:
            date_filter['$gte'] = start_date
        if end_date:
            date_filter['$lte'] = end_date + ' 23:59:59'
        query['local_time'] = date_filter

    if rush_hour_only == 'true':
        query['is_rush_hour'] = True

    if day_of_week:
        query['day_of_week'] = {'$in': day_of_week}

    return query


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
