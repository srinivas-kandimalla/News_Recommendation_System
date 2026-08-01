from datetime import datetime
from bson import ObjectId
from bson.errors import InvalidId

from app.database.db import (
    reading_history_collection,
    users_collection,
    news_collection
)


def save_reading_history(user_id, news_id):
    try:
        user_object_id = ObjectId(user_id)
        news_object_id = ObjectId(news_id)
    except InvalidId:
        return {
            "success": False,
            "message": "Invalid User ID or News ID",
            "status_code": 400
        }

    # Check if user exists
    user = users_collection.find_one({
        "_id": user_object_id
    })

    if not user:
        return {
            "success": False,
            "message": "User not found",
            "status_code": 404
        }

    # Check if news exists
    news = news_collection.find_one({
        "_id": news_object_id
    })

    if not news:
        return {
            "success": False,
            "message": "News not found",
            "status_code": 404
        }

    # Prevent duplicate reading history
    existing = reading_history_collection.find_one({
        "user_id": user_object_id,
        "news_id": news_object_id
    })

    if existing:
        return {
            "success": True,
            "message": "Reading history already exists",
            "status_code": 200
        }

    history = {
        "user_id": user_object_id,
        "news_id": news_object_id,
        "read_at": datetime.utcnow()
    }

    reading_history_collection.insert_one(history)

    return {
        "success": True,
        "message": "Reading history saved",
        "status_code": 201
    }


def get_user_read_news(user_id):
    """
    Returns a list of news IDs that the user has already read.
    """
    try:
        user_object_id = ObjectId(user_id)
    except (InvalidId, Exception):
        return []

    history = reading_history_collection.find({
        "user_id": user_object_id
    })

    news_ids = []

    for item in history:
        news_ids.append(item["news_id"])

    return news_ids