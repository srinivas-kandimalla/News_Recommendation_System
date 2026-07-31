from flask import jsonify

from app.services.admin_service import get_admin_dashboard


# ======================================================
# Admin Dashboard Controller
# ======================================================

def admin_dashboard_controller():

    result = get_admin_dashboard()

    status_code = result.pop("status_code")

    return jsonify(result), status_code