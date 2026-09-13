"""
NEXORA P0 — NEURAL RANKER TRAINING PIPELINE (USER-DISJOINT & CAUSAL PROXIES)
=============================================================================
Trains lightweight PyTorch MLP Neural Ranker on MIND behavior impressions.

Key Scientific & Causal Safeguards:
  - 100% User-Disjoint Hash Partition (Zero overlap asserted between Train, Val, Test)
  - Impression-level Train/Val split within training users (prevents intra-session leakage)
  - Deterministic causal proxies for all 4 previously-constant scalar features:
      1. temporal_affinity    : calculated from impression timestamp's hour-of-day
      2. recency_score        : exp(-0.1 * days) from item publication proxy
      3. popularity_score     : candidate frequency computed STRICTLY on train_users impressions
      4. interest_score       : favorite-category match computed STRICTLY from user's prior history
  - Feature dimension derived and asserted at runtime: get_feature_dimension() == 1159
  - Explicit random seeds (seed=42) for PyTorch, NumPy, and Python random
  - Class imbalance handling: pos_weight in BCEWithLogitsLoss
  - Early stopping with patience=3 based on validation AUC
  - Best-checkpoint selection based on peak validation AUC
  - Versioned Artifacts:
      backend/models/neural_ranker/neural_ranker.pt
      backend/models/neural_ranker/model_config.json (schema v2.0-proxy-derived)
"""
import os
import sys
import csv
import json
import time
import random
import datetime
import logging
from typing import Dict, List, Tuple, Any, Optional
import numpy as np

import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import TensorDataset, DataLoader
from sklearn.metrics import roc_auc_score

# Ensure backend root is in import path
BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from app.config.config import Config
from app.ai.feature_extractor import (
    extract_candidate_features,
    get_feature_dimension,
    FEATURE_VECTOR_DIM,
    FEATURE_NAMES,
    SCALAR_FEATURE_NAMES
)
from app.ai.neural_ranker import PyTorchNeuralRanker, MODEL_DIR, MODEL_WEIGHTS_PATH, MODEL_CONFIG_PATH
from app.evaluation.mind.split_manager import build_or_load_user_splits, split_bucket
from app.evaluation.mind.mind_feature_proxy import MINDCausalFeatureProxy, parse_mind_timestamp

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

# Paths
DATA_DIR = os.path.join(BACKEND_DIR, "evaluation", "mind", "data")
CACHE_DIR = os.path.join(BACKEND_DIR, "evaluation", "mind", "cache")
CACHE_META = os.path.join(CACHE_DIR, "news_meta.json")
CACHE_EMBS = os.path.join(CACHE_DIR, "news_embs.npy")
BEH_TSV = os.path.join(DATA_DIR, "behaviors.tsv")


def set_reproducible_seed(seed=42):
    """Set global random seeds for full training reproducibility."""
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
            "abstract": info.get("abstract", ""),
            "embedding": embs[idx]
        }
    logger.info(f"Loaded {len(news_dict)} news articles into cache.")
    return news_dict


def _l2_normalize_rows(mat: np.ndarray) -> np.ndarray:
    norms = np.linalg.norm(mat, axis=1, keepdims=True)
    norms = np.where(norms == 0, 1.0, norms)
    return mat / norms


def vector_attention(history_embs, cand_emb, temp=0.1):
    if len(history_embs) == 0:
        return np.zeros(384, dtype=np.float32), 0.0
    h_matrix = np.array(history_embs)
    c_arr = np.array(cand_emb).reshape(1, -1)
    
    h_norm = _l2_normalize_rows(h_matrix)
    c_norm = _l2_normalize_rows(c_arr)
    
    sims = (h_norm @ c_norm.T).flatten()
    logits = sims / max(temp, 1e-5)
    logits -= np.max(logits)
    exp_w = np.exp(logits)
    alpha = exp_w / (np.sum(exp_w) + 1e-9)
    
    att_profile = alpha @ h_matrix
    norm = np.linalg.norm(att_profile)
    if norm > 0:
        att_profile = att_profile / norm
    max_sim = float(np.max(sims)) if len(sims) > 0 else 0.0
    return att_profile, max_sim


def extract_impression_dataset(
    news_dict: Dict[str, Any],
    proxy: MINDCausalFeatureProxy,
    train_users: set,
    max_impressions: int = 10000,
    seed: int = 42
) -> Tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray, Dict[str, Any]]:
    """
    Extracts impression dataset strictly from train_users population.
    Performs impression-level split (80% train impressions, 20% val impressions)
    to prevent intra-session candidate leakage between train and val.
    """
    logger.info(f"Parsing behaviors from {BEH_TSV} (max_impressions={max_impressions}, restricted to train_users)...")
    set_reproducible_seed(seed)
    
    derived_dim = get_feature_dimension()
    assert derived_dim == FEATURE_VECTOR_DIM, f"Derived dimension {derived_dim} != FEATURE_VECTOR_DIM {FEATURE_VECTOR_DIM}"

    # Group extracted candidate samples by impression_id
    impression_data = []  # list of dicts: {"imp_id": str, "X": list, "y": list, "scalars": list}
    parsed_count = 0

    with open(BEH_TSV, "r", encoding="utf-8") as f:
        reader = csv.reader(f, delimiter="\t")
        for row in reader:
            if len(row) < 5:
                continue
            imp_id = row[0].strip()
            user_id = row[1].strip()

            # STRICT USER-DISJOINT GUARD: Train only on designated train_users
            if user_id not in train_users:
                continue

            ts_str = row[2].strip()
            dt = parse_mind_timestamp(ts_str)

            history_ids = row[3].strip().split() if row[3].strip() else []
            cand_raw = row[4].strip().split() if row[4].strip() else []
            
            if not history_ids or not cand_raw:
                continue

            history_embs = [news_dict[nid]["embedding"] for nid in history_ids if nid in news_dict and "embedding" in news_dict[nid]]
            history_cats = [news_dict[nid]["category"] for nid in history_ids if nid in news_dict and "category" in news_dict[nid]]
            
            if not history_embs:
                continue
                
            long_embs = history_embs[-50:]
            short_embs = history_embs[-5:]
            short_cats = history_cats[-5:]
            
            cands = []
            for item in cand_raw:
                if "-" in item:
                    nid, lbl = item.rsplit("-", 1)
                    if nid in news_dict and "embedding" in news_dict[nid]:
                        cands.append((nid, int(lbl)))
            
            if not cands:
                continue

            imp_X = []
            imp_y = []
            imp_scalars = []
                
            for nid, label in cands:
                cand = news_dict[nid]
                c_emb = cand["embedding"]
                c_cat = cand.get("category", "")
                
                long_u, long_sim = vector_attention(long_embs, c_emb, temp=0.1)
                short_u, short_sim = vector_attention(short_embs, c_emb, temp=0.1)
                
                comb_u = (0.40 * long_u) + (0.60 * short_u)
                norm_u = np.linalg.norm(comb_u)
                att_user_vec = comb_u / norm_u if norm_u > 0 else comb_u
                
                c_norm = c_emb / np.linalg.norm(c_emb) if np.linalg.norm(c_emb) > 0 else c_emb
                raw_semantic_score = float(np.dot(att_user_vec, c_norm))
                
                n_short = float(len(short_cats)) if short_cats else 1.0
                cat_density = short_cats.count(c_cat) / n_short if short_cats else 0.0
                c_relevance = max(0.80, min(1.25, 1.0 + (0.20 * cat_density)))

                # CAUSALLY-DERIVED MIND PROXY FEATURES
                t_affinity = proxy.calculate_temporal_affinity(c_cat, dt)
                rec_score = proxy.calculate_recency_score(nid, dt)
                pop_score = proxy.calculate_popularity_score(nid)
                int_score = proxy.calculate_interest_score(c_cat, history_cats)
                
                feat_vec = extract_candidate_features(
                    candidate_embedding=c_emb,
                    att_user_vector=att_user_vec,
                    semantic_score=raw_semantic_score,
                    context_relevance=c_relevance,
                    recent_category_ratio=cat_density,
                    temporal_affinity=t_affinity,
                    recency_score=rec_score,
                    popularity_score=pop_score,
                    interest_score=int_score
                )
                
                imp_X.append(feat_vec)
                imp_y.append(float(label))
                imp_scalars.append([
                    raw_semantic_score,
                    c_relevance,
                    cat_density,
                    t_affinity,
                    rec_score,
                    pop_score,
                    int_score
                ])

            impression_data.append({
                "imp_id": imp_id,
                "user_id": user_id,
                "X": imp_X,
                "y": imp_y,
                "scalars": imp_scalars
            })
                
            parsed_count += 1
            if parsed_count >= max_impressions:
                break

    logger.info(f"Collected {len(impression_data)} impressions from training users.")

    # IMPRESSION-LEVEL SPLIT (prevents intra-session candidate leakage)
    n_impressions = len(impression_data)
    imp_indices = np.arange(n_impressions)
    np.random.shuffle(imp_indices)

    split_boundary = int(0.80 * n_impressions)
    train_imp_idx = imp_indices[:split_boundary]
    val_imp_idx = imp_indices[split_boundary:]

    X_train_list, y_train_list, scalars_train_list = [], [], []
    for idx in train_imp_idx:
        X_train_list.extend(impression_data[idx]["X"])
        y_train_list.extend(impression_data[idx]["y"])
        scalars_train_list.extend(impression_data[idx]["scalars"])

    X_val_list, y_val_list = [], []
    for idx in val_imp_idx:
        X_val_list.extend(impression_data[idx]["X"])
        y_val_list.extend(impression_data[idx]["y"])

    X_train = np.array(X_train_list, dtype=np.float32)
    y_train = np.array(y_train_list, dtype=np.float32)
    X_val = np.array(X_val_list, dtype=np.float32)
    y_val = np.array(y_val_list, dtype=np.float32)

    scalars_arr = np.array(scalars_train_list, dtype=np.float32)
    scalar_stats = {}
    for i, s_name in enumerate(SCALAR_FEATURE_NAMES):
        vals = scalars_arr[:, i]
        scalar_stats[s_name] = {
            "mean": float(round(np.mean(vals), 4)),
            "std": float(round(np.std(vals), 4)),
            "min": float(round(np.min(vals), 4)),
            "max": float(round(np.max(vals), 4)),
            "median": float(round(np.median(vals), 4))
        }

    logger.info(f"Dataset split by IMPRESSION ID: Train={len(train_imp_idx)} impressions ({len(X_train)} candidate rows), Val={len(val_imp_idx)} impressions ({len(X_val)} candidate rows).")
    logger.info(f"Class counts - Train: {int(np.sum(y_train==1))} pos / {int(np.sum(y_train==0))} neg | Val: {int(np.sum(y_val==1))} pos / {int(np.sum(y_val==0))} neg")
    return X_train, y_train, X_val, y_val, {
        "scalar_stats": scalar_stats,
        "train_impressions": len(train_imp_idx),
        "val_impressions": len(val_imp_idx),
        "train_samples": len(X_train),
        "val_samples": len(X_val)
    }


def train_neural_ranker(
    max_impressions: int = 10000,
    epochs: int = 10,
    batch_size: int = 512,
    lr: float = 0.001,
    seed: int = 42,
    patience: int = 3
) -> Dict[str, Any]:
    os.makedirs(MODEL_DIR, exist_ok=True)
    set_reproducible_seed(seed)
    
    # 1. Load user split and assert zero overlap
    train_users, val_users, test_users, test_cohort, manifest = build_or_load_user_splits(seed=seed)
    assert len(train_users & val_users) == 0, "Train and Val users overlap!"
    assert len(train_users & test_users) == 0, "Train and Test users overlap!"
    assert len(val_users & test_users) == 0, "Val and Test users overlap!"

    # 2. Load / build causal feature proxies
    proxy = MINDCausalFeatureProxy.build_or_load(train_users=train_users, force_rebuild=False)
    news_dict = load_news_cache()
    derived_dim = get_feature_dimension()

    # 3. Extract impression-split dataset
    X_train, y_train, X_val, y_val, meta_stats = extract_impression_dataset(
        news_dict=news_dict,
        proxy=proxy,
        train_users=train_users,
        max_impressions=max_impressions,
        seed=seed
    )
    
    # 4. Class imbalance weighting
    num_pos = max(1.0, float(np.sum(y_train == 1)))
    num_neg = max(1.0, float(np.sum(y_train == 0)))
    pos_weight_val = num_neg / num_pos
    logger.info(f"Class imbalance pos_weight = {pos_weight_val:.4f}")
    
    train_dataset = TensorDataset(torch.from_numpy(X_train), torch.from_numpy(y_train).unsqueeze(1))
    val_dataset = TensorDataset(torch.from_numpy(X_val), torch.from_numpy(y_val).unsqueeze(1))
    
    train_loader = DataLoader(train_dataset, batch_size=batch_size, shuffle=True)
    val_loader = DataLoader(val_dataset, batch_size=batch_size, shuffle=False)
    
    model = PyTorchNeuralRanker(input_dim=derived_dim)
    pos_weight_tensor = torch.tensor([pos_weight_val], dtype=torch.float32)
    criterion = nn.BCEWithLogitsLoss(pos_weight=pos_weight_tensor)
    optimizer = optim.Adam(model.parameters(), lr=lr, weight_decay=1e-5)
    
    logger.info(f"Training PyTorch Neural Ranker (Input Dim={derived_dim}) for up to {epochs} epochs (Patience={patience})...")
    
    best_val_auc = 0.0
    best_state_dict = None
    patience_counter = 0
    epoch_logs = []
    
    for epoch in range(1, epochs + 1):
        model.train()
        total_loss = 0.0
        for b_x, b_y in train_loader:
            optimizer.zero_grad()
            logits = model(b_x)
            loss = criterion(logits, b_y)
            loss.backward()
            optimizer.step()
            total_loss += loss.item() * b_x.size(0)
            
        train_loss = total_loss / len(X_train)
        
        model.eval()
        val_logits_list = []
        val_y_list = []
        with torch.no_grad():
            for b_x, b_y in val_loader:
                logits = model(b_x)
                val_logits_list.append(logits.squeeze(1).numpy())
                val_y_list.append(b_y.squeeze(1).numpy())
                
        val_logits = np.concatenate(val_logits_list)
        val_targets = np.concatenate(val_y_list)
        val_probs = 1.0 / (1.0 + np.exp(-val_logits))
        
        try:
            val_auc = float(roc_auc_score(val_targets, val_probs))
        except Exception:
            val_auc = 0.50
            
        logger.info(f"Epoch {epoch:02d}/{epochs:02d} - Train Loss: {train_loss:.4f} - Val AUC: {val_auc:.4f}")
        epoch_logs.append({
            "epoch": epoch,
            "train_loss": round(train_loss, 4),
            "val_auc": round(val_auc, 4)
        })
        
        if val_auc > best_val_auc + 1e-4:
            best_val_auc = val_auc
            best_state_dict = model.state_dict()
            patience_counter = 0
        else:
            patience_counter += 1
            if patience_counter >= patience:
                logger.info(f"Early stopping triggered at epoch {epoch} (best Val AUC: {best_val_auc:.4f}).")
                break
            
    if best_state_dict is None:
        best_state_dict = model.state_dict()
        
    torch.save(best_state_dict, MODEL_WEIGHTS_PATH)
    logger.info(f"Saved PyTorch weights to {MODEL_WEIGHTS_PATH}")
    
    model_config = {
        "model_name": "PyTorchNeuralRanker",
        "input_dim": derived_dim,
        "hidden_dims": [128, 64],
        "feature_schema_version": "v2.1-log-popularity",
        "popularity_normalization": "log(1 + N_train) / log(1 + N_max_train)",
        "random_seed": seed,
        "split_policy": "User-Disjoint Hash-Bucket + Impression-Level Train/Val",
        "user_counts": {
            "total_users": len(train_users) + len(val_users) + len(test_users),
            "train_users": len(train_users),
            "val_users": len(val_users),
            "test_users": len(test_users),
            "test_cohort_500": len(test_cohort)
        },
        "overlap_verified": {
            "train_val_overlap": 0,
            "train_test_overlap": 0,
            "val_test_overlap": 0
        },
        "impression_counts": {
            "train_impressions": meta_stats["train_impressions"],
            "val_impressions": meta_stats["val_impressions"],
            "train_samples": meta_stats["train_samples"],
            "val_samples": meta_stats["val_samples"]
        },
        "class_imbalance_pos_weight": round(pos_weight_val, 4),
        "best_val_auc": round(best_val_auc, 4),
        "trained_timestamp": datetime.datetime.now().isoformat(),
        "scalar_feature_distributions": meta_stats["scalar_stats"],
        "training_epochs_completed": len(epoch_logs),
        "epoch_logs": epoch_logs,
        "feature_names": FEATURE_NAMES
    }
    
    with open(MODEL_CONFIG_PATH, "w", encoding="utf-8") as f:
        json.dump(model_config, f, indent=2)
    logger.info(f"Saved model configuration to {MODEL_CONFIG_PATH}")
    
    return model_config


if __name__ == "__main__":
    cfg = train_neural_ranker(max_impressions=10000, epochs=10)
    print("\n--- TRAINING COMPLETION SUMMARY ---")
    print(f"Model Name:             {cfg['model_name']}")
    print(f"Feature Schema Version: {cfg['feature_schema_version']}")
    print(f"Best Validation AUC:    {cfg['best_val_auc']}")
    print(f"Train Samples:          {cfg['impression_counts']['train_samples']}")
    print(f"Val Samples:            {cfg['impression_counts']['val_samples']}")
    print("\nScalar Feature Distributions in Training Set:")
    for k, v in cfg["scalar_feature_distributions"].items():
        print(f"  {k:22s}: mean={v['mean']:.4f}, std={v['std']:.4f}, min={v['min']:.4f}, max={v['max']:.4f}, median={v['median']:.4f}")
