import math
import re
from datetime import datetime

from bson import ObjectId
from bson.errors import InvalidId
from pymongo import DESCENDING

from app.models.news_model import news_collection
from app.ai.embedding_service import generate_embedding


# ======================================================
# Create News
# ======================================================

def create_news(news_data):

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

    text = news_data["title"] + " " + news_data["content"]

    # Explicit whitelist to prevent mass assignment vulnerability
    sanitized_news = {
        "title": news_data["title"],
        "content": news_data["content"],
        "category": news_data["category"],
        "author": news_data.get("author", ""),
        "source": news_data.get("source", ""),
        "image_url": news_data.get("image_url", ""),
        "url": news_data.get("url") or f"custom://news/{ObjectId()}",
        "embedding": generate_embedding(text),
        "created_at": datetime.utcnow()
    }

    result = news_collection.insert_one(sanitized_news)

    return {
        "success": True,
        "message": "News created successfully",
        "news_id": str(result.inserted_id)
    }


# ======================================================
# Get All News (Pagination)
# ======================================================

def get_all_news(page=1, limit=5):

    skip = (page - 1) * limit

    total_news = news_collection.count_documents({})

    news = (
        news_collection.find({}, projection={"embedding": 0})
        .sort([("published", DESCENDING), ("created_at", DESCENDING), ("_id", DESCENDING)])
        .skip(skip)
        .limit(limit)
    )

    news_list = []

    for item in news:

        news_list.append({
            "_id": str(item.get("_id")),
            "title": item.get("title", ""),
            "content": item.get("content", ""),
            "category": item.get("category", ""),
            "author": item.get("author", ""),
            "source": item.get("source", ""),
            "image_url": item.get("image_url", ""),
            "created_at": item.get("published") or item.get("created_at")
        })

    return {
        "success": True,
        "page": page,
        "limit": limit,
        "total_news": total_news,
        "total_pages": math.ceil(total_news / limit),
        "news": news_list
    }


# ======================================================
# Get Single News
# ======================================================

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
    news.pop("embedding", None)

    return {
        "success": True,
        "news": news,
        "status_code": 200
    }


# ======================================================
# Update News
# ======================================================

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

    # Whitelist allowable update fields
    allowed_fields = ["title", "content", "category", "author", "source", "image_url", "url"]
    update_payload = {}

    for field in allowed_fields:
        if field in news_data:
            update_payload[field] = news_data[field]

    title = update_payload.get("title", news["title"])
    content = update_payload.get("content", news["content"])

    text = title + " " + content

    update_payload["embedding"] = generate_embedding(text)
    update_payload["updated_at"] = datetime.utcnow()

    result = news_collection.update_one(
        {"_id": object_id},
        {"$set": update_payload}
    )

    if result.modified_count == 0:
        return {
            "success": False,
            "message": "No changes made",
            "status_code": 200
        }

    updated_news = news_collection.find_one({"_id": object_id})
    updated_news["_id"] = str(updated_news["_id"])
    updated_news.pop("embedding", None)

    return {
        "success": True,
        "message": "News updated successfully",
        "news": updated_news,
        "status_code": 200
    }


# ======================================================
# Delete News
# ======================================================

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


# ======================================================
# Search News
# ======================================================

def search_news(query):

    try:
        # Sanitize query against ReDoS / unescaped regex special characters
        escaped_query = re.escape(query)

        news = (
            news_collection.find({
                "$or": [
                    {
                        "title": {
                            "$regex": escaped_query,
                            "$options": "i"
                        }
                    },
                    {
                        "author": {
                            "$regex": escaped_query,
                            "$options": "i"
                        }
                    },
                    {
                        "category": {
                            "$regex": escaped_query,
                            "$options": "i"
                        }
                    }
                ]
            }, projection={"embedding": 0})
            .sort("_id", DESCENDING)
        )

        results = []

        for item in news:

            results.append({
                "_id": str(item.get("_id")),
                "title": item.get("title", ""),
                "content": item.get("content", ""),
                "category": item.get("category", ""),
                "author": item.get("author", ""),
                "source": item.get("source", ""),
                "image_url": item.get("image_url", ""),
                "created_at": item.get("created_at")
            })

        return {
            "success": True,
            "count": len(results),
            "news": results,
            "status_code": 200
        }

    except Exception as e:

        return {
            "success": False,
            "message": str(e),
            "status_code": 500
        }