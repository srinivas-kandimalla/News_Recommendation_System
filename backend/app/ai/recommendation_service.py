from bson import ObjectId
from bson.errors import InvalidId
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

from app.models.news_model import news_collection
from app.services.reading_history_service import get_user_read_news
from app.services.analytics_service import get_user_analytics


# =====================================================
# Cosine Similarity
# =====================================================

def calculate_similarity(embedding1, embedding2):
    similarity = cosine_similarity(
        np.array(embedding1).reshape(1, -1),
        np.array(embedding2).reshape(1, -1)
    )
    return float(similarity[0][0])


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

        similarity = calculate_similarity(
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
            "similarity_score": round(similarity, 4)
        })

    recommendations.sort(
        key=lambda x: x["similarity_score"],
        reverse=True
    )

    return {
        "success": True,
        "count": len(recommendations[:top_k]),
        "recommendations": recommendations[:top_k],
        "status_code": 200
    }


# =====================================================
# Hybrid Personalized Recommendation
# =====================================================

def get_personalized_recommendations(user_id, top_k=5):

    # ---------------------------------
    # Reading History
    # ---------------------------------

    read_news_ids = get_user_read_news(user_id)

    if not read_news_ids:
        return {
            "success": False,
            "message": "No reading history found",
            "status_code": 404
        }

    # ---------------------------------
    # Build User Interest Profile
    # ---------------------------------

    user_embeddings = []

    for news_id in read_news_ids:

        # news_id is already an ObjectId
        news = news_collection.find_one({
            "_id": news_id
        })

        if news and "embedding" in news:
            user_embeddings.append(news["embedding"])

    if not user_embeddings:
        return {
            "success": False,
            "message": "No embeddings found",
            "status_code": 404
        }

    user_profile = np.mean(user_embeddings, axis=0)

    # ---------------------------------
    # User Analytics
    # ---------------------------------

    analytics = get_user_analytics(user_id)

    favorite_category = None

    if analytics.get("success"):
        favorite_category = analytics["analytics"].get(
            "favorite_category"
        )

    # ---------------------------------
    # Generate Recommendations
    # ---------------------------------

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

        hybrid_score = semantic_score

        # Bonus for favourite category
        if (
            favorite_category
            and news.get("category") == favorite_category
        ):
            hybrid_score += 0.15

        recommendations.append({
            "_id": str(news["_id"]),
            "title": news.get("title", ""),
            "content": news.get("content", ""),
            "category": news.get("category", ""),
            "author": news.get("author", ""),
            "source": news.get("source", ""),
            "image_url": news.get("image_url", ""),
            "created_at": news.get("created_at"),
            "similarity_score": round(semantic_score, 4),
            "hybrid_score": round(hybrid_score, 4)
        })

    recommendations.sort(
        key=lambda x: x["hybrid_score"],
        reverse=True
    )

    return {
        "success": True,
        "count": len(recommendations[:top_k]),
        "recommendations": recommendations[:top_k],
        "status_code": 200
    }