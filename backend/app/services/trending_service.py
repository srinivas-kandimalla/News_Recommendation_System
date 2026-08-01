from datetime import datetime, timezone

from app.models.news_model import news_collection
from app.models.reading_history_model import reading_history_collection
from app.models.bookmark_model import bookmark_collection
from app.models.reaction_model import reaction_collection


def calculate_freshness_score(created_at):
    if not created_at:
        return 0.1

    if isinstance(created_at, str):
        try:
            created_at = datetime.fromisoformat(created_at.replace("Z", "+00:00"))
        except (ValueError, TypeError):
            return 0.1

    if not isinstance(created_at, datetime):
        return 0.1

    if created_at.tzinfo is None:
        created_at = created_at.replace(tzinfo=timezone.utc)

    now = datetime.now(timezone.utc)
    days = (now - created_at).days

    if days <= 1:
        return 1.0
    if days <= 3:
        return 0.8
    if days <= 7:
        return 0.6
    if days <= 30:
        return 0.3

    return 0.1


def get_trending_news(top_k=5):

    trending = []

    for news in news_collection.find():

        news_id = news["_id"]

        reads = reading_history_collection.count_documents({
            "news_id": news_id
        })

        bookmarks = bookmark_collection.count_documents({
            "news_id": news_id
        })

        likes = reaction_collection.count_documents({
            "news_id": news_id,
            "reaction": "like"
        })

        dislikes = reaction_collection.count_documents({
            "news_id": news_id,
            "reaction": "dislike"
        })

        freshness_score = calculate_freshness_score(news.get("created_at"))

        score = (
            reads * 0.4 +
            likes * 0.3 +
            bookmarks * 0.2 +
            freshness_score * 0.1
        )

        trending.append({
            "_id": str(news_id),
            "title": news.get("title", ""),
            "category": news.get("category", ""),
            "author": news.get("author", ""),
            "image_url": news.get("image_url", ""),
            "reads": reads,
            "bookmarks": bookmarks,
            "likes": likes,
            "dislikes": dislikes,
            "trending_score": round(score, 4)
        })

    trending.sort(
        key=lambda x: x["trending_score"],
        reverse=True
    )

    return {
        "success": True,
        "trending_news": trending[:top_k],
        "status_code": 200
    }