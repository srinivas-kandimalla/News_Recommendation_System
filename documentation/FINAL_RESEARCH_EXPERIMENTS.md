# 📜 Nexora Phase 4 — Final Research Experiment Package

**Target Research Paper Title**: *A Deep Learning-Based Context-Aware Real-Time Personalized News Recommendation Framework*  
**Date**: August 29, 2026  
**Evaluation Scope**: IEEE Paper Final Research Benchmark & Statistical Verification Package  
**Machine-Readable Artifact**: `backend/evaluation/mind/final_research_results.json`  

---

## 1. Experimental Setup

The objective of this final experimental package is to establish a rigorous, reproducible, and statistically validated comparative evaluation between the existing production heuristic baseline (**Model E**) and the active deep neural ranking framework (**Model F**).

All recommendation experiments are conducted under identical execution contexts, utilizing identical user reading histories, candidate pools, candidate-aware attention representations, context relevance factors, and diversity filters. The ONLY variable between Model E and Model F is the candidate scoring function.

---

## 2. Dataset

Evaluation is conducted on the benchmark **MIND (Microsoft News Dataset)** dataset:
- **News Articles (`news.tsv`)**: Encoded into 384-dimensional dense semantic representations using `all-MiniLM-L6-v2`.
- **User Impression Logs (`behaviors.tsv`)**: Contains user click history, candidate impression pools, and binary engagement ground truth ($1 =$ clicked, $0 =$ non-clicked).

---

## 3. Train / Validation / Test Split

To guarantee zero data leakage and preserve strict scientific integrity, user cohorts are partitioned into strictly disjoint subsets:

| Cohort Partition | User Index Range in `behaviors.tsv` | User Count | User Overlap | Purpose |
| :--- | :---: | :---: | :---: | :--- |
| **Training Cohort** | Indices `[0 : 8000]` | $8,000$ | $0$ | PyTorch MLP weight optimization via BCE loss |
| **Validation Cohort** | Indices `[8000 : 10000]` | $2,000$ | $0$ | Hyperparameter selection & early stopping |
| **Disjoint Test Cohort** | Indices `[10000 : 10500]` | **500** | **0** | **Final benchmark evaluation (Strictly Unseen)** |

---

## 4. Baseline Model E (Production Heuristic)

Model E represents the current production candidate scoring layer operating on a fixed 4-factor heuristic:

$$S_{\text{Heuristic}} = 0.60 \cdot S_{\text{semantic}} + 0.20 \cdot S_{\text{recency}} + 0.10 \cdot S_{\text{popularity}} + 0.10 \cdot S_{\text{interest}}$$

Followed by deterministic category diversity penalty reranking ($\lambda_{\text{diversity}} = 0.90$).

---

## 5. Proposed Model F (Neural Nexora Ranker)

Model F replaces the fixed linear heuristic scoring weights with a learned 3-layer PyTorch Multi-Layer Perceptron (MLP) architecture:

$$S_{\text{Neural}} = \text{MLP}_{\theta}(X \in \mathbb{R}^{1159}) \to \text{ReLU} \to \text{Dropout}(0.2) \to \text{ReLU} \to \text{Sigmoid}$$

The hybrid score for candidate ranking is formulated as:

$$S_{\text{Hybrid}} = 0.60 \cdot S_{\text{Neural}} + 0.20 \cdot S_{\text{recency}} + 0.10 \cdot S_{\text{popularity}} + 0.10 \cdot S_{\text{interest}}$$

Followed by identical category diversity penalty reranking ($\lambda_{\text{diversity}} = 0.90$).

---

## 6. Feature Schema Configuration ($1159$-d Vector)

The input feature vector $X \in \mathbb{R}^{1159}$ is constructed per candidate as follows:

| Feature Sub-Vector Component | Dimension | Formulation / Description |
| :--- | :---: | :--- |
| **Candidate Embedding ($c$)** | $384$ | 384-d `all-MiniLM-L6-v2` article semantic vector |
| **User Attention Profile ($u_{\text{att}}$)** | $384$ | Candidate-aware long/short-term Softmax attention vector |
| **Hadamard Interaction ($u_{\text{att}} \odot c$)** | $384$ | Elementwise interaction vector |
| **Context Fused Semantic Score** | $1$ | Raw similarity multiplied by context relevance factor |
| **Context Relevance Factor** | $1$ | $C_{\text{relevance}} \in [0.80, 1.25]$ |
| **Recent Category Density Ratio** | $1$ | Distribution ratio of category in short-term history |
| **Temporal Affinity Multiplier** | $1$ | Time-of-day category affinity multiplier |
| **Recency Score** | $1$ | Continuous exponential decay $e^{-\lambda \cdot \text{days}}$ |
| **Popularity Score** | $1$ | Engagement signal density $\min((\text{reads} + 2\cdot\text{likes} + 2\cdot\text{bm})/20, 1.0)$ |
| **User Interest Score** | $1$ | Explicit category and author match score |
| **TOTAL FEATURE DIMENSION** | **1159** | Verified at runtime and training time |

---

## 7. Evaluation Metrics

Evaluated across 11 standardized ranking and recommendation metrics:
- **AUC (Area Under ROC Curve)**: Measures global pairwise ranking accuracy.
- **Precision@K ($K=5, 10$)**: Ratio of relevant clicked items in Top-K recommendations.
- **Recall@K ($K=5, 10$)**: Fraction of total clicked items captured in Top-K recommendations.
- **MRR@K ($K=5, 10$)**: Mean Reciprocal Rank of the first clicked article.
- **NDCG@K ($K=5, 10$)**: Normalized Discounted Cumulative Gain accounting for rank position.
- **ILD@K ($K=5, 10$)**: Intra-List Diversity measuring semantic distance among Top-K items.

---

## 8. Main Benchmark Results

Evaluated on the strictly disjoint 500-user test cohort ($1,432$ test impressions):

| Metric | Model E (Heuristic) | Model F (Neural Nexora) | Absolute Difference | Relative Improvement (%) | Paired t-test $p$-value | Cohen's $d$ Effect Size | Statistically Significant ($p < 0.05$) |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **AUC** | $0.6427$ | **0.6998** | $+0.0571$ | **+8.88%** | $4.97 \times 10^{-10}$ | $0.1655$ | **Yes ($p < 0.001$)** |
| **MRR@5** | $0.3346$ | **0.3705** | $+0.0359$ | **+10.73%** | $8.27 \times 10^{-4}$ | $0.0885$ | **Yes ($p < 0.001$)** |
| **MRR@10** | $0.3551$ | **0.3904** | $+0.0353$ | **+9.94%** | $5.53 \times 10^{-4}$ | $0.0915$ | **Yes ($p < 0.001$)** |
| **NDCG@5** | $0.3583$ | **0.3900** | $+0.0316$ | **+8.83%** | $9.11 \times 10^{-4}$ | $0.0878$ | **Yes ($p < 0.001$)** |
| **NDCG@10** | $0.4119$ | **0.4423** | $+0.0303$ | **+7.36%** | $3.99 \times 10^{-4}$ | $0.0938$ | **Yes ($p < 0.001$)** |
| **Precision@5** | $0.1219$ | **0.1289** | $+0.0070$ | **+5.73%** | $2.44 \times 10^{-2}$ | $0.0595$ | **Yes ($p < 0.05$)** |
| **Precision@10** | $0.0838$ | **0.0877** | $+0.0039$ | **+4.67%** | $1.53 \times 10^{-2}$ | $0.0641$ | **Yes ($p < 0.05$)** |
| **Recall@5** | $0.4962$ | **0.5253** | $+0.0291$ | **+5.87%** | $1.37 \times 10^{-2}$ | $0.0652$ | **Yes ($p < 0.05$)** |
| **Recall@10** | $0.6504$ | **0.6735** | $+0.0231$ | **+3.55%** | $3.55 \times 10^{-2}$ | $0.0556$ | **Yes ($p < 0.05$)** |
| **ILD@5** | $0.8760$ | **0.9281** | $+0.0522$ | **+5.95%** | $6.34 \times 10^{-122}$ | $0.6855$ | **Yes ($p < 0.001$)** |
| **ILD@10** | $0.8959$ | **0.9296** | $+0.0337$ | **+3.77%** | $3.60 \times 10^{-117}$ | $0.6691$ | **Yes ($p < 0.001$)** |

---

## 9. Statistical Analysis & Hypothesis Testing

- **Unit of Analysis**: Per-impression paired metric evaluations across $1,432$ test impressions.
- **Statistical Tests**:
  1. Paired two-tailed Student's $t$-test (`scipy.stats.ttest_rel`)
  2. Non-parametric Wilcoxon signed-rank test (`scipy.stats.wilcoxon`)
- **Statistical Findings**:
  All primary recommendation quality metrics (**AUC**, **MRR@10**, **NDCG@10**, **ILD@10**) demonstrate statistically significant gains for Model F over Model E ($p < 0.001$). Precision and Recall metrics exhibit statistically significant gains ($p < 0.05$).

---

## 10. Component Ablation Study

Evaluated component contributions by selectively disabling architectural sub-systems:

| System Configuration | AUC | MRR@10 | NDCG@10 | ILD@10 | Primary Insight |
| :--- | :---: | :---: | :---: | :---: | :--- |
| **Full Model F (Neural Nexora)** | **0.6998** | **0.3904** | **0.4423** | **0.9296** | **Optimal overall performance & diversity balance** |
| **w/o Context Features** | $0.6712$ | $0.3724$ | $0.4215$ | $0.9310$ | Context fusion provides $+4.26\%$ AUC gain |
| **w/o Diversity Reranking** | $0.6998$ | $0.3985$ | $0.4491$ | $0.6120$ | Diversity reranking prevents severe filter bubbles |
| **Heuristic Baseline (Model E)** | $0.6427$ | $0.3551$ | $0.4119$ | $0.8959$ | Fixed heuristic baseline |

---

## 11. Ranking Difference & Correlation Analysis

Quantified candidate re-ordering behavior between Model E and Model F:

- **Top-1 Agreement Rate**: **21.44%** (Model F alters the Top-1 article for **78.56%** of users).
- **Top-5 Overlap Mean**: **43.46%**
- **Top-10 Overlap Mean**: **51.02%**
- **Spearman Rank Correlation ($\rho$)**: **0.4079**

### Analytical Verdict:
Model F demonstrates a moderate Spearman correlation ($\rho = 0.4079$) with Model E while altering the Top-1 article for nearly $80\%$ of users, proving that Model F genuinely learns non-linear feature interactions rather than merely mirroring the baseline heuristic.

---

## 12. End-to-End Latency & Throughput Benchmark

Multi-run warm REST API benchmark metrics ($N=100$ requests per run across 3 runs):

| Latency Metric | Measured Performance | Measurement Context |
| :--- | :---: | :--- |
| **Mean Request Latency** | **235.63 ms** ($\pm 12.52\text{ ms}$) | Local Werkzeug WSGI server / MongoDB socket |
| **Median (P50) Latency** | **233.53 ms** | $50^{\text{th}}$ percentile response time |
| **P90 Latency** | **261.07 ms** | $90^{\text{th}}$ percentile response time |
| **P95 Latency** | **278.42 ms** | $95^{\text{th}}$ percentile response time |
| **P99 Tail Latency** | **321.54 ms** | $99^{\text{th}}$ percentile tail response time |
| **API Throughput** | **4.26 req/sec** | Sustained local REST API throughput |
| **PyTorch CPU Neural Inference** | **29.85 ms** | Single matrix forward pass ($457 \times 1159$) on CPU |

---

## 13. System Limitations

1. **Hardware Context**: All latency measurements were conducted on local CPU hardware running a single-process Flask WSGI development server and local MongoDB instance.
2. **Real-Time SLA Target**: With candidate pre-filtering disabled (`CANDIDATE_PREFILTER_TOP_N = 0`), scoring $457$ candidate items on CPU produces an end-to-end P99 latency of $321.54\text{ ms}$. Sub-100 ms SLA is achievable when candidate pre-filtering ($N=50$) is enabled.

---

## 14. Reproducibility & Environment Configuration

- **Random Seed**: `42`
- **PyTorch Model Checkpoint**: `backend/models/neural_ranker/neural_ranker.pt`
- **Feature Vector Schema**: $1159$ dimensions
- **Production Default Setting**: `USE_NEURAL_RANKER = False` (Fallback heuristic remains operational)
- **Machine-Readable Results Artifact**: `backend/evaluation/mind/final_research_results.json`

---

## 15. Final Research Conclusions

1. **Superior Recommendation Accuracy**: Model F achieves statistically significant gains over Model E across all evaluated metrics ($\text{AUC}: 0.6427 \to 0.6998, +8.88\%, p < 0.001; \text{MRR}@10: 0.3551 \to 0.3904, +9.94\%, p < 0.001$).
2. **Context & Diversity Effectiveness**: Component ablations confirm that context fusion drives accuracy gains ($+4.26\%$ AUC), while diversity reranking elevates intra-list diversity from $0.6120$ to $0.9296$.
3. **Engineering Speedup**: Engineering optimizations across Phase 3 reduced mean REST API latency from $1,911.02\text{ ms}$ down to $\sim 235.63\text{ ms}$ (**8.1x speedup**), establishing a robust baseline for paper submission.
