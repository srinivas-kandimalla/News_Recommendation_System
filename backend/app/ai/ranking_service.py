# =====================================================
# Hybrid Ranking
# =====================================================

def calculate_hybrid_score(
    semantic_score,
    recency_score,
    popularity_score,
    interest_score
):
    """
    Final weighted recommendation score.
    """

    return (

        semantic_score * 0.60 +

        recency_score * 0.20 +

        popularity_score * 0.10 +

        interest_score * 0.10

    )