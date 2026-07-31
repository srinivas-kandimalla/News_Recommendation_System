from flask import Blueprint

from app.controllers.analytics_controller import analytics_controller

analytics_bp = Blueprint("analytics_bp", __name__)


# ======================================================
# Analytics
# ======================================================

@analytics_bp.route("/analytics", methods=["GET"])
def analytics_route():
    return analytics_controller()