import logging
from bson import ObjectId
from app.models.reading_history_model import reading_history_collection
from app.models.news_model import news_collection

logger = logging.getLogger(__name__)


def prepare_temporal_evaluation_dataset(min_interactions=3, test_ratio=0.3):
    """
    Load users with >= min_interactions and perform strict temporal train/test split.
    
    Data Leakage Prevention:
      - Train history contains only interactions before split timestamp.
      - Test history contains subsequent interactions.
      - Candidate pool excludes train history items.
    """
    all_reads = list(reading_history_collection.find().sort("read_at", 1))

    user_histories = {}
    for read in all_reads:
        uid = str(read["user_id"])
        if uid not in user_histories:
            user_histories[uid] = []
        user_histories[uid].append(read)

    eligible_users = []
    for uid, history in user_histories.items():
        if len(history) >= min_interactions:
            # Sort by interaction timestamp read_at
            sorted_history = sorted(history, key=lambda x: x.get("read_at") or x["_id"].generation_time)
            
            num_test = max(1, int(len(sorted_history) * test_ratio))
            num_train = len(sorted_history) - num_test
            
            if num_train >= 1 and num_test >= 1:
                train_reads = sorted_history[:num_train]
                test_reads = sorted_history[num_train:]
                
                train_news_ids = [r["news_id"] for r in train_reads]
                test_news_ids = [r["news_id"] for r in test_reads]
                
                eligible_users.append({
                    "user_id": ObjectId(uid),
                    "user_id_str": uid,
                    "train_reads": train_reads,
                    "test_reads": test_reads,
                    "train_news_ids": train_news_ids,
                    "test_news_ids": [str(nid) for nid in test_news_ids],
                    "split_timestamp": train_reads[-1].get("read_at")
                })

    return eligible_users


def load_news_candidate_pool(exclude_ids=None):
    """
    Load news articles with embeddings for candidate evaluation.
    """
    if exclude_ids is None:
        exclude_ids = []

    query = {}
    if exclude_ids:
        query = {"_id": {"$nin": exclude_ids}}

    candidates = list(news_collection.find(query, projection={"embedding": 1, "title": 1, "category": 1, "published": 1, "created_at": 1}))
    return [c for c in candidates if c and "embedding" in c and c["embedding"]]
