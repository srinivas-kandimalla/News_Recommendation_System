from flask import Blueprint

from app.controllers.bookmark_controller import (
    add_bookmark_controller,
    get_bookmarks_controller,
    remove_bookmark_controller
)

bookmark_bp = Blueprint("bookmark_bp", __name__)


# ======================================================
# Add Bookmark
# ======================================================

@bookmark_bp.route("/bookmark/<news_id>", methods=["POST"])
def add_bookmark_route(news_id):
    return add_bookmark_controller(news_id)


# ======================================================
# Get All Bookmarks
# ======================================================

@bookmark_bp.route("/bookmarks", methods=["GET"])
def get_bookmarks_route():
    return get_bookmarks_controller()


# ======================================================
# Remove Bookmark
# ======================================================

@bookmark_bp.route("/bookmark/<news_id>", methods=["DELETE"])
def remove_bookmark_route(news_id):
    return remove_bookmark_controller(news_id)