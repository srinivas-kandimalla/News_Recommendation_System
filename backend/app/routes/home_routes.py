from flask import Blueprint

home_bp = Blueprint("home", __name__)

@home_bp.route("/")
def home():
    return {
        "project": "Context-Aware Personalized News Recommendation System",
        "status": "Backend Running Successfully 🚀",
        "version": "0.3.0"
    }