import numpy as np
import logging
from bson import ObjectId
from bson.errors import InvalidId

from app.config.config import Config
from app.models.news_model import news_collection
from app.services.reading_history_service import get_user_read_history_ordered

logger = logging.getLogger(__name__)


def build_long_term_profile(user_id):
    """
    Build long-term user embedding vector from broader reading history (up to LONG_TERM_HISTORY_LIMIT articles).
    """
    limit = getattr(Config, "LONG_TERM_HISTORY_LIMIT", 50)
    history_ids = get_user_read_history_ordered(user_id, limit=limit)

    if not history_ids:
        return None, []

    articles = news_collection.find(
        {"_id": {"$in": history_ids}},
        projection={"embedding": 1, "title": 1}
    )

    embeddings = []
    valid_ids = []

    for news in articles:
        if news and "embedding" in news and news["embedding"]:
            embeddings.append(news["embedding"])
            valid_ids.append(news["_id"])
        else:
            logger.warning(f"Article missing embedding skipped during long-term profile build: {news.get('_id')}")

    if not embeddings:
        return None, []

    long_term_vector = np.mean(embeddings, axis=0)
    return long_term_vector, valid_ids


def build_short_term_profile(user_id):
    """
    Build short-term user embedding vector from latest read articles (up to SHORT_TERM_HISTORY_LIMIT articles).
    """
    limit = getattr(Config, "SHORT_TERM_HISTORY_LIMIT", 5)
    recent_ids = get_user_read_history_ordered(user_id, limit=limit)

    if not recent_ids:
        return None, []

    articles = list(news_collection.find(
        {"_id": {"$in": recent_ids}},
        projection={"embedding": 1, "title": 1}
    ))

    # Maintain recent timestamp ordering
    id_map = {a["_id"]: a for a in articles if "embedding" in a and a["embedding"]}

    embeddings = []
    valid_ids = []

    for item_id in recent_ids:
        news = id_map.get(item_id)
        if news:
            embeddings.append(news["embedding"])
            valid_ids.append(news["_id"])
        else:
            logger.warning(f"Article missing embedding skipped during short-term profile build: {item_id}")

    if not embeddings:
        return None, []

    short_term_vector = np.mean(embeddings, axis=0)
    return short_term_vector, valid_ids


def combine_user_profiles(long_term_vector, short_term_vector):
    """
    Combine long-term and short-term profiles using configurable weights:
    combined = LONG_TERM_WEIGHT * long_term + SHORT_TERM_WEIGHT * short_term
    Normalizes vector for cosine similarity calculation.
    """
    long_weight = getattr(Config, "LONG_TERM_WEIGHT", 0.4)
    short_weight = getattr(Config, "SHORT_TERM_WEIGHT", 0.6)

    if long_term_vector is None and short_term_vector is None:
        return None

    if long_term_vector is None:
        norm = np.linalg.norm(short_term_vector)
        return short_term_vector / norm if norm > 0 else short_term_vector

    if short_term_vector is None:
        norm = np.linalg.norm(long_term_vector)
        return long_term_vector / norm if norm > 0 else long_term_vector

def fetch_user_history_embeddings(user_id):
    """
    Fetch both long-term and short-term historical article embeddings, IDs, and categories once per recommendation request.
    Efficiency: Avoids repeated DB queries for candidate processing.
    """
    long_term_limit = getattr(Config, "LONG_TERM_HISTORY_LIMIT", 50)
    short_term_limit = getattr(Config, "SHORT_TERM_HISTORY_LIMIT", 5)

    all_history_ids = get_user_read_history_ordered(user_id, limit=long_term_limit)

    if not all_history_ids:
        return [], [], [], [], []

    articles = list(news_collection.find(
        {"_id": {"$in": all_history_ids}},
        projection={"embedding": 1, "title": 1, "category": 1}
    ))

    id_map = {a["_id"]: a for a in articles if "embedding" in a and a["embedding"]}

    long_embeddings = []
    long_ids = []
    for item_id in all_history_ids:
        news = id_map.get(item_id)
        if news:
            long_embeddings.append(news["embedding"])
            long_ids.append(news["_id"])

    short_history_ids = all_history_ids[:short_term_limit]
    short_embeddings = []
    short_ids = []
    short_categories = []
    for item_id in short_history_ids:
        news = id_map.get(item_id)
        if news:
            short_embeddings.append(news["embedding"])
            short_ids.append(news["_id"])
            if news.get("category"):
                short_categories.append(news.get("category"))

    return long_embeddings, long_ids, short_embeddings, short_ids, short_categories


