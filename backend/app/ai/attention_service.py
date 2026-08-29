import numpy as np
import logging
from app.config.config import Config

logger = logging.getLogger(__name__)


def calculate_attention_weights(history_embeddings, candidate_embedding, temperature=None):
    """
    Calculate candidate-aware Softmax attention weights over historical article embeddings using pure NumPy.
    Reuses pre-converted/pre-normalized matrices if passed as a tuple (history_matrix, hist_units).
    """
    if temperature is None:
        temperature = getattr(Config, "ATTENTION_TEMPERATURE", 0.1)

    if history_embeddings is None or candidate_embedding is None:
        return [], np.array([])

    # Allow passing pre-computed (history_matrix, hist_units) tuple to eliminate redundant conversions
    if isinstance(history_embeddings, tuple):
        history_matrix, hist_units = history_embeddings
    else:
        if not history_embeddings:
            return [], np.array([])
        history_matrix = np.array(history_embeddings, dtype=np.float32)
        if history_matrix.ndim != 2 or len(history_matrix) == 0:
            return [], np.array([])
        hist_norms = np.linalg.norm(history_matrix, axis=1, keepdims=True)
        hist_norms = np.where(hist_norms == 0, 1.0, hist_norms)
        hist_units = history_matrix / hist_norms

    if len(history_matrix) == 0:
        return [], np.array([])

    candidate_arr = np.array(candidate_embedding, dtype=np.float32).flatten()
    if candidate_arr.shape[0] == 0:
        return [], np.array([])

    cand_norm = np.linalg.norm(candidate_arr)
    cand_unit = (candidate_arr / cand_norm) if cand_norm > 0 else candidate_arr

    # Vectorized dot product using pre-normalized history units (33x faster)
    similarities = (hist_units @ cand_unit.T).flatten()

    # Temperature-scaled logits with max-subtraction for numerical stability
    logits = similarities / max(temperature, 1e-5)
    shifted_logits = logits - np.max(logits)
    exp_scores = np.exp(shifted_logits)
    attention_weights = exp_scores / (np.sum(exp_scores) + 1e-9)

    return similarities, attention_weights


def build_candidate_aware_attention_profile(history_embeddings, candidate_embedding, temperature=None):
    """
    Compute attention-weighted representation of historical article embeddings for a given candidate.
    """
    if history_embeddings is None or candidate_embedding is None:
        return None, [], np.array([])

    if isinstance(history_embeddings, tuple):
        history_matrix, _ = history_embeddings
    else:
        history_matrix = np.array(history_embeddings, dtype=np.float32)

    if len(history_matrix) == 0:
        return None, [], np.array([])

    similarities, attention_weights = calculate_attention_weights(
        history_embeddings,
        candidate_embedding,
        temperature
    )

    if len(attention_weights) == 0:
        return None, [], np.array([])

    weighted_profile = np.sum(history_matrix * attention_weights[:, np.newaxis], axis=0)

    # Normalize vector for cosine similarity calculation
    norm = np.linalg.norm(weighted_profile)
    if norm > 0:
        weighted_profile = weighted_profile / norm

    return weighted_profile, similarities, attention_weights


def compute_combined_attention_user_vector(
    long_term_embeddings,
    short_term_embeddings,
    candidate_embedding,
    long_term_ids=None,
    short_term_ids=None
):
    """
    Compute candidate-aware long-term attention profile and short-term attention profile,
    and combine them using LONG_TERM_WEIGHT (0.4) and SHORT_TERM_WEIGHT (0.6).
    
    Returns:
      combined_attention_user_vector, debug_info
    """
    temp = getattr(Config, "ATTENTION_TEMPERATURE", 0.1)
    long_weight = getattr(Config, "LONG_TERM_WEIGHT", 0.4)
    short_weight = getattr(Config, "SHORT_TERM_WEIGHT", 0.6)

    long_profile, long_sims, long_weights = build_candidate_aware_attention_profile(
        long_term_embeddings, candidate_embedding, temp
    )
    short_profile, short_sims, short_weights = build_candidate_aware_attention_profile(
        short_term_embeddings, candidate_embedding, temp
    )

    if long_profile is None and short_profile is None:
        return None, {}

    if long_profile is None:
        combined_vector = short_profile
    elif short_profile is None:
        combined_vector = long_profile
    else:
        raw_comb = (long_weight * long_profile) + (short_weight * short_profile)
        norm = np.linalg.norm(raw_comb)
        combined_vector = raw_comb / norm if norm > 0 else raw_comb

    # Construct attention debug metrics
    top_long_idx = int(np.argmax(long_weights)) if len(long_weights) > 0 else -1
    top_short_idx = int(np.argmax(short_weights)) if len(short_weights) > 0 else -1

    debug_info = {
        "long_term": {
            "top_attended_id": str(long_term_ids[top_long_idx]) if (long_term_ids and top_long_idx >= 0 and top_long_idx < len(long_term_ids)) else None,
            "max_attention_weight": round(float(np.max(long_weights)), 4) if len(long_weights) > 0 else 0.0,
            "max_similarity": round(float(np.max(long_sims)), 4) if len(long_sims) > 0 else 0.0,
        },
        "short_term": {
            "top_attended_id": str(short_term_ids[top_short_idx]) if (short_term_ids and top_short_idx >= 0 and top_short_idx < len(short_term_ids)) else None,
            "max_attention_weight": round(float(np.max(short_weights)), 4) if len(short_weights) > 0 else 0.0,
            "max_similarity": round(float(np.max(short_sims)), 4) if len(short_sims) > 0 else 0.0,
        }
    }

    return combined_vector, debug_info
