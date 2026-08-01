import os
from dotenv import load_dotenv

load_dotenv()


class Config:
    SECRET_KEY = os.getenv("SECRET_KEY")
    DEBUG = os.getenv("DEBUG") == "True"
    MONGO_URI = os.getenv("MONGO_URI")

    # NEW
    GNEWS_API_KEY = os.getenv("GNEWS_API_KEY")

