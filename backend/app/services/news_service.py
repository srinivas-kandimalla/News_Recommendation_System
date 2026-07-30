from datetime import datetime
from bson import ObjectId
from bson.errors import InvalidId
from app.models.news_model import news_collection


def create_news(news_data):

    # Validation
    if not news_data.get("title"):
        return {
            "success": False,
            "message": "Title is required"
        }

    if not news_data.get("content"):
        return {
            "success": False,
            "message": "Content is required"
        }

    if not news_data.get("category"):
        return {
            "success": False,
            "message": "Category is required"
        }

    # Add timestamp
    news_data["created_at"] = datetime.utcnow()

    result = news_collection.insert_one(news_data)

    return {
        "success": True,
        "message": "News created successfully",
        "news_id": str(result.inserted_id)
    }


def get_all_news():

    news_list = []

    news = news_collection.find()

    for item in news:
        item["_id"] = str(item["_id"])
        news_list.append(item)

    return {
        "success": True,
        "news": news_list
    }


def get_news_by_id(news_id):

    try:
        object_id = ObjectId(news_id)

    except InvalidId:
        return {
            "success": False,
            "message": "Invalid News ID",
            "status_code": 400
        }

    news = news_collection.find_one({"_id": object_id})

    if not news:
        return {
            "success": False,
            "message": "News not found",
            "status_code": 404
        }

    news["_id"] = str(news["_id"])

    return {
        "success": True,
        "news": news,
        "status_code": 200
    }


def update_news(news_id, news_data):

    try:
        object_id = ObjectId(news_id)

    except InvalidId:
        return {
            "success": False,
            "message": "Invalid News ID",
            "status_code": 400
        }

    news = news_collection.find_one({"_id": object_id})

    if not news:
        return {
            "success": False,
            "message": "News not found",
            "status_code": 404
        }

    # Prevent updating MongoDB _id
    news_data.pop("_id", None)

    # Add updated timestamp
    news_data["updated_at"] = datetime.utcnow()

    result = news_collection.update_one(
        {"_id": object_id},
        {"$set": news_data}
    )

    if result.modified_count == 0:
        return {
            "success": False,
            "message": "No changes made",
            "status_code": 200
        }

    updated_news = news_collection.find_one({"_id": object_id})
    updated_news["_id"] = str(updated_news["_id"])

    return {
        "success": True,
        "message": "News updated successfully",
        "news": updated_news,
        "status_code": 200
    }


def delete_news(news_id):

    try:
        object_id = ObjectId(news_id)

    except InvalidId:
        return {
            "success": False,
            "message": "Invalid News ID",
            "status_code": 400
        }

    news = news_collection.find_one({"_id": object_id})

    if not news:
        return {
            "success": False,
            "message": "News not found",
            "status_code": 404
        }

    news_collection.delete_one({"_id": object_id})

    return {
        "success": True,
        "message": "News deleted successfully",
        "status_code": 200
    }