# Final Project Documentation & Submission Audit

**Project**: Nexora — Context-Aware Personalized News Recommendation System  
**Research Paper Title**: *A Deep Learning-Based Context-Aware Real-Time Personalized News Recommendation Framework*  
**Date**: August 29, 2026  
**Status**: AUDIT COMPLETE (Application & Verification Finalized)

---

## 1. Executive Summary & Verified Project Status

The **Nexora** news recommendation platform has successfully passed all engineering, neural ranking, optimization, automated testing, and browser-level verification phases.

### Verified Runtime & Test Metrics:
- **Backend Automated Test Suite**: `29/29 PASS` (100% Pass Rate across Security, Performance, Recommendations, Cold-Start, Telemetry, and RBAC).
- **Neural Ranker Unit Tests**: `10/10 PASS` (100% Pass Rate validating deterministic 1159-d feature extraction, PyTorch model loading, and CPU inference fallback).
- **Frontend Production Build**: `npm run build` compiled 1038 modules in 4.36s with zero errors (`dist/` bundle generated).
- **Browser-Level Verification**: Verified via Playwright automation across all 11 routes in both Light and Dark modes.
- **Security & Access Control**: RBAC enforced (`HTTP 403 Forbidden` for non-admin tokens accessing `/admin/dashboard`; unauthenticated users redirected to `/login`).
- **Responsive Viewports**: Tested and verified on Desktop (`1440 × 900`) and Mobile (`375 × 812`, zero horizontal overflow).
- **Neural Ranker Architecture**: Trained 3-layer PyTorch MLP (`1159 → 128 → 64 → 1`) using a 1159-dimensional dense feature vector.
- **Model E vs. Model F Offline Benchmark** (Evaluated on $N=4,830$ strictly disjoint MIND test users):
  - **AUC**: $0.6427 \rightarrow 0.6998$ (+8.88% relative improvement)
  - **MRR@10**: $0.3551 \rightarrow 0.3904$ (+9.94% relative improvement)
  - **NDCG@10**: $0.4119 \rightarrow 0.4423$ (+7.38% relative improvement)
  - **ILD@10**: $0.8959 \rightarrow 0.9296$ (+3.76% diversity gain)
- **Production REST Latency** (Measured over $N=100$ warm HTTP requests):
  - **Mean**: $235.63\text{ ms} \pm 12.52\text{ ms}$
  - **P50**: $233.53\text{ ms}$ | **P90**: $261.07\text{ ms}$ | **P95**: $278.42\text{ ms}$ | **P99**: $321.54\text{ ms}$
  - **Throughput**: $4.26\text{ req/sec}$

---

## 2. Technical System Audit (A to X)

### A. Current Project Architecture
- **Architecture Pattern**: Decoupled Client-Server REST Architecture.
- **Frontend**: React 18 + Vite SPA client utilizing Emotion/MUI styling, Chart.js telemetry visualization, and Axios HTTP client.
- **Backend**: Python Flask 3.x REST API service using PyTorch 2.x for neural ranking, SentenceTransformers (`all-MiniLM-L6-v2`) for semantic embedding generation, PyMongo for database access, and APScheduler for continuous background news ingestion.
- **Database**: MongoDB 7.0 document store storing news stories, user credentials, interaction reactions, bookmarks, and telemetry logs.

### B. Backend Architecture
- **Entrypoint**: `backend/run.py` (Development) / `backend/start_server.py` (Production offline mode).
- **Application Factory**: `backend/app/__init__.py` registering 11 Flask Blueprints (`home_bp`, `user_bp`, `news_bp`, `recommendation_bp`, `reading_history_bp`, `bookmark_bp`, `reaction_bp`, `analytics_bp`, `trending_bp`, `admin_bp`, `news_fetch_bp`).
- **Middleware**: `jwt_helper.py` providing `@token_required` and `@admin_required` decorators for cryptographic JWT Bearer authentication and role-based access control.

### C. Frontend Architecture
- **Client Root**: `frontend/src/App.jsx` with React Router 7 navigation.
- **Context Management**: `AuthContext.jsx` (JWT token persistence in `localStorage`) and `ThemeContext.jsx` (HSL Dark/Light theme state).
- **Core Views**: Home (`/`), Discover (`/discover`), Trending (`/trending`), Details (`/news/:id`), Recommendations (`/recommendations` & `/for-you`), Analytics (`/analytics`), Bookmarks (`/bookmarks`), Admin Dashboard (`/admin`), Login (`/login`), Register (`/register`).
- **Services Layer**: `api.js` (Axios instance with base URL `http://127.0.0.1:5000`), `authService.js`, `newsService.js`.

### D. Database Architecture
- **MongoDB Database**: `news_recommendation_db`
- **Collections**:
  1. `users`: User profiles, email, bcrypt password hash (`$2b$12`), role (`user`/`admin`), category preferences.
  2. `news`: News articles, title, snippet, full content, category, author, image URL, published date, 384-d dense embedding vector.
  3. `reactions`: User story reactions (`user_id`, `news_id`, `type`: `like`/`dislike`, timestamp).
  4. `bookmarks`: Saved stories grid (`user_id`, `news_id`, `created_at`).
  5. `reading_history`: Telemetry logs (`user_id`, `news_id`, `duration_seconds`, timestamp).

### E. Authentication and Authorization
- **Authentication**: Stateless Bearer JWT tokens issued upon POST `/login` or POST `/register`, signed with 512-bit HMAC-SHA256 secret.
- **Authorization**: `@admin_required` middleware inspects decoded token `role` field. Attempts by normal users return `HTTP 403 Forbidden`. Unauthenticated requests to protected routes return `HTTP 401 Unauthorized` or redirect to `/login`.

### F. News Ingestion Pipeline
- **Ingestion Service**: `backend/app/services/gnews_service.py` fetching breaking news from GNews API or fallback corpus.
- **Categorization & Cleaning**: Automated text normalization and category mapping (Technology, Business, Sports, Entertainment, Health, Science, World).
- **Vector Embedding**: `SentenceTransformer('all-MiniLM-L6-v2')` converts normalized text into a 384-dimensional dense vector space ($L_2$ normalized).
- **Background Scheduler**: `APScheduler` background service running every 30 minutes in production.

### G. Recommendation Pipeline
- **Production Pipeline (Model E)**:
  1. **Candidate Retrieval**: Fetches active news candidates from MongoDB.
  2. **Filtering**: Excludes stories already read or disliked by the user.
  3. **Candidate-Aware Attention**: Computes soft-max attention weight over short-term ($M \le 5$) and long-term ($M \le 50$) user reading history against candidate embedding $c_i$.
  4. **4-Factor Scoring**: Combines content semantic similarity, exponential recency decay ($e^{-\lambda \cdot \Delta t}$), category affinity, and time-of-day temporal alignment.
  5. **ILD Diversity Reranking**: Greedy Intra-List Diversity reranking maximizing cosine dissimilarity between top recommendations.

### H. Long-Term and Short-Term Personalization
- **Decoupled User Profiling**:
  - **Short-Term Profile ($H_{short}$)**: Recent $M \le 5$ read stories capturing instant session context.
  - **Long-Term Profile ($H_{long}$)**: Historical $M \le 50$ read stories capturing durable topic interest.

### I. Candidate-Aware Attention
- **Mathematical Softmax Attention**:
  $$\alpha_j = \frac{\exp(\frac{c \cdot h_j^\top}{\tau})}{\sum_{k=1}^M \exp(\frac{c \cdot h_k^\top}{\tau})}, \quad u_{att} = \sum_{j=1}^M \alpha_j h_j$$
  where temperature $\tau = 0.1$, dynamically conditioning the user embedding vector $u_{att}$ on the candidate story vector $c$.

### J. Context-Awareness Mechanism
- **Temporal Context**: Evaluates time-of-day alignment ($t \in [0, 24)$) against historical reading hour distribution.
- **Exponential Recency Decay**: Continuous score adjustment $R(t) = \exp(-\lambda \cdot \Delta t)$ with half-life decay parameter $\lambda$.

### K. Neural Ranker Architecture
- **PyTorch Model**: 3-layer Multi-Layer Perceptron (MLP)
  - Layer 1: `Linear(1159, 128)` + `ReLU()` + `Dropout(0.2)`
  - Layer 2: `Linear(128, 64)` + `ReLU()`
  - Layer 3: `Linear(64, 1)` -> Predicted CTR score $\hat{y} \in [0, 1]$

### L. 1159-Dimensional Feature Vector
- **Derived Feature Schema** (`feature_extractor.py`):
  1. `c_emb` ($384\text{-d}$): Candidate dense embedding vector.
  2. `u_att` ($384\text{-d}$): Softmax candidate-conditioned user attention vector.
  3. `u_x_c` ($384\text{-d}$): Elementwise Hadamard interaction vector ($u_{att} \odot c$).
  4. `scalars` ($7\text{-d}$):
     - `semantic_score`
     - `context_relevance`
     - `recent_category_ratio`
     - `temporal_affinity`
     - `recency_score`
     - `popularity_score`
     - `interest_score`
  - **Total**: $384 + 384 + 384 + 7 = 1159$ dimensions.

### M. Training Pipeline
- **Dataset**: Microsoft News Dataset (MIND-small benchmark, $N = 48,295$ users, $146,036$ impression sessions).
- **Loss Function**: Binary Cross-Entropy with Logits (`BCEWithLogitsLoss`).
- **Optimizer**: AdamW ($\eta = 10^{-3}$, weight decay $10^{-4}$).

### N. MIND Evaluation Pipeline
- **Evaluator**: `backend/evaluation/mind/evaluate_mind.py`
- **Metrics Evaluated**: AUC, MRR@5, MRR@10, NDCG@5, NDCG@10, ILD@5, ILD@10.

### O. Model E vs. Model F Comparison
- **Offline Benchmark Results** (Evaluated on $N=4,830$ disjoint test users):
  - **Model E** (Production 4-Factor Heuristic Engine): $\text{AUC} = 0.6427$, $\text{MRR@10} = 0.3551$, $\text{NDCG@10} = 0.4119$, $\text{ILD@10} = 0.8959$.
  - **Model F** (Model E + PyTorch Neural Ranker MLP): $\text{AUC} = 0.6998$, $\text{MRR@10} = 0.3904$, $\text{NDCG@10} = 0.4423$, $\text{ILD@10} = 0.9296$.

### P. Diversity Reranking
- **Intra-List Diversity (ILD)**:
  $$\text{ILD}(R) = \frac{2}{|R|(|R|-1)} \sum_{i=1}^{|R|} \sum_{j=i+1}^{|R|} \left(1 - \cos(c_i, c_j)\right)$$
  Maximized using a greedy candidate selection penalty to prevent category echo chambers.

### Q. Real-Time API Flow
- Client requests `GET /personalized-recommendations` with Bearer JWT token -> Middleware validates token -> Service fetches candidates & candidate-aware attention vector -> Scoring engine scores candidate stories -> Diversity reranking orders top 10 stories -> Returns JSON payload with transparent rationales.

### R. Testing and Verification
- 29/29 automated backend tests PASS.
- 10/10 Neural Ranker unit tests PASS.
- Full Playwright browser automation audit across all 11 client pages PASS.

### S. Security
- Password Hashing: Bcrypt with salt rounds = 12.
- JWT: Signed 512-bit HMAC-SHA256 tokens with token expiry.
- CORS: Configured Flask CORS header policy.
- RBAC: Admin role verification enforced on `/admin/dashboard`.

### T. Responsive UI
- Uniform 1280px max-width centered layout on Desktop ($1440 \times 900$).
- Mobile Drawer navigation and scaled 1-column feed cards on Mobile ($375 \times 812$).

### U. Admin Functionality
- Route `/admin` displaying Total Users (43), Total News Articles (467), Total Reads (121), Total Saved Bookmarks (24), Reaction Split Donut (14 Likes / 5 Dislikes), and Popular Category ("Technology").

### V. Performance Optimization Phases
- **Phase 3.1-3.5 Optimizations**:
  - Pre-filtering candidate pool via MongoDB compound indexes.
  - In-memory numpy vectorized dot-products for similarity calculations.
  - Restricting attention vector calculation to top-K candidates.

### W. Current Latency Limitations
- **Empirical Measured Latency**: Warm REST request mean latency is $235.63\text{ ms} \pm 12.52\text{ ms}$ (P50: $233.53\text{ ms}$, P90: $261.07\text{ ms}$, P95: $278.42\text{ ms}$, P99: $321.54\text{ ms}$).
- **Key Bottlenecks**: Python GIL execution, CPU PyTorch inference overhead, and MongoDB network roundtrip. Sub-100ms response times require C++ inference runtimes (ONNX Runtime/TensorRT) and Redis caching.

### X. Current Project Completion Status
- **Overall Completion**: **100% Code & Verification Complete**.
- **Documentation Status**: Complete audit performed; final college submission document needs assembly.

---

## 3. Documentation Gap Matrix

| Topic | Existing Evidence | Existing File | Missing / Incomplete for Final Report | Priority |
|---|---|---|---|:---:|
| **Abstract & Introduction** | Paper sections 1-2 | `RESEARCH_PAPER.md` | Needs formal college project report formatting & objective listing | **High** |
| **Literature Survey & Related Work** | Paper section 3 | `RESEARCH_PAPER.md` | Comparative summary table of existing news recommendation literature | **High** |
| **System Architecture & Design** | System specs & flow | `ARCHITECTURE.md` | High-resolution Mermaid/SVG structural diagrams for college report | **High** |
| **Mathematical Formulation** | Attention & 4-Factor formulas | `ARCHITECTURE.md` | LaTeX inline equations formatted for chapter inclusion | **Medium** |
| **Neural Ranker Architecture** | MLP definition & feature vector | `NEURAL_RANKER_IMPLEMENTATION.md` | Layer-by-layer dimension transition diagram & 1159-d vector breakdown | **High** |
| **Experimental Results & Benchmark** | MIND evaluation tables | `EXPERIMENTAL_BENCHMARK.md`, `MODEL_E_VS_F_BENCHMARK.md` | Integrated discussion of offline benchmarks vs online REST latency | **High** |
| **User Interface & Screenshots** | Verification report | `PHASE_6_BROWSER_VERIFICATION.md` | High-resolution annotated screenshots of all 11 application pages | **High** |
| **Installation & Setup Guide** | Quickstart steps | `README.md`, `REPRODUCIBILITY.md` | Comprehensive step-by-step developer deployment guide | **Medium** |

---

## 4. Required Structural Diagrams

The following structural diagrams will be generated for inclusion in the final college report:

1. **System Architecture Diagram**: End-to-end component flow (React Client $\leftrightarrow$ Flask API $\leftrightarrow$ PyTorch Engine $\leftrightarrow$ MongoDB).
2. **Overall Recommendation Architecture Diagram**: 4-factor hybrid scoring & candidate-aware attention workflow.
3. **Data Flow Diagram (DFD Level 0 & Level 1)**: User interaction signals and telemetry data movement.
4. **User Journey Flowchart**: Authentication, news browsing, reaction toggling, and analytics telemetry flow.
5. **Recommendation Pipeline Sequence Diagram**: Step-by-step REST request lifecycle for `GET /personalized-recommendations`.
6. **Neural Ranker Architecture Diagram**: PyTorch MLP layer dimensions ($1159 \rightarrow 128 \rightarrow 64 \rightarrow 1$).
7. **Database ER / Schema Diagram**: Entity relationships between `users`, `news`, `reactions`, `bookmarks`, and `reading_history`.
8. **Deployment & Technology Stack Diagram**: Layered technology breakdown (React 18, Vite, Flask, PyTorch, MongoDB, Playwright).

---

## 5. Required Screenshots

Annotated screenshots required for the final college report:

1. **Authentication Suite**:
   - `01_login_page.png` (Login screen with email/password inputs)
   - `02_register_page.png` (Account creation screen)
2. **Main Application Views**:
   - `03_home_news_feed.png` (Home feed grid with category selector & search bar)
   - `04_discover_page.png` (Discover search and category filtering)
   - `05_trending_page.png` (Trending high-velocity news stories)
   - `06_news_details_modal.png` (Full news story reader modal with reactions & bookmarks)
   - `07_personalized_recommendations.png` ("For You" recommendations with transparent AI rationales)
   - `08_reading_history_analytics.png` (Telemetry KPIs, category distribution donut, 7D reading velocity)
   - `09_bookmarks_grid.png` (Saved stories grid)
3. **Admin Suite**:
   - `10_admin_dashboard.png` (Executive platform statistics, total users, total news, reaction donut)
4. **Responsive Views**:
   - `11_mobile_responsive_view.png` (Mobile viewport 375×812 drawer navigation and news feed)

---

## 6. Final Summary & Recommended Next Steps

### Completed Documentation:
- [x] Technical System Architecture Specification (`docs/ARCHITECTURE.md`)
- [x] Full Academic Research Paper Manuscript (`docs/RESEARCH_PAPER.md`)
- [x] MIND Benchmark Results & Statistical Audit (`docs/EXPERIMENTAL_BENCHMARK.md`)
- [x] Model E vs Model F Neural Ranker Benchmark (`documentation/MODEL_E_VS_F_BENCHMARK.md`)
- [x] Real-Time Latency Investigation & Optimization Logs (`documentation/END_TO_END_REALTIME_VALIDATION.md`)
- [x] Phase 6 Browser Verification Report (`documentation/PHASE_6_BROWSER_VERIFICATION.md`)
- [x] Final Project Documentation & Submission Audit (`documentation/FINAL_PROJECT_DOCUMENTATION_AUDIT.md`)

### Documentation Still Required for Submission:
- [ ] **Final Major Project College Report** (`docs/FINAL_MAJOR_PROJECT_REPORT.md` / PDF): A comprehensive 10-chapter document combining project background, literature survey, system design, architectural diagrams, neural ranker details, experimental results, user guide, and screenshots.

### Recommended Submission Documentation Sequence:
1. **Chapter 1**: Introduction & Problem Statement
2. **Chapter 2**: Literature Survey & Related Work
3. **Chapter 3**: System Requirements & Software Specification
4. **Chapter 4**: System Architecture & Design Diagrams
5. **Chapter 5**: AI Recommendation Engine & Candidate-Aware Attention
6. **Chapter 6**: PyTorch Neural Ranker Architecture & 1159-D Vector Schema
7. **Chapter 7**: Implementation Details & Ingestion Pipeline
8. **Chapter 8**: Experimental Results & Offline MIND Benchmark
9. **Chapter 9**: User Interface & System Screenshots
10. **Chapter 10**: Conclusion & Future Scope

### Exact Next Step:
Proceed to **Phase 7.1 — Generate Screenshots & Architectural Diagrams** to capture high-resolution application screenshots and render Mermaid/SVG structural diagrams, followed by assembling the final college submission report.
