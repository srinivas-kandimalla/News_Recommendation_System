from flask import Flask
from app.routes.home_routes import home_bp

def create_app():
    app = Flask(__name__)

    # Register Blueprints
    app.register_blueprint(home_bp)

    return app