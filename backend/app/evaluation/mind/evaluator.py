import math
import numpy as np
import logging
from sklearn.metrics import roc_auc_score
from sklearn.metrics.pairwise import cosine_similarity

from app.ai.attention_service import compute_combined_attention_user_vector
from app.ai.similarity_service import calculate_similarity
from app.evaluation.metrics import (
    precision_at_k,
    recall_at_k,
    mrr_at_k,
    ndcg_at_k,
    intra_list_diversity
)

logger = logging.getLogger(__name__)


def evaluate_mind_behavior_impression(behavior, news_dict, k=10):
    """
    Evaluate Model A, B, C, D, E on a single MIND behavior impression candidate set.
    """
    history_ids = behavior["history"]
    candidate_ids = behavior["candidates"]
    labels = behavior["labels"]

    # Filter available history embeddings
    history_embs = [news_dict[nid]["embedding"] for nid in history_ids if nid in news_dict and "embedding" in news_dict[nid]]
    history_cats = [news_dict[nid]["category"] for nid in history_ids if nid in news_dict and "category" in news_dict[nid]]

    # Candidate setup
    cand_info = []
    for cid, label in zip(candidate_ids, labels):
        if cid in news_dict and "embedding" in news_dict[cid]:
            cand_info.append({
                "id": cid,
                "embedding": news_dict[cid]["embedding"],
                "category": news_dict[cid].get("category", ""),
                "label": label
            })

    if not cand_info:
        return None

    # Identify positive ground truth target clicked news IDs
    target_clicked_ids = [c["id"] for c in cand_info if c["label"] == 1]
    cand_labels = [c["label"] for c in cand_info]

    # Cold-start fallback if history is empty
    if not history_embs:
        return None

    # Model A User Profile: Mean of all history embeddings
    mean_profile_a = np.mean(history_embs, axis=0)

    # Model B User Profile: Long (0.40) + Short (0.60) Profile split
    long_embs = history_embs[-50:]
    long_ids = history_ids[-50:]
    short_embs = history_embs[-5:]
    short_ids = history_ids[-5:]
    short_cats = history_cats[-5:]

    long_vec_b = np.mean(long_embs, axis=0)
    short_vec_b = np.mean(short_embs, axis=0)
    comb_vec_b = (0.40 * long_vec_b) + (0.60 * short_vec_b)
    norm_b = np.linalg.norm(comb_vec_b)
    profile_b = comb_vec_b / norm_b if norm_b > 0 else comb_vec_b

    scores_a, scores_b, scores_c, scores_d, scores_e = [], [], [], [], []

    for c in cand_info:
        c_emb = c["embedding"]
        cid = c["id"]
        c_cat = c["category"]

        # Model A: Baseline Mean Similarity
        s_a = calculate_similarity(mean_profile_a, c_emb)
        scores_a.append((cid, s_a, c_emb))

        # Model B: Long+Short Profile Similarity
        s_b = calculate_similarity(profile_b, c_emb)
        scores_b.append((cid, s_b, c_emb))

        # Model C: Candidate-Aware Softmax Attention
        att_vec, _ = compute_combined_attention_user_vector(long_embs, short_embs, c_emb, long_ids, short_ids)
        s_c = calculate_similarity(att_vec, c_emb) if att_vec is not None else s_b
        scores_c.append((cid, s_c, c_emb))

        # Model D: Attention + Category Density Context
        cat_density = short_cats.count(c_cat) / float(len(short_cats)) if short_cats else 0.0
        c_factor = max(0.80, min(1.25, 1.0 + (0.20 * cat_density)))
        s_d = max(0.0, min(1.0, s_c * c_factor))
        scores_d.append((cid, s_d, c_emb))
        scores_e.append({"id": cid, "score": s_d, "category": c_cat, "embedding": c_emb})

    def rank_and_metrics(scored_tuple_list):
        # Sort candidates descending by predicted score
        sorted_list = sorted(scored_tuple_list, key=lambda x: x[1], reverse=True)
        rec_ids = [x[0] for x in sorted_list]
        rec_scores = [x[1] for x in sorted_list]
        rec_embs = [x[2] for x in sorted_list]

        # Calculate AUC if impression contains both 0 and 1 classes
        auc = None
        if len(set(cand_labels)) > 1:
            try:
                # Map scores back to original candidate order for AUC calculation
                score_map = {x[0]: x[1] for x in sorted_list}
                pred_scores_orig = [score_map[c["id"]] for c in cand_info]
                auc = float(roc_auc_score(cand_labels, pred_scores_orig))
            except Exception:
                auc = None

        return {
            "auc": auc,
            "p5": precision_at_k(rec_ids, target_clicked_ids, 5),
            "p10": precision_at_k(rec_ids, target_clicked_ids, 10),
            "r5": recall_at_k(rec_ids, target_clicked_ids, 5),
            "r10": recall_at_k(rec_ids, target_clicked_ids, 10),
            "mrr5": mrr_at_k(rec_ids, target_clicked_ids, 5),
            "mrr10": mrr_at_k(rec_ids, target_clicked_ids, 10),
            "ndcg5": ndcg_at_k(rec_ids, target_clicked_ids, 5),
            "ndcg10": ndcg_at_k(rec_ids, target_clicked_ids, 10),
            "ild5": intra_list_diversity(rec_embs, 5),
            "ild10": intra_list_diversity(rec_embs, 10)
        }

    # Model E: Diversity-aware reranking
    sorted_e = sorted(scores_e, key=lambda x: x["score"], reverse=True)
    # Apply category diversity penalty to redundant categories
    seen_cats = set()
    e_reranked = []
    for item in sorted_e:
        adjusted_s = item["score"]
        if item["category"] in seen_cats:
            adjusted_s *= 0.90
        seen_cats.add(item["category"])
        e_reranked.append((item["id"], adjusted_s, item["embedding"]))

    return {
        "model_a": rank_and_metrics(scores_a),
        "model_b": rank_and_metrics(scores_b),
        "model_c": rank_and_metrics(scores_c),
        "model_d": rank_and_metrics(scores_d),
        "model_e": rank_and_metrics(e_reranked)
    }
