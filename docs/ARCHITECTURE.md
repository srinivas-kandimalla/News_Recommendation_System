# NEXORA SYSTEM ARCHITECTURE & TECHNICAL SPECIFICATION

## 1. Executive System Overview

**Nexora** is an enterprise-grade, real-time context-aware news recommendation system. It leverages dense semantic vector embeddings (`all-MiniLM-L6-v2`), multi-factor hybrid scoring algorithms, time-decay functions, implicit session telemetry, and transparent recommendation rationales to deliver personalized news briefings.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            FRONTEND CLIENT (React 18 + Vite)                │
│  Pages: Home, Discover, For You, Trending, Bookmarks, Analytics, Details,   │
│         Login, Register, Admin Portal                                       │
│  State: AuthContext, ThemeContext (Light/Dark), Axios Interceptors          │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ HTTP / REST API (JWT Bearer Token)
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            BACKEND REST API (Python Flask)                  │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │ API Routes Layer                                                      │  │
│  │ /api/news | /api/recommendations | /api/reactions | /api/analytics    │  │
│  └───────────────────────────────────┬───────────────────────────────────┘  │
│                                      │                                      │
│  ┌───────────────────────────────────▼───────────────────────────────────┐  │
│  │ AI Scoring & Recommendation Core Engine                               │  │
│  │ • 384-Dim SentenceTransformer Embeddings (all-MiniLM-L6-v2)           │  │
│  │ • Dual-Profile Attention (Long-Term: 50, Short-Term: 5)               │  │
│  │ • Exponential Recency Decay Engine: S_recency = e^(-λ · Δt)           │  │
│  │ • Time-of-Day Context & Category Affinity Scaling                     │  │
│  │ • Transparent Rationale Generator ("Why Nexora Recommended This")     │  │
│  └───────────────────────────────────┬───────────────────────────────────┘  │
│                                      │                                      │
│  ┌───────────────────────────────────▼───────────────────────────────────┐  │
│  │ Background News Pipeline (APScheduler + GNews API)                    │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ PyMongo Singleton Driver
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            DATABASE LAYER (MongoDB)                         │
│  Collections: users, news, reading_logs, bookmarks, reactions               │
│  Indexes: Compound User/News IDs, Text Indexing, Date Range Sorting         │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Multi-Factor AI Recommendation Engine

The core scoring engine calculates personalized relevance for any candidate news story $c$ given a user $u$ and current reading session context $\mathcal{C}$:

$$\text{Score}(u, c, \mathcal{C}) = w_1 \cdot S_{\text{content}}(u, c) + w_2 \cdot S_{\text{recency}}(c) + w_3 \cdot S_{\text{affinity}}(u, c) + w_4 \cdot S_{\text{context}}(\mathcal{C}, c)$$

### Component Mechanics:

1. **Dense Content Embedding ($S_{\text{content}}$)**:
   - Encodes news titles & text into a 384-dimensional dense vector space using `SentenceTransformer('all-MiniLM-L6-v2')`.
   - Computes cosine similarity between the candidate embedding $\mathbf{e}_c$ and the user's dual reading vector $\mathbf{h}_u$:
     $$S_{\text{content}}(u, c) = \frac{\mathbf{h}_u \cdot \mathbf{e}_c}{\|\mathbf{h}_u\| \|\mathbf{e}_c\|}$$

2. **Continuous Exponential Recency Decay ($S_{\text{recency}}$)**:
   - Penalizes stale news according to publication elapsed time $\Delta t$ (in hours):
     $$S_{\text{recency}}(c) = e^{-\lambda \cdot \Delta t}$$
     where half-life parameter $\lambda = \frac{\ln(2)}{24}$.

3. **Category Affinity Weighting ($S_{\text{affinity}}$)**:
   - Dynamically measures user preference for candidate category $cat(c)$ derived from positive user reactions and reading duration history.

4. **Session Context Scaling ($S_{\text{context}}$)**:
   - Adjusts relevance score based on time-of-day reading habits (e.g., Morning Briefing vs. Evening Deep Dive) and active device profile.

5. **Dynamic Personalization Badge Transition**:
   - **`< 3 Read Articles`**: Displays `BUILDING YOUR READING PROFILE` (Cold-start fallback using popularity & recency weights).
   - **`≥ 3 Read Articles`**: Displays `PERSONALIZATION ACTIVE` (Full 4-factor AI hybrid vector scoring).

---

## 3. Core Service Modules (`backend/app/services/`)

| Service Module | Responsibility | Key Methods |
|---|---|---|
| [`scoring_service.py`](file:///d:/News_Recommendation_System/backend/app/services/scoring_service.py) | Hybrid mathematical scoring engine | `calculate_hybrid_score()`, `compute_recency_decay()` |
| [`recommendation_service.py`](file:///d:/News_Recommendation_System/backend/app/services/recommendation_service.py) | Candidate retrieval & rationale generation | `get_recommendations_for_user()`, `generate_rationale()` |
| [`user_profile_service.py`](file:///d:/News_Recommendation_System/backend/app/services/user_profile_service.py) | Long-term and short-term interest vector aggregation | `build_long_term_profile()`, `build_short_term_profile()` |
| [`attention_service.py`](file:///d:/News_Recommendation_System/backend/app/services/attention_service.py) | Candidate-conditioned attention mechanism | `calculate_attention_weights()` |
| [`news_service.py`](file:///d:/News_Recommendation_System/backend/app/services/news_service.py) | Ingestion, embedding generation, text search | `fetch_latest_news()`, `generate_embedding()` |
| [`analytics_service.py`](file:///d:/News_Recommendation_System/backend/app/services/analytics_service.py) | User telemetry, reading velocity & KPI tracking | `get_user_analytics()`, `log_reading_event()` |

---

## 4. Database Schema Specification (MongoDB)

### Collections:

1. **`users`**:
   - `_id`: ObjectId
   - `name`: String
   - `email`: String (Unique)
   - `password_hash`: String (bcrypt)
   - `role`: String (`"user"` or `"admin"`)
   - `created_at`: ISODate

2. **`news`**:
   - `_id`: ObjectId
   - `title`: String (Text Indexed)
   - `description`: String
   - `content`: String
   - `category`: String (Indexed)
   - `url`: String (Unique)
   - `published_at`: ISODate (Indexed)
   - `embedding`: Array of Float [384]
   - `recency_score`: Float
   - `popularity_score`: Float

3. **`reading_logs`**:
   - `_id`: ObjectId
   - `user_id`: ObjectId (Indexed)
   - `news_id`: ObjectId (Indexed)
   - `read_duration`: Integer (seconds)
   - `scroll_depth`: Float (percentage)
   - `read_at`: ISODate

4. **`bookmarks`**:
   - `_id`: ObjectId
   - `user_id`: ObjectId (Indexed)
   - `news_id`: ObjectId (Indexed)
   - `created_at`: ISODate

5. **`reactions`**:
   - `_id`: ObjectId
   - `user_id`: ObjectId (Indexed)
   - `news_id`: ObjectId (Indexed)
   - `type`: String (`"like"` or `"dislike"`)
   - `created_at`: ISODate

---

## 5. Frontend Component & Page Architecture

- **UI Framework**: React 18, Vite, Material-UI (MUI v5), Lucide / MUI Icons.
- **Container Standard**: Centered `1280px` max-width responsive wrapper across all feed pages.
- **Grid Layout**: 3-Column CSS Grid (`repeat(3, 1fr)`) on desktop, responsive collapsing to 1-column on mobile.

```
frontend/src/
├── components/
│   ├── common/              # NexoraLogo, Navigation, Footer
│   ├── Navbar/              # Top Navbar, Search Modal, ThemeToggle, ProfileMenu
│   └── News/                # NewsCard, RecommendationBadge, RationaleModal
├── context/                 # AuthContext (JWT state), ThemeContext (Light/Dark)
├── pages/
│   ├── Home.jsx             # Top Recommendation Hero + 3-Column Briefing Feed
│   ├── Discover.jsx         # Topic Filter Pills + 3-Column Category Feed
│   ├── Recommendations.jsx  # For You Feed + Reading Pulse 4-Stat Banner
│   ├── Trending.jsx         # Ranked Intelligence Leaderboard + Action Bar
│   ├── Bookmarks.jsx        # Saved Stories 3-Column MongoDB Grid
│   ├── Analytics.jsx        # Telemetry KPI Cards, Category Bars & Reading Velocity Graph
│   ├── NewsDetails.jsx      # Article Reader Page + Rationale Box + Reaction Controls
│   ├── Login.jsx            # Demo-Matched Single Card Sign In Page
│   └── Register.jsx         # Demo-Matched Single Card Sign Up Page
└── services/                # Axios API Services (newsService, authService, analyticsService)
```

---

## 6. MIND Benchmark Evaluation Pipeline

Nexora includes an automated evaluation subsystem ([`evaluator_fast.py`](file:///d:/News_Recommendation_System/backend/evaluation/evaluator_fast.py)) that validates model ranking performance against ground-truth impression logs from the **Microsoft News Dataset (MIND)**:

- **Area Under Curve (AUC)**: Measures binary classification accuracy of candidate clicks.
- **Mean Reciprocal Rank (MRR)**: Measures rank placement of the first clicked article.
- **Normalized Discounted Cumulative Gain (nDCG@5 / nDCG@10)**: Measures ranking quality across top 5 and top 10 positions.

---

## 7. Security, Performance & Fault Tolerance

1. **Authentication Security**:
   - Cryptographic JWT Bearer token authentication stored securely in client state.
   - Salted `bcrypt` password hashing.
   - Admin RBAC guard returning `403 Forbidden` on unauthorized endpoint access.
2. **Sub-100ms Scoring Speed**:
   - Vector indexing and cached embeddings ensure real-time recommendation inference under 100 milliseconds.
3. **Fault Tolerance**:
   - Automatic fallback to trending/popular stories if embedding vectors are missing or during initial cold start.
