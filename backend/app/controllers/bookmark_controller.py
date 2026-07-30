from flask import jsonify
from app.utils.jwt_helper import token_required

from app.services.bookmark_service import (
    add_bookmark,
    get_bookmarks,
    remove_bookmark
)


# ======================================================
# Add Bookmark
# ======================================================

@token_required
def add_bookmark_controller(current_user, news_id):

    result = add_bookmark(current_user["_id"], news_id)

    status_code = result.pop("status_code")

    return jsonify(result), status_code


# ======================================================
# Get Bookmarks
# ======================================================

@token_required
def get_bookmarks_controller(current_user):

    result = get_bookmarks(current_user["_id"])

    status_code = result.pop("status_code")

    return jsonify(result), status_code


# ======================================================
# Remove Bookmark
# ======================================================

@token_required
def remove_bookmark_controller(current_user, news_id):

    result = remove_bookmark(current_user["_id"], news_id)

    status_code = result.pop("status_code")

    return jsonify(result), status_code