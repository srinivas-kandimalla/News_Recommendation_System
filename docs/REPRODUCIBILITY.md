# NEXORA REPRODUCIBILITY GUIDE

This guide provides step-by-step instructions for verifying and reproducing the **Nexora News Recommendation System** evaluations and statistical audits on the **MIND-small benchmark**.

---

## 1. PREREQUISITES & ENVIRONMENT SETUP

- **OS**: Windows / Linux / macOS
- **Python**: Python 3.10+ (tested on Python 3.12)
- **Dependencies**: Install required packages:
  ```bash
  pip install -r backend/requirements.txt
  ```

---

## 2. REPRODUCIBILITY VERIFICATION WORKFLOW

### Step A: Verify Fast Vectorized Evaluator Equivalence
Verify that the fast vectorized evaluator (`evaluator_fast.py`) produces mathematically identical outputs to the single-item reference evaluator (`evaluator.py`) under a $1\times 10^{-6}$ tolerance:
```bash
python backend/app/evaluation/mind/validate_equivalence.py
```
*Expected Output*: `✅ EQUIVALENCE VALIDATION PASSED across all test samples!`

---

### Step B: Inspect Pre-Computed Full MIND-Small Benchmark Results
To view the full 49,182-user benchmark results without re-running the multi-hour evaluation:
```bash
python -c "import json; d=json.load(open('backend/evaluation/mind/step8d_full_results.json')); print(json.dumps(d['summary_metrics'], indent=2))"
```

---

### Step C: Execute User-Level Statistical Validation Audit
To re-calculate the user-level paired $t$-tests ($N = 48,295$), confidence intervals, Cohen's $d_z$, and Holm-Bonferroni corrections ($K=11$ / $K=44$):
```bash
python backend/app/evaluation/mind/step10_user_level_statistical_validation.py
```
*Expected Output*: Generates `step10_statistical_audit.json` and prints the user-level statistical table with Holm-Bonferroni corrected $p$-values.

---

## 3. FULL RE-EVALUATION (OPTIONAL / EXPENSIVE)

> [!WARNING]
> **Resource Notice**: Running the full MIND-small benchmark evaluates 146,036 impression sessions across 49,182 users. This process requires pre-cached embeddings and takes approximately 10–20 minutes depending on CPU vector acceleration.

To execute a clean, atomic-checkpointed re-evaluation:
```bash
python backend/app/evaluation/mind/run_full_mind_evaluation.py
```
- Atomic checkpoints save every 1,000 users to `step8d_checkpoint.json`.
- Automatically removes temporary checkpoint file upon 100% completion.
