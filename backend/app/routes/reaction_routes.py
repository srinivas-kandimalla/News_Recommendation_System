from flask import Blueprint

from app.controllers.reaction_controller import (
    like_news_controller,
    dislike_news_controller,
    get_reactions_controller
)

reaction_bp = Blueprint("reaction_bp", __name__)


# ======================================================
# Like News
# ======================================================

@reaction_bp.route("/news/<news_id>/like", methods=["POST"])
def like_news_route(news_id):
    return like_news_controller(news_id)


# ======================================================
# Dislike News
# ======================================================

@reaction_bp.route("/news/<news_id>/dislike", methods=["POST"])
def dislike_news_route(news_id):
    return dislike_news_controller(news_id)


# ======================================================
# Get Reactions
# ======================================================

@reaction_bp.route("/news/<news_id>/reactions", methods=["GET"])
def get_reactions_route(news_id):
    return get_reactions_controller(news_id)