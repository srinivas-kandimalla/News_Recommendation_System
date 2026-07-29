from flask import request, jsonify
from app.services.user_service import create_user, login_user


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