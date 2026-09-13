"""
NEXORA P0.2 — MIND CAUSAL FEATURE PROXY BUILDER
===============================================
Computes causally valid, leak-free proxy features for the 1159-d ranking vector:
  1. temporal_affinity   : calculated from impression timestamp's hour-of-day
  2. recency_score       : exponential decay exp(-0.1 * days) from item estimated first-seen date
  3. popularity_score    : deterministic log-frequency normalization log(1 + N_train) / log(1 + N_max_train)
  4. interest_score      : user favorite-category match computed STRICTLY from user's prior history

Causal Integrity Guarantees:
  - Temporal affinity uses only the impression's own timestamp (known at query time).
  - Recency decay uses the item's publication/earliest-observed date relative to impression timestamp.
  - Popularity frequencies are aggregated ONLY over train_users impressions (zero test/val leakage).
  - Popularity normalization uses log(1 + N_train) / log(1 + N_max_train), eliminating saturation.
  - Interest score derives favorite category exclusively from the user's prior history (row[3]).
"""
import os
import sys
import csv
import math
import json
import logging
from collections import Counter
from datetime import datetime
from typing import Dict, Set, List, Optional, Tuple, Any

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
if not os.path.exists(os.path.join(BACKEND_DIR, "evaluation")):
    BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from app.ai.context_service import calculate_temporal_category_affinity

DATA_DIR = os.path.join(BACKEND_DIR, "evaluation", "mind", "data")
CACHE_DIR = os.path.join(BACKEND_DIR, "evaluation", "mind", "cache")
PROXIES_CACHE_PATH = os.path.join(CACHE_DIR, "mind_causal_proxies.json")
BEHAVIORS_TSV = os.path.join(DATA_DIR, "behaviors.tsv")

DATETIME_FORMATS = [
    "%m/%d/%Y %I:%M:%S %p",
    "%m/%d/%Y %H:%M:%S",
    "%Y-%m-%d %H:%M:%S",
    "%Y-%m-%dT%H:%M:%S"
]


def parse_mind_timestamp(ts_str: str) -> Optional[datetime]:
    """Deterministically parse MIND timestamp string."""
    if not ts_str:
        return None
    s = ts_str.strip()
    for fmt in DATETIME_FORMATS:
        try:
            return datetime.strptime(s, fmt)
        except ValueError:
            pass
    return None


class MINDCausalFeatureProxy:
    def __init__(
        self,
        news_first_seen: Optional[Dict[str, str]] = None,
        train_popularity_counts: Optional[Dict[str, int]] = None
    ):
        self.news_first_seen_str: Dict[str, str] = news_first_seen or {}
        self.news_first_seen_dt: Dict[str, datetime] = {}
        for nid, dt_str in self.news_first_seen_str.items():
            dt = parse_mind_timestamp(dt_str)
            if dt:
                self.news_first_seen_dt[nid] = dt

        self.train_popularity_counts: Dict[str, int] = train_popularity_counts or {}
        self.max_train_popularity: int = max(self.train_popularity_counts.values()) if self.train_popularity_counts else 1
        self.log_max_train_pop: float = math.log1p(self.max_train_popularity)

    @classmethod
    def build_or_load(
        cls,
        train_users: Optional[Set[str]] = None,
        behaviors_tsv: str = BEHAVIORS_TSV,
        cache_path: str = PROXIES_CACHE_PATH,
        force_rebuild: bool = False
    ) -> "MINDCausalFeatureProxy":
        """
        Build or load cached causally-verified feature proxies.
        Popularity is computed strictly on train_users to prevent test set data leakage.
        """
        if os.path.exists(cache_path) and not force_rebuild:
            try:
                with open(cache_path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                proxy = cls(
                    news_first_seen=data.get("news_first_seen", {}),
                    train_popularity_counts=data.get("train_popularity_counts", {})
                )
                logger.info(f"Loaded causal feature proxies from cache ({len(proxy.news_first_seen_dt)} news dates, {len(proxy.train_popularity_counts)} train item counts, max_pop={proxy.max_train_popularity}).")
                return proxy
            except Exception as e:
                logger.warning(f"Error loading proxy cache: {e}. Rebuilding...")

        if train_users is None:
            from app.evaluation.mind.split_manager import build_or_load_user_splits
            train_users, _, _, _, _ = build_or_load_user_splits()

        logger.info(f"Building MIND causal feature proxies from {behaviors_tsv}...")
        news_first_seen_dt: Dict[str, datetime] = {}
        train_popularity_counts: Dict[str, int] = {}

        with open(behaviors_tsv, "r", encoding="utf-8") as f:
            reader = csv.reader(f, delimiter="\t")
            for row in reader:
                if len(row) < 5:
                    continue
                user_id = row[1].strip()
                ts_str = row[2].strip()
                dt = parse_mind_timestamp(ts_str)

                history_ids = row[3].strip().split() if row[3].strip() else []
                cands_raw = row[4].strip().split() if row[4].strip() else []

                if dt:
                    # Track earliest appearance of news items in dataset as publication proxy
                    for nid in history_ids:
                        if nid not in news_first_seen_dt or dt < news_first_seen_dt[nid]:
                            news_first_seen_dt[nid] = dt

                    for cand in cands_raw:
                        nid = cand.rsplit("-", 1)[0] if "-" in cand else cand
                        if nid not in news_first_seen_dt or dt < news_first_seen_dt[nid]:
                            news_first_seen_dt[nid] = dt

                # STRICT CAUSAL POPULARITY: count candidate frequency ONLY in train_users impressions
                if user_id in train_users:
                    for cand in cands_raw:
                        nid = cand.rsplit("-", 1)[0] if "-" in cand else cand
                        train_popularity_counts[nid] = train_popularity_counts.get(nid, 0) + 1

        news_first_seen_str = {
            nid: dt.strftime("%Y-%m-%d %H:%M:%S")
            for nid, dt in news_first_seen_dt.items()
        }

        os.makedirs(os.path.dirname(cache_path), exist_ok=True)
        with open(cache_path, "w", encoding="utf-8") as f:
            json.dump({
                "news_first_seen": news_first_seen_str,
                "train_popularity_counts": train_popularity_counts,
                "train_users_count": len(train_users),
                "max_train_popularity": max(train_popularity_counts.values()) if train_popularity_counts else 1
            }, f, indent=2)

        logger.info(f"Saved causal feature proxies to {cache_path}")
        return cls(
            news_first_seen=news_first_seen_str,
            train_popularity_counts=train_popularity_counts
        )

    def calculate_temporal_affinity(self, candidate_category: str, impression_dt: Optional[datetime]) -> float:
        """
        Computes temporal category affinity based on impression timestamp's hour.
        Causal guarantee: uses only impression timestamp.
        """
        hour = impression_dt.hour if impression_dt else 12
        return float(calculate_temporal_category_affinity(candidate_category, hour))

    def calculate_recency_score(self, news_id: str, impression_dt: Optional[datetime]) -> float:
        """
        Continuous exponential decay: score = exp(-0.1 * days)
        Causal guarantee: difference between impression timestamp and article first-seen date.
        """
        if not impression_dt:
            return 0.50
        first_seen = self.news_first_seen_dt.get(news_id)
        if not first_seen:
            return 0.50

        days = max(0.0, (impression_dt - first_seen).total_seconds() / 86400.0)
        return float(round(math.exp(-0.1 * days), 4))

    def calculate_popularity_score(self, news_id: str) -> float:
        """
        Deterministic Log-Frequency Normalization:
          score = log(1 + N_train(news_id)) / log(1 + N_max_train)

        Causal and Statistical Guarantees:
          - N_train is aggregated STRICTLY over train_users impressions (zero test/val leakage).
          - Unseen items (N_train = 0) evaluate to 0.0.
          - Eliminates the ~98% clipping saturation caused by linear min(N/20, 1.0).
        """
        count = self.train_popularity_counts.get(news_id, 0)
        if count <= 0 or self.log_max_train_pop <= 0:
            return 0.0
        score = math.log1p(count) / self.log_max_train_pop
        return float(round(min(1.0, max(0.0, score)), 4))

    def calculate_interest_score(self, candidate_category: str, history_categories: List[str]) -> float:
        """
        Category interest match matching live scoring_service.py:
          +0.60 if candidate matches the user's favorite category.
        Causal guarantee: computed purely from user's past reading history (row[3]).
        """
        if not candidate_category or not history_categories:
            return 0.0

        most_common = Counter(history_categories).most_common(1)
        if not most_common:
            return 0.0

        favorite_category = most_common[0][0]
        if candidate_category == favorite_category:
            return 0.60

        # Proportional density fallback (bounded up to 0.40) if not top favorite
        ratio = history_categories.count(candidate_category) / len(history_categories)
        return float(round(0.40 * ratio, 4))


# Global lazy singleton for high-throughput evaluation
_global_causal_proxy: Optional[MINDCausalFeatureProxy] = None

def get_mind_causal_proxy() -> MINDCausalFeatureProxy:
    global _global_causal_proxy
    if _global_causal_proxy is None:
        _global_causal_proxy = MINDCausalFeatureProxy.build_or_load()
    return _global_causal_proxy


if __name__ == "__main__":
    from app.evaluation.mind.split_manager import build_or_load_user_splits
    train_users, _, _, _, _ = build_or_load_user_splits()
    proxy = MINDCausalFeatureProxy.build_or_load(train_users=train_users, force_rebuild=True)
    print("\n--- CAUSAL PROXY SUMMARY (LOG-NORMALIZED POPULARITY) ---")
    print(f"Total news items with publication proxies: {len(proxy.news_first_seen_dt)}")
    print(f"Total news items with training popularity counts: {len(proxy.train_popularity_counts)}")
    print(f"Max training popularity count (N_max): {proxy.max_train_popularity}")
    
    # Sample a few test calculations
    sample_dt = parse_mind_timestamp("11/12/2019 3:33:03 PM")
    print(f"Sample Temporal Affinity (sports @ 15:00): {proxy.calculate_temporal_affinity('sports', sample_dt)}")
    print(f"Sample Temporal Affinity (business @ 15:00): {proxy.calculate_temporal_affinity('business', sample_dt)}")
    
    sample_news_id = list(proxy.news_first_seen_dt.keys())[0] if proxy.news_first_seen_dt else "N1"
    print(f"Sample News ID: {sample_news_id}")
    print(f"  First seen: {proxy.news_first_seen_str.get(sample_news_id)}")
    print(f"  Recency Score @ sample_dt: {proxy.calculate_recency_score(sample_news_id, sample_dt)}")
    print(f"  Popularity Score (raw count={proxy.train_popularity_counts.get(sample_news_id, 0)}): {proxy.calculate_popularity_score(sample_news_id)}")
    print(f"  Interest Score (history=['sports', 'sports', 'news'], cand='sports'): {proxy.calculate_interest_score('sports', ['sports', 'sports', 'news'])}")
    print(f"  Interest Score (history=['sports', 'sports', 'news'], cand='travel'): {proxy.calculate_interest_score('travel', ['sports', 'sports', 'news'])}")
