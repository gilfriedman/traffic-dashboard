from flask import Blueprint, jsonify, request
from server.database import get_collection
from server.services.query_service import build_filter, build_sort, paginate, serialize_doc

traffic_bp = Blueprint('traffic', __name__)


@traffic_bp.route('/api/traffic/data')
def traffic_data():
    collection = get_collection()
    query = build_filter(request.args)
    sort = build_sort(request.args)
    limit, offset = paginate(request.args)

    total = collection.count_documents(query)
    cursor = collection.find(query).sort(sort).skip(offset).limit(limit)
    data = [serialize_doc(doc) for doc in cursor]

    return jsonify({
        'data': data,
        'total': total,
        'limit': limit,
        'offset': offset,
    })
