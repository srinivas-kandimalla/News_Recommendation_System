"""
NEXORA PHASE 1 — NEURAL RANKER TEST SUITE
==========================================
Validates:
  1. Model initialization
  2. Correct feature dimension (1159)
  3. Forward pass
  4. Probability/logit output
  5. Missing-model fallback
  6. Disabled-model fallback
  7. Trained-model loading
  8. Deterministic inference
  9. ranking_service integration
  10. Existing recommendation behavior
"""
import unittest
import numpy as np
import torch

from app.config.config import Config
from app.ai.feature_extractor import extract_candidate_features, FEATURE_VECTOR_DIM
from app.ai.neural_ranker import PyTorchNeuralRanker, NeuralRankerInferenceService
from app.ai.ranking_service import calculate_hybrid_score


class TestNeuralRankerPhase1(unittest.TestCase):

    def test_01_model_initialization(self):
        """1. Verify PyTorchNeuralRanker initializes with correct architecture."""
        model = PyTorchNeuralRanker(input_dim=1159)
        self.assertIsNotNone(model)
        self.assertEqual(model.input_dim, 1159)

    def test_02_feature_dimension(self):
        """2. Verify extract_candidate_features produces exact 1159-dim vector."""
        dummy_c_emb = np.ones(384, dtype=np.float32)
        dummy_u_att = np.ones(384, dtype=np.float32)
        feat_vec = extract_candidate_features(
            candidate_embedding=dummy_c_emb,
            att_user_vector=dummy_u_att,
            semantic_score=0.75,
            context_relevance=1.10,
            recent_category_ratio=0.40,
            temporal_affinity=1.05,
            recency_score=0.85,
            popularity_score=0.50,
            interest_score=0.60
        )
        self.assertEqual(feat_vec.shape[0], 1159)
        self.assertEqual(FEATURE_VECTOR_DIM, 1159)
        self.assertEqual(feat_vec.dtype, np.float32)

    def test_03_forward_pass(self):
        """3. Verify forward pass shape (batch_size, 1)."""
        model = PyTorchNeuralRanker(input_dim=1159)
        model.eval()
        dummy_input = torch.randn(5, 1159)
        with torch.no_grad():
            out = model(dummy_input)
        self.assertEqual(out.shape, (5, 1))

    def test_04_logit_and_probability_output(self):
        """4. Verify logit and probability conversion in [0.0, 1.0]."""
        service = NeuralRankerInferenceService(weights_path="non_existent.pt")
        # Manually assign mock model
        service.model = PyTorchNeuralRanker(input_dim=1159)
        service.model.eval()
        service.is_loaded = True

        # Temporarily enable
        original_flag = getattr(Config, "USE_NEURAL_RANKER", False)
        Config.USE_NEURAL_RANKER = True
        try:
            dummy_vec = np.zeros(1159, dtype=np.float32)
            logit = service.predict_logit(dummy_vec)
            proba = service.predict_proba(dummy_vec)
            self.assertIsNotNone(logit)
            self.assertIsNotNone(proba)
            self.assertTrue(0.0 <= proba <= 1.0)
        finally:
            Config.USE_NEURAL_RANKER = original_flag

    def test_05_missing_model_fallback(self):
        """5. Verify missing weights file causes graceful fallback (is_ready()=False)."""
        service = NeuralRankerInferenceService(weights_path="invalid_path_to_model.pt")
        self.assertFalse(service.is_ready())
        self.assertIsNone(service.predict_proba(np.zeros(1159)))

    def test_06_disabled_model_fallback(self):
        """6. Verify USE_NEURAL_RANKER=False keeps neural ranker disabled by default."""
        original_flag = getattr(Config, "USE_NEURAL_RANKER", False)
        Config.USE_NEURAL_RANKER = False
        try:
            service = NeuralRankerInferenceService()
            self.assertFalse(service.is_ready())
        finally:
            Config.USE_NEURAL_RANKER = original_flag

    def test_07_trained_model_loading(self):
        """7. Verify trained model state dict loading works if weights file exists."""
        service = NeuralRankerInferenceService()
        if service.is_loaded:
            self.assertIsNotNone(service.model)
            self.assertEqual(service.model.input_dim, 1159)

    def test_08_deterministic_inference(self):
        """8. Verify deterministic inference for identical feature vector inputs."""
        model = PyTorchNeuralRanker(input_dim=1159)
        model.eval()
        dummy_vec = torch.ones(1, 1159)
        with torch.no_grad():
            out1 = model(dummy_vec).item()
            out2 = model(dummy_vec).item()
        self.assertEqual(out1, out2)

    def test_09_ranking_service_integration(self):
        """9. Verify calculate_hybrid_score fallback vs neural scoring integration."""
        sem, rec, pop, int_sc = 0.8, 0.9, 0.5, 0.6
        expected_heuristic = round(0.8 * 0.60 + 0.9 * 0.20 + 0.5 * 0.10 + 0.6 * 0.10, 4)

        # Baseline heuristic test (USE_NEURAL_RANKER=False)
        original_flag = getattr(Config, "USE_NEURAL_RANKER", False)
        Config.USE_NEURAL_RANKER = False
        try:
            score = calculate_hybrid_score(sem, rec, pop, int_sc, feature_vector=np.zeros(1159))
            self.assertAlmostEqual(score, expected_heuristic, places=4)
        finally:
            Config.USE_NEURAL_RANKER = original_flag

    def test_10_heuristic_fallback_preservation(self):
        """10. Verify heuristic fallback score remains 100% exact when feature_vector is None."""
        sem, rec, pop, int_sc = 0.70, 0.80, 0.30, 0.40
        expected = 0.70 * 0.60 + 0.80 * 0.20 + 0.30 * 0.10 + 0.40 * 0.10
        score = calculate_hybrid_score(sem, rec, pop, int_sc, feature_vector=None)
        self.assertAlmostEqual(score, expected, places=4)


if __name__ == "__main__":
    unittest.main()
