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

    print("SECRET KEY USED TO GENERATE:", Config.SECRET_KEY)

    token = jwt.encode(
        payload,
        Config.SECRET_KEY,
        algorithm="HS256"
    )

    print("GENERATED TOKEN:", token)

    return token


def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):

        print("\n========== JWT DEBUG ==========")
        print("SECRET KEY USED TO VERIFY:", Config.SECRET_KEY)

        auth_header = request.headers.get("Authorization")
        print("Authorization Header:", auth_header)

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

            print("Extracted Token:", token)

            data = jwt.decode(
                token,
                Config.SECRET_KEY,
                algorithms=["HS256"]
            )

            print("Decoded Payload:", data)
            print("========== SUCCESS ==========\n")

        except jwt.ExpiredSignatureError:
            print("JWT ERROR: Token has expired")
            return jsonify({
                "success": False,
                "message": "Token has expired"
            }), 401

        except jwt.InvalidSignatureError:
            print("JWT ERROR: Signature verification failed")
            return jsonify({
                "success": False,
                "message": "Signature verification failed"
            }), 401

        except jwt.InvalidTokenError as e:
            print("JWT ERROR:", str(e))
            return jsonify({
                "success": False,
                "message": str(e)
            }), 401

        except Exception as e:
            print("UNEXPECTED ERROR:", str(e))
            return jsonify({
                "success": False,
                "message": str(e)
            }), 401

        return f(data, *args, **kwargs)

    return decorated