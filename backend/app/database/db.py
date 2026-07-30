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

print("✅ MongoDB Connected Successfully")