# Phase 7.2 — Visual Assets & Technical Diagrams Specification

**Project**: Nexora — Context-Aware Personalized News Recommendation System  
**Date**: August 29, 2026  
**Status**: VERIFIED & CREATED (9 Vector SVG + 9 Mermaid Diagrams)

---

## 1. Executive Summary

This document specifies the technical diagrams generated for the final major project submission report and academic IEEE documentation of **Nexora**. All diagrams are constructed directly from the actual codebase implementation (`backend/app/`, `frontend/src/`) without hypothetical abstractions or fictitious components.

Diagrams are stored in vector SVG format and native Mermaid (`.mmd`) format inside the [`documentation/diagrams/`](file:///d:/News_Recommendation_System/documentation/diagrams) directory.

---

## 2. Diagram Inventory & Specification

### Diagram 1: System Architecture (`system_architecture.svg` / `.mmd`)
- **Purpose**: Demonstrates the end-to-end decoupled client-server microservices architecture, showing communication between the React SPA, Flask REST API, PyTorch Neural Ranker, and MongoDB document database.
- **Source-Code Components Represented**:
  - `frontend/src/App.jsx`, `context/AuthContext.jsx`, `services/api.js`
  - `backend/app/__init__.py` (11 Blueprints)
  - `backend/app/middleware/jwt_helper.py` (`@token_required`, `@admin_required`)
  - `backend/app/ai/neural_ranker.py` (`NeuralRankerInferenceService`)
  - `backend/app/scheduler.py` (`APScheduler`)
  - MongoDB 7.0 database (`news_recommendation_db`)
- **Verification Status**: VERIFIED (Matches production architecture 100%).
- **Recommended Report Placement**: **Chapter 4 — System Architecture & Design (Section 4.1)**.

---

### Diagram 2: Recommendation Architecture (`recommendation_architecture.svg` / `.mmd`)
- **Purpose**: Illustrates the complete 7-stage candidate retrieval, softmax attention, 1159-d feature vector extraction, PyTorch MLP scoring, and Intra-List Diversity (ILD) reranking workflow.
- **Source-Code Components Represented**:
  - `backend/app/services/recommendation_service.py` (`get_personalized_recommendations`)
  - `backend/app/services/user_profile_service.py` (Decoupled Short-Term $M\le 5$ & Long-Term $M\le 50$ profiles)
  - `backend/app/ai/attention_service.py` (Candidate-Aware Softmax Attention, $\tau = 0.1$)
  - `backend/app/ai/feature_extractor.py` (1159-d dense feature vector builder)
  - `backend/app/ai/neural_ranker.py` (3-layer PyTorch MLP)
  - `backend/app/services/scoring_service.py` (Greedy ILD reranking penalty)
- **Verification Status**: VERIFIED (Matches mathematical and service implementation).
- **Recommended Report Placement**: **Chapter 5 — AI Recommendation Engine (Section 5.2)**.

---

### Diagram 3: Neural Ranker Architecture (`neural_ranker_architecture.svg` / `.mmd`)
- **Purpose**: Details the exact layer-by-layer dimensionality transition, activation functions, and dropout probability of the PyTorch Deep Learning MLP ranker.
- **Explicit Layer Flow**:
  $$\text{Input (1159)} \rightarrow \text{Linear}(1159, 128) \rightarrow \text{ReLU} \rightarrow \text{Dropout}(0.2) \rightarrow \text{Linear}(128, 64) \rightarrow \text{ReLU} \rightarrow \text{Linear}(64, 1) \rightarrow \text{Sigmoid} \rightarrow \hat{y} \in [0, 1]$$
- **Source-Code Components Represented**:
  - `backend/app/ai/neural_ranker.py` (`PyTorchNeuralRanker` class)
  - `backend/app/ai/feature_extractor.py` (`FEATURE_VECTOR_DIM = 1159`)
- **Verification Status**: VERIFIED (Matches `PyTorchNeuralRanker` class definition).
- **Recommended Report Placement**: **Chapter 6 — PyTorch Neural Ranker (Section 6.1)**.

---

### Diagram 4: Database ER & Schema Diagram (`database_er_schema.svg` / `.mmd`)
- **Purpose**: Maps all 5 MongoDB collections (`users`, `news`, `reactions`, `bookmarks`, `reading_history`), primary keys, foreign key object reference relations, field types, and compound indexes.
- **Source-Code Components Represented**:
  - `backend/app/models/user_model.py` (`users_collection`)
  - `backend/app/models/news_model.py` (`news_collection`)
  - `backend/app/models/reaction_model.py` (`reaction_collection`)
  - `backend/app/models/bookmark_model.py` (`bookmark_collection`)
  - `backend/app/models/reading_history_model.py` (`reading_history_collection`)
- **Verification Status**: VERIFIED (Matches PyMongo database models and indexes).
- **Recommended Report Placement**: **Chapter 4 — System Architecture & Design (Section 4.3)**.

---

### Diagram 5: Recommendation Sequence Diagram (`recommendation_sequence.svg` / `.mmd`)
- **Purpose**: Traces the exact synchronous HTTP REST lifecycle for `GET /personalized-recommendations`, from Bearer JWT header validation to candidate retrieval, neural scoring, ILD reranking, and JSON response delivery.
- **Source-Code Components Represented**:
  - `frontend/src/pages/Recommendations.jsx` $\rightarrow$ `services/newsService.js` (`getPersonalizedRecommendations`)
  - `backend/app/routes/recommendation_routes.py` (`/personalized-recommendations`)
  - `backend/app/controllers/recommendation_controller.py`
  - `backend/app/services/recommendation_service.py`
- **Verification Status**: VERIFIED (Matches production execution path).
- **Recommended Report Placement**: **Chapter 4 — System Architecture & Design (Section 4.4)**.

---

### Diagram 6: DFD Level 0 Context Diagram (`dfd_level_0.svg` / `.mmd`)
- **Purpose**: High-level Data Flow Diagram defining system boundaries, external entities (User/Client, GNews API), and primary data boundaries.
- **Source-Code Components Represented**:
  - External Entities: User Browser Client, GNews REST Service
  - System Process: 0.0 Nexora AI Recommendation Engine
- **Verification Status**: VERIFIED (Accurate system context).
- **Recommended Report Placement**: **Chapter 4 — System Architecture & Design (Section 4.2.1)**.

---

### Diagram 7: DFD Level 1 Decomposition (`dfd_level_1.svg` / `.mmd`)
- **Purpose**: Decomposes DFD Level 0 into functional sub-processes (1.0 Auth & User Management, 2.0 News Ingestion, 3.0 Telemetry Tracking, 4.0 Neural Recommendation) and data stores (D1 `users`, D2 `news`, D3 `reactions/history`).
- **Source-Code Components Represented**:
  - Processes: `user_routes.py`, `news_fetch_routes.py`, `reading_history_routes.py`, `recommendation_routes.py`
  - Data Stores: MongoDB collections (`users`, `news`, `reactions`, `reading_history`)
- **Verification Status**: VERIFIED (Matches process flow).
- **Recommended Report Placement**: **Chapter 4 — System Architecture & Design (Section 4.2.2)**.

---

### Diagram 8: User Journey & Interaction Flow (`user_journey_flow.svg` / `.mmd`)
- **Purpose**: Maps user navigation paths from landing on `http://localhost:5173`, authentication checking, news browsing, engagement signaling (Like/Dislike/Bookmark), and AI feed generation.
- **Source-Code Components Represented**:
  - `frontend/src/routes/ProtectedRoute.jsx`
  - `frontend/src/pages/Home.jsx`, `Discover.jsx`, `Trending.jsx`, `NewsDetails.jsx`, `Recommendations.jsx`, `Analytics.jsx`
- **Verification Status**: VERIFIED (Matches React Router client routes).
- **Recommended Report Placement**: **Chapter 3 — System Requirements & Design (Section 3.4)**.

---

### Diagram 9: Deployment Architecture & Technology Stack (`deployment_technology_stack.svg` / `.mmd`)
- **Purpose**: Four-layered deployment technology stack diagram detailing Presentation Layer (React 18, MUI, Chart.js, Port 5173), Application API Layer (Flask 3.x, Port 5000), AI Inference Engine (PyTorch 2.x, SentenceTransformers), and Persistence Layer (MongoDB 7.0, Port 27017).
- **Source-Code Components Represented**:
  - `frontend/package.json`
  - `backend/requirements.txt`
  - `backend/start_server.py`
- **Verification Status**: VERIFIED (Matches physical deployment configuration).
- **Recommended Report Placement**: **Chapter 7 — Implementation & Deployment (Section 7.1)**.

---

## 3. Directory Verification Summary

All visual assets have been verified and saved to the local workspace:

| Diagram Name | SVG Asset Path | Mermaid Asset Path | Verification Status |
|---|---|---|:---:|
| **System Architecture** | [`documentation/diagrams/system_architecture.svg`](file:///d:/News_Recommendation_System/documentation/diagrams/system_architecture.svg) | `system_architecture.mmd` | **PASS** |
| **Recommendation Architecture** | [`documentation/diagrams/recommendation_architecture.svg`](file:///d:/News_Recommendation_System/documentation/diagrams/recommendation_architecture.svg) | `recommendation_architecture.mmd` | **PASS** |
| **Neural Ranker Architecture** | [`documentation/diagrams/neural_ranker_architecture.svg`](file:///d:/News_Recommendation_System/documentation/diagrams/neural_ranker_architecture.svg) | `neural_ranker_architecture.mmd` | **PASS** |
| **Database ER Schema** | [`documentation/diagrams/database_er_schema.svg`](file:///d:/News_Recommendation_System/documentation/diagrams/database_er_schema.svg) | `database_er_schema.mmd` | **PASS** |
| **Recommendation Sequence** | [`documentation/diagrams/recommendation_sequence.svg`](file:///d:/News_Recommendation_System/documentation/diagrams/recommendation_sequence.svg) | `recommendation_sequence.mmd` | **PASS** |
| **DFD Level 0** | [`documentation/diagrams/dfd_level_0.svg`](file:///d:/News_Recommendation_System/documentation/diagrams/dfd_level_0.svg) | `dfd_level_0.mmd` | **PASS** |
| **DFD Level 1** | [`documentation/diagrams/dfd_level_1.svg`](file:///d:/News_Recommendation_System/documentation/diagrams/dfd_level_1.svg) | `dfd_level_1.mmd` | **PASS** |
| **User Journey Flow** | [`documentation/diagrams/user_journey_flow.svg`](file:///d:/News_Recommendation_System/documentation/diagrams/user_journey_flow.svg) | `user_journey_flow.mmd` | **PASS** |
| **Deployment Technology Stack** | [`documentation/diagrams/deployment_technology_stack.svg`](file:///d:/News_Recommendation_System/documentation/diagrams/deployment_technology_stack.svg) | `deployment_technology_stack.mmd` | **PASS** |
