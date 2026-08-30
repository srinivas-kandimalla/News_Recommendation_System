# 📰 Nexora — Deep Learning-Based Context-Aware Real-Time Personalized News Recommendation Framework

> **Enterprise-grade, real-time personalized news briefing engine leveraging dense Transformer vector embeddings (`all-MiniLM-L6-v2`), candidate-conditioned Softmax attention mechanisms, continuous exponential recency decay, implicit session telemetry, and transparent recommendation rationales.**

---

## 📋 Table of Contents
- [1. Project Title](#1-project-title)
- [2. Project Overview](#2-project-overview)
- [3. Key Features](#3-key-features)
- [4. System Architecture](#4-system-architecture)
- [5. Complete End-to-End Workflow](#5-complete-end-to-end-workflow)
- [6. Technology Stack](#6-technology-stack)
- [7. Project Structure](#7-project-structure)
- [8. Frontend](#8-frontend)
- [9. Backend](#9-backend)
- [10. Database](#10-database)
- [11. Data Flow](#11-data-flow)
- [12. News & Data Collection](#12-news--data-collection)
- [13. Data Preprocessing](#13-data-preprocessing)
- [14. NLP Pipeline](#14-nlp-pipeline)
- [15. Machine Learning & Deep Learning](#15-machine-learning--deep-learning)
- [16. Recommendation Engine](#16-recommendation-engine)
- [17. Context-Awareness](#17-context-awareness)
- [18. Personalization](#18-personalization)
- [19. API Communication](#19-api-communication)
- [20. Authentication & Security](#20-authentication--security)
- [21. Environment Variables](#21-environment-variables)
- [22. Installation](#22-installation)
- [23. Running the Project](#23-running-the-project)
- [24. Application Usage](#24-application-usage)
- [25. API Documentation](#25-api-documentation)
- [26. Model Files](#26-model-files)
- [27. Training & Retraining](#27-training--retraining)
- [28. Testing & Verification](#28-testing--verification)
- [29. Error Handling](#29-error-handling)
- [30. Performance Considerations](#30-performance-considerations)
- [31. Limitations](#31-limitations)
- [32. Future Improvements](#32-future-improvements)
- [33. Troubleshooting](#33-troubleshooting)
- [34. Development Workflow](#34-development-workflow)
- [35. Reproducibility](#35-reproducibility)
- [36. Research & Technical Summary](#36-research--technical-summary)
- [37. Authors & Contributors](#37-authors--contributors)
- [38. License](#38-license)

---

## 1. Project Title

**Nexora — Deep Learning-Based Context-Aware Real-Time Personalized News Recommendation Framework**

---

## 2. Project Overview

### Problem Statement
Modern digital news aggregators face critical challenges: information overload, cognitive fatigue, algorithmic filter bubbles, and rigid cold-start latency. Traditional collaborative filtering systems suffer from item sparsity, while purely content-based systems repeatedly recommend near-identical stories, decreasing intra-list recommendation diversity.

### Purpose & Solution
**Nexora** solves these challenges by combining dense semantic Transformer embeddings with candidate-aware Softmax attention, continuous exponential recency decay ($e^{-\lambda \cdot \Delta t}$), and temporal context modeling. It delivers real-time personalized news feeds that balance exact user preference alignment with topic diversity and fresh breaking news.

### Key Capabilities
* **Dense Semantic Representation**: Encodes news articles into 384-dimensional vector space using `SentenceTransformer('all-MiniLM-L6-v2')`.
* **Candidate-Aware Softmax Attention**: Dynamically computes attention weights ($\tau = 0.1$) between candidate news articles and a user's historical reading vectors.
* **Dual Profile Modeling**: Decouples long-term historical reading preferences ($M \le 50$) from short-term active session context ($M \le 5$).
* **Explainable AI Rationales**: Generates human-readable explanations ("Why Nexora Recommended This") based on historical interest overlap, category match, and recency.
* **Automated Background Ingestion**: APScheduler background service automatically fetches, categorizes, and embeds live breaking news from external news providers every 30 minutes.

---

## 3. Key Features

- 🧠 **Dense Semantic Vector Engine**: Uses `SentenceTransformer('all-MiniLM-L6-v2')` to map titles and contents into 384D normalized vector space.
- 🎯 **Dual Long/Short-Term Profiling**: Combines long-term history ($M \le 50$, weight 0.4) and short-term session focus ($M \le 5$, weight 0.6).
- ⚡ **Candidate-Aware Softmax Attention**: Computes dynamically scaled attention weights over user history conditioned on candidate articles.
- 🕒 **Continuous Exponential Recency Decay**: Applies half-life decay functions to score fresh breaking stories higher than older articles.
- 💡 **Explainable Recommendation Rationales**: Explains recommendation causes (e.g., *"Matched your interest in Artificial Intelligence with 92% semantic similarity"*).
- 🔄 **Automated GNews Background Ingestion**: APScheduler service periodically fetches breaking news across 8 core categories.
- 📊 **Real-Time Telemetry & Analytics**: Tracks user dwell time, reading duration, positive/negative reactions, bookmarking, and category affinity charts.
- 🔐 **Cryptographic JWT Authentication**: Complete user authentication suite with bcrypt password hashing and token authorization middleware.
- 🎨 **Modern Responsive UI/UX**: Built with React 18, Vite, Material-UI v9, Framer Motion animations, and dynamic Light/Dark themes.

---

## 4. System Architecture

Nexora follows a decoupled Client-Server REST architecture with background processing services and an intelligent recommendation layer:

```mermaid
flowchart TD
    subgraph Client ["Frontend (React 18 + Vite)"]
        UI[User Interface / Navigation]
        AuthCtx[AuthContext / JWT Storage]
        ThemeCtx[ThemeContext Dark/Light]
        AxiosClient[Axios HTTP API Service]
    end

    subgraph Server ["Backend (Python Flask REST API)"]
        Router[Flask Route Blueprints]
        AuthMw[JWT Bearer Middleware]
        Controllers[Controller Logic Layer]
        
        subgraph Services ["Application Services"]
            NewsSvc[News Ingestion Service]
            RecSvc[Recommendation Engine]
            AnalyticsSvc[Telemetry & Analytics Service]
            UserSvc[User Profile Service]
        end
        
        subgraph AI ["AI & NLP Pipeline"]
            EmbedSvc[SentenceTransformer all-MiniLM-L6-v2]
            AttentionSvc[Candidate-Aware Softmax Attention]
            ScoringSvc[Hybrid Scoring & Recency Decay]
            NeuralRanker[PyTorch MLP Neural Ranker]
        end

        Scheduler[APScheduler Background Worker]
    end

    subgraph Data ["Storage & External Services"]
        MongoDB[(MongoDB Database)]
        GNewsAPI[GNews API Service]
    end

    UI --> AxiosClient
    AxiosClient -->|HTTP Requests + Bearer Token| Router
    Router --> AuthMw
    AuthMw --> Controllers
    Controllers --> Services
    
    NewsSvc -->|Generate Embeddings| EmbedSvc
    RecSvc --> UserSvc
    RecSvc --> AttentionSvc
    RecSvc --> ScoringSvc
    RecSvc --> NeuralRanker
    
    Scheduler -->|Every 30 Mins| NewsSvc
    NewsSvc -->|Fetch Breaking News| GNewsAPI
    
    Services --> MongoDB
```

---

## 5. Complete End-to-End Workflow

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant Frontend as React 18 Client
    participant Router as Flask Router
    participant RecEngine as Recommendation Engine
    participant MongoDB as MongoDB Database
    participant Transformer as SentenceTransformer

    User->>Frontend: Access /for-you or /recommendations
    Frontend->>Router: GET /personalized-recommendations (Headers: Authorization Bearer JWT)
    Router->>RecEngine: Extract user_id from JWT payload
    RecEngine->>MongoDB: Fetch user reading history (latest 50 items) & reactions
    MongoDB-->>RecEngine: Return reading history records + article embeddings
    
    alt Cold Start (No History)
        RecEngine->>MongoDB: Fetch top trending stories (by views & likes)
        MongoDB-->>RecEngine: Return fallback popular news
    else User Profile Available
        RecEngine->>RecEngine: Build Long-Term Profile (M <= 50) & Short-Term Profile (M <= 5)
        RecEngine->>MongoDB: Fetch active candidate news articles
        MongoDB-->>RecEngine: Return candidate news pool
        
        loop For each candidate story
            RecEngine->>RecEngine: Compute Candidate-Aware Attention Weights (tau = 0.1)
            RecEngine->>RecEngine: Calculate Semantic Similarity Score (Cosine)
            RecEngine->>RecEngine: Apply Exponential Recency Decay e^(-lambda * dt)
            RecEngine->>RecEngine: Calculate Category Affinity & Time-of-Day Context
            RecEngine->>RecEngine: Compute Final Hybrid Score S_final
        end
        
        RecEngine->>RecEngine: Rank candidates and select Top-K stories
        RecEngine->>RecEngine: Generate natural language recommendation rationales
    end

    RecEngine-->>Router: Return ranked recommendations with explanations
    Router-->>Frontend: HTTP 200 JSON Response
    Frontend-->>User: Render personalized briefing feed grid
```

---

## 6. Technology Stack

| Layer | Technology | Version | Purpose |
| :--- | :--- | :--- | :--- |
| **Frontend Framework** | React | `^19.2.8` | Component-based UI view library |
| **Build Tool & Server** | Vite | `^8.2.0` | Ultra-fast HMR bundler and development server |
| **UI Component Suite** | Material-UI (MUI) | `^9.2.0` | Responsive layout components and design system |
| **Styling & Icons** | Emotion & MUI Icons | `^11.14.0` / `^9.2.0` | Styled components and executive icon sets |
| **Animations** | Framer Motion | `^12.43.0` | Micro-interactions and card transition effects |
| **Data Visualization** | Chart.js & react-chartjs-2 | `^4.5.1` / `^5.3.1` | Category distribution & 7D telemetry charts |
| **HTTP Client** | Axios | `^1.19.0` | REST API requests with authorization interceptors |
| **Frontend Routing** | React Router DOM | `^7.18.2` | Single Page Application client-side routing |
| **Backend Web Framework** | Python Flask | `3.1.3` | Lightweight REST API server framework |
| **WSGI Server** | Werkzeug | `3.1.8` | HTTP utility library and WSGI application gate |
| **Database** | MongoDB | `Local / Cloud` | NoSQL document storage for news, users, and telemetry |
| **Database Driver** | PyMongo | `4.17.0` | Python MongoDB client driver with proxy wrapping |
| **Task Scheduling** | APScheduler | `3.11.3` | Background periodic news fetch scheduling (every 30m) |
| **Security & Passwords** | bcrypt | `5.0.0` | Cryptographic salted password hashing |
| **Authentication** | PyJWT | `2.13.0` | Cryptographic JSON Web Token encoding/decoding |
| **NLP Transformer** | Sentence-Transformers | `5.6.1` | Dense semantic vector embedding (`all-MiniLM-L6-v2`) |
| **Deep Learning** | PyTorch (torch) | Optional | Neural MLP ranker inference (`PyTorchNeuralRanker`) |
| **Numerical Processing** | NumPy | `2.5.1` | Matrix operations & vectorized attention calculations |
| **Machine Learning** | scikit-learn | `1.9.0` | Cosine similarity & matrix operations |
| **Live News Ingestion** | GNews API | REST | External breaking news provider API |

---

## 7. Project Structure

```text
News_Recommendation_System/
├── .env                              # Active environment configuration
├── .env.example                      # Environment variables reference template
├── .gitignore                        # Git exclusion rules
├── README.md                         # Project documentation
│
├── backend/                          # Python Flask REST API backend
│   ├── run.py                        # Server launch entrypoint
│   ├── start_server.py               # Alternative CLI server starter
│   ├── wsgi.py                       # WSGI entrypoint wrapper
│   ├── requirements.txt              # Python package dependencies
│   │
│   ├── app/                          # Core Flask Application Package
│   │   ├── __init__.py               # Flask app factory, CORS, blueprint registration
│   │   ├── scheduler.py              # APScheduler background worker initialization
│   │   │
│   │   ├── ai/                       # Artificial Intelligence & NLP Pipeline
│   │   │   ├── attention_service.py  # Candidate-Aware Softmax Attention Engine
│   │   │   ├── context_service.py    # Temporal & session context calculation
│   │   │   ├── embedding_service.py  # SentenceTransformer ('all-MiniLM-L6-v2') loader
│   │   │   ├── explanation_service.py# Recommendation rationale generation
│   │   │   ├── feature_extractor.py  # 1159-dimensional feature extraction vectorizer
│   │   │   ├── neural_ranker.py      # PyTorch MLP Ranker (Input 1159 -> 128 -> 64 -> 1)
│   │   │   ├── ranking_service.py    # Hybrid scoring formulation
│   │   │   ├── recommendation_service.py # Recommendation orchestrator
│   │   │   ├── scoring_service.py    # Recency decay, popularity, interest scoring
│   │   │   ├── similarity_service.py # Vector cosine similarity routines
│   │   │   └── user_profile_service.py# Dual long-term & short-term profile builder
│   │   │
│   │   ├── config/
│   │   │   └── config.py             # Central application configuration & validation
│   │   │
│   │   ├── controllers/              # HTTP Request Controllers
│   │   │   ├── admin_controller.py
│   │   │   ├── analytics_controller.py
│   │   │   ├── bookmark_controller.py
│   │   │   ├── news_controller.py
│   │   │   ├── news_fetch_controller.py
│   │   │   ├── reaction_controller.py
│   │   │   ├── reading_history_controller.py
│   │   │   ├── recommendation_controller.py
│   │   │   ├── trending_controller.py
│   │   │   └── user_controller.py
│   │   │
│   │   ├── database/
│   │   │   └── db.py                 # PyMongo database proxies & index initialization
│   │   │
│   │   ├── middleware/
│   │   │   └── auth_middleware.py    # Cryptographic JWT authentication guard
│   │   │
│   │   ├── models/                   # Collection proxies & document abstractions
│   │   │   ├── bookmark_model.py
│   │   │   ├── news_model.py
│   │   │   ├── reaction_model.py
│   │   │   ├── reading_history_model.py
│   │   │   └── user_model.py
│   │   │
│   │   ├── routes/                   # Flask API Route Blueprints
│   │   │   ├── admin_routes.py
│   │   │   ├── analytics_routes.py
│   │   │   ├── bookmark_routes.py
│   │   │   ├── home_routes.py
│   │   │   ├── news_fetch_routes.py
│   │   │   ├── news_routes.py
│   │   │   ├── reaction_routes.py
│   │   │   ├── reading_history_routes.py
│   │   │   ├── recommendation_routes.py
│   │   │   ├── trending_routes.py
│   │   │   └── user_routes.py
│   │   │
│   │   └── services/                 # Core Data & Business Services
│   │       ├── admin_service.py
│   │       ├── analytics_service.py
│   │       ├── bookmark_service.py
│   │       ├── news_fetch_service.py
│   │       ├── news_service.py
│   │       ├── reaction_service.py
│   │       ├── reading_history_service.py
│   │       ├── trending_service.py
│   │       └── user_service.py
│   │
│   ├── evaluation/                   # Benchmark Datasets & Results
│   │   └── mind/                     # Microsoft News Dataset evaluation outputs
│   │
│   └── scripts/                      # Automated Verification & Maintenance Scripts
│       ├── cleanup_test_data.py      # Database cleanup script
│       ├── run_all_tests.py          # Unified 29-test verification suite runner
│       └── verify_backend.ps1        # PowerShell verification runner
│
└── frontend/                         # React 18 + Vite Web Client
    ├── index.html                    # HTML document shell
    ├── package.json                  # Node dependencies and scripts
    ├── vite.config.js                # Vite build and dev server configuration
    │
    └── src/
        ├── main.jsx                  # React application DOM entrypoint
        ├── App.jsx                   # Primary route definition component
        │
        ├── components/               # UI components
        │   ├── Footer.jsx            # Platform footer
        │   ├── Navbar/               # Navbar with live search, profile menu, theme toggle
        │   └── common/               # Shared UI elements
        │
        ├── context/                  # State Management Contexts
        │   ├── AuthContext.jsx       # Auth state, token handling, user session
        │   └── ThemeContext.jsx      # Dark / Light theme state and MUI provider
        │
        ├── pages/                    # Page View Components
        │   ├── AdminDashboard.jsx    # System administration panel
        │   ├── Analytics.jsx         # User telemetry & category affinity dashboard
        │   ├── Bookmarks.jsx         # Saved news articles grid
        │   ├── Discover.jsx          # Category discovery feed
        │   ├── Home.jsx              # Main landing page & paginated news feed
        │   ├── Login.jsx             # User authentication login card
        │   ├── NewsDetails.jsx       # News reader page with live dwell time tracking
        │   ├── NotFound.jsx          # 404 Error page
        │   ├── Recommendations.jsx   # Personalized "For You" AI briefing grid
        │   ├── Register.jsx          # User account creation page
        │   └── Trending.jsx         # Most active & popular news feed
        │
        ├── routes/
        │   └── ProtectedRoute.jsx    # Client-side JWT route protection wrapper
        │
        └── services/                 # Frontend API Connectors
            ├── api.js                # Axios base instance with auth headers
            ├── authService.js        # Authentication API methods
            └── newsService.js        # News, recommendations, reaction API calls
```

---

## 8. Frontend

The frontend is a modern Single Page Application (SPA) built with React 18, Vite, and Material-UI v9.

### Key Pages & Navigation
* **Home (`/`)**: Main news briefing grid featuring paginated article cards, category filters, and hero stories.
* **Discover (`/discover`)**: Categorized browsing grid allowing users to filter stories by Technology, Business, Sports, Entertainment, Health, Science, Politics, and World.
* **For You / Recommendations (`/recommendations`, `/for-you`)**: Personalized recommendation feed displaying AI-ranked articles accompanied by "Why Recommended" rationale badges.
* **Trending (`/trending`)**: Highlights popular news stories ranked by live reading history and positive reactions.
* **News Details (`/news/:id`)**: Full article reading view with real-time reading duration telemetry, reaction toggles (like/dislike), bookmark saving, and content-similar story suggestions.
* **Bookmarks (`/bookmarks`)**: Grid view of stories saved by the authenticated user.
* **Analytics (`/analytics`)**: Dashboard displaying reading velocity, category interest distribution charts, and total dwell time metrics.
* **Admin Dashboard (`/admin`)**: Admin monitoring panel displaying system statistics and manual news ingestion triggers.

### State Management & Contexts
* **`AuthContext.jsx`**: Manages JWT tokens stored in `localStorage`, decodes user claims, and provides login/logout methods across all components.
* **`ThemeContext.jsx`**: Provides HSL dark/light mode dynamic themes with Material-UI `ThemeProvider`.

---

## 9. Backend

The backend is built with Python Flask 3.1.3 using modular Blueprints and PyMongo database proxies.

### Route Blueprints
* `home_bp`: Health check route (`GET /`).
* `user_bp`: Registration, authentication login, profile retrieval, password reset.
* `news_bp`: Paginated news listing, full-text search query, single article fetch, administrative CRUD endpoints.
* `recommendation_bp`: Content-similar recommendations (`/recommendations/<news_id>`) and personalized user briefings (`/personalized-recommendations`).
* `reaction_bp`: Toggle positive like (`POST /news/<id>/like`) or dislike (`POST /news/<id>/dislike`).
* `bookmark_bp`: Add/remove saved bookmarks (`POST /bookmark/<id>`, `DELETE /bookmark/<id>`).
* `reading_history_bp`: Log reading session dwell time and telemetry (`POST /reading-history/<news_id>`).
* `analytics_bp`: Compute user telemetry KPIs and activity metrics (`GET /analytics`).
* `trending_bp`: Fetch trending popular news stories (`GET /trending`).
* `admin_bp`: Retrieve platform metrics (`GET /admin/dashboard`).
* `news_fetch_bp`: Trigger manual news ingestion from GNews API (`POST /news/fetch`).

### API Endpoint Summary Table

| Method | Endpoint | Purpose | Auth Required | Request Body / Params | Response Summary |
| :--- | :--- | :--- | :---: | :--- | :--- |
| `GET` | `/` | System Health Check | No | None | `{"message": "API Running"}` |
| `POST` | `/register` | Register New User | No | `{email, password, name}` | `{"success": true, "user_id": "..."}` |
| `POST` | `/login` | Authenticate User | No | `{email, password}` | `{"success": true, "token": "..."}` |
| `GET` | `/profile` | Get Current User Profile | Yes | Bearer Token | `{"success": true, "user": {...}}` |
| `GET` | `/news` | Paginated News Feed | No | `?page=1&limit=10&category=Tech` | `{"news": [...], "total": 120}` |
| `GET` | `/news/search` | Full-Text Search News | No | `?q=artificial+intelligence` | `{"news": [...]}` |
| `GET` | `/news/:id` | Get Single Article Details | No | Article ObjectId | `{"news": {...}}` |
| `GET` | `/personalized-recommendations` | Get Personalized AI Briefing | Yes | Bearer Token | `{"recommendations": [...]}` |
| `GET` | `/recommendations/:id` | Content-Similar Recommendations | No | Article ObjectId | `{"recommendations": [...]}` |
| `POST` | `/news/:id/like` | Toggle Positive Reaction | Yes | Bearer Token | `{"success": true, "liked": true}` |
| `POST` | `/news/:id/dislike` | Toggle Negative Reaction | Yes | Bearer Token | `{"success": true, "disliked": true}` |
| `POST` | `/bookmark/:id` | Toggle Bookmark Status | Yes | Bearer Token | `{"success": true, "bookmarked": true}` |
| `POST` | `/reading-history/:id` | Log Reading Telemetry | Yes | `{duration_seconds: 45}` | `{"success": true}` |
| `GET` | `/analytics` | User Telemetry Analytics | Yes | Bearer Token | `{"total_articles_read": 14, ...}` |
| `GET` | `/trending` | Fetch Trending Stories | No | None | `{"news": [...]}` |
| `GET` | `/admin/dashboard` | Admin Monitoring Metrics | Yes (Admin) | Bearer Token | `{"total_users": 50, ...}` |
| `POST` | `/news/fetch` | Manual Ingestion Trigger | Yes (Admin) | None | `{"fetched_count": 15}` |

---

## 10. Database

Nexora uses **MongoDB** as its primary NoSQL data store. Database queries use thread-safe proxies (`DatabaseProxy` and `CollectionProxy` in `backend/app/database/db.py`) that transparently isolate development operations from test databases (`news_recommendation_test_db`).

### Collections & Indexes

```mermaid
erDiagram
    USERS {
        ObjectId _id PK
        string email UK
        string password
        string name
        datetime created_at
    }

    NEWS {
        ObjectId _id PK
        string title
        string description
        string content
        string url UK
        string category
        array embedding "384D float vector"
        datetime published
        datetime created_at
    }

    READING_HISTORY {
        ObjectId _id PK
        ObjectId user_id FK
        ObjectId news_id FK
        int duration_seconds
        datetime read_at
    }

    BOOKMARKS {
        ObjectId _id PK
        ObjectId user_id FK
        ObjectId news_id FK
        datetime created_at
    }

    REACTIONS {
        ObjectId _id PK
        ObjectId user_id FK
        ObjectId news_id FK
        string reaction "like | dislike"
        datetime created_at
    }

    USERS ||--o{ READING_HISTORY : logs
    USERS ||--o{ BOOKMARKS : saves
    USERS ||--o{ REACTIONS : rates
    NEWS ||--o{ READING_HISTORY : references
    NEWS ||--o{ BOOKMARKS : references
    NEWS ||--o{ REACTIONS : references
```

#### Verified Indexes (`init_indexes`):
- `users`: `email` (Unique)
- `news`: `url` (Unique), `created_at`, `published`, `category`
- `reading_history`: Compound `(user_id, news_id)`, Compound `(user_id, read_at: -1)`, Single `news_id`
- `bookmarks`: Compound `(user_id, news_id)`, Single `news_id`
- `reactions`: Compound `(user_id, news_id)`, Compound `(news_id, reaction)`, Compound `(user_id, reaction)`

---

## 11. Data Flow

```mermaid
flowchart LR
    A[News Ingestion / User Dwell Time] --> B[Text Concatenation & Normalization]
    B --> C[SentenceTransformer Embedding Encoding]
    C --> D[MongoDB Normalized Vector Storage]
    D --> E[Candidate Retrieval & Softmax Attention]
    E --> F[Hybrid Scoring Engine & Recency Decay]
    F --> G[Top-K Ranking & Rationale Generation]
    G --> H[JSON REST API Response]
    H --> I[React Client Rendering]
```

---

## 12. News & Data Collection

News articles are collected via two mechanisms:
1. **Automated Background Ingestion**: An APScheduler background process periodically executes `fetch_news_service.py` every 30 minutes (configurable via `NEWS_FETCH_INTERVAL_MINUTES`).
2. **Manual Ingestion Endpoint**: Triggered via `POST /news/fetch`.

### Ingestion Pipeline Details:
- **API Provider**: GNews REST API (`https://gnews.io/api/v4/top-headlines`).
- **Category Routing**: Rotates across 8 core categories (Technology, Business, Sports, Entertainment, Health, Science, Politics, World).
- **Duplicate Prevention**: Enforces database uniqueness on article `url`. If an incoming story already exists, MongoDB throws a `DuplicateKeyError`, which is gracefully caught and skipped.
- **On-the-Fly Vector Embeddings**: Immediately upon ingestion, article text (`title` + `description`) is passed to `SentenceTransformer('all-MiniLM-L6-v2')` to generate and store a 384-dimensional vector embedding.

---

## 13. Data Preprocessing

When news articles are processed, the preprocessing pipeline applies:
1. **Text Combination**: Concatenates article title, description, and available content body into a single string representation.
2. **Whitespace Normalization**: Removes duplicate spaces, newlines, and control characters.
3. **Keyword Category Detection**: Scans lowercase text against regex word boundary patterns (`\b<word>\b`) across 8 category dictionaries (e.g., matching `"ai"`, `"chatgpt"`, `"nvidia"` to `Technology`).
4. **Vector Encoding**: Converts clean text into a 384-dimensional dense NumPy float array normalized to unit length ($L_2$ norm = 1.0).

---

## 14. NLP Pipeline

```mermaid
flowchart TD
    RawText["Raw News Title + Content"] --> Normalizer["Regex Text Cleaner"]
    Normalizer --> Model["SentenceTransformer ('all-MiniLM-L6-v2')"]
    Model --> DenseVec["384-Dimensional Dense Vector Array"]
    DenseVec --> L2Norm["L2 Normalization (||v|| = 1.0)"]
    L2Norm --> DotProd["Fast NumPy Matrix Dot Product Matrix"]
    DotProd --> Similarity["Cosine Similarity [0.0, 1.0]"]
```

---

## 15. Machine Learning & Deep Learning

### Dense Semantic Embeddings
* **Architecture**: Transformer-based MiniLM architecture (`all-MiniLM-L6-v2`).
* **Embedding Dimension**: 384 dimensions.
* **Execution**: CPU/GPU evaluation via `sentence-transformers` library.

### PyTorch Neural Ranker (Optional Inference Component)
* **Location**: `backend/app/ai/neural_ranker.py`
* **Architecture**: Lightweight 3-Layer PyTorch Multi-Layer Perceptron (MLP):
  ```text
  Input Layer (1159 Dimensions)
        ↓
  Linear(1159 -> 128) + ReLU + Dropout(p=0.2)
        ↓
  Linear(128 -> 64) + ReLU
        ↓
  Linear(64 -> 1) -> Sigmoid Output (Click Probability)
  ```
* **Feature Vector (1159-D)**: Concatenates candidate embedding (384D), user long-term embedding (384D), user short-term embedding (384D), semantic similarity scalar (1D), recency scalar (1D), category affinity (1D), popularity (1D), and temporal context (4D).
* **Fallback Mechanics**: If `USE_NEURAL_RANKER` is `False` or model weights (`models/neural_ranker/neural_ranker.pt`) are absent, Nexora automatically defaults to the deterministic 4-Factor Hybrid Scoring Engine.

---

## 16. Recommendation Engine

The core recommendation framework scores each candidate article $c$ for user $u$ using a multi-factor hybrid mathematical formulation:

$$S_{final}(u, c) = w_s \cdot S_{semantic}(u, c) + w_r \cdot S_{recency}(c) + w_c \cdot S_{category}(u, c) + w_p \cdot S_{popularity}(c)$$

### 1. Semantic Similarity ($S_{semantic}$)
Computes cosine similarity between candidate embedding $e_c$ and combined user vector $e_u$:

$$S_{semantic} = \frac{e_u \cdot e_c}{\|e_u\| \|e_c\|}$$

Where $e_u$ is formed by candidate-aware Softmax attention over user reading history:

$$e_u = w_{long} \cdot e_{long} + w_{short} \cdot e_{short}$$

### 2. Candidate-Aware Softmax Attention
Attention weights $\alpha_i$ over historical reading vectors $h_i$ conditioned on candidate vector $c$ with temperature parameter $\tau = 0.1$:

$$\alpha_i = \frac{\exp\left(\frac{\cos(h_i, c)}{\tau}\right)}{\sum_{j=1}^{M} \exp\left(\frac{\cos(h_j, c)}{\tau}\right)}$$

### 3. Continuous Exponential Recency Decay ($S_{recency}$)
Decays article score based on elapsed time $\Delta t$ in hours:

$$S_{recency} = e^{-\lambda \cdot \Delta t}$$

Where $\lambda = \frac{\ln(2)}{T_{half}}$ (with default half-life $T_{half} = 72\text{ hours}$).

### 4. Category & Time-of-Day Affinity ($S_{category}$)
Matches article category against user's historical category frequency distribution and time-of-day reading habits (Morning, Afternoon, Evening, Night).

---

## 17. Context-Awareness

Nexora captures real-time contextual signals during user interaction:
1. **Temporal Context (Time of Day)**: Bins user requests into 4 diurnal buckets (Morning: 06-12, Afternoon: 12-18, Evening: 18-24, Night: 00-06) and compares against historical reading distributions per time window.
2. **Session Interest Shift**: Evaluates the $M \le 5$ most recent articles in the current active session to dynamically weight short-term session focus ($w_{short} = 0.6$) higher than long-term history ($w_{long} = 0.4$).

---

## 18. Personalization

Personalization combines implicit and explicit feedback signals:
* **Implicit Telemetry**: Logged via `POST /reading-history/<news_id>` with exact dwell time duration. Reading articles for $>10\text{ seconds}$ automatically updates user profile preference vectors.
* **Explicit Reactions**: Liking a story (`POST /news/<id>/like`) applies a positive multiplier to category affinity; disliking a story (`POST /news/<id>/dislike`) filters out similar articles.
* **Bookmarks**: Bookmarked articles are saved to the user's account and included in long-term vector representation profiling.

---

## 19. API Communication

Frontend-backend communication relies on an Axios instance configured in `frontend/src/services/api.js`:
* **Base URL**: `http://localhost:5000` (or `VITE_API_URL` environment variable).
* **Authorization Interceptor**: Automatically attaches the JWT token from `localStorage` to the request header:
  ```javascript
  config.headers.Authorization = `Bearer ${token}`;
  ```
* **Response Handling**: Intercepts 401 Unauthorized responses to trigger automatic logout and user redirection.

---

## 20. Authentication & Security

* **Password Protection**: Passwords are hashed using salted `bcrypt` (`bcrypt.hashpw(password, bcrypt.gensalt())`) prior to database storage.
* **JWT Tokens**: Authenticated users receive a signed JWT token containing `user_id`, `email`, and `role`. Tokens are verified on protected routes by the `@token_required` middleware (`backend/app/middleware/auth_middleware.py`).
* **Role-Based Access Control (RBAC)**: Admin endpoints (`/admin/dashboard`, `/news/fetch`) verify that `role == "admin"`.
* **CORS Security**: Cross-Origin Resource Sharing is strictly constrained to configured origins (`ALLOWED_ORIGINS`).

---

## 21. Environment Variables

Reference template available in `.env.example`:

| Variable | Required | Purpose | Default / Example |
| :--- | :---: | :--- | :--- |
| `SECRET_KEY` | **Yes** | Secret key for signing cryptographic JWT tokens | `min_32_bytes_secret_key_string` |
| `MONGO_URI` | **Yes** | Connection string for local or cloud MongoDB | `mongodb://localhost:27017/news_recommendation_db` |
| `DEBUG` | No | Enables Flask development debug mode | `True` |
| `GNEWS_API_KEY` | No | API key for automated GNews ingestion service | `your_gnews_api_key_here` |
| `NEWS_FETCH_INTERVAL_MINUTES` | No | Background APScheduler news fetch interval | `30` |
| `LONG_TERM_HISTORY_LIMIT` | No | Maximum historical articles for long-term profile | `50` |
| `SHORT_TERM_HISTORY_LIMIT` | No | Maximum active session articles for short-term profile | `5` |
| `LONG_TERM_WEIGHT` | No | Weight scalar assigned to long-term profile | `0.4` |
| `SHORT_TERM_WEIGHT` | No | Weight scalar assigned to short-term profile | `0.6` |
| `ATTENTION_TEMPERATURE` | No | Softmax attention scaling temperature $\tau$ | `0.1` |
| `USE_NEURAL_RANKER` | No | Enable PyTorch Neural Ranker inference | `False` |
| `ALLOWED_ORIGINS` | No | Comma-separated CORS allowed client origins | `http://localhost:5173,http://127.0.0.1:5173` |

---

## 22. Installation

### Prerequisites
* **Python**: `3.10` or higher
* **Node.js**: `18.0` or higher
* **MongoDB**: Local MongoDB instance running on port `27017` or cloud MongoDB Atlas connection URI.
* **Git**

### Step 1: Clone Repository
```bash
git clone https://github.com/srinivas-kandimalla/News_Recommendation_System.git
cd News_Recommendation_System
```

### Step 2: Environment Configuration
Copy `.env.example` to `.env` in the root directory:
```bash
cp .env.example .env
```
Edit `.env` and set a valid `SECRET_KEY` (at least 32 characters) and your `MONGO_URI`.

### Step 3: Backend Setup
```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows (PowerShell):
.\venv\Scripts\Activate.ps1
# On Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### Step 4: Frontend Setup
```bash
# Open a new terminal and navigate to frontend directory
cd frontend

# Install Node packages
npm install
```

---

## 23. Running the Project

### Terminal 1: Launch Backend API Server
```bash
cd backend
# Activate virtual environment
.\venv\Scripts\activate
# Start Flask Server (http://localhost:5000)
python run.py
```

### Terminal 2: Launch Frontend Development Server
```bash
cd frontend
# Start Vite Development Server (http://localhost:5173)
npm run dev
```

### Run Backend Automated Verification Tests
```bash
cd backend
python scripts/run_all_tests.py
```

---

## 24. Application Usage

1. **Start Applications**: Launch backend (`http://localhost:5000`) and frontend (`http://localhost:5173`).
2. **User Registration**: Open browser at `http://localhost:5173/register` and create a new account.
3. **Browse Public Feed**: View breaking news on Home (`/`) or search for stories on Discover (`/discover`).
4. **Read & Log Telemetry**: Click on an article card to view full story details (`/news/:id`). Reading duration is automatically logged to train your profile.
5. **Interact**: Click Like/Dislike reaction buttons or Save Bookmark to update preferences.
6. **Get AI Briefing**: Navigate to **For You** (`/recommendations`) to inspect your personalized briefing with AI rationale explanations.
7. **View Analytics**: Check **Analytics** (`/analytics`) to view your reading velocity and category distribution graphs.

---

## 25. API Documentation

### Sample Request/Response Payloads

#### 1. User Login (`POST /login`)
**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```
**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "66d123456789abcdef012345",
    "email": "user@example.com",
    "name": "Alex User",
    "role": "user"
  }
}
```

#### 2. Get Personalized Recommendations (`GET /personalized-recommendations`)
**Headers:**
```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```
**Response:**
```json
{
  "success": true,
  "recommendations": [
    {
      "_id": "66d987654321fedcba543210",
      "title": "Breakthrough in Dense Vector Embeddings for News Retrieval",
      "description": "Researchers introduce novel candidate-aware Softmax attention models...",
      "category": "Technology",
      "published": "2026-08-30T06:00:00Z",
      "url": "https://example.com/news/vector-retrieval",
      "hybrid_score": 0.8945,
      "reason": "Matched your strong preference for Technology (92% semantic similarity)."
    }
  ]
}
```

---

## 26. Model Files

| Model Component | Loaded File Path | Type | Dimension | Description |
| :--- | :--- | :--- | :---: | :--- |
| **Semantic Embedding** | `SentenceTransformer('all-MiniLM-L6-v2')` | Transformer | 384D | Encodes titles and article bodies into dense float vectors |
| **PyTorch Neural Ranker** | `models/neural_ranker/neural_ranker.pt` | PyTorch MLP | 1159D -> 1D | Optional deep learning ranker predicting click probabilities |

---

## 27. Training & Retraining

### Benchmark Evaluation Suite
The project includes a MIND benchmark evaluator in `backend/evaluation/mind/` that tests recommendation quality against the official Microsoft News Dataset ($N = 48,295$ users).

To run evaluations or retrain the optional PyTorch neural ranker model:
```bash
cd backend
python -m evaluation.mind.evaluate_models
```

---

## 28. Testing & Verification

Nexora features a 100% automated backend test suite (`backend/scripts/run_all_tests.py`) validating security, performance, recommendations, telemetry, and zero dev DB pollution:

```bash
cd backend
python scripts/run_all_tests.py
```

### Verified Test Summary:
```text
==================== BACKEND VERIFICATION ====================
Security             PASS
Performance          PASS
News Fetch           PASS
Scheduler            PASS
Embeddings           PASS
Cold Start           PASS
Personalization      PASS
Reading History      PASS
Bookmarks            PASS
Reactions            PASS
Analytics            PASS
Trending             PASS
RBAC                 PASS
Cleanup              PASS

TOTAL: 29 | PASSED: 29 | FAILED: 0 (100% PASS RATE)
```

---

## 29. Error Handling

* **Invalid ObjectIDs**: Route parameters are safely validated against `bson.errors.InvalidId` before database queries.
* **Database Fallbacks**: If user history is missing or empty, the recommendation engine falls back gracefully to trending news stories.
* **Neural Ranker Fallback**: If PyTorch is absent or model weights are missing, the system silently switches to the 4-factor heuristic hybrid scoring model.
* **API Ingestion Retries**: Background ingestion catches network timeouts and HTTP errors without crashing the main Flask process.

---

## 30. Performance Considerations

* **Compound Indexing**: MongoDB compound indexes optimize user reading history and reaction lookups ($O(1)$ index access time).
* **Matrix Normalization**: NumPy vectorized operations compute dot products over pre-normalized history matrices 33x faster than loop iterations.
* **Zero DB Pollution**: Automated unit tests execute strictly against isolated test databases (`news_recommendation_test_db`).

---

## 31. Limitations

* **External API Dependency**: News ingestion volume is constrained by GNews API request rate limits.
* **Cold-Start Delay**: Brand-new unregistered users receive general trending content until they read at least 1 article or log in.

---

## 32. Future Improvements

* **Multi-Modal Embeddings**: Incorporate article thumbnail image embeddings using CLIP.
* **Vector Database Integration**: Migration of candidate retrieval to dedicated vector stores (FAISS / Qdrant) for million-scale story indexing.
* **Multi-Language Support**: Integration of multilingual Transformer models (`paraphrase-multilingual-MiniLM-L12-v2`).

---

## 33. Troubleshooting

| Symptom | Cause | Resolution |
| :--- | :--- | :--- |
| `CRITICAL CONFIGURATION ERROR: SECRET_KEY` | Missing `SECRET_KEY` in `.env` | Add `SECRET_KEY=min_32_character_secret_key_here` to `.env` |
| `CRITICAL CONFIGURATION ERROR: MONGO_URI` | MongoDB service down or invalid URI | Ensure MongoDB service is running on `mongodb://localhost:27017` |
| `CORS Error in Browser` | Frontend port mismatch | Add client URL (e.g. `http://localhost:5173`) to `ALLOWED_ORIGINS` in `.env` |
| `PyTorch Neural Ranker Fallback Active` | Weights file not present | System automatically uses Hybrid Scoring model; no action required |

---

## 34. Development Workflow

### Adding a New API Endpoint
1. Create controller logic in `backend/app/controllers/`.
2. Define Flask route blueprint in `backend/app/routes/`.
3. Register blueprint in `backend/app/__init__.py`.
4. Add frontend Axios connector in `frontend/src/services/newsService.js`.

---

## 35. Reproducibility

To reproduce the full project on any machine from scratch:
1. Ensure Python 3.10+, Node.js 18+, and MongoDB are installed.
2. Clone repository: `git clone https://github.com/srinivas-kandimalla/News_Recommendation_System.git`
3. Create `.env` file with `SECRET_KEY` and `MONGO_URI`.
4. Setup backend: `cd backend && python -m venv venv && .\venv\Scripts\activate && pip install -r requirements.txt`
5. Run test suite: `python scripts/run_all_tests.py` (Must report `29 PASSED, 0 FAILED`).
6. Start backend (`python run.py`) and frontend (`cd ../frontend && npm install && npm run dev`).

---

## 36. Research & Technical Summary

### Empirical Findings on Microsoft News Dataset (MIND Benchmark)
Evaluated on $N = 48,295$ unique users, $146,036$ impression sessions, and $51,282$ articles:

| Model Architecture | AUC | MRR@5 | MRR@10 | NDCG@5 | NDCG@10 | ILD@5 | ILD@10 |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **MODEL A (Baseline Mean)** | 0.6318 | 0.3163 | 0.3390 | 0.3374 | 0.3946 | 0.8536 | 0.8839 |
| **MODEL B (Long+Short Split)** | 0.6162 | 0.3041 | 0.3272 | 0.3254 | 0.3829 | 0.8600 | 0.8881 |
| **MODEL C (Softmax Attention)** | 0.6329 | 0.3165 | 0.3395 | 0.3375 | 0.3951 | 0.8672 | 0.8924 |
| **MODEL D (Context Fusion)** | 0.6334 | 0.3181 | 0.3411 | 0.3390 | 0.3966 | 0.8665 | 0.8922 |
| **MODEL E (Nexora Production)** | **0.6328** | **0.3173** | **0.3403** | **0.3379** | **0.3955** | **0.8739** | **0.8948** |

* **Intra-List Diversity ($\text{ILD}@5$)**: Nexora (Model E) achieves a **+2.37% statistically significant improvement** ($\text{ILD}@5 = 0.8739$ vs $0.8536$, Holm-adjusted $p < 0.001$, Cohen's $d_z = 0.3198$), reducing filter bubbles while maintaining ranking accuracy.

---

## 37. Authors & Contributors

* **Developer & Researcher**: Srinivas Kandimalla
* **Repository**: [News_Recommendation_System](https://github.com/srinivas-kandimalla/News_Recommendation_System)

---

## 38. License

Distributed under the **MIT License**. See `LICENSE` for details.