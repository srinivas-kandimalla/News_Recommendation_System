from flask import Flask

def create_app():
    app = Flask(__name__)

    @app.route("/")
    def home():
        return {
            "project": "Context-Aware Personalized News Recommendation System",
            "status": "Backend Running Successfully 🚀",
            "version": "0.2.0"
        }

    return app