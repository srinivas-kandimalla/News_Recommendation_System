"""
BENCHMARK: HOT-PATH INVARIANT PRECOMPUTATION TEST
=================================================
Measures candidate loop execution time when temporal context,
category distribution, and server timestamp are pre-computed ONCE per request.
"""
import os
import sys
import time
import math
from datetime import datetime, timezone
import numpy as np

BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

N_cand = 457
short_term_categories = ["Technology", "Technology", "Sports", "Business"]
favorite_category = "Technology"
favorite_author = "John Doe"

# Sample news candidates
sample_news = [
    {
        "_id": f"news_{i}",
        "category": "Technology" if i % 2 == 0 else "Sports",
        "author": "John Doe" if i % 3 == 0 else "Jane Smith",
        "published": "2026-08-29T10:00:00Z",
        "created_at": "2026-08-29T10:00:00Z"
    }
    for i in range(N_cand)
]

from app.ai.context_service import calculate_context_relevance, build_temporal_context, build_recent_interest_context
from app.ai.scoring_service import calculate_recency_score, calculate_interest_score

# Strategy A: Baseline (recomputing build_temporal_context, build_recent_interest_context, datetime.now for every candidate)
t0 = time.perf_counter()
for news in sample_news:
    c_rel, _ = calculate_context_relevance(news, short_term_categories)
    rec_val = calculate_recency_score(news.get("published"), news.get("created_at"))
    int_val = calculate_interest_score(news, favorite_category, favorite_author)
t_base = (time.perf_counter() - t0) * 1000.0

# Strategy B: Optimized (pre-computing temporal_ctx, category_dist, and now ONCE)
t0 = time.perf_counter()
now_utc = datetime.now(timezone.utc)
temporal_ctx = build_temporal_context(now_utc)
category_dist = build_recent_interest_context(short_term_categories)
hour = temporal_ctx["hour_of_day"]

for news in sample_news:
    cand_category = news.get("category", "")
    recent_cat_ratio = category_dist.get(cand_category, 0.0)
    m_category = 1.0 + (0.20 * recent_cat_ratio)
    
    # Fast temporal affinity
    cat_lower = cand_category.lower()
    is_work_hours = (8 <= hour <= 18)
    if cat_lower in ["business", "politics", "world"]:
        m_temporal = 1.08 if is_work_hours else 0.96
    elif cat_lower in ["technology", "entertainment", "sports", "science", "health"]:
        m_temporal = 0.98 if is_work_hours else 1.06
    else:
        m_temporal = 1.0
        
    c_rel = max(0.80, min(1.25, m_category * m_temporal))
    rec_val = calculate_recency_score(news.get("published"), news.get("created_at"))
    int_val = calculate_interest_score(news, favorite_category, favorite_author)

t_opt = (time.perf_counter() - t0) * 1000.0

print(f"Strategy A (Baseline loop recomputations) : {t_base:.2f} ms")
print(f"Strategy B (Pre-computed context & timestamp): {t_opt:.2f} ms")
print(f"Speedup Factor                             : {t_base / t_opt:.1f}x faster (Saved {t_base - t_opt:.2f} ms)")
