from datetime import datetime
from bson import ObjectId
from bson.errors import InvalidId

from app.models.bookmark_model import bookmark_collection
from app.models.news_model import news_collection


# ======================================================
# Add Bookmark
# ======================================================

def add_bookmark(user_id, news_id):

    try:
        user_object_id = ObjectId(user_id)
        news_object_id = ObjectId(news_id)

    except InvalidId:
        return {
            "success": False,
            "message": "Invalid ID",
            "status_code": 400
        }

    news = news_collection.find_one({"_id": news_object_id})

    if not news:
        return {
            "success": False,
            "message": "News not found",
            "status_code": 404
        }

    existing = bookmark_collection.find_one({
        "user_id": user_object_id,
        "news_id": news_object_id
    })

    if existing:
        return {
            "success": True,
            "message": "Already bookmarked",
            "status_code": 200
        }

    bookmark_collection.insert_one({
        "user_id": user_object_id,
        "news_id": news_object_id,
        "bookmarked_at": datetime.utcnow()
    })

    return {
        "success": True,
        "message": "Bookmark added successfully",
        "status_code": 201
    }


# ======================================================
# Get Bookmarks
# ======================================================

def get_bookmarks(user_id):

    try:
        user_object_id = ObjectId(user_id)

    except InvalidId:
        return {
            "success": False,
            "message": "Invalid User ID",
            "status_code": 400
        }

    bookmarks = list(bookmark_collection.find({"user_id": user_object_id}))
    news_ids = [b["news_id"] for b in bookmarks if "news_id" in b]

    results = []

    if news_ids:
        fetched_news = news_collection.find(
            {"_id": {"$in": news_ids}},
            projection={"embedding": 0}
        )
        news_map = {n["_id"]: n for n in fetched_news}

        # Preserve exact bookmark order
        for bookmark in bookmarks:
            news = news_map.get(bookmark["news_id"])
            if news:
                results.append({
                    "_id": str(news["_id"]),
                    "title": news.get("title", ""),
                    "content": news.get("content", ""),
                    "category": news.get("category", ""),
                    "author": news.get("author", ""),
                    "source": news.get("source", ""),
                    "image_url": news.get("image_url", ""),
                    "created_at": news.get("created_at")
                })

    return {
        "success": True,
        "count": len(results),
        "bookmarks": results,
        "status_code": 200
    }


# ======================================================
# Remove Bookmark
# ======================================================

def remove_bookmark(user_id, news_id):

    try:
        user_object_id = ObjectId(user_id)
        news_object_id = ObjectId(news_id)

    except InvalidId:
        return {
            "success": False,
            "message": "Invalid ID",
            "status_code": 400
        }

    result = bookmark_collection.delete_one({
        "user_id": user_object_id,
        "news_id": news_object_id
    })

    if result.deleted_count == 0:
        return {
            "success": False,
            "message": "Bookmark not found",
            "status_code": 404
        }

    return {
        "success": True,
        "message": "Bookmark removed successfully",
        "status_code": 200
    }