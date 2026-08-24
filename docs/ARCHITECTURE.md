# NEXORA SYSTEM ARCHITECTURE & API SPECIFICATION

## 1. SYSTEM OVERVIEW

Nexora is an enterprise-grade personalized news recommendation platform. The system integrates real-time news ingestion via GNews API, dense semantic vector embedding (`all-MiniLM-L6-v2`), dynamic dual user interest profiling (Long-Term: 50, Short-Term: 5), Candidate-Aware Softmax Attention ($\tau = 0.1$), Context Fusion ($C_{\text{rel}} \in [0.80, 1.25]$), and Category Diversity Penalty Reranking.

```
┌─────────────────────────────────────────────────┐
│                   Frontend (React 19)            │
│  Pages: Home, Login, Register, Recommendations, │
│          Trending, Bookmarks, Analytics          │
└───────────────────────┬─────────────────────────┘
                        │ HTTP / REST API (Axios)
                        ▼
┌─────────────────────────────────────────────────┐
│              Backend API (Flask)                │
│  Routes → Controllers → AI Engine → Services    │
│  ┌──────────────┐ ┌──────────────┐ ┌───────────┐ │
│  │ AI Engine    │ │ Ingestion    │ │ Auth JWT  │ │
│  │ Attention    │ │ APScheduler  │ │ Middleware│ │
│  │ Context      │ │ GNews API    │ │ bcrypt    │ │
│  └──────────────┘ └──────────────┘ └───────────┘ │
└───────────────────────┬─────────────────────────┘
                        │ PyMongo Singleton
                        ▼
┌─────────────────────────────────────────────────┐
│                   MongoDB                       │
│  Collections: users, news, reading_history,     │
│               bookmarks, reactions              │
└─────────────────────────────────────────────────┘
```

---

## 2. CORE COMPONENTS & AI MODULES

1. **`user_profile_service.py`**:
   - `build_long_term_profile(user_id)`: Averages up to 50 historical read article embeddings ($W_{\text{long}} = 0.40$).
   - `build_short_term_profile(user_id)`: Averages latest 5 read article embeddings ($W_{\text{short}} = 0.60$).
2. **`attention_service.py`**:
   - `calculate_attention_weights(...)`: Candidate-conditioned cosine similarity $s_i = \cos(\mathbf{h}_i, \mathbf{e}_c)$, temperature scaling $\text{logits}_i = s_i / 0.1$, Softmax normalization.
3. **`context_service.py`**:
   - `calculate_context_relevance(...)`: Cyclical time-of-day/day-of-week context + recent category density multiplier ($m_{\text{category}} = 1.0 + 0.20 \times \text{ratio}$). $C_{\text{rel}} \in [0.80, 1.25]$.
4. **`evaluator.py` & `evaluator_fast.py`**:
   - Evaluates Models A–E on MIND-small benchmark candidates. Model E applies Category Diversity Penalty Reranking (10% score penalty on repeated candidate categories).

---

## 3. DATABASE SCHEMA (MONGODB)

- `users`: `_id`, `email`, `password_hash`, `created_at`, `role`.
- `news`: `_id`, `title`, `description`, `content`, `category`, `url`, `published_at`, `embedding` (384-dim array), `recency_score`, `popularity_score`.
- `reading_history`: `_id`, `user_id`, `news_id`, `read_at`.
- `bookmarks`: `_id`, `user_id`, `news_id`, `created_at`.
- `reactions`: `_id`, `user_id`, `news_id`, `type` (like/dislike), `created_at`.
