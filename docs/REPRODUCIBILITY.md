# NEXORA REPRODUCIBILITY GUIDE

> **Step-by-step instructions for reproducing, evaluating, and verifying the Nexora News Recommendation System backend services, automated test suite (29/29 tests), and MIND-small benchmark metrics.**

---

## 1. Environment & Dependencies Setup

### System Requirements:
- **Operating System**: Windows 10/11, Linux (Ubuntu 20.04+), or macOS
- **Python**: 3.10, 3.11, or 3.12 (Tested on Python 3.12)
- **Node.js**: 18.0 or higher
- **Database**: MongoDB 6.0+ (Local instance at `mongodb://localhost:27017` or cloud MongoDB URI)

### Setup Instructions:
```bash
# Clone repository and navigate to root directory
cd d:\News_Recommendation_System

# Create & activate Python virtual environment
cd backend
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

# Install required Python packages
pip install -r requirements.txt

# Configure environment variables
cp .env.example .env
```

---

## 2. Verification & Automated Test Suite

To run the complete 29-test automated verification suite covering security, performance, cold-start handling, personalization, bookmarks, reactions, and MongoDB indexes:

```bash
# Run from backend directory
python scripts/run_all_tests.py
```

### Expected Output:
```
==================== BACKEND VERIFICATION ====================
Security             PASS
Performance          PASS
News Fetch           PASS
Scheduler            PASS
Embeddings           PASS
Cold Start           PASS
Personalization      PASS
Reading History      PASS
Bookmarks            PASS
Reactions            PASS
Analytics            PASS
Trending             PASS
RBAC                 PASS
Cleanup              PASS

TOTAL: 29 | PASSED: 29 | FAILED: 0 (100% PASS RATE)
```

---

## 3. MIND Benchmark Evaluation Verification

### Step A: Verify Fast Vectorized Evaluator Equivalence
Verify that the fast vectorized evaluator ([`evaluator_fast.py`](file:///d:/News_Recommendation_System/backend/evaluation/evaluator_fast.py)) matches the reference single-item evaluator ([`evaluator.py`](file:///d:/News_Recommendation_System/backend/evaluation/evaluator.py)) under a strict $1\times 10^{-6}$ numerical tolerance:
```bash
cd backend
python evaluation/evaluator_fast.py
```

---

### Step B: Inspect Pre-Computed Full Benchmark Results
To view the full 49,182-user benchmark results without re-running the multi-hour evaluation:
```bash
cd backend
python -c "import json; d=json.load(open('evaluation/step8d_full_results.json')); print(json.dumps(d['summary_metrics'], indent=2))"
```

---

### Step C: Execute User-Level Statistical Validation Audit
To re-calculate the user-level paired $t$-tests ($N = 48,295$ unique users), confidence intervals, Cohen's $d_z$, and Holm-Bonferroni corrections ($K=11$):
```bash
cd backend
python evaluation/step10_user_level_statistical_validation.py
```
*Output*: Generates `step10_statistical_audit.json` and prints the user-level statistical table with Holm-Bonferroni corrected $p$-values.

---

## 4. Running Local Development Servers

### Start Backend Server (Port 5000):
```bash
cd backend
python run.py
```

### Start Frontend Client (Port 5173):
```bash
cd frontend
npm install
npm run dev
```
