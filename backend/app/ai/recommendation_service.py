from bson import ObjectId
from bson.errors import InvalidId
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

from app.models.news_model import news_collection
from app.services.reading_history_service import get_user_read_news


def calculate_similarity(embedding1, embedding2):
    similarity = cosine_similarity(
        np.array(embedding1).reshape(1, -1),
        np.array(embedding2).reshape(1, -1)
    )
    return float(similarity[0][0])


# -----------------------------
# Semantic Recommendation
# -----------------------------
def get_recommendations(news_id, top_k=5):

    try:
        object_id = ObjectId(news_id)
    except InvalidId:
        return {
            "success": False,
            "message": "Invalid News ID",
            "status_code": 400
        }

    current_news = news_collection.find_one({"_id": object_id})

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
            "title": news["title"],
            "category": news["category"],
            "author": news["author"],
            "image_url": news.get("image_url", ""),
            "similarity_score": round(similarity, 4)
        })

    recommendations.sort(
        key=lambda x: x["similarity_score"],
        reverse=True
    )

    return {
        "success": True,
        "recommendations": recommendations[:top_k],
        "status_code": 200
    }


# -----------------------------
# Personalized Recommendation
# -----------------------------
def get_personalized_recommendations(user_id, top_k=5):

    read_news_ids = get_user_read_news(user_id)

    if not read_news_ids:
        return {
            "success": False,
            "message": "No reading history found",
            "status_code": 404
        }

    user_embeddings = []

    # Get embeddings of read news
    for news_id in read_news_ids:

        news = news_collection.find_one({"_id": ObjectId(news_id)})

        if news and "embedding" in news:
            user_embeddings.append(news["embedding"])

    if len(user_embeddings) == 0:
        return {
            "success": False,
            "message": "No embeddings found",
            "status_code": 404
        }

    # Average embedding = User Interest Profile
    user_profile = np.mean(user_embeddings, axis=0)

    recommendations = []

    unread_news = news_collection.find({
        "_id": {
            "$nin": read_news_ids
        }
    })

    for news in unread_news:

        if "embedding" not in news:
            continue

        similarity = calculate_similarity(
            user_profile,
            news["embedding"]
        )

        recommendations.append({
            "_id": str(news["_id"]),
            "title": news["title"],
            "category": news["category"],
            "author": news["author"],
            "image_url": news.get("image_url", ""),
            "similarity_score": round(similarity, 4)
        })

    recommendations.sort(
        key=lambda x: x["similarity_score"],
        reverse=True
    )

    return {
        "success": True,
        "recommendations": recommendations[:top_k],
        "status_code": 200
    }