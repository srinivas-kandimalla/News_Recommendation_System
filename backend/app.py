from flask import Flask

app = Flask(__name__)

@app.route("/")
def home():
    return {
        "project": "Context-Aware Personalized News Recommendation System",
        "status": "Backend Running Successfully 🚀",
        "version": "0.1.0"
    }

if __name__ == "__main__":
    app.run(debug=True)