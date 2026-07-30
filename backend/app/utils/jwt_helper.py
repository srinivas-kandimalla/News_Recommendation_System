import jwt
from datetime import datetime, timedelta
from functools import wraps
from flask import request, jsonify
from bson import ObjectId

from app.config.config import Config
from app.database.db import users_collection


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

            payload = jwt.decode(
                token,
                Config.SECRET_KEY,
                algorithms=["HS256"]
            )

            current_user = users_collection.find_one({
                "_id": ObjectId(payload["user_id"])
            })

            if not current_user:
                return jsonify({
                    "success": False,
                    "message": "User not found"
                }), 404

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

        except Exception as e:
            return jsonify({
                "success": False,
                "message": str(e)
            }), 500

        return f(current_user, *args, **kwargs)

    return decorated