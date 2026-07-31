from bson import ObjectId
from bson.errors import InvalidId

from app.models.reading_history_model import reading_history_collection
from app.models.bookmark_model import bookmark_collection
from app.models.reaction_model import reaction_collection
from app.models.news_model import news_collection


def get_user_analytics(user_id):

    try:
        user_object_id = ObjectId(user_id)

    except InvalidId:
        return {
            "success": False,
            "message": "Invalid User ID",
            "status_code": 400
        }

    # ===============================
    # Total Reads
    # ===============================

    total_reads = reading_history_collection.count_documents({
        "user_id": user_object_id
    })

    # ===============================
    # Total Bookmarks
    # ===============================

    total_bookmarks = bookmark_collection.count_documents({
        "user_id": user_object_id
    })

    # ===============================
    # Likes
    # ===============================

    total_likes = reaction_collection.count_documents({
        "user_id": user_object_id,
        "reaction": "like"
    })

    # ===============================
    # Dislikes
    # ===============================

    total_dislikes = reaction_collection.count_documents({
        "user_id": user_object_id,
        "reaction": "dislike"
    })

    # ===============================
    # Favorite Category
    # ===============================

    category_count = {}

    # ===============================
    # Favorite Author
    # ===============================

    author_count = {}

    history = reading_history_collection.find({
        "user_id": user_object_id
    })

    for item in history:

        news = news_collection.find_one({
            "_id": item["news_id"]
        })

        if news:

            category = news.get("category", "Unknown")
            author = news.get("author", "Unknown")

            category_count[category] = category_count.get(category, 0) + 1
            author_count[author] = author_count.get(author, 0) + 1

    favorite_category = (
        max(category_count, key=category_count.get)
        if category_count else "N/A"
    )

    favorite_author = (
        max(author_count, key=author_count.get)
        if author_count else "N/A"
    )

    return {
        "success": True,
        "analytics": {
            "total_articles_read": total_reads,
            "total_bookmarks": total_bookmarks,
            "total_likes": total_likes,
            "total_dislikes": total_dislikes,
            "favorite_category": favorite_category,
            "favorite_author": favorite_author
        },
        "status_code": 200
    }