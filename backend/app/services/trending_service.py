from app.models.news_model import news_collection
from app.models.reading_history_model import reading_history_collection
from app.models.bookmark_model import bookmark_collection
from app.models.reaction_model import reaction_collection


def get_trending_news(top_k=5):

    trending = []

    for news in news_collection.find():

        news_id = news["_id"]

        reads = reading_history_collection.count_documents({
            "news_id": news_id
        })

        bookmarks = bookmark_collection.count_documents({
            "news_id": news_id
        })

        likes = reaction_collection.count_documents({
            "news_id": news_id,
            "reaction": "like"
        })

        dislikes = reaction_collection.count_documents({
            "news_id": news_id,
            "reaction": "dislike"
        })

        score = (
            reads * 1 +
            bookmarks * 2 +
            likes * 3 -
            dislikes * 1
        )

        trending.append({
            "_id": str(news_id),
            "title": news.get("title", ""),
            "category": news.get("category", ""),
            "author": news.get("author", ""),
            "image_url": news.get("image_url", ""),
            "reads": reads,
            "bookmarks": bookmarks,
            "likes": likes,
            "dislikes": dislikes,
            "trending_score": score
        })

    trending.sort(
        key=lambda x: x["trending_score"],
        reverse=True
    )

    return {
        "success": True,
        "trending_news": trending[:top_k],
        "status_code": 200
    }