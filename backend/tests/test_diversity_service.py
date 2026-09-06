"""
UNIT TESTS FOR DIVERSITY SERVICE (STEP 1 VALIDATION)
=====================================================
Tests the research-grade Diversity-Aware Reranking algorithm (Equation 14):

    S'(c) = S_hybrid(c, u) - lambda * P(c, R)

    P(c, R) = count_in_R(c.category) / max(1, |R|)
"""

import unittest
import os
import sys

# Ensure backend directory is on sys.path
BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

# Set test environment fallbacks if running outside Flask runtime
os.environ.setdefault("SECRET_KEY", "nexora_secure_64byte_hmac_sha256_secret_key_production_grade_512bits_key")
os.environ.setdefault("MONGO_URI", "mongodb://localhost:27017/news_recommendation_db")

from app.config.config import Config
from app.ai.diversity_service import (
    apply_diversity_reranking,
    calculate_category_redundancy_penalty,
    apply_diversity_filter
)


class TestDiversityService(unittest.TestCase):

    def setUp(self):
        # Sample candidate list for general testing
        self.sample_candidates = [
            {"id": "c1", "title": "Article 1", "category": "sports", "hybrid_score": 0.90},
            {"id": "c2", "title": "Article 2", "category": "sports", "hybrid_score": 0.85},
            {"id": "c3", "title": "Article 3", "category": "technology", "hybrid_score": 0.82},
            {"id": "c4", "title": "Article 4", "category": "sports", "hybrid_score": 0.80},
            {"id": "c5", "title": "Article 5", "category": "politics", "hybrid_score": 0.75},
            {"id": "c6", "title": "Article 6", "category": "technology", "hybrid_score": 0.70},
        ]

    def test_scenario_1_lambda_zero(self):
        """
        TEST 1: lambda = 0
        Expected: Reranker produces exact same ordering as pure S_hybrid descending order.
        """
        res = apply_diversity_reranking(self.sample_candidates, top_k=5, diversity_lambda=0.0)
        expected_ids = ["c1", "c2", "c3", "c4", "c5"]
        actual_ids = [item["id"] for item in res]
        self.assertEqual(actual_ids, expected_ids)
        for item in res:
            self.assertEqual(item["diversity_penalty"], 0.0)

    def test_scenario_2_repeated_categories_reranking(self):
        """
        TEST 2: Repeated categories
        Candidate A ("c1", sports, 0.90) selected first.
        Candidate B ("c2", sports, 0.85) vs Candidate C ("c3", technology, 0.82).
        For Candidate B ("c2"): P = 1 / max(1, 1) = 1.0. With lambda = 0.10, penalty = 0.10.
        Adjusted score for B = 0.85 - 0.10 = 0.75.
        For Candidate C ("c3"): P = 0 / 1 = 0.0. Penalty = 0.0.
        Adjusted score for C = 0.82.
        Therefore, Candidate C ("c3") should be selected BEFORE Candidate B ("c2").
        """
        res = apply_diversity_reranking(self.sample_candidates, top_k=3, diversity_lambda=0.10)
        actual_ids = [item["id"] for item in res]
        # First: c1 (0.90 sports)
        # Second: c3 (0.82 tech, no penalty vs c2's 0.85 - 0.10 = 0.75)
        # Third: c5 (0.75 politics, no penalty vs c2's 0.85 - 0.10 = 0.75 with c5 base score tie-breaker or c2's adjusted score)
        self.assertEqual(actual_ids[0], "c1")
        self.assertEqual(actual_ids[1], "c3")

    def test_scenario_3_all_unique_categories(self):
        """
        TEST 3: No repeated categories (all unique)
        P(c, R) = 0 for all candidates.
        Ranking remains identical to hybrid-score ranking.
        """
        unique_candidates = [
            {"id": "u1", "category": "sports", "hybrid_score": 0.95},
            {"id": "u2", "category": "tech", "hybrid_score": 0.90},
            {"id": "u3", "category": "finance", "hybrid_score": 0.85},
            {"id": "u4", "category": "health", "hybrid_score": 0.80},
        ]
        res = apply_diversity_reranking(unique_candidates, top_k=4, diversity_lambda=0.10)
        actual_ids = [item["id"] for item in res]
        expected_ids = ["u1", "u2", "u3", "u4"]
        self.assertEqual(actual_ids, expected_ids)
        for item in res:
            self.assertEqual(item["diversity_penalty"], 0.0)

    def test_scenario_4_top_k_exact_count(self):
        """
        TEST 4: Top-K count
        Verify exactly K candidates are returned when at least K exist.
        """
        res = apply_diversity_reranking(self.sample_candidates, top_k=4, diversity_lambda=0.10)
        self.assertEqual(len(res), 4)

    def test_scenario_5_fewer_than_k_candidates(self):
        """
        TEST 5: Fewer than K candidates
        Verify the function returns all available candidates without errors when len < K.
        """
        small_candidates = [
            {"id": "s1", "category": "sports", "hybrid_score": 0.90},
            {"id": "s2", "category": "tech", "hybrid_score": 0.80},
        ]
        res = apply_diversity_reranking(small_candidates, top_k=5, diversity_lambda=0.10)
        self.assertEqual(len(res), 2)
        actual_ids = [item["id"] for item in res]
        self.assertEqual(actual_ids, ["s1", "s2"])

    def test_scenario_6_determinism(self):
        """
        TEST 6: Determinism
        Run the same candidate set twice and verify exact same ordering and scores.
        """
        run1 = apply_diversity_reranking(self.sample_candidates, top_k=5, diversity_lambda=0.10)
        run2 = apply_diversity_reranking(self.sample_candidates, top_k=5, diversity_lambda=0.10)
        ids1 = [x["id"] for x in run1]
        ids2 = [x["id"] for x in run2]
        scores1 = [x["adjusted_score"] for x in run1]
        scores2 = [x["adjusted_score"] for x in run2]
        self.assertEqual(ids1, ids2)
        self.assertEqual(scores1, scores2)

    def test_backwards_compatible_alias(self):
        """
        Verify apply_diversity_filter alias works identically.
        """
        res = apply_diversity_filter(self.sample_candidates, top_k=4)
        self.assertEqual(len(res), 4)


if __name__ == "__main__":
    res = unittest.main(verbosity=2, exit=False)
    if res.result and not res.result.wasSuccessful():
        sys.exit(1)
    sys.exit(0)
