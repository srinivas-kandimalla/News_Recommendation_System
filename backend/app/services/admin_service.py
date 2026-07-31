from app.models.user_model import users_collection
from app.models.news_model import news_collection
from app.models.reading_history_model import reading_history_collection
from app.models.bookmark_model import bookmark_collection
from app.models.reaction_model import reaction_collection


# ======================================================
# Admin Dashboard Service
# ======================================================

def get_admin_dashboard():

    total_users = users_collection.count_documents({})
    total_news = news_collection.count_documents({})
    total_reads = reading_history_collection.count_documents({})
    total_bookmarks = bookmark_collection.count_documents({})

    total_likes = reaction_collection.count_documents({
        "reaction": "like"
    })

    total_dislikes = reaction_collection.count_documents({
        "reaction": "dislike"
    })

    # Count news by category
    category_stats = {}

    for news in news_collection.find():

        category = news.get("category", "Unknown")

        category_stats[category] = category_stats.get(category, 0) + 1

    most_popular_category = (
        max(category_stats, key=category_stats.get)
        if category_stats
        else "N/A"
    )

    return {
        "success": True,
        "dashboard": {
            "total_users": total_users,
            "total_news": total_news,
            "total_reads": total_reads,
            "total_bookmarks": total_bookmarks,
            "total_likes": total_likes,
            "total_dislikes": total_dislikes,
            "most_popular_category": most_popular_category
        },
        "status_code": 200
    }