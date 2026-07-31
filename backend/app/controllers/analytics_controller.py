from flask import jsonify
from app.utils.jwt_helper import token_required

from app.services.analytics_service import get_user_analytics


# ======================================================
# User Analytics
# ======================================================

@token_required
def analytics_controller(current_user):

    result = get_user_analytics(current_user["_id"])

    status_code = result.pop("status_code")

    return jsonify(result), status_code