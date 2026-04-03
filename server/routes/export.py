import csv
import io
import json
from flask import Blueprint, request, Response
from server.database import get_collection
from server.services.query_service import build_filter, serialize_doc

export_bp = Blueprint('export', __name__)

CSV_COLUMNS = [
    'route_id', 'route_name', 'local_time', 'day_of_week', 'is_rush_hour',
    'distance_meters', 'duration_seconds', 'duration_in_traffic_seconds',
    'congestion_ratio', 'origin_lat', 'origin_lng', 'destination_lat', 'destination_lng',
]


def flatten_doc(doc):
    return {
        'route_id': doc.get('route_id'),
        'route_name': doc.get('route_name'),
        'local_time': doc.get('local_time'),
        'day_of_week': doc.get('day_of_week'),
        'is_rush_hour': doc.get('is_rush_hour'),
        'distance_meters': doc.get('distance', {}).get('meters'),
        'duration_seconds': doc.get('duration', {}).get('seconds'),
        'duration_in_traffic_seconds': doc.get('duration_in_traffic', {}).get('seconds'),
        'congestion_ratio': doc.get('congestion_ratio'),
        'origin_lat': doc.get('origin', {}).get('lat'),
        'origin_lng': doc.get('origin', {}).get('lng'),
        'destination_lat': doc.get('destination', {}).get('lat'),
        'destination_lng': doc.get('destination', {}).get('lng'),
    }


@export_bp.route('/api/export/csv')
def export_csv():
    collection = get_collection()
    query = build_filter(request.args)
    cursor = collection.find(query).sort([('local_time', -1)])

    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=CSV_COLUMNS)
    writer.writeheader()
    for doc in cursor:
        writer.writerow(flatten_doc(doc))

    return Response(
        output.getvalue(),
        mimetype='text/csv',
        headers={'Content-Disposition': 'attachment; filename=traffic_data.csv'},
    )


@export_bp.route('/api/export/json')
def export_json():
    collection = get_collection()
    query = build_filter(request.args)
    cursor = collection.find(query).sort([('local_time', -1)])
    data = [flatten_doc(doc) for doc in cursor]

    return Response(
        json.dumps(data, indent=2),
        mimetype='application/json',
        headers={'Content-Disposition': 'attachment; filename=traffic_data.json'},
    )
