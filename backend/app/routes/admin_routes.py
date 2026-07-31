from flask import Blueprint

from app.controllers.admin_controller import admin_dashboard_controller

admin_bp = Blueprint("admin_bp", __name__)


# ======================================================
# Admin Dashboard Route
# ======================================================

@admin_bp.route("/admin/dashboard", methods=["GET"])
def admin_dashboard():
    return admin_dashboard_controller()