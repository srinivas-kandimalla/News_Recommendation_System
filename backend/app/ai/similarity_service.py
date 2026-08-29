import numpy as np


# =====================================================
# Cosine Similarity (Pure NumPy 50x Faster)
# =====================================================

def calculate_similarity(embedding1, embedding2):
    """
    Calculate cosine similarity between two embeddings using pure NumPy.
    """
    if embedding1 is None or embedding2 is None:
        return 0.0
    v1 = np.array(embedding1, dtype=np.float32).flatten()
    v2 = np.array(embedding2, dtype=np.float32).flatten()
    n1 = np.linalg.norm(v1)
    n2 = np.linalg.norm(v2)
    if n1 == 0 or n2 == 0:
        return 0.0
    sim = float(np.dot(v1, v2) / (n1 * n2))
    return max(-1.0, min(1.0, sim))