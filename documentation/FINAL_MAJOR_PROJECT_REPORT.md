# NEXORA — CONTEXT-AWARE PERSONALIZED NEWS RECOMMENDATION SYSTEM

**A Major Project Report Submitted in Partial Fulfillment of the Requirements for the Degree of Bachelor of Technology (B.Tech) in Computer Science and Engineering**

**Project Title**: Nexora — Context-Aware Personalized News Recommendation System  
**Associated Research Manuscript**: *A Deep Learning-Based Context-Aware Real-Time Personalized News Recommendation Framework*  
**Date**: August 2026  

---

## ABSTRACT

Personalized news recommendation is a critical component of contemporary digital media platforms, enabling users to navigate vast streams of information. However, traditional news recommendation models struggle with severe dynamic item turnover, cold-start user preferences, real-time context integration, and topic echo chambers. This project presents **Nexora**, an enterprise-grade, context-aware personalized news recommendation system leveraging dense Transformer vector embeddings (`all-MiniLM-L6-v2`), candidate-conditioned Softmax attention mechanisms, continuous exponential recency decay, implicit session telemetry, and transparent recommendation rationales. 

The architecture decouples candidate retrieval from deep neural ranking. Candidate items ($N \le 500$) are retrieved from a MongoDB document database using compound category and recency indexes. User profiles are decoupled into short-term session focus ($M \le 5$) and long-term historical reading preferences ($M \le 50$), fused dynamically via a temperature-scaled candidate-aware attention mechanism ($\tau = 0.1$). A 1159-dimensional dense feature vector—combining 384-d candidate embeddings, 384-d attention vectors, 384-d Hadamard interaction vectors ($u \odot c$), and 7 real-time context/interaction scalars—is fed into a PyTorch Multi-Layer Perceptron (MLP) Neural Ranker ($1159 \rightarrow 128 \rightarrow 64 \rightarrow 1$). An Intra-List Diversity (ILD) penalty reranking layer prevents topic echo chambers.

Evaluated on a strictly disjoint test cohort of $N=500$ unseen users ($1,432$ impressions, $55,451$ total candidate items) from the Microsoft News Dataset (MIND-small benchmark), the neural ranking framework (**Model F**) achieves statistically significant improvements over the production heuristic baseline (**Model E**): Area Under the ROC Curve (AUC) improves from $0.6427$ to $0.6998$ (+8.88% relative, $p < 0.001$), Mean Reciprocal Rank (MRR@10) improves from $0.3551$ to $0.3904$ (+9.94% relative, $p < 0.001$), Normalized Discounted Cumulative Gain (NDCG@10) improves from $0.4119$ to $0.4423$ (+7.36% relative, $p < 0.001$), and Intra-List Diversity (ILD@10) reaches $0.9296$ (+3.77% gain, $p < 0.001$). On a warm production environment, the end-to-end REST API achieves a mean response latency of $235.63\text{ ms} \pm 12.52\text{ ms}$ (P50: $233.53\text{ ms}$, P90: $261.07\text{ ms}$) at $4.26\text{ req/sec}$ throughput. The platform features a responsive React 18 + Vite client with HSL dark/light modes, real-time telemetry analytics, role-based access control (RBAC), and 100% automated test verification (29/29 backend tests, 10/10 neural ranker unit tests).

---

## ACRONYMS & ABBREVIATIONS

| Acronym | Expansion |
|---|---|
| **API** | Application Programming Interface |
| **AUC** | Area Under the Receiver Operating Characteristic Curve |
| **BCE** | Binary Cross-Entropy |
| **CTR** | Click-Through Rate |
| **DFD** | Data Flow Diagram |
| **FK** | Foreign Key |
| **GIL** | Global Interpreter Lock |
| **HSL** | Hue, Saturation, Lightness |
| **HTTP** | Hypertext Transfer Protocol |
| **ILD** | Intra-List Diversity |
| **JWT** | JSON Web Token |
| **MIND** | Microsoft News Dataset |
| **MLP** | Multi-Layer Perceptron |
| **MRR** | Mean Reciprocal Rank |
| **MUI** | Material-UI |
| **NDCG** | Normalized Discounted Cumulative Gain |
| **PK** | Primary Key |
| **RBAC** | Role-Based Access Control |
| **REST** | Representational State Transfer |
| **SPA** | Single Page Application |
| **URL** | Uniform Resource Locator |

---

## LIST OF FIGURES

- **Figure 4.1**: Nexora End-to-End System Architecture (`documentation/diagrams/system_architecture.svg`)
- **Figure 4.2**: Data Flow Diagram Level 0 Context Diagram (`documentation/diagrams/dfd_level_0.svg`)
- **Figure 4.3**: Data Flow Diagram Level 1 Process Decomposition (`documentation/diagrams/dfd_level_1.svg`)
- **Figure 4.4**: User Journey & Navigation Flowchart (`documentation/diagrams/user_journey_flow.svg`)
- **Figure 4.5**: Synchronous Recommendation Sequence Diagram (`documentation/diagrams/recommendation_sequence.svg`)
- **Figure 4.6**: Four-Tiered Deployment & Technology Stack (`documentation/diagrams/deployment_technology_stack.svg`)
- **Figure 4.7**: MongoDB Document Schema & ER Diagram (`documentation/diagrams/database_er_schema.svg`)
- **Figure 5.1**: Seven-Stage Hybrid Recommendation Pipeline (`documentation/diagrams/recommendation_architecture.svg`)
- **Figure 6.1**: PyTorch Neural Ranker (MLP) Architecture (`documentation/diagrams/neural_ranker_architecture.svg`)
- **Figure 9.1**: User Authentication Login Interface (`documentation/screenshots/01_login_page.png`)
- **Figure 9.2**: User Account Registration Interface (`documentation/screenshots/02_register_page.png`)
- **Figure 9.3**: Executive Home Page & Primary News Feed (`documentation/screenshots/03_home_news_feed.png`)
- **Figure 9.4**: Discover & Full-Text Search View (`documentation/screenshots/04_discover_page.png`)
- **Figure 9.5**: Trending Velocity News Feed (`documentation/screenshots/05_trending_page.png`)
- **Figure 9.6**: Article Details Modal & Reaction Bar (`documentation/screenshots/06_news_details.png`)
- **Figure 9.7**: AI "For You" Recommendations with Transparent Rationales (`documentation/screenshots/07_personalized_recommendations.png`)
- **Figure 9.8**: Telemetry Analytics Dashboard & Category Donut (`documentation/screenshots/08_reading_history_analytics.png`)
- **Figure 9.9**: Saved Story Bookmarks Grid (`documentation/screenshots/09_bookmarks.png`)
- **Figure 9.10**: Executive Admin Platform Dashboard (`documentation/screenshots/10_admin_dashboard.png`)
- **Figure 9.11**: Responsive Mobile Viewport Feed (`documentation/screenshots/11_mobile_responsive.png`)

---

## LIST OF TABLES

- **Table 2.1**: Comparative Matrix of Existing News Recommendation Approaches vs. Nexora
- **Table 3.1**: Software Dependency Specifications
- **Table 6.1**: 1159-Dimensional Feature Vector Schema Breakdown
- **Table 8.1**: Strictly Disjoint User Cohort Partitioning
- **Table 8.2**: Main Empirical Benchmark Results (Model E Baseline vs. Model F Neural Ranker)
- **Table 8.3**: Statistical Significance & Effect Size Summary
- **Table 8.4**: Production REST API Latency Benchmark ($N=100$ Warm Iterations)
- **Table 9.1**: Master Application Screenshot Specifications
- **Table A.1**: Comprehensive REST API Endpoint Reference

---

# CHAPTER 1 — INTRODUCTION

### 1.1 Background
The digital media landscape produces millions of news stories daily. Users face information overload, making manual navigation inefficient. Automated news recommendation systems filter content streams, matching stories to individual preferences. Unlike movie or e-commerce recommendations where item catalogs remain stable over long periods, news recommendation deals with highly dynamic, ephemeral item catalogs where stories become obsolete within hours or days.

### 1.2 Problem Statement
Traditional collaborative filtering algorithms fail in news recommendation because new stories lack historical interaction logs (item cold-start problem). Furthermore, existing content-based frameworks suffer from four primary limitations:
1. **Static User Profiles**: Treating long-term reading history as a uniform average ignores dynamic session shifts.
2. **Context Blindness**: Failing to incorporate time-of-day reading context and article recency decay.
3. **Echo Chamber Effects**: Over-optimizing accuracy metrics (AUC/CTR) pushes users into narrow topic filters.
4. **Opaque Recommendations**: Presenting recommendation cards without transparent explanations reduces user trust.

### 1.3 Motivation
Recent advancements in pre-trained Transformer embeddings (`SentenceTransformers`) allow mapping unstructured news text into dense semantic vector spaces ($D=384$). Combining dense semantic vectors with candidate-aware attention mechanisms and deep neural ranking models offers a powerful solution for accurate, real-time news personalization while maintaining intra-list diversity.

### 1.4 Objectives
The primary objectives of the **Nexora** project are:
1. **Dense Vector Encoding**: Map news titles and content into a 384-dimensional dense semantic vector space using pre-trained `all-MiniLM-L6-v2`.
2. **Dual-Profiling Attention**: Decouple short-term session focus ($M \le 5$) from long-term history ($M \le 50$) using candidate-aware Softmax attention.
3. **Deep Neural Ranking**: Construct and train a 3-layer PyTorch MLP Neural Ranker operating on a 1159-dimensional feature vector ($384\text{-d } c + 384\text{-d } u_{\text{att}} + 384\text{-d } (u \odot c) + 7\text{ scalars}$).
4. **Diversity Reranking**: Implement a greedy Intra-List Diversity (ILD) reranking algorithm to prevent topic echo chambers.
5. **Full-Stack Implementation**: Build an enterprise-grade REST API backend (Python Flask) and responsive Web UI (React 18 + Vite) featuring dark/light HSL themes, telemetry analytics, and role-based access control (RBAC).

### 1.5 Scope
The project encompasses dataset preprocessing (MIND-small benchmark), deep neural ranker training, real-time candidate retrieval, context-aware scoring, diversity penalty reranking, full-stack REST API development, browser automation testing, and offline statistical evaluation.

### 1.6 Contributions
- **Derived 1159-D Feature Space**: Integrates semantic representations, Hadamard interaction vectors, and real-time interaction scalars.
- **Empirical Validation**: Evaluated on $N=500$ strictly disjoint test users, proving statistically significant metric gains ($\text{AUC}: 0.6427 \rightarrow 0.6998$, $+8.88\%$).
- **Transparent Rationales**: Generates human-readable explanations ("Why Nexora Recommended This") based on historical category affinity and attention weights.

### 1.7 Organization of the Report
This report is organized into 10 chapters. Chapter 2 reviews literature and existing frameworks. Chapter 3 outlines system requirements and technology choices. Chapter 4 presents system design, DFDs, ER diagrams, and deployment architecture. Chapter 5 details the hybrid recommendation engine. Chapter 6 describes the PyTorch Neural Ranker. Chapter 7 covers full-stack implementation. Chapter 8 provides experimental evaluation and latency benchmarks. Chapter 9 presents the user interface and screenshots. Chapter 10 concludes the report.

---

# CHAPTER 2 — LITERATURE SURVEY

### 2.1 News Recommendation Systems
Early news recommendation relied on collaborative filtering (GroupLens) and content-based keyword matching (TF-IDF). Collaborative filtering fails in news recommendation due to rapid item turnover.

### 2.2 Content-Based Recommendation
Content-based filtering matches article topics to user preferences. However, traditional TF-IDF keyword vectors fail to capture semantic synonyms and contextual relationships.

### 2.3 Personalized Recommendation
Personalization algorithms construct user representations from click streams. Recent approaches utilize recurrent neural networks (RNNs) or graph neural networks (GNNs), but suffer from high computational latency during real-time inference.

### 2.4 Context-Aware Recommendation
Contextual recommendation incorporates external factors like time of day, day of week, and continuous recency decay $R(t) = \exp(-\lambda \cdot \Delta t)$. Integrating recency prevents stale news from flooding user feeds.

### 2.5 Deep Learning for Recommendation
Deep learning frameworks (e.g., DKN, NAML, LSTUR) utilize convolutional or self-attention layers to encode news text. However, deployment requires light-weight MLP architectures to ensure acceptable HTTP response times.

### 2.6 Real-Time Recommendation
Real-time news engines must return recommendations within acceptable HTTP timeouts. Heavy GPU architectures struggle under high request throughput without expensive specialized infrastructure.

### 2.7 Research Gap
Existing production systems prioritize pure Click-Through Rate (CTR) optimization at the expense of recommendation diversity, leading to topic filter bubbles and opaque recommendation outputs.

### 2.8 Comparison with Existing Approaches

#### Table 2.1: Comparative Matrix of Existing Approaches vs. Nexora
| Feature / Dimension | Traditional Collaborative Filtering | TF-IDF Content Matching | Standard Deep CTR (DKN/NAML) | Nexora Production System |
|---|:---:|:---:|:---:|:---:|
| **Item Cold-Start Handling** | Poor | Fair | Good | **Excellent (Dense Embedding)** |
| **Dynamic Session Focus** | No | No | Partial | **Yes (Softmax Attention)** |
| **Context Integration** | None | None | Partial | **Yes (Recency & Time-of-Day)** |
| **Diversity Protection** | None | None | Low (Echo Chamber) | **Yes (Greedy ILD Penalty)** |
| **Transparent Rationales** | No | Partial | No (Black-Box) | **Yes (Human-Readable AI Explanations)** |

---

# CHAPTER 3 — REQUIREMENTS AND TECHNOLOGY STACK

### 3.1 Functional Requirements
1. **User Authentication**: Secure registration, login, and JWT Bearer token management.
2. **News Briefing Feed**: Paginated home feed grid sorted by chronological recency and category filters.
3. **Interactive Signals**: Story detail reader modal supporting Like, Dislike, and Bookmark actions.
4. **Personalized Recommendations**: Dedicated "For You" feed presenting top 10 neural-ranked stories with transparency rationales.
5. **Telemetry Analytics**: Real-time telemetry dashboard displaying reading velocity and category distribution donut charts.
6. **Admin Management**: Role-based access control protecting platform KPI statistics (`/admin`).

### 3.2 Non-Functional Requirements
1. **Performance**: Warm REST API response latency under $350\text{ ms}$ for P99 requests.
2. **Reliability**: Graceful cold-start fallback handling for zero-history users.
3. **Security**: Password hashing using Bcrypt ($12$ rounds) and HMAC-SHA256 JWT signature verification.
4. **Usability**: Responsive layout supporting Desktop ($1440 \times 900$) and Mobile ($375 \times 812$) viewports with dark/light themes.

### 3.3 Hardware Requirements
- **Development Workstation**: Intel Core i7 / AMD Ryzen 7 CPU, 16 GB DDR4 RAM, 512 GB NVMe SSD.
- **Inference Hardware**: CPU-based deterministic inference (Intel Core i7 @ 2.30 GHz).

### 3.4 Software Requirements
- **Operating System**: Windows 11 / Linux Ubuntu 22.04 LTS
- **Runtime Environments**: Python 3.10+, Node.js 18+
- **Database Engine**: MongoDB 7.0 Community Server

### 3.5 Technology Stack
- **Backend Framework**: Python Flask 3.x
- **Deep Learning Library**: PyTorch 2.x (`torch.nn`)
- **Semantic Vector Embeddings**: `SentenceTransformers` (`all-MiniLM-L6-v2`)
- **Frontend Framework**: React 18 + Vite 8.2
- **UI Component Library**: Material-UI (MUI v6) & Emotion
- **Data Visualization**: Chart.js 4.x & `react-chartjs-2`
- **Testing & Automation**: Playwright 1.62, PyTest, Unittest

---

# CHAPTER 4 — SYSTEM DESIGN AND ARCHITECTURE

### 4.1 Overall System Architecture
Nexora follows a decoupled client-server microservices architecture. The React SPA client handles presentation and user interaction, communicating asynchronously with the Flask REST API via JSON HTTP requests carrying Bearer JWT tokens.

![System Architecture](file:///d:/News_Recommendation_System/documentation/diagrams/system_architecture.svg)  
*Figure 4.1: Nexora End-to-End System Architecture (React SPA, Flask REST API, PyTorch Ranker, MongoDB)*

### 4.2 Component Architecture
The backend is structured into modular layers:
1. **Routes & Blueprints**: Request routing and HTTP parameter validation.
2. **Middleware**: Cryptographic JWT validation (`@token_required`, `@admin_required`).
3. **Controllers**: Business logic orchestration.
4. **Services**: AI inference, scoring engines, user profiling, and database access.
5. **Models**: Abstraction over MongoDB collections via PyMongo.

### 4.3 Data Flow
User interactions generate telemetry signals (read duration, likes, bookmarks) stored in MongoDB. The recommendation pipeline reads historical telemetry to compute candidate attention vectors and scalar context features.

### 4.4 DFD Level 0
The Context Diagram defines system boundaries between the user browser, external GNews API, and the central Nexora AI processing core.

![DFD Level 0](file:///d:/News_Recommendation_System/documentation/diagrams/dfd_level_0.svg)  
*Figure 4.2: Data Flow Diagram Level 0 (Context Diagram)*

### 4.5 DFD Level 1
Decomposes the core system into four functional sub-processes: Auth & User Management (1.0), News Ingestion (2.0), Interaction Telemetry (3.0), and Neural Recommendation (4.0).

![DFD Level 1](file:///d:/News_Recommendation_System/documentation/diagrams/dfd_level_1.svg)  
*Figure 4.3: Data Flow Diagram Level 1 (Process Decomposition)*

### 4.6 User Journey
Maps the navigation lifecycle from initial landing, authentication checking, feed browsing, engagement signaling, and recommendation consumption.

![User Journey Flow](file:///d:/News_Recommendation_System/documentation/diagrams/user_journey_flow.svg)  
*Figure 4.4: User Journey & Navigation Flowchart*

### 4.7 Recommendation Sequence
Illustrates the synchronous HTTP execution lifecycle for `GET /personalized-recommendations`.

![Recommendation Sequence](file:///d:/News_Recommendation_System/documentation/diagrams/recommendation_sequence.svg)  
*Figure 4.5: Synchronous Recommendation Sequence Diagram*

### 4.8 Deployment Architecture
Four-tiered physical technology deployment architecture illustrating client, API server, deep learning engine, and database tiers.

![Deployment Architecture](file:///d:/News_Recommendation_System/documentation/diagrams/deployment_technology_stack.svg)  
*Figure 4.6: Four-Tiered Deployment & Technology Stack Diagram*

### 4.9 Database Design
MongoDB 7.0 schema comprising 5 primary collections: `users`, `news`, `reactions`, `bookmarks`, and `reading_history`.

![Database ER Schema](file:///d:/News_Recommendation_System/documentation/diagrams/database_er_schema.svg)  
*Figure 4.7: MongoDB Document Schema & ER Diagram*

### 4.10 Security Architecture
Authentication utilizes signed HMAC-SHA256 JWT tokens. Password security is enforced via Bcrypt with salt rounds $= 12$. Role-based access control restricts administrative routes (`/admin/dashboard`).

---

# CHAPTER 5 — PERSONALIZED NEWS RECOMMENDATION ENGINE

### 5.1 News Candidate Retrieval
To ensure low latency, candidate retrieval queries MongoDB using compound indexes (`category`, `published_at`). Stories already read or disliked by the user are dynamically excluded ($N \le 500$ candidates).

### 5.2 News Embeddings
News titles and body text are converted into 384-dimensional dense semantic vectors using `SentenceTransformer('all-MiniLM-L6-v2')`. Embeddings are $L_2$-normalized to allow fast cosine similarity via dot products.

### 5.3 User Profile Construction
User profiles are constructed by aggregating embeddings of read news stories.

### 5.4 Long-Term User Profile
The long-term profile $H_{\text{long}}$ aggregates the user's historical reading log ($M \le 50$) to capture durable category and topic preferences.

### 5.5 Short-Term User Profile
The short-term profile $H_{\text{short}}$ isolates the recent $M \le 5$ read stories to capture real-time session focus.

### 5.6 Candidate-Aware Softmax Attention
Rather than using static profile averages, Nexora dynamically conditions user representation on candidate story $c$:

$$\alpha_j = \frac{\exp\left(\frac{c \cdot h_j^\top}{\tau}\right)}{\sum_{k=1}^M \exp\left(\frac{c \cdot h_k^\top}{\tau}\right)}, \quad u_{\text{att}} = \sum_{j=1}^M \alpha_j h_j$$

where temperature $\tau = 0.1$. This assigns higher weights to historical stories that are semantically aligned with candidate $c$.

### 5.7 Context-Aware Features
Incorporates external situational signals:
- **Temporal Alignment**: Category reading hour distribution.
- **Recency Decay**: $R(t) = \exp(-\lambda \cdot \Delta t)$.
- **Popularity Signals**: Normalized ratio of total reads, likes, and bookmarks.
- **User Interest Match**: Category and author matches.

### 5.8 Recency
Continuous exponential recency decay prevents old stories from overwhelming feeds.

### 5.9 Popularity
Popularity score is formulated as:

$$S_{\text{pop}} = \min\left(\frac{\text{reads} + 2\cdot\text{likes} + 2\cdot\text{bookmarks}}{20}, 1.0\right)$$

### 5.10 Explicit User Interest
Evaluates category preferences selected during onboarding or profile editing.

### 5.11 Diversity Reranking
Top candidate stories undergo greedy Intra-List Diversity (ILD) reranking:

$$\text{ILD}(R) = \frac{2}{|R|(|R|-1)} \sum_{i=1}^{|R|} \sum_{j=i+1}^{|R|} (1 - \cos(c_i, c_j))$$

A multiplicative penalty ($0.90$) is applied to stories sharing categories with higher-ranked recommendations.

### 5.12 Complete Recommendation Pipeline
Figure 5.1 presents the seven-stage hybrid recommendation pipeline.

![Recommendation Pipeline](file:///d:/News_Recommendation_System/documentation/diagrams/recommendation_architecture.svg)  
*Figure 5.1: Seven-Stage Hybrid Recommendation Pipeline*

---

# CHAPTER 6 — DEEP LEARNING NEURAL RANKER

### 6.1 Motivation
Heuristic weight assignment ($0.60 \cdot S_{\text{semantic}} + 0.20 \cdot S_{\text{recency}} + \dots$) cannot capture complex non-linear feature interactions. The PyTorch Neural Ranker replaces fixed weights with a learned deep neural network.

### 6.2 Feature Vector
Constructed per candidate story using `extract_candidate_features()` in `feature_extractor.py`.

### 6.3 1159-Dimensional Input
The input feature vector $X \in \mathbb{R}^{1159}$ consists of:
$$384\text{ (candidate embedding)} + 384\text{ (user attention vector)} + 384\text{ (Hadamard interaction } u \odot c\text{)} + 7\text{ (scalar features)} = 1159\text{ dimensions}$$

### 6.4 Feature Components

#### Table 6.1: 1159-Dimensional Feature Vector Schema Breakdown
| Component | Dimension | Feature Names | Description |
|---|:---:|---|---|
| **Candidate Embedding ($c$)** | 384 | `c_emb_0` ... `c_emb_383` | Dense vector from `all-MiniLM-L6-v2` |
| **User Attention Vector ($u_{\text{att}}$)** | 384 | `u_att_0` ... `u_att_383` | Softmax candidate-conditioned user vector |
| **Hadamard Interaction ($u \odot c$)** | 384 | `u_x_c_0` ... `u_x_c_383` | Elementwise similarity interaction |
| **Context-Fused Semantic Score** | 1 | `semantic_score` | Raw similarity $\times$ context relevance |
| **Context Relevance Factor** | 1 | `context_relevance` | Time-of-day relevance factor ($[0.80, 1.25]$) |
| **Recent Category Ratio** | 1 | `recent_category_ratio` | Short-term category density |
| **Temporal Affinity Multiplier** | 1 | `temporal_affinity` | Hour-of-day category multiplier |
| **Recency Score** | 1 | `recency_score` | Continuous exponential decay $e^{-\lambda \cdot \Delta t}$ |
| **Popularity Score** | 1 | `popularity_score` | Engagement density ratio |
| **User Interest Score** | 1 | `interest_score` | Category & author match score |
| **TOTAL INPUT DIMENSION** | **1159** | | **Schema-verified derived dimension** |

### 6.5 MLP Architecture
Implemented as a 3-layer feedforward PyTorch module (`PyTorchNeuralRanker`):

![Neural Ranker Architecture](file:///d:/News_Recommendation_System/documentation/diagrams/neural_ranker_architecture.svg)  
*Figure 6.1: PyTorch Neural Ranker (MLP) Architecture*

### 6.6 ReLU
Rectified Linear Unit ($\text{ReLU}(x) = \max(0, x)$) introduces non-linearity after hidden linear transformations.

### 6.7 Dropout
Dropout regularization ($p = 0.2$) is applied after the first hidden layer during training to prevent overfitting.

### 6.8 Sigmoid Output
The final scalar output is passed through Sigmoid activation $\sigma(z) = \frac{1}{1 + e^{-z}}$, producing predicted click probability $\hat{y} = P(\text{click}) \in [0, 1]$.

### 6.9 Training Loss
Trained using Binary Cross-Entropy with Logits (`BCEWithLogitsLoss`).

### 6.10 Optimizer
AdamW optimizer with learning rate $\eta = 10^{-3}$ and weight decay $10^{-4}$.

### 6.11 Class Imbalance Handling
Positive click labels represent a small fraction of impression pools. Class imbalance is handled using positive weight scaling (`pos_weight = 23.6525`).

### 6.12 Training Procedure
Trained over 15 epochs on $8,000$ training users from the MIND-small dataset using early stopping based on validation loss.

### 6.13 Model F
**Model F** represents the integrated production system combining the PyTorch Neural Ranker MLP score with continuous recency and ILD diversity reranking.

### 6.14 Inference Pipeline
During real-time execution, `NeuralRankerInferenceService` loads trained weights (`neural_ranker.pt`) once upon startup and executes batch CPU inference over candidate vectors.

### 6.15 Fallback Safety Mechanism
If PyTorch is absent or model weights fail to load, the system gracefully falls back to the production heuristic scoring engine (**Model E**) without interrupting REST API service.

---

# CHAPTER 7 — IMPLEMENTATION

### 7.1 Backend Implementation
The backend is implemented in Python using Flask 3.x, PyMongo, PyTorch, and SentenceTransformers.

### 7.2 Flask Application Factory
Implemented in `backend/app/__init__.py` via `create_app()`, enabling modular blueprint registration and CORS configuration.

### 7.3 REST API
Provides stateless endpoints formatted as JSON payloads (see Appendix A).

### 7.4 Authentication and JWT
`backend/app/utils/jwt_helper.py` handles cryptographic JWT token generation and Bearer header decoding.

### 7.5 MongoDB Integration
`backend/app/database/db.py` initializes PyMongo client connections to `mongodb://localhost:27017/news_recommendation_db`.

### 7.6 News Ingestion
`backend/app/services/gnews_service.py` fetches breaking news, generates 384-d embeddings, and inserts stories into MongoDB.

### 7.7 User Interaction Tracking
`backend/app/controllers/reading_history_controller.py` logs real-time reading duration and scroll depth.

### 7.8 Recommendation Service
`backend/app/services/recommendation_service.py` orchestrates candidate retrieval, attention calculation, MLP neural ranking, and ILD reranking.

### 7.9 Neural Ranker
`backend/app/ai/neural_ranker.py` handles weight checkpoint loading and batch PyTorch evaluation.

### 7.10 Analytics
`backend/app/controllers/analytics_controller.py` computes category distribution metrics and 7D reading velocity.

### 7.11 Trending
`backend/app/controllers/trending_controller.py` evaluates engagement velocity to return breaking news.

### 7.12 Admin Dashboard
`backend/app/services/admin_service.py` calculates system-wide KPI metrics protected by `@admin_required`.

### 7.13 Frontend Implementation
Built with React 18 + Vite 8.2, utilizing Material-UI (MUI v6) components and Emotion styling.

### 7.14 Responsive Design
Employs responsive breakpoints supporting Desktop ($1440 \times 900$) and Mobile ($375 \times 812$) viewports with mobile drawer navigation.

### 7.15 Error and Loading States
Includes MUI Skeleton loading grids, CircularProgress indicators, and Snackbar toast notifications for API error handling.

---

# CHAPTER 8 — EXPERIMENTAL EVALUATION

### 8.1 Experimental Dataset
Evaluation is conducted on the official Microsoft News Dataset (MIND-small benchmark).

### 8.2 MIND Dataset
Contains $48,295$ unique users, $146,036$ impression logs, and $51,282$ news articles.

### 8.3 Evaluation Methodology
Evaluated across 11 standardized ranking and diversity metrics: AUC, Precision@5/10, Recall@5/10, MRR@5/10, NDCG@5/10, and ILD@5/10.

### 8.4 Train/Validation/Test Separation
Dataset user partitions are strictly segregated:
- **Training Cohort**: Indices `[0 : 8000]` ($8,000$ users)
- **Validation Cohort**: Indices `[8000 : 10000]` ($2,000$ users)
- **Disjoint Test Cohort**: Indices `[10000 : 10500]` ($500$ users)

### 8.5 Strictly Disjoint Test Cohort

#### Table 8.1: Strictly Disjoint User Cohort Partitioning
| Cohort Partition | User Index Range in `behaviors.tsv` | User Count | User Overlap | Purpose |
|---|:---:|:---:|:---:|---|
| **Training Cohort** | `[0 : 8000]` | 8,000 | 0 | PyTorch MLP weight optimization |
| **Validation Cohort** | `[8000 : 10000]` | 2,000 | 0 | Hyperparameter tuning & early stopping |
| **Disjoint Test Cohort** | `[10000 : 10500]` | **500** | **0** | **Final benchmark evaluation (Unseen)** |

### 8.6 Model E Baseline
Model E represents the production 4-factor heuristic candidate scoring engine.

### 8.7 Model F Neural Ranker
Model F represents the PyTorch Neural Ranker MLP framework.

### 8.8 Evaluation Metrics
Evaluates accuracy (AUC, Precision, Recall), rank quality (MRR, NDCG), and intra-list diversity (ILD).

### 8.9 Model E vs Model F

#### Table 8.2: Main Empirical Benchmark Results (Model E Baseline vs. Model F Neural Ranker)
| Metric | Model E (Heuristic) | Model F (Neural Ranker) | Absolute Diff ($F - E$) | Relative Diff (%) | Statistical Significance |
|---|:---:|:---:|:---:|:---:|:---:|
| **AUC** | 0.6427 | **0.6998** | $+0.0571$ | **+8.88%** | **p < 0.001 (Significant)** |
| **MRR@5** | 0.3346 | **0.3705** | $+0.0359$ | **+10.73%** | **p < 0.001 (Significant)** |
| **MRR@10** | 0.3551 | **0.3904** | $+0.0353$ | **+9.94%** | **p < 0.001 (Significant)** |
| **NDCG@5** | 0.3583 | **0.3900** | $+0.0316$ | **+8.83%** | **p < 0.001 (Significant)** |
| **NDCG@10** | 0.4119 | **0.4423** | $+0.0303$ | **+7.36%** | **p < 0.001 (Significant)** |
| **Precision@5** | 0.1219 | **0.1289** | $+0.0070$ | **+5.73%** | **p < 0.05 (Significant)** |
| **Precision@10** | 0.0838 | **0.0877** | $+0.0039$ | **+4.67%** | **p < 0.05 (Significant)** |
| **Recall@5** | 0.4962 | **0.5253** | $+0.0291$ | **+5.87%** | **p < 0.05 (Significant)** |
| **Recall@10** | 0.6504 | **0.6735** | $+0.0231$ | **+3.55%** | **p < 0.05 (Significant)** |
| **ILD@5** | 0.8760 | **0.9281** | $+0.0522$ | **+5.95%** | **p < 0.001 (Significant)** |
| **ILD@10** | 0.8959 | **0.9296** | $+0.0337$ | **+3.77%** | **p < 0.001 (Significant)** |

### 8.10 Statistical Testing

#### Table 8.3: Statistical Significance & Effect Size Summary
| Metric | Paired t-test $p$-value | Wilcoxon $p$-value | Cohen's $d$ Effect Size | Conclusion |
|---|:---:|:---:|:---:|---|
| **AUC** | $4.97 \times 10^{-10}$ | $< 10^{-6}$ | $0.1655$ | Statistically Significant ($p < 0.001$) |
| **MRR@10** | $5.53 \times 10^{-4}$ | $< 10^{-3}$ | $0.0915$ | Statistically Significant ($p < 0.001$) |
| **NDCG@10** | $3.99 \times 10^{-4}$ | $< 10^{-3}$ | $0.0938$ | Statistically Significant ($p < 0.001$) |
| **ILD@10** | $3.60 \times 10^{-117}$ | $< 10^{-100}$ | $0.6691$ | Statistically Significant ($p < 0.001$) |

### 8.11 Ablation Study
Removing candidate-aware Softmax attention causes NDCG@10 to drop by $-4.21\%$. Removing continuous recency decay increases stale item recommendations by $+18.4\%$.

### 8.12 Ranking Difference Analysis
Model F demonstrates superior discrimination on subtle semantic preferences compared to fixed linear heuristics.

### 8.13 Latency Evaluation
Measured over $N=100$ warm HTTP REST API requests on a local execution environment (Intel Core i7 @ 2.30 GHz, Python 3.10, Flask dev server):

#### Table 8.4: Production REST API Latency Benchmark ($N=100$ Warm Iterations)
| Metric / Percentile | Response Time (ms) | Throughput (req/sec) |
|---|:---:|:---:|
| **Mean Latency** | **235.63 ms ± 12.52 ms** | **4.26 req/sec** |
| **P50 (Median)** | **233.53 ms** | - |
| **P90** | **261.07 ms** | - |
| **P95** | **278.42 ms** | - |
| **P99** | **321.54 ms** | - |

*Note: The end-to-end Python/Flask system operates in the 230ms–320ms range. Claims of sub-100ms end-to-end latency apply only to lightweight standalone model scoring, not full REST API HTTP execution.*

### 8.14 Performance Optimization
Optimizations implemented in Phase 3 reduced candidate retrieval overhead from $850\text{ ms}$ to $235\text{ ms}$ via PyMongo compound indexing and vector pre-filtering.

### 8.15 Experimental Limitations
Latency is constrained by Python Global Interpreter Lock (GIL) execution and CPU PyTorch evaluation. Sub-100ms production response times require C++ inference runtimes (ONNX Runtime / TensorRT) and Redis caching.

---

# CHAPTER 9 — USER INTERFACE AND RESULTS

### 9.1 Authentication Interface
The authentication suite provides secure login and registration views built with MUI form cards.

![Login Page](file:///d:/News_Recommendation_System/documentation/screenshots/01_login_page.png)  
*Figure 9.1: User Authentication Login Interface (`01_login_page.png`)*

![Register Page](file:///d:/News_Recommendation_System/documentation/screenshots/02_register_page.png)  
*Figure 9.2: User Account Registration Interface (`02_register_page.png`)*

### 9.2 Home Feed
The home feed presents an executive 3-column news grid with category filter chips and a live search header.

![Home News Feed](file:///d:/News_Recommendation_System/documentation/screenshots/03_home_news_feed.png)  
*Figure 9.3: Executive Home Page & Primary News Feed (`03_home_news_feed.png`)*

### 9.3 Discover
The discover page enables category filtering and live full-text search querying across stories.

![Discover Page](file:///d:/News_Recommendation_System/documentation/screenshots/04_discover_page.png)  
*Figure 9.4: Discover & Full-Text Search View (`04_discover_page.png`)*

### 9.4 Trending
The trending view presents breaking news stories sorted by real-time engagement velocity.

![Trending Page](file:///d:/News_Recommendation_System/documentation/screenshots/05_trending_page.png)  
*Figure 9.5: Trending Velocity News Feed (`05_trending_page.png`)*

### 9.5 News Details
The news details modal displays article metadata, full text content, and interactive Like/Dislike/Bookmark controls.

![News Details Modal](file:///d:/News_Recommendation_System/documentation/screenshots/06_news_details.png)  
*Figure 9.6: Article Details Modal & Reaction Action Bar (`06_news_details.png`)*

### 9.6 Personalized Recommendations
The dedicated "For You" feed presents top 10 neural-ranked stories alongside transparent AI rationales.

![Personalized Recommendations](file:///d:/News_Recommendation_System/documentation/screenshots/07_personalized_recommendations.png)  
*Figure 9.7: AI "For You" Recommendations with Transparent Rationales (`07_personalized_recommendations.png`)*

### 9.7 Analytics
The telemetry analytics view displays 7D reading velocity graphs, category distribution donuts, and reading stats.

![Analytics Dashboard](file:///d:/News_Recommendation_System/documentation/screenshots/08_reading_history_analytics.png)  
*Figure 9.8: Telemetry Analytics Dashboard & Category Donut (`08_reading_history_analytics.png`)*

### 9.8 Bookmarks
The bookmarks page renders saved stories in a responsive grid.

![Bookmarks Grid](file:///d:/News_Recommendation_System/documentation/screenshots/09_bookmarks.png)  
*Figure 9.9: Saved Story Bookmarks Grid (`09_bookmarks.png`)*

### 9.9 Admin Dashboard
The admin dashboard displays platform KPI statistics protected by `@admin_required` middleware.

![Admin Dashboard](file:///d:/News_Recommendation_System/documentation/screenshots/10_admin_dashboard.png)  
*Figure 9.10: Executive Admin Platform Dashboard (`10_admin_dashboard.png`)*

### 9.10 Responsive Mobile Interface
Verified on a Mobile viewport ($375 \times 812$) displaying collapsed drawer navigation and responsive cards.

![Mobile Responsive View](file:///d:/News_Recommendation_System/documentation/screenshots/11_mobile_responsive.png)  
*Figure 9.11: Responsive Mobile Viewport Feed (`11_mobile_responsive.png`)*

#### Table 9.1: Master Application Screenshot Specifications
| # | Figure | Screenshot Filename | Viewport | Route | Verification Status |
|---|---|---|---|---|:---:|
| 1 | Figure 9.1 | `01_login_page.png` | 1440 × 900 | `/login` | **Verified** |
| 2 | Figure 9.2 | `02_register_page.png` | 1440 × 900 | `/register` | **Verified** |
| 3 | Figure 9.3 | `03_home_news_feed.png` | 1440 × 900 | `/` | **Verified** |
| 4 | Figure 9.4 | `04_discover_page.png` | 1440 × 900 | `/discover` | **Verified** |
| 5 | Figure 9.5 | `05_trending_page.png` | 1440 × 900 | `/trending` | **Verified** |
| 6 | Figure 9.6 | `06_news_details.png` | 1440 × 900 | `/news/:id` | **Verified** |
| 7 | Figure 9.7 | `07_personalized_recommendations.png` | 1440 × 900 | `/for-you` | **Verified** |
| 8 | Figure 9.8 | `08_reading_history_analytics.png` | 1440 × 900 | `/analytics` | **Verified** |
| 9 | Figure 9.9 | `09_bookmarks.png` | 1440 × 900 | `/bookmarks` | **Verified** |
| 10 | Figure 9.10 | `10_admin_dashboard.png` | 1440 × 900 | `/admin` | **Verified** |
| 11 | Figure 9.11 | `11_mobile_responsive.png` | 375 × 812 | `/` | **Verified** |

---

# CHAPTER 10 — CONCLUSION AND FUTURE WORK

### 10.1 Summary
The **Nexora** project successfully implements an enterprise-grade, context-aware personalized news recommendation system. By combining 384-dimensional dense semantic embeddings, candidate-aware Softmax attention, a 1159-dimensional PyTorch Neural Ranker, and greedy ILD diversity reranking, the platform resolves item cold-start, session focus shifts, and topic echo chambers.

### 10.2 Achievements
- **Neural Metric Improvements**: Model F achieves $+8.88\%$ AUC ($0.6998$), $+9.94\%$ MRR@10 ($0.3904$), and $+7.36\%$ NDCG@10 ($0.4423$) over the production heuristic baseline ($p < 0.001$).
- **Diversity Maintenance**: ILD@10 reaches $0.9296$ (+3.77% gain), preventing filter bubbles.
- **Production Verification**: 100% test pass rate across 29 backend tests, 10 neural ranker unit tests, and 11 browser automation visual audits.

### 10.3 Contributions
- Derived 1159-d feature vector schema fusing semantic, interaction, and context scalar representations.
- Implemented candidate-aware Softmax attention ($\tau = 0.1$) for dynamic profiling.
- Built a full-stack production React + Flask + PyTorch + MongoDB application with transparent rationales.

### 10.4 Limitations
- End-to-end REST API latency averages $235.63\text{ ms}$, constrained by Python GIL execution and PyTorch CPU inference.
- Offline MIND benchmark evaluation relies on static news datasets; online A/B testing in live production environments is recommended.

### 10.5 Future Enhancements
1. **C++ Inference Acceleration**: Export PyTorch MLP weights to ONNX Runtime or TensorRT for sub-50ms CPU scoring.
2. **Distributed Caching**: Integrate Redis caching for candidate embeddings and user attention representations.
3. **Multi-Modal Embeddings**: Incorporate article visual features alongside text embeddings using vision-language models (CLIP).
4. **Streaming Ingestion**: Migrate APScheduler background jobs to Kafka event streams.

### 10.6 Final Conclusion
Nexora demonstrates that combining dense semantic representations, candidate-aware attention mechanisms, deep PyTorch neural ranking, and diversity reranking produces superior recommendation accuracy while preserving intra-list diversity. The system is fully verified, operational, and ready for degree evaluation.

---

## REFERENCES

1. Wu, C., Wu, F., Qi, T., & Huang, Y. (2020). *MIND: A Large-scale Dataset for News Recommendation*. Proceedings of the 58th Annual Meeting of the Association for Computational Linguistics (ACL), 3597–3610.
2. Reimers, N., & Gurevych, I. (2019). *Sentence-BERT: Sentence Embeddings using Siamese BERT-Networks*. Proceedings of the 2019 Conference on Empirical Methods in Natural Language Processing (EMNLP), 3982–3992.
3. Vaswani, A., Shazeer, N., Parmar, N., Uszkoreit, J., Jones, L., Gomez, A. N., Kaiser, Ł., & Polosukhin, I. (2017). *Attention Is All You Need*. Advances in Neural Information Processing Systems (NeurIPS), 30, 5998–6008.
4. Okura, S., Tagami, Y., Ono, S., & Tajima, A. (2017). *Embedding-based News Recommendation for Millions of Users*. Proceedings of the 23rd ACM SIGKDD International Conference on Knowledge Discovery and Data Mining (KDD), 1933–1941.
5. Wu, C., Wu, F., An, M., Huang, J., Huang, Y., & Xie, X. (2019). *Neural News Recommendation with Attentive Multi-View Learning*. Proceedings of the 28th International Joint Conference on Artificial Intelligence (IJCAI), 3863–3869.
6. Zheng, G., Zhang, F., Zheng, Z., Xiang, Y., Yuan, N. J., Xie, X., & Li, Z. (2018). *DRN: A Deep Reinforcement Learning Framework for News Recommendation*. Proceedings of the 2018 World Wide Web Conference (WWW), 167–176.
7. Covington, P., Adams, J., & Sargin, E. (2016). *Deep Neural Networks for YouTube Recommendations*. Proceedings of the 10th ACM Conference on Recommender Systems (RecSys), 191–198.
8. He, X., Liao, L., Zhang, H., Nie, L., Hu, X., & Tat-Seng, C. (2017). *Neural Collaborative Filtering*. Proceedings of the 26th International Conference on World Wide Web (WWW), 173–182.

---

## APPENDIX A — API ENDPOINT SUMMARY

#### Table A.1: Comprehensive REST API Endpoint Reference
| HTTP Method | Route Endpoint | Controller Function | Auth Required | Access Level | Description |
|---|---|---|:---: |:---:|---|
| `POST` | `/register` | `register_user()` | No | Public | Register new user account |
| `POST` | `/login` | `login()` | No | Public | Authenticate user & issue Bearer JWT |
| `GET` | `/news` | `get_news()` | No | Public | Retrieve paginated news feed |
| `GET` | `/news/:id` | `get_single_news()` | No | Public | Retrieve single news article details |
| `GET` | `/news/search` | `search_news_controller()` | No | Public | Live full-text search query |
| `GET` | `/trending` | `get_trending_news()` | No | Public | Retrieve high-velocity trending news |
| `GET` | `/recommendations/:id` | `recommend_news()` | No | Public | Get content-similar recommendations |
| `GET` | `/personalized-recommendations` | `personalized_recommendations()` | Yes | User | Get 4-factor hybrid AI recommendations |
| `POST` | `/news/:id/like` | `like_news_route()` | Yes | User | Toggle positive story reaction |
| `POST` | `/news/:id/dislike` | `dislike_news_route()` | Yes | User | Toggle negative story reaction |
| `POST` | `/bookmark/:id` | `bookmark_news_route()` | Yes | User | Toggle saved story bookmark |
| `GET` | `/bookmarks` | `get_bookmarks_route()` | Yes | User | Fetch saved story grid |
| `POST` | `/reading-history/:id` | `record_reading_history()` | Yes | User | Log reading duration & telemetry |
| `GET` | `/analytics` | `analytics_controller()` | Yes | User | Fetch telemetry KPIs & category donut |
| `GET` | `/admin/dashboard` | `admin_dashboard_controller()` | Yes | Admin | Retrieve platform metrics (RBAC 403) |

---

## APPENDIX B — IMPORTANT CONFIGURATION

```python
# System Configuration (backend/app/config/config.py)
import os

class Config:
    SECRET_KEY = os.environ.get("SECRET_KEY", "nexora_secure_512bit_hmac_key")
    MONGO_URI = os.environ.get("MONGO_URI", "mongodb://localhost:27017/news_recommendation_db")
    DEBUG = os.environ.get("DEBUG", "True").lower() in ["true", "1"]
    ALLOWED_ORIGINS = ["http://localhost:5173", "http://127.0.0.1:5173"]
    
    # Feature Schema & Model Weights Configuration
    FEATURE_VECTOR_DIM = 1159
    CANDIDATE_EMBEDDING_DIM = 384
    USER_ATTENTION_DIM = 384
    ELEMENTWISE_INTERACTION_DIM = 384
    NUM_SCALAR_FEATURES = 7
    TEMPERATURE_TAU = 0.1
    ILD_DIVERSITY_PENALTY = 0.90
```

---

## APPENDIX C — TESTING SUMMARY

```
==================== BACKEND VERIFICATION SUMMARY ====================
Security             PASS (JWT Bearer validation & Bcrypt hash checks)
Performance          PASS (Pre-filtered compound candidate queries)
News Fetch           PASS (Paginated news retrieval & search)
Scheduler            PASS (APScheduler 30-min background ingestion)
Embeddings           PASS (384-d SentenceTransformers vector encoding)
Cold Start           PASS (Zero-history popular/trending fallback)
Personalization      PASS (Softmax candidate-aware attention ranking)
Reading History      PASS (Telemetry duration logging)
Bookmarks            PASS (Saved bookmark grid CRUD operations)
Reactions            PASS (Like / Dislike signal registration)
Analytics            PASS (Telemetry counters & category distribution)
Trending             PASS (Engagement velocity evaluation)
RBAC                 PASS (Admin role protection 403 Forbidden)
Cleanup              PASS (Database indexes & session state reset)

TOTAL: 29 | PASSED: 29 | FAILED: 0 (100% PASS RATE)
NEURAL RANKER UNIT TESTS: 10/10 PASSED (100% PASS RATE)
PLAYWRIGHT BROWSER AUDIT: 11/11 VIEWS VERIFIED (100% PASS RATE)
=====================================================================
```
