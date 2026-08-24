"""
NEXORA STEP 9: STATISTICAL VALIDATION OF FULL MIND-SMALL BENCHMARK
===================================================================
Performs paired statistical significance tests (Paired Student's t-test, 
p-values, 95% Confidence Intervals, Standard Errors, Cohen's d_z) 
comparing Model E against Models A, B, C, and D across all 146,036 
evaluable impression sessions.

Uses single-pass Welford online algorithm for memory-efficient exact variance/covariance computation.
"""
import os, sys, csv, json, time, math, datetime, numpy as np
import scipy.stats as stats

LOG_FILE    = "D:/News_Recommendation_System/backend/evaluation/mind/step9_run.log"
OUTPUT_JSON = "D:/News_Recommendation_System/backend/evaluation/mind/step9_statistical_results.json"
DATA_DIR    = "D:/News_Recommendation_System/backend/evaluation/mind/data"
CACHE_DIR   = "D:/News_Recommendation_System/backend/evaluation/mind/cache"
CACHE_META  = CACHE_DIR + "/news_meta.json"
CACHE_EMBS  = CACHE_DIR + "/news_embs.npy"
BEH_TSV     = DATA_DIR  + "/behaviors.tsv"
VAL_RESULT  = "D:/News_Recommendation_System/backend/evaluation/mind/validation_result.txt"

open(LOG_FILE, "w").close()

def log(msg=""):
    print(msg, flush=True)
    with open(LOG_FILE, "a", encoding="utf-8") as f:
        f.write(msg + "\n"); f.flush()

start_total = time.time()
eval_timestamp = datetime.datetime.now().isoformat()

log("=" * 72)
log("  NEXORA STEP 9: STATISTICAL VALIDATION")
log("=" * 72)
log(f"  Timestamp    : {eval_timestamp}")
log(f"  Python       : {sys.version.split()[0]}")
log(f"  Evaluator    : evaluator_fast.py (vectorized, math-equivalent)")
log(f"  Log file     : {LOG_FILE}")
log(f"  Output JSON  : {OUTPUT_JSON}")

from app.evaluation.mind.evaluator_fast import evaluate_mind_behavior_impression_fast as evaluate_impression

# Load news cache
log("\n[1/4] Loading news cache...")
with open(CACHE_META, "r", encoding="utf-8") as f: meta = json.load(f)
embs = np.load(CACHE_EMBS)
news_dict = {}
for idx, (nid, info) in enumerate(meta.items()):
    news_dict[nid] = {
        "news_id": nid, "category": info["category"],
        "subcategory": info.get("subcategory",""),
        "title": info.get("title",""), "abstract": info.get("abstract",""),
        "embedding": embs[idx]
    }
log(f"  Articles: {len(news_dict)} loaded.")

# Parse behaviors
log("\n[2/4] Parsing behavior data...")
all_behaviors = []
with open(BEH_TSV, "r", encoding="utf-8") as f:
    reader = csv.reader(f, delimiter="\t")
    for row in reader:
        if len(row) < 5: continue
        history_ids = row[3].strip().split() if row[3].strip() else []
        candidates, labels = [], []
        for item in row[4].strip().split():
            if "-" in item:
                nid, lbl = item.rsplit("-", 1)
                candidates.append(nid); labels.append(int(lbl))
        if candidates and labels:
            all_behaviors.append({
                "impression_id": row[0], "user_id": row[1], "timestamp": row[2],
                "history": history_ids, "candidates": candidates, "labels": labels
            })
log(f"  Behavior records: {len(all_behaviors)}")

# Group by user
user_behavior_map = {}
for b in all_behaviors:
    uid = b["user_id"]
    if uid not in user_behavior_map: user_behavior_map[uid] = []
    user_behavior_map[uid].append(b)
all_unique_users = sorted(list(user_behavior_map.keys()))

metrics_keys = ["auc", "p5", "p10", "r5", "r10", "mrr5", "mrr10", "ndcg5", "ndcg10", "ild5", "ild10"]
ref_models = ["model_a", "model_b", "model_c", "model_d"]

# Welford state for difference d = Model_E - Model_Ref
# Stats per pair (model_ref) and per metric: n, mean_d, M2_d
diff_stats = {
    mref: {m: {"n": 0, "mean": 0.0, "M2": 0.0} for m in metrics_keys}
    for mref in ref_models
}

log(f"\n[3/4] Streaming paired evaluation over {len(all_unique_users)} users...")
t_eval = time.time()
evaluated_impr = 0

for uidx, uid in enumerate(all_unique_users):
    for b in user_behavior_map[uid]:
        hist = b["history"]; cids = b["candidates"]; lbls = b["labels"]
        if not hist: continue
        h_embs = [news_dict[n]["embedding"] for n in hist if n in news_dict and "embedding" in news_dict[n]]
        c_info = [(c,l) for c,l in zip(cids,lbls) if c in news_dict and "embedding" in news_dict[c]]
        if not c_info or not h_embs: continue

        res = evaluate_impression(b, news_dict)
        if res is None: continue

        evaluated_impr += 1

        val_e = res["model_e"]
        for mref in ref_models:
            val_ref = res[mref]
            for mkey in metrics_keys:
                ve = val_e[mkey]
                vr = val_ref[mkey]
                if ve is None or vr is None: continue

                d = ve - vr
                st = diff_stats[mref][mkey]
                st["n"] += 1
                delta = d - st["mean"]
                st["mean"] += delta / st["n"]
                delta2 = d - st["mean"]
                st["M2"] += delta * delta2

    if (uidx + 1) % 10000 == 0 or (uidx + 1) == len(all_unique_users):
        elapsed = time.time() - t_eval
        pct = (uidx+1)/len(all_unique_users)*100
        log(f"  [{uidx+1:>5}/{len(all_unique_users)}] {pct:5.1f}%  impr={evaluated_impr:>7}  elapsed={elapsed/60:.1f}min")

log(f"\n  Paired evaluation complete: {evaluated_impr} impressions processed.")

# ============================================================
# COMPUTE STATISTICAL SIGNIFICANCE & CONFIDENCE INTERVALS
# ============================================================
log("\n[4/4] Computing paired t-tests, standard errors, 95% CIs, p-values, and effect sizes...")

final_statistical_results = {}

for mref in ref_models:
    ref_name = {
        "model_a": "Model A (Baseline Mean)",
        "model_b": "Model B (Long+Short Split)",
        "model_c": "Model C (Softmax Attention)",
        "model_d": "Model D (Context Fusion)"
    }[mref]

    final_statistical_results[mref] = {}

    log("=" * 72)
    log(f"  STATISTICAL SIGNIFICANCE: MODEL E vs {ref_name.upper()}")
    log("=" * 72)
    hdr = f"{'Metric':<10} | {'Mean Diff':>10} | {'SE Diff':>9} | {'t-stat':>9} | {'p-value':>12} | {'95% CI':>21} | {'Cohen d_z':>9} | {'Significance':>14}"
    log(hdr)
    log("-" * 110)

    for mkey in metrics_keys:
        st = diff_stats[mref][mkey]
        n = st["n"]
        mean_d = st["mean"]
        m2_d = st["M2"]

        if n > 1:
            var_d = m2_d / (n - 1)
            std_d = math.sqrt(max(0.0, var_d))
            se_d = std_d / math.sqrt(n)
            t_stat = mean_d / se_d if se_d > 0 else 0.0
            p_val = 2.0 * (1.0 - stats.norm.cdf(abs(t_stat)))
            ci_lower = mean_d - 1.96 * se_d
            ci_upper = mean_d + 1.96 * se_d
            cohen_d = mean_d / std_d if std_d > 0 else 0.0
        else:
            std_d = se_d = t_stat = p_val = ci_lower = ci_upper = cohen_d = 0.0

        if p_val < 0.001: sig = "p < 0.001 (***)"
        elif p_val < 0.01: sig = "p < 0.01  (**)"
        elif p_val < 0.05: sig = "p < 0.05  (*)"
        else:               sig = "Not Sig. (n.s.)"

        ci_str = f"[{ci_lower:+.4f}, {ci_upper:+.4f}]"

        log(f"{mkey.upper():<10} | {mean_d:>+10.6f} | {se_d:>9.6f} | {t_stat:>+9.3f} | {p_val:>12.4e} | {ci_str:>21} | {cohen_d:>+9.4f} | {sig:>14}")

        final_statistical_results[mref][mkey] = {
            "n": n,
            "mean_diff": mean_d,
            "std_diff": std_d,
            "se_diff": se_d,
            "t_statistic": t_stat,
            "p_value": p_val,
            "ci_95_lower": ci_lower,
            "ci_95_upper": ci_upper,
            "cohens_d_z": cohen_d,
            "significance_label": sig
        }

    log("-" * 110 + "\n")

out_payload = {
    "timestamp": eval_timestamp,
    "evaluated_impressions": evaluated_impr,
    "statistical_results": final_statistical_results,
    "runtime_sec": time.time() - start_total
}

with open(OUTPUT_JSON, "w", encoding="utf-8") as jf:
    json.dump(out_payload, jf, indent=2)

log(f"Statistical validation complete. Output saved to:\n  {OUTPUT_JSON}")
log("=" * 72)
