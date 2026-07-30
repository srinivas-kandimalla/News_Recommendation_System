from flask import jsonify

from app.services.reading_history_service import save_reading_history
from app.utils.jwt_helper import token_required


@token_required
def add_reading_history(current_user, news_id):

    result = save_reading_history(str(current_user["_id"]), news_id)

    status_code = result.pop("status_code")

    return jsonify(result), status_code