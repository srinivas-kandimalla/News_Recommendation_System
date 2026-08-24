def generate_reason(
    news,
    semantic_score,
    popularity_score,
    recency_score,
    interest_score,
    short_term_sim=0.0,
    long_term_sim=0.0
):
    """
    Generate an explanation string for why a news article was recommended.
    """
    category = news.get("category", "") if isinstance(news, dict) else getattr(news, "category", "")

    if short_term_sim >= 0.40 and short_term_sim > (long_term_sim + 0.02):
        return f"Recommended based on your recent reading in {category}." if category else "Recommended based on your recent reading."
    elif interest_score >= 0.6:
        return f"Recommended because you frequently read {category} news." if category else "Recommended based on your reading interests."
    elif semantic_score >= 0.40:
        return "Recommended based on your overall reading history."
    elif popularity_score >= 0.7:
        return "Trending among readers."
    elif recency_score >= 0.8:
        return "Fresh breaking news."
    else:
        return "Recommended based on your reading history."

