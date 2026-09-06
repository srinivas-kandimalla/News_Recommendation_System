# Table II: Authoritative Benchmark Metric Comparison & Consistency Specification

This document provides the single source of truth for **Table II (Model Performance Comparison)** and **Figure 4 (Model Performance Comparison Chart)** in the Nexora Research Paper.

## Table II: Performance Comparison on MIND Benchmark (N = 500 Test Cohort)

| Evaluation Metric | Baseline Heuristic (Model E) | Proposed Neural Ranker (Model F) | Absolute Improvement | Relative Gain (%) | Statistical Significance |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **AUC** | 0.6427 | 0.6998 | +0.0571 | **+8.88%** | $p < 0.001$ ($t=6.26$) |
| **MRR@10** | 0.3551 | 0.3904 | +0.0353 | **+9.94%** | $p < 0.001$ ($t=3.46$) |
| **NDCG@10** | 0.4119 | 0.4423 | +0.0304 | **+7.38%** | $p < 0.001$ ($t=3.55$) |
| **ILD@10** | 0.8959 | 0.9296 | +0.0337 | **+3.76%** | $p < 0.001$ ($t=25.32$) |

---

## Detailed Mathematical Verification of Relative Gains

All percentage gains are calculated directly from the displayed 4-decimal raw experimental values using the formula:
$$\text{Relative Gain (\%)} = \left( \frac{\text{Model F}}{\text{Model E}} - 1 \right) \times 100$$

1. **AUC**:
   $$\text{Gain} = \left( \frac{0.6998}{0.6427} - 1 \right) \times 100 = \frac{0.0571}{0.6427} \times 100 = 8.884395\% \longrightarrow \mathbf{+8.88\%}$$

2. **MRR@10**:
   $$\text{Gain} = \left( \frac{0.3904}{0.3551} - 1 \right) \times 100 = \frac{0.0353}{0.3551} \times 100 = 9.940861\% \longrightarrow \mathbf{+9.94\%}$$

3. **NDCG@10**:
   $$\text{Gain} = \left( \frac{0.4423}{0.4119} - 1 \right) \times 100 = \frac{0.0304}{0.4119} \times 100 = 7.380432\% \longrightarrow \mathbf{+7.38\%}$$

4. **ILD@10**:
   $$\text{Gain} = \left( \frac{0.9296}{0.8959} - 1 \right) \times 100 = \frac{0.0337}{0.8959} \times 100 = 3.761580\% \longrightarrow \mathbf{+3.76\%}$$

---

## Alignment Verification between Table II and Figure 4

| Metric | Table II (Model E / F / Gain) | Figure 4 Bar Plot (Model E / F / Badge) | Consistency Status |
| :--- | :--- | :--- | :---: |
| **AUC** | `0.6427 → 0.6998 (+8.88%)` | `0.6427 / 0.6998 / [+8.88%]` | **MATCH (EXACT)** |
| **MRR@10** | `0.3551 → 0.3904 (+9.94%)` | `0.3551 / 0.3904 / [+9.94%]` | **MATCH (EXACT)** |
| **NDCG@10** | `0.4119 → 0.4423 (+7.38%)` | `0.4119 / 0.4423 / [+7.38%]` | **MATCH (EXACT)** |
| **ILD@10** | `0.8959 → 0.9296 (+3.76%)` | `0.8959 / 0.9296 / [+3.76%]` | **MATCH (EXACT)** |

---

## Artifact Dependencies

- **Data Source**: [`backend/evaluation/mind/final_research_results.json`](file:///d:/News_Recommendation_System/backend/evaluation/mind/final_research_results.json)
- **Generator Script**: [`backend/scripts/generate_figure4.py`](file:///d:/News_Recommendation_System/backend/scripts/generate_figure4.py)
- **Exported Figure PNG**: [`figures/Model_Performance_Comparison.png`](file:///d:/News_Recommendation_System/figures/Model_Performance_Comparison.png)
