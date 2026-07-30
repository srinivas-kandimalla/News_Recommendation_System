from flask import request, jsonify
from app.utils.jwt_helper import token_required

from app.services.news_service import (
    create_news,
    get_all_news,
    get_news_by_id,
    update_news,
    delete_news
)


@token_required
def add_news(current_user):

    news_data = request.get_json()

    result = create_news(news_data)

    if result["success"]:
        return jsonify(result), 201

    return jsonify(result), 400


def get_news():

    result = get_all_news()

    return jsonify(result), 200


def get_single_news(id):

    result = get_news_by_id(id)

    status_code = result.pop("status_code")

    return jsonify(result), status_code


@token_required
def edit_news(current_user, id):

    news_data = request.get_json()

    result = update_news(id, news_data)

    status_code = result.pop("status_code")

    return jsonify(result), status_code


@token_required
def remove_news(current_user, id):

    result = delete_news(id)

    status_code = result.pop("status_code")

    return jsonify(result), status_code