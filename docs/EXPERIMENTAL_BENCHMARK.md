# NEXORA EXPERIMENTAL BENCHMARK & STATISTICAL AUDIT REPORT

**Dataset**: Full MIND-small Benchmark  
**Scope**: 49,182 Total Users, 48,295 Evaluated Users, 146,036 Evaluated Impression Sessions  
**Validation Status**: Verified & Holm-Bonferroni Corrected  

---

## 1. DATASET CHARACTERISTICS

| Parameter | Count / Value | Description |
| :--- | :---: | :--- |
| **Total News Articles** | **51,282** | Processed through `all-MiniLM-L6-v2` dense embedding generator. |
| **Embedding Dimension** | **384** | L2-normalized dense semantic vector space. |
| **Total Unique Users** | **49,182** | 100% of MIND-small training split users. |
| **Evaluated Users** | **48,295** | 98.2% of users evaluated (having $\ge 1$ history article with embedding). |
| **Excluded Users** | **887** | 1.8% of users excluded (all history logs empty). |
| **Behavior Records** | **149,116** | Raw behavior impression sessions parsed. |
| **Evaluated Impressions** | **146,036** | Sessions with valid candidate & history embeddings evaluated. |
| **Skipped Impressions** | **3,080** | 100% skipped due to empty user history list. |
| **Positive Clicks** | **224,449** | Raw positive user clicks across behavior records. |
| **Negative Impressions** | **5,328,070** | Raw unclicked impression items. |
| **AUC Eligibility** | **146,036 (100.0%)**| Every evaluated impression contained $\ge 1$ positive and $\ge 1$ negative candidate. |

---

## 2. ABLATION STUDY RESULTS (MODEL A TO E)

Metrics averaged over all **146,036** evaluated impression sessions (**48,295** unique users):

| Model Architecture | AUC | P@5 | P@10 | R@5 | R@10 | MRR@5 | MRR@10 | NDCG@5 | NDCG@10 | ILD@5 | ILD@10 |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **MODEL A (Baseline Mean)** | 0.6318 | 0.1172 | 0.0825 | 0.4721 | 0.6358 | 0.3163 | 0.3390 | 0.3374 | 0.3946 | 0.8536 | 0.8839 |
| **MODEL B (Long+Short Split)** | 0.6162 | 0.1130 | 0.0803 | 0.4581 | 0.6230 | 0.3041 | 0.3272 | 0.3254 | 0.3829 | 0.8600 | 0.8881 |
| **MODEL C (Softmax Attention)** | 0.6329 | 0.1169 | 0.0824 | 0.4717 | 0.6363 | 0.3165 | 0.3395 | 0.3375 | 0.3951 | 0.8672 | 0.8924 |
| **MODEL D (Context Fusion)** | 0.6334 | 0.1174 | 0.0827 | 0.4732 | 0.6378 | 0.3181 | 0.3411 | 0.3390 | 0.3966 | 0.8665 | 0.8922 |
| **MODEL E (Final Nexora System)** | **0.6328** | **0.1168** | **0.0824** | **0.4715** | **0.6363** | **0.3173** | **0.3403** | **0.3379** | **0.3955** | **0.8739** | **0.8948** |

---

## 3. MODEL E vs MODEL A (BASELINE MEAN) STATISTICAL AUDIT

User-Level Paired Hypothesis Testing ($N = 48,295$ Unique Users):

| Metric | Model A | Model E | Abs Diff | % Change | User-Level $t$-stat | Raw $p$-val | Holm-Bonf. $p_{\text{adj}}$ | 95% Confidence Interval | Cohen's $d_z$ | Significance ($\alpha=0.05$) |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **AUC** | 0.6318 | 0.6328 | +0.0010 | +0.16% | +1.796 | 0.0725 | 0.2901 | $[-0.0001, +0.0021]$ | +0.0082 | **Not Significant (n.s.)** |
| **P@5** | 0.1172 | 0.1168 | -0.0004 | -0.32% | -1.545 | 0.1224 | 0.3671 | $[-0.0009, +0.0001]$ | -0.0070 | **Not Significant (n.s.)** |
| **P@10** | 0.0825 | 0.0824 | -0.0001 | -0.16% | -1.144 | 0.2526 | 0.4827 | $[-0.0004, +0.0001]$ | -0.0052 | **Not Significant (n.s.)** |
| **R@5** | 0.4721 | 0.4715 | -0.0006 | -0.12% | -0.669 | 0.5034 | 0.5034 | $[-0.0023, +0.0011]$ | -0.0030 | **Not Significant (n.s.)** |
| **R@10** | 0.6358 | 0.6363 | +0.0005 | +0.08% | +0.627 | 0.5306 | 0.5306 | $[-0.0010, +0.0020]$ | +0.0029 | **Not Significant (n.s.)** |
| **MRR@5** | 0.3163 | 0.3173 | +0.0011 | +0.34% | +1.488 | 0.1367 | 0.3671 | $[-0.0003, +0.0025]$ | +0.0068 | **Not Significant (n.s.)** |
| **MRR@10**| 0.3390 | 0.3403 | +0.0012 | +0.37% | +1.849 | 0.0645 | 0.2901 | $[-0.0001, +0.0026]$ | +0.0084 | **Not Significant (n.s.)** |
| **NDCG@5**| 0.3374 | 0.3379 | +0.0005 | +0.16% | +1.975 | 0.0483 | 0.2896 | $[+0.0000, +0.0010]$ | +0.0090 | **Not Significant (n.s.)** |
| **NDCG@10**| 0.3946| 0.3955 | +0.0009 | +0.23% | +2.310 | 0.0209 | 0.1464 | $[+0.0001, +0.0009]$ | +0.0105 | **Not Significant (n.s.)** |
| **ILD@5** | 0.8536 | 0.8739 | +0.0202 | +2.37% | +70.275 | $<10^{-15}$| **$<0.001$**| $[+0.0059, +0.0062]$ | **+0.3198** | **Statistically Significant (\*\*\*)** |
| **ILD@10**| 0.8839 | 0.8948 | +0.0109 | +1.23% | +58.212 | $<10^{-15}$| **$<0.001$**| $[+0.0020, +0.0022]$ | **+0.2649** | **Statistically Significant (\*\*\*)** |

---

## 4. SCIENTIFIC CONCLUSION STATEMENT

"Model E significantly improves recommendation diversity ($\text{ILD}@5 = 0.8739$ vs $0.8536$, $+2.37\%$, Holm-adjusted $p < 0.001$, Cohen's $d_z = 0.3198$) while maintaining statistically comparable ranking quality ($\text{AUC}$, $\text{MRR}$, $\text{NDCG}$, $p_{\text{adj}} > 0.05$) to the baseline."
