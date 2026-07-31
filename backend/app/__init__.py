from flask import Flask
from flask_cors import CORS

from app.config.config import Config
from app.database.db import db

from app.routes.home_routes import home_bp
from app.routes.user_routes import user_bp
from app.routes.news_routes import news_bp
from app.routes.recommendation_routes import recommendation_bp
from app.routes.reading_history_routes import reading_history_bp
from app.routes.bookmark_routes import bookmark_bp
from app.routes.reaction_routes import reaction_bp
from app.routes.analytics_routes import analytics_bp
from app.routes.trending_routes import trending_bp
from app.routes.admin_routes import admin_bp


def create_app():
    app = Flask(__name__)

    # Load configuration
    app.config.from_object(Config)

    # Enable CORS for React development server
    CORS(
        app,
        resources={
            r"/*": {
                "origins": [
                    "http://localhost:5173",
                    "http://localhost:5174",
                    "http://localhost:5175"
                ]
            }
        }
    )

    # Register Blueprints
    app.register_blueprint(home_bp)
    app.register_blueprint(user_bp)
    app.register_blueprint(news_bp)
    app.register_blueprint(recommendation_bp)
    app.register_blueprint(reading_history_bp)
    app.register_blueprint(bookmark_bp)
    app.register_blueprint(reaction_bp)
    app.register_blueprint(analytics_bp)
    app.register_blueprint(trending_bp)
    app.register_blueprint(admin_bp)

    return app