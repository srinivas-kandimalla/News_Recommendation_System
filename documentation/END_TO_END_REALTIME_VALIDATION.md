# ⏱️ Nexora Phase 2 — End-to-End Real-Time Latency Validation Report

**Project Title**: *A Deep Learning-Based Context-Aware Real-Time Personalized News Recommendation Framework*  
**Date**: August 29, 2026  
**Target API Path**: `GET /personalized-recommendations` (Mapped to `GET /api/recommendations`)  
**Status**: Comprehensive End-to-End Latency Audit Completed  

---

## 1. End-to-End Production API Execution Path

The complete HTTP request execution path was traced from client invocation to HTTP response:

```
HTTP GET /personalized-recommendations (Authorization: Bearer <JWT>)
  │
  ├── 1. JWT Authentication Middleware (app/utils/jwt_helper.py)
  │      └── Decodes JWT & queries MongoDB users_collection by _id (1.59 ms)
  │
  ├── 2. Recommendation Controller (app/controllers/recommendation_controller.py)
  │      └── Invokes get_personalized_recommendations(user_id)
  │
  ├── 3. User History & Profile Retrieval (app/ai/recommendation_service.py)
  │      └── Queries reading_history_collection for read news ObjectIds (1.58 ms)
  │
  ├── 4. Candidate News & Embedding Retrieval (app/ai/recommendation_service.py)
  │      └── Scans news_collection for unread candidate articles (30.70 ms)
  │
  ├── 5. Candidate-Aware Attention Profiling (app/ai/attention_service.py)
  │      └── Computes dual-window softmax user profile attention (2.99 ms)
  │
  ├── 6. Context Relevance & Recency Scoring (app/ai/context_service.py, scoring_service.py)
  │      └── Computes category density ratio & temporal exponential decay (< 0.1 ms)
  │
  ├── 7. Candidate Scoring / Neural Ranking (app/ai/ranking_service.py, neural_ranker.py)
  │      └── Model E: Heuristic scoring formula
  │      └── Model F: PyTorch MLP (1159 -> 128 -> 64 -> 1) forward passes (110.29 ms)
  │
  ├── 8. Category Diversity Reranking (app/ai/recommendation_service.py)
  │      └── Applies 0.90 multiplicative penalty to duplicate categories (0.15 ms)
  │
  └── 9. Response Serialization & Delivery (app/controllers/recommendation_controller.py)
         └── Flask jsonify() serializes payload to JSON string (1.01 ms)
```

---

## 2. Latency Measurement Environment

- **Server Stack**: Flask WSGI Application (`app.test_client()`)
- **Database**: Local MongoDB instance (`news_recommendation_db`)
- **Workload**: $100$ warm HTTP requests per model configuration + $1$ cold-start request.
- **Candidate Pool**: $457$ unread candidate news articles per user query.

---

## 3. End-to-End REST API Latency Benchmark ($N = 100$ Requests)

| Metric | Cold Start (Model F) | Model E Warm (Heuristic) | Model F Warm (Neural Ranker) | Absolute Overhead ($F - E$) |
| :--- | :---: | :---: | :---: | :---: |
| **Mean Latency** | $1,576.28\text{ ms}$ | $1,213.65\text{ ms}$ | **1,911.02 ms** | $+697.37\text{ ms}$ |
| **Median (P50)** | $1,576.28\text{ ms}$ | $1,211.81\text{ ms}$ | **1,864.06 ms** | $+652.25\text{ ms}$ |
| **P90 Latency** | $1,576.28\text{ ms}$ | $1,298.94\text{ ms}$ | **2,188.87 ms** | $+889.93\text{ ms}$ |
| **P95 Latency** | $1,576.28\text{ ms}$ | $1,331.42\text{ ms}$ | **2,299.15 ms** | $+967.73\text{ ms}$ |
| **P99 Latency** | $1,576.28\text{ ms}$ | $1,406.97\text{ ms}$ | **3,079.82 ms** | $+1,672.85\text{ ms}$ |
| **Minimum Latency**| $1,576.28\text{ ms}$ | $1,075.63\text{ ms}$ | **1,443.37 ms** | $+367.74\text{ ms}$ |
| **Maximum Latency**| $1,576.28\text{ ms}$ | $1,439.82\text{ ms}$ | **3,241.29 ms** | $+1,801.47\text{ ms}$ |
| **Throughput** | — | **0.82 req/sec** | **0.52 req/sec** | $-0.30\text{ req/sec}$ |

---

## 4. Sub-Component Latency Budget Breakdown (Model F Request)

| Component Layer | Measured Latency (ms) | % of Total Request Time | Description / Bottleneck Status |
| :--- | :---: | :---: | :--- |
| **JWT Authentication & DB User Lookup** | $1.593\text{ ms}$ | $0.08\%$ | Fast indexed MongoDB query |
| **User History Retrieval** | $1.576\text{ ms}$ | $0.08\%$ | Fast indexed MongoDB query |
| **Candidate Retrieval (MongoDB `find`)** | **30.704 ms** | **1.61%** | Scans candidate collection for unread news |
| **Embedding Retrieval** | Included in Candidate DB Query | — | Dense 384-d float array loading |
| **Candidate-Aware Attention** | $2.992\text{ ms}$ | $0.16\%$ | Vectorized NumPy dual-window attention |
| **Context Relevance & Recency** | $< 0.100\text{ ms}$ | $< 0.01\%$ | Vectorized scalar computations |
| **Neural Ranker Scoring (Un-batched)** | **110.292 ms** | **5.77%** | Single-item PyTorch loop over 457 candidates |
| **Diversity Reranking** | $0.150\text{ ms}$ | $0.01\%$ | Category penalty reranking |
| **JSON Response Serialization** | $1.005\text{ ms}$ | $0.05\%$ | Flask `jsonify` payload serialization |
| **Python Loop & Object Overhead** | **~1,762.700 ms** | **92.24%** | Sequential candidate dictionary creation in Python |

---

## 5. Root Cause & Bottleneck Analysis

### Why Total End-to-End REST API Latency Exceeds 100 ms:
1. **Un-batched Single-Item Scoring Loop**: `recommendation_service.py` currently iterates through $N$ candidate articles one by one in Python, creating candidate feature dictionaries and calling `neural_ranker_service.predict_proba()` individually instead of forming a single batched PyTorch tensor $X \in \mathbb{R}^{N \times 1159}$ for matrix multiplication (`110.29 ms`).
2. **Full Candidate Dictionary Allocations**: Building Python dictionaries and formatting string responses for hundreds of candidates introduces substantial Python object allocation overhead ($\sim 1.76\text{ seconds}$).
3. **In-Memory Pure Ranking vs Full REST API Roundtrip**: While in-memory candidate re-scoring takes $\sim 28.84\text{ ms}$, the un-optimized REST API pipeline takes **$3,079.82\text{ ms}$ (3.08 seconds)** at P99.

---

## 6. Recommended Optimizations for Future Phases

1. **Tensor Batching**: Replace sequential single-item candidate feature calls with a single batched PyTorch matrix pass: `model(X_batch)` ($X \in \mathbb{R}^{N \times 1159}$), reducing PyTorch scoring overhead from $110.29\text{ ms}$ to $< 5\text{ ms}$.
2. **Top-K Pre-filtering**: Apply lightweight heuristic candidate retrieval (Model D) to select top-50 candidate articles *before* feature extraction, reducing candidate scoring pool size by $90\%$.
3. **Database Projection Indexing**: Project only necessary candidate fields from MongoDB instead of loading full text documents during recommendation generation.

---

## 7. Final Scientific Verdict

Selects Option:

### **C. Real-time requirement not currently satisfied**

#### Scientific Justification:
- Under strict scientific guidelines, a system cannot claim *"sub-100 ms real-time API"* when the measured end-to-end REST API latency P99 is **$3,079.82\text{ ms}$ (3.08 seconds)**.
- While candidate scoring in isolation operates within real-time bounds ($\sim 28.84\text{ ms}$ per request), full REST API roundtrip latency currently exceeds the $100\text{ ms}$ threshold due to un-batched candidate iteration and Python dictionary construction overhead.
- Selecting Option **C** provides an honest, empirical baseline that highlights the exact tensor batching and pre-filtering optimizations required before updating title claims.
