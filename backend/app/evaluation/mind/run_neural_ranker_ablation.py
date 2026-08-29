"""
NEXORA PHASE 1 — NEURAL RANKER ABLATION & EVALUATION BENCHMARK
================================================================
Evaluates Experiments 1-4 on MIND behavior impression test set:

  - Experiment 1: Baseline Heuristic Ranker (Model E)
  - Experiment 2: Full Neural Ranker + Context + Diversity (Model F)
  - Experiment 3: Neural Ranker WITHOUT Context Features
  - Experiment 4: Neural Ranker WITHOUT Diversity Reranking
"""
import os
import sys
import csv
import json
import time
import datetime
import logging
import numpy as np

BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from app.config.config import Config
from app.evaluation.mind.evaluator_fast import evaluate_mind_behavior_impression_fast
from app.ai.feature_extractor import extract_candidate_features
from app.ai.neural_ranker import neural_ranker_service
from app.evaluation.metrics import (
    precision_at_k, recall_at_k, mrr_at_k, ndcg_at_k, intra_list_diversity
)

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

CACHE_META = os.path.join(BACKEND_DIR, "evaluation", "mind", "cache", "news_meta.json")
CACHE_EMBS = os.path.join(BACKEND_DIR, "evaluation", "mind", "cache", "news_embs.npy")
BEH_TSV = os.path.join(BACKEND_DIR, "evaluation", "mind", "data", "behaviors.tsv")
OUTPUT_FILE = os.path.join(BACKEND_DIR, "evaluation", "mind", "neural_ranker_ablation_results.json")


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


def run_ablation_benchmark(max_users=500, seed=42):
    logger.info("=" * 60)
    logger.info("  NEXORA PHASE 1 — NEURAL RANKER ABLATION BENCHMARK")
    logger.info("=" * 60)
    
    news_dict = load_news_cache()
    
    all_behaviors = []
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
            if candidates and labels:
                all_behaviors.append({
                    "impression_id": row[0],
                    "user_id": row[1],
                    "timestamp": row[2],
                    "history": history_ids,
                    "candidates": candidates,
                    "labels": labels
                })
                
    # Select test users
    user_behavior_map = {}
    for b in all_behaviors:
        uid = b["user_id"]
        if uid not in user_behavior_map:
            user_behavior_map[uid] = []
        user_behavior_map[uid].append(b)
        
    unique_users = sorted(list(user_behavior_map.keys()))
    np.random.seed(seed)
    test_users = unique_users[:max_users]
    
    logger.info(f"Loaded {len(all_behaviors)} behaviors across {len(unique_users)} users. Testing {len(test_users)} users...")
    
    metrics_exp1 = []  # Baseline Model E (Heuristic)
    metrics_exp2 = []  # Neural Ranker + Context + Diversity (Model F)
    metrics_exp3 = []  # Neural Ranker WITHOUT Context Features
    metrics_exp4 = []  # Neural Ranker WITHOUT Diversity Reranking
    
    t0 = time.time()
    evaluated_imprs = 0
    
    for uid in test_users:
        for b in user_behavior_map[uid]:
            res = evaluate_mind_behavior_impression_fast(b, news_dict)
            if not res:
                continue
                
            evaluated_imprs += 1
            metrics_exp1.append(res["model_e"])
            metrics_exp2.append(res["model_f"])
            
            # --- Exp 3: Neural Ranker WITHOUT Context Features ---
            history_ids = b["history"]
            candidate_ids = b["candidates"]
            labels = b["labels"]
            
            history_embs = [news_dict[nid]["embedding"] for nid in history_ids if nid in news_dict and "embedding" in news_dict[nid]]
            cand_info = [
                {"id": cid, "embedding": news_dict[cid]["embedding"], "category": news_dict[cid].get("category", ""), "label": lbl}
                for cid, lbl in zip(candidate_ids, labels)
                if cid in news_dict and "embedding" in news_dict[cid]
            ]
            
            if not cand_info or not history_embs:
                continue
                
            target_clicked_ids = [c["id"] for c in cand_info if c["label"] == 1]
            cand_labels = [c["label"] for c in cand_info]
            
            # Compute profiles
            long_h = history_embs[-50:]
            short_h = history_embs[-5:]
            
            # Vectorized profiles
            from app.evaluation.mind.evaluator_fast import _vectorized_attention_profile, _l2_normalize_rows
            C_embs = np.array([c["embedding"] for c in cand_info])
            long_att = _vectorized_attention_profile(np.array(long_h), C_embs, 0.1)
            short_att = _vectorized_attention_profile(np.array(short_h), C_embs, 0.1)
            raw_comb = (0.40 * long_att) + (0.60 * short_att)
            norms = np.linalg.norm(raw_comb, axis=1, keepdims=True)
            norms = np.where(norms == 0, 1.0, norms)
            comb_profiles = raw_comb / norms
            
            # Exp 3 scoring (No context)
            scores_exp3_list = []
            for i, c in enumerate(cand_info):
                c_norm = c["embedding"] / np.linalg.norm(c["embedding"]) if np.linalg.norm(c["embedding"]) > 0 else c["embedding"]
                s_sim = float(np.dot(comb_profiles[i], c_norm))
                
                feat_no_ctx = extract_candidate_features(
                    candidate_embedding=c["embedding"],
                    att_user_vector=comb_profiles[i],
                    semantic_score=s_sim,
                    context_relevance=1.0,       # No context multiplier
                    recent_category_ratio=0.0,   # No category density
                    temporal_affinity=1.0,
                    recency_score=0.5,
                    popularity_score=0.0,
                    interest_score=0.0
                )
                p_val = neural_ranker_service.predict_proba(feat_no_ctx)
                score = p_val if p_val is not None else s_sim
                scores_exp3_list.append({"id": c["id"], "score": float(score), "category": c["category"], "embedding": c["embedding"]})
                
            sorted_exp3 = sorted(scores_exp3_list, key=lambda x: x["score"], reverse=True)
            seen_cats3 = set()
            exp3_tuples = []
            for item in sorted_exp3:
                adj_s = item["score"]
                if item["category"] in seen_cats3:
                    adj_s *= 0.90
                seen_cats3.add(item["category"])
                exp3_tuples.append((item["id"], adj_s, item["embedding"]))
                
            # Exp 4 scoring (No diversity reranking)
            scores_exp4_list = []
            for i, c in enumerate(cand_info):
                feat_full = extract_candidate_features(
                    candidate_embedding=c["embedding"],
                    att_user_vector=comb_profiles[i],
                    semantic_score=float(np.dot(comb_profiles[i], c["embedding"] / np.linalg.norm(c["embedding"]))),
                    context_relevance=1.0,
                    recent_category_ratio=0.0,
                    temporal_affinity=1.0,
                    recency_score=0.5,
                    popularity_score=0.0,
                    interest_score=0.0
                )
                p_val = neural_ranker_service.predict_proba(feat_full)
                score = p_val if p_val is not None else 0.5
                scores_exp4_list.append((c["id"], float(score), c["embedding"]))
                
            def calc_metrics(tuples):
                sorted_list = sorted(tuples, key=lambda x: x[1], reverse=True)
                rec_ids = [x[0] for x in sorted_list]
                rec_embs = [x[2] for x in sorted_list]
                return {
                    "p5": precision_at_k(rec_ids, target_clicked_ids, 5),
                    "p10": precision_at_k(rec_ids, target_clicked_ids, 10),
                    "r5": recall_at_k(rec_ids, target_clicked_ids, 5),
                    "r10": recall_at_k(rec_ids, target_clicked_ids, 10),
                    "mrr5": mrr_at_k(rec_ids, target_clicked_ids, 5),
                    "mrr10": mrr_at_k(rec_ids, target_clicked_ids, 10),
                    "ndcg5": ndcg_at_k(rec_ids, target_clicked_ids, 5),
                    "ndcg10": ndcg_at_k(rec_ids, target_clicked_ids, 10),
                    "ild5": intra_list_diversity(rec_embs, 5),
                    "ild10": intra_list_diversity(rec_embs, 10)
                }
                
            metrics_exp3.append(calc_metrics(exp3_tuples))
            metrics_exp4.append(calc_metrics(scores_exp4_list))
            
    elapsed = time.time() - t0
    
    def aggregate(metrics_list):
        keys = metrics_list[0].keys()
        res = {}
        for k in keys:
            vals = [m[k] for m in metrics_list if m[k] is not None]
            res[k] = round(float(np.mean(vals)), 4) if vals else 0.0
        return res

    res_exp1 = aggregate(metrics_exp1)
    res_exp2 = aggregate(metrics_exp2)
    res_exp3 = aggregate(metrics_exp3)
    res_exp4 = aggregate(metrics_exp4)
    
    logger.info("\n" + "=" * 70)
    logger.info("  ABLATION EXPERIMENTAL BENCHMARK RESULTS")
    logger.info("=" * 70)
    logger.info(f"  Tested Users: {len(test_users)} | Evaluated Impressions: {evaluated_imprs} | Elapsed: {elapsed:.2f}s")
    logger.info("-" * 70)
    logger.info(f"{'Metric':<10} | {'Exp 1 (Heuristic)':<18} | {'Exp 2 (Neural Ranker)':<20} | {'Exp 3 (No Context)':<18} | {'Exp 4 (No Diversity)':<20}")
    logger.info("-" * 70)
    for m in ["p5", "p10", "r5", "r10", "mrr5", "mrr10", "ndcg5", "ndcg10", "ild5", "ild10"]:
        logger.info(f"{m.upper():<10} | {res_exp1.get(m, 0.0):<18.4f} | {res_exp2.get(m, 0.0):<20.4f} | {res_exp3.get(m, 0.0):<18.4f} | {res_exp4.get(m, 0.0):<20.4f}")
    logger.info("=" * 70)
    
    final_output = {
        "timestamp": datetime.datetime.now().isoformat(),
        "users_tested": max_users,
        "evaluated_impressions": evaluated_imprs,
        "elapsed_sec": round(elapsed, 2),
        "results": {
            "exp1_heuristic_model_e": res_exp1,
            "exp2_neural_ranker_model_f": res_exp2,
            "exp3_neural_no_context": res_exp3,
            "exp4_neural_no_diversity": res_exp4
        }
    }
    
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(final_output, f, indent=2)
    logger.info(f"Saved ablation benchmark results to {OUTPUT_FILE}")
    
    return final_output


if __name__ == "__main__":
    run_ablation_benchmark(max_users=500)
