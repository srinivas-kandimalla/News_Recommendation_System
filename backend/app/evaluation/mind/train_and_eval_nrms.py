"""
NRMS-Lite Training & Canonical Evaluation Pipeline
===================================================
Trains and evaluates the NRMS-Lite literature baseline on the exact same:
  - User-disjoint train/val split
  - 500-user canonical test cohort (1,406 impressions)
  - 384-dimensional MiniLM embeddings
  - Exact same ranking metrics (AUC, MRR@10, NDCG@10, ILD@10, P@10, R@10)
"""
import os
import sys
import csv
import json
import time
import random
import logging
from typing import Dict, List, Tuple, Any, Optional
import numpy as np

import torch
import torch.nn as nn
import torch.optim as optim
from sklearn.metrics import roc_auc_score

# Ensure backend root is in sys.path
BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from app.ai.nrms_baseline import NRMSLite
from app.evaluation.mind.split_manager import build_or_load_user_splits, split_bucket
from app.evaluation.metrics import (
    precision_at_k,
    recall_at_k,
    mrr_at_k,
    ndcg_at_k,
    intra_list_diversity
)

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

# Paths
DATA_DIR = os.path.join(BACKEND_DIR, "evaluation", "mind", "data")
CACHE_DIR = os.path.join(BACKEND_DIR, "evaluation", "mind", "cache")
CACHE_META = os.path.join(CACHE_DIR, "news_meta.json")
CACHE_EMBS = os.path.join(CACHE_DIR, "news_embs.npy")
BEH_TSV = os.path.join(DATA_DIR, "behaviors.tsv")

OUTPUT_DIR = os.path.join(BACKEND_DIR, "experiments", "corrected_user_disjoint", "nrms_lite")
MODEL_DIR = os.path.join(BACKEND_DIR, "models", "nrms_lite")
os.makedirs(OUTPUT_DIR, exist_ok=True)
os.makedirs(MODEL_DIR, exist_ok=True)


def set_seed(seed: int = 42):
    random.seed(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)
    if torch.cuda.is_available():
        torch.cuda.manual_seed_all(seed)


def load_news_cache():
    logger.info(f"Loading news cache from {CACHE_META}...")
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
            "embedding": embs[idx]
        }
    return news_dict


def parse_session_data(behaviors: List[Dict], news_dict: Dict[str, Dict], max_history: int = 50):
    sessions = []
    total_pos = 0
    total_neg = 0

    for beh in behaviors:
        hist_ids = beh["history"][-max_history:]
        hist_embs = [news_dict[nid]["embedding"] for nid in hist_ids if nid in news_dict]
        
        seq_len = len(hist_embs)
        if seq_len == 0:
            hist_mat = np.zeros((1, 384), dtype=np.float32)
            mask = np.array([False], dtype=bool)
        else:
            hist_mat = np.array(hist_embs, dtype=np.float32)
            mask = np.zeros(seq_len, dtype=bool)

        cand_items = [c for c in beh["impressions"] if c[0] in news_dict]
        if not cand_items:
            continue

        cand_embs = np.array([news_dict[c[0]]["embedding"] for c in cand_items], dtype=np.float32)
        cand_labels = np.array([float(c[1]) for c in cand_items], dtype=np.float32)

        total_pos += int(np.sum(cand_labels == 1.0))
        total_neg += int(np.sum(cand_labels == 0.0))

        sessions.append({
            "hist_mat": hist_mat,
            "mask": mask,
            "cand_embs": cand_embs,
            "cand_labels": cand_labels,
            "cand_ids": [c[0] for c in cand_items]
        })

    return sessions, total_pos, total_neg


def train_nrms_sessions(train_sessions, val_sessions, total_pos, total_neg, seed=42, epochs=8, lr=0.001):
    set_seed(seed)
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    logger.info(f"Training NRMS-Lite on device: {device} ({len(train_sessions)} sessions, {total_pos + total_neg} candidate pairs)")

    pos_weight_val = total_neg / max(total_pos, 1)
    pos_weight = torch.tensor([pos_weight_val], dtype=torch.float32).to(device)

    model = NRMSLite(embed_dim=384, num_heads=4, hidden_dim=200, dropout=0.2).to(device)
    criterion = nn.BCEWithLogitsLoss(pos_weight=pos_weight)
    optimizer = optim.Adam(model.parameters(), lr=lr, weight_decay=1e-5)

    best_auc = 0.0
    best_state = None
    patience = 3
    patience_counter = 0

    batch_size_sessions = 64

    for epoch in range(1, epochs + 1):
        model.train()
        total_loss = 0.0
        num_sessions = 0

        # Shuffle training sessions
        indices = list(range(len(train_sessions)))
        random.shuffle(indices)

        for i in range(0, len(indices), batch_size_sessions):
            batch_idx = indices[i:i + batch_size_sessions]
            optimizer.zero_grad()
            batch_loss = 0.0

            for idx in batch_idx:
                sess = train_sessions[idx]
                h = torch.tensor(sess["hist_mat"], dtype=torch.float32).unsqueeze(0).to(device) # (1, seq_len, 384)
                m = torch.tensor(sess["mask"], dtype=torch.bool).unsqueeze(0).to(device)         # (1, seq_len)
                c = torch.tensor(sess["cand_embs"], dtype=torch.float32).to(device)             # (N, 384)
                y = torch.tensor(sess["cand_labels"], dtype=torch.float32).to(device)           # (N,)

                user_vec = model.forward_user(h, m) # (1, 384)
                logits = torch.matmul(c, user_vec.squeeze(0)) # (N,)

                loss = criterion(logits, y)
                batch_loss += loss

            if len(batch_idx) > 0:
                batch_loss = batch_loss / len(batch_idx)
                batch_loss.backward()
                optimizer.step()
                total_loss += batch_loss.item() * len(batch_idx)
                num_sessions += len(batch_idx)

        avg_loss = total_loss / max(num_sessions, 1)

        # Validation AUC
        model.eval()
        val_preds, val_targets = [], []
        with torch.no_grad():
            for sess in val_sessions:
                h = torch.tensor(sess["hist_mat"], dtype=torch.float32).unsqueeze(0).to(device)
                m = torch.tensor(sess["mask"], dtype=torch.bool).unsqueeze(0).to(device)
                c = torch.tensor(sess["cand_embs"], dtype=torch.float32).to(device)
                y = sess["cand_labels"]

                user_vec = model.forward_user(h, m)
                logits = torch.matmul(c, user_vec.squeeze(0)).cpu().numpy()
                probs = 1.0 / (1.0 + np.exp(-logits))

                val_preds.extend(probs)
                val_targets.extend(y)

        val_auc = roc_auc_score(val_targets, val_preds) if len(set(val_targets)) > 1 else 0.5
        logger.info(f"Epoch {epoch:02d}/{epochs:02d} | Train Loss: {avg_loss:.4f} | Val AUC: {val_auc:.4f}")

        if val_auc > best_auc:
            best_auc = val_auc
            best_state = {k: v.cpu().clone() for k, v in model.state_dict().items()}
            patience_counter = 0
        else:
            patience_counter += 1
            if patience_counter >= patience:
                logger.info(f"Early stopping triggered at epoch {epoch}.")
                break

    model.load_state_dict(best_state)
    return model, best_auc


def evaluate_nrms_on_test(model, test_sessions, news_dict, device):
    model.eval()
    all_metrics = []

    with torch.no_grad():
        for sess in test_sessions:
            h = torch.tensor(sess["hist_mat"], dtype=torch.float32).unsqueeze(0).to(device)
            m = torch.tensor(sess["mask"], dtype=torch.bool).unsqueeze(0).to(device)
            c = torch.tensor(sess["cand_embs"], dtype=torch.float32).to(device)
            y = sess["cand_labels"]
            cand_ids = sess["cand_ids"]

            user_vec = model.forward_user(h, m)
            logits = torch.matmul(c, user_vec.squeeze(0)).cpu().numpy()
            probs = 1.0 / (1.0 + np.exp(-logits))

            target_clicked_ids = [cid for cid, lbl in zip(cand_ids, y) if lbl == 1.0]

            scored_tuples = [(cid, float(p), news_dict[cid]["embedding"]) for cid, p in zip(cand_ids, probs)]
            sorted_list = sorted(scored_tuples, key=lambda x: x[1], reverse=True)
            rec_ids = [x[0] for x in sorted_list]
            rec_embs = [x[2] for x in sorted_list]

            auc = None
            if len(set(y)) > 1:
                try:
                    auc = float(roc_auc_score(y, probs))
                except Exception:
                    auc = None

            m_dict = {
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
            all_metrics.append(m_dict)

    valid_aucs = [m["auc"] for m in all_metrics if m["auc"] is not None]
    summary = {
        "auc": round(float(np.mean(valid_aucs)), 4),
        "mrr5": round(float(np.mean([m["mrr5"] for m in all_metrics])), 4),
        "mrr10": round(float(np.mean([m["mrr10"] for m in all_metrics])), 4),
        "ndcg5": round(float(np.mean([m["ndcg5"] for m in all_metrics])), 4),
        "ndcg10": round(float(np.mean([m["ndcg10"] for m in all_metrics])), 4),
        "p5": round(float(np.mean([m["p5"] for m in all_metrics])), 4),
        "p10": round(float(np.mean([m["p10"] for m in all_metrics])), 4),
        "r5": round(float(np.mean([m["r5"] for m in all_metrics])), 4),
        "r10": round(float(np.mean([m["r10"] for m in all_metrics])), 4),
        "ild5": round(float(np.mean([m["ild5"] for m in all_metrics])), 4),
        "ild10": round(float(np.mean([m["ild10"] for m in all_metrics])), 4),
        "test_sessions": len(all_metrics)
    }
    return summary


def main():
    train_u, val_u, test_u, test_500, manifest = build_or_load_user_splits()
    test_user_set = set(test_500)

    news_dict = load_news_cache()

    logger.info("Parsing behaviors.tsv for training and evaluation...")
    train_behs = []
    val_behs = []
    test_behs = []

    with open(BEH_TSV, "r", encoding="utf-8") as f:
        reader = csv.reader(f, delimiter="\t")
        for row in reader:
            if len(row) < 5:
                continue
            impr_id, uid, time_str, hist_str, impr_str = row[0], row[1], row[2], row[3], row[4]
            history = hist_str.strip().split() if hist_str.strip() else []
            impressions = []
            for item in impr_str.strip().split():
                parts = item.split("-")
                if len(parts) == 2:
                    impressions.append((parts[0], int(parts[1])))

            beh_obj = {
                "impression_id": impr_id,
                "user_id": uid,
                "time": time_str,
                "history": history,
                "impressions": impressions
            }

            if uid in test_user_set:
                test_behs.append(beh_obj)
            elif uid in train_u:
                bucket = split_bucket(impr_id, seed=101)
                if bucket < 85:
                    train_behs.append(beh_obj)
                else:
                    val_behs.append(beh_obj)

    logger.info(f"Loaded: {len(train_behs)} train impressions, {len(val_behs)} val impressions, {len(test_behs)} test impressions.")

    random.seed(42)
    sampled_train_behs = random.sample(train_behs, min(len(train_behs), 15000))
    val_sampled_behs = random.sample(val_behs, min(len(val_behs), 3000))

    logger.info("Parsing session structures...")
    train_sessions, pos_train, neg_train = parse_session_data(sampled_train_behs, news_dict)
    val_sessions, _, _ = parse_session_data(val_sampled_behs, news_dict)
    test_sessions, _, _ = parse_session_data(test_behs, news_dict)

    model, best_val_auc = train_nrms_sessions(train_sessions, val_sessions, pos_train, neg_train, seed=42, epochs=8, lr=0.001)

    weights_path = os.path.join(MODEL_DIR, "nrms_lite.pt")
    config_path = os.path.join(MODEL_DIR, "nrms_config.json")
    torch.save(model.state_dict(), weights_path)

    config = {
        "architecture": "NRMS-Lite",
        "embed_dim": 384,
        "num_heads": 4,
        "hidden_dim": 200,
        "dropout": 0.2,
        "seed": 42,
        "best_val_auc": float(best_val_auc),
        "weights_path": weights_path
    }
    with open(config_path, "w", encoding="utf-8") as f:
        json.dump(config, f, indent=2)

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    logger.info("Evaluating NRMS-Lite on canonical 500-user test cohort...")
    results = evaluate_nrms_on_test(model, test_sessions, news_dict, device)
    results["model"] = "NRMS-Lite (Literature Baseline)"
    results["best_val_auc"] = float(best_val_auc)

    results_file = os.path.join(OUTPUT_DIR, "nrms_results.json")
    with open(results_file, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2)

    logger.info(f"NRMS-Lite evaluation complete and saved to {results_file}")
    logger.info(f"NRMS-Lite Results:\n{json.dumps(results, indent=2)}")


if __name__ == "__main__":
    main()
