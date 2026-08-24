from flask import request, jsonify
from app.services.user_service import (
    create_user,
    login_user,
    get_profile
)
from app.utils.jwt_helper import token_required


def register_user():
    user_data = request.get_json()

    result = create_user(user_data)

    if result["success"]:
        return jsonify(result), 201

    return jsonify(result), 400


def login():
    user_data = request.get_json()

    result = login_user(user_data)

    if result["success"]:
        return jsonify(result), 200

    return jsonify(result), 401


@token_required
def profile(current_user):
    """
    Return the logged-in user's profile.
    """
    result = get_profile(current_user)

    if result["success"]:
        return jsonify(result), 200

    return jsonify(result), 404


def reset_user_password():
    """
    Reset user password by email.
    """
    user_data = request.get_json()
    from app.services.user_service import reset_password
    result = reset_password(user_data)

    if result["success"]:
        return jsonify(result), 200

    return jsonify(result), 400