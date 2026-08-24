import numpy as np
import logging
from bson import ObjectId

from app.models.news_model import news_collection
from app.ai.similarity_service import calculate_similarity
from app.ai.scoring_service import (
    calculate_recency_score,
    calculate_popularity_score,
    calculate_interest_score
)
from app.ai.ranking_service import calculate_hybrid_score
from app.ai.attention_service import compute_combined_attention_user_vector
from app.ai.context_service import calculate_context_relevance
from app.ai.recommendation_service import apply_diversity_filter
from app.config.config import Config

from app.evaluation.metrics import (
    precision_at_k,
    recall_at_k,
    mrr_at_k,
    ndcg_at_k,
    intra_list_diversity
)

logger = logging.getLogger(__name__)


def evaluate_user_models(user_data, candidates):
    """
    Evaluate Model A, B, C, D, E for a single user using train history and test targets.
    """
    train_ids = user_data["train_news_ids"]
    test_ids = user_data["test_news_ids"]

    # Retrieve train embeddings & categories
    train_articles = list(news_collection.find(
        {"_id": {"$in": train_ids}},
        projection={"embedding": 1, "category": 1, "author": 1}
    ))

    train_id_map = {a["_id"]: a for a in train_articles if "embedding" in a and a["embedding"]}

    train_embs = [train_id_map[nid]["embedding"] for nid in train_ids if nid in train_id_map]
    train_cats = [train_id_map[nid].get("category") for nid in train_ids if nid in train_id_map and train_id_map[nid].get("category")]

    if not train_embs:
        return None

    # Long-term / short-term split of train data
    long_limit = getattr(Config, "LONG_TERM_HISTORY_LIMIT", 50)
    short_limit = getattr(Config, "SHORT_TERM_HISTORY_LIMIT", 5)

    long_embs = train_embs[-long_limit:]
    long_ids = train_ids[-long_limit:]

    short_embs = train_embs[-short_limit:]
    short_ids = train_ids[-short_limit:]
    short_cats = train_cats[-short_limit:]

    # Candidate evaluation loop for unread candidates
    unread_candidates = [c for c in candidates if c["_id"] not in train_ids]

    scores_a, scores_b, scores_c, scores_d = [], [], [], []

    # Model A User Profile: Mean of all train embeddings
    mean_profile_a = np.mean(train_embs, axis=0)

    # Model B User Profile: 0.40 long + 0.60 short profile
    long_vec_b = np.mean(long_embs, axis=0)
    short_vec_b = np.mean(short_embs, axis=0)
    comb_vec_b = (0.40 * long_vec_b) + (0.60 * short_vec_b)
    norm_b = np.linalg.norm(comb_vec_b)
    user_profile_b = comb_vec_b / norm_b if norm_b > 0 else comb_vec_b

    for news in unread_candidates:
        c_emb = news["embedding"]
        cid = str(news["_id"])

        recency = calculate_recency_score(news.get("published"), news.get("created_at"))
        popularity = 0.05  # Standard baseline popularity count fallback
        interest = 0.0

        # Model A: Baseline
        sem_a = calculate_similarity(mean_profile_a, c_emb)
        hybrid_a = calculate_hybrid_score(sem_a, recency, popularity, interest)
        scores_a.append({"id": cid, "score": hybrid_a, "embedding": c_emb})

        # Model B: Long + Short
        sem_b = calculate_similarity(user_profile_b, c_emb)
        hybrid_b = calculate_hybrid_score(sem_b, recency, popularity, interest)
        scores_b.append({"id": cid, "score": hybrid_b, "embedding": c_emb})

        # Model C: Candidate-Aware Attention
        att_vec_c, _ = compute_combined_attention_user_vector(long_embs, short_embs, c_emb, long_ids, short_ids)
        if att_vec_c is not None:
            sem_c = calculate_similarity(att_vec_c, c_emb)
            hybrid_c = calculate_hybrid_score(sem_c, recency, popularity, interest)
            scores_c.append({"id": cid, "score": hybrid_c, "embedding": c_emb})

            # Model D: Context Fusion
            c_rel, _ = calculate_context_relevance(news, short_cats)
            sem_d = max(0.0, min(1.0, sem_c * c_rel))
            hybrid_d = calculate_hybrid_score(sem_d, recency, popularity, interest)
            scores_d.append({
                "_id": news["_id"],
                "id": cid,
                "score": hybrid_d,
                "hybrid_score": hybrid_d,
                "category": news.get("category", ""),
                "embedding": c_emb,
                "title": news.get("title", "")
            })

    # Sort candidates per model
    recs_a = sorted(scores_a, key=lambda x: x["score"], reverse=True)
    recs_b = sorted(scores_b, key=lambda x: x["score"], reverse=True)
    recs_c = sorted(scores_c, key=lambda x: x["score"], reverse=True)
    recs_d = sorted(scores_d, key=lambda x: x["score"], reverse=True)

    # Model E: Apply diversity filter to Model D recommendations
    recs_e = apply_diversity_filter(recs_d, top_k=10)

    # Extract ID lists for top-K metrics
    ids_a = [r["id"] for r in recs_a]
    ids_b = [r["id"] for r in recs_b]
    ids_c = [r["id"] for r in recs_c]
    ids_d = [r["id"] for r in recs_d]
    ids_e = [str(r["_id"]) if "_id" in r else r["id"] for r in recs_e]

    embs_a = [r["embedding"] for r in recs_a]
    embs_b = [r["embedding"] for r in recs_b]
    embs_c = [r["embedding"] for r in recs_c]
    embs_d = [r["embedding"] for r in recs_d]
    embs_e = [r["embedding"] for r in recs_e]

    def compute_all_metrics(rec_ids, rec_embs):
        return {
            "p5": precision_at_k(rec_ids, test_ids, 5),
            "p10": precision_at_k(rec_ids, test_ids, 10),
            "r5": recall_at_k(rec_ids, test_ids, 5),
            "r10": recall_at_k(rec_ids, test_ids, 10),
            "mrr5": mrr_at_k(rec_ids, test_ids, 5),
            "mrr10": mrr_at_k(rec_ids, test_ids, 10),
            "ndcg5": ndcg_at_k(rec_ids, test_ids, 5),
            "ndcg10": ndcg_at_k(rec_ids, test_ids, 10),
            "ild5": intra_list_diversity(rec_embs, 5),
            "ild10": intra_list_diversity(rec_embs, 10)
        }

    return {
        "model_a": compute_all_metrics(ids_a, embs_a),
        "model_b": compute_all_metrics(ids_b, embs_b),
        "model_c": compute_all_metrics(ids_c, embs_c),
        "model_d": compute_all_metrics(ids_d, embs_d),
        "model_e": compute_all_metrics(ids_e, embs_e)
    }
