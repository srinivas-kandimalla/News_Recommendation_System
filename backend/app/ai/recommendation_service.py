from bson import ObjectId
from bson.errors import InvalidId
import numpy as np

from app.models.news_model import news_collection

from app.services.reading_history_service import get_user_read_news
from app.services.analytics_service import get_user_analytics

from app.ai.similarity_service import calculate_similarity
from app.ai.scoring_service import (
    calculate_recency_score,
    calculate_popularity_score,
    calculate_interest_score
)
from app.ai.ranking_service import calculate_hybrid_score


# =====================================================
# Semantic Recommendation
# =====================================================

def get_recommendations(news_id, top_k=5):

    try:
        object_id = ObjectId(news_id)

    except InvalidId:

        return {
            "success": False,
            "message": "Invalid News ID",
            "status_code": 400
        }

    current_news = news_collection.find_one({
        "_id": object_id
    })

    if not current_news:

        return {
            "success": False,
            "message": "News not found",
            "status_code": 404
        }

    if "embedding" not in current_news:

        return {
            "success": False,
            "message": "Embedding not found",
            "status_code": 500
        }

    current_embedding = current_news["embedding"]

    recommendations = []

    for news in news_collection.find():

        if news["_id"] == current_news["_id"]:
            continue

        if "embedding" not in news:
            continue

        semantic_score = calculate_similarity(
            current_embedding,
            news["embedding"]
        )

        recommendations.append({

            "_id": str(news["_id"]),

            "title": news.get("title", ""),

            "content": news.get("content", ""),

            "category": news.get("category", ""),

            "author": news.get("author", ""),

            "source": news.get("source", ""),

            "image_url": news.get("image_url", ""),

            "created_at": news.get("created_at"),

            "semantic_score": round(
                semantic_score,
                4
            )

        })

    recommendations.sort(
        key=lambda x: x["semantic_score"],
        reverse=True
    )

    return {

        "success": True,

        "count": len(recommendations[:top_k]),

        "recommendations": recommendations[:top_k],

        "status_code": 200

    }


# =====================================================
# Personalized Recommendation
# =====================================================

def get_personalized_recommendations(
    user_id,
    top_k=5
):

    read_news_ids = get_user_read_news(user_id)

    if not read_news_ids:

        return {

            "success": False,

            "message": "No reading history found",

            "status_code": 404

        }

    user_embeddings = []

    for news_id in read_news_ids:

        news = news_collection.find_one({
            "_id": news_id
        })

        if news and "embedding" in news:

            user_embeddings.append(
                news["embedding"]
            )

    if not user_embeddings:

        return {

            "success": False,

            "message": "No embeddings found",

            "status_code": 404

        }

    user_profile = np.mean(
        user_embeddings,
        axis=0
    )

    analytics = get_user_analytics(user_id)

    favorite_category = None
    favorite_author = None

    if analytics.get("success"):

        favorite_category = analytics[
            "analytics"
        ].get("favorite_category")

        favorite_author = analytics[
            "analytics"
        ].get("favorite_author")

    recommendations = []

    unread_news = news_collection.find({

        "_id": {

            "$nin": read_news_ids

        }

    })

    for news in unread_news:

        if "embedding" not in news:
            continue

        semantic_score = calculate_similarity(
            user_profile,
            news["embedding"]
        )

        recency_score = calculate_recency_score(
            news.get("created_at")
        )

        popularity_score = calculate_popularity_score(
            news["_id"]
        )

        interest_score = calculate_interest_score(

            news,

            favorite_category,

            favorite_author

        )

        hybrid_score = calculate_hybrid_score(

            semantic_score,

            recency_score,

            popularity_score,

            interest_score

        )

        recommendations.append({

            "_id": str(news["_id"]),

            "title": news.get("title", ""),

            "content": news.get("content", ""),

            "category": news.get("category", ""),

            "author": news.get("author", ""),

            "source": news.get("source", ""),

            "image_url": news.get("image_url", ""),

            "created_at": news.get("created_at"),

            "semantic_score": round(
                semantic_score,
                4
            ),

            "recency_score": round(
                recency_score,
                4
            ),

            "popularity_score": round(
                popularity_score,
                4
            ),

            "interest_score": round(
                interest_score,
                4
            ),

            "hybrid_score": round(
                hybrid_score,
                4
            )

        })

    recommendations.sort(
        key=lambda x: x["hybrid_score"],
        reverse=True
    )

    return {

        "success": True,

        "count": len(
            recommendations[:top_k]
        ),

        "recommendations": recommendations[:top_k],

        "status_code": 200

    }