import os
os.environ["TESTING"] = "true"

import unittest
import uuid
from datetime import datetime, timedelta, timezone

from app import create_app
from app.database import db
from app.services.user_service import create_user
from app.services.news_service import create_news
from app.services.reading_history_service import save_reading_history
from app.ai.scoring_service import calculate_recency_score
from app.ai.recommendation_service import get_personalized_recommendations

class TestRecommendationPhase4(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        os.environ["TESTING"] = "true"
        db.client.drop_database("news_recommendation_test_db")
        db.init_indexes()
        cls.app = create_app()
        cls.app.config["TESTING"] = True
        cls.client = cls.app.test_client()

    @classmethod
    def tearDownClass(cls):
        db.client.drop_database("news_recommendation_test_db")

    def test_01_recency_continuous_exponential_decay(self):
        """Verify continuous exponential decay monotonicity and score properties."""
        now = datetime.now(timezone.utc)
        score_today = calculate_recency_score(now)
        score_1day = calculate_recency_score(now - timedelta(days=1))
        score_7days = calculate_recency_score(now - timedelta(days=7))
        score_30days = calculate_recency_score(now - timedelta(days=30))

        self.assertEqual(score_today, 1.0)
        self.assertGreater(score_today, score_1day)
        self.assertGreater(score_1day, score_7days)
        self.assertGreater(score_7days, score_30days)
        
        # Verify 7-day score is ~0.4966 (~0.50)
        self.assertAlmostEqual(score_7days, 0.4966, delta=0.01)
        print("PASS: Continuous exponential decay recency monotonicity verified")

    def test_02_recency_published_fallback_handling(self):
        """Verify published -> created_at fallback and invalid date parsing."""
        now = datetime.now(timezone.utc)
        iso_str = (now - timedelta(days=2)).isoformat()
        
        # 1. Valid published date (ISO string)
        score_iso = calculate_recency_score(published=iso_str)
        self.assertGreater(score_iso, 0.7)

        # 2. Missing published -> fallback to created_at
        score_fallback = calculate_recency_score(published=None, created_at=now)
        self.assertEqual(score_fallback, 1.0)

        # 3. Invalid published string -> fallback to created_at
        score_invalid = calculate_recency_score(published="invalid-date-string", created_at=now)
        self.assertEqual(score_invalid, 1.0)
        print("PASS: Recency date fallbacks verified")

    def test_03_zero_history_cold_start_fallback(self):
        """Verify new user with 0 history receives HTTP 200 with trending fallback containing content, source, and recency_score > 0."""
        create_news({
            "title": f"Cold Start Article {uuid.uuid4().hex[:8]}",
            "content": "Detailed content body for cold start recommendation test article.",
            "category": "General",
            "source": "GNews Test Source",
            "url": f"https://example.com/cold-start-{uuid.uuid4().hex[:8]}"
        })

        unique_email = f"coldstart_{uuid.uuid4().hex[:8]}@example.com"
        user_res = create_user({
            "name": "Cold Start User",
            "email": unique_email,
            "password": "Password123!"
        })
        user_id = user_res["user_id"]

        res = get_personalized_recommendations(user_id, top_k=5)
        self.assertTrue(res["success"])
        self.assertEqual(res["status_code"], 200)
        self.assertIn("recommendations", res)
        self.assertGreater(res["count"], 0)

        first_item = res["recommendations"][0]
        self.assertEqual(first_item["reason"], "Recommended because these are currently trending.")
        self.assertTrue(len(first_item["content"]) > 0, "Cold-start recommendation content must not be empty")
        self.assertTrue(len(first_item["source"]) > 0, "Cold-start recommendation source must not be empty")
        self.assertIsNotNone(first_item["created_at"])
        self.assertGreater(first_item["recency_score"], 0.0)
        self.assertEqual(first_item["popularity_score"], 0.0)
        self.assertGreater(first_item["hybrid_score"], 0.0)

        print("PASS: Zero-history cold start fallback with content, source, and recency_score verified")

    def test_04_one_history_item_user(self):
        """Verify single read article user receives personalized recommendations."""
        unique_email = f"singlehistory_{uuid.uuid4().hex[:8]}@example.com"
        user_res = create_user({
            "name": "Single History User",
            "email": unique_email,
            "password": "Password123!"
        })
        user_id = user_res["user_id"]

        news_res = create_news({
            "title": f"Single History Article {uuid.uuid4().hex[:8]}",
            "content": "Content for single history user test",
            "category": "Technology",
            "url": f"https://example.com/single-hist-{uuid.uuid4().hex[:8]}"
        })
        news_id = news_res["news_id"]

        # Create unread candidate article
        create_news({
            "title": f"Unread Candidate Article {uuid.uuid4().hex[:8]}",
            "content": "Content for unread candidate article",
            "category": "Technology",
            "url": f"https://example.com/unread-cand-{uuid.uuid4().hex[:8]}"
        })

        save_reading_history(user_id, news_id)

        res = get_personalized_recommendations(user_id, top_k=5)
        self.assertTrue(res["success"])
        self.assertEqual(res["status_code"], 200)
        self.assertGreater(res["count"], 0)
        print("PASS: Single-history item personalization verified")

    def test_05_diversity_filter_top_k_preservation(self):
        """Verify post-filter diversity logic fills top_k candidates when pool exists."""
        unique_email = f"diversity_{uuid.uuid4().hex[:8]}@example.com"
        user_res = create_user({
            "name": "Diversity User",
            "email": unique_email,
            "password": "Password123!"
        })
        user_id = user_res["user_id"]

        # Create 6 candidate articles in the same category & source
        created_ids = []
        for i in range(6):
            n = create_news({
                "title": f"Same Cat Article {i} {uuid.uuid4().hex[:8]}",
                "content": f"Content body for candidate article {i}",
                "category": "SameCat",
                "source": "SameSource",
                "url": f"https://example.com/same-cat-{i}-{uuid.uuid4().hex[:8]}"
            })
            created_ids.append(n["news_id"])

        # Read 1 article to trigger personalized mode
        save_reading_history(user_id, created_ids[0])

        res = get_personalized_recommendations(user_id, top_k=4)
        self.assertTrue(res["success"])
        # Must return top_k = 4 even though all candidates share category & source
        self.assertEqual(res["count"], 4)
        self.assertEqual(len(res["recommendations"]), 4)
        print("PASS: Diversity filter top_k count preservation verified")

    def test_06_unembedded_articles_skipped_safely(self):
        """Verify articles without an embedding key are safely skipped during candidate loop."""
        unembedded_id = db.news_collection.insert_one({
            "title": "Unembedded Article Test",
            "content": "No vector embedding present",
            "category": "Science",
            "url": f"https://example.com/unembedded-{uuid.uuid4().hex[:8]}",
            "created_at": datetime.now(timezone.utc)
        }).inserted_id

        unique_email = f"unembed_{uuid.uuid4().hex[:8]}@example.com"
        user_res = create_user({
            "name": "Unembed User",
            "email": unique_email,
            "password": "Password123!"
        })
        user_id = user_res["user_id"]

        # Read 1 normal article
        n = create_news({
            "title": "Normal Embedded Article",
            "content": "Has vector embedding",
            "category": "Science",
            "url": f"https://example.com/normal-embed-{uuid.uuid4().hex[:8]}"
        })
        save_reading_history(user_id, n["news_id"])

        res = get_personalized_recommendations(user_id, top_k=10)
        self.assertTrue(res["success"])
        returned_ids = [r["_id"] for r in res["recommendations"]]
        self.assertNotIn(str(unembedded_id), returned_ids)
        print("PASS: Unembedded article skipping verified")

    def test_07_fresh_zero_engagement_articles_rank_reasonably(self):
        """Verify fresh zero-engagement articles rank above old articles with minimal engagement."""
        from bson import ObjectId
        old_date = datetime.now(timezone.utc) - timedelta(days=40)
        old_news = create_news({
            "title": "Old Article With Interactions",
            "content": "Content of old article",
            "category": "Technology",
            "source": "Tech Daily",
            "url": f"https://example.com/old-interact-{uuid.uuid4().hex[:8]}"
        })
        db.news_collection.update_one({"_id": ObjectId(old_news["news_id"])}, {"$set": {"created_at": old_date, "published": old_date.isoformat()}})

        dummy_user = create_user({"name": "Dummy", "email": f"dummy_{uuid.uuid4().hex[:8]}@example.com", "password": "Password123!"})["user_id"]
        save_reading_history(dummy_user, old_news["news_id"])

        fresh_news = create_news({
            "title": "Fresh Zero Engagement Article",
            "content": "Breaking news content published today",
            "category": "Technology",
            "source": "Breaking News",
            "url": f"https://example.com/fresh-zero-{uuid.uuid4().hex[:8]}"
        })

        cold_user = create_user({"name": "Cold User", "email": f"cold_{uuid.uuid4().hex[:8]}@example.com", "password": "Password123!"})["user_id"]
        res = get_personalized_recommendations(cold_user, top_k=15)
        titles = [r["title"] for r in res["recommendations"]]
        self.assertIn("Fresh Zero Engagement Article", titles)
        self.assertIn("Old Article With Interactions", titles)
        fresh_idx = titles.index("Fresh Zero Engagement Article")
        old_idx = titles.index("Old Article With Interactions")
        self.assertLess(fresh_idx, old_idx, "Fresh zero-engagement news must rank above old news with minimal engagement")
        print("PASS: Fresh zero-engagement articles ranking above old engagement articles verified")

if __name__ == "__main__":
    unittest.main()
