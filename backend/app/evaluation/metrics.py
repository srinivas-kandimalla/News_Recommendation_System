import math
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity


def precision_at_k(recommended_ids, test_ids, k):
    """
    Precision@K = |Recommended@K intersect Test| / K
    """
    if not recommended_ids or not test_ids or k <= 0:
        return 0.0
    top_k = recommended_ids[:k]
    hits = len(set(top_k).intersection(set(test_ids)))
    return hits / float(k)


def recall_at_k(recommended_ids, test_ids, k):
    """
    Recall@K = |Recommended@K intersect Test| / |Test|
    """
    if not recommended_ids or not test_ids or k <= 0:
        return 0.0
    top_k = recommended_ids[:k]
    hits = len(set(top_k).intersection(set(test_ids)))
    return hits / float(len(test_ids))


def mrr_at_k(recommended_ids, test_ids, k):
    """
    MRR@K = 1 / rank of first relevant item in top K, or 0.0 if none
    """
    if not recommended_ids or not test_ids or k <= 0:
        return 0.0
    test_set = set(test_ids)
    for idx, item in enumerate(recommended_ids[:k]):
        if item in test_set:
            return 1.0 / float(idx + 1)
    return 0.0


def ndcg_at_k(recommended_ids, test_ids, k):
    """
    NDCG@K = DCG@K / IDCG@K
    """
    if not recommended_ids or not test_ids or k <= 0:
        return 0.0
    top_k = recommended_ids[:k]
    test_set = set(test_ids)

    dcg = 0.0
    for idx, item in enumerate(top_k):
        if item in test_set:
            dcg += 1.0 / math.log2(idx + 2)

    # Ideal DCG: best possible ranking where ground truth test items are placed first
    ideal_hits = min(k, len(test_ids))
    idcg = sum(1.0 / math.log2(i + 2) for i in range(ideal_hits))

    if idcg == 0.0:
        return 0.0
    return dcg / idcg


def intra_list_diversity(embeddings, k):
    """
    Intra-List Diversity (ILD@K) = 1 - average cosine similarity between all pairs in Top-K
      ILD = (2 / (K * (K - 1))) * sum_{i < j} (1 - cosine_similarity(e_i, e_j))
    """
    if not embeddings or len(embeddings) < 2:
        return 0.0

    k_embs = np.array(embeddings[:k])
    if k_embs.ndim != 2 or len(k_embs) < 2:
        return 0.0

    sim_matrix = cosine_similarity(k_embs)
    num_items = len(k_embs)
    dissimilarities = []

    for i in range(num_items):
        for j in range(i + 1, num_items):
            dissimilarities.append(1.0 - sim_matrix[i, j])

    if not dissimilarities:
        return 0.0

    return float(np.mean(dissimilarities))
