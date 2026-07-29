from flask import Blueprint
from app.controllers.user_controller import register_user

user_bp = Blueprint("user", __name__)

@user_bp.route("/register", methods=["POST"])
def register():
    return register_user()