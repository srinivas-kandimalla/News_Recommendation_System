import jwt
from datetime import datetime, timedelta
from functools import wraps
from flask import request, jsonify
from app.config.config import Config


def generate_token(user):
    """
    Generate JWT token for authenticated user.
    """
    payload = {
        "user_id": str(user["_id"]),
        "email": user["email"],
        "exp": datetime.utcnow() + timedelta(hours=24)
    }

    token = jwt.encode(
        payload,
        Config.SECRET_KEY,
        algorithm="HS256"
    )

    return token


def token_required(f):
    """
    Verify JWT token before allowing access to protected routes.
    """
    @wraps(f)
    def decorated(*args, **kwargs):

        auth_header = request.headers.get("Authorization")

        if not auth_header:
            return jsonify({
                "success": False,
                "message": "Token is missing"
            }), 401

        try:
            # Remove "Bearer " prefix if present
            if auth_header.startswith("Bearer "):
                token = auth_header.split(" ")[1]
            else:
                token = auth_header

            current_user = jwt.decode(
                token,
                Config.SECRET_KEY,
                algorithms=["HS256"]
            )

        except jwt.ExpiredSignatureError:
            return jsonify({
                "success": False,
                "message": "Token has expired"
            }), 401

        except jwt.InvalidTokenError:
            return jsonify({
                "success": False,
                "message": "Invalid token"
            }), 401

        return f(current_user, *args, **kwargs)

    return decorated