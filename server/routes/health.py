from flask import Blueprint, jsonify, request
from server.database import get_collection
from server.services.query_service import build_filter
from server.utils.neighborhoods import extract_neighborhood, get_display_name

health_bp = Blueprint('health', __name__)


@health_bp.route('/api/health')
def health():
    collection = get_collection()
    query = build_filter(request.args)
    count = collection.count_documents(query)

    last_doc = collection.find_one(query, sort=[('local_time', -1)])
    first_doc = collection.find_one(query, sort=[('local_time', 1)])

    return jsonify({
        'status': 'ok',
        'total_records': count,
        'first_record': first_doc['local_time'] if first_doc else None,
        'last_record': last_doc['local_time'] if last_doc else None,
    })


@health_bp.route('/api/routes')
def routes():
    collection = get_collection()
    pipeline = [
        {'$group': {
            '_id': '$route_id',
            'route_name': {'$first': '$route_name'},
            'origin': {'$first': '$origin'},
            'destination': {'$first': '$destination'},
        }},
        {'$sort': {'_id': 1}},
    ]
    results = list(collection.aggregate(pipeline))

    route_list = []
    for route in results:
        neighborhood = extract_neighborhood(route['_id'])
        route_list.append({
            'route_id': route['_id'],
            'route_name': route['route_name'],
            'neighborhood': neighborhood,
            'neighborhood_display': get_display_name(neighborhood),
            'origin': route.get('origin'),
            'destination': route.get('destination'),
        })

    return jsonify(route_list)


@health_bp.route('/api/neighborhoods')
def neighborhoods():
    collection = get_collection()
    pipeline = [
        {'$group': {'_id': '$route_id'}},
        {'$sort': {'_id': 1}},
    ]
    route_ids = [doc['_id'] for doc in collection.aggregate(pipeline)]

    neighborhood_map = {}
    for route_id in route_ids:
        key = extract_neighborhood(route_id)
        if key not in neighborhood_map:
            neighborhood_map[key] = {
                'key': key,
                'display_name': get_display_name(key),
                'route_count': 0,
                'route_ids': [],
            }
        neighborhood_map[key]['route_count'] += 1
        neighborhood_map[key]['route_ids'].append(route_id)

    return jsonify(list(neighborhood_map.values()))
