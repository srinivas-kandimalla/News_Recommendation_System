from datetime import datetime, timezone

from app.models.reading_history_model import reading_history_collection
from app.models.bookmark_model import bookmark_collection
from app.models.reaction_model import reaction_collection


# =====================================================
# Recency Score
# =====================================================

def calculate_recency_score(created_at):
    """
    Give higher score to newer articles.
    """

    if not created_at:
        return 0.0

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


# =====================================================
# Popularity Score
# =====================================================

def calculate_popularity_score(news_id):
    """
    Popularity based on reads, likes and bookmarks.
    """

    reads = reading_history_collection.count_documents({
        "news_id": news_id
    })

    likes = reaction_collection.count_documents({
        "news_id": news_id,
        "reaction": "like"
    })

    bookmarks = bookmark_collection.count_documents({
        "news_id": news_id
    })

    score = (
        reads * 1 +
        likes * 2 +
        bookmarks * 2
    )

    return min(score / 20, 1.0)


# =====================================================
# Interest Score
# =====================================================

def calculate_interest_score(
    news,
    favorite_category,
    favorite_author
):

    score = 0.0

    if (
        favorite_category and
        news.get("category") == favorite_category
    ):
        score += 0.6

    if (
        favorite_author and
        news.get("author") == favorite_author
    ):
        score += 0.4

    return score