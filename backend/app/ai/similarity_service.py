import numpy as np
from sklearn.metrics.pairwise import cosine_similarity


# =====================================================
# Cosine Similarity
# =====================================================

def calculate_similarity(embedding1, embedding2):
    """
    Calculate cosine similarity between two embeddings.
    """

    similarity = cosine_similarity(
        np.array(embedding1).reshape(1, -1),
        np.array(embedding2).reshape(1, -1)
    )

    return float(similarity[0][0])