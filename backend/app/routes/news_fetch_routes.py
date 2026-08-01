from flask import Blueprint
from app.controllers.news_fetch_controller import fetch_news_controller

news_fetch_bp = Blueprint("news_fetch_bp", __name__)

@news_fetch_bp.route("/news/fetch", methods=["POST"])
def fetch_news():
    return fetch_news_controller()