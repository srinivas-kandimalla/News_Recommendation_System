import math
import logging
from datetime import datetime, timezone

logger = logging.getLogger(__name__)


def build_temporal_context(server_time=None):
    """
    Derive cyclical temporal context vector using sine/cosine encoding:
      T = [sin(2*pi*hour/24), cos(2*pi*hour/24), sin(2*pi*day/7), cos(2*pi*day/7)]
    """
    if server_time is None:
        server_time = datetime.now(timezone.utc)
    elif server_time.tzinfo is None:
        server_time = server_time.replace(tzinfo=timezone.utc)

    hour = server_time.hour
    day = server_time.weekday()  # Monday=0, Sunday=6

    sin_hour = math.sin(2.0 * math.pi * hour / 24.0)
    cos_hour = math.cos(2.0 * math.pi * hour / 24.0)
    sin_day = math.sin(2.0 * math.pi * day / 7.0)
    cos_day = math.cos(2.0 * math.pi * day / 7.0)

    return {
        "hour_of_day": hour,
        "day_of_week": day,
        "cyclical_vector": [
            round(sin_hour, 4),
            round(cos_hour, 4),
            round(sin_day, 4),
            round(cos_day, 4)
        ]
    }


def build_recent_interest_context(short_term_categories):
    """
    Compute distribution ratio of categories in recent short-term history.
    Example: {"Technology": 0.6, "Sports": 0.4}
    """
    if not short_term_categories:
        return {}

    total = len(short_term_categories)
    dist = {}
    for cat in short_term_categories:
        dist[cat] = dist.get(cat, 0) + 1

    return {cat: round(count / total, 4) for cat, count in dist.items()}


def calculate_temporal_category_affinity(category, hour_of_day):
    """
    Deterministically score temporal category affinity based on real-world reading habits:
      - Business/Politics: Higher affinity during work hours (08:00 - 18:00)
      - Technology/Sports/Entertainment: Higher affinity in morning/evening/night (18:00 - 08:00)
    """
    if not category:
        return 1.0

    cat_lower = category.lower()
    is_work_hours = (8 <= hour_of_day <= 18)

    if cat_lower in ["business", "politics", "world"]:
        return 1.08 if is_work_hours else 0.96
    elif cat_lower in ["technology", "entertainment", "sports", "science", "health"]:
        return 0.98 if is_work_hours else 1.06

    return 1.0


def calculate_context_relevance(candidate_news, short_term_categories, server_time=None):
    """
    Fuse temporal context + recent category distribution + candidate metadata into
    a deterministic Context Relevance Multiplier: C_relevance in [0.80, 1.25].
    """
    temporal_ctx = build_temporal_context(server_time)
    hour = temporal_ctx["hour_of_day"]
    cand_category = candidate_news.get("category", "") if isinstance(candidate_news, dict) else getattr(candidate_news, "category", "")

    # 1. Recent Interest Density Multiplier (up to +0.20)
    category_dist = build_recent_interest_context(short_term_categories)
    recent_cat_ratio = category_dist.get(cand_category, 0.0)
    m_category = 1.0 + (0.20 * recent_cat_ratio)

    # 2. Temporal Affinity Multiplier
    m_temporal = calculate_temporal_category_affinity(cand_category, hour)

    # 3. Overall Context Relevance Factor
    raw_relevance = m_category * m_temporal
    c_relevance = max(0.80, min(1.25, raw_relevance))

    debug_info = {
        "hour_of_day": hour,
        "candidate_category": cand_category,
        "recent_category_ratio": recent_cat_ratio,
        "temporal_affinity": round(m_temporal, 4),
        "category_multiplier": round(m_category, 4),
        "context_relevance_factor": round(c_relevance, 4)
    }

    return c_relevance, debug_info
