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

    try:
        NEWS_CATEGORIES_PER_RUN = int(os.getenv("NEWS_CATEGORIES_PER_RUN", "2"))
        if NEWS_CATEGORIES_PER_RUN <= 0:
            NEWS_CATEGORIES_PER_RUN = 2
    except (ValueError, TypeError):
        NEWS_CATEGORIES_PER_RUN = 2

    try:
        LONG_TERM_HISTORY_LIMIT = int(os.getenv("LONG_TERM_HISTORY_LIMIT", "50"))
        if LONG_TERM_HISTORY_LIMIT <= 0:
            LONG_TERM_HISTORY_LIMIT = 50
    except (ValueError, TypeError):
        LONG_TERM_HISTORY_LIMIT = 50

    try:
        SHORT_TERM_HISTORY_LIMIT = int(os.getenv("SHORT_TERM_HISTORY_LIMIT", "5"))
        if SHORT_TERM_HISTORY_LIMIT <= 0:
            SHORT_TERM_HISTORY_LIMIT = 5
    except (ValueError, TypeError):
        SHORT_TERM_HISTORY_LIMIT = 5

    try:
        LONG_TERM_WEIGHT = float(os.getenv("LONG_TERM_WEIGHT", "0.4"))
        if not (0.0 <= LONG_TERM_WEIGHT <= 1.0):
            LONG_TERM_WEIGHT = 0.4
    except (ValueError, TypeError):
        LONG_TERM_WEIGHT = 0.4

    try:
        SHORT_TERM_WEIGHT = float(os.getenv("SHORT_TERM_WEIGHT", "0.6"))
        if not (0.0 <= SHORT_TERM_WEIGHT <= 1.0):
            SHORT_TERM_WEIGHT = 0.6
    except (ValueError, TypeError):
        SHORT_TERM_WEIGHT = 0.6
    try:
        ATTENTION_TEMPERATURE = float(os.getenv("ATTENTION_TEMPERATURE", "0.1"))
        if ATTENTION_TEMPERATURE <= 0.0:
            ATTENTION_TEMPERATURE = 0.1
    except (ValueError, TypeError):
        ATTENTION_TEMPERATURE = 0.1

    USE_NEURAL_RANKER = os.getenv("USE_NEURAL_RANKER", "False").lower() == "true"
    try:
        CANDIDATE_PREFILTER_TOP_N = int(os.getenv("CANDIDATE_PREFILTER_TOP_N", "0"))
        if CANDIDATE_PREFILTER_TOP_N < 0:
            CANDIDATE_PREFILTER_TOP_N = 0
    except (ValueError, TypeError):
        CANDIDATE_PREFILTER_TOP_N = 0

    allowed_origins_env = os.getenv("ALLOWED_ORIGINS", "")
    if allowed_origins_env:
        ALLOWED_ORIGINS = [o.strip() for o in allowed_origins_env.split(",") if o.strip()]
    else:
        ALLOWED_ORIGINS = [
            "http://localhost:5173",
            "http://127.0.0.1:5173",
            "http://localhost:3000",
            "http://127.0.0.1:3000",
            "http://localhost:5174",
            "http://127.0.0.1:5174"
        ]



    if not SECRET_KEY:
        raise ValueError("CRITICAL CONFIGURATION ERROR: SECRET_KEY environment variable is missing or empty.")

    if len(SECRET_KEY) < 32:
        if not DEBUG and os.getenv("TESTING") != "true":
            raise ValueError("CRITICAL SECURITY ERROR: SECRET_KEY must be at least 32 bytes long in production.")

    if not MONGO_URI:
        raise ValueError("CRITICAL CONFIGURATION ERROR: MONGO_URI environment variable is missing or empty.")

