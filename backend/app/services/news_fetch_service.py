import requests
from datetime import datetime
from pymongo.errors import DuplicateKeyError

from app.config.config import Config
from app.models.news_model import news_collection
from app.ai.embedding_service import generate_embedding


# ======================================================
# Create Indexes (runs once)
# ======================================================

news_collection.create_index("url", unique=True)
news_collection.create_index("created_at")
news_collection.create_index("category")


# ======================================================
# Detect Category
# ======================================================

def detect_category(title, content):

    text = f"{title} {content}".lower()

    categories = {
        "Technology": [
            "technology", "tech", "ai",
            "artificial intelligence",
            "google", "apple",
            "microsoft", "android",
            "iphone", "tesla",
            "software", "computer",
            "openai", "chatgpt",
            "gemini", "nvidia"
        ],

        "Sports": [
            "cricket", "football",
            "tennis", "ipl",
            "fifa", "nba",
            "olympics", "world cup",
            "match"
        ],

        "Business": [
            "business", "finance",
            "economy", "stock",
            "market", "bank",
            "investment", "trade"
        ],

        "Health": [
            "health", "medicine",
            "covid", "doctor",
            "hospital", "medical",
            "disease"
        ],

        "Entertainment": [
            "movie", "film",
            "actor", "actress",
            "music", "hollywood",
            "bollywood",
            "netflix",
            "amazon prime"
        ],

        "Science": [
            "science", "space",
            "research", "astronomy",
            "planet", "nasa"
        ]
    }

    for category, keywords in categories.items():

        if any(word in text for word in keywords):
            return category

    return "General"


# ======================================================
# Fetch Latest News
# ======================================================

def fetch_latest_news():

    print("=" * 60)
    print("🔄 Fetching latest news from GNews...")

    url = "https://gnews.io/api/v4/top-headlines"

    params = {
        "country": "in",
        "lang": "en",
        "max": 10,
        "apikey": Config.GNEWS_API_KEY
    }

    headers = {
        "User-Agent": "AI-News-Recommendation-System/1.0"
    }

    try:

        response = requests.get(
            url,
            params=params,
            headers=headers,
            timeout=20
        )

        response.raise_for_status()

        data = response.json()

    except Exception as e:

        print("❌ GNews Error:", e)

        return {
            "success": False,
            "message": str(e),
            "status_code": 500
        }

    articles = data.get("articles", [])

    inserted = 0
    skipped = 0
    failed = 0

    for article in articles:

        article_url = article.get("url")

        if not article_url:
            continue

        title = article.get("title", "").strip()

        if not title:
            continue

        if news_collection.find_one({"url": article_url}):
            skipped += 1
            continue

        description = article.get("description", "")

        content = (
            article.get("content")
            or description
            or title
        )

        image_url = article.get("image", "")

        source = article.get(
            "source",
            {}
        ).get(
            "name",
            "Unknown"
        )

        category = detect_category(
            title,
            content
        )

        published = article.get("publishedAt")

        try:
            if published:
                published = datetime.fromisoformat(
                    published.replace("Z", "+00:00")
                )
        except Exception:
            published = datetime.utcnow()

        try:

            embedding = generate_embedding(
                f"{title}\n\n{content}"
            )

            news_collection.insert_one({

                "title": title,

                "content": content,

                "category": category,

                "author": source,

                "source": source,

                "url": article_url,

                "image_url": image_url,

                "published": published,

                "embedding": embedding,

                "created_at": datetime.utcnow()

            })

            inserted += 1

            print(f"📰 {title}")

        except DuplicateKeyError:

            skipped += 1

        except Exception as e:

            failed += 1

            print(f"❌ Failed: {title}")
            print(e)

    print("=" * 60)
    print("✅ Fetch Completed")
    print(f"Inserted : {inserted}")
    print(f"Skipped  : {skipped}")
    print(f"Failed   : {failed}")
    print("=" * 60)

    return {

        "success": True,

        "message": "Latest news fetched successfully",

        "inserted": inserted,

        "skipped": skipped,

        "failed": failed,

        "total": len(articles),

        "status_code": 200

    }