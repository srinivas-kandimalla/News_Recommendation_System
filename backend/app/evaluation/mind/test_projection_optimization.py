"""
NEXORA PHASE 3.2 — PROJECTION & CURSOR DECODING OPTIMIZATION BENCHMARK
=======================================================================
Measures the latency reduction of projecting minimal metadata fields during
candidate retrieval, deferring full article text (`content`, `title`, `image_url`)
fetches until AFTER Top-K candidate ranking.
"""
import os
import sys
import time
import numpy as np

BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from app import create_app
from app.models.news_model import news_collection
from app.models.reading_history_model import reading_history_collection

app = create_app()

with app.app_context():
    # 1. Full projection (with full content text)
    t0 = time.perf_counter()
    full_docs = list(news_collection.find(
        {},
        projection={
            "_id": 1, "title": 1, "content": 1, "category": 1,
            "author": 1, "source": 1, "image_url": 1, "published": 1,
            "created_at": 1, "embedding": 1
        }
    ))
    t_full_ms = (time.perf_counter() - t0) * 1000.0

    # 2. Minimal scoring projection (excluding content, title, image_url)
    t0 = time.perf_counter()
    min_docs = list(news_collection.find(
        {},
        projection={
            "_id": 1, "category": 1, "author": 1, "source": 1,
            "published": 1, "created_at": 1, "embedding": 1
        }
    ))
    t_min_ms = (time.perf_counter() - t0) * 1000.0

    # 3. Deferred Top-20 full metadata fetch
    top_20_ids = [doc["_id"] for doc in min_docs[:20]]
    t0 = time.perf_counter()
    top_docs = list(news_collection.find(
        {"_id": {"$in": top_20_ids}},
        projection={
            "_id": 1, "title": 1, "content": 1, "category": 1,
            "author": 1, "source": 1, "image_url": 1, "published": 1,
            "created_at": 1, "embedding": 1
        }
    ))
    t_top20_ms = (time.perf_counter() - t0) * 1000.0

    print(f"Total News Documents Returned: {len(full_docs)}")
    print(f"Full Projection Query Latency (with content)    : {t_full_ms:.2f} ms")
    print(f"Minimal Projection Query Latency (sans content) : {t_min_ms:.2f} ms")
    print(f"Deferred Top-20 Metadata Query Latency           : {t_top20_ms:.2f} ms")
    print(f"Total Optimized Retrieval Latency (Min + Top20)  : {t_min_ms + t_top20_ms:.2f} ms")
    print(f"Net Candidate Retrieval Speedup                  : {t_full_ms / max(0.1, t_min_ms + t_top20_ms):.2f}x faster")
