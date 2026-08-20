import os
from dotenv import load_dotenv, find_dotenv

# Search for .env in cwd or parent directories
load_dotenv(find_dotenv(usecwd=True))


class Config:
    SECRET_KEY = os.getenv("SECRET_KEY")
    MONGO_URI = os.getenv("MONGO_URI")
    DEBUG = os.getenv("DEBUG") == "True"
    GNEWS_API_KEY = os.getenv("GNEWS_API_KEY", "")

    try:
        NEWS_FETCH_INTERVAL_MINUTES = int(os.getenv("NEWS_FETCH_INTERVAL_MINUTES", "30"))
        if NEWS_FETCH_INTERVAL_MINUTES <= 0:
            NEWS_FETCH_INTERVAL_MINUTES = 30
    except (ValueError, TypeError):
        NEWS_FETCH_INTERVAL_MINUTES = 30

    if not SECRET_KEY:
        raise ValueError("CRITICAL CONFIGURATION ERROR: SECRET_KEY environment variable is missing or empty.")

    if not MONGO_URI:
        raise ValueError("CRITICAL CONFIGURATION ERROR: MONGO_URI environment variable is missing or empty.")

