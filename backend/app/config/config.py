import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    SECRET_KEY = os.getenv("SECRET_KEY")
    DEBUG = os.getenv("DEBUG") == "True"
    MONGO_URI = os.getenv("MONGO_URI")

print("SECRET_KEY =", Config.SECRET_KEY)