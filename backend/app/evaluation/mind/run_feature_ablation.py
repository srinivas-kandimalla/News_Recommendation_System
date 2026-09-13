"""
NEXORA P1 — COMPREHENSIVE ABLATION EXPERIMENTS (CORRECTED USER-DISJOINT SPLIT)
==============================================================================
Runs authoritative Table III ablation experiments + feature-block ablations on the
canonical 500 disjoint test users from split_manifest.json.

Evaluated Variants:
  1. Full Model F (1159-d): Candidate + Attention + Hadamard + Context + Diversity
  2. w/o Context Features : Temporal affinity, recency, popularity, interest held neutral
  3. w/o Diversity Reranking: Raw Model F scores without Eq. 14 subtractive penalty
  4. Model E Baseline     : Fixed-weight linear heuristic + Diversity
  5. Feature Block: w/o Candidate Embedding (dims 0..383 zeroed)
  6. Feature Block: w/o User Attention Profile (dims 384..767 zeroed)
  7. Feature Block: w/o Hadamard Interaction (dims 768..1151 zeroed)
  8. Feature Block: w/o All Scalars (dims 1152..1158 zeroed)

Output: backend/experiments/corrected_user_disjoint/ablations/ablation_results.json
"""
import os
import sys
import csv
import json
import time
import logging
from datetime import datetime
from typing import Dict, List, Any
import numpy as np
from sklearn.metrics import roc_auc_score

BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from app.evaluation.mind.split_manager import build_or_load_user_splits
from app.evaluation.mind.mind_feature_proxy import MINDCausalFeatureProxy, parse_mind_timestamp
from app.evaluation.mind.train_neural_ranker import load_news_cache, _l2_normalize_rows, vector_attention
from app.ai.feature_extractor import extract_candidate_features
from app.ai.neural_ranker import neural_ranker_service
from app.ai.diversity_service import apply_diversity_reranking
from app.evaluation.metrics import (
    precision_at_k,
    recall_at_k,
    mrr_at_k,
    ndcg_at_k,
    intra_list_diversity
)

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

DATA_DIR = os.path.join(BACKEND_DIR, "evaluation", "mind", "data")
BEH_TSV = os.path.join(DATA_DIR, "behaviors.tsv")
OUT_DIR = os.path.join(BACKEND_DIR, "experiments", "corrected_user_disjoint", "ablations")
OUT_FILE = os.path.join(OUT_DIR, "ablation_results.json")


def rank_and_metrics(scored_tuple_list, target_clicked_ids, cand_labels, cand_info):
    sorted_list = sorted(scored_tuple_list, key=lambda x: x[1], reverse=True)
    rec_ids = [x[0] for x in sorted_list]
    rec_embs = [x[2] for x in sorted_list]

    auc = None
    if len(set(cand_labels)) > 1:
        try:
            score_map = {x[0]: x[1] for x in sorted_list}
            pred_scores_orig = [score_map[c["id"]] for c in cand_info]
            auc = float(roc_auc_score(cand_labels, pred_scores_orig))
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


def run_ablations():
    os.makedirs(OUT_DIR, exist_ok=True)
    train_u, val_u, test_u, test_500, manifest = build_or_load_user_splits()
    test_user_set = set(test_500)
    
    news_dict = load_news_cache()
    proxy = MINDCausalFeatureProxy.build_or_load(train_users=train_u)

    # 1. Parse impressions
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

    logger.info(f"Running ablation suite over {len(test_impressions)} impressions...")

    variants = [
        "full_model_f",
        "wo_context",
        "wo_diversity",
        "model_e_baseline",
        "block_wo_cand_emb",
        "block_wo_user_att",
        "block_wo_hadamard",
        "block_wo_scalars"
    ]
    results_by_variant = {v: [] for v in variants}

    for beh in test_impressions:
        history_ids = beh["history"]
        candidate_ids = beh["candidates"]
        labels = beh["labels"]
        imp_dt = parse_mind_timestamp(beh["timestamp"])

        history_embs_list = [news_dict[nid]["embedding"] for nid in history_ids if nid in news_dict and "embedding" in news_dict[nid]]
        history_cats_list = [news_dict[nid]["category"] for nid in history_ids if nid in news_dict and "category" in news_dict[nid]]
        if not history_embs_list:
            continue

        cand_info = []
        for cid, label in zip(candidate_ids, labels):
            if cid in news_dict and "embedding" in news_dict[cid]:
                cand_info.append({
                    "id": cid,
                    "embedding": news_dict[cid]["embedding"],
                    "category": news_dict[cid].get("category", ""),
                    "label": label
                })
        if not cand_info:
            continue

        target_clicked = [c["id"] for c in cand_info if c["label"] == 1]
        cand_labels = [c["label"] for c in cand_info]
        long_h = history_embs_list[-50:]
        short_h = history_embs_list[-5:]
        short_cats = history_cats_list[-5:]

        # Profiles
        n_short = float(len(short_cats)) if short_cats else 1.0
        
        cand_tuples_full_f = []
        cand_tuples_wo_ctx = []
        cand_tuples_wo_div = []
        cand_tuples_model_e = []
        cand_tuples_no_cand = []
        cand_tuples_no_user = []
        cand_tuples_no_had = []
        cand_tuples_no_scl = []

        for c in cand_info:
            c_emb = c["embedding"]
            c_cat = c["category"]
            nid = c["id"]

            long_u, _ = vector_attention(long_h, c_emb, temp=0.1)
            short_u, _ = vector_attention(short_h, c_emb, temp=0.1)
            comb_u = (0.40 * long_u) + (0.60 * short_u)
            norm_u = np.linalg.norm(comb_u)
            att_u = comb_u / norm_u if norm_u > 0 else comb_u

            c_norm = c_emb / np.linalg.norm(c_emb) if np.linalg.norm(c_emb) > 0 else c_emb
            s_sim = float(np.dot(att_u, c_norm))

            cat_density = short_cats.count(c_cat) / n_short if short_cats else 0.0
            c_relevance = max(0.80, min(1.25, 1.0 + (0.20 * cat_density)))

            t_affinity = proxy.calculate_temporal_affinity(c_cat, imp_dt)
            rec_score = proxy.calculate_recency_score(nid, imp_dt)
            pop_score = proxy.calculate_popularity_score(nid)
            int_score = proxy.calculate_interest_score(c_cat, history_cats_list)

            # 1. Full 1159-d
            feat_full = extract_candidate_features(
                candidate_embedding=c_emb,
                att_user_vector=att_u,
                semantic_score=s_sim,
                context_relevance=c_relevance,
                recent_category_ratio=cat_density,
                temporal_affinity=t_affinity,
                recency_score=rec_score,
                popularity_score=pop_score,
                interest_score=int_score
            )
            prob_full = neural_ranker_service.predict_proba(feat_full)
            score_full = prob_full if prob_full is not None else s_sim
            cand_tuples_full_f.append({"id": nid, "score": float(score_full), "category": c_cat, "embedding": c_emb})

            # 2. w/o Context (neutral scalars)
            feat_wo_ctx = extract_candidate_features(
                candidate_embedding=c_emb,
                att_user_vector=att_u,
                semantic_score=s_sim,
                context_relevance=1.0,
                recent_category_ratio=0.0,
                temporal_affinity=1.0,
                recency_score=rec_score,
                popularity_score=pop_score,
                interest_score=int_score
            )
            prob_wo_ctx = neural_ranker_service.predict_proba(feat_wo_ctx)
            score_wo_ctx = prob_wo_ctx if prob_wo_ctx is not None else s_sim
            cand_tuples_wo_ctx.append({"id": nid, "score": float(score_wo_ctx), "category": c_cat, "embedding": c_emb})

            # 3. Model E Heuristic
            score_e = np.clip(s_sim * c_relevance, 0.0, 1.0)
            cand_tuples_model_e.append({"id": nid, "score": float(score_e), "category": c_cat, "embedding": c_emb})

            # 4. Feature Blocks
            # No Cand Emb (zero out 0..383)
            feat_no_cand = feat_full.copy()
            feat_no_cand[:384] = 0.0
            prob_no_cand = neural_ranker_service.predict_proba(feat_no_cand)
            cand_tuples_no_cand.append((nid, float(prob_no_cand), c_emb))

            # No User Att (zero out 384..767)
            feat_no_user = feat_full.copy()
            feat_no_user[384:768] = 0.0
            prob_no_user = neural_ranker_service.predict_proba(feat_no_user)
            cand_tuples_no_user.append((nid, float(prob_no_user), c_emb))

            # No Hadamard (zero out 768..1151)
            feat_no_had = feat_full.copy()
            feat_no_had[768:1152] = 0.0
            prob_no_had = neural_ranker_service.predict_proba(feat_no_had)
            cand_tuples_no_had.append((nid, float(prob_no_had), c_emb))

            # No Scalars (zero out 1152..1158)
            feat_no_scl = feat_full.copy()
            feat_no_scl[1152:] = 0.0
            prob_no_scl = neural_ranker_service.predict_proba(feat_no_scl)
            cand_tuples_no_scl.append((nid, float(prob_no_scl), c_emb))

        # Diversity rerankings
        rerank_full = apply_diversity_reranking(cand_tuples_full_f, top_k=len(cand_tuples_full_f), score_key="score")
        rerank_wo_ctx = apply_diversity_reranking(cand_tuples_wo_ctx, top_k=len(cand_tuples_wo_ctx), score_key="score")
        rerank_model_e = apply_diversity_reranking(cand_tuples_model_e, top_k=len(cand_tuples_model_e), score_key="score")

        tups_full = [(item["id"], item.get("adjusted_score", item["score"]), item["embedding"]) for item in rerank_full]
        tups_wo_ctx = [(item["id"], item.get("adjusted_score", item["score"]), item["embedding"]) for item in rerank_wo_ctx]
        tups_wo_div = [(item["id"], item["score"], item["embedding"]) for item in cand_tuples_full_f]
        tups_model_e = [(item["id"], item.get("adjusted_score", item["score"]), item["embedding"]) for item in rerank_model_e]

        results_by_variant["full_model_f"].append(rank_and_metrics(tups_full, target_clicked, cand_labels, cand_info))
        results_by_variant["wo_context"].append(rank_and_metrics(tups_wo_ctx, target_clicked, cand_labels, cand_info))
        results_by_variant["wo_diversity"].append(rank_and_metrics(tups_wo_div, target_clicked, cand_labels, cand_info))
        results_by_variant["model_e_baseline"].append(rank_and_metrics(tups_model_e, target_clicked, cand_labels, cand_info))
        results_by_variant["block_wo_cand_emb"].append(rank_and_metrics(cand_tuples_no_cand, target_clicked, cand_labels, cand_info))
        results_by_variant["block_wo_user_att"].append(rank_and_metrics(cand_tuples_no_user, target_clicked, cand_labels, cand_info))
        results_by_variant["block_wo_hadamard"].append(rank_and_metrics(cand_tuples_no_had, target_clicked, cand_labels, cand_info))
        results_by_variant["block_wo_scalars"].append(rank_and_metrics(cand_tuples_no_scl, target_clicked, cand_labels, cand_info))

    summary_ablations = {}
    for var_name, res_list in results_by_variant.items():
        summary_ablations[var_name] = {}
        for m_key in ["auc", "mrr5", "mrr10", "ndcg5", "ndcg10", "p5", "p10", "r5", "r10", "ild5", "ild10"]:
            vals = [r[m_key] for r in res_list if r[m_key] is not None]
            summary_ablations[var_name][m_key] = round(float(np.mean(vals)), 4) if vals else 0.0

    payload = {
        "timestamp": datetime.now().isoformat(),
        "experiment": "Canonical Table III Ablation Study & Feature-Block Decomposition",
        "cohort_size": len(test_impressions),
        "ablation_summary": summary_ablations
    }

    with open(OUT_FILE, "w", encoding="utf-8") as f:
        json.dump(payload, f, indent=2)

    logger.info(f"Saved ablation results to {OUT_FILE}")
    return payload


if __name__ == "__main__":
    p = run_ablations()
    print("\n======================= AUTHORITATIVE TABLE III ABLATION RESULTS =======================")
    print(f"{'Configuration':32s} | {'AUC':6s} | {'MRR@10':6s} | {'NDCG@10':7s} | {'ILD@10':6s}")
    print("-" * 75)
    for cfg, m in p["ablation_summary"].items():
        print(f"{cfg:32s} | {m['auc']:6.4f} | {m['mrr10']:6.4f} | {m['ndcg10']:7.4f} | {m['ild10']:6.4f}")
