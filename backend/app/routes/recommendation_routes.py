from flask import Blueprint

from app.controllers.recommendation_controller import (
    recommend_news,
    personalized_recommendations
)

recommendation_bp = Blueprint("recommendation", __name__)


@recommendation_bp.route("/recommendations/<news_id>", methods=["GET"])
def recommendations(news_id):
    return recommend_news(news_id)


@recommendation_bp.route("/personalized-recommendations", methods=["GET"])
def personalized():
    return personalized_recommendations()