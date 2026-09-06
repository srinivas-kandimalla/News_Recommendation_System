"""
NEXORA RESEARCH DIVERSITY-AWARE RERANKING SERVICE
===================================================
Implements the paper's exact diversity-aware subtractive reranking formula (Equation 14):

    S'(c) = S_hybrid(c, u) - lambda * P(c, R)

where:
  - S_hybrid(c, u) is the candidate's base hybrid recommendation score.
  - R is the list of candidates already selected into the recommendation list so far.
  - P(c, R) is the normalized category redundancy penalty:
        P(c, R) = (count of articles in R with category == c.category) / max(1, |R|)
  - lambda controls the strength of the diversity penalty (default: DIVERSITY_LAMBDA = 0.10).

Algorithm (Greedy List Construction):
  1. Start with candidate set C and their base scores S_hybrid(c, u).
  2. Select the candidate with the highest base score as the first recommendation and add to R.
  3. For each remaining unselected candidate c in C \\ R:
        adjusted_score(c) = S_hybrid(c, u) - lambda * P(c, R)
  4. Select the candidate with the highest adjusted_score(c) (ties broken deterministically
     by base score, then candidate pool order).
  5. Add selected candidate to R and repeat until Top-K candidates are produced.
"""

import logging
from typing import List, Dict, Any, Optional

try:
    from app.config.config import Config
except Exception:
    Config = None

logger = logging.getLogger(__name__)


def calculate_category_redundancy_penalty(
    candidate_category: str,
    selected_categories: List[str]
) -> float:
    """
    Calculate normalized category redundancy penalty P(c, R) for candidate c given selected list R.

        P(c, R) = count_in_R(c.category) / max(1, |R|)

    Returns 0.0 if candidate_category is empty/missing or |R| == 0.
    """
    if not candidate_category or not selected_categories:
        return 0.0
    
    same_count = selected_categories.count(candidate_category)
    return same_count / max(1, len(selected_categories))


def apply_diversity_reranking(
    candidates: List[Dict[str, Any]],
    top_k: int = 5,
    diversity_lambda: Optional[float] = None,
    score_key: Optional[str] = None,
    category_key: str = "category"
) -> List[Dict[str, Any]]:
    """
    Apply research-grade Diversity-Aware Reranking using Equation (14):
    
        S'(c) = S_hybrid(c, u) - lambda * P(c, R)

    Parameters:
        candidates (list): List of candidate items (dicts).
        top_k (int): Maximum number of recommendations to select.
        diversity_lambda (float, optional): Penalty strength lambda. If None, uses Config.DIVERSITY_LAMBDA (0.10).
        score_key (str, optional): Key for score in candidate dicts. If None, auto-detects 'hybrid_score' or 'score'.
        category_key (str): Key for category in candidate dicts (default: 'category').

    Returns:
        list: Top-K reranked candidate dicts with updated 'diversity_penalty' and 'adjusted_score' metadata.
    """
    if not candidates or top_k <= 0:
        return []

    if diversity_lambda is None:
        diversity_lambda = getattr(Config, "DIVERSITY_LAMBDA", 0.10) if Config is not None else 0.10

    # Detect score key if not explicitly provided
    if score_key is None:
        sample = candidates[0] if len(candidates) > 0 else {}
        if "hybrid_score" in sample:
            score_key = "hybrid_score"
        elif "score" in sample:
            score_key = "score"
        else:
            score_key = "hybrid_score"

    # Shallow copy items to avoid mutating caller's original list structure
    candidates_pool = []
    for idx, item in enumerate(candidates):
        if isinstance(item, dict):
            c_item = dict(item)
            c_item["_orig_idx"] = idx
            base_s = float(c_item.get(score_key, 0.0))
            c_item["_base_score"] = base_s
            candidates_pool.append(c_item)

    if not candidates_pool:
        return []

    # If lambda <= 0, diversity penalty is inactive: sort purely by base score descending
    if diversity_lambda <= 0.0:
        candidates_pool.sort(key=lambda x: (x["_base_score"], -x["_orig_idx"]), reverse=True)
        for item in candidates_pool:
            item["adjusted_score"] = item["_base_score"]
            item["diversity_penalty"] = 0.0
            item.pop("_orig_idx", None)
            item.pop("_base_score", None)
        return candidates_pool[:top_k]

    selected: List[Dict[str, Any]] = []
    selected_categories: List[str] = []
    unselected = list(candidates_pool)

    # Greedy Selection Loop
    while len(selected) < top_k and unselected:
        if not selected:
            # First item: select candidate with highest base score
            unselected.sort(key=lambda x: (x["_base_score"], -x["_orig_idx"]), reverse=True)
            best_cand = unselected.pop(0)
            best_cand["adjusted_score"] = best_cand["_base_score"]
            best_cand["diversity_penalty"] = 0.0
            selected.append(best_cand)
            selected_categories.append(str(best_cand.get(category_key, "")))
        else:
            # Calculate adjusted scores for all remaining candidates
            best_cand = None
            best_adj_score = -float("inf")
            best_idx = -1

            for i, cand in enumerate(unselected):
                cat = str(cand.get(category_key, ""))
                penalty = calculate_category_redundancy_penalty(cat, selected_categories)
                adj_score = cand["_base_score"] - (diversity_lambda * penalty)

                # Deterministic selection comparison:
                # 1. Higher adjusted score
                # 2. Higher base score (tie-breaker)
                # 3. Lower original index (tie-breaker)
                if (adj_score > best_adj_score) or (
                    abs(adj_score - best_adj_score) < 1e-9 and
                    (cand["_base_score"] > best_cand["_base_score"] if best_cand else True)
                ):
                    best_adj_score = adj_score
                    best_cand = cand
                    best_idx = i

            if best_cand is not None and best_idx != -1:
                cand = unselected.pop(best_idx)
                cand["adjusted_score"] = round(best_adj_score, 6)
                cat = str(cand.get(category_key, ""))
                cand["diversity_penalty"] = round(diversity_lambda * calculate_category_redundancy_penalty(cat, selected_categories), 6)
                selected.append(cand)
                selected_categories.append(cat)
            else:
                break

    # Clean up internal metadata fields
    for item in selected:
        item.pop("_orig_idx", None)
        item.pop("_base_score", None)

    return selected


# Alias function for backwards compatibility with existing import signatures
def apply_diversity_filter(recommendations, top_k=5, diversity_lambda=None):
    """
    Backwards-compatible wrapper calling apply_diversity_reranking.
    """
    return apply_diversity_reranking(recommendations, top_k=top_k, diversity_lambda=diversity_lambda)
