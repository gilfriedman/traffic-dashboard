import os
from flask import Flask, send_from_directory
from flask_cors import CORS
from flask_caching import Cache

from server.routes.health import health_bp
from server.routes.traffic import traffic_bp
from server.routes.export import export_bp
from server.routes.charts import charts_bp

cache = Cache(config={'CACHE_TYPE': 'SimpleCache', 'CACHE_DEFAULT_TIMEOUT': 300})


def create_app():
    app = Flask(__name__, static_folder=None)
    CORS(app)
    cache.init_app(app)

    app.register_blueprint(health_bp)
    app.register_blueprint(traffic_bp)
    app.register_blueprint(export_bp)
    app.register_blueprint(charts_bp)

    client_dist = os.path.join(os.path.dirname(__file__), '..', 'client', 'dist')

    @app.route('/', defaults={'path': ''})
    @app.route('/<path:path>')
    def serve_frontend(path):
        full_path = os.path.join(client_dist, path)
        if path and os.path.isfile(full_path):
            return send_from_directory(client_dist, path)
        return send_from_directory(client_dist, 'index.html')

    return app


if __name__ == '__main__':
    app = create_app()
    app.run(port=5001, debug=True)
