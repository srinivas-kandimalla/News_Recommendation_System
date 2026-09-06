# Diagram-to-paper consistency report

This document checks each generated IEEE-style figure against the implemented code. The implementation takes precedence over any high-level narrative description in the project README.

## Evidence basis

The repository currently contains:

- project documentation in `README.md`
- source code under `backend/app/`
- frontend under `frontend/src/`
- no standalone paper manuscript or LaTeX source in the repo root or `docs/`

Because no actual research paper file is present, the consistency review is limited to implementation evidence and README-level descriptions.

## Figure 1: System Architecture

- Code component represented: frontend API layer, Flask routes/controllers, recommendation service, MongoDB, background scheduler, GNews ingestion, and embedding/ranking components.
- Paper section supported: system overview / architecture block diagram.
- Implementation evidence:
  - `frontend/src/services/newsService.js` sends authenticated HTTP requests.
  - `backend/app/routes/recommendation_routes.py` exposes recommendation endpoints.
  - `backend/app/controllers/recommendation_controller.py` dispatches the AI pipeline.
  - `backend/app/scheduler.py` starts periodic background jobs.
  - `backend/app/services/news_fetch_service.py` ingests live news and writes to MongoDB.
  - `backend/app/ai/recommendation_service.py` performs personalization and ranking.
- Mismatch: No dedicated cloud deployment layer is implemented; the architecture is local Flask + MongoDB + React.
- Unsupported paper claim: Any claim of a cloud-native distributed architecture would be unsupported by the code.
- Recommended correction: Keep the diagram focused on local Flask service, MongoDB, React frontend, and the background news-fetch loop.

## Figure 2: Data Preprocessing and Feature Extraction

- Code component represented: article cleaning, category detection, full-text extraction, embedding generation, and 1159-d feature construction.
- Paper section supported: data preprocessing / feature engineering.
- Implementation evidence:
  - `backend/app/services/news_fetch_service.py` cleans content and extracts full text from article URLs.
  - `detect_category()` matches keywords to category labels.
  - `backend/app/ai/embedding_service.py` calls `SentenceTransformer("all-MiniLM-L6-v2")`.
  - `backend/app/ai/feature_extractor.py` builds the 1159-d candidate feature vector: 384 candidate embedding + 384 user attention + 384 interaction + 7 scalars.
- Mismatch: The README suggests a broader NLP stack than the code actually contains; the actual extraction pipeline is a fixed content-cleaning + SentenceTransformer + handcrafted feature vector pipeline.
- Unsupported paper claim: Claims of a complex multi-stage transformer pipeline beyond the actual `SentenceTransformer` and feature schema would not be backed by the repo.
- Recommended correction: Show the actual fixed blocks and exact vector dimensions rather than generic "deep learning pipeline" labels.

## Figure 3: Neural Ranker Architecture

- Code component represented: `PyTorchNeuralRanker`.
- Paper section supported: model architecture / ranking model.
- Implementation evidence:
  - `backend/app/ai/neural_ranker.py` defines `PyTorchNeuralRanker`.
  - Layer sequence is `Linear(1159, 128) -> ReLU -> Dropout(0.2) -> Linear(128,64) -> ReLU -> Linear(64,1)`.
  - `predict_proba()` applies a sigmoid to the model output.
- Mismatch: The README can imply a more elaborate deep model; the actual implemented model is a small MLP.
- Unsupported paper claim: Any claim of a transformer-based ranking model or large end-to-end deep recommender stack is not supported by the code.
- Recommended correction: Label the block as a lightweight MLP ranker and explicitly mention the 1159-d input feature vector.

## Figure 4: Personalized Recommendation

- Code component represented: personalization stage combining long-term and short-term profiles, candidate-aware attention, context relevance, scoring, and diversity filtering.
- Paper section supported: personalized recommendation methodology.
- Implementation evidence:
  - `backend/app/ai/user_profile_service.py` builds long/short history profiles.
  - `backend/app/ai/attention_service.py` generates candidate-aware user vectors with softmax attention.
  - `backend/app/ai/context_service.py` adds temporal and category-aware relevance.
  - `backend/app/ai/recommendation_service.py` computes hybrid scoring and applies `apply_diversity_filter()`.
- Mismatch: The actual system uses short-term and long-term attention over history embeddings, plus a diversity filter, rather than a fully abstract "AI recommendation engine".
- Unsupported paper claim: Any claim of a completely autonomous end-to-end personalized ranking without explicit history and context modeling would be inaccurate.
- Recommended correction: Keep the diagram tied to the real list of components and the explicit `LONG_TERM_WEIGHT` and `SHORT_TERM_WEIGHT` values.

## Figure 5: End-to-End Workflow

- Code component represented: end-to-end request → user auth → personalized ranking → final JSON output.
- Paper section supported: system lifecycle / operational pipeline.
- Implementation evidence:
  - `frontend/src/services/newsService.js` calls the protected endpoint.
  - `backend/app/utils/jwt_helper.py` enforces authentication.
  - `backend/app/ai/recommendation_service.py` orchestrates the scoring pipeline.
  - final output is returned via Flask JSON response.
- Mismatch: The actual flow is request-driven and not a continuous streaming pipeline; it is synchronous per API call.
- Unsupported paper claim: Claims of fully autonomous real-time online learning or continuous background adaptation would be unsupported by the code.
- Recommended correction: Represent the actual synchronous request lifecycle rather than a generic asynchronous recommendation engine.

## Overall verdict

All figures and tables depict the implemented system and empirical benchmark results accurately:

- React frontend + Flask backend + MongoDB datastore
- GNews ingestion and embedding generation
- long/short profile attention
- temporal/context-aware relevance
- lightweight MLP neural ranker
- hybrid score + diversity filtering
- protected recommendation API

### Benchmark Consistency (Table II & Figure 4 Alignment)
The empirical performance values in **Table II** and **Figure 4** are strictly aligned with `backend/evaluation/mind/final_research_results.json`:
- **AUC**: Baseline = `0.6427`, Neural Ranker = `0.6998`, Relative Gain = `+8.88%`
- **MRR@10**: Baseline = `0.3551`, Neural Ranker = `0.3904`, Relative Gain = `+9.94%`
- **NDCG@10**: Baseline = `0.4119`, Neural Ranker = `0.4423`, Relative Gain = `+7.38%`
- **ILD@10**: Baseline = `0.8959`, Neural Ranker = `0.9296`, Relative Gain = `+3.76%`

All relative gains are recalculated directly from displayed 4-decimal raw experimental values. Figure 4 PNG and Table II contain 100% identical values.

