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
# Clean & Extract Full Content
# ======================================================

def extract_full_article_text(url):
    """
    Attempt lightweight HTML paragraph extraction from original article URL
    if API returns truncated snippet ending with '...'.
    """
    if not url:
        return ""
    try:
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
        res = requests.get(url, headers=headers, timeout=4)
        if res.status_code == 200:
            html = res.text
            # Extract text inside <p> tags
            paragraphs = re.findall(r'<p[^>]*>(.*?)</p>', html, flags=re.DOTALL | re.IGNORECASE)
            clean_paragraphs = []
            for p in paragraphs:
                # Remove nested HTML tags
                text_only = re.sub(r'<[^>]+>', '', p).strip()
                # Filter out short menu/footer items
                if len(text_only) > 60 and not text_only.startswith("Copyright") and not text_only.startswith("Subscribe"):
                    clean_paragraphs.append(text_only)
            
            if clean_paragraphs:
                return "\n\n".join(clean_paragraphs[:10]) # Up to 10 main paragraphs
    except Exception as e:
        logger.debug(f"Full text extraction skipped for {url}: {e}")
    return ""


def clean_content(text):
    if not text:
        return ""
    import html
    # Decode HTML entities (&amp; -> &, &quot; -> ", etc.)
    cleaned = html.unescape(text)

    # Strip web navigation / promo header artifacts from GNews descriptions
    cleaned = re.sub(r'^[A-Z0-9_\-\s|]{3,40}(Home|News|Share|Like|Follow|Google|Yahoo|Bursa).*?(Google|Yahoo|KUALA|REUTERS|AP|AFP|—|-|:)\s*', '', cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r'Make .*? your preferred source on Google\s*', '', cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r'Follow us on .*?\s*', '', cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r'Click here to .*?\s*', '', cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r"\s*\[\+?\d+\s+chars\]", "", cleaned, flags=re.IGNORECASE)
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


SUPPORTED_CATEGORIES = [
    "general",
    "technology",
    "business",
    "world",
    "sports",
    "entertainment",
    "science",
    "health"
]


def get_next_rotation_categories():
    categories_per_run = getattr(Config, "NEWS_CATEGORIES_PER_RUN", 2)
    try:
        from app.database.db import db
        state = db["system_state"].find_one({"_id": "gnews_rotation"}) or {}
        start_index = state.get("next_index", 0) % len(SUPPORTED_CATEGORIES)
        cycle_count = state.get("cycle_count", 0)
    except Exception as e:
        logger.warning(f"Failed to read rotation state from MongoDB, defaulting to index 0: {e}")
        start_index = 0
        cycle_count = 0

    selected = []
    for i in range(categories_per_run):
        cat_idx = (start_index + i) % len(SUPPORTED_CATEGORIES)
        selected.append(SUPPORTED_CATEGORIES[cat_idx])

    next_index = (start_index + categories_per_run) % len(SUPPORTED_CATEGORIES)
    next_cycle = cycle_count + 1

    try:
        from app.database.db import db
        db["system_state"].update_one(
            {"_id": "gnews_rotation"},
            {"$set": {"next_index": next_index, "cycle_count": next_cycle}},
            upsert=True
        )
    except Exception as e:
        logger.warning(f"Failed to update rotation state in MongoDB: {e}")

    logger.info(f"GNews Fetch Cycle #{next_cycle}: Selected categories {selected} (Max requests: {categories_per_run})")
    return selected, next_cycle


# ======================================================
# Fetch Latest News
# ======================================================

def fetch_latest_news():

    logger.info("Fetching latest news from GNews...")

    selected_categories, cycle_number = get_next_rotation_categories()
    categories_per_run = getattr(Config, "NEWS_CATEGORIES_PER_RUN", 2)

    url = "https://gnews.io/api/v4/top-headlines"
    headers = {
        "User-Agent": "AI-News-Recommendation-System/1.0"
    }

    all_articles = []
    seen_urls = set()
    requests_made = 0

    for cat in selected_categories:
        if requests_made >= categories_per_run:
            break

        params = {
            "category": cat,
            "lang": "en",
            "max": 10,
            "apikey": Config.GNEWS_API_KEY
        }

        try:
            requests_made += 1
            logger.info(f"GNews Request {requests_made}/{categories_per_run}: fetching category '{cat}'")
            response = requests.get(
                url,
                params=params,
                headers=headers,
                timeout=15
            )

            if response.status_code == 429:
                logger.warning(f"GNews Rate Limit hit (HTTP 429) on category '{cat}'. Halting further requests for cycle #{cycle_number}.")
                break

            if response.status_code == 200:
                data = response.json()
                for article in data.get("articles", []):
                    article_url = article.get("url")
                    if article_url and article_url not in seen_urls:
                        seen_urls.add(article_url)
                        all_articles.append(article)
            else:
                logger.warning(f"GNews API returned HTTP {response.status_code} for category '{cat}'")

        except Exception as e:
            logger.warning(f"GNews Fetch Error for category '{cat}': {e}")

    if not all_articles:
        return {
            "success": True,
            "message": f"Fetch cycle #{cycle_number} completed - 0 new articles returned from GNews (requests made: {requests_made})",
            "cycle_number": cycle_number,
            "categories_fetched": selected_categories,
            "requests_made": requests_made,
            "inserted": 0,
            "skipped": 0,
            "failed": 0,
            "total": 0,
            "status_code": 200
        }

    inserted = 0
    skipped = 0
    failed = 0

    for article in all_articles:

        article_url = article.get("url")

        if not article_url:
            continue

        title = article.get("title", "").strip()

        if not title:
            continue

        description = clean_content(article.get("description", ""))
        raw_content = clean_content(article.get("content", ""))

        # If API returns truncated snippet (ends with '...' or short), attempt full text extraction from article URL
        scraped_text = ""
        if not raw_content or raw_content.endswith("...") or len(raw_content) < 250:
            scraped_text = extract_full_article_text(article_url)

        content = (
            scraped_text
            or raw_content
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

    logger.info(f"Fetch Cycle #{cycle_number} Completed - Categories: {selected_categories}, Requests: {requests_made}, Inserted: {inserted}, Skipped: {skipped}, Failed: {failed}")

    return {

        "success": True,

        "message": "Latest news fetched successfully",

        "cycle_number": cycle_number,

        "categories_fetched": selected_categories,

        "requests_made": requests_made,

        "inserted": inserted,

        "skipped": skipped,

        "failed": failed,

        "total": len(all_articles),

        "status_code": 200

    }