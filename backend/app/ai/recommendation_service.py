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

from app.config.config import Config
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
from app.ai.context_service import (
    calculate_context_relevance,
    build_temporal_context,
    build_recent_interest_context
)
from app.ai.feature_extractor import extract_candidate_features, extract_candidate_features_batch
from app.ai.neural_ranker import neural_ranker_service





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

    unread_news = list(news_collection.find(
        {"_id": {"$nin": read_news_ids}},
        projection={
            "_id": 1, "category": 1, "author": 1, "source": 1,
            "published": 1, "created_at": 1, "embedding": 1
        }
    ))

    if not unread_news:
        return {
            "success": True,
            "count": 0,
            "recommendations": [],
            "status_code": 200
        }

    # Pre-build & pre-normalize user history matrices ONCE outside candidate loop (eliminates 359ms overhead)
    long_mat_tuple = None
    if long_embeddings:
        long_mat = np.array(long_embeddings, dtype=np.float32)
        if long_mat.ndim == 2 and len(long_mat) > 0:
            l_norms = np.linalg.norm(long_mat, axis=1, keepdims=True)
            l_norms = np.where(l_norms == 0, 1.0, l_norms)
            long_units = long_mat / l_norms
            long_mat_tuple = (long_mat, long_units)

    short_mat_tuple = None
    if short_embeddings:
        short_mat = np.array(short_embeddings, dtype=np.float32)
        if short_mat.ndim == 2 and len(short_mat) > 0:
            s_norms = np.linalg.norm(short_mat, axis=1, keepdims=True)
            s_norms = np.where(s_norms == 0, 1.0, s_norms)
            short_units = short_mat / s_norms
            short_mat_tuple = (short_mat, short_units)

    # Pre-compute temporal context and category distribution ONCE outside candidate loop
    temporal_ctx = build_temporal_context()
    category_dist = build_recent_interest_context(short_categories)

    # Extract candidate data lists
    valid_news = []
    c_embs = []
    u_atts = []
    sem_scores = []
    raw_sem_scores = []
    c_rels = []
    recent_cat_ratios = []
    temp_affs = []
    rec_scores = []
    pop_scores = []
    int_scores = []
    att_debugs = []
    context_debugs = []

    for news in unread_news:
        if "embedding" not in news:
            continue

        c_emb = news["embedding"]
        att_user_vector, att_debug = compute_combined_attention_user_vector(
            long_mat_tuple if long_mat_tuple is not None else long_embeddings,
            short_mat_tuple if short_mat_tuple is not None else short_embeddings,
            c_emb,
            long_ids,
            short_ids
        )

        if att_user_vector is None:
            continue

        raw_sem = calculate_similarity(att_user_vector, c_emb)
        c_rel, context_debug = calculate_context_relevance(
            news, short_categories, temporal_ctx=temporal_ctx, category_dist=category_dist
        )
        sem_score = max(0.0, min(1.0, raw_sem * c_rel))

        rec_val = calculate_recency_score(news.get("published"), news.get("created_at"))
        pop_val = calculate_popularity_score(
            news["_id"],
            reads=read_counts.get(news["_id"], 0),
            likes=like_counts.get(news["_id"], 0),
            bookmarks=bookmark_counts.get(news["_id"], 0)
        )
        int_val = calculate_interest_score(news, favorite_category, favorite_author)

        recent_cat_ratio = context_debug.get("recent_category_ratio", 0.0)
        temp_affinity = context_debug.get("temporal_affinity", 1.0)

        valid_news.append(news)
        c_embs.append(c_emb)
        u_atts.append(att_user_vector)
        sem_scores.append(sem_score)
        raw_sem_scores.append(raw_sem)
        c_rels.append(c_rel)
        recent_cat_ratios.append(recent_cat_ratio)
        temp_affs.append(temp_affinity)
        rec_scores.append(rec_val)
        pop_scores.append(pop_val)
        int_scores.append(int_val)
        att_debugs.append(att_debug)
        context_debugs.append(context_debug)

    if not valid_news:
        return {
            "success": True,
            "count": 0,
            "recommendations": [],
            "status_code": 200
        }

    # Candidate Pre-Filtering (Optional & Configurable, Default 0 = Disabled)
    prefilter_top_n = getattr(Config, "CANDIDATE_PREFILTER_TOP_N", 0)
    candidate_indices = list(range(len(valid_news)))

    if prefilter_top_n > 0 and len(valid_news) > prefilter_top_n:
        # Pre-filter candidate pool by heuristic context-fused semantic score
        cheap_scores = np.array(sem_scores, dtype=np.float32)
        top_prefilter_indices = np.argsort(-cheap_scores)[:prefilter_top_n]
        candidate_indices = top_prefilter_indices.tolist()

    # Subset candidates for neural feature extraction & ranking
    sub_c_embs = [c_embs[idx] for idx in candidate_indices]
    sub_u_atts = [u_atts[idx] for idx in candidate_indices]
    sub_sem_scores = [raw_sem_scores[idx] for idx in candidate_indices]
    sub_c_rels = [c_rels[idx] for idx in candidate_indices]
    sub_recent_cat_ratios = [recent_cat_ratios[idx] for idx in candidate_indices]
    sub_temp_affs = [temp_affs[idx] for idx in candidate_indices]
    sub_rec_scores = [rec_scores[idx] for idx in candidate_indices]
    sub_pop_scores = [pop_scores[idx] for idx in candidate_indices]
    sub_int_scores = [int_scores[idx] for idx in candidate_indices]
    sub_sem_fused = [sem_scores[idx] for idx in candidate_indices]

    # Vectorized Batched Feature Matrix Construction
    X_batch = extract_candidate_features_batch(
        sub_c_embs,
        sub_u_atts,
        sub_sem_scores,
        sub_c_rels,
        sub_recent_cat_ratios,
        sub_temp_affs,
        sub_rec_scores,
        sub_pop_scores,
        sub_int_scores
    )

    # Batched PyTorch Neural Inference (Single Matrix Forward Pass)
    n_probas = neural_ranker_service.predict_proba_batch(X_batch)

    # Vectorized Hybrid Score Calculation
    sub_rec_arr = np.array(sub_rec_scores, dtype=np.float64)
    sub_pop_arr = np.array(sub_pop_scores, dtype=np.float64)
    sub_int_arr = np.array(sub_int_scores, dtype=np.float64)

    if n_probas is not None and len(n_probas) == len(candidate_indices):
        hybrid_scores = (0.60 * n_probas) + (0.20 * sub_rec_arr) + (0.10 * sub_pop_arr) + (0.10 * sub_int_arr)
    else:
        sub_sem_arr = np.array(sub_sem_fused, dtype=np.float64)
        hybrid_scores = (0.60 * sub_sem_arr) + (0.20 * sub_rec_arr) + (0.10 * sub_pop_arr) + (0.10 * sub_int_arr)

    # Sort candidate pool descending by hybrid score
    sorted_order = np.argsort(-hybrid_scores)

    max_payloads_to_create = min(top_k * 4, len(sorted_order))
    top_candidate_ids = [valid_news[candidate_indices[sorted_order[rank_idx]]]["_id"] for rank_idx in range(max_payloads_to_create)]

    # Batch fetch full article metadata (title, content, image_url) ONLY for Top-20 candidate items
    top_full_docs = {
        doc["_id"]: doc
        for doc in news_collection.find(
            {"_id": {"$in": top_candidate_ids}},
            projection={
                "_id": 1, "title": 1, "content": 1, "category": 1,
                "author": 1, "source": 1, "image_url": 1, "published": 1,
                "created_at": 1
            }
        )
    }

    candidate_payloads = []
    for rank_idx in range(max_payloads_to_create):
        sub_i = sorted_order[rank_idx]
        orig_i = candidate_indices[sub_i]
        news_id = valid_news[orig_i]["_id"]
        full_news = top_full_docs.get(news_id, valid_news[orig_i])

        short_term_sim = att_debugs[orig_i].get("short_term", {}).get("max_similarity", 0.0)
        long_term_sim = att_debugs[orig_i].get("long_term", {}).get("max_similarity", 0.0)

        reason = generate_reason(
            full_news,
            sem_scores[orig_i],
            pop_scores[orig_i],
            rec_scores[orig_i],
            int_scores[orig_i],
            short_term_sim=short_term_sim,
            long_term_sim=long_term_sim
        )

        created_at_val = full_news.get("published") or full_news.get("created_at")
        if hasattr(created_at_val, "isoformat"):
            created_at_val = created_at_val.isoformat()

        candidate_payloads.append({
            "_id": str(full_news["_id"]),
            "title": full_news.get("title", ""),
            "content": full_news.get("content", ""),
            "category": full_news.get("category", ""),
            "author": full_news.get("author", ""),
            "source": full_news.get("source", ""),
            "image_url": full_news.get("image_url", ""),
            "created_at": created_at_val,
            "semantic_score": round(float(sem_scores[orig_i]), 4),
            "raw_semantic_score": round(float(raw_sem_scores[orig_i]), 4),
            "recency_score": round(float(rec_scores[orig_i]), 4),
            "popularity_score": round(float(pop_scores[orig_i]), 4),
            "interest_score": round(float(int_scores[orig_i]), 4),
            "hybrid_score": round(float(hybrid_scores[sub_i]), 4),
            "reason": reason,
            "attention_debug": att_debugs[orig_i],
            "context_debug": context_debugs[orig_i]
        })

    filtered_recommendations = apply_diversity_filter(candidate_payloads, top_k)

    return {
        "success": True,
        "count": len(filtered_recommendations),
        "recommendations": filtered_recommendations,
        "status_code": 200
    }