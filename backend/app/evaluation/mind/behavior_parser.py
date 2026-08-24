import os
import csv
import logging
from app.evaluation.mind.config import MINDConfig

logger = logging.getLogger(__name__)


def parse_mind_behaviors_tsv(tsv_path=None, max_behaviors=None):
    """
    Parse behaviors.tsv and return structured impression behavior records.
    
    Columns in behaviors.tsv:
      0: Impression ID
      1: User ID
      2: Timestamp
      3: History (space-separated news IDs)
      4: Impressions (space-separated news-ID-label pairs, e.g. N123-0 N456-1)
    """
    if tsv_path is None:
        tsv_path = MINDConfig.BEHAVIORS_TSV
    if max_behaviors is None:
        max_behaviors = MINDConfig.MAX_USERS

    if not os.path.exists(tsv_path):
        logger.warning(f"behaviors.tsv not found at path: {tsv_path}")
        return []

    behaviors = []

    with open(tsv_path, "r", encoding="utf-8") as f:
        reader = csv.reader(f, delimiter="\t")
        for row in reader:
            if len(row) < 5:
                continue

            imp_id = row[0]
            user_id = row[1]
            time_str = row[2]
            history_raw = row[3].strip()
            impressions_raw = row[4].strip()

            history_ids = history_raw.split() if history_raw else []

            # Parse impression candidates and 0/1 click labels
            candidates = []
            labels = []
            for item in impressions_raw.split():
                if "-" in item:
                    nid, lbl = item.rsplit("-", 1)
                    candidates.append(nid)
                    labels.append(int(lbl))

            if candidates and labels:
                behaviors.append({
                    "impression_id": imp_id,
                    "user_id": user_id,
                    "timestamp": time_str,
                    "history": history_ids,
                    "candidates": candidates,
                    "labels": labels
                })

            if max_behaviors and len(behaviors) >= max_behaviors:
                break

    return behaviors
