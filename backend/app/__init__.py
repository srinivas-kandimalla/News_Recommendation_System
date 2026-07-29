from flask import Flask
from app.config.config import Config
from app.routes.home_routes import home_bp

def create_app():
    app = Flask(__name__)

    # Load configuration
    app.config.from_object(Config)

    # Register Blueprints
    app.register_blueprint(home_bp)

    return app