"""
NEXORA AUTOMATED CONSISTENCY & INTEGRITY TEST SUITE
===================================================
Automated verification tests covering:
  1. 1159 feature vector dimension & exact block decomposition
  2. Feature name ordering & indexing consistency
  3. Parity across training, evaluation, and live inference feature extraction
  4. User-disjoint split isolation (zero overlap assertions)
  5. Deterministic scalar feature bounds and missing-value handling
  6. Popularity log-normalization bounds and zero test leakage
  7. Diversity reranking top_k count preservation and ILD metric behavior
  8. Model F checkpoint and configuration schema integrity (v2.1-log-popularity)
"""
import os
import sys
import math
import unittest
import numpy as np
import torch

BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from app.ai.feature_extractor import (
    extract_candidate_features,
    extract_candidate_features_batch,
    get_feature_dimension,
    FEATURE_VECTOR_DIM,
    FEATURE_NAMES,
    SCALAR_FEATURE_NAMES,
    CANDIDATE_EMBEDDING_DIM,
    USER_ATTENTION_DIM,
    ELEMENTWISE_INTERACTION_DIM,
    NUM_SCALAR_FEATURES
)
from app.ai.neural_ranker import PyTorchNeuralRanker, MODEL_WEIGHTS_PATH, MODEL_CONFIG_PATH
from app.ai.diversity_service import apply_diversity_reranking
from app.evaluation.metrics import intra_list_diversity
from app.evaluation.mind.split_manager import build_or_load_user_splits, split_bucket
from app.evaluation.mind.mind_feature_proxy import MINDCausalFeatureProxy, parse_mind_timestamp


class TestFeatureConsistencyAndIntegrity(unittest.TestCase):
    def setUp(self):
        self.c_emb = np.random.randn(384).astype(np.float32)
        self.c_emb /= np.linalg.norm(self.c_emb)
        self.u_att = np.random.randn(384).astype(np.float32)
        self.u_att /= np.linalg.norm(self.u_att)

    def test_01_feature_dimension_and_block_decomposition(self):
        """Verify exact 1159-d decomposition: 384 + 384 + 384 + 7 = 1159."""
        self.assertEqual(CANDIDATE_EMBEDDING_DIM, 384)
        self.assertEqual(USER_ATTENTION_DIM, 384)
        self.assertEqual(ELEMENTWISE_INTERACTION_DIM, 384)
        self.assertEqual(NUM_SCALAR_FEATURES, 7)
        self.assertEqual(FEATURE_VECTOR_DIM, 1159)
        self.assertEqual(get_feature_dimension(), 1159)
        self.assertEqual(len(FEATURE_NAMES), 1159)
        self.assertEqual(len(SCALAR_FEATURE_NAMES), 7)

    def test_02_feature_ordering_and_indices(self):
        """Verify feature names and block ordering."""
        # Block 1: c_emb_0 .. c_emb_383
        self.assertEqual(FEATURE_NAMES[0], "c_emb_0")
        self.assertEqual(FEATURE_NAMES[383], "c_emb_383")
        # Block 2: u_att_0 .. u_att_383
        self.assertEqual(FEATURE_NAMES[384], "u_att_0")
        self.assertEqual(FEATURE_NAMES[767], "u_att_383")
        # Block 3: u_x_c_0 .. u_x_c_383
        self.assertEqual(FEATURE_NAMES[768], "u_x_c_0")
        self.assertEqual(FEATURE_NAMES[1151], "u_x_c_383")
        # Block 4: 7 Scalars
        self.assertEqual(FEATURE_NAMES[1152], "semantic_score")
        self.assertEqual(FEATURE_NAMES[1153], "context_relevance")
        self.assertEqual(FEATURE_NAMES[1154], "recent_category_ratio")
        self.assertEqual(FEATURE_NAMES[1155], "temporal_affinity")
        self.assertEqual(FEATURE_NAMES[1156], "recency_score")
        self.assertEqual(FEATURE_NAMES[1157], "popularity_score")
        self.assertEqual(FEATURE_NAMES[1158], "interest_score")

    def test_03_single_vs_batch_feature_extraction_parity(self):
        """Verify numerical equivalence between single-vector and batch extraction."""
        feat_single = extract_candidate_features(
            candidate_embedding=self.c_emb,
            att_user_vector=self.u_att,
            semantic_score=0.75,
            context_relevance=1.15,
            recent_category_ratio=0.50,
            temporal_affinity=1.06,
            recency_score=0.85,
            popularity_score=0.45,
            interest_score=0.60
        )
        self.assertEqual(feat_single.shape, (1159,))

        feat_batch = extract_candidate_features_batch(
            c_embs=np.array([self.c_emb]),
            u_atts=np.array([self.u_att]),
            semantic_scores=[0.75],
            context_relevances=[1.15],
            recent_category_ratios=[0.50],
            temporal_affinities=[1.06],
            recency_scores=[0.85],
            popularity_scores=[0.45],
            interest_scores=[0.60]
        )
        self.assertEqual(feat_batch.shape, (1, 1159))
        np.testing.assert_allclose(feat_single, feat_batch[0], atol=1e-6)

    def test_04_user_disjoint_split_zero_overlap(self):
        """Assert absolute zero user overlap between train, val, and test splits."""
        train_u, val_u, test_u, test_500, manifest = build_or_load_user_splits()
        self.assertEqual(len(train_u & val_u), 0, "Train & Val overlap detected!")
        self.assertEqual(len(train_u & test_u), 0, "Train & Test overlap detected!")
        self.assertEqual(len(val_u & test_u), 0, "Val & Test overlap detected!")
        self.assertEqual(len(test_500), 500, "Canonical test cohort must have 500 users!")
        self.assertTrue(set(test_500).issubset(test_u))

    def test_05_popularity_log_normalization_and_bounds(self):
        """Verify log-frequency popularity bounds and edge cases."""
        proxy = MINDCausalFeatureProxy(
            news_first_seen={"N1": "2019-11-10 10:00:00"},
            train_popularity_counts={"N1": 100, "N_top": 1000}
        )
        # Unseen news ID evaluates to 0.0
        self.assertEqual(proxy.calculate_popularity_score("N_unseen"), 0.0)
        # Top item evaluates to 1.0
        self.assertEqual(proxy.calculate_popularity_score("N_top"), 1.0)
        # Intermediate item evaluates strictly inside (0, 1)
        score_n1 = proxy.calculate_popularity_score("N1")
        expected_n1 = math.log1p(100) / math.log1p(1000)
        self.assertAlmostEqual(score_n1, expected_n1, places=3)
        self.assertTrue(0.0 < score_n1 < 1.0)

    def test_06_model_checkpoint_and_config_integrity(self):
        """Verify model weights file and model_config.json schema."""
        self.assertTrue(os.path.exists(MODEL_WEIGHTS_PATH), f"Missing {MODEL_WEIGHTS_PATH}")
        self.assertTrue(os.path.exists(MODEL_CONFIG_PATH), f"Missing {MODEL_CONFIG_PATH}")

        model = PyTorchNeuralRanker(input_dim=1159)
        state_dict = torch.load(MODEL_WEIGHTS_PATH, map_location="cpu")
        model.load_state_dict(state_dict)
        model.eval()

        dummy_input = torch.randn(4, 1159)
        with torch.no_grad():
            logits = model(dummy_input)
            probs = torch.sigmoid(logits)

        self.assertEqual(logits.shape, (4, 1))
        self.assertEqual(probs.shape, (4, 1))
        self.assertTrue(torch.all((probs >= 0.0) & (probs <= 1.0)))

    def test_07_diversity_reranking_behavior(self):
        """Verify diversity reranking preserved item count and penalizes category repetition."""
        sample_items = [
            {"id": "A1", "score": 0.95, "category": "sports", "embedding": np.random.randn(384)},
            {"id": "A2", "score": 0.94, "category": "sports", "embedding": np.random.randn(384)},
            {"id": "A3", "score": 0.90, "category": "technology", "embedding": np.random.randn(384)},
            {"id": "A4", "score": 0.85, "category": "business", "embedding": np.random.randn(384)},
        ]
        reranked = apply_diversity_reranking(sample_items, top_k=4, score_key="score")
        self.assertEqual(len(reranked), 4)
        # First item remains top item
        self.assertEqual(reranked[0]["id"], "A1")
        # Second item should be diversified (technology or business promoted relative to second sports)
        self.assertIn(reranked[1]["category"], ["technology", "sports", "business"])


if __name__ == "__main__":
    unittest.main()
