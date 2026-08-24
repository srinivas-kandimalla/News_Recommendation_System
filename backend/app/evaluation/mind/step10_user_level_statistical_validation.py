"""
NEXORA STEP 10: COMPREHENSIVE STATISTICAL AUDIT & USER-LEVEL VALIDATION
========================================================================
1. Computes User-Level Paired Statistical Analysis (N = 48,295 users).
2. Applies Holm-Bonferroni Multiple Comparison Correction (K=11 per pair, K=44 overall) for both Impression-Level and User-Level analyses.
3. Computes exact Confidence Intervals, Standard Errors, t-statistics, p-values, and Cohen's d_z.
4. Generates step10_statistical_audit.json.
"""
import os, sys, csv, json, time, math, datetime, numpy as np
import scipy.stats as stats

LOG_FILE    = "D:/News_Recommendation_System/backend/evaluation/mind/step10_run.log"
OUTPUT_JSON = "D:/News_Recommendation_System/backend/evaluation/mind/step10_statistical_audit.json"
STEP8D_JSON = "D:/News_Recommendation_System/backend/evaluation/mind/step8d_full_results.json"
STEP9_JSON  = "D:/News_Recommendation_System/backend/evaluation/mind/step9_statistical_results.json"
DATA_DIR    = "D:/News_Recommendation_System/backend/evaluation/mind/data"
CACHE_DIR   = "D:/News_Recommendation_System/backend/evaluation/mind/cache"
CACHE_META  = CACHE_DIR + "/news_meta.json"
CACHE_EMBS  = CACHE_DIR + "/news_embs.npy"
BEH_TSV     = DATA_DIR  + "/behaviors.tsv"

open(LOG_FILE, "w").close()

def log(msg=""):
    print(msg, flush=True)
    with open(LOG_FILE, "a", encoding="utf-8") as f:
        f.write(msg + "\n"); f.flush()

start_total = time.time()
eval_timestamp = datetime.datetime.now().isoformat()

log("=" * 75)
log("  NEXORA STEP 10: STATISTICAL AUDIT & USER-LEVEL VALIDATION")
log("=" * 75)
log(f"  Timestamp    : {eval_timestamp}")
log(f"  Python       : {sys.version.split()[0]}")

from app.evaluation.mind.evaluator_fast import evaluate_mind_behavior_impression_fast as evaluate_impression

# ------------------------------------------------------------
# 1. LOAD STEP 8D & STEP 9 RESULTS
# ------------------------------------------------------------
log("\n[1/5] Loading Step 8D and Step 9 result files...")
with open(STEP8D_JSON, "r", encoding="utf-8") as f:
    step8d_data = json.load(f)
with open(STEP9_JSON, "r", encoding="utf-8") as f:
    step9_data = json.load(f)

# ------------------------------------------------------------
# 2. LOAD NEWS CACHE & BEHAVIORS
# ------------------------------------------------------------
log("\n[2/5] Loading news cache and parsing behaviors...")
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

user_behavior_map = {}
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
            uid = row[1]
            if uid not in user_behavior_map: user_behavior_map[uid] = []
            user_behavior_map[uid].append({
                "impression_id": row[0], "user_id": uid, "timestamp": row[2],
                "history": history_ids, "candidates": candidates, "labels": labels
            })

all_unique_users = sorted(list(user_behavior_map.keys()))
log(f"  Total unique users: {len(all_unique_users)}")

# ------------------------------------------------------------
# 3. USER-LEVEL AGGREGATION & PAIRED DIFFERENCE CALCULATION
# ------------------------------------------------------------
log("\n[3/5] Computing User-Level Paired Analysis across users...")

metrics_keys = ["auc", "p5", "p10", "r5", "r10", "mrr5", "mrr10", "ndcg5", "ndcg10", "ild5", "ild10"]
ref_models   = ["model_a", "model_b", "model_c", "model_d"]

# Welford state for User-level differences (N = number of evaluated users)
user_diff_stats = {
    mref: {m: {"n": 0, "mean": 0.0, "M2": 0.0} for m in metrics_keys}
    for mref in ref_models
}

evaluated_users_count = 0
total_impr_count = 0

t_eval = time.time()

for uidx, uid in enumerate(all_unique_users):
    u_b_list = user_behavior_map[uid]
    
    # Collect impression metric dicts for this user
    user_model_results = {mkey: [] for mkey in ["model_a", "model_b", "model_c", "model_d", "model_e"]}
    
    for b in u_b_list:
        hist = b["history"]; cids = b["candidates"]; lbls = b["labels"]
        if not hist: continue
        h_embs = [news_dict[n]["embedding"] for n in hist if n in news_dict and "embedding" in news_dict[n]]
        c_info = [(c,l) for c,l in zip(cids,lbls) if c in news_dict and "embedding" in news_dict[c]]
        if not c_info or not h_embs: continue

        res = evaluate_impression(b, news_dict)
        if res is None: continue

        total_impr_count += 1
        for mkey in user_model_results:
            user_model_results[mkey].append(res[mkey])

    # Check if user has at least 1 evaluated impression
    if user_model_results["model_e"]:
        evaluated_users_count += 1
        
        # Compute user's mean score per metric for each model
        user_means = {}
        for mk in user_model_results:
            user_means[mk] = {}
            for met in metrics_keys:
                vals = [v[met] for v in user_model_results[mk] if v[met] is not None]
                user_means[mk][met] = float(np.mean(vals)) if vals else None

        # Accumulate Welford paired differences per user
        val_e = user_means["model_e"]
        for mref in ref_models:
            val_ref = user_means[mref]
            for met in metrics_keys:
                ve = val_e[met]
                vr = val_ref[met]
                if ve is None or vr is None: continue

                d = ve - vr
                st = user_diff_stats[mref][met]
                st["n"] += 1
                delta = d - st["mean"]
                st["mean"] += delta / st["n"]
                delta2 = d - st["mean"]
                st["M2"] += delta * delta2

    if (uidx + 1) % 10000 == 0 or (uidx + 1) == len(all_unique_users):
        elapsed = time.time() - t_eval
        pct = (uidx+1)/len(all_unique_users)*100
        log(f"  [{uidx+1:>5}/{len(all_unique_users)}] {pct:5.1f}%  evaluated_users={evaluated_users_count:>5}  elapsed={elapsed/60:.1f}min")

log(f"\n  User-level evaluation complete: {evaluated_users_count} users evaluated ({total_impr_count} impressions).")

# ------------------------------------------------------------
# 4. HOLM-BONFERRONI CORRECTION FUNCTION
# ------------------------------------------------------------
def apply_holm_bonferroni(p_values_dict):
    """
    p_values_dict: {(mref, mkey): raw_p}
    returns: {(mref, mkey): (adj_p, sig_label)}
    """
    sorted_items = sorted(p_values_dict.items(), key=lambda x: x[1])
    K = len(sorted_items)
    
    adjusted_p = {}
    cum_max = 0.0
    
    for rank_idx, (key, raw_p) in enumerate(sorted_items):
        multiplier = K - rank_idx
        adj_p = min(1.0, raw_p * multiplier)
        adj_p = max(cum_max, adj_p)  # monotonicity enforce
        cum_max = adj_p
        adjusted_p[key] = adj_p
        
    return adjusted_p

# ------------------------------------------------------------
# 5. PROCESS IMPRESSION-LEVEL & USER-LEVEL STATISTICS
# ------------------------------------------------------------
log("\n[4/5] Computing t-statistics, p-values, 95% CIs, Cohen's d_z, and Holm-Bonferroni corrections...")

def compute_stat_dict(n, mean_d, M2_d):
    if n > 1:
        var_d = M2_d / (n - 1)
        std_d = math.sqrt(max(0.0, var_d))
        se_d = std_d / math.sqrt(n)
        t_stat = mean_d / se_d if se_d > 0 else 0.0
        p_val = 2.0 * (1.0 - stats.norm.cdf(abs(t_stat)))
        ci_lower = mean_d - 1.96 * se_d
        ci_upper = mean_d + 1.96 * se_d
        cohen_d = mean_d / std_d if std_d > 0 else 0.0
    else:
        std_d = se_d = t_stat = p_val = ci_lower = ci_upper = cohen_d = 0.0
    return {
        "n": n, "mean_diff": mean_d, "std_diff": std_d, "se_diff": se_d,
        "t_statistic": t_stat, "raw_p_value": p_val,
        "ci_95_lower": ci_lower, "ci_95_upper": ci_upper, "cohens_d_z": cohen_d
    }

# Compute raw stats for User-level
user_level_results = {}
for mref in ref_models:
    user_level_results[mref] = {}
    for mkey in metrics_keys:
        st = user_diff_stats[mref][mkey]
        user_level_results[mref][mkey] = compute_stat_dict(st["n"], st["mean"], st["M2"])

# Impression-level raw stats from Step 9 JSON
impr_level_results = step9_data["statistical_results"]

# Apply Holm-Bonferroni per pair (K=11) and overall (K=44)
for level_name, res_dict in [("impression_level", impr_level_results), ("user_level", user_level_results)]:
    # 1. Per-model-pair Holm-Bonferroni (K=11)
    for mref in ref_models:
        pair_p_dict = {mkey: (res_dict[mref][mkey]["raw_p_value"] if "raw_p_value" in res_dict[mref][mkey] else res_dict[mref][mkey]["p_value"]) for mkey in metrics_keys}
        sorted_pair = sorted(pair_p_dict.items(), key=lambda x: x[1])
        K_pair = len(sorted_pair)
        cum_max = 0.0
        for rank_idx, (mkey, raw_p) in enumerate(sorted_pair):
            adj_p = min(1.0, raw_p * (K_pair - rank_idx))
            adj_p = max(cum_max, adj_p)
            cum_max = adj_p
            res_dict[mref][mkey]["hb_adj_p_pair"] = adj_p

    # 2. Overall Holm-Bonferroni across all 44 tests (K=44)
    all_p_dict = {}
    for mref in ref_models:
        for mkey in metrics_keys:
            raw_p = res_dict[mref][mkey]["raw_p_value"] if "raw_p_value" in res_dict[mref][mkey] else res_dict[mref][mkey]["p_value"]
            all_p_dict[(mref, mkey)] = raw_p
    
    sorted_all = sorted(all_p_dict.items(), key=lambda x: x[1])
    K_all = len(sorted_all)
    cum_max = 0.0
    for rank_idx, ((mref, mkey), raw_p) in enumerate(sorted_all):
        adj_p = min(1.0, raw_p * (K_all - rank_idx))
        adj_p = max(cum_max, adj_p)
        cum_max = adj_p
        res_dict[mref][mkey]["hb_adj_p_overall"] = adj_p
        
        # Add labels
        p_eval = adj_p
        if p_eval < 0.001: sig_lbl = "p < 0.001 (***)"
        elif p_eval < 0.01: sig_lbl = "p < 0.01  (**)"
        elif p_eval < 0.05: sig_lbl = "p < 0.05  (*)"
        else:               sig_lbl = "Not Sig. (n.s.)"
        res_dict[mref][mkey]["corrected_significance_label"] = sig_lbl

# ------------------------------------------------------------
# 6. SAVE COMPLETE AUDIT JSON
# ------------------------------------------------------------
log("\n[5/5] Saving final paper-ready step10_statistical_audit.json...")

audit_payload = {
    "timestamp": eval_timestamp,
    "audit_metadata": {
        "total_unique_users": len(all_unique_users),
        "evaluated_users": evaluated_users_count,
        "evaluated_impressions": total_impr_count,
        "models_evaluated": ["MODEL A", "MODEL B", "MODEL C", "MODEL D", "MODEL E"],
        "metrics_evaluated": metrics_keys,
        "multiple_testing_correction": "Holm-Bonferroni (K=11 per model pair, K=44 overall)"
    },
    "step8d_mean_results": step8d_data["mean_results"],
    "impression_level_statistical_audit": impr_level_results,
    "user_level_statistical_audit": user_level_results,
    "runtime_sec": time.time() - start_total
}

with open(OUTPUT_JSON, "w", encoding="utf-8") as jf:
    json.dump(audit_payload, jf, indent=2)

log(f"\nStep 10 Audit successfully completed. Output saved to:\n  {OUTPUT_JSON}")
log("=" * 75)
