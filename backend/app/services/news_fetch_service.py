import logging
import re
import requests
from datetime import datetime
from pymongo.errors import DuplicateKeyError

from app.config.config import Config
from app.models.news_model import news_collection
from app.ai.embedding_service import generate_embedding

logger = logging.getLogger(__name__)


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
        ],

        "Politics": [
            "politics", "election", "government",
            "parliament", "minister", "president",
            "democrat", "republican", "senate"
        ],

        "World": [
            "world", "global", "international",
            "un", "united nations", "diplomacy", "foreign"
        ]
    }

    for category, keywords in categories.items():
        for word in keywords:
            pattern = r"\b" + re.escape(word) + r"\b"
            if re.search(pattern, text):
                return category

    return "General"


# ======================================================
# Clean Content Artifacts
# ======================================================

def clean_content(text):
    if not text:
        return ""
    # Strip [+1234 chars] artifacts from GNews API
    cleaned = re.sub(r"\s*\[\+\d+\s+chars\]", "", text)
    return cleaned.strip()


def extract_source(article):
    source_obj = article.get("source")
    if isinstance(source_obj, dict):
        val = source_obj.get("name") or source_obj.get("url")
        if val and str(val).strip():
            return str(val).strip()
    elif isinstance(source_obj, str) and source_obj.strip():
        return source_obj.strip()

    publisher_obj = article.get("publisher")
    if isinstance(publisher_obj, dict):
        val = publisher_obj.get("name") or publisher_obj.get("url")
        if val and str(val).strip():
            return str(val).strip()
    elif isinstance(publisher_obj, str) and publisher_obj.strip():
        return publisher_obj.strip()

    return "Unknown"


# ======================================================
# Fetch Latest News
# ======================================================

def fetch_latest_news():

    logger.info("Fetching latest news from GNews...")

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

        logger.error(f"GNews Fetch Error: {e}")

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

        description = clean_content(article.get("description", ""))

        raw_content = clean_content(article.get("content", ""))

        content = (
            raw_content
            or description
            or title
        )

        image_url = article.get("image", "")

        source = extract_source(article)

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

        # Generate embedding safely without losing article if embedding fails
        embedding = None
        try:
            embedding = generate_embedding(
                f"{title}\n\n{content}"
            )
        except Exception as e:
            logger.warning(f"Embedding generation failed for '{title}': {e}")

        # Construct news document
        news_doc = {
            "title": title,
            "content": content,
            "category": category,
            "author": source,
            "source": source,
            "url": article_url,
            "image_url": image_url,
            "published": published,
            "created_at": datetime.utcnow()
        }

        if embedding:
            news_doc["embedding"] = embedding

        # Atomic insertion utilizing DuplicateKeyError on unique URL index
        try:

            news_collection.insert_one(news_doc)

            inserted += 1

            logger.info(f"Inserted article: {title}")

        except DuplicateKeyError:

            skipped += 1

        except Exception as e:

            failed += 1

            logger.error(f"Failed to insert article '{title}': {e}")

    logger.info(f"Fetch Completed - Inserted: {inserted}, Skipped: {skipped}, Failed: {failed}")

    return {

        "success": True,

        "message": "Latest news fetched successfully",

        "inserted": inserted,

        "skipped": skipped,

        "failed": failed,

        "total": len(articles),

        "status_code": 200

    }