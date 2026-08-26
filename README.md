# 📰 Nexora — Context-Aware AI News Recommendation System

> **Enterprise-grade, real-time personalized news briefing engine leveraging dense Transformer vector embeddings (`all-MiniLM-L6-v2`), candidate-conditioned attention mechanisms, continuous exponential recency decay, implicit session telemetry, and transparent recommendation rationales.**

---

## 🌟 Key Features & Technical Highlights

- 🧠 **Dense Semantic Embedding Space**: Uses `SentenceTransformer('all-MiniLM-L6-v2')` to map news titles and full text into a 384-dimensional dense vector space.
- ⚡ **4-Factor Hybrid Scoring Engine**: Balances content semantic similarity, continuous exponential recency decay ($e^{-\lambda \cdot \Delta t}$), category affinity weighting, and session time-of-day context.
- 🎯 **Dual Long-Term / Short-Term Profiling**: Decouples historical reading affinity ($M \le 50$) from recent reading session focus ($M \le 5$) with Candidate-Aware Softmax Attention ($\tau = 0.1$).
- 💡 **Transparent AI Rationales**: Generates human-readable *"Why Nexora Recommended This"* break-down explanations for top recommended stories.
- 📈 **Real-Time Telemetry & Intelligence Analytics**: Live tracking of user dwell time, positive/negative reactions, bookmark persistence, category distribution meters, and 7D/30D reading velocity charts.
- 🔄 **Automated GNews Ingestion Pipeline**: Background APScheduler service ingesting, categorizing, and embedding breaking news every 30 minutes.
- 🎨 **Executive UI / UX Design Suite**: Responsive React 18 + Vite client featuring uniform 1280px 3-column feed grids, smooth HSL dark/light modes, and a clean single-card authentication suite.

---

## 📊 MIND Benchmark Evaluation Results

Evaluated on the full official **Microsoft News Dataset (MIND-small benchmark)** ($N = 48,295$ unique users, $146,036$ impression sessions, $51,282$ news articles):

| Model Architecture | AUC | MRR@5 | MRR@10 | NDCG@5 | NDCG@10 | ILD@5 | ILD@10 |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **MODEL A (Baseline Mean)** | 0.6318 | 0.3163 | 0.3390 | 0.3374 | 0.3946 | 0.8536 | 0.8839 |
| **MODEL B (Long+Short Split)** | 0.6162 | 0.3041 | 0.3272 | 0.3254 | 0.3829 | 0.8600 | 0.8881 |
| **MODEL C (Softmax Attention)** | 0.6329 | 0.3165 | 0.3395 | 0.3375 | 0.3951 | 0.8672 | 0.8924 |
| **MODEL D (Context Fusion)** | 0.6334 | 0.3181 | 0.3411 | 0.3390 | 0.3966 | 0.8665 | 0.8922 |
| **MODEL E (Nexora Production System)** | **0.6328** | **0.3173** | **0.3403** | **0.3379** | **0.3955** | **0.8739** | **0.8948** |

### Key Empirical Findings:
- **Intra-List Diversity ($\text{ILD}@5$)**: Model E achieves a **+2.37% statistically significant improvement** ($\text{ILD}@5 = 0.8739$ vs $0.8536$, Holm-adjusted $p < 0.001$, Cohen's $d_z = 0.3198$).
- **Ranking Quality**: Model E maximizes recommendation diversity while maintaining statistically equivalent ranking accuracy to baseline Transformer models.

---

## 🏗️ Architecture & Project Structure

```
News_Recommendation_System/
├── backend/                       # Python Flask REST API
│   ├── app/
│   │   ├── routes/                # API Routes (news, recommendations, reactions, analytics, admin)
│   │   ├── services/              # AI Core Engine (scoring, recommendation, user_profile, attention)
│   │   ├── models/                # Mongo DB Document Abstractions
│   │   └── middleware/            # JWT Auth & Security Guard
│   ├── evaluation/                # MIND Benchmark Evaluator Pipeline
│   ├── scripts/                   # Automated Test Suite (29/29 Passed) & DB Index Scripts
│   ├── run.py                     # Backend Server Entrypoint
│   └── requirements.txt           # Python Dependencies
│
├── frontend/                      # React 18 + Vite Client
│   ├── src/
│   │   ├── components/            # Navbar, NewsCard, ProfileMenu, RecommendationBadge
│   │   ├── context/               # AuthContext (JWT) & ThemeContext (Dark/Light)
│   │   ├── pages/                 # Home, Discover, For You, Trending, Bookmarks, Analytics, Details
│   │   └── services/              # Axios HTTP API Connectors
│   ├── package.json
│   └── vite.config.js
│
└── docs/                          # Master Documentation Workspace
    ├── ARCHITECTURE.md            # Technical System Architecture & Specification
    ├── RESEARCH_PAPER.md          # 22-Section Academic Research Paper Manuscript
    ├── EXPERIMENTAL_BENCHMARK.md  # MIND Benchmark Results & Statistical Audit
    └── REPRODUCIBILITY.md         # Environment Setup & Reproducibility Guide
```

---

## 📚 Master Documentation Workspace

Explore detailed technical documentation in the [`docs/`](file:///d:/News_Recommendation_System/docs) folder:
- 🏗️ **[System Architecture & API Specs](file:///d:/News_Recommendation_System/docs/ARCHITECTURE.md)**: Full component diagrams, mathematical scoring specs, and database schemas.
- 📄 **[Full Academic Research Paper](file:///d:/News_Recommendation_System/docs/RESEARCH_PAPER.md)**: Complete 22-section academic manuscript detailing the methodology and algorithms.
- 📈 **[Experimental Benchmark & Statistical Audit](file:///d:/News_Recommendation_System/docs/EXPERIMENTAL_BENCHMARK.md)**: Metric tables ($N = 48,295$ users) and statistical hypothesis tests.
- 🔁 **[Reproducibility Guide](file:///d:/News_Recommendation_System/docs/REPRODUCIBILITY.md)**: Step-by-step instructions to replicate evaluation metrics and runs.

---

## 🛠️ Quick Start & Running Locally

### Prerequisites
- **Python**: 3.10 or higher
- **Node.js**: 18.0 or higher
- **Database**: Local or Cloud MongoDB instance

---

### 1. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create & activate a virtual environment
python -m venv venv
# On Windows:
venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment variables (.env)
cp .env.example .env

# Run automated backend verification test suite (29/29 Tests)
python scripts/run_all_tests.py

# Launch Flask API server (http://127.0.0.1:5000)
python run.py
```

---

### 2. Frontend Setup

```bash
# Open a new terminal and navigate to frontend directory
cd frontend

# Install Node dependencies
npm install

# Start Vite dev server (http://localhost:5173)
npm run dev
```

---

## 🔌 API Endpoint Reference

| Method | Endpoint | Description | Auth Required |
|---|---|---|:---:|
| `GET` | `/api/news` | Retrieve paginated news briefing feed | No |
| `GET` | `/api/news/search?q=query` | Live full-text search query across news database | No |
| `GET` | `/api/recommendations` | Get personalized hybrid AI recommendations for current user | Yes |
| `POST` | `/api/news/:id/like` | Toggle positive reaction for a news story | Yes |
| `POST` | `/api/news/:id/bookmark` | Toggle bookmark status for saved stories grid | Yes |
| `POST` | `/api/analytics/read-log` | Log real-time reading duration and scroll depth | Yes |
| `GET` | `/api/analytics` | Fetch telemetry KPI counters, category distribution & activity graphs | Yes |
| `POST` | `/api/auth/login` | Authenticate user and issue cryptographic JWT Bearer token | No |
| `POST` | `/api/auth/register` | Register new user account | No |

---

## 🧪 Verification & Test Suite

The system includes a 100% automated test suite validating security, performance, personalization, cold-start handling, and database indexing:

```bash
cd backend
python scripts/run_all_tests.py
```

```
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

## 📜 License

Distributed under the **MIT License**. See `LICENSE` for more information.