import os
import json
import logging
import numpy as np

try:
    import torch
    import torch.nn as nn
    PYTORCH_AVAILABLE = True
except ImportError:
    PYTORCH_AVAILABLE = False

from app.config.config import Config
from app.ai.feature_extractor import FEATURE_VECTOR_DIM

logger = logging.getLogger(__name__)

MODEL_DIR = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
    "models",
    "neural_ranker"
)
MODEL_WEIGHTS_PATH = os.path.join(MODEL_DIR, "neural_ranker.pt")
MODEL_CONFIG_PATH = os.path.join(MODEL_DIR, "model_config.json")


if PYTORCH_AVAILABLE:
    class PyTorchNeuralRanker(nn.Module):
        """
        Lightweight PyTorch MLP Ranker architecture for Nexora:
        Input(1159) -> Linear(1159, 128) -> ReLU -> Dropout(0.2) -> Linear(128, 64) -> ReLU -> Linear(64, 1)
        """
        def __init__(self, input_dim=FEATURE_VECTOR_DIM):
            super(PyTorchNeuralRanker, self).__init__()
            self.input_dim = input_dim
            self.net = nn.Sequential(
                nn.Linear(input_dim, 128),
                nn.ReLU(),
                nn.Dropout(p=0.2),
                nn.Linear(128, 64),
                nn.ReLU(),
                nn.Linear(64, 1)
            )

        def forward(self, x):
            return self.net(x)
else:
    class PyTorchNeuralRanker:
        pass


class NeuralRankerInferenceService:
    """
    Inference service for the PyTorch Neural Ranker.
    Loads trained weights once upon initialization, performs deterministic CPU evaluation,
    and gracefully falls back if weights are absent or disabled.
    """
    def __init__(self, weights_path=MODEL_WEIGHTS_PATH, config_path=MODEL_CONFIG_PATH):
        self.weights_path = weights_path
        self.config_path = config_path
        self.model = None
        self.is_loaded = False
        self.device = torch.device("cpu") if PYTORCH_AVAILABLE else None
        self.attempt_load()

    def attempt_load(self):
        if not PYTORCH_AVAILABLE:
            logger.info("PyTorch is not available in environment. Neural ranker fallback active.")
            self.is_loaded = False
            return False

        if not os.path.exists(self.weights_path):
            logger.info(f"Neural ranker weights file not found at {self.weights_path}. Fallback active.")
            self.is_loaded = False
            return False

        try:
            input_dim = FEATURE_VECTOR_DIM
            if os.path.exists(self.config_path):
                with open(self.config_path, "r", encoding="utf-8") as f:
                    cfg = json.load(f)
                    input_dim = cfg.get("input_dim", FEATURE_VECTOR_DIM)

            model = PyTorchNeuralRanker(input_dim=input_dim)
            state_dict = torch.load(self.weights_path, map_location=self.device)
            model.load_state_dict(state_dict)
            model.to(self.device)
            model.eval()

            self.model = model
            self.is_loaded = True
            logger.info(f"Neural ranker model loaded successfully from {self.weights_path} (input_dim={input_dim}).")
            return True
        except Exception as e:
            logger.warning(f"Failed to load neural ranker model: {e}. Fallback active.")
            self.model = None
            self.is_loaded = False
            return False

    def is_ready(self):
        enabled = getattr(Config, "USE_NEURAL_RANKER", False)
        return enabled and self.is_loaded and self.model is not None

    def predict_logit(self, feature_vector):
        if not self.is_ready() or not PYTORCH_AVAILABLE:
            return None

        feat_arr = np.array(feature_vector, dtype=np.float32).reshape(1, -1)
        if feat_arr.shape[1] != self.model.input_dim:
            logger.warning(f"Feature vector dimension mismatch: expected {self.model.input_dim}, got {feat_arr.shape[1]}")
            return None

        with torch.no_grad():
            tensor_in = torch.from_numpy(feat_arr).to(self.device)
            logit = self.model(tensor_in).item()
            return float(logit)

    def predict_proba(self, feature_vector):
        logit = self.predict_logit(feature_vector)
        if logit is None:
            return None
        # Sigmoid conversion
        proba = 1.0 / (1.0 + np.exp(-logit))
        return float(proba)

    def predict_proba_batch(self, feature_matrix):
        """
        Batched PyTorch inference method for Nexora Neural Ranker.
        Passes a 2D NumPy array (N, 1159) in a single PyTorch matrix forward pass.
        Returns a 1D NumPy array of click probabilities (length N), or None if not ready.
        """
        if not self.is_ready() or not PYTORCH_AVAILABLE:
            return None

        feat_arr = np.array(feature_matrix, dtype=np.float32)
        if feat_arr.ndim == 1:
            feat_arr = feat_arr.reshape(1, -1)

        if feat_arr.shape[1] != self.model.input_dim:
            logger.warning(f"Batch feature dimension mismatch: expected {self.model.input_dim}, got {feat_arr.shape[1]}")
            return None

        with torch.no_grad():
            tensor_in = torch.from_numpy(feat_arr).to(self.device)
            logits = self.model(tensor_in).squeeze(1)
            if logits.ndim == 0:
                logits = logits.unsqueeze(0)
            probas_tensor = torch.sigmoid(logits)
            return probas_tensor.cpu().numpy().astype(np.float64)


# Global singleton instance
neural_ranker_service = NeuralRankerInferenceService()
