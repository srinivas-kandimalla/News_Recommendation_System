from bson import ObjectId
from bson.errors import InvalidId
import numpy as np

from app.models.news_model import news_collection
from app.models.reading_history_model import reading_history_collection
from app.models.bookmark_model import bookmark_collection
from app.models.reaction_model import reaction_collection

from app.services.reading_history_service import get_user_read_news
from app.services.analytics_service import get_user_analytics
from app.services.trending_service import get_trending_news

from app.ai.similarity_service import calculate_similarity
from app.ai.scoring_service import (
    calculate_recency_score,
    calculate_popularity_score,
    calculate_interest_score
)
from app.ai.ranking_service import calculate_hybrid_score
from app.ai.explanation_service import generate_reason
from app.ai.user_profile_service import (
    build_long_term_profile,
    build_short_term_profile,
    combine_user_profiles,
    fetch_user_history_embeddings
)
from app.ai.attention_service import (
    compute_combined_attention_user_vector
)
from app.ai.context_service import calculate_context_relevance





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

            "created_at": news.get("published") or news.get("created_at"),

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


def apply_diversity_filter(recommendations, top_k):
    filtered_recommendations = []
    category_counts = {}
    source_counts = {}

    # Pass 1: Strict diversity caps (max 2 per category, max 2 per source)
    for item in recommendations:
        category = item.get("category", "")
        source = item.get("source", "")

        cat_count = category_counts.get(category, 0)
        src_count = source_counts.get(source, 0)

        if cat_count < 2 and src_count < 2:
            filtered_recommendations.append(item)
            category_counts[category] = cat_count + 1
            source_counts[source] = src_count + 1

            if len(filtered_recommendations) == top_k:
                break

    # Pass 2: Fill top_k slots if diversity caps restricted output
    if len(filtered_recommendations) < top_k:
        added_ids = {r["_id"] for r in filtered_recommendations}
        for item in recommendations:
            if item["_id"] not in added_ids:
                filtered_recommendations.append(item)
                added_ids.add(item["_id"])
                if len(filtered_recommendations) == top_k:
                    break

    return filtered_recommendations


# =====================================================
# Personalized Recommendation
# =====================================================

def get_personalized_recommendations(
    user_id,
    top_k=5
):

    read_news_ids = get_user_read_news(user_id)

    # Cold-Start Fallback: If user has zero reading history, return trending news
    if not read_news_ids:
        trending_res = get_trending_news(top_k=top_k * 4)
        if trending_res.get("success") and trending_res.get("trending_news"):
            cold_start_candidates = []
            for item in trending_res["trending_news"]:
                recency_val = calculate_recency_score(item.get("published"), item.get("created_at"))
                reads_val = item.get("reads", 0)
                likes_val = item.get("likes", 0)
                bm_val = item.get("bookmarks", 0)
                raw_pop = reads_val * 1 + likes_val * 2 + bm_val * 2
                popularity_val = min(raw_pop / 20.0, 1.0)
                pop_val = item.get("trending_score", 0.0)

                created_at_date = item.get("published") or item.get("created_at")
                if hasattr(created_at_date, "isoformat"):
                    created_at_date = created_at_date.isoformat()

                cold_start_candidates.append({
                    "_id": str(item.get("_id")),
                    "title": item.get("title", ""),
                    "content": item.get("content", ""),
                    "category": item.get("category", ""),
                    "author": item.get("author", ""),
                    "source": item.get("source", ""),
                    "image_url": item.get("image_url", ""),
                    "created_at": created_at_date,
                    "semantic_score": 0.0,
                    "recency_score": round(recency_val, 4),
                    "popularity_score": round(popularity_val, 4),
                    "interest_score": 0.0,
                    "hybrid_score": round(pop_val, 4),
                    "reason": "Recommended because these are currently trending."
                })

            filtered_recs = apply_diversity_filter(cold_start_candidates, top_k)
            return {
                "success": True,
                "count": len(filtered_recs),
                "recommendations": filtered_recs,
                "status_code": 200
            }

        # If user has zero reading history and news database is empty, return empty 200 OK array
        return {
            "success": True,
            "count": 0,
            "recommendations": [],
            "status_code": 200
        }

    long_embeddings, long_ids, short_embeddings, short_ids, short_categories = fetch_user_history_embeddings(user_id)

    if not long_embeddings and not short_embeddings:
        return {
            "success": False,
            "message": "No embeddings found for user history",
            "status_code": 404
        }

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

    # Pre-aggregate popularity counts for candidate scoring
    read_counts = {
        item["_id"]: item["count"]
        for item in reading_history_collection.aggregate([
            {"$group": {"_id": "$news_id", "count": {"$sum": 1}}}
        ])
    }

    like_counts = {
        item["_id"]: item["count"]
        for item in reaction_collection.aggregate([
            {"$match": {"reaction": "like"}},
            {"$group": {"_id": "$news_id", "count": {"$sum": 1}}}
        ])
    }

    bookmark_counts = {
        item["_id"]: item["count"]
        for item in bookmark_collection.aggregate([
            {"$group": {"_id": "$news_id", "count": {"$sum": 1}}}
        ])
    }

    recommendations = []

    unread_news = news_collection.find({

        "_id": {

            "$nin": read_news_ids

        }

    })

    for news in unread_news:

        if "embedding" not in news:
            continue

        c_emb = news["embedding"]

        # Compute candidate-aware attention vector & debug metrics
        att_user_vector, att_debug = compute_combined_attention_user_vector(
            long_embeddings,
            short_embeddings,
            c_emb,
            long_ids,
            short_ids
        )

        if att_user_vector is None:
            continue

        raw_semantic_score = calculate_similarity(
            att_user_vector,
            c_emb
        )

        # Context Fusion: Refine semantic score with deterministic context relevance factor
        c_relevance, context_debug = calculate_context_relevance(
            news,
            short_categories
        )

        # Bounded context-fused semantic score in [0.0, 1.0]
        semantic_score = max(0.0, min(1.0, raw_semantic_score * c_relevance))

        short_term_sim = att_debug.get("short_term", {}).get("max_similarity", 0.0)
        long_term_sim = att_debug.get("long_term", {}).get("max_similarity", 0.0)

        recency_score = calculate_recency_score(
            news.get("published"),
            news.get("created_at")
        )

        popularity_score = calculate_popularity_score(
            news["_id"],
            reads=read_counts.get(news["_id"], 0),
            likes=like_counts.get(news["_id"], 0),
            bookmarks=bookmark_counts.get(news["_id"], 0)
        )

        interest_score = calculate_interest_score(

            news,

            favorite_category,

            favorite_author

        )

        reason = generate_reason(
            news,
            semantic_score,
            popularity_score,
            recency_score,
            interest_score,
            short_term_sim=short_term_sim,
            long_term_sim=long_term_sim
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

            "created_at": (news.get("published") or news.get("created_at")).isoformat() if hasattr(news.get("published") or news.get("created_at"), "isoformat") else (news.get("published") or news.get("created_at")),

            "semantic_score": round(
                semantic_score,
                4
            ),

            "raw_semantic_score": round(
                raw_semantic_score,
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
            ),

            "reason": reason,

            "attention_debug": att_debug,

            "context_debug": context_debug

        })

    recommendations.sort(
        key=lambda x: x["hybrid_score"],
        reverse=True
    )

    filtered_recommendations = apply_diversity_filter(recommendations, top_k)

    return {

        "success": True,

        "count": len(filtered_recommendations),

        "recommendations": filtered_recommendations,

        "status_code": 200

    }