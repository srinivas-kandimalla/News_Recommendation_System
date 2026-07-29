from pymongo import MongoClient
from app.config.config import Config

# Create MongoDB client
client = MongoClient(Config.MONGO_URI)

# Access the database
db = client.get_database()

print("✅ MongoDB Connected Successfully")