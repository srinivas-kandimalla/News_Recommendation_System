import math
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

    news_data["embedding"] = generate_embedding(text)
    news_data["created_at"] = datetime.utcnow()

    result = news_collection.insert_one(news_data)

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
        news_collection.find()
        .sort("_id", DESCENDING)
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
            "created_at": item.get("created_at")
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

    news_data.pop("_id", None)

    title = news_data.get("title", news["title"])
    content = news_data.get("content", news["content"])

    text = title + " " + content

    news_data["embedding"] = generate_embedding(text)
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

        news = (
            news_collection.find({
                "$or": [
                    {
                        "title": {
                            "$regex": query,
                            "$options": "i"
                        }
                    },
                    {
                        "author": {
                            "$regex": query,
                            "$options": "i"
                        }
                    },
                    {
                        "category": {
                            "$regex": query,
                            "$options": "i"
                        }
                    }
                ]
            })
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