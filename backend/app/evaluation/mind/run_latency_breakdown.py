"""
Nexora Comprehensive Latency & Real-Time Profiler
=================================================
Measures end-to-end and component-level latency across all stages of the
Nexora recommendation pipeline:
  Stage 1: History & Candidate Embedding Retrieval
  Stage 2: Candidate-Aware Softmax Attention Computation
  Stage 3: Causal Scalar/Context Feature Extraction
  Stage 4: 1159-D Feature Matrix Assembly (384 + 384 + 384 + 7)
  Stage 5: Neural Ranker MLP Batch Forward Pass
  Stage 6: Hybrid Scoring Fusion (0.60/0.20/0.10/0.10)
  Stage 7: Diversity-Aware Greedy Reranking (Eq. 14)

Calculates:
  Mean, P50 (Median), P90, P95, P99, Min, Max, and Throughput (req/sec)

Output:
  backend/experiments/corrected_user_disjoint/latency/latency_breakdown.json
"""
import os
import sys
import csv
import json
import time
import logging
from typing import Dict, List, Any
import numpy as np

# Ensure backend root is in sys.path
BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from app.evaluation.mind.split_manager import build_or_load_user_splits
from app.evaluation.mind.mind_feature_proxy import MINDCausalFeatureProxy, parse_mind_timestamp
from app.evaluation.mind.train_neural_ranker import load_news_cache
from app.evaluation.mind.evaluator_fast import _vectorized_attention_profile, _l2_normalize_rows
from app.ai.feature_extractor import extract_candidate_features_batch, FEATURE_VECTOR_DIM
from app.ai.neural_ranker import neural_ranker_service
from app.ai.ranking_service import calculate_hybrid_score
from app.ai.diversity_service import apply_diversity_reranking

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

DATA_DIR = os.path.join(BACKEND_DIR, "evaluation", "mind", "data")
BEH_TSV = os.path.join(DATA_DIR, "behaviors.tsv")

OUTPUT_DIR = os.path.join(BACKEND_DIR, "experiments", "corrected_user_disjoint", "latency")
os.makedirs(OUTPUT_DIR, exist_ok=True)


def calculate_percentiles(times_ms: List[float]) -> Dict[str, float]:
    arr = np.array(times_ms)
    return {
        "mean_ms": round(float(np.mean(arr)), 3),
        "std_ms": round(float(np.std(arr)), 3),
        "min_ms": round(float(np.min(arr)), 3),
        "p50_ms": round(float(np.percentile(arr, 50)), 3),
        "p90_ms": round(float(np.percentile(arr, 90)), 3),
        "p95_ms": round(float(np.percentile(arr, 95)), 3),
        "p99_ms": round(float(np.percentile(arr, 99)), 3),
        "max_ms": round(float(np.max(arr)), 3)
    }


def profile_pipeline(num_warmup: int = 50, num_eval: int = 500):
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

    logger.info(f"Loaded {len(test_behs)} test impressions. Profiling over {num_eval} samples...")

    stage_times = {
        "stage1_embedding_retrieval": [],
        "stage2_candidate_attention": [],
        "stage3_scalar_features": [],
        "stage4_matrix_assembly": [],
        "stage5_neural_inference": [],
        "stage6_hybrid_scoring": [],
        "stage7_diversity_rerank": [],
        "total_end_to_end": []
    }

    neural_ranker_service.attempt_load()

    eval_behs = test_behs[:num_warmup + num_eval]
    candidate_counts = []

    for idx, beh in enumerate(eval_behs):
        is_warmup = idx < num_warmup

        t_start = time.perf_counter()

        # Stage 1: Retrieval
        t1_start = time.perf_counter()
        impr_dt = parse_mind_timestamp(beh["time"])
        hist_ids = beh["history"]
        hist_embs = [news_dict[nid]["embedding"] for nid in hist_ids if nid in news_dict]
        if not hist_embs:
            continue
        hist_cats = [news_dict[nid]["category"] for nid in hist_ids if nid in news_dict]
        long_embs = np.array(hist_embs[-50:], dtype=np.float32)
        short_embs = np.array(hist_embs[-5:], dtype=np.float32)

        valid_cands = [c for c in beh["impressions"] if c[0] in news_dict]
        if not valid_cands:
            continue
        cand_embs = np.array([news_dict[c[0]]["embedding"] for c in valid_cands], dtype=np.float32)
        cand_ids = [c[0] for c in valid_cands]
        cand_cats = [news_dict[c[0]]["category"] for c in valid_cands]
        t1_end = time.perf_counter()

        # Stage 2: Candidate-Aware Softmax Attention
        t2_start = time.perf_counter()
        long_u = _vectorized_attention_profile(long_embs, cand_embs, temperature=0.10)
        short_u = _vectorized_attention_profile(short_embs, cand_embs, temperature=0.10)
        u_atts = 0.40 * long_u + 0.60 * short_u
        u_atts = _l2_normalize_rows(u_atts)
        t2_end = time.perf_counter()

        # Stage 3: Scalar Features
        t3_start = time.perf_counter()
        temporal_affinity = causal_proxy.calculate_temporal_affinity(cand_cats[0] if cand_cats else "news", impr_dt)
        rec_scores = [causal_proxy.calculate_recency_score(cid, impr_dt) for cid in cand_ids]
        pop_scores = [causal_proxy.calculate_popularity_score(cid) for cid in cand_ids]
        int_scores = [causal_proxy.calculate_interest_score(cat, hist_cats) for cat in cand_cats]
        # Semantic similarity
        c_norm = _l2_normalize_rows(cand_embs)
        semantic_scores = np.sum(u_atts * c_norm, axis=1)
        # Context relevance and recent category density
        short_cats_list = hist_cats[-5:]
        cat_ratios = [short_cats_list.count(cat) / max(1, len(short_cats_list)) for cat in cand_cats]
        ctx_relevances = [1.0 + 0.20 * r for r in cat_ratios]
        temp_affinities = [temporal_affinity] * len(cand_ids)
        t3_end = time.perf_counter()

        # Stage 4: Matrix Assembly
        t4_start = time.perf_counter()
        feat_matrix = extract_candidate_features_batch(
            c_embs=cand_embs,
            u_atts=u_atts,
            semantic_scores=semantic_scores,
            context_relevances=ctx_relevances,
            recent_category_ratios=cat_ratios,
            temporal_affinities=temp_affinities,
            recency_scores=rec_scores,
            popularity_scores=pop_scores,
            interest_scores=int_scores
        )
        t4_end = time.perf_counter()

        # Stage 5: Neural Ranker MLP Batch Inference
        t5_start = time.perf_counter()
        proba_neural = neural_ranker_service.predict_proba_batch(feat_matrix)
        t5_end = time.perf_counter()

        # Stage 6: Hybrid Scoring
        t6_start = time.perf_counter()
        cand_objs = []
        for i, cid in enumerate(cand_ids):
            hybrid = calculate_hybrid_score(
                proba_neural[i],
                rec_scores[i],
                pop_scores[i],
                int_scores[i]
            )
            cand_objs.append({
                "news_id": cid,
                "category": cand_cats[i],
                "hybrid_score": hybrid
            })
        t6_end = time.perf_counter()

        # Stage 7: Diversity Reranking (Eq. 14)
        t7_start = time.perf_counter()
        reranked = apply_diversity_reranking(cand_objs, top_k=10, diversity_lambda=0.10)
        t7_end = time.perf_counter()

        t_total = time.perf_counter() - t_start

        if not is_warmup:
            candidate_counts.append(len(valid_cands))
            stage_times["stage1_embedding_retrieval"].append((t1_end - t1_start) * 1000.0)
            stage_times["stage2_candidate_attention"].append((t2_end - t2_start) * 1000.0)
            stage_times["stage3_scalar_features"].append((t3_end - t3_start) * 1000.0)
            stage_times["stage4_matrix_assembly"].append((t4_end - t4_start) * 1000.0)
            stage_times["stage5_neural_inference"].append((t5_end - t5_start) * 1000.0)
            stage_times["stage6_hybrid_scoring"].append((t6_end - t6_start) * 1000.0)
            stage_times["stage7_diversity_rerank"].append((t7_end - t7_start) * 1000.0)
            stage_times["total_end_to_end"].append(t_total * 1000.0)

    # Compute Statistics
    report = {
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%S"),
        "experiment": "Nexora Component Latency Profile (Batch Optimized)",
        "hardware_environment": {
            "platform": sys.platform,
            "python_version": sys.version.split()[0],
            "inference_mode": "PyTorch CPU Batched Forward Pass",
            "evaluated_sessions": len(stage_times["total_end_to_end"]),
            "avg_candidates_per_session": round(float(np.mean(candidate_counts)), 2)
        },
        "stage_latency_breakdown": {
            stage: calculate_percentiles(times) for stage, times in stage_times.items()
        },
        "throughput_req_per_sec": round(1000.0 / np.mean(stage_times["total_end_to_end"]), 2)
    }

    out_file = os.path.join(OUTPUT_DIR, "latency_breakdown.json")
    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2)

    logger.info(f"Latency Profiling Complete. Saved to {out_file}")
    logger.info(f"Summary End-to-End Latency:\n{json.dumps(report['stage_latency_breakdown']['total_end_to_end'], indent=2)}")
    logger.info(f"Throughput: {report['throughput_req_per_sec']} req/sec")


if __name__ == "__main__":
    profile_pipeline()
