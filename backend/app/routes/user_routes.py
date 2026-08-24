from flask import Blueprint
from app.controllers.user_controller import (
    register_user,
    login,
    profile,
    reset_user_password
)

user_bp = Blueprint("user", __name__)

@user_bp.route("/register", methods=["POST"])
def register():
    return register_user()


@user_bp.route("/login", methods=["POST"])
def user_login():
    return login()


@user_bp.route("/reset-password", methods=["POST"])
def user_reset_password():
    return reset_user_password()


@user_bp.route("/profile", methods=["GET"])
def user_profile():
    return profile()