"""
Multi-Seed Robustness Benchmark Pipeline
=========================================
Trains and evaluates Model F across 3 distinct random seeds:
  - Seed 42
  - Seed 123
  - Seed 2026
Using the exact same:
  - User-disjoint split manifest
  - 1159-D feature representation
  - Canonical 500-user test cohort (1,406 impressions)

Reports:
  Per-seed AUC, MRR@10, NDCG@10, ILD@10, P@10, R@10
  Mean +/- Standard Deviation across seeds

Output:
  backend/experiments/corrected_user_disjoint/robustness/multiseed_results.json
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

import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import TensorDataset, DataLoader
from sklearn.metrics import roc_auc_score

# Ensure backend root is in sys.path
BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from app.ai.neural_ranker import PyTorchNeuralRanker, neural_ranker_service
from app.ai.feature_extractor import FEATURE_VECTOR_DIM
from app.evaluation.mind.split_manager import build_or_load_user_splits
from app.evaluation.mind.mind_feature_proxy import MINDCausalFeatureProxy
from app.evaluation.mind.train_neural_ranker import (
    load_news_cache,
    extract_impression_dataset,
    set_reproducible_seed
)
from app.evaluation.mind.evaluator_fast import evaluate_mind_behavior_impression_fast

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

DATA_DIR = os.path.join(BACKEND_DIR, "evaluation", "mind", "data")
BEH_TSV = os.path.join(DATA_DIR, "behaviors.tsv")

OUTPUT_DIR = os.path.join(BACKEND_DIR, "experiments", "corrected_user_disjoint", "robustness")
os.makedirs(OUTPUT_DIR, exist_ok=True)


def train_single_seed(seed, X_train, y_train, X_val, y_val, epochs=10, batch_size=512, lr=0.001):
    set_reproducible_seed(seed)

    num_pos = max(1.0, float(np.sum(y_train == 1)))
    num_neg = max(1.0, float(np.sum(y_train == 0)))
    pos_weight = torch.tensor([num_neg / num_pos], dtype=torch.float32)

    train_dataset = TensorDataset(torch.from_numpy(X_train), torch.from_numpy(y_train).unsqueeze(1))
    val_dataset = TensorDataset(torch.from_numpy(X_val), torch.from_numpy(y_val).unsqueeze(1))

    train_loader = DataLoader(train_dataset, batch_size=batch_size, shuffle=True)
    val_loader = DataLoader(val_dataset, batch_size=batch_size, shuffle=False)

    model = PyTorchNeuralRanker(input_dim=FEATURE_VECTOR_DIM)
    criterion = nn.BCEWithLogitsLoss(pos_weight=pos_weight)
    optimizer = optim.Adam(model.parameters(), lr=lr, weight_decay=1e-5)

    best_auc = 0.0
    best_state = None
    patience = 3
    patience_cnt = 0

    for epoch in range(1, epochs + 1):
        model.train()
        for x, y in train_loader:
            optimizer.zero_grad()
            logits = model(x)
            loss = criterion(logits, y)
            loss.backward()
            optimizer.step()

        model.eval()
        val_preds, val_targets = [], []
        with torch.no_grad():
            for x, y in val_loader:
                logits = model(x)
                probs = torch.sigmoid(logits).numpy().flatten()
                val_preds.extend(probs)
                val_targets.extend(y.numpy().flatten())

        val_auc = roc_auc_score(val_targets, val_preds)
        if val_auc > best_auc:
            best_auc = val_auc
            best_state = {k: v.cpu().clone() for k, v in model.state_dict().items()}
            patience_cnt = 0
        else:
            patience_cnt += 1
            if patience_cnt >= patience:
                break

    model.load_state_dict(best_state)
    return model, best_auc


def evaluate_cohort_with_model(model, test_impressions, news_dict):
    # Temporarily point neural_ranker_service to this trained model
    neural_ranker_service.model = model
    neural_ranker_service.is_loaded = True
    neural_ranker_service.device = torch.device("cpu")
    model.eval()

    model_f_results = []
    for beh in test_impressions:
        res = evaluate_mind_behavior_impression_fast(beh, news_dict, k=10)
        if res is not None and "model_f" in res:
            model_f_results.append(res["model_f"])

    metric_keys = ["auc", "mrr5", "mrr10", "ndcg5", "ndcg10", "p5", "p10", "r5", "r10", "ild5", "ild10"]
    summary = {}
    for k in metric_keys:
        vals = [r[k] for r in model_f_results if r.get(k) is not None]
        summary[k] = round(float(np.mean(vals)), 4) if vals else 0.0

    summary["test_sessions"] = len(model_f_results)
    return summary


def main():
    train_u, val_u, test_u, test_500, manifest = build_or_load_user_splits()
    test_user_set = set(test_500)
    news_dict = load_news_cache()
    causal_proxy = MINDCausalFeatureProxy.build_or_load(train_users=train_u)

    logger.info("Extracting feature dataset for multi-seed training...")
    X_train, y_train, X_val, y_val, _ = extract_impression_dataset(
        news_dict=news_dict,
        proxy=causal_proxy,
        train_users=train_u,
        max_impressions=10000,
        seed=42
    )

    logger.info("Parsing test impressions...")
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

    logger.info(f"Loaded {len(test_impressions)} test impressions.")

    seeds = [42, 123, 2026]
    seed_results = {}

    for seed in seeds:
        logger.info(f"=== TRAINING AND EVALUATING MODEL F (SEED {seed}) ===")
        model, val_auc = train_single_seed(seed, X_train, y_train, X_val, y_val)
        res = evaluate_cohort_with_model(model, test_impressions, news_dict)
        res["val_auc"] = round(float(val_auc), 4)
        seed_results[str(seed)] = res
        logger.info(f"Seed {seed} Test Results: AUC={res['auc']}, MRR@10={res['mrr10']}, NDCG@10={res['ndcg10']}, ILD@10={res['ild10']}")

    # Restore canonical trained weights in service
    neural_ranker_service.attempt_load()

    metrics_to_agg = ["auc", "mrr5", "mrr10", "ndcg5", "ndcg10", "p5", "p10", "r5", "r10", "ild5", "ild10"]
    summary_stats = {}
    for m in metrics_to_agg:
        vals = [seed_results[str(s)][m] for s in seeds]
        mean_val = float(np.mean(vals))
        std_val = float(np.std(vals))
        summary_stats[m] = {
            "mean": round(mean_val, 4),
            "std": round(std_val, 4),
            "formatted": f"{mean_val:.4f} +/- {std_val:.4f}"
        }

    final_payload = {
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%S"),
        "experiment": "Multi-Seed Robustness (Seeds: 42, 123, 2026)",
        "cohort_size": len(test_impressions),
        "seeds": seeds,
        "per_seed_results": seed_results,
        "summary_statistics": summary_stats
    }

    out_file = os.path.join(OUTPUT_DIR, "multiseed_results.json")
    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(final_payload, f, indent=2)

    logger.info(f"Multi-Seed Robustness Benchmark complete. Saved to {out_file}")
    logger.info(f"Summary Stats:\n{json.dumps(summary_stats, indent=2)}")


if __name__ == "__main__":
    main()
