import math
from datetime import datetime, timezone

from app.models.reading_history_model import reading_history_collection
from app.models.bookmark_model import bookmark_collection
from app.models.reaction_model import reaction_collection


# =====================================================
# Helper: Parse Date
# =====================================================

from email.utils import parsedate_to_datetime

def parse_date(date_val):
    if not date_val:
        return None
    if isinstance(date_val, datetime):
        if date_val.tzinfo is None:
            return date_val.replace(tzinfo=timezone.utc)
        return date_val
    if isinstance(date_val, str):
        try:
            dt = datetime.fromisoformat(date_val.replace("Z", "+00:00"))
            if dt.tzinfo is None:
                return dt.replace(tzinfo=timezone.utc)
            return dt
        except Exception:
            pass
        try:
            dt = parsedate_to_datetime(date_val)
            if dt.tzinfo is None:
                return dt.replace(tzinfo=timezone.utc)
            return dt
        except Exception:
            return None
    return None


# =====================================================
# Recency Score
# =====================================================

def calculate_recency_score(published=None, created_at=None):
    """
    Continuous exponential decay recency score: score = exp(-lambda * days)
    Lambda = 0.1 gives ~0.50 score at 7 days and 0.05 score at 30 days.
    Safely parses ISO strings, datetime objects, and falls back from published to created_at.
    """
    target_date = parse_date(published) or parse_date(created_at)

    if not target_date:
        return 0.0

    now = datetime.now(timezone.utc)
    days = max(0.0, (now - target_date).total_seconds() / 86400.0)

    # Exponential decay lambda = 0.1
    score = math.exp(-0.1 * days)
    return round(score, 4)


# =====================================================
# Popularity Score
# =====================================================

def calculate_popularity_score(news_id, reads=None, likes=None, bookmarks=None):
    """
    Popularity based on reads, likes and bookmarks.
    """

    if reads is None:
        reads = reading_history_collection.count_documents({
            "news_id": news_id
        })

    if likes is None:
        likes = reaction_collection.count_documents({
            "news_id": news_id,
            "reaction": "like"
        })

    if bookmarks is None:
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