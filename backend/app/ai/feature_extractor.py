import numpy as np

# Feature Block Definitions (384-d dense embeddings + 7 scalar signals)
CANDIDATE_EMBEDDING_DIM = 384
USER_ATTENTION_DIM = 384
ELEMENTWISE_INTERACTION_DIM = 384

SCALAR_FEATURE_NAMES = [
    "semantic_score",
    "context_relevance",
    "recent_category_ratio",
    "temporal_affinity",
    "recency_score",
    "popularity_score",
    "interest_score"
]
NUM_SCALAR_FEATURES = len(SCALAR_FEATURE_NAMES)

# Derived total input feature dimension
FEATURE_VECTOR_DIM = (
    CANDIDATE_EMBEDDING_DIM
    + USER_ATTENTION_DIM
    + ELEMENTWISE_INTERACTION_DIM
    + NUM_SCALAR_FEATURES
)  # 384 + 384 + 384 + 7 = 1159

FEATURE_NAMES = (
    [f"c_emb_{i}" for i in range(CANDIDATE_EMBEDDING_DIM)]
    + [f"u_att_{i}" for i in range(USER_ATTENTION_DIM)]
    + [f"u_x_c_{i}" for i in range(ELEMENTWISE_INTERACTION_DIM)]
    + SCALAR_FEATURE_NAMES
)


def get_feature_dimension():
    """Return verified derived feature dimension."""
    assert len(FEATURE_NAMES) == FEATURE_VECTOR_DIM, (
        f"Feature schema mismatch: {len(FEATURE_NAMES)} vs {FEATURE_VECTOR_DIM}"
    )
    return FEATURE_VECTOR_DIM


def extract_candidate_features(
    candidate_embedding,
    att_user_vector,
    semantic_score=0.0,
    context_relevance=1.0,
    recent_category_ratio=0.0,
    temporal_affinity=1.0,
    recency_score=0.0,
    popularity_score=0.0,
    interest_score=0.0
):
    """
    Construct a deterministic, schema-derived candidate feature vector.
    Runtime assertions guarantee exact feature dimension alignment.
    """
    c_arr = (
        np.array(candidate_embedding, dtype=np.float32).flatten()
        if candidate_embedding is not None
        else np.zeros(CANDIDATE_EMBEDDING_DIM, dtype=np.float32)
    )
    if c_arr.shape[0] != CANDIDATE_EMBEDDING_DIM:
        c_arr = np.pad(c_arr, (0, max(0, CANDIDATE_EMBEDDING_DIM - c_arr.shape[0])))[:CANDIDATE_EMBEDDING_DIM]

    u_arr = (
        np.array(att_user_vector, dtype=np.float32).flatten()
        if att_user_vector is not None
        else np.zeros(USER_ATTENTION_DIM, dtype=np.float32)
    )
    if u_arr.shape[0] != USER_ATTENTION_DIM:
        u_arr = np.pad(u_arr, (0, max(0, USER_ATTENTION_DIM - u_arr.shape[0])))[:USER_ATTENTION_DIM]

    u_x_c = u_arr * c_arr

    scalars = np.array([
        float(semantic_score),
        float(context_relevance),
        float(recent_category_ratio),
        float(temporal_affinity),
        float(recency_score),
        float(popularity_score),
        float(interest_score)
    ], dtype=np.float32)

    feat_vector = np.concatenate([c_arr, u_arr, u_x_c, scalars], axis=0)

    # Runtime verification safeguard
    assert feat_vector.shape[0] == FEATURE_VECTOR_DIM, (
        f"Feature vector size {feat_vector.shape[0]} does not match derived schema dimension {FEATURE_VECTOR_DIM}"
    )

    return feat_vector


def extract_candidate_features_batch(
    c_embs,
    u_atts,
    semantic_scores,
    context_relevances,
    recent_category_ratios,
    temporal_affinities,
    recency_scores,
    popularity_scores,
    interest_scores
):
    """
    Vectorized construction of candidate feature matrix X in R^(N x 1159).
    Guarantees exact numerical equivalence with extract_candidate_features.
    """
    c_arr = np.ascontiguousarray(c_embs, dtype=np.float32)
    u_arr = np.ascontiguousarray(u_atts, dtype=np.float32)
    u_x_c = u_arr * c_arr

    scalars = np.column_stack([
        np.array(semantic_scores, dtype=np.float32),
        np.array(context_relevances, dtype=np.float32),
        np.array(recent_category_ratios, dtype=np.float32),
        np.array(temporal_affinities, dtype=np.float32),
        np.array(recency_scores, dtype=np.float32),
        np.array(popularity_scores, dtype=np.float32),
        np.array(interest_scores, dtype=np.float32)
    ])

    feat_matrix = np.hstack([c_arr, u_arr, u_x_c, scalars])
    assert feat_matrix.shape[1] == FEATURE_VECTOR_DIM, (
        f"Feature matrix columns {feat_matrix.shape[1]} does not match derived schema dimension {FEATURE_VECTOR_DIM}"
    )
    return feat_matrix
