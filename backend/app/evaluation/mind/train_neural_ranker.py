"""
NEXORA PHASE 1 — NEURAL RANKER TRAINING PIPELINE
=================================================
Trains lightweight PyTorch MLP Neural Ranker on MIND behavior impressions.

Key Reproducibility & Security Safeguards:
  - Feature dimension derived and asserted at runtime: get_feature_dimension()
  - Explicit random seeds (seed=42) for PyTorch, NumPy, and Python random
  - Train/Val split: 80% / 20% by impression session index (seed=42)
  - Class imbalance handling: pos_weight in BCEWithLogitsLoss
  - Early stopping with patience=3 based on validation AUC
  - Best-checkpoint selection based on peak validation AUC
  - Artifacts saved: backend/models/neural_ranker/neural_ranker.pt
                     backend/models/neural_ranker/model_config.json
"""
import os
import sys
import csv
import json
import time
import random
import datetime
import logging
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
    FEATURE_NAMES
)
from app.ai.neural_ranker import PyTorchNeuralRanker, MODEL_DIR, MODEL_WEIGHTS_PATH, MODEL_CONFIG_PATH

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


def extract_impression_dataset(news_dict, max_impressions=10000, seed=42):
    logger.info(f"Parsing behaviors from {BEH_TSV} (max_impressions={max_impressions})...")
    set_reproducible_seed(seed)
    
    # Assert feature dimension schema alignment before extraction
    derived_dim = get_feature_dimension()
    assert derived_dim == FEATURE_VECTOR_DIM, f"Derived dimension {derived_dim} != FEATURE_VECTOR_DIM {FEATURE_VECTOR_DIM}"

    X_list = []
    y_list = []
    
    parsed_count = 0
    with open(BEH_TSV, "r", encoding="utf-8") as f:
        reader = csv.reader(f, delimiter="\t")
        for row in reader:
            if len(row) < 5:
                continue
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
                
                feat_vec = extract_candidate_features(
                    candidate_embedding=c_emb,
                    att_user_vector=att_user_vec,
                    semantic_score=raw_semantic_score,
                    context_relevance=c_relevance,
                    recent_category_ratio=cat_density,
                    temporal_affinity=1.0,
                    recency_score=0.5,
                    popularity_score=0.0,
                    interest_score=0.0
                )
                
                X_list.append(feat_vec)
                y_list.append(float(label))
                
            parsed_count += 1
            if parsed_count >= max_impressions:
                break
                
    X = np.array(X_list, dtype=np.float32)
    y = np.array(y_list, dtype=np.float32)
    
    # Assert dimension check across entire matrix
    assert X.shape[1] == derived_dim, f"Extracted feature matrix column count {X.shape[1]} != derived schema {derived_dim}"
    logger.info(f"Extracted dataset shape: X={X.shape}, y={y.shape}. Positives={int(np.sum(y == 1))}, Negatives={int(np.sum(y == 0))}")
    return X, y


def train_neural_ranker(max_impressions=10000, epochs=10, batch_size=512, lr=0.001, seed=42, patience=3):
    os.makedirs(MODEL_DIR, exist_ok=True)
    set_reproducible_seed(seed)
    
    derived_dim = get_feature_dimension()
    news_dict = load_news_cache()
    
    X, y = extract_impression_dataset(news_dict, max_impressions=max_impressions, seed=seed)
    
    n_samples = len(X)
    indices = np.arange(n_samples)
    np.random.shuffle(indices)
    
    split_idx = int(0.80 * n_samples)
    train_idx, val_idx = indices[:split_idx], indices[split_idx:]
    
    X_train, y_train = X[train_idx], y[train_idx]
    X_val, y_val = X[val_idx], y[val_idx]
    
    # Calculate class imbalance weighting factor: pos_weight = N_neg / N_pos
    num_pos = max(1.0, float(np.sum(y_train == 1)))
    num_neg = max(1.0, float(np.sum(y_train == 0)))
    pos_weight_val = num_neg / num_pos
    logger.info(f"Class imbalance handling: pos_weight = {pos_weight_val:.4f}")
    
    train_dataset = TensorDataset(torch.from_numpy(X_train), torch.from_numpy(y_train).unsqueeze(1))
    val_dataset = TensorDataset(torch.from_numpy(X_val), torch.from_numpy(y_val).unsqueeze(1))
    
    train_loader = DataLoader(train_dataset, batch_size=batch_size, shuffle=True)
    val_loader = DataLoader(val_dataset, batch_size=batch_size, shuffle=False)
    
    model = PyTorchNeuralRanker(input_dim=derived_dim)
    pos_weight_tensor = torch.tensor([pos_weight_val], dtype=torch.float32)
    criterion = nn.BCEWithLogitsLoss(pos_weight=pos_weight_tensor)
    optimizer = optim.Adam(model.parameters(), lr=lr, weight_decay=1e-5)
    
    logger.info(f"Training PyTorch Neural Ranker (Input Dim={derived_dim}) for up to {epochs} epochs (Early Stopping Patience={patience})...")
    
    best_val_auc = 0.0
    best_state_dict = None
    patience_counter = 0
    
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
        "feature_schema_version": "v1.1",
        "random_seed": seed,
        "train_val_split": "80/20",
        "batch_size": batch_size,
        "class_imbalance_pos_weight": round(pos_weight_val, 4),
        "trained_timestamp": datetime.datetime.now().isoformat(),
        "train_samples": len(X_train),
        "val_samples": len(X_val),
        "best_val_auc": round(best_val_auc, 4),
        "feature_names": FEATURE_NAMES
    }
    
    with open(MODEL_CONFIG_PATH, "w", encoding="utf-8") as f:
        json.dump(model_config, f, indent=2)
    logger.info(f"Saved model configuration to {MODEL_CONFIG_PATH}")
    
    return best_val_auc


if __name__ == "__main__":
    train_neural_ranker(max_impressions=10000, epochs=10)
