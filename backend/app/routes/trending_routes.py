from flask import Blueprint

from app.controllers.trending_controller import trending_news_controller

trending_bp = Blueprint("trending_bp", __name__)


# ======================================================
# Trending News Route
# ======================================================

@trending_bp.route("/trending", methods=["GET"])
def trending_news():
    return trending_news_controller()