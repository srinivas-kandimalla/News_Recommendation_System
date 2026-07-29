from flask import current_app

def home():
    return {
        "project": "Context-Aware Personalized News Recommendation System",
        "status": "Backend Running Successfully 🚀",
        "version": "0.5.0",
        "debug_mode": current_app.config["DEBUG"]
    }