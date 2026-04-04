from flask import Blueprint, jsonify, request
from server.services import network_service

network_bp = Blueprint('network', __name__)


@network_bp.route('/api/network/neighborhoods')
def neighborhood_metrics():
    return jsonify(network_service.get_neighborhood_metrics(request.args))


@network_bp.route('/api/network/congestion-vs-structure')
def congestion_vs_structure():
    return jsonify(network_service.congestion_vs_structure(request.args))


@network_bp.route('/api/network/exit-congestion')
def exit_congestion():
    return jsonify(network_service.exit_congestion(request.args))


@network_bp.route('/api/network/bottlenecks')
def bottlenecks():
    return jsonify(network_service.bottleneck_nodes(request.args))
