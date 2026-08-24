import numpy as np
import json
import logging
from app.evaluation.dataset import prepare_temporal_evaluation_dataset, load_news_candidate_pool
from app.evaluation.evaluator import evaluate_user_models

logger = logging.getLogger(__name__)


def run_reproducible_evaluation():
    print("==========================================================")
    print("   NEXORA STEP 7: REPRODUCIBLE EVALUATION & ABLATION STUDY ")
    print("==========================================================")

    # 1. Dataset Audit & Preparation
    eligible_users = prepare_temporal_evaluation_dataset(min_interactions=3, test_ratio=0.3)
    candidate_pool = load_news_candidate_pool()

    print(f"Eligible Users (>= 3 interactions with train/test split): {len(eligible_users)}")
    print(f"Candidate News Pool Size: {len(candidate_pool)} articles")

    if not eligible_users:
        print("ERROR: Insufficient eligible users in MongoDB dataset for evaluation.")
        return

    results = {
        "model_a": [],
        "model_b": [],
        "model_c": [],
        "model_d": [],
        "model_e": []
    }

    # 2. Per-User Model Evaluation Loop
    for user in eligible_users:
        user_res = evaluate_user_models(user, candidate_pool)
        if user_res:
            for mkey in results.keys():
                results[mkey].append(user_res[mkey])

    # 3. Aggregate Mean Metrics per Model
    mean_metrics = {}
    for mkey, u_list in results.items():
        if not u_list:
            continue
        mean_metrics[mkey] = {
            "p5": float(np.mean([u["p5"] for u in u_list])),
            "p10": float(np.mean([u["p10"] for u in u_list])),
            "r5": float(np.mean([u["r5"] for u in u_list])),
            "r10": float(np.mean([u["r10"] for u in u_list])),
            "mrr5": float(np.mean([u["mrr5"] for u in u_list])),
            "mrr10": float(np.mean([u["mrr10"] for u in u_list])),
            "ndcg5": float(np.mean([u["ndcg5"] for u in u_list])),
            "ndcg10": float(np.mean([u["ndcg10"] for u in u_list])),
            "ild5": float(np.mean([u["ild5"] for u in u_list])),
            "ild10": float(np.mean([u["ild10"] for u in u_list]))
        }

    # 4. Print Complete Ablation Table
    models_display = [
        ("MODEL A: Baseline (Step 3)", "model_a"),
        ("MODEL B: Long+Short (Step 4)", "model_b"),
        ("MODEL C: Attention (Step 5)", "model_c"),
        ("MODEL D: Context Fusion (Step 6)", "model_d"),
        ("MODEL E: Final Nexora System", "model_e")
    ]

    print("\n--- ABLATION STUDY RESULTS TABLE ---")
    header = f"{'Model':<32} | {'P@5':<6} | {'P@10':<6} | {'R@5':<6} | {'R@10':<6} | {'MRR@5':<6} | {'MRR@10':<6} | {'NDCG@5':<6} | {'NDCG@10':<6} | {'ILD@5':<6} | {'ILD@10':<6}"
    print("-" * len(header))
    print(header)
    print("-" * len(header))

    for dname, mkey in models_display:
        m = mean_metrics[mkey]
        row = f"{dname:<32} | {m['p5']:.4f} | {m['p10']:.4f} | {m['r5']:.4f} | {m['r10']:.4f} | {m['mrr5']:.4f} | {m['mrr10']:.4f} | {m['ndcg5']:.4f} | {m['ndcg10']:.4f} | {m['ild5']:.4f} | {m['ild10']:.4f}"
        print(row)
    print("-" * len(header))

    # 5. Relative Percentage Improvement Calculation (Model E vs Baseline Model A)
    base = mean_metrics["model_a"]
    final = mean_metrics["model_e"]

    def calc_imp(final_val, base_val):
        if base_val == 0.0:
            return "N/A (base=0)"
        imp = ((final_val - base_val) / base_val) * 100.0
        return f"{imp:+.2f}%"

    print("\n--- RELATIVE PERCENTAGE IMPROVEMENT (MODEL E vs BASELINE MODEL A) ---")
    print(f"Precision@5:  {calc_imp(final['p5'], base['p5'])}")
    print(f"Recall@5:     {calc_imp(final['r5'], base['r5'])}")
    print(f"MRR@5:        {calc_imp(final['mrr5'], base['mrr5'])}")
    print(f"NDCG@5:       {calc_imp(final['ndcg5'], base['ndcg5'])}")
    print(f"NDCG@10:      {calc_imp(final['ndcg10'], base['ndcg10'])}")
    print(f"Diversity ILD@5: {calc_imp(final['ild5'], base['ild5'])}")

    return {
        "eligible_users_count": len(eligible_users),
        "mean_metrics": mean_metrics
    }

if __name__ == "__main__":
    run_reproducible_evaluation()
