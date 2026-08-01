from pymongo import MongoClient
from app.config.config import Config

# Create MongoDB client
client = MongoClient(Config.MONGO_URI)

# Access the database
db = client.get_database()

# Collections
users_collection = db["users"]
news_collection = db["news"]
reading_history_collection = db["reading_history"]
bookmark_collection = db["bookmarks"]
reaction_collection = db["reactions"]

# Create indexes (idempotent - skipped by MongoDB if already exists)
users_collection.create_index("email", unique=True)
reading_history_collection.create_index([("user_id", 1), ("news_id", 1)])
bookmark_collection.create_index([("user_id", 1), ("news_id", 1)])
reaction_collection.create_index([("user_id", 1), ("news_id", 1)])

print("✅ MongoDB Connected Successfully")