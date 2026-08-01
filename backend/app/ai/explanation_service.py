def generate_reason(
    news,
    semantic_score,
    popularity_score,
    recency_score,
    interest_score
):
    """
    Generate an explanation string for why a news article was recommended.
    """
    if interest_score >= 0.6:
        category = news.get("category", "") if isinstance(news, dict) else getattr(news, "category", "")
        return f"Recommended because you frequently read {category} news."
    elif popularity_score >= 0.7:
        return "Trending among readers."
    elif recency_score >= 0.8:
        return "Fresh breaking news."
    elif semantic_score >= 0.8:
        return "Similar to articles you've recently read."
    else:
        return "Recommended based on your reading history."
