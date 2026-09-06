# Figure README

This directory contains the final IEEE-style figures generated from the implemented project architecture.

## Figures

### 1. System_Architecture.png
- Purpose: High-level system structure of the frontend, backend, data stores, and background news ingestion.
- Exact implementation represented: `frontend/src/services/newsService.js`, `backend/app/__init__.py`, `backend/app/routes/recommendation_routes.py`, `backend/app/scheduler.py`, `backend/app/services/news_fetch_service.py`, `backend/app/ai/recommendation_service.py`, `backend/app/database/db.py`.
- Recommended paper section: System overview / architecture.
- Suggested IEEE caption: "System architecture of the Nexora personalized news recommendation framework, showing the React frontend, Flask backend, MongoDB storage, and periodic GNews ingestion pipeline."
- Verification status: Verified against implementation in the codebase.

### 2. Data_Preprocessing_and_Feature_Extraction.png
- Purpose: Shows the actual cleaning, enrichment, embedding, and feature construction pipeline.
- Exact implementation represented: `backend/app/services/news_fetch_service.py`, `backend/app/ai/embedding_service.py`, `backend/app/ai/feature_extractor.py`, `backend/app/ai/context_service.py`.
- Recommended paper section: Data preprocessing and feature engineering.
- Suggested IEEE caption: "Data preprocessing and feature extraction pipeline for article ingestion, text cleaning, category detection, embedding generation, and candidate feature construction."
- Verification status: Verified against implementation in the codebase.

### 3. Neural_Ranker_Architecture.png
- Purpose: Depicts the actual PyTorch MLP ranker used for learned re-ranking.
- Exact implementation represented: `backend/app/ai/neural_ranker.py` and `backend/app/ai/feature_extractor.py`.
- Recommended paper section: Ranking model / neural recommender architecture.
- Suggested IEEE caption: "MLP-based neural ranker architecture using a 1159-dimensional feature vector and a sigmoid output for click-probability estimation."
- Verification status: Verified against the implemented `PyTorchNeuralRanker` definition.

### 4. Personalized_Recommendation.png
- Purpose: Explains how user history, attention, temporal context, and scoring combine into personalized recommendations.
- Exact implementation represented: `backend/app/ai/user_profile_service.py`, `backend/app/ai/attention_service.py`, `backend/app/ai/context_service.py`, `backend/app/ai/recommendation_service.py`, `backend/app/ai/scoring_service.py`, `backend/app/ai/ranking_service.py`.
- Recommended paper section: Personalized recommendation methodology.
- Suggested IEEE caption: "Personalized recommendation pipeline combining long-term and short-term user profiles, candidate-aware attention, temporal relevance, and hybrid ranking."
- Verification status: Verified against the implemented recommendation pipeline.

### 5. End_to_End_Workflow.png
- Purpose: Shows the request-driven flow from frontend interaction to JWT-authenticated recommendation output.
- Exact implementation represented: `frontend/src/services/newsService.js`, `backend/app/utils/jwt_helper.py`, `backend/app/controllers/recommendation_controller.py`, `backend/app/ai/recommendation_service.py`.
- Recommended paper section: End-to-end system workflow or methodology.
- Suggested IEEE caption: "End-to-end workflow of the Nexora recommendation system from authenticated frontend request to personalized recommendation generation and response."
- Verification status: Verified against the actual request path in the codebase.

## Notes

- These figures intentionally prioritize the actual implemented system over generic recommender-system abstractions.
- No separate research manuscript or LaTeX source was found in the repository for direct paper comparison.
- The generated figures therefore reflect the code truth and the project README description only where it is supported by the implementation.
