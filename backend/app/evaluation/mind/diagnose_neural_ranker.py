"""
NEXORA PHASE 1.1 — NEURAL RANKER EFFECTIVENESS DIAGNOSTIC SCRIPT
================================================================
Performs comprehensive technical audit of Model F vs Model E execution,
tracing feature extraction, model loading, raw scores, rank ordering,
diversity reranking, and schema consistency across 100+ impressions.
"""
import os
import sys
import csv
import json
import time
import datetime
import logging
import numpy as np
import torch
from scipy.stats import pearsonr, spearmanr

BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from app.config.config import Config
from app.ai.feature_extractor import extract_candidate_features, get_feature_dimension, FEATURE_VECTOR_DIM, FEATURE_NAMES
from app.ai.neural_ranker import neural_ranker_service, PyTorchNeuralRanker, MODEL_WEIGHTS_PATH, MODEL_CONFIG_PATH
from app.evaluation.mind.evaluator_fast import evaluate_mind_behavior_impression_fast, _vectorized_attention_profile, _l2_normalize_rows
from app.evaluation.metrics import precision_at_k, recall_at_k, mrr_at_k, ndcg_at_k, intra_list_diversity

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

CACHE_META = os.path.join(BACKEND_DIR, "evaluation", "mind", "cache", "news_meta.json")
CACHE_EMBS = os.path.join(BACKEND_DIR, "evaluation", "mind", "cache", "news_embs.npy")
BEH_TSV = os.path.join(BACKEND_DIR, "evaluation", "mind", "data", "behaviors.tsv")
DIAGNOSTIC_OUTPUT = os.path.join(BACKEND_DIR, "evaluation", "mind", "diagnostic_results.json")


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


def run_effectiveness_audit(num_impressions=100):
    logger.info("=" * 70)
    logger.info("  NEXORA PHASE 1.1 — NEURAL RANKER EFFECTIVENESS DIAGNOSTIC AUDIT")
    logger.info("=" * 70)

    # -------------------------------------------------------------
    # 1. Model & Weights Verification
    # -------------------------------------------------------------
    logger.info("\n[STEP 1] Model Weights & Loading Verification:")
    logger.info(f"  Weights File Exists  : {os.path.exists(MODEL_WEIGHTS_PATH)} ({MODEL_WEIGHTS_PATH})")
    logger.info(f"  Config File Exists   : {os.path.exists(MODEL_CONFIG_PATH)} ({MODEL_CONFIG_PATH})")
    logger.info(f"  Initial Config.USE_NEURAL_RANKER : {getattr(Config, 'USE_NEURAL_RANKER', False)}")
    logger.info(f"  Initial neural_ranker_service.is_loaded : {neural_ranker_service.is_loaded}")
    logger.info(f"  Initial neural_ranker_service.is_ready()  : {neural_ranker_service.is_ready()}")

    # Check weights parameter sanity
    if neural_ranker_service.is_loaded and neural_ranker_service.model is not None:
        params = list(neural_ranker_service.model.parameters())
        num_params = sum(p.numel() for p in params)
        non_zero = sum(torch.sum(p != 0).item() for p in params)
        logger.info(f"  Model Parameter Count : {num_params}")
        logger.info(f"  Non-Zero Parameters   : {non_zero}/{num_params} ({100.0 * non_zero / num_params:.2f}%)")
        logger.info(f"  Model Training Mode   : {neural_ranker_service.model.training} (False expected for eval mode)")

    # -------------------------------------------------------------
    # 2. Force Enable Neural Ranker for Audit Evaluation
    # -------------------------------------------------------------
    Config.USE_NEURAL_RANKER = True
    logger.info(f"\n[STEP 2] Environment Override: Set Config.USE_NEURAL_RANKER = True")
    logger.info(f"  Updated neural_ranker_service.is_ready() : {neural_ranker_service.is_ready()}")

    # -------------------------------------------------------------
    # 3. Load MIND News Cache and Impressions
    # -------------------------------------------------------------
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
            if candidates and labels and history_ids:
                all_behaviors.append({
                    "impression_id": row[0],
                    "user_id": row[1],
                    "timestamp": row[2],
                    "history": history_ids,
                    "candidates": candidates,
                    "labels": labels
                })
                if len(all_behaviors) >= num_impressions:
                    break

    logger.info(f"\n[STEP 3] Loaded {len(all_behaviors)} valid MIND impression sessions for audit.")

    # -------------------------------------------------------------
    # 4. Tracing End-to-End Execution
    # -------------------------------------------------------------
    total_candidates_processed = 0
    neural_ranker_calls = 0
    fallback_calls = 0
    
    scores_e_raw_all = []
    scores_f_raw_all = []
    
    top1_agreements_pre_div = 0
    top1_agreements_post_div = 0
    top5_overlaps_pre_div = []
    top5_overlaps_post_div = []
    top10_overlaps_pre_div = []
    top10_overlaps_post_div = []
    
    spearman_corrs_pre_div = []
    spearman_corrs_post_div = []
    
    sample_feature_stats = []

    for b_idx, b in enumerate(all_behaviors):
        history_ids = b["history"]
        candidate_ids = b["candidates"]
        labels = b["labels"]

        history_embs = [news_dict[nid]["embedding"] for nid in history_ids if nid in news_dict and "embedding" in news_dict[nid]]
        history_cats = [news_dict[nid]["category"] for nid in history_ids if nid in news_dict and "category" in news_dict[nid]]
        
        cand_info = [
            {"id": cid, "embedding": news_dict[cid]["embedding"], "category": news_dict[cid].get("category", ""), "label": lbl}
            for cid, lbl in zip(candidate_ids, labels)
            if cid in news_dict and "embedding" in news_dict[cid]
        ]
        
        if not cand_info or not history_embs:
            continue

        long_h = np.array(history_embs[-50:])
        short_h = np.array(history_embs[-5:])
        short_cats = history_cats[-5:]
        C_embs = np.array([c["embedding"] for c in cand_info])

        # Vectorized candidate-aware attention
        long_att = _vectorized_attention_profile(long_h, C_embs, 0.1)
        short_att = _vectorized_attention_profile(short_h, C_embs, 0.1)
        raw_comb = (0.40 * long_att) + (0.60 * short_att)
        norms = np.linalg.norm(raw_comb, axis=1, keepdims=True)
        norms = np.where(norms == 0, 1.0, norms)
        comb_profiles = raw_comb / norms
        c_norms = _l2_normalize_rows(C_embs)
        
        # Model C attention scores
        scores_c_vals = (comb_profiles * c_norms).sum(axis=1)

        # Model D context scores
        n_short = float(len(short_cats)) if short_cats else 1.0
        cat_density_vals = np.array([short_cats.count(c["category"]) / n_short if short_cats else 0.0 for c in cand_info], dtype=float)
        c_factor_vals = np.clip(1.0 + (0.20 * cat_density_vals), 0.80, 1.25)
        scores_d_vals = np.clip(scores_c_vals * c_factor_vals, 0.0, 1.0)

        # Scores for Model E (Heuristic raw score = Model D score)
        e_raw_scores = scores_d_vals.copy()
        
        # Scores for Model F (Neural Ranker raw score)
        f_raw_scores = []
        for i, c in enumerate(cand_info):
            total_candidates_processed += 1
            feat_vec = extract_candidate_features(
                candidate_embedding=c["embedding"],
                att_user_vector=comb_profiles[i],
                semantic_score=float(scores_c_vals[i]),
                context_relevance=float(c_factor_vals[i]),
                recent_category_ratio=float(cat_density_vals[i]),
                temporal_affinity=1.0,
                recency_score=0.5,
                popularity_score=0.0,
                interest_score=0.0
            )

            # Feature Validation for first 5 impressions
            if b_idx < 5 and i < 2:
                sample_feature_stats.append({
                    "impression_idx": b_idx,
                    "cand_idx": i,
                    "dim": feat_vec.shape[0],
                    "is_finite": bool(np.all(np.isfinite(feat_vec))),
                    "min": float(np.min(feat_vec)),
                    "max": float(np.max(feat_vec)),
                    "mean": float(np.mean(feat_vec)),
                    "std": float(np.std(feat_vec))
                })

            n_proba = neural_ranker_service.predict_proba(feat_vec)
            if n_proba is not None:
                neural_ranker_calls += 1
                f_raw_scores.append(n_proba)
            else:
                fallback_calls += 1
                f_raw_scores.append(float(scores_d_vals[i]))

        f_raw_scores = np.array(f_raw_scores, dtype=float)

        scores_e_raw_all.extend(e_raw_scores)
        scores_f_raw_all.extend(f_raw_scores)

        # ---------------------------------------------------------
        # PRE-DIVERSITY RANKING COMPARISON
        # ---------------------------------------------------------
        e_pre_order = np.argsort(-e_raw_scores)
        f_pre_order = np.argsort(-f_raw_scores)

        top1_e_pre = cand_info[e_pre_order[0]]["id"]
        top1_f_pre = cand_info[f_pre_order[0]]["id"]
        if top1_e_pre == top1_f_pre:
            top1_agreements_pre_div += 1

        top5_e_pre = set(cand_info[idx]["id"] for idx in e_pre_order[:5])
        top5_f_pre = set(cand_info[idx]["id"] for idx in f_pre_order[:5])
        top5_overlaps_pre_div.append(len(top5_e_pre.intersection(top5_f_pre)) / min(5, len(cand_info)))

        top10_e_pre = set(cand_info[idx]["id"] for idx in e_pre_order[:10])
        top10_f_pre = set(cand_info[idx]["id"] for idx in f_pre_order[:10])
        top10_overlaps_pre_div.append(len(top10_e_pre.intersection(top10_f_pre)) / min(10, len(cand_info)))

        if len(cand_info) > 1:
            rho_pre, _ = spearmanr(e_raw_scores, f_raw_scores)
            if not np.isnan(rho_pre):
                spearman_corrs_pre_div.append(rho_pre)

        # ---------------------------------------------------------
        # POST-DIVERSITY RERANKING COMPARISON
        # ---------------------------------------------------------
        # Model E Reranking
        e_cand_list = [{"id": c["id"], "score": float(e_raw_scores[i]), "category": c["category"]} for i, c in enumerate(cand_info)]
        sorted_e = sorted(e_cand_list, key=lambda x: x["score"], reverse=True)
        seen_cats_e = set()
        e_post_tuples = []
        for item in sorted_e:
            adj = item["score"] * (0.90 if item["category"] in seen_cats_e else 1.0)
            seen_cats_e.add(item["category"])
            e_post_tuples.append((item["id"], adj))

        # Model F Reranking
        f_cand_list = [{"id": c["id"], "score": float(f_raw_scores[i]), "category": c["category"]} for i, c in enumerate(cand_info)]
        sorted_f = sorted(f_cand_list, key=lambda x: x["score"], reverse=True)
        seen_cats_f = set()
        f_post_tuples = []
        for item in sorted_f:
            adj = item["score"] * (0.90 if item["category"] in seen_cats_f else 1.0)
            seen_cats_f.add(item["category"])
            f_post_tuples.append((item["id"], adj))

        top1_e_post = e_post_tuples[0][0]
        top1_f_post = f_post_tuples[0][0]
        if top1_e_post == top1_f_post:
            top1_agreements_post_div += 1

        top5_e_post = set(t[0] for t in e_post_tuples[:5])
        top5_f_post = set(t[0] for t in f_post_tuples[:5])
        top5_overlaps_post_div.append(len(top5_e_post.intersection(top5_f_post)) / min(5, len(cand_info)))

        top10_e_post = set(t[0] for t in e_post_tuples[:10])
        top10_f_post = set(t[0] for t in f_post_tuples[:10])
        top10_overlaps_post_div.append(len(top10_e_post.intersection(top10_f_post)) / min(10, len(cand_info)))

    # -------------------------------------------------------------
    # 5. Statistical Score & Ranking Audit Metrics
    # -------------------------------------------------------------
    scores_e_arr = np.array(scores_e_raw_all)
    scores_f_arr = np.array(scores_f_raw_all)

    abs_diffs = np.abs(scores_e_arr - scores_f_arr)
    mean_abs_diff = float(np.mean(abs_diffs))
    max_abs_diff = float(np.max(abs_diffs))
    pct_changed = float(np.mean(abs_diffs > 1e-5) * 100.0)

    p_corr, _ = pearsonr(scores_e_arr, scores_f_arr)
    s_corr, _ = spearmanr(scores_e_arr, scores_f_arr)

    logger.info("\n" + "=" * 70)
    logger.info("  AUDIT SECTION 1: INVOCATION & PIPELINE TRACE")
    logger.info("=" * 70)
    logger.info(f"  Total Candidate Items Evaluated : {total_candidates_processed}")
    logger.info(f"  Neural Ranker Model Calls       : {neural_ranker_calls}")
    logger.info(f"  Fallback Heuristic Calls        : {fallback_calls}")
    logger.info(f"  Neural Model Invocation Rate    : {100.0 * neural_ranker_calls / max(1, total_candidates_processed):.2f}%")

    logger.info("\n" + "=" * 70)
    logger.info("  AUDIT SECTION 2: RAW SCORE COMPARISON (MODEL E vs MODEL F)")
    logger.info("=" * 70)
    logger.info(f"  Model E Score Range : [{np.min(scores_e_arr):.4f}, {np.max(scores_e_arr):.4f}] (mean: {np.mean(scores_e_arr):.4f})")
    logger.info(f"  Model F Score Range : [{np.min(scores_f_arr):.4f}, {np.max(scores_f_arr):.4f}] (mean: {np.mean(scores_f_arr):.4f})")
    logger.info(f"  Mean Absolute Score Difference   : {mean_abs_diff:.6f}")
    logger.info(f"  Max Absolute Score Difference    : {max_abs_diff:.6f}")
    logger.info(f"  % Candidates with Changed Score  : {pct_changed:.2f}%")
    logger.info(f"  Pearson Score Correlation (r)    : {p_corr:.4f}")
    logger.info(f"  Spearman Score Correlation (rho) : {s_corr:.4f}")

    logger.info("\n" + "=" * 70)
    logger.info("  AUDIT SECTION 3 & 4: RANKING ORDER & DIVERSITY COMPARISON")
    logger.info("=" * 70)
    logger.info(f"  [PRE-DIVERSITY RERANKING]")
    logger.info(f"    Top-1 Agreement Rate : {100.0 * top1_agreements_pre_div / len(all_behaviors):.2f}% ({top1_agreements_pre_div}/{len(all_behaviors)})")
    logger.info(f"    Top-5 Item Overlap   : {100.0 * float(np.mean(top5_overlaps_pre_div)):.2f}%")
    logger.info(f"    Top-10 Item Overlap  : {100.0 * float(np.mean(top10_overlaps_pre_div)):.2f}%")
    logger.info(f"    Spearman Rank Corr   : {float(np.mean(spearman_corrs_pre_div)):.4f}")
    logger.info(f"  [POST-DIVERSITY RERANKING]")
    logger.info(f"    Top-1 Agreement Rate : {100.0 * top1_agreements_post_div / len(all_behaviors):.2f}% ({top1_agreements_post_div}/{len(all_behaviors)})")
    logger.info(f"    Top-5 Item Overlap   : {100.0 * float(np.mean(top5_overlaps_post_div)):.2f}%")
    logger.info(f"    Top-10 Item Overlap  : {100.0 * float(np.mean(top10_overlaps_post_div)):.2f}%")

    logger.info("\n" + "=" * 70)
    logger.info("  AUDIT SECTION 5: FEATURE MATRIX VALIDATION")
    logger.info("=" * 70)
    logger.info(f"  Sample Feature Dimensions Checked: {[s['dim'] for s in sample_feature_stats]}")
    logger.info(f"  All Features Finite (No NaN/Inf) : {all(s['is_finite'] for s in sample_feature_stats)}")

    audit_summary = {
        "timestamp": datetime.datetime.now().isoformat(),
        "total_candidates_processed": total_candidates_processed,
        "neural_ranker_calls": neural_ranker_calls,
        "fallback_calls": fallback_calls,
        "raw_score_metrics": {
            "mean_abs_diff": round(mean_abs_diff, 6),
            "max_abs_diff": round(max_abs_diff, 6),
            "pct_candidates_changed": round(pct_changed, 2),
            "pearson_correlation": round(float(p_corr), 4),
            "spearman_correlation": round(float(s_corr), 4)
        },
        "pre_diversity_ranking": {
            "top1_agreement_pct": round(100.0 * top1_agreements_pre_div / len(all_behaviors), 2),
            "top5_overlap_pct": round(100.0 * float(np.mean(top5_overlaps_pre_div)), 2),
            "top10_overlap_pct": round(100.0 * float(np.mean(top10_overlaps_pre_div)), 2),
            "spearman_rank_corr": round(float(np.mean(spearman_corrs_pre_div)), 4)
        },
        "post_diversity_ranking": {
            "top1_agreement_pct": round(100.0 * top1_agreements_post_div / len(all_behaviors), 2),
            "top5_overlap_pct": round(100.0 * float(np.mean(top5_overlaps_post_div)), 2),
            "top10_overlap_pct": round(100.0 * float(np.mean(top10_overlaps_post_div)), 2)
        },
        "sample_features": sample_feature_stats
    }

    with open(DIAGNOSTIC_OUTPUT, "w", encoding="utf-8") as f:
        json.dump(audit_summary, f, indent=2)
    logger.info(f"\nSaved diagnostic output to {DIAGNOSTIC_OUTPUT}")
    
    return audit_summary


if __name__ == "__main__":
    run_effectiveness_audit(num_impressions=100)
