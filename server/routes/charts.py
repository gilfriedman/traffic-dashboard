from flask import Blueprint, jsonify, request
from server.services import aggregation_service

charts_bp = Blueprint('charts', __name__)


@charts_bp.route('/api/charts/congestion-over-time')
def congestion_over_time():
    return jsonify(aggregation_service.congestion_over_time(request.args))


@charts_bp.route('/api/charts/neighborhood-comparison')
def neighborhood_comparison():
    return jsonify(aggregation_service.neighborhood_comparison(request.args))


@charts_bp.route('/api/charts/day-of-week')
def day_of_week_chart():
    return jsonify(aggregation_service.day_of_week(request.args))


@charts_bp.route('/api/charts/rush-hour-profile')
def rush_hour_profile():
    return jsonify(aggregation_service.rush_hour_profile(request.args))


@charts_bp.route('/api/charts/route-ranking')
def route_ranking():
    return jsonify(aggregation_service.route_ranking(request.args))


@charts_bp.route('/api/charts/congestion-distribution')
def congestion_distribution():
    return jsonify(aggregation_service.congestion_distribution(request.args))
