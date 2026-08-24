import os
os.environ["TESTING"] = "true"

import unittest
import json
import uuid
from datetime import datetime, timedelta
from unittest.mock import patch

from app import create_app
from app.config.config import Config
from app.database import db
from app.services.news_fetch_service import (
    clean_content,
    detect_category,
    fetch_latest_news
)
from app.services.news_service import create_news, get_all_news
from app.scheduler import start_scheduler, scheduler, shutdown_scheduler

class TestRealtimePhase3(unittest.TestCase):

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

    def test_01_content_artifact_cleanup(self):
        """Verify [+1234 chars] artifacts are stripped from content."""
        raw_text = "Headline news content goes here. [+1234 chars]"
        cleaned = clean_content(raw_text)
        self.assertEqual(cleaned, "Headline news content goes here.")

        empty_cleaned = clean_content("")
        self.assertEqual(empty_cleaned, "")
        print("PASS: Content artifact cleanup verified")

    def test_02_word_boundary_category_detection(self):
        """Verify word-boundary category matching prevents false substring matches."""
        # 'rematch' contains 'match' but is NOT a standalone word 'match' -> should NOT be Sports
        cat_rematch = detect_category("Rematch in Progress", "The rematch is scheduled for next week.")
        self.assertNotEqual(cat_rematch, "Sports")

        # Standalone 'cricket' -> Sports
        cat_cricket = detect_category("Cricket World Cup", "India wins the cricket match.")
        self.assertEqual(cat_cricket, "Sports")

        # Standalone 'election' -> Politics
        cat_politics = detect_category("Election Results", "The government announced election dates.")
        self.assertEqual(cat_politics, "Politics")

        # Standalone 'global' -> World
        cat_world = detect_category("Global Summit", "Diplomacy talks at the UN.")
        self.assertEqual(cat_world, "World")

        print("PASS: Word-boundary category detection verified")

    def test_03_embedding_failure_does_not_lose_article(self):
        """Verify that an embedding generation failure still saves the article without an embedding."""
        test_url = f"https://example.com/test-no-embed-{uuid.uuid4().hex[:8]}"
        mock_gnews_response = {
            "articles": [
                {
                    "title": "Article With Failed Embedding",
                    "description": "Description text",
                    "content": "Content text summary",
                    "url": test_url,
                    "image": "https://example.com/img.jpg",
                    "publishedAt": "2026-08-15T12:00:00Z",
                    "source": {"name": "Test Source"}
                }
            ]
        }

        with patch("requests.get") as mock_get, \
             patch("app.services.news_fetch_service.generate_embedding", side_effect=RuntimeError("Transformer Model OOM")):
            
            mock_response = mock_get.return_value
            mock_response.status_code = 200
            mock_response.raise_for_status.return_value = None
            mock_response.json.return_value = mock_gnews_response

            res = fetch_latest_news()
            self.assertTrue(res["success"])
            self.assertEqual(res["inserted"], 1)

        # Check DB to confirm article was inserted without embedding key
        doc = db.news_collection.find_one({"url": test_url})
        self.assertIsNotNone(doc)
        self.assertEqual(doc["title"], "Article With Failed Embedding")
        self.assertNotIn("embedding", doc)
        print("PASS: Embedding failure fault tolerance verified")

    def test_04_atomic_duplicate_url_handling(self):
        """Verify DuplicateKeyError safely increments skipped count."""
        test_url = f"https://example.com/duplicate-{uuid.uuid4().hex[:8]}"
        mock_gnews_response = {
            "articles": [
                {
                    "title": "Duplicate Test Article",
                    "content": "Content text summary",
                    "url": test_url,
                    "publishedAt": "2026-08-15T12:00:00Z",
                    "source": {"name": "Test Source"}
                }
            ]
        }

        with patch("requests.get") as mock_get:
            mock_response = mock_get.return_value
            mock_response.status_code = 200
            mock_response.raise_for_status.return_value = None
            mock_response.json.return_value = mock_gnews_response

            res1 = fetch_latest_news()
            self.assertEqual(res1["inserted"], 1)

            res2 = fetch_latest_news()
            self.assertEqual(res2["inserted"], 0)
            self.assertEqual(res2["skipped"], 1)

        print("PASS: Atomic duplicate URL handling verified")

    def test_05_scheduler_configuration_and_singleton(self):
        """Verify scheduler interval configuration and duplicate prevention."""
        self.assertIsInstance(Config.NEWS_FETCH_INTERVAL_MINUTES, int)
        self.assertGreater(Config.NEWS_FETCH_INTERVAL_MINUTES, 0)

        start_scheduler()
        start_scheduler()  # Duplicate call should be ignored
        
        jobs = scheduler.get_jobs()
        self.assertEqual(len(jobs), 1)
        self.assertEqual(jobs[0].id, "fetch_news")

        shutdown_scheduler()
        print("PASS: Scheduler configuration and singleton behavior verified")

    def test_06_news_chronological_ordering(self):
        """Verify get_all_news sorts articles by publication timestamp descending."""
        now = datetime.utcnow()
        older_time = now - timedelta(hours=5)
        newer_time = now - timedelta(minutes=10)

        url_older = f"https://example.com/older-{uuid.uuid4().hex[:8]}"
        url_newer = f"https://example.com/newer-{uuid.uuid4().hex[:8]}"

        db.news_collection.insert_one({
            "title": "Older News",
            "content": "Older Content",
            "category": "General",
            "url": url_older,
            "published": older_time,
            "created_at": now
        })

        db.news_collection.insert_one({
            "title": "Newer News",
            "content": "Newer Content",
            "category": "General",
            "url": url_newer,
            "published": newer_time,
            "created_at": now
        })

        all_news = get_all_news(page=1, limit=50)
        self.assertTrue(all_news["success"])
        titles = [n["title"] for n in all_news["news"]]
        
        # Newer news must appear before older news in listings
        newer_idx = titles.index("Newer News")
        older_idx = titles.index("Older News")
        self.assertLess(newer_idx, older_idx)

        print("PASS: News chronological publication sorting verified")

if __name__ == "__main__":
    unittest.main()
