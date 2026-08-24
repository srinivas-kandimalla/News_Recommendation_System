import os

class MINDConfig:
    MIND_DATA_DIR = os.getenv(
        "MIND_DATA_DIR",
        "D:\\News_Recommendation_System\\backend\\evaluation\\mind\\data"
    )
    MIND_CACHE_DIR = os.getenv(
        "MIND_CACHE_DIR",
        "D:\\News_Recommendation_System\\backend\\evaluation\\mind\\cache"
    )

    NEWS_TSV = os.path.join(MIND_DATA_DIR, "news.tsv")
    BEHAVIORS_TSV = os.path.join(MIND_DATA_DIR, "behaviors.tsv")

    LONG_TERM_WEIGHT = float(os.getenv("LONG_TERM_WEIGHT", "0.4"))
    SHORT_TERM_WEIGHT = float(os.getenv("SHORT_TERM_WEIGHT", "0.6"))
    ATTENTION_TEMPERATURE = float(os.getenv("ATTENTION_TEMPERATURE", "0.1"))

    MAX_USERS = int(os.getenv("MAX_USERS", "1000"))
    TOP_K = int(os.getenv("TOP_K", "10"))
