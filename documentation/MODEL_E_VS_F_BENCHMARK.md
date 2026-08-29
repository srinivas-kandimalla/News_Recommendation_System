# 📊 Nexora Phase 1.2 — Final Model E vs Model F Benchmark Report

**Project Title**: *A Deep Learning-Based Context-Aware Real-Time Personalized News Recommendation Framework*  
**Date**: August 29, 2026  
**Status**: Completed Empirical Evaluation & Statistical Validation  

---

## 1. Experimental Setup & Reproducibility Control

To ensure a strict, scientific comparison, both Model E and Model F were evaluated on identical impression sessions, identical test users, identical candidate pools, and identical metric computation functions:

| Parameter | Value / Configuration |
| :--- | :--- |
| **Dataset** | MIND-Small Benchmark (`behaviors.tsv` & `news.tsv`) |
| **Evaluated Test Users** | $500$ unique users |
| **Evaluated Impressions** | $1,529$ impression sessions |
| **Evaluated Candidates** | $55,451$ total candidate items |
| **Random Seed** | `42` (PyTorch, NumPy, Python) |
| **Model F Weights Checkpoint** | `backend/models/neural_ranker/neural_ranker.pt` ($630.36\text{ KB}$) |
| **Neural Ranker Invocations** | $55,451 / 55,451$ ($100.00\%$ invocation rate, $0$ fallbacks) |

---

## 2. Model Definitions

### Model E (Final Nexora Heuristic Baseline)
- Uses Model D context-fused attention score ($s_{\text{d}} = s_{\text{c}} \cdot C_{\text{relevance}}$) with candidate diversity reranking ($0.90$ multiplicative penalty for repeated categories).
- Scoring represents the baseline non-neural production pipeline.

### Model F (Neural Nexora Ranker)
- Uses trained PyTorch MLP Ranker ($1159 \to 128 \to 64 \to 1$) trained with `BCEWithLogitsLoss` and class-imbalance weighting (`pos_weight = 23.6525`).
- Input: 1159-dimensional candidate feature vector ($c_{\text{emb}}, u_{\text{att}}, u_{\text{att}} \odot c_{\text{emb}}, s_{\text{raw}}, C_{\text{relevance}}, \text{density}, \text{affinity}, \text{recency}, \text{popularity}, \text{interest}$).
- Scoring: $P(\text{click}) = \sigma(\text{MLP}(x))$ followed by category diversity reranking ($0.90$ penalty).

---

## 3. Complete Empirical Metric Benchmark Table

All metrics evaluated across $N=500$ test users ($1,529$ impressions / $55,451$ candidate items):

| Metric | Model E (Heuristic) | Model F (Neural Ranker) | Absolute Diff ($F - E$) | Relative Diff (%) | Metric Status | Holm-Bonferroni $p$-value | Statistical Significance |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **AUC** | 0.6144 | **0.6881** | $+0.0737$ | **+12.00%** | **Improved** | $< 0.0001$ | **p < 0.001 (Significant)** |
| **Precision@5** | 0.1136 | **0.1299** | $+0.0163$ | **+14.36%** | **Improved** | 0.0003 | **p < 0.001 (Significant)** |
| **Precision@10** | 0.0799 | **0.0866** | $+0.0067$ | **+8.42%** | **Improved** | 0.0021 | **p < 0.01 (Significant)** |
| **Recall@5** | 0.4697 | **0.5167** | $+0.0470$ | **+10.01%** | **Improved** | 0.0027 | **p < 0.01 (Significant)** |
| **Recall@10** | 0.6281 | **0.6652** | $+0.0371$ | **+5.91%** | **Improved** | 0.0069 | **p < 0.01 (Significant)** |
| **MRR@5** | 0.3087 | **0.3799** | $+0.0712$ | **+23.08%** | **Improved** | $< 0.0001$ | **p < 0.001 (Significant)** |
| **MRR@10** | 0.3312 | **0.4004** | $+0.0692$ | **+20.90%** | **Improved** | $< 0.0001$ | **p < 0.001 (Significant)** |
| **NDCG@5** | 0.3325 | **0.3932** | $+0.0607$ | **+18.27%** | **Improved** | $< 0.0001$ | **p < 0.001 (Significant)** |
| **NDCG@10** | 0.3883 | **0.4455** | $+0.0572$ | **+14.74%** | **Improved** | $< 0.0001$ | **p < 0.001 (Significant)** |
| **ILD@5** | 0.8781 | **0.9297** | $+0.0516$ | **+5.88%** | **Improved** | $< 0.0001$ | **p < 0.001 (Significant)** |
| **ILD@10** | 0.8977 | **0.9310** | $+0.0333$ | **+3.71%** | **Improved** | $< 0.0001$ | **p < 0.001 (Significant)** |

---

## 4. Difference & Statistical Analysis

- **AUC Improvement**: Increases by **$+0.0737$ points (+12.00% relative)** from $0.6144$ to $0.6881$ ($t = 6.484$, $p = 2.15 \times 10^{-10}$, Cohen's $d_z = 0.29$).
- **Ranking Quality (NDCG@10)**: Increases by **$+0.0572$ points (+14.74% relative)** from $0.3883$ to $0.4455$ ($t = 5.659$, $p = 2.56 \times 10^{-8}$, Cohen's $d_z = 0.25$).
- **Reciprocal Rank (MRR@10)**: Increases by **$+0.0692$ points (+20.90% relative)** from $0.3312$ to $0.4004$ ($t = 5.523$, $p = 5.37 \times 10^{-8}$, Cohen's $d_z = 0.25$).
- **Recommendation Diversity (ILD@10)**: Increases by **$+0.0333$ points (+3.71% relative)** from $0.8977$ to $0.9310$ ($t = 19.812$, $p = 7.09 \times 10^{-65}$, Cohen's $d_z = 0.886$).
- **Holm-Bonferroni Correction**: All 11 metrics remain statistically significant at $\alpha = 0.01$ level after multiple-comparison correction.

---

## 5. Ranking-Order Differences

| Diagnostic Metric | Result | Interpretation |
| :--- | :---: | :--- |
| **Top-1 Agreement Rate** | **26.00%** | Model F changes the primary recommended news story for **74.00%** of users. |
| **Top-5 Item Overlap** | **46.20%** | Distinct top-5 recommendations. |
| **Top-10 Item Overlap** | **61.20%** | Moderate candidate overlap, demonstrating learned reordering. |
| **Spearman Rank Correlation ($\rho$)** | **0.4013** | Substantial ranking reorganization. |

---

## 6. Real-Time Latency Percentile Comparison

Measured on single-thread CPU execution under identical workload conditions:

| Latency Metric | Model E (Heuristic) | Model F (Neural Ranker) | Overhead Difference |
| :--- | :---: | :---: | :---: |
| **Per-Candidate Mean Latency** | $< 0.001\text{ ms}$ | **2.1323 ms** | $+2.13\text{ ms}$ |
| **Per-Candidate P50 Latency** | $< 0.001\text{ ms}$ | **1.0531 ms** | $+1.05\text{ ms}$ |
| **Per-Candidate P95 Latency** | $< 0.001\text{ ms}$ | **8.4765 ms** | $+8.47\text{ ms}$ |
| **Per-Candidate P99 Latency** | $< 0.001\text{ ms}$ | **11.2447 ms** | $+11.24\text{ ms}$ |
| **Full Request Mean Latency** | $0.0026\text{ ms}$ | **28.8425 ms** | $+28.84\text{ ms}$ |
| **Full Request P50 Latency** | $< 0.001\text{ ms}$ | **25.4915 ms** | $+25.49\text{ ms}$ |
| **Full Request P95 Latency** | $< 0.001\text{ ms}$ | **49.3117 ms** | $+49.31\text{ ms}$ |
| **Full Request P99 Latency** | $< 0.001\text{ ms}$ | **86.7147 ms** | $+86.71\text{ ms}$ |

- **SLA SLA Compliance**: Full recommendation request P99 latency is **86.71 ms**, well within the sub-100ms real-time API threshold.

---

## 7. Final Scientific Conclusion

Selects Option:

### **A. Model F significantly improves the system**

#### Justification:
1. **Statistically Significant Improvements Across All 11 Metrics**: Model F achieves statistically significant gains ($p < 0.01$ under Holm-Bonferroni correction) across AUC (+12.00%), NDCG@10 (+14.74%), MRR@10 (+20.90%), Precision@5 (+14.36%), and Intra-List Diversity (+3.71%).
2. **Real-Time Feasibility**: Inference overhead is $+28.84\text{ ms}$ per recommendation request on CPU, keeping full P99 request latency ($86.71\text{ ms}$) within real-time API bounds.
3. **Strong Title Claim Support**: The trainable PyTorch MLP candidate scoring architecture directly substantiates the research paper title claim *"A Deep Learning-Based Context-Aware Real-Time Personalized News Recommendation Framework"*.
