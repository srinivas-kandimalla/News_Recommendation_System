"""
NEXORA P0 — USER-DISJOINT SPLIT MANAGER
=======================================
Deterministic, hash-partitioned user-level splitting for MIND dataset.
Guarantees absolute zero user overlap between Train, Validation, and Test sets.

Split Policy:
  - Hash algorithm: MD5(f"{seed}_{user_id}") % 100
  - Train Users: bucket < 80 (80%)
  - Validation Users: 80 <= bucket < 90 (10%)
  - Test Users: bucket >= 90 (10%)
  - Canonical Test Cohort: First 500 test users by deterministic sorted order
"""
import os
import sys
import csv
import json
import hashlib
import logging
from typing import Dict, Set, List, Tuple, Any

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

# Backend base paths: split_manager is at backend/app/evaluation/mind/split_manager.py
BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
if not os.path.exists(os.path.join(BACKEND_DIR, "evaluation")):
    BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

DATA_DIR = os.path.join(BACKEND_DIR, "evaluation", "mind", "data")
CACHE_DIR = os.path.join(BACKEND_DIR, "evaluation", "mind", "cache")
MANIFEST_PATH = os.path.join(BACKEND_DIR, "evaluation", "mind", "split_manifest.json")
BEHAVIORS_TSV = os.path.join(DATA_DIR, "behaviors.tsv")


def split_bucket(user_id: str, seed: int = 42) -> int:
    """Deterministic hash bucket in range [0, 99]."""
    h = int(hashlib.md5(f"{seed}_{user_id}".encode("utf-8")).hexdigest(), 16)
    return h % 100


def build_or_load_user_splits(
    behaviors_tsv: str = BEHAVIORS_TSV,
    manifest_path: str = MANIFEST_PATH,
    seed: int = 42,
    force_rebuild: bool = False
) -> Tuple[Set[str], Set[str], Set[str], List[str], Dict[str, Any]]:
    """
    Generate or load user-disjoint train/val/test splits.
    Asserts zero overlap between all partitions.
    """
    if os.path.exists(manifest_path) and not force_rebuild:
        try:
            with open(manifest_path, "r", encoding="utf-8") as f:
                manifest = json.load(f)
            if manifest.get("seed") == seed:
                train_users = set(manifest["train_users"])
                val_users = set(manifest["val_users"])
                test_users = set(manifest["test_users"])
                test_cohort = manifest["test_cohort_500"]

                # Runtime validation of loaded manifest
                assert len(train_users & val_users) == 0, "Leakage detected: Train & Val overlap!"
                assert len(train_users & test_users) == 0, "Leakage detected: Train & Test overlap!"
                assert len(val_users & test_users) == 0, "Leakage detected: Val & Test overlap!"
                logger.info(f"Loaded existing split manifest from {manifest_path} (zero-overlap verified).")
                return train_users, val_users, test_users, test_cohort, manifest
        except Exception as e:
            logger.warning(f"Failed to load cached manifest: {e}. Rebuilding...")

    logger.info(f"Extracting all unique user IDs from {behaviors_tsv}...")
    all_users = set()
    total_impressions = 0
    with open(behaviors_tsv, "r", encoding="utf-8") as f:
        reader = csv.reader(f, delimiter="\t")
        for row in reader:
            if len(row) >= 2 and row[1].strip():
                all_users.add(row[1].strip())
                total_impressions += 1

    sorted_all_users = sorted(all_users)
    train_users = {u for u in sorted_all_users if split_bucket(u, seed) < 80}
    val_users = {u for u in sorted_all_users if 80 <= split_bucket(u, seed) < 90}
    test_users = {u for u in sorted_all_users if split_bucket(u, seed) >= 90}

    # Strict zero-overlap assertions
    assert len(train_users & val_users) == 0, "CRITICAL ERROR: Train and Val sets overlap!"
    assert len(train_users & test_users) == 0, "CRITICAL ERROR: Train and Test sets overlap!"
    assert len(val_users & test_users) == 0, "CRITICAL ERROR: Val and Test sets overlap!"
    assert len(train_users | val_users | test_users) == len(sorted_all_users), "CRITICAL ERROR: User partition is incomplete!"

    sorted_test_users = sorted(test_users)
    test_cohort_500 = sorted_test_users[:500]

    manifest = {
        "dataset": "MIND-small (behaviors.tsv)",
        "split_methodology": "MD5 Hash-Bucket User Partitioning",
        "seed": seed,
        "hash_formula": "int(md5(f'{seed}_{user_id}'), 16) % 100",
        "bucket_thresholds": {
            "train": "< 80 (80%)",
            "val": "80 <= bucket < 90 (10%)",
            "test": ">= 90 (10%)"
        },
        "user_counts": {
            "total_unique_users": len(sorted_all_users),
            "train_users": len(train_users),
            "val_users": len(val_users),
            "test_users": len(test_users),
            "test_cohort_500": len(test_cohort_500)
        },
        "overlap_counts": {
            "train_val_overlap": len(train_users & val_users),
            "train_test_overlap": len(train_users & test_users),
            "val_test_overlap": len(val_users & test_users)
        },
        "assertions": {
            "user_disjoint_verified": True,
            "zero_overlap_guaranteed": True
        },
        "train_users": sorted(list(train_users)),
        "val_users": sorted(list(val_users)),
        "test_users": sorted(list(test_users)),
        "test_cohort_500": test_cohort_500
    }

    os.makedirs(os.path.dirname(manifest_path), exist_ok=True)
    with open(manifest_path, "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2)

    logger.info(f"Generated split manifest at {manifest_path}")
    logger.info(f"Total Users: {len(sorted_all_users)} | Train: {len(train_users)} | Val: {len(val_users)} | Test: {len(test_users)}")
    return train_users, val_users, test_users, test_cohort_500, manifest


if __name__ == "__main__":
    train_u, val_u, test_u, test_500, mf = build_or_load_user_splits(force_rebuild=True)
    print("\n--- SPLIT SUMMARY ---")
    print(f"Total unique users: {mf['user_counts']['total_unique_users']}")
    print(f"Train users:        {mf['user_counts']['train_users']} ({mf['user_counts']['train_users']/mf['user_counts']['total_unique_users']*100:.2f}%)")
    print(f"Val users:          {mf['user_counts']['val_users']} ({mf['user_counts']['val_users']/mf['user_counts']['total_unique_users']*100:.2f}%)")
    print(f"Test users:         {mf['user_counts']['test_users']} ({mf['user_counts']['test_users']/mf['user_counts']['total_unique_users']*100:.2f}%)")
    print(f"Train-Val Overlap:  {mf['overlap_counts']['train_val_overlap']}")
    print(f"Train-Test Overlap: {mf['overlap_counts']['train_test_overlap']}")
    print(f"Val-Test Overlap:   {mf['overlap_counts']['val_test_overlap']}")
    print(f"Test Cohort (N=500) sampled: {len(test_500)} users")
    print("Zero-overlap verification passed successfully.")
