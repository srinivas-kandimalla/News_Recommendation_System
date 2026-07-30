from flask import jsonify
from app.utils.jwt_helper import token_required

from app.services.reaction_service import (
    like_news,
    dislike_news,
    get_reactions
)


# ======================================================
# Like News
# ======================================================

@token_required
def like_news_controller(current_user, news_id):

    result = like_news(current_user["_id"], news_id)

    status_code = result.pop("status_code")

    return jsonify(result), status_code


# ======================================================
# Dislike News
# ======================================================

@token_required
def dislike_news_controller(current_user, news_id):

    result = dislike_news(current_user["_id"], news_id)

    status_code = result.pop("status_code")

    return jsonify(result), status_code


# ======================================================
# Get Reactions
# ======================================================

def get_reactions_controller(news_id):

    result = get_reactions(news_id)

    status_code = result.pop("status_code")

    return jsonify(result), status_code