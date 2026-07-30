from flask import Blueprint

from app.controllers.reading_history_controller import add_reading_history

reading_history_bp = Blueprint("reading_history", __name__)


@reading_history_bp.route("/reading-history/<news_id>", methods=["POST"])
def save_history(news_id):
    return add_reading_history(news_id)