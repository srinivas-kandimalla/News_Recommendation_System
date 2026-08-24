# 📰 Nexora: Context-Aware Personalized News Recommendation System

Nexora is an enterprise-grade AI personalized news recommendation platform. It combines dense Transformer semantic embeddings (`all-MiniLM-L6-v2`), dual long-term/short-term user interest profiling, candidate-dependent Softmax attention, cyclical temporal-interest context fusion, and Category Diversity Penalty Reranking.

---

## 🚀 Key Features

- **Candidate-Aware Softmax Attention**: Dynamic candidate-conditioned attention weights over historical user read logs ($\tau = 0.1$).
- **Dual Interest Profiling**: Decoupled long-term ($M \le 50$, weight 0.40) and short-term ($M \le 5$, weight 0.60) user representation vectors.
- **Context Relevance Fusion**: Fuses temporal time-of-day/day-of-week cyclical features and short-term category density ($C_{\text{rel}} \in [0.80, 1.25]$).
- **Category Diversity Reranking**: Promotes topic diversity by applying a 10% penalty factor (0.90) to recurring candidate categories.
- **Automated GNews Ingestion**: 8-category background news crawler running every 30 minutes with automatic embedding generation.

---

## 📊 MIND-Small Benchmark Evaluation Results

Evaluated on the full official **MIND-small benchmark** ($N = 48,295$ unique users, $146,036$ impression sessions, $51,282$ news articles):

| Model Architecture | AUC | P@5 | P@10 | R@5 | R@10 | MRR@5 | MRR@10 | NDCG@5 | NDCG@10 | ILD@5 | ILD@10 |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **MODEL A (Baseline Mean)** | 0.6318 | 0.1172 | 0.0825 | 0.4721 | 0.6358 | 0.3163 | 0.3390 | 0.3374 | 0.3946 | 0.8536 | 0.8839 |
| **MODEL B (Long+Short Split)** | 0.6162 | 0.1130 | 0.0803 | 0.4581 | 0.6230 | 0.3041 | 0.3272 | 0.3254 | 0.3829 | 0.8600 | 0.8881 |
| **MODEL C (Softmax Attention)** | 0.6329 | 0.1169 | 0.0824 | 0.4717 | 0.6363 | 0.3165 | 0.3395 | 0.3375 | 0.3951 | 0.8672 | 0.8924 |
| **MODEL D (Context Fusion)** | 0.6334 | 0.1174 | 0.0827 | 0.4732 | 0.6378 | 0.3181 | 0.3411 | 0.3390 | 0.3966 | 0.8665 | 0.8922 |
| **MODEL E (Nexora System)** | **0.6328** | **0.1168** | **0.0824** | **0.4715** | **0.6363** | **0.3173** | **0.3403** | **0.3379** | **0.3955** | **0.8739** | **0.8948** |

### Primary Scientific Finding
- **Intra-List Diversity ($\text{ILD}@5$)**: Model E achieves a **statistically significant and practically meaningful improvement** ($\mathbf{+2.37\%}$ gain, $\text{ILD}@5 = 0.8739$ vs $0.8536$, Holm-adjusted $p < 0.001$, Cohen's $d_z = 0.3198$).
- **Ranking Quality**: Ranking metric differences between Model E and Model A are statistically non-significant after Holm-Bonferroni correction ($p_{\text{adj}} > 0.05$). Thus, **Model E significantly improves recommendation diversity while maintaining statistically comparable ranking quality to the baseline**.

---

## 📚 Project Documentation Workspace

Detailed research and technical documentation is available in the [`docs/`](file:///D:/News_Recommendation_System/docs) directory:
- 📄 **[Full Research Paper Manuscript](file:///D:/News_Recommendation_System/docs/RESEARCH_PAPER.md)**: 22-section academic manuscript.
- 📈 **[Experimental Benchmark & Statistical Audit](file:///D:/News_Recommendation_System/docs/EXPERIMENTAL_BENCHMARK.md)**: Metric breakdown, user-level statistical tests ($N = 48,295$), and Holm-Bonferroni corrections.
- 🔁 **[Reproducibility Guide](file:///D:/News_Recommendation_System/docs/REPRODUCIBILITY.md)**: Step-by-step evaluation setup and verification instructions.
- 🏗️ **[System Architecture & API Specs](file:///D:/News_Recommendation_System/docs/ARCHITECTURE.md)**: Microservices design, AI modules, and DB schemas.
- 🧪 **[Final QA Audit Report](file:///D:/News_Recommendation_System/docs/STEP12_FINAL_AUDIT.md)**: Final verification audit.

---

## 🛠️ Quick Start & Running Locally

### Backend Setup
```bash
cd backend
pip install -r requirements.txt
python run.py
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```