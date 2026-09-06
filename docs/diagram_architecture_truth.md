# Diagram Architecture Truth Report

This report is the source of truth for all generated figures. It intentionally reflects the implementation in the codebase, not a generic recommender-system template or README marketing language.

## Scope and method

The architecture is reconstructed from the actual runtime pipeline in:

- `backend/app/ai/`
- `backend/app/services/`
- `backend/app/controllers/`
- `backend/app/routes/`
- `backend/app/utils/`
- `backend/app/database/`
- `frontend/src/`
- `README.md`

No standalone research paper or LaTeX source was found in the repository. Any claim that exists only in the README is treated as descriptive project documentation, not as an independently validated research artifact.

## Component inventory

| Component name | Actual source file | Main function/class | Input | Processing | Output | Connection to other components |
| --- | --- | --- | --- | --- | --- | --- |
| Frontend API client | `frontend/src/services/newsService.js` | `getPersonalizedRecommendations`, `getRecommendations`, `recordReadingHistory` | JWT token, news IDs, query params | Sends authenticated HTTP requests to Flask routes | JSON data payloads | Calls backend routes via Axios |
| Auth context | `frontend/src/context/AuthContext.jsx` | `login`, `logout`, `getUserFromToken` | JWT stored in `localStorage` | Decodes JWT, tracks token/user state | `user`, `token`, auth flags | Feeds JWT to protected backend endpoints |
| Flask app | `backend/app/__init__.py` | `create_app()` | Flask app config and env values | Registers blueprints, enables CORS, starts scheduler | App instance | Hosts all backend endpoints |
| Recommendation route | `backend/app/routes/recommendation_routes.py` | `recommendations()`, `personalized()` | HTTP GET requests | Exposes `/recommendations/<news_id>` and `/personalized-recommendations` | Flask response objects | Calls controller functions |
| Recommendation controller | `backend/app/controllers/recommendation_controller.py` | `recommend_news()`, `personalized_recommendations()` | Request payload and current user | Invokes AI recommendation logic, unwraps status code | JSON recommendation payload | Calls `app.ai.recommendation_service` |
| JWT auth middleware | `backend/app/utils/jwt_helper.py` | `token_required`, `admin_required`, `generate_token` | Authorization header | Decodes Bearer token, loads user from MongoDB | `current_user` or rejection | Secures protected API routes |
| News fetch scheduler | `backend/app/scheduler.py` | `start_scheduler()`, `shutdown_scheduler()` | Config values from `Config` | Schedules periodic `fetch_latest_news` jobs via APScheduler | Background job loop | Calls news ingestion service |
| GNews ingestion pipeline | `backend/app/services/news_fetch_service.py` | `fetch_latest_news()`, `detect_category()`, `clean_content()`, `extract_full_article_text()` | GNews API responses | Rotates categories, cleans metadata, fetches article text, categorizes, embeds, stores documents | MongoDB `news` documents with embeddings | Writes to MongoDB and invokes embedding generation |
| Embedding generator | `backend/app/ai/embedding_service.py` | `generate_embedding()` | Article title + content text | Calls `SentenceTransformer("all-MiniLM-L6-v2")` | 384-dim dense vector | Feeds article embeddings into recommendation logic |
| Feature extractor | `backend/app/ai/feature_extractor.py` | `extract_candidate_features()`, `extract_candidate_features_batch()` | Candidate embedding, user attention vector, scalar signals | Concatenates 384-d candidate embedding, 384-d user attention vector, 384-d elementwise interaction, 7 scalar features | 1159-d feature vector or matrix | Produces neural ranker input |
| Attention service | `backend/app/ai/attention_service.py` | `calculate_attention_weights()`, `build_candidate_aware_attention_profile()`, `compute_combined_attention_user_vector()` | Long/short history embeddings and candidate embedding | Applies candidate-aware softmax attention, combines weighted history vectors | User attention vector + debug metrics | Builds personalized candidate representation |
| Temporal/context service | `backend/app/ai/context_service.py` | `build_temporal_context()`, `build_recent_interest_context()`, `calculate_context_relevance()` | Candidate news dict, short-term categories, time | Combines temporal sine/cosine context and recent category ratio | Context relevance factor and debug metadata | Modulates semantic relevance for each candidate |
| User profile service | `backend/app/ai/user_profile_service.py` | `build_long_term_profile()`, `build_short_term_profile()`, `combine_user_profiles()`, `fetch_user_history_embeddings()` | User ID | Fetches and aggregates reading history embeddings | Long-term/short-term embedding lists and IDs | Supplies historical vectors to attention and recommendation logic |
| Scoring service | `backend/app/ai/scoring_service.py` | `calculate_recency_score()`, `calculate_popularity_score()`, `calculate_interest_score()` | News metadata and user analytics | Applies exponential decay, popularity aggregation, and category/favorite-author affinity | Scalar score signals | Provides ranking features |
| Hybrid ranking service | `backend/app/ai/ranking_service.py` | `calculate_hybrid_score()` | Semantic score, recency, popularity, interest, feature vector | Chooses neural probability when enabled, otherwise executes linear heuristic | Final ranking score | Used by recommendation pipeline |
| Neural ranker | `backend/app/ai/neural_ranker.py` | `PyTorchNeuralRanker`, `NeuralRankerInferenceService` | 1159-d feature vector / matrix | MLP `1159 -> 128 -> 64 -> 1`, `sigmoid` transform | Click probability logits/probabilities | Used as learned ranker when `Config.USE_NEURAL_RANKER` is `True` |
| Recommendation engine | `backend/app/ai/recommendation_service.py` | `get_recommendations()`, `get_personalized_recommendations()`, `apply_diversity_filter()` | News ID or user ID | Retrieves user history/candidates, calculates semantic/context scores, builds feature matrix, ranks, filters diversity | Ranked recommendation payloads | Coordinates the entire personalized recommendation pipeline |
| MongoDB collections | `backend/app/database/db.py` | `CollectionProxy`, `DatabaseProxy` | DB connection URI and collection names | Routes collection access to test or default DB depending on `TESTING` | Collection objects such as `users`, `news`, `reading_history`, `bookmarks`, `reactions` | Persistent storage layer for users, articles, and feedback |
| News model documents | `backend/app/models/news_model.py` | `news_collection` | MongoDB | Documents with title/content/category/author/source/url/image_url/published/created_at/embedding | Stored article records | Used widely by fetch, recommendation, and analytics functions |
| User history model | `backend/app/models/reading_history_model.py` | `reading_history_collection` | User ID and news ID | Stores user reading events | Reading history records | Used for personalization and popularity counts |

## Actual end-to-end data flow

### 1. News ingestion and preprocessing

1. `fetch_latest_news()` in `backend/app/services/news_fetch_service.py` rotates through supported article categories (`general`, `technology`, `business`, `world`, `sports`, `entertainment`, `science`, `health`).
2. It calls the GNews API using `Config.GNEWS_API_KEY` and filters raw responses.
3. Each article is cleaned via `clean_content()` and, if needed, the full text is scraped via `extract_full_article_text()`.
4. Category is inferred using keyword matching in `detect_category()`.
5. The article title and content are passed to `generate_embedding()` from `backend/app/ai/embedding_service.py`, which calls `SentenceTransformer("all-MiniLM-L6-v2")`.
6. The metadata is stored in the MongoDB `news` collection, with the embedding saved alongside `title`, `content`, `category`, `author`, `source`, `url`, `image_url`, `published`, and `created_at`.

### 2. Personalized recommendation flow

1. The frontend requests `/personalized-recommendations` with a Bearer token via `frontend/src/services/newsService.js`.
2. The request reaches `recommendation_bp` and then `personalized_recommendations()` in the controller.
3. `token_required` validates the JWT and loads the authenticated user document from MongoDB.
4. `get_personalized_recommendations(user_id)` in `backend/app/ai/recommendation_service.py` fetches the user’s previously read news IDs through `get_user_read_news()`.
5. If reading history is empty, the system falls back to trending news via `get_trending_news()` and returns a cold-start set.
6. Otherwise, it calls `fetch_user_history_embeddings(user_id)` in `backend/app/ai/user_profile_service.py` to collect long-term and short-term user embeddings and their IDs/categories.
7. Candidate news items are selected from unread articles, excluding IDs in the user’s history.
8. For each candidate article:
   - `compute_combined_attention_user_vector()` builds a candidate-aware user vector using softmax attention over long/short history embeddings.
   - `calculate_context_relevance()` computes a temporal relevance multiplier using `build_temporal_context()` and `build_recent_interest_context()`.
   - `calculate_similarity()` compares the candidate-aware user vector to the candidate embedding.
   - `calculate_recency_score()`, `calculate_popularity_score()`, and `calculate_interest_score()` generate scalar ranking signals.
9. The code then creates a 1159-d candidate feature vector with `extract_candidate_features_batch()` from `backend/app/ai/feature_extractor.py`.
10. If `Config.USE_NEURAL_RANKER` is enabled and the model is loaded, `neural_ranker_service.predict_proba_batch()` outputs a probability for each candidate.
11. The system computes a hybrid score from the neural probability or, otherwise, the heuristic blend defined in `calculate_hybrid_score()`.
12. Candidates are sorted, expanded to a top set (up to `top_k * 4`), diversified using `apply_diversity_filter()`, and returned to the client.

### 3. Similar-news retrieval flow

The `/recommendations/<news_id>` route is different from the personalized flow. It loads a target article, computes semantic similarity against all other article embeddings using `calculate_similarity()`, and sorts results by similarity. This is a content-based semantic recommendation endpoint, not the personalized ranking pipeline.

## Explicit mismatch and unsupported-claim handling

The repository does not contain a research paper or LaTeX manuscript. Therefore:

- No paper-specific figure can be validated against a manuscript in this workspace.
- Any diagram must prioritize the implemented code path over README-style descriptions.
- Claims that are only narrative and not supported by a concrete code path are flagged as unverified or not directly implemented.

Examples of implementation-backed claims that are real:

- Dense article embeddings from `SentenceTransformer("all-MiniLM-L6-v2")` are implemented.
- Candidate-aware attention is implemented in `attention_service.py`.
- Temporal context and category ratios are implemented in `context_service.py`.
- A PyTorch MLP ranker is implemented in `neural_ranker.py`.
- The final score is a hybrid of semantic relevance, recency, popularity, interest, and optional neural ranker output.

Items to flag as not independently evidenced in the codebase beyond the README:

- An external manuscript or formal experiment section has not been found in the repo.
- There is no separate LaTeX source or publication artifact in the workspace to cross-check against the implementation.

## Key implementation facts for diagram design

1. The implemented system is a Flask + MongoDB + React pipeline.
2. Article embeddings are 384-dimensional from `SentenceTransformer("all-MiniLM-L6-v2")`.
3. The neural ranker input is a 1159-dimensional feature vector.
4. The ranker architecture is `Input(1159) -> Linear(1159,128) -> ReLU -> Dropout(0.2) -> Linear(128,64) -> ReLU -> Linear(64,1)`.
5. Final prediction is a sigmoid-activated probability, but the hybrid score is a weighted combination with recency/popularity/interest signals.
6. The recommendation system uses cold-start popularity fallback when user history is empty.
7. Diversity filtering caps categories and sources before final output.
8. The system returns personalized recommendations only after JWT validation.

## Summary

This project implements a real-time candidate-ranking recommendation pipeline with: article embedding generation, user-history profiling, attentional personalization, temporal context modeling, a learned neural ranker, and a diversity-aware ordering step. The diagrams must represent this exact sequence.
