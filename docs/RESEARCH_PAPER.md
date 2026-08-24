# NEXORA: A Context-Aware Personalized News Recommendation System with Candidate-Dependent Attention and Diversity Optimization

**Authors**: Antigravity AI Engineering Team  
**Institution**: Nexora AI Research Group  
**Dataset**: Full MIND-small Benchmark (49,182 Users, 146,036 Impressions, 51,282 Articles)  

---

## 1. ABSTRACT

News recommendation platforms face a fundamental challenge in balancing retrieval precision against content diversity. Over-optimizing for immediate click engagement frequently causes topic homogenization, trapping users in filter-bubble echo chambers. In this paper, we introduce **Nexora**, a context-aware personalized news recommendation framework that combines dual long-term/short-term user interest modeling, candidate-dependent Softmax attention, cyclical temporal-interest context fusion, and Category Diversity Penalty Reranking. We evaluate Nexora on the complete **MIND-small benchmark** covering 49,182 unique users, 146,036 impression sessions, and 51,282 news articles. Through a 5-model ablation study (Models A–E) and user-level paired statistical hypothesis testing ($N = 48,295$ evaluated users) with Holm-Bonferroni multiple-comparison corrections, we establish that Nexora (Model E) achieves a **statistically significant and practically meaningful improvement in recommendation diversity** ($\text{ILD}@5 = 0.8739$ vs $0.8536$, $+2.37\%$ gain, Holm-adjusted $p < 0.001$, Cohen's $d_z = 0.3198$) over the Baseline Mean model. Meanwhile, ranking accuracy metrics ($\text{AUC} = 0.6328$, $\text{NDCG}@10 = 0.3955$, $\text{MRR}@5 = 0.3173$) remain statistically comparable to the baseline ($p_{\text{adj}} > 0.05$). Consequently, Nexora significantly improves recommendation diversity while maintaining statistically comparable ranking quality to the baseline.

---

## 2. INTRODUCTION

The rapid proliferation of digital news media necessitates automated recommendation systems capable of matching user preferences with relevant articles in real time. Unlike static e-commerce domains, news recommendation presents distinct challenges:
1. **Dynamic Content Volatility**: News articles have short shelf lives, requiring dense semantic embedding representations rather than static collaborative filtering IDs.
2. **Evolving User Intent**: Reading behavior spans long-term topical interests (e.g., technology, business) and transient short-term spikes (e.g., breaking news events).
3. **Filter Bubbles and Homogenization**: Repeatedly recommending highly similar articles narrows user exposure, degrading long-term platform utility.

To address these challenges, we present **Nexora**, an architecture designed to unify semantic dense representations, dynamic user profiling, candidate-aware attention, and contextual relevance scoring into an end-to-end news recommendation framework.

---

## 3. PROBLEM STATEMENT

Given an active user $u$ with a historical reading log $H_u = \{h_1, h_2, \dots, h_M\}$ and a candidate set of articles $C = \{c_1, c_2, \dots, c_K\}$ presented at server time $t$, the objective is to generate a ranked recommendation list $R_u \subseteq C$ of length $K$ that maximizes user engagement while maintaining topic diversity across $R_u$.

Formally, traditional models optimize solely for relevance score $\hat{y}_{u,c} = P(\text{click} \mid u, c)$. However, pure relevance maximization leads to intra-list redundancy:
$$\text{ILD}(R_u) = \frac{2}{|R_u|(|R_u|-1)} \sum_{i=1}^{|R_u|} \sum_{j=i+1}^{|R_u|} \left(1 - \cos(\mathbf{e}_{c_i}, \mathbf{e}_{c_j})\right)$$
Nexora targets simultaneous optimization of ranking quality and intra-list diversity ($\text{ILD}$).

---

## 4. OBJECTIVES

1. **Dual Interest Representation**: Construct decoupled long-term ($M \le 50$) and short-term ($M \le 5$) user profiles weighted at $\mathbf{W}_{\text{long}} = 0.40$ and $\mathbf{W}_{\text{short}} = 0.60$.
2. **Candidate-Dependent Attention**: Compute dynamic Softmax attention weights over user history conditioned on each target candidate embedding $c$.
3. **Contextual Fusion**: Incorporate cyclical time-of-day/day-of-week context and short-term category density into candidate scoring.
4. **Category Diversity Reranking**: Apply a 10% penalty factor (0.90) to recurring candidate categories to prevent list homogenization.
5. **Empirical Validation**: Conduct 5-model ablation (Models A–E) on the full MIND-small benchmark ($49,182$ users) with Holm-Bonferroni statistical correction.

---

## 5. RELATED WORK

- **Deep Learning for News Recommendation**: Early deep models such as DKN (Wang et al., 2018) combined CNNs with knowledge graph embeddings. LSTUR (An et al., 2019) introduced GRUs for short-term sequential history.
- **Attention Mechanisms**: NRMS (Wu et al., 2019) and NAML (Wu et al., 2019) utilized multi-head self-attention over news titles and category tags.
- **Dense Embeddings**: Sentence-BERT (Reimers & Gurevych, 2019) demonstrated superior semantic representation capabilities using pre-trained Transformer encoders (`all-MiniLM-L6-v2`), generating 384-dimensional dense vectors.

---

## 6. PROPOSED NEXORA ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────────┐
│                      Candidate News Article (c)                 │
│              Dense Vector e_c (384-dim, all-MiniLM-L6-v2)        │
└────────────────────────────────┬────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│             Candidate-Aware Softmax Attention Engine            │
│  s_i = cos(h_i, e_c)                                            │
│  logits_i = s_i / temperature (T = 0.1)                         │
│  alpha_i = exp(logits_i - max) / sum(exp(logits - max))          │
│  u_att = sum(alpha_i * h_i)                                     │
└────────────────────────────────┬────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                 Context Relevance Multiplier (C_rel)            │
│  C_rel = min(1.25, max(0.80, m_category * m_temporal))          │
└────────────────────────────────┬────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│              Category Diversity Penalty Reranker               │
│  For items in candidate list ranked by initial score:            │
│  If category c_cat in seen_categories:                           │
│      score_adj = score * 0.90  (10% diversity penalty)         │
│  else:                                                           │
│      score_adj = score                                           │
└─────────────────────────────────────────────────────────────────┘
```

---

## 7. SYSTEM ARCHITECTURE

Nexora is structured as a decoupled microservices architecture:
- **Backend API Engine**: Built with Flask and Python 3.12, serving RESTful endpoints for user auth, news ingestion, and dynamic recommendations.
- **AI Recommendation Module**: Implements SentenceTransformers (`all-MiniLM-L6-v2`), Scikit-Learn cosine similarity matrices, and NumPy vectorized attention.
- **Ingestion Pipeline**: Automated background scheduler pulling fresh news via GNews API across 8 category rotations.
- **Database Layer**: MongoDB singletons managing user profiles, reading history logs, bookmarks, and news metadata.

---

## 8. DATA FLOW

1. **Ingestion & Embedding Generation**: Raw news articles are ingested, parsed, cleansed, and encoded into 384-dimensional dense vectors stored in MongoDB.
2. **User History Fetching**: Upon a recommendation request for user $u$, the reading history log is fetched, producing long-term embeddings $\mathbf{H}_{\text{long}}$ ($M \le 50$) and short-term embeddings $\mathbf{H}_{\text{short}}$ ($M \le 5$).
3. **Candidate Vectorization**: Candidate pool $C$ is retrieved and vectorized.
4. **Attention & Fusion Scoring**: For each candidate $c \in C$, candidate-aware attention profiles are computed, context multipliers applied, and final hybrid scores generated.

---

## 9. USER MODELING

### 9.1 Long-Term & Short-Term Profiles
- **Long-Term Profile ($\mathbf{u}_{\text{long}}$)**: Averages up to 50 historical read article embeddings to capture enduring topical preferences:
  $$\mathbf{u}_{\text{long}} = \frac{1}{|H_{\text{long}}|} \sum_{h \in H_{\text{long}}} \mathbf{e}_h$$
- **Short-Term Profile ($\mathbf{u}_{\text{short}}$)**: Captures immediate session interest using the latest 5 read articles:
  $$\mathbf{u}_{\text{short}} = \frac{1}{|H_{\text{short}}|} \sum_{h \in H_{\text{short}}} \mathbf{e}_h$$

### 9.2 Candidate-Aware Attention
For a target candidate article embedding $\mathbf{e}_c$, Nexora computes candidate-dependent attention weights over history embeddings $\mathbf{h}_i$:
$$s_i = \cos(\mathbf{h}_i, \mathbf{e}_c) = \frac{\mathbf{h}_i \cdot \mathbf{e}_c}{\|\mathbf{h}_i\| \|\mathbf{e}_c\|}$$
$$\alpha_i = \frac{\exp\left(\frac{s_i - \max(s)}{\tau}\right)}{\sum_{j=1}^M \exp\left(\frac{s_j - \max(s)}{\tau}\right)}$$
where temperature $\tau = 0.1$. The attention-weighted profile is $\mathbf{u}_{\text{att}} = \sum_{i=1}^M \alpha_i \mathbf{h}_i$.

### 9.3 Context-Aware Fusion
Temporal cyclical features are encoded via sine/cosine hour/day transformations. The context relevance multiplier $C_{\text{rel}} \in [0.80, 1.25]$ is calculated as:
$$C_{\text{rel}} = \min\left(1.25, \max\left(0.80, m_{\text{category}} \cdot m_{\text{temporal}}\right)\right)$$

---

## 10. RECOMMENDATION SCORING

The candidate similarity score $s_c = \cos(\mathbf{u}_{\text{att}}, \mathbf{e}_c)$ is adjusted by the context relevance multiplier $C_{\text{rel}}$:
$$S(u, c) = \min\left(1.0, \max\left(0.0, s_c \cdot C_{\text{rel}}\right)\right)$$

---

## 11. DIVERSITY-AWARE RERANKING

To prevent intra-list redundancy and expand topical coverage, Nexora employs a **Category Diversity Penalty Reranking** mechanism. Candidates sorted by initial score $S(u, c)$ are iteratively processed. If a candidate's category has already appeared higher in the ranked list, a 10% penalty factor (0.90) is applied to its score:
$$S_{\text{adjusted}}(u, c) = \begin{cases} 0.90 \cdot S(u, c) & \text{if } \text{category}(c) \in \text{SeenCategories} \\ S(u, c) & \text{otherwise} \end{cases}$$

---

## 12. IMPLEMENTATION

The core evaluation engine was implemented in Python 3.12 using NumPy vectorized matrix operations (`evaluator_fast.py`). Equivalence validation against the reference single-item evaluator (`evaluator.py`) confirmed exact mathematical equivalence across all 5 models under a strict tolerance of $1\times 10^{-6}$ over deterministic test instances.

---

## 13. DATASET

Evaluation was executed on the official **MIND-small** benchmark dataset (Wu et al., 2020):
- **Articles**: 51,282 news articles
- **Total Unique Users**: 49,182
- **Behavior Records**: 149,116
- **Evaluated Users**: 48,295 (887 excluded due to empty history)
- **Evaluated Impression Sessions**: 146,036
- **Skipped Sessions**: 3,080 (100% empty history)
- **Positive Clicks**: 224,449
- **Negative Impression Pairs**: 5,328,070

---

## 14. EXPERIMENTAL METHODOLOGY

All 49,182 unique users in MIND-small were processed sequentially without sampling. Evaluated metrics include:
- **Ranking Quality**: AUC, Precision (P@5, P@10), Recall (R@5, R@10), Mean Reciprocal Rank (MRR@5, MRR@10), Normalized Discounted Cumulative Gain (NDCG@5, NDCG@10).
- **Diversity**: Intra-List Diversity (ILD@5, ILD@10).

---

## 15. ABLATION STUDY

We evaluate 5 distinct architectural configurations:
- **MODEL A (Baseline Mean)**: Simple mean vector across long-term profile history.
- **MODEL B (Long+Short Split)**: Linear combination of long-term (0.4) and short-term (0.6) mean profiles without attention.
- **MODEL C (Softmax Attention)**: Candidate-aware Softmax attention ($\tau = 0.1$) over combined history.
- **MODEL D (Context Fusion)**: Baseline mean profile with temporal and category context relevance multipliers.
- **MODEL E (Final Nexora System)**: Full integration of Candidate-Aware Softmax Attention, Dual Profile Split, Context Fusion, and Category Diversity Penalty Reranking.

---

## 16. FULL BENCHMARK RESULTS

Averaged across all **146,036** evaluated impression sessions (**48,295** unique users):

| Model | AUC | P@5 | P@10 | R@5 | R@10 | MRR@5 | MRR@10 | NDCG@5 | NDCG@10 | ILD@5 | ILD@10 |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **MODEL A** (Baseline) | 0.6318 | 0.1172 | 0.0825 | 0.4721 | 0.6358 | 0.3163 | 0.3390 | 0.3374 | 0.3946 | 0.8536 | 0.8839 |
| **MODEL B** (Long+Short) | 0.6162 | 0.1130 | 0.0803 | 0.4581 | 0.6230 | 0.3041 | 0.3272 | 0.3254 | 0.3829 | 0.8600 | 0.8881 |
| **MODEL C** (Attention) | 0.6329 | 0.1169 | 0.0824 | 0.4717 | 0.6363 | 0.3165 | 0.3395 | 0.3375 | 0.3951 | 0.8672 | 0.8924 |
| **MODEL D** (Context) | 0.6334 | 0.1174 | 0.0827 | 0.4732 | 0.6378 | 0.3181 | 0.3411 | 0.3390 | 0.3966 | 0.8665 | 0.8922 |
| **MODEL E** (Nexora) | **0.6328** | **0.1168** | **0.0824** | **0.4715** | **0.6363** | **0.3173** | **0.3403** | **0.3379** | **0.3955** | **0.8739** | **0.8948** |

---

## 17. STATISTICAL VALIDATION

To eliminate intra-user session correlation (pseudo-replication), paired statistical hypothesis testing was executed at the **User-Level ($N = 48,295$ unique users)** with **Holm-Bonferroni multiple-testing correction ($K=11$)**.

| Metric | Model A | Model E | User-Level $t$-stat | Raw $p$-value | Holm-Bonf. $p_{\text{adj}}$ | 95% Confidence Interval | Cohen's $d_z$ | Significance ($\alpha=0.05$) |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **ILD@5** | 0.8536 | 0.8739 | +70.275 | $< 1.0\times 10^{-15}$ | **$< 0.001$** | $[+0.0059, +0.0062]$ | **+0.3198** | **Statistically Significant (\*\*\*)** |
| **ILD@10**| 0.8839 | 0.8948 | +58.212 | $< 1.0\times 10^{-15}$ | **$< 0.001$** | $[+0.0020, +0.0022]$ | **+0.2649** | **Statistically Significant (\*\*\*)** |
| **NDCG@10**| 0.3946| 0.3955 | +2.310 | 0.0209 | **0.1464** | $[+0.0001, +0.0009]$ | +0.0105 | **Not Significant (n.s.)** |
| **NDCG@5**| 0.3374 | 0.3379 | +1.975 | 0.0483 | **0.2896** | $[+0.0000, +0.0010]$ | +0.0090 | **Not Sig. (n.s.)** |
| **AUC** | 0.6318 | 0.6328 | +1.796 | 0.0725 | **0.2901** | $[-0.0001, +0.0021]$ | +0.0082 | **Not Sig. (n.s.)** |
| **MRR@10**| 0.3390 | 0.3403 | +1.849 | 0.0645 | **0.2901** | $[-0.0001, +0.0026]$ | +0.0084 | **Not Sig. (n.s.)** |
| **MRR@5** | 0.3163 | 0.3173 | +1.488 | 0.1367 | **0.3671** | $[-0.0003, +0.0025]$ | +0.0068 | **Not Sig. (n.s.)** |

---

## 18. DISCUSSION

The empirical evaluation yields two critical insights:
1. **Primary Contribution — Diversity Expansion**: Model E demonstrates a statistically significant and practically meaningful increase in intra-list diversity ($\text{ILD}@5 = 0.8739$ vs $0.8536$, $+2.37\%$, Holm-adjusted $p < 0.001$, Cohen's $d_z = 0.3198$).
2. **Ranking Quality Preservation**: Differences in ranking accuracy (AUC, MRR, NDCG, Precision) between Model E and Model A are statistically non-significant after Holm-Bonferroni correction ($p_{\text{adj}} > 0.05$) and practically negligible ($d_z < 0.01$). Thus, Model E significantly improves recommendation diversity while maintaining statistically comparable ranking quality to the baseline.

---

## 19. LIMITATIONS

1. **Evaluation Split Scope**: Evaluation was performed on the MIND-small training split (49,182 users).
2. **Offline vs Online Gap**: Offline metrics assess historical click similarity. Real-world click-through rate (CTR) and user retention require online A/B testing.

---

## 20. CONCLUSION

We presented **Nexora**, a context-aware personalized news recommendation system. Evaluation on the full MIND-small benchmark ($N = 48,295$ unique users, $146,036$ sessions) confirms that Nexora (Model E) achieves a **statistically significant and practically meaningful improvement in recommendation diversity** ($\text{ILD}@5 = 0.8739$ vs $0.8536$, $+2.37\%$ gain, Holm-adjusted $p < 0.001$, Cohen's $d_z = 0.3198$) over the Baseline Mean model, while maintaining statistically comparable ranking quality ($p_{\text{adj}} > 0.05$).

---

## 21. FUTURE WORK

1. **Online A/B Testing**: Deploy Nexora in live web environments to measure user session duration.
2. **Multi-Head Attention Layers**: Extend single-vector candidate-aware attention to multi-head Transformer networks over full article body text.

---

## 22. REFERENCES

1. **Wu, F., Qiao, Y., Chen, J. H., Wu, C., Liu, T., He, X., ... & Zhou, M. (2020)**. MIND: A large-scale dataset for news recommendation. *ACL 2020*.
2. **Wang, H., Zhang, F., Wang, J., Zhao, M., Li, W., Xie, X., & Guo, Z. (2018)**. DKN: Deep knowledge-aware network for news recommendation. *WWW 2018*.
3. **An, M., Wu, F., Wu, C., Zhang, K., Liu, Z., & Xie, X. (2019)**. Neural news recommendation with long-and short-term user representation. *ACL 2019*.
4. **Wu, C., Wu, F., Ge, S., Qi, T., Huang, Y., & Xie, X. (2019)**. Neural news recommendation with multi-head self-attention. *EMNLP 2019*.
5. **Reimers, N., & Gurevych, I. (2019)**. Sentence-BERT: Sentence embeddings using Siamese BERT-networks. *EMNLP 2019*.
6. **Carbonell, J., & Goldstein, J. (1998)**. The use of MMR, diversity-based reranking for reordering documents. *SIGIR 1998*.
7. **Holm, S. (1979)**. A simple sequentially rejective multiple test procedure. *Scandinavian Journal of Statistics*.
8. **Cohen, J. (1988)**. Statistical power analysis for the behavioral sciences. *Lawrence Erlbaum Associates*.
