"""
FROZEN PAPER REPRODUCTION — FEATURE PIPELINE & NEURAL RANKER
============================================================
Authoritative reconstruction of the frozen paper's feature pipeline and model.

Frozen Paper Specification:
  - Title: A Deep Learning-Based Context-Aware Real-Time Personalized News Recommendation Framework
  - Feature Dimension: 1159 (384 + 384 + 384 + 7)
  - Semantic Representation: 384-d all-MiniLM-L6-v2 embeddings
  - Dual-horizon History: Long-term <= 50 (weight 0.40), Short-term <= 5 (weight 0.60)
  - Candidate-Aware Attention: Temperature tau = 0.10, Cosine similarity query-key
  - Scalar Features (7):
      1. semantic_score (u_att . c_emb)
      2. context_relevance (clamp(1.0 + 0.20 * recent_category_ratio, 0.80, 1.25))
      3. recent_category_ratio (frequency of candidate category in short-term history)
      4. temporal_affinity (1.0)
      5. recency_score (0.5)
      6. popularity_score (0.0)
      7. interest_score (0.0)
  - Neural Architecture: 1159 -> 128 -> 64 -> 1 (ReLU, Dropout=0.2, Sigmoid)
  - Checkpoint: neural_ranker_v1_backup.pt (historical paper model)
"""
import os
import sys
import numpy as np
import torch
import torch.nn as nn
from typing import List, Dict, Any, Tuple, Optional

BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

HISTORICAL_WEIGHTS_PATH = os.path.join(BACKEND_DIR, "models", "neural_ranker", "neural_ranker_v1_backup.pt")
HISTORICAL_CONFIG_PATH = os.path.join(BACKEND_DIR, "models", "neural_ranker", "model_config_v1_backup.json")

FEATURE_DIM = 1159


class FrozenPaperMLPRanker(nn.Module):
    """
    Exact PyTorch MLP Ranker from Section III-F (Equations 11-12):
    1159 -> 128 -> 64 -> 1
    ReLU activation, Dropout(p=0.2), Sigmoid output.
    """
    def __init__(self, input_dim: int = 1159):
        super(FrozenPaperMLPRanker, self).__init__()
        self.input_dim = input_dim
        self.net = nn.Sequential(
            nn.Linear(input_dim, 128),
            nn.ReLU(),
            nn.Dropout(p=0.2),
            nn.Linear(128, 64),
            nn.ReLU(),
            nn.Linear(64, 1)
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        logits = self.net(x)
        return torch.sigmoid(logits)


def l2_normalize(mat: np.ndarray) -> np.ndarray:
    """Row-wise L2 normalization. Returns normalized copy."""
    if mat.ndim == 1:
        norm = np.linalg.norm(mat)
        return mat / norm if norm > 0 else mat
    norms = np.linalg.norm(mat, axis=1, keepdims=True)
    norms = np.where(norms == 0, 1.0, norms)
    return mat / norms


def compute_frozen_paper_attention(
    history_embs: np.ndarray,      # (H, D)
    candidate_embs: np.ndarray,    # (N, D)
    temperature: float = 0.10
) -> np.ndarray:
    """
    Vectorized candidate-aware softmax attention (Equations 5-7):
      s_i = cos(e_c, h_i)
      alpha_i = exp(s_i / tau) / sum(exp(s_j / tau))
      u_c = sum(alpha_i * h_i)
    """
    if len(history_embs) == 0:
        return np.zeros((len(candidate_embs), 384), dtype=np.float32)

    h_norm = l2_normalize(history_embs)
    c_norm = l2_normalize(candidate_embs)

    # sim_matrix: (H, N)
    sim_matrix = h_norm @ c_norm.T

    # Temperature-scaled softmax with numerical stability
    logits = sim_matrix / max(temperature, 1e-5)
    logits -= logits.max(axis=0, keepdims=True)
    exp_w = np.exp(logits)
    alpha = exp_w / (exp_w.sum(axis=0, keepdims=True) + 1e-9)

    # Weighted sum: (N, D)
    att_profiles = alpha.T @ history_embs
    return l2_normalize(att_profiles)


def extract_frozen_paper_features(
    candidate_emb: np.ndarray,
    att_user_vec: np.ndarray,
    semantic_score: float,
    context_relevance: float,
    recent_category_ratio: float,
    temporal_affinity: float = 1.0,
    recency_score: float = 0.5,
    popularity_score: float = 0.0,
    interest_score: float = 0.0
) -> np.ndarray:
    """
    Constructs the 1159-D feature vector according to Equation (8):
      x_c = [e_c; u_c; (e_c * u_c); s_c]
    where s_c in R^7 has the exact 7 scalar features.
    """
    c_arr = np.asarray(candidate_emb, dtype=np.float32).flatten()
    u_arr = np.asarray(att_user_vec, dtype=np.float32).flatten()
    hadamard = (c_arr * u_arr).flatten()

    scalars = np.array([
        float(semantic_score),
        float(context_relevance),
        float(recent_category_ratio),
        float(temporal_affinity),
        float(recency_score),
        float(popularity_score),
        float(interest_score)
    ], dtype=np.float32)

    feat = np.concatenate([c_arr, u_arr, hadamard, scalars])
    assert len(feat) == FEATURE_DIM, f"Expected {FEATURE_DIM}, got {len(feat)}"
    return feat


class FrozenPaperRankerService:
    """Inference service for the frozen paper's neural ranker."""
    def __init__(self, weights_path: str = HISTORICAL_WEIGHTS_PATH):
        self.device = torch.device("cpu")
        self.model = FrozenPaperMLPRanker(input_dim=1159)
        if os.path.exists(weights_path):
            state_dict = torch.load(weights_path, map_location=self.device)
            self.model.load_state_dict(state_dict)
            self.model.eval()
            self._ready = True
        else:
            self._ready = False

    def is_ready(self) -> bool:
        return self._ready

    def predict_proba_batch(self, X: np.ndarray) -> np.ndarray:
        if not self._ready or len(X) == 0:
            return np.zeros(len(X), dtype=np.float32)
        self.model.eval()
        with torch.no_grad():
            tensor_x = torch.from_numpy(X.astype(np.float32)).to(self.device)
            out = self.model(tensor_x)
            return out.cpu().numpy().flatten()
