"""
Cold-Start Fallback Evaluation Pipeline
=======================================
Evaluates recommendation performance under zero-history / cold-start conditions
on the canonical 500-user test cohort (1,406 impressions).

Strategies Evaluated:
  1. Random Selection Fallback (Baseline)
  2. Pure Recency Fallback (Latest news)
  3. Causal Popularity / Trending Fallback (Nexora Zero-History Fallback without diversity)
  4. Causal Popularity + Diversity Reranking (Nexora Deployed Cold-Start Fallback)

Output:
  backend/experiments/corrected_user_disjoint/cold_start/cold_start_results.json
"""
import os
import sys
import csv
import json
import time
import random
import logging
from typing import Dict, List, Tuple, Any
import numpy as np
from sklearn.metrics import roc_auc_score

# Ensure backend root is in sys.path
BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from app.evaluation.mind.split_manager import build_or_load_user_splits
from app.evaluation.mind.mind_feature_proxy import MINDCausalFeatureProxy, parse_mind_timestamp
from app.evaluation.mind.train_neural_ranker import load_news_cache
from app.evaluation.metrics import (
    precision_at_k,
    recall_at_k,
    mrr_at_k,
    ndcg_at_k,
    intra_list_diversity
)
from app.ai.diversity_service import apply_diversity_reranking

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

# Paths
DATA_DIR = os.path.join(BACKEND_DIR, "evaluation", "mind", "data")
BEH_TSV = os.path.join(DATA_DIR, "behaviors.tsv")

OUTPUT_DIR = os.path.join(BACKEND_DIR, "experiments", "corrected_user_disjoint", "cold_start")
os.makedirs(OUTPUT_DIR, exist_ok=True)


def evaluate_scored_candidates(scored_tuples, target_clicked_ids, labels):
    sorted_list = sorted(scored_tuples, key=lambda x: x[1], reverse=True)
    rec_ids = [x[0] for x in sorted_list]
    rec_embs = [x[2] for x in sorted_list]

    auc = None
    if len(set(labels)) > 1:
        try:
            score_map = {x[0]: x[1] for x in sorted_list}
            pred_scores = [score_map[cid] for cid, _, _ in scored_tuples]
            auc = float(roc_auc_score(labels, pred_scores))
        except Exception:
            auc = None

    return {
        "auc": auc,
        "mrr5": mrr_at_k(rec_ids, target_clicked_ids, 5),
        "mrr10": mrr_at_k(rec_ids, target_clicked_ids, 10),
        "ndcg5": ndcg_at_k(rec_ids, target_clicked_ids, 5),
        "ndcg10": ndcg_at_k(rec_ids, target_clicked_ids, 10),
        "p5": precision_at_k(rec_ids, target_clicked_ids, 5),
        "p10": precision_at_k(rec_ids, target_clicked_ids, 10),
        "r5": recall_at_k(rec_ids, target_clicked_ids, 5),
        "r10": recall_at_k(rec_ids, target_clicked_ids, 10),
        "ild5": intra_list_diversity(rec_embs, 5),
        "ild10": intra_list_diversity(rec_embs, 10)
    }


def run_cold_start_evaluation():
    train_u, val_u, test_u, test_500, manifest = build_or_load_user_splits()
    test_user_set = set(test_500)
    news_dict = load_news_cache()
    causal_proxy = MINDCausalFeatureProxy.build_or_load(train_users=train_u)

    test_behs = []
    with open(BEH_TSV, "r", encoding="utf-8") as f:
        reader = csv.reader(f, delimiter="\t")
        for row in reader:
            if len(row) < 5:
                continue
            impr_id, uid, time_str, hist_str, impr_str = row[0], row[1], row[2], row[3], row[4]
            if uid in test_user_set:
                impressions = []
                for item in impr_str.strip().split():
                    parts = item.split("-")
                    if len(parts) == 2:
                        impressions.append((parts[0], int(parts[1])))
                test_behs.append({
                    "impression_id": impr_id,
                    "user_id": uid,
                    "time": time_str,
                    "history": hist_str.strip().split() if hist_str.strip() else [],
                    "impressions": impressions
                })

    logger.info(f"Loaded {len(test_behs)} test impressions for Cold-Start evaluation.")

    strategies = ["random", "pure_recency", "popularity_trending", "popularity_diversity_fallback"]
    results_by_strat = {s: [] for s in strategies}

    random.seed(42)
    np.random.seed(42)

    for beh in test_behs:
        impr_dt = parse_mind_timestamp(beh["time"])
        valid_cands = [c for c in beh["impressions"] if c[0] in news_dict]
        if not valid_cands:
            continue

        cand_ids = [c[0] for c in valid_cands]
        labels = [c[1] for c in valid_cands]
        target_clicked_ids = [c[0] for c in valid_cands if c[1] == 1]

        # 1. Random Baseline
        rnd_scores = np.random.uniform(0.0, 1.0, size=len(cand_ids))
        scored_rnd = [(cid, float(s), news_dict[cid]["embedding"]) for cid, s in zip(cand_ids, rnd_scores)]
        results_by_strat["random"].append(evaluate_scored_candidates(scored_rnd, target_clicked_ids, labels))

        # 2. Pure Recency Fallback
        rec_scores = [causal_proxy.calculate_recency_score(cid, impr_dt) for cid in cand_ids]
        scored_rec = [(cid, float(s), news_dict[cid]["embedding"]) for cid, s in zip(cand_ids, rec_scores)]
        results_by_strat["pure_recency"].append(evaluate_scored_candidates(scored_rec, target_clicked_ids, labels))

        # 3. Popularity / Trending Fallback (No Diversity)
        pop_scores = [causal_proxy.calculate_popularity_score(cid) for cid in cand_ids]
        combined_trending = [p * 0.8 + r * 0.2 for p, r in zip(pop_scores, rec_scores)]
        scored_pop = [(cid, float(s), news_dict[cid]["embedding"]) for cid, s in zip(cand_ids, combined_trending)]
        results_by_strat["popularity_trending"].append(evaluate_scored_candidates(scored_pop, target_clicked_ids, labels))

        # 4. Popularity / Trending + Eq.14 Diversity Reranking (Deployed Fallback)
        cand_objs = []
        for cid, score in zip(cand_ids, combined_trending):
            cand_objs.append({
                "news_id": cid,
                "category": news_dict[cid]["category"],
                "hybrid_score": float(score)
            })
        reranked_objs = apply_diversity_reranking(cand_objs, top_k=10, diversity_lambda=0.10)
        id_to_score = {item["news_id"]: item["hybrid_score"] for item in reranked_objs}
        scored_div = [(cid, float(id_to_score.get(cid, -1.0)), news_dict[cid]["embedding"]) for cid in cand_ids]
        results_by_strat["popularity_diversity_fallback"].append(evaluate_scored_candidates(scored_div, target_clicked_ids, labels))

    summary = {
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%S"),
        "experiment": "Cold-Start Zero-History Fallback Evaluation",
        "cohort_size": len(test_behs),
        "strategies": {}
    }

    for strat, metric_list in results_by_strat.items():
        valid_aucs = [m["auc"] for m in metric_list if m["auc"] is not None]
        summary["strategies"][strat] = {
            "auc": round(float(np.mean(valid_aucs)), 4),
            "mrr5": round(float(np.mean([m["mrr5"] for m in metric_list])), 4),
            "mrr10": round(float(np.mean([m["mrr10"] for m in metric_list])), 4),
            "ndcg5": round(float(np.mean([m["ndcg5"] for m in metric_list])), 4),
            "ndcg10": round(float(np.mean([m["ndcg10"] for m in metric_list])), 4),
            "p5": round(float(np.mean([m["p5"] for m in metric_list])), 4),
            "p10": round(float(np.mean([m["p10"] for m in metric_list])), 4),
            "r5": round(float(np.mean([m["r5"] for m in metric_list])), 4),
            "r10": round(float(np.mean([m["r10"] for m in metric_list])), 4),
            "ild5": round(float(np.mean([m["ild5"] for m in metric_list])), 4),
            "ild10": round(float(np.mean([m["ild10"] for m in metric_list])), 4),
        }

    out_file = os.path.join(OUTPUT_DIR, "cold_start_results.json")
    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(summary, f, indent=2)

    logger.info(f"Cold-Start evaluation complete. Saved to {out_file}")
    logger.info(f"Summary: {json.dumps(summary['strategies'], indent=2)}")


if __name__ == "__main__":
    run_cold_start_evaluation()
