from flask import jsonify

from app.services.news_fetch_service import fetch_latest_news


def fetch_news_controller():

    result = fetch_latest_news()

    status_code = result.pop("status_code")

    return jsonify(result), status_code