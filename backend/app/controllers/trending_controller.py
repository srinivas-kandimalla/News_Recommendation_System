from flask import jsonify

from app.services.trending_service import get_trending_news


# ======================================================
# Trending News Controller
# ======================================================

def trending_news_controller():

    result = get_trending_news()

    status_code = result.pop("status_code")

    return jsonify(result), status_code