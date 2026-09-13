"""
NEXORA CANONICAL BENCHMARK: MODEL E VS MODEL F (CORRECTED USER-DISJOINT SPLIT)
==============================================================================
Runs authoritative evaluation of Model E (Heuristic Baseline) vs Model F (Neural Ranker)
strictly on the 500 disjoint test users (1,432 impressions) from split_manifest.json.

Key Guarantees:
  - Zero user overlap with training/validation sets (asserted).
  - Causal feature extraction using MINDCausalFeatureProxy.
  - Full metrics family: AUC, MRR@5/10, NDCG@5/10, P@5/10, R@5/10, ILD@5/10.
  - Paired statistical tests: t-test, Wilcoxon signed-rank, Cohen's d.
  - Rank overlap & correlation: Top-1/5/10 agreement, Spearman rho.
  - Output artifact: backend/experiments/corrected_user_disjoint/model_f/main_benchmark_results.json
"""
import os
import sys
import csv
import json
import time
import math
import logging
from datetime import datetime
from typing import Dict, List, Any
import numpy as np
from scipy import stats

BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from app.evaluation.mind.split_manager import build_or_load_user_splits
from app.evaluation.mind.mind_feature_proxy import MINDCausalFeatureProxy, parse_mind_timestamp
from app.evaluation.mind.train_neural_ranker import load_news_cache
from app.evaluation.mind.evaluator_fast import evaluate_mind_behavior_impression_fast

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

DATA_DIR = os.path.join(BACKEND_DIR, "evaluation", "mind", "data")
BEH_TSV = os.path.join(DATA_DIR, "behaviors.tsv")
OUT_DIR = os.path.join(BACKEND_DIR, "experiments", "corrected_user_disjoint", "model_f")
OUT_FILE = os.path.join(OUT_DIR, "main_benchmark_results.json")


def run_benchmark(max_users: int = 500) -> Dict[str, Any]:
    os.makedirs(OUT_DIR, exist_ok=True)
    
    # 1. Load split and assert zero overlap
    train_u, val_u, test_u, test_500, manifest = build_or_load_user_splits()
    assert len(train_u & val_u) == 0, "Train & Val overlap!"
    assert len(train_u & test_u) == 0, "Train & Test overlap!"
    assert len(val_u & test_u) == 0, "Val & Test overlap!"
    
    test_user_set = set(test_500[:max_users])
    logger.info(f"Loaded test cohort: {len(test_user_set)} users (asserted zero-overlap).")

    news_dict = load_news_cache()
    proxy = MINDCausalFeatureProxy.build_or_load(train_users=train_u)

    # 2. Extract impressions for test cohort
    test_impressions = []
    with open(BEH_TSV, "r", encoding="utf-8") as f:
        reader = csv.reader(f, delimiter="\t")
        for row in reader:
            if len(row) < 5:
                continue
            user_id = row[1].strip()
            if user_id in test_user_set:
                history_ids = row[3].strip().split() if row[3].strip() else []
                cands_raw = row[4].strip().split() if row[4].strip() else []
                if not history_ids or not cands_raw:
                    continue
                
                cands, labels = [], []
                for item in cands_raw:
                    if "-" in item:
                        nid, lbl = item.rsplit("-", 1)
                        cands.append(nid)
                        labels.append(int(lbl))
                
                if cands and labels:
                    test_impressions.append({
                        "impression_id": row[0].strip(),
                        "user_id": user_id,
                        "timestamp": row[2].strip(),
                        "history": history_ids,
                        "candidates": cands,
                        "labels": labels
                    })

    logger.info(f"Extracted {len(test_impressions)} impressions across {len(test_user_set)} test users.")

    # 3. Evaluate impressions
    model_e_results = []
    model_f_results = []
    e_tuples_list = []
    f_tuples_list = []
    
    start_time = time.time()
    for idx, beh in enumerate(test_impressions):
        res = evaluate_mind_behavior_impression_fast(beh, news_dict, k=10)
        if res is None:
            continue
        model_e_results.append(res["model_e"])
        model_f_results.append(res["model_f"])
        e_tuples_list.append(res["model_e_tuples"])
        f_tuples_list.append(res["model_f_tuples"])

    elapsed = time.time() - start_time
    n_eval = len(model_e_results)
    logger.info(f"Evaluated {n_eval} impressions in {elapsed:.2f}s ({n_eval/elapsed:.2f} imp/s).")

    # 4. Metric aggregation
    metric_keys = ["auc", "mrr5", "mrr10", "ndcg5", "ndcg10", "p5", "p10", "r5", "r10", "ild5", "ild10"]
    summary_table = {}

    for k in metric_keys:
        # Filter None values (for AUC when all candidates negative)
        e_vals = [r[k] for r in model_e_results if r[k] is not None]
        f_vals = [r[k] for r in model_f_results if r[k] is not None]

        # For paired tests, filter to pairwise valid entries
        paired_e, paired_f = [], []
        for r_e, r_f in zip(model_e_results, model_f_results):
            if r_e[k] is not None and r_f[k] is not None:
                paired_e.append(r_e[k])
                paired_f.append(r_f[k])

        mean_e = float(np.mean(e_vals)) if e_vals else 0.0
        mean_f = float(np.mean(f_vals)) if f_vals else 0.0
        abs_diff = mean_f - mean_e
        rel_gain = (abs_diff / mean_e * 100.0) if mean_e > 0 else 0.0

        p_t, p_wilcox, cohen_d = 1.0, 1.0, 0.0
        if len(paired_e) > 1:
            diffs = np.array(paired_f) - np.array(paired_e)
            t_stat, p_t = stats.ttest_rel(paired_f, paired_e)
            try:
                w_stat, p_wilcox = stats.wilcoxon(paired_f, paired_e)
            except Exception:
                p_wilcox = 1.0
            std_diff = np.std(diffs, ddof=1)
            cohen_d = (np.mean(diffs) / std_diff) if std_diff > 0 else 0.0

        summary_table[k] = {
            "model_e": round(mean_e, 4),
            "model_f": round(mean_f, 4),
            "abs_diff": round(abs_diff, 4),
            "rel_gain_pct": round(rel_gain, 2),
            "p_paired_ttest": float(p_t),
            "p_wilcoxon": float(p_wilcox),
            "cohens_d": round(float(cohen_d), 4),
            "statistically_significant": bool(p_t < 0.05)
        }

    # 5. Rank Correlation & Overlap Analysis
    top1_matches = 0
    top5_overlaps = []
    top10_overlaps = []
    spearman_corrs = []

    for e_tups, f_tups in zip(e_tuples_list, f_tuples_list):
        e_ids = [t[0] for t in e_tups]
        f_ids = [t[0] for t in f_tups]
        if not e_ids or not f_ids:
            continue
        if e_ids[0] == f_ids[0]:
            top1_matches += 1
        top5_overlaps.append(len(set(e_ids[:5]) & set(f_ids[:5])) / 5.0)
        top10_overlaps.append(len(set(e_ids[:10]) & set(f_ids[:10])) / 10.0)

        # Spearman correlation across common candidates
        e_score_map = {t[0]: i for i, t in enumerate(e_tups)}
        f_score_map = {t[0]: i for i, t in enumerate(f_tups)}
        common_ids = [cid for cid in e_ids if cid in f_score_map]
        if len(common_ids) >= 3:
            e_ranks = [e_score_map[cid] for cid in common_ids]
            f_ranks = [f_score_map[cid] for cid in common_ids]
            rho, _ = stats.spearmanr(e_ranks, f_ranks)
            if not np.isnan(rho):
                spearman_corrs.append(rho)

    ranking_behavior = {
        "top_1_agreement_pct": round((top1_matches / n_eval) * 100.0, 2),
        "mean_top_5_overlap_pct": round(float(np.mean(top5_overlaps)) * 100.0, 2),
        "mean_top_10_overlap_pct": round(float(np.mean(top10_overlaps)) * 100.0, 2),
        "mean_spearman_rank_correlation": round(float(np.mean(spearman_corrs)), 4)
    }

    final_payload = {
        "timestamp": datetime.now().isoformat(),
        "benchmark_name": "Authoritative Model E vs Model F Evaluation",
        "split_policy": "Hash-Partitioned User-Disjoint Split (seed=42)",
        "feature_schema_version": "v2.1-log-popularity",
        "dataset": "MIND-small (behaviors.tsv)",
        "cohort_summary": {
            "test_users_count": len(test_user_set),
            "evaluated_impressions": n_eval,
            "elapsed_seconds": round(elapsed, 2),
            "throughput_imp_per_sec": round(n_eval / elapsed, 2)
        },
        "main_results_table_ii": summary_table,
        "ranking_behavior_analysis": ranking_behavior
    }

    with open(OUT_FILE, "w", encoding="utf-8") as f:
        json.dump(final_payload, f, indent=2)

    logger.info(f"Saved canonical benchmark results to {OUT_FILE}")
    return final_payload


if __name__ == "__main__":
    payload = run_benchmark(max_users=500)
    print("\n=================== AUTHORITATIVE TABLE II RESULTS ===================")
    print(f"{'Metric':12s} | {'Model E':8s} | {'Model F':8s} | {'Rel Gain':9s} | {'p-value (t-test)':18s} | {'Cohen d':8s}")
    print("-" * 75)
    for m, d in payload["main_results_table_ii"].items():
        print(f"{m:12s} | {d['model_e']:8.4f} | {d['model_f']:8.4f} | {d['rel_gain_pct']:+8.2f}% | {d['p_paired_ttest']:18.4e} | {d['cohens_d']:8.4f}")
    print("\nRanking Overlap & Correlation:")
    for k, v in payload["ranking_behavior_analysis"].items():
        print(f"  {k}: {v}")
