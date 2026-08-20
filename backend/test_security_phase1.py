import os
os.environ["TESTING"] = "true"

import unittest
import json
import re
from app import create_app
from app.database import db
from app.scheduler import scheduler
from app.utils.jwt_helper import generate_token
from app.services.user_service import create_user
from app.services.news_service import search_news

class TestSecurityPhase1(unittest.TestCase):

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

    def test_01_password_length_validation(self):
        result = create_user({
            "name": "Test Short Pass",
            "email": "shortpass@example.com",
            "password": "123"
        })
        self.assertFalse(result["success"])
        self.assertEqual(result["message"], "Password must be at least 8 characters long")
        print("PASS: Short password rejection test")

    def test_02_mass_assignment_protection(self):
        payload = {
            "name": "Mass Assignment Tester",
            "email": "massassign@example.com",
            "password": "SecurePassword123!",
            "role": "admin"
        }
        result = create_user(payload)
        if result["success"]:
            from app.database.db import users_collection
            from bson import ObjectId
            db_user = users_collection.find_one({"_id": ObjectId(result["user_id"])})
            self.assertEqual(db_user.get("role"), "user")
            users_collection.delete_one({"_id": ObjectId(result["user_id"])})
        print("PASS: Mass assignment protection test")

    def test_03_regex_escaping_search(self):
        dangerous_query = ".*.*.*[a-z]+"
        res = search_news(dangerous_query)
        self.assertTrue(res["success"])
        print("PASS: Regex sanitization search test")

    def test_04_jwt_role_and_admin_protection(self):
        user_res = create_user({
            "name": "Normal User Test",
            "email": "normuser@example.com",
            "password": "Password123!"
        })
        from app.database.db import users_collection
        from bson import ObjectId
        db_user = users_collection.find_one({"_id": ObjectId(user_res["user_id"])})

        token = generate_token(db_user)

        response = self.client.get(
            "/admin/dashboard",
            headers={"Authorization": f"Bearer {token}"}
        )
        self.assertEqual(response.status_code, 403)
        data = json.loads(response.data)
        self.assertEqual(data["message"], "Admin privileges required")

        # Cleanup test user
        users_collection.delete_one({"_id": ObjectId(user_res["user_id"])})
        print("PASS: Admin RBAC protection test (403 Forbidden for regular users)")

    def test_05_missing_env_config_fail_fast(self):
        import os
        from unittest.mock import patch

        # Test missing SECRET_KEY
        with patch.dict(os.environ, {"SECRET_KEY": ""}, clear=False):
            with self.assertRaises(ValueError) as ctx:
                import importlib
                import app.config.config
                importlib.reload(app.config.config)
            self.assertIn("SECRET_KEY", str(ctx.exception))

        # Restore config module
        import importlib
        import app.config.config
        importlib.reload(app.config.config)
        print("PASS: Missing environment secret fail-fast test")

if __name__ == "__main__":
    unittest.main()


