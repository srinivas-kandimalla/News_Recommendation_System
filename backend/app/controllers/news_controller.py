from flask import request, jsonify
from app.utils.jwt_helper import token_required, admin_required

from app.services.news_service import (
    create_news,
    get_all_news,
    get_news_by_id,
    update_news,
    delete_news,
    search_news
)


# ======================================================
# Create News
# ======================================================

@admin_required
def add_news(current_user):

    news_data = request.get_json()

    result = create_news(news_data)

    if result["success"]:
        return jsonify(result), 201

    return jsonify(result), 400


# ======================================================
# Get All News (Pagination)
# ======================================================

def get_news():

    page = request.args.get("page", default=1, type=int)
    limit = request.args.get("limit", default=5, type=int)
    category = request.args.get("category", default=None, type=str)

    # Validation
    if page < 1:
        page = 1

    if limit < 1:
        limit = 5

    result = get_all_news(page, limit, category)

    return jsonify(result), 200


# ======================================================
# Get Single News
# ======================================================

def get_single_news(id):

    result = get_news_by_id(id)

    status_code = result.pop("status_code")

    return jsonify(result), status_code


# ======================================================
# Update News
# ======================================================

@admin_required
def edit_news(current_user, id):

    news_data = request.get_json()

    result = update_news(id, news_data)

    status_code = result.pop("status_code")

    return jsonify(result), status_code


# ======================================================
# Delete News
# ======================================================

@admin_required
def remove_news(current_user, id):

    result = delete_news(id)

    status_code = result.pop("status_code")

    return jsonify(result), status_code



# ======================================================
# Search News
# ======================================================

def search_news_controller():

    query = request.args.get("q")

    if not query:
        return jsonify({
            "success": False,
            "message": "Search query is required"
        }), 400

    result = search_news(query)

    status_code = result.pop("status_code")

    return jsonify(result), status_code