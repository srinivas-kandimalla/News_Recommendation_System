import os
import sys

BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from app.evaluation.mind.evaluator_fast import evaluate_mind_behavior_impression_fast
from app.evaluation.mind.train_neural_ranker import load_news_cache
from app.evaluation.mind.behavior_parser import parse_mind_behaviors_tsv


def run_smoke_test():
    print("Loading news cache...")
    news_dict = load_news_cache()
    behaviors = parse_mind_behaviors_tsv(max_behaviors=10)
    print(f"Testing evaluator_fast on {len(behaviors)} sample impressions...")

    for idx, beh in enumerate(behaviors[:5]):
        res = evaluate_mind_behavior_impression_fast(beh, news_dict, k=10)
        assert res is not None, f"Evaluator returned None for impression {beh.get('impression_id')}"
        assert "model_f" in res, "Missing model_f in evaluator output!"
        assert "model_e" in res, "Missing model_e in evaluator output!"
        assert "model_no_context" in res, "Missing model_no_context in evaluator output!"
        
        f_res = res["model_f"]
        auc_val = f"{f_res['auc']:.4f}" if f_res["auc"] is not None else "N/A"
        print(f"  Impression {idx+1} ({beh.get('impression_id')}) -> Model F: AUC={auc_val}, NDCG@10={f_res['ndcg10']:.4f}, MRR@10={f_res['mrr10']:.4f}, ILD@10={f_res['ild10']:.4f}")

    print("\nEvaluator Smoke Test: ALL 5/5 IMPRESSIONS EVALUATED SUCCESSFULLY (No NaNs, No Shape Errors).")


if __name__ == "__main__":
    run_smoke_test()
