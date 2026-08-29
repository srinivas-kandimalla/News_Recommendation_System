"""
NEXORA PHASE 3 — CANDIDATE PRE-FILTERING EXPERIMENTATION SCRIPT
================================================================
Benchmarks Candidate Pre-Filtering thresholds N=50, N=100, N=200 against
the full candidate pool (N=0) to measure recommendation quality (AUC, MRR@10, NDCG@10, ILD@10)
and end-to-end REST API request latency.
"""
import os
import sys
import json
import time
import datetime
import numpy as np

BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from app import create_app
from app.config.config import Config
from app.models.user_model import users_collection
from app.models.news_model import news_collection
from app.models.reading_history_model import reading_history_collection
from app.utils.jwt_helper import generate_token
from app.ai.neural_ranker import neural_ranker_service
from app.evaluation.mind.evaluator_fast import evaluate_mind_behavior_impression_fast

CACHE_META = os.path.join(BACKEND_DIR, "evaluation", "mind", "cache", "news_meta.json")
CACHE_EMBS = os.path.join(BACKEND_DIR, "evaluation", "mind", "cache", "news_embs.npy")
BEH_TSV = os.path.join(BACKEND_DIR, "evaluation", "mind", "data", "behaviors.tsv")
OUTPUT_JSON = os.path.join(BACKEND_DIR, "evaluation", "mind", "prefilter_experiment_results.json")


def load_news_cache():
    with open(CACHE_META, "r", encoding="utf-8") as f:
        meta = json.load(f)
    embs = np.load(CACHE_EMBS)
    news_dict = {}
    for idx, (nid, info) in enumerate(meta.items()):
        news_dict[nid] = {
            "news_id": nid,
            "category": info.get("category", ""),
            "subcategory": info.get("subcategory", ""),
            "title": info.get("title", ""),
            "abstract": info.get("abstract", ""),
            "embedding": embs[idx]
        }
    return news_dict


def run_prefilter_benchmark():
    print("=" * 75)
    print("  NEXORA PHASE 3 — CANDIDATE PRE-FILTERING EXPERIMENTS (N=50, 100, 200, 0)")
    print("=" * 75)

    Config.USE_NEURAL_RANKER = True
    assert neural_ranker_service.is_ready(), "Neural ranker is not ready!"

    news_dict = load_news_cache()

    # Load 200 behaviors from disjoint set for offline metric quality check
    import csv
    user_behavior_map = {}
    with open(BEH_TSV, "r", encoding="utf-8") as f:
        reader = csv.reader(f, delimiter="\t")
        for row in reader:
            if len(row) < 5:
                continue
            history_ids = row[3].strip().split() if row[3].strip() else []
            candidates, labels = [], []
            for item in row[4].strip().split():
                if "-" in item:
                    nid, lbl = item.rsplit("-", 1)
                    candidates.append(nid)
                    labels.append(int(lbl))
            if candidates and labels and history_ids:
                uid = row[1]
                if uid not in user_behavior_map:
                    user_behavior_map[uid] = []
                user_behavior_map[uid].append({
                    "impression_id": row[0],
                    "user_id": uid,
                    "timestamp": row[2],
                    "history": history_ids,
                    "candidates": candidates,
                    "labels": labels
                })

    all_users = sorted(list(user_behavior_map.keys()))
    disjoint_users = all_users[10000:10200]

    prefilter_options = [0, 50, 100, 200]
    results = {}

    for n_val in prefilter_options:
        Config.CANDIDATE_PREFILTER_TOP_N = n_val
        print(f"\nEvaluating Candidate Pre-Filter N = {n_val} (0 = Disabled)...")

        m_f_list = []
        t0 = time.time()
        for uid in disjoint_users:
            for b in user_behavior_map[uid]:
                res = evaluate_mind_behavior_impression_fast(b, news_dict)
                if res:
                    m_f_list.append(res["model_f"])
        elapsed = time.time() - t0

        def avg(m_list, key):
            return float(np.mean([m[key] for m in m_list if m[key] is not None]))

        auc_v = avg(m_f_list, "auc")
        mrr10_v = avg(m_f_list, "mrr10")
        ndcg10_v = avg(m_f_list, "ndcg10")
        ild10_v = avg(m_f_list, "ild10")

        print(f"  N={n_val:<3} | Impressions={len(m_f_list)} | Elapsed={elapsed:.2f}s | AUC={auc_v:.4f} | MRR@10={mrr10_v:.4f} | NDCG@10={ndcg10_v:.4f} | ILD@10={ild10_v:.4f}")

        results[f"prefilter_N_{n_val}"] = {
            "top_n": n_val,
            "evaluated_impressions": len(m_f_list),
            "offline_evaluation_time_sec": round(elapsed, 2),
            "auc": round(auc_v, 4),
            "mrr10": round(mrr10_v, 4),
            "ndcg10": round(ndcg10_v, 4),
            "ild10": round(ild10_v, 4)
        }

    # Reset default to 0 (Disabled)
    Config.CANDIDATE_PREFILTER_TOP_N = 0

    with open(OUTPUT_JSON, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2)
    print(f"\nSaved pre-filter experiment payload to {OUTPUT_JSON}")

    return results


if __name__ == "__main__":
    run_prefilter_benchmark()
