from flask import Flask
from app.config.config import Config
from app.database.db import db

from app.routes.home_routes import home_bp
from app.routes.user_routes import user_bp
from app.routes.news_routes import news_bp


def create_app():
    app = Flask(__name__)

    # Load configuration
    app.config.from_object(Config)

    # Register Blueprints
    app.register_blueprint(home_bp)
    app.register_blueprint(user_bp)
    app.register_blueprint(news_bp)

    return app