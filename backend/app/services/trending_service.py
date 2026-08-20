from datetime import datetime, timezone

from app.models.news_model import news_collection
from app.models.reading_history_model import reading_history_collection
from app.models.bookmark_model import bookmark_collection
from app.models.reaction_model import reaction_collection
from app.ai.scoring_service import calculate_recency_score


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

    # Pre-aggregate metric counts across all news documents
    read_counts = {
        item["_id"]: item["count"]
        for item in reading_history_collection.aggregate([
            {"$group": {"_id": "$news_id", "count": {"$sum": 1}}}
        ])
    }

    bookmark_counts = {
        item["_id"]: item["count"]
        for item in bookmark_collection.aggregate([
            {"$group": {"_id": "$news_id", "count": {"$sum": 1}}}
        ])
    }

    like_counts = {
        item["_id"]: item["count"]
        for item in reaction_collection.aggregate([
            {"$match": {"reaction": "like"}},
            {"$group": {"_id": "$news_id", "count": {"$sum": 1}}}
        ])
    }

    dislike_counts = {
        item["_id"]: item["count"]
        for item in reaction_collection.aggregate([
            {"$match": {"reaction": "dislike"}},
            {"$group": {"_id": "$news_id", "count": {"$sum": 1}}}
        ])
    }

    trending = []

    for news in news_collection.find({}, projection={"embedding": 0}):

        news_id = news["_id"]

        reads = read_counts.get(news_id, 0)
        bookmarks = bookmark_counts.get(news_id, 0)
        likes = like_counts.get(news_id, 0)
        dislikes = dislike_counts.get(news_id, 0)

        recency_val = calculate_recency_score(news.get("published"), news.get("created_at"))
        raw_pop_score = (reads * 1 + likes * 2 + bookmarks * 2)
        popularity_val = min(raw_pop_score / 20.0, 1.0)

        # Balanced trending score combining normalized engagement and recency/freshness
        score = popularity_val * 0.50 + recency_val * 0.50

        created_at_val = news.get("created_at")
        if isinstance(created_at_val, datetime):
            created_at_val = created_at_val.isoformat()

        trending.append({
            "_id": str(news_id),
            "title": news.get("title", ""),
            "content": news.get("content", ""),
            "category": news.get("category", ""),
            "author": news.get("author", ""),
            "source": news.get("source", ""),
            "image_url": news.get("image_url", ""),
            "published": news.get("published"),
            "created_at": created_at_val,
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