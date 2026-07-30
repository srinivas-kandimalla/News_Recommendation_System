from flask import Blueprint
from app.controllers.news_controller import (
    add_news,
    get_news,
    get_single_news,
    edit_news,
    remove_news,
    search_news_controller
)

news_bp = Blueprint("news", __name__)


# ==========================
# Create News
# ==========================
@news_bp.route("/news", methods=["POST"])
def create_news_route():
    return add_news()


# ==========================
# Get All News
# ==========================
@news_bp.route("/news", methods=["GET"])
def get_news_route():
    return get_news()


# ==========================
# Search News
# ==========================
@news_bp.route("/news/search", methods=["GET"])
def search_news_route():
    return search_news_controller()


# ==========================
# Get Single News
# ==========================
@news_bp.route("/news/<id>", methods=["GET"])
def get_single_news_route(id):
    return get_single_news(id)


# ==========================
# Update News
# ==========================
@news_bp.route("/news/<id>", methods=["PUT"])
def update_news_route(id):
    return edit_news(id)


# ==========================
# Delete News
# ==========================
@news_bp.route("/news/<id>", methods=["DELETE"])
def delete_news_route(id):
    return remove_news(id)