import os
import logging
from pymongo import MongoClient
from app.config.config import Config

logger = logging.getLogger(__name__)

# Create MongoDB client
client = MongoClient(Config.MONGO_URI)

class DatabaseProxy:
    def _get_db(self):
        if os.environ.get("TESTING") == "true":
            return client.get_database("news_recommendation_test_db")
        return client.get_database()

    def __getattr__(self, name):
        return getattr(self._get_db(), name)

    def __getitem__(self, name):
        return self._get_db()[name]

class CollectionProxy:
    def __init__(self, collection_name):
        self.collection_name = collection_name

    def _get_coll(self):
        if os.environ.get("TESTING") == "true":
            return client.get_database("news_recommendation_test_db")[self.collection_name]
        return client.get_database()[self.collection_name]

    def __getattr__(self, name):
        return getattr(self._get_coll(), name)

    def __getitem__(self, name):
        return self._get_coll()[name]

db = DatabaseProxy()

# Collections
users_collection = CollectionProxy("users")
news_collection = CollectionProxy("news")
reading_history_collection = CollectionProxy("reading_history")
bookmark_collection = CollectionProxy("bookmarks")
reaction_collection = CollectionProxy("reactions")

def init_indexes():
    # Create indexes (idempotent - skipped by MongoDB if already exists)
    users_collection.create_index("email", unique=True)
    reading_history_collection.create_index([("user_id", 1), ("news_id", 1)])
    reading_history_collection.create_index([("user_id", 1), ("read_at", -1)])
    reading_history_collection.create_index("news_id")
    bookmark_collection.create_index([("user_id", 1), ("news_id", 1)])
    bookmark_collection.create_index("news_id")
    reaction_collection.create_index([("user_id", 1), ("news_id", 1)])
    reaction_collection.create_index([("news_id", 1), ("reaction", 1)])
    reaction_collection.create_index([("user_id", 1), ("reaction", 1)])
    news_collection.create_index("url", unique=True)
    news_collection.create_index("created_at")
    news_collection.create_index("published")
    news_collection.create_index("category")

init_indexes()
logger.info("MongoDB Connected Successfully")