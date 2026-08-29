from app.config.config import Config
from app.ai.neural_ranker import neural_ranker_service

# =====================================================
# Hybrid Ranking
# =====================================================

def calculate_hybrid_score(
    semantic_score,
    recency_score,
    popularity_score,
    interest_score,
    feature_vector=None
):
    """
    Final recommendation score.
    
    If Config.USE_NEURAL_RANKER is True AND neural_ranker_service is ready,
    computes learned neural probability score.
    Otherwise, defaults to the exact baseline 4-factor linear heuristic formula:
      0.60 * semantic + 0.20 * recency + 0.10 * popularity + 0.10 * interest
    """
    if getattr(Config, "USE_NEURAL_RANKER", False) and feature_vector is not None and neural_ranker_service.is_ready():
        neural_prob = neural_ranker_service.predict_proba(feature_vector)
        if neural_prob is not None:
            return round(neural_prob, 4)

    return (
        semantic_score * 0.60 +
        recency_score * 0.20 +
        popularity_score * 0.10 +
        interest_score * 0.10
    )