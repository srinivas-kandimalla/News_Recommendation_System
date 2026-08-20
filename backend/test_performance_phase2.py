import os
os.environ["TESTING"] = "true"

import unittest
import json
from app import create_app
from app.database import db
from app.services.user_service import create_user
from app.services.news_service import create_news, get_all_news, search_news
from app.services.bookmark_service import add_bookmark, get_bookmarks
from app.services.reaction_service import like_news, dislike_news
from app.services.reading_history_service import save_reading_history
from app.services.analytics_service import get_user_analytics
from app.services.trending_service import get_trending_news
from app.services.admin_service import get_admin_dashboard
from app.ai.recommendation_service import get_personalized_recommendations
from app.ai.scoring_service import calculate_popularity_score

class TestPerformancePhase2(unittest.TestCase):

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

    def test_01_verify_mongodb_indexes(self):
        """Verify that all required MongoDB indexes actually exist."""
        rh_indexes = [idx["name"] for idx in db.reading_history_collection.list_indexes()]
        bm_indexes = [idx["name"] for idx in db.bookmark_collection.list_indexes()]
        rx_indexes = [idx["name"] for idx in db.reaction_collection.list_indexes()]
        news_indexes = [idx["name"] for idx in db.news_collection.list_indexes()]

        # Check reading_history single index on news_id
        self.assertTrue(any("news_id" in idx for idx in rh_indexes))
        # Check bookmark single index on news_id
        self.assertTrue(any("news_id" in idx for idx in bm_indexes))
        # Check reaction indexes
        self.assertTrue(any("reaction" in idx for idx in rx_indexes))
        # Check news indexes
        self.assertTrue(any("created_at" in idx for idx in news_indexes))
        self.assertTrue(any("category" in idx for idx in news_indexes))
        print("PASS: MongoDB indexes verified successfully")

    def test_02_analytics_and_bookmark_order_preservation(self):
        """Verify analytics and bookmark ordering preservation."""
        import uuid
        unique_email = f"phase2_{uuid.uuid4().hex[:8]}@example.com"
        user_res = create_user({
            "name": "Phase2 User",
            "email": unique_email,
            "password": "Password123!"
        })
        user_id = user_res["user_id"]

        news1 = create_news({
            "title": "Tech News 1",
            "content": "Content for tech news article 1",
            "category": "Technology",
            "author": "Tech Author",
            "url": f"https://example.com/tech-news-{uuid.uuid4().hex[:8]}"
        })
        news2 = create_news({
            "title": "Sports News 1",
            "content": "Content for sports news article 1",
            "category": "Sports",
            "author": "Sports Author",
            "url": f"https://example.com/sports-news-{uuid.uuid4().hex[:8]}"
        })

        news1_id = news1["news_id"]
        news2_id = news2["news_id"]

        save_reading_history(user_id, news1_id)
        save_reading_history(user_id, news2_id)
        add_bookmark(user_id, news1_id)
        add_bookmark(user_id, news2_id)
        like_news(user_id, news1_id)

        # Test Analytics
        analytics = get_user_analytics(user_id)
        self.assertTrue(analytics["success"])
        self.assertEqual(analytics["status_code"], 200)
        self.assertIn("analytics", analytics)
        self.assertEqual(analytics["analytics"]["total_articles_read"], 2)
        self.assertEqual(analytics["analytics"]["total_bookmarks"], 2)

        # Test Bookmarks ordering
        bookmarks = get_bookmarks(user_id)
        self.assertTrue(bookmarks["success"])
        self.assertEqual(bookmarks["count"], 2)
        self.assertEqual(bookmarks["bookmarks"][0]["_id"], news1_id)
        self.assertEqual(bookmarks["bookmarks"][1]["_id"], news2_id)

        print("PASS: Analytics and Bookmark order preservation verified")

    def test_03_trending_and_admin_service_aggregation(self):
        """Verify trending and admin dashboard aggregations."""
        trending = get_trending_news(top_k=5)
        self.assertTrue(trending["success"])
        self.assertEqual(trending["status_code"], 200)
        self.assertIn("trending_news", trending)

        admin_data = get_admin_dashboard()
        self.assertTrue(admin_data["success"])
        self.assertEqual(admin_data["status_code"], 200)
        self.assertIn("most_popular_category", admin_data["dashboard"])
        print("PASS: Trending and Admin aggregation verified")

    def test_04_popularity_score_equivalence(self):
        """Verify equivalence between old and new popularity score calculation."""
        import uuid
        news_item = create_news({
            "title": "Score Test Article",
            "content": "Content for popularity score equivalence test",
            "category": "Science",
            "url": f"https://example.com/score-test-{uuid.uuid4().hex[:8]}"
        })
        n_id = news_item["news_id"]

        # Default query count
        old_score = calculate_popularity_score(n_id)
        # Pre-computed count (0 reads, 0 likes, 0 bookmarks)
        new_score = calculate_popularity_score(n_id, reads=0, likes=0, bookmarks=0)
        self.assertEqual(old_score, new_score)
        print("PASS: Popularity score mathematical equivalence verified")

    def test_05_non_ai_queries_embedding_projection(self):
        """Verify get_all_news and search_news exclude vector embeddings."""
        all_news = get_all_news(page=1, limit=5)
        self.assertTrue(all_news["success"])
        for item in all_news["news"]:
            self.assertNotIn("embedding", item)

        search_res = search_news("Tech")
        self.assertTrue(search_res["success"])
        for item in search_res["news"]:
            self.assertNotIn("embedding", item)
        print("PASS: Non-AI queries projection verified")

if __name__ == "__main__":
    unittest.main()
