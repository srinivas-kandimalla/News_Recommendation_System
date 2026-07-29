from flask import request, jsonify
from app.services.user_service import create_user


def register_user():
    """
    Receive user data from the client and create a new user.
    """
    user_data = request.get_json()

    result = create_user(user_data)

    return jsonify(result), 201