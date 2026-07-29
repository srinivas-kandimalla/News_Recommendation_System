import jwt
from datetime import datetime, timedelta
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