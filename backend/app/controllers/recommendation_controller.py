from flask import jsonify

from app.ai.recommendation_service import (
    get_recommendations,
    get_personalized_recommendations
)
from app.utils.jwt_helper import token_required


def recommend_news(news_id):
    result = get_recommendations(news_id)
    status_code = result.pop("status_code")
    return jsonify(result), status_code


@token_required
def personalized_recommendations(current_user):

    result = get_personalized_recommendations(
        str(current_user["_id"])
    )

    status_code = result.pop("status_code")

    return jsonify(result), status_code