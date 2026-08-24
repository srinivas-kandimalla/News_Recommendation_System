"""
NEXORA STEP 8D — OPTIMIZED EVALUATOR
======================================
Performance-equivalent implementation of evaluate_mind_behavior_impression.

SCIENTIFIC CONTRACT:
  - Identical mathematical behavior to evaluator.py for all 5 models.
  - Original evaluator.py is the REFERENCE. This file is NOT the reference.
  - Only computation is optimized. No model definitions changed.

OPTIMIZATIONS:
  1. Model A/B: Replace per-candidate sklearn cosine_similarity(1x384, 1x384)
     with a single batched dot product after L2 normalization.
  2. Model C: Replace N per-candidate calls to compute_combined_attention_user_vector
     with a fully vectorized attention computation using NumPy matrix ops.
  3. Model D: Vectorize context factor computation using NumPy arrays.
  4. Model E: Reranking loop unchanged (already O(N), not a bottleneck).
  5. ILD/AUC/ranking: Unchanged — called once per model per impression.

UNCHANGED:
  - attention temperature (0.1 from Config)
  - long_weight (0.4), short_weight (0.6)
  - context density formula (0.20 * cat_density, clamped [0.80, 1.25])
  - Model E 0.90 diversity penalty
  - history slice: long=[-50:], short=[-5:]
  - all metric functions (imported directly)
  - AUC guard: only when both classes present
  - candidate filter: only news_dict members with embeddings
"""
import math
import numpy as np
import logging
from sklearn.metrics import roc_auc_score

from app.config.config import Config
from app.evaluation.metrics import (
    precision_at_k,
    recall_at_k,
    mrr_at_k,
    ndcg_at_k,
    intra_list_diversity
)

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Internal vectorized helpers (NOT exported — internal only)
# ---------------------------------------------------------------------------

def _l2_normalize_rows(mat: np.ndarray) -> np.ndarray:
    """Row-wise L2 normalization. Zero-norm rows stay zero."""
    norms = np.linalg.norm(mat, axis=1, keepdims=True)
    norms = np.where(norms == 0, 1.0, norms)
    return mat / norms


def _batch_cosine_similarity(query: np.ndarray, keys: np.ndarray) -> np.ndarray:
    """
    Cosine similarity between a single query vector and a matrix of keys.
    Returns shape (N,).
    Equivalent to [sklearn cosine_similarity(query.reshape(1,-1), key.reshape(1,-1))[0,0]
                   for key in keys]
    """
    q_norm = _l2_normalize_rows(query.reshape(1, -1))   # (1, D)
    k_norm = _l2_normalize_rows(keys)                    # (N, D)
    return (q_norm @ k_norm.T).flatten()                 # (N,)


def _vectorized_attention_profile(
    history_embs: np.ndarray,      # (H, D)
    candidate_embs: np.ndarray,    # (N, D)
    temperature: float
) -> np.ndarray:
    """
    Vectorized candidate-aware softmax attention profiles.

    For each candidate c_j:
      s_i   = cosine_sim(h_i, c_j)   for all history items i
      alpha  = softmax(s / temperature)
      u_att  = sum_i(alpha_i * h_i)
      u_att  = L2-normalize(u_att)

    Returns:
      att_profiles: (N, D)  — one attention profile per candidate
    """
    H, D = history_embs.shape
    N    = candidate_embs.shape[0]

    h_norm = _l2_normalize_rows(history_embs)     # (H, D)
    c_norm = _l2_normalize_rows(candidate_embs)   # (N, D)

    # sim_matrix[i, j] = cosine_sim(h_i, c_j)   shape (H, N)
    sim_matrix = h_norm @ c_norm.T                # (H, N)

    # Temperature-scaled softmax with numerical stability (max-subtraction per column)
    logits = sim_matrix / max(temperature, 1e-5)  # (H, N)
    logits -= logits.max(axis=0, keepdims=True)   # subtract per-candidate max
    exp_w  = np.exp(logits)                       # (H, N)
    alpha  = exp_w / (exp_w.sum(axis=0, keepdims=True) + 1e-9)  # (H, N)

    # Weighted sum: u_att_j = sum_i(alpha_{ij} * h_i)
    # alpha.T is (N, H), history_embs is (H, D)
    att_profiles = alpha.T @ history_embs         # (N, D)

    # L2-normalize each row
    att_profiles = _l2_normalize_rows(att_profiles)  # (N, D)

    return att_profiles


# ---------------------------------------------------------------------------
# Public API — drop-in replacement for evaluate_mind_behavior_impression
# ---------------------------------------------------------------------------

def evaluate_mind_behavior_impression_fast(behavior, news_dict, k=10):
    """
    Optimized drop-in replacement for evaluate_mind_behavior_impression.
    Identical mathematical behavior, vectorized computation.
    """
    history_ids   = behavior["history"]
    candidate_ids = behavior["candidates"]
    labels        = behavior["labels"]

    # --- History embeddings and categories (same filter as original) ---
    history_embs_list = [news_dict[nid]["embedding"] for nid in history_ids
                         if nid in news_dict and "embedding" in news_dict[nid]]
    history_cats_list = [news_dict[nid]["category"]  for nid in history_ids
                         if nid in news_dict and "category"  in news_dict[nid]]

    # --- Candidate setup (identical to original) ---
    cand_info = []
    for cid, label in zip(candidate_ids, labels):
        if cid in news_dict and "embedding" in news_dict[cid]:
            cand_info.append({
                "id":        cid,
                "embedding": news_dict[cid]["embedding"],
                "category":  news_dict[cid].get("category", ""),
                "label":     label
            })

    if not cand_info:
        return None
    if not history_embs_list:
        return None

    # Ground truth
    target_clicked_ids = [c["id"] for c in cand_info if c["label"] == 1]
    cand_labels        = [c["label"] for c in cand_info]

    # --- Read config (identical to original) ---
    temp        = getattr(Config, "ATTENTION_TEMPERATURE", 0.1)
    long_weight = getattr(Config, "LONG_TERM_WEIGHT",      0.4)
    short_weight= getattr(Config, "SHORT_TERM_WEIGHT",     0.6)

    # ---------------------------------------------------------------
    # Build numpy arrays once
    # ---------------------------------------------------------------
    H_all   = np.array(history_embs_list)              # (H, D)
    long_h  = H_all[-50:]                              # same as history_embs[-50:]
    short_h = H_all[-5:]                               # same as history_embs[-5:]
    short_cats = history_cats_list[-5:]

    C_embs  = np.array([c["embedding"] for c in cand_info])  # (N, D)
    N       = len(cand_info)

    # ---------------------------------------------------------------
    # MODEL A: mean profile → batch cosine similarity
    # ---------------------------------------------------------------
    mean_profile_a = H_all.mean(axis=0)                # (D,)
    scores_a_vals  = _batch_cosine_similarity(mean_profile_a, C_embs)   # (N,)

    # ---------------------------------------------------------------
    # MODEL B: long+short weighted profile → batch cosine similarity
    # ---------------------------------------------------------------
    long_vec_b  = long_h.mean(axis=0)
    short_vec_b = short_h.mean(axis=0)
    comb_vec_b  = (long_weight * long_vec_b) + (short_weight * short_vec_b)
    norm_b      = np.linalg.norm(comb_vec_b)
    profile_b   = comb_vec_b / norm_b if norm_b > 0 else comb_vec_b

    scores_b_vals = _batch_cosine_similarity(profile_b, C_embs)         # (N,)

    # ---------------------------------------------------------------
    # MODEL C: vectorized candidate-aware attention
    # Compute all N attention profiles in one matrix operation.
    # ---------------------------------------------------------------

    # Long-term attention profiles for all candidates: (N, D)
    long_att_profiles  = _vectorized_attention_profile(long_h,  C_embs, temp)
    # Short-term attention profiles for all candidates: (N, D)
    short_att_profiles = _vectorized_attention_profile(short_h, C_embs, temp)

    # Combined vector per candidate (same formula as original)
    # If long profile valid (always here since long_h is non-empty):
    raw_comb = (long_weight * long_att_profiles) + (short_weight * short_att_profiles)  # (N, D)
    norms_c  = np.linalg.norm(raw_comb, axis=1, keepdims=True)   # (N, 1)
    norms_c  = np.where(norms_c == 0, 1.0, norms_c)
    combined_profiles = raw_comb / norms_c                         # (N, D)

    # Score = cosine_sim(combined_profile_j, c_j) for each j
    # Both are already L2-normalized rows → dot product = cosine_sim
    c_norm_c    = _l2_normalize_rows(C_embs)                      # (N, D)
    scores_c_vals = (combined_profiles * c_norm_c).sum(axis=1)    # (N,) element-wise dot

    # ---------------------------------------------------------------
    # MODEL D: attention + category density context
    # Vectorized context factor per candidate
    # ---------------------------------------------------------------
    # cat_density[j] = short_cats.count(c_cat_j) / len(short_cats)
    n_short = float(len(short_cats)) if short_cats else 1.0
    cat_density_vals = np.array(
        [short_cats.count(c["category"]) / n_short if short_cats else 0.0
         for c in cand_info], dtype=float
    )
    c_factor_vals = np.clip(1.0 + (0.20 * cat_density_vals), 0.80, 1.25)
    scores_d_vals = np.clip(scores_c_vals * c_factor_vals, 0.0, 1.0)

    # ---------------------------------------------------------------
    # MODEL E: diversity reranking (loop unchanged — already O(N))
    # ---------------------------------------------------------------
    scores_e_list = [
        {"id": c["id"], "score": float(scores_d_vals[i]),
         "category": c["category"], "embedding": c["embedding"]}
        for i, c in enumerate(cand_info)
    ]
    sorted_e = sorted(scores_e_list, key=lambda x: x["score"], reverse=True)
    seen_cats = set()
    e_reranked = []
    for item in sorted_e:
        adjusted_s = item["score"]
        if item["category"] in seen_cats:
            adjusted_s *= 0.90
        seen_cats.add(item["category"])
        e_reranked.append((item["id"], adjusted_s, item["embedding"]))

    # ---------------------------------------------------------------
    # rank_and_metrics — identical to original
    # ---------------------------------------------------------------
    def rank_and_metrics(scored_tuple_list):
        sorted_list  = sorted(scored_tuple_list, key=lambda x: x[1], reverse=True)
        rec_ids      = [x[0] for x in sorted_list]
        rec_embs     = [x[2] for x in sorted_list]

        auc = None
        if len(set(cand_labels)) > 1:
            try:
                score_map        = {x[0]: x[1] for x in sorted_list}
                pred_scores_orig = [score_map[c["id"]] for c in cand_info]
                auc = float(roc_auc_score(cand_labels, pred_scores_orig))
            except Exception:
                auc = None

        return {
            "auc":   auc,
            "p5":    precision_at_k(rec_ids, target_clicked_ids, 5),
            "p10":   precision_at_k(rec_ids, target_clicked_ids, 10),
            "r5":    recall_at_k(rec_ids, target_clicked_ids, 5),
            "r10":   recall_at_k(rec_ids, target_clicked_ids, 10),
            "mrr5":  mrr_at_k(rec_ids, target_clicked_ids, 5),
            "mrr10": mrr_at_k(rec_ids, target_clicked_ids, 10),
            "ndcg5": ndcg_at_k(rec_ids, target_clicked_ids, 5),
            "ndcg10":ndcg_at_k(rec_ids, target_clicked_ids, 10),
            "ild5":  intra_list_diversity(rec_embs, 5),
            "ild10": intra_list_diversity(rec_embs, 10)
        }

    # Build scored tuples with embedding for each model
    scores_a = [(cand_info[i]["id"], float(scores_a_vals[i]), cand_info[i]["embedding"]) for i in range(N)]
    scores_b = [(cand_info[i]["id"], float(scores_b_vals[i]), cand_info[i]["embedding"]) for i in range(N)]
    scores_c = [(cand_info[i]["id"], float(scores_c_vals[i]), cand_info[i]["embedding"]) for i in range(N)]
    scores_d = [(cand_info[i]["id"], float(scores_d_vals[i]), cand_info[i]["embedding"]) for i in range(N)]

    return {
        "model_a": rank_and_metrics(scores_a),
        "model_b": rank_and_metrics(scores_b),
        "model_c": rank_and_metrics(scores_c),
        "model_d": rank_and_metrics(scores_d),
        "model_e": rank_and_metrics(e_reranked)
    }
