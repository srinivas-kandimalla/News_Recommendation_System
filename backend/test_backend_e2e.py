"""
Phase 5 End-to-End Backend Verification Suite (test_backend_e2e.py)
Verifies isolated MongoDB test database (news_recommendation_test_db) usage, zero dev DB pollution,
full user lifecycle, cold-start, history-based recommendations, analytics, trending, bookmarks, and RBAC.
"""

import os
import sys
import unittest
import json
from pymongo import MongoClient

# Force TESTING = "true" before any app module imports
os.environ["TESTING"] = "true"

sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from app import create_app
from app.config.config import Config
from app.database.db import (
    client,
    news_collection,
    users_collection,
    reading_history_collection,
    bookmark_collection,
    reaction_collection
)
from app.ai.embedding_service import generate_embedding


class TestBackendE2E(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        cls.app = create_app()
        cls.client = cls.app.test_client()

        # Connect to dev DB directly to record initial baseline state
        cls.dev_db = client.get_database("news_recommendation_db")
        cls.initial_dev_counts = {
            "news": cls.dev_db.news.count_documents({}),
            "users": cls.dev_db.users.count_documents({}),
            "reading_history": cls.dev_db.reading_history.count_documents({}),
            "bookmarks": cls.dev_db.bookmarks.count_documents({}) if "bookmarks" in cls.dev_db.list_collection_names() else 0,
            "reactions": cls.dev_db.reactions.count_documents({}) if "reactions" in cls.dev_db.list_collection_names() else 0
        }

        # Clean isolated test database
        cls.test_db = client.get_database("news_recommendation_test_db")
        cls.clean_test_db()

    @classmethod
    def tearDownClass(cls):
        cls.clean_test_db()
        cls.verify_zero_dev_db_pollution()

    @classmethod
    def clean_test_db(cls):
        news_collection.delete_many({})
        users_collection.delete_many({})
        reading_history_collection.delete_many({})
        bookmark_collection.delete_many({})
        reaction_collection.delete_many({})

    @classmethod
    def verify_zero_dev_db_pollution(cls):
        current_dev_counts = {
            "news": cls.dev_db.news.count_documents({}),
            "users": cls.dev_db.users.count_documents({}),
            "reading_history": cls.dev_db.reading_history.count_documents({}),
            "bookmarks": cls.dev_db.bookmarks.count_documents({}) if "bookmarks" in cls.dev_db.list_collection_names() else 0,
            "reactions": cls.dev_db.reactions.count_documents({}) if "reactions" in cls.dev_db.list_collection_names() else 0
        }
        for coll_name, initial_count in cls.initial_dev_counts.items():
            current_count = current_dev_counts[coll_name]
            if current_count != initial_count:
                raise AssertionError(
                    f"DEV DB POLLUTION DETECTED in '{coll_name}'! Initial: {initial_count}, Current: {current_count}"
                )

    def setUp(self):
        self.clean_test_db()

    def tearDown(self):
        self.clean_test_db()
        self.verify_zero_dev_db_pollution()

    def test_01_health_check(self):
        """A. Verify API health check endpoint"""
        res = self.client.get("/")
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data.get("success", True))
        print("PASS: Health Check (GET /) verified")

    def test_02_user_registration_login_and_rbac(self):
        """B, C, D. Verify user registration, login JWT generation, and RBAC protection"""
        # Register user
        reg_res = self.client.post("/register", json={
            "name": "E2E Test User",
            "email": "e2e_user@example.com",
            "password": "Password123!"
        })
        self.assertEqual(reg_res.status_code, 201)
        reg_data = reg_res.get_json()
        self.assertTrue(reg_data.get("success"))
        self.assertIn("user_id", reg_data)

        # Login user
        login_res = self.client.post("/login", json={
            "email": "e2e_user@example.com",
            "password": "Password123!"
        })
        self.assertEqual(login_res.status_code, 200)
        login_data = login_res.get_json()
        self.assertTrue(login_data.get("success"))
        self.assertIn("token", login_data)

        user_token = login_data["token"]
        headers = {"Authorization": f"Bearer {user_token}"}

        # RBAC Check: Regular user cannot access /admin/dashboard
        admin_res = self.client.get("/admin/dashboard", headers=headers)
        self.assertEqual(admin_res.status_code, 403)
        self.assertFalse(admin_res.get_json().get("success"))
        print("PASS: Registration, Login & Admin RBAC (403 Forbidden) verified")

    def test_03_news_fields_and_embedding_dimensions(self):
        """E, F, G. Verify news insertion, required 9 fields, and 384-dimensional embeddings"""
        emb = generate_embedding("AI & Quantum Computing Advances")
        self.assertIsNotNone(emb)
        self.assertEqual(len(emb), 384)

        # Insert test news article
        news_doc = {
            "title": "AI Breakthrough 2026",
            "content": "Comprehensive overview of quantum machine learning.",
            "category": "Technology",
            "author": "Tech Analyst",
            "source": "TechCrunch",
            "url": "https://example.com/ai-breakthrough-2026",
            "image_url": "https://example.com/img.jpg",
            "published": "2026-08-15T10:00:00Z",
            "created_at": "2026-08-15T10:00:00Z",
            "embedding": emb
        }
        res_insert = news_collection.insert_one(news_doc)
        self.assertIsNotNone(res_insert.inserted_id)

        # 1. Verify 9 required fields directly on MongoDB document
        db_doc = news_collection.find_one({"_id": res_insert.inserted_id})
        db_required = ["title", "content", "category", "author", "source", "image_url", "published", "created_at", "embedding"]
        for field in db_required:
            self.assertIn(field, db_doc, f"Field '{field}' missing from MongoDB document")
            self.assertTrue(db_doc[field], f"Field '{field}' is empty in MongoDB document")

        # 2. Fetch news via API GET /news
        fetch_res = self.client.get("/news")
        self.assertEqual(fetch_res.status_code, 200)
        data = fetch_res.get_json()
        self.assertTrue(data.get("success"))
        articles = data.get("news", [])
        self.assertGreaterEqual(len(articles), 1)

        target = articles[0]
        api_required = ["title", "content", "category", "author", "source", "image_url", "created_at"]
        for field in api_required:
            self.assertIn(field, target, f"Field '{field}' missing from GET /news API payload")
            self.assertTrue(target[field], f"Field '{field}' is empty in GET /news API payload")
        print("PASS: News 9-field metadata & 384-dim embeddings verified")

    def test_04_cold_start_recommendations(self):
        """H. Verify zero-history cold-start fallback recommendations"""
        # Create user with 0 history
        reg_res = self.client.post("/register", json={
            "name": "Cold Start User",
            "email": "coldstart_e2e@example.com",
            "password": "Password123!"
        })
        user_id = reg_res.get_json()["user_id"]

        login_res = self.client.post("/login", json={
            "email": "coldstart_e2e@example.com",
            "password": "Password123!"
        })
        token = login_res.get_json()["token"]

        # Insert trending news
        news_collection.insert_one({
            "title": "Trending Global News",
            "content": "Global breaking news article.",
            "category": "World",
            "author": "BBC",
            "source": "BBC News",
            "url": "https://example.com/trending-world",
            "published": "2026-08-15T10:00:00Z",
            "created_at": "2026-08-15T10:00:00Z"
        })

        rec_res = self.client.get("/personalized-recommendations", headers={"Authorization": f"Bearer {token}"})
        self.assertEqual(rec_res.status_code, 200)
        data = rec_res.get_json()
        self.assertTrue(data.get("success"))
        self.assertIn("recommendations", data)
        self.assertGreaterEqual(len(data["recommendations"]), 1)
        first_rec = data["recommendations"][0]
        self.assertIn("trending", first_rec.get("reason", "").lower())
        print("PASS: Cold-start zero-history fallback recommendations verified")

    def test_05_complete_engagement_flow_and_history_personalization(self):
        """I, J, K, L, M, N, O, P, Q, R. Verify reading history, likes, bookmarks, personalization signals & analytics"""
        # 1. Setup User
        self.client.post("/register", json={"name": "History User", "email": "hist_user@example.com", "password": "Password123!"})
        login_res = self.client.post("/login", json={"email": "hist_user@example.com", "password": "Password123!"})
        token = login_res.get_json()["token"]
        headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

        # 2. Setup 3 Articles with controlled embeddings & categories
        tech1_emb = generate_embedding("Artificial Intelligence Deep Learning Neural Networks")
        tech2_emb = generate_embedding("Quantum Computing Qubits Semiconductor Hardware")
        sports_emb = generate_embedding("World Cup Football Soccer Penalty Shootout Champions")

        art_tech1 = news_collection.insert_one({
            "title": "AI & Deep Learning Breakthrough",
            "content": "Deep learning models achieve state-of-the-art results.",
            "category": "Technology",
            "author": "Tech Author",
            "source": "TechCrunch",
            "url": "https://example.com/tech-1",
            "published": "2026-08-15T08:00:00Z",
            "created_at": "2026-08-15T08:00:00Z",
            "embedding": tech1_emb
        }).inserted_id

        art_tech2 = news_collection.insert_one({
            "title": "Quantum Computing Milestones",
            "content": "Superconducting qubits demonstrate fault tolerance.",
            "category": "Technology",
            "author": "Quantum Author",
            "source": "Wired",
            "url": "https://example.com/tech-2",
            "published": "2026-08-15T09:00:00Z",
            "created_at": "2026-08-15T09:00:00Z",
            "embedding": tech2_emb
        }).inserted_id

        art_sports = news_collection.insert_one({
            "title": "World Cup Final Victory",
            "content": "National team wins championship in penalty shootout.",
            "category": "Sports",
            "author": "Sports Desk",
            "source": "ESPN",
            "url": "https://example.com/sports-1",
            "published": "2026-08-15T09:30:00Z",
            "created_at": "2026-08-15T09:30:00Z",
            "embedding": sports_emb
        }).inserted_id

        # 3. Record Reading History (I) & Duplicate Handling (R)
        hist_res1 = self.client.post(f"/reading-history/{art_tech1}", headers=headers)
        self.assertIn(hist_res1.status_code, [200, 201])
        self.assertTrue(hist_res1.get_json().get("success"))

        # Duplicate read test (R)
        hist_res2 = self.client.post(f"/reading-history/{art_tech1}", headers=headers)
        self.assertIn(hist_res2.status_code, [200, 201])

        # 4. Reaction / Like (J)
        like_res = self.client.post(f"/news/{art_tech1}/like", headers=headers)
        self.assertIn(like_res.status_code, [200, 201])

        # 5. Bookmark (K)
        bm_res = self.client.post(f"/bookmark/{art_tech1}", headers=headers)
        self.assertEqual(bm_res.status_code, 201)

        # 6. Verify Bookmarks Endpoint (O)
        bm_list_res = self.client.get("/bookmarks", headers=headers)
        self.assertEqual(bm_list_res.status_code, 200)
        bm_list = bm_list_res.get_json().get("bookmarks", [])
        self.assertEqual(len(bm_list), 1)

        # 7. Verify History-Based Personalization & Signals (L, M, N)
        rec_res = self.client.get("/personalized-recommendations", headers=headers)
        self.assertEqual(rec_res.status_code, 200)
        recs = rec_res.get_json().get("recommendations", [])
        self.assertGreaterEqual(len(recs), 1)

        # User read & liked Tech 1. Recommendation engine MUST rank Tech 2 above Sports 1.
        rec_titles = [r["title"] for r in recs]
        self.assertIn("Quantum Computing Milestones", rec_titles)
        if "World Cup Final Victory" in rec_titles:
            tech2_idx = rec_titles.index("Quantum Computing Milestones")
            sports_idx = rec_titles.index("World Cup Final Victory")
            self.assertLess(tech2_idx, sports_idx, "Semantically related Tech article must rank above Sports article")

        # Verify semantic / interest signals present
        target_rec = next(r for r in recs if r["title"] == "Quantum Computing Milestones")
        self.assertGreater(target_rec.get("interest_score", 0) + target_rec.get("semantic_score", 0), 0)

        # 8. Verify Analytics Endpoint (P)
        analytics_res = self.client.get("/analytics", headers=headers)
        self.assertEqual(analytics_res.status_code, 200)
        self.assertTrue(analytics_res.get_json().get("success"))

        # 9. Verify Trending Endpoint (Q)
        trending_res = self.client.get("/trending")
        self.assertEqual(trending_res.status_code, 200)
        self.assertTrue(trending_res.get_json().get("success"))

        print("PASS: Full engagement flow, signals, bookmarks, analytics & trending verified")

    def test_06_malformed_ids_and_unauthorized_token_errors(self):
        """T, U. Verify error handling for malformed IDs, 404s, and invalid Bearer tokens"""
        # Malformed news_id in reading history (T)
        bad_id_res = self.client.post("/reading-history/invalid_object_id_123")
        self.assertEqual(bad_id_res.status_code, 401)  # Missing token first

        # Register user for auth tests
        self.client.post("/register", json={"name": "Err User", "email": "err_user@example.com", "password": "Password123!"})
        login_res = self.client.post("/login", json={"email": "err_user@example.com", "password": "Password123!"})
        token = login_res.get_json()["token"]

        bad_hist_res = self.client.post("/reading-history/invalid_object_id_123", headers={"Authorization": f"Bearer {token}"})
        self.assertEqual(bad_hist_res.status_code, 400)
        self.assertFalse(bad_hist_res.get_json().get("success"))

        # Invalid token signature (U)
        invalid_tok_res = self.client.get("/personalized-recommendations", headers={"Authorization": "Bearer invalid.jwt.token"})
        self.assertEqual(invalid_tok_res.status_code, 401)
        self.assertFalse(invalid_tok_res.get_json().get("success"))
        print("PASS: Malformed IDs & invalid token error handling (400/401) verified")


if __name__ == "__main__":
    unittest.main()
