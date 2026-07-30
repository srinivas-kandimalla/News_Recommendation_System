from flask import Blueprint
from app.controllers.news_controller import (
    add_news,
    get_news,
    get_single_news,
    edit_news,
    remove_news
)

news_bp = Blueprint("news", __name__)


@news_bp.route("/news", methods=["POST"])
def create_news_route():
    return add_news()


@news_bp.route("/news", methods=["GET"])
def get_news_route():
    return get_news()


@news_bp.route("/news/<id>", methods=["GET"])
def get_single_news_route(id):
    return get_single_news(id)


@news_bp.route("/news/<id>", methods=["PUT"])
def update_news_route(id):
    return edit_news(id)


@news_bp.route("/news/<id>", methods=["DELETE"])
def delete_news_route(id):
    return remove_news(id)