from flask import jsonify
from app.utils.jwt_helper import admin_required

from app.services.admin_service import get_admin_dashboard


# ======================================================
# Admin Dashboard Controller
# ======================================================

@admin_required
def admin_dashboard_controller(current_user):

    result = get_admin_dashboard()

    status_code = result.pop("status_code")

    return jsonify(result), status_code