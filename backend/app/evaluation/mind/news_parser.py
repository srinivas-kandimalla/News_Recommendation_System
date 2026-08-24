import os
import csv
import json
import logging
import numpy as np
from sentence_transformers import SentenceTransformer
from app.evaluation.mind.config import MINDConfig

import torch

logger = logging.getLogger(__name__)

_model_instance = None


def get_embedding_model():
    global _model_instance
    if _model_instance is None:
        torch.set_num_threads(8)
        _model_instance = SentenceTransformer("all-MiniLM-L6-v2")
    return _model_instance


def parse_mind_news_tsv(tsv_path=None, cache_dir=None):
    """
    Parse news.tsv and return a dictionary of news metadata and SentenceTransformer embeddings.
    
    Columns in news.tsv:
      0: News ID
      1: Category
      2: Subcategory
      3: Title
      4: Abstract
      5: URL
      6: Title Entities
      7: Abstract Entities
    """
    if tsv_path is None:
        tsv_path = MINDConfig.NEWS_TSV
    if cache_dir is None:
        cache_dir = MINDConfig.MIND_CACHE_DIR

    if not os.path.exists(tsv_path):
        logger.warning(f"news.tsv not found at path: {tsv_path}")
        return {}

    os.makedirs(cache_dir, exist_ok=True)
    cache_meta_path = os.path.join(cache_dir, "news_meta.json")
    cache_embs_path = os.path.join(cache_dir, "news_embs.npy")

    # Return cached embeddings if available
    if os.path.exists(cache_meta_path) and os.path.exists(cache_embs_path):
        with open(cache_meta_path, "r", encoding="utf-8") as f:
            meta = json.load(f)
        embs = np.load(cache_embs_path)
        
        news_dict = {}
        for idx, (news_id, info) in enumerate(meta.items()):
            news_dict[news_id] = {
                "news_id": news_id,
                "category": info["category"],
                "subcategory": info["subcategory"],
                "title": info["title"],
                "abstract": info["abstract"],
                "embedding": embs[idx]
            }
        return news_dict

    # Parse TSV
    news_dict = {}
    titles_to_embed = []
    news_ids_order = []

    with open(tsv_path, "r", encoding="utf-8") as f:
        reader = csv.reader(f, delimiter="\t")
        for row in reader:
            if len(row) < 5:
                continue
            news_id = row[0]
            category = row[1]
            subcategory = row[2]
            title = row[3]
            abstract = row[4]

            text = f"{title} {abstract}".strip()

            news_dict[news_id] = {
                "news_id": news_id,
                "category": category,
                "subcategory": subcategory,
                "title": title,
                "abstract": abstract,
                "text": text
            }
            news_ids_order.append(news_id)
            titles_to_embed.append(text)

    if not news_dict:
        return {}

    # Generate embeddings
    print(f"Generating embeddings for {len(titles_to_embed)} news articles with batch_size=256...")
    model = get_embedding_model()
    embeddings = model.encode(titles_to_embed, show_progress_bar=False, batch_size=256)
    print(f"Finished generating embeddings ({embeddings.shape}).")

    meta_cache = {}
    for idx, news_id in enumerate(news_ids_order):
        news_dict[news_id]["embedding"] = embeddings[idx]
        meta_cache[news_id] = {
            "category": news_dict[news_id]["category"],
            "subcategory": news_dict[news_id]["subcategory"],
            "title": news_dict[news_id]["title"],
            "abstract": news_dict[news_id]["abstract"]
        }

    # Save cache
    print(f"Saving embedding cache to {cache_dir}...")
    with open(cache_meta_path, "w", encoding="utf-8") as f:
        json.dump(meta_cache, f, indent=2)
    np.save(cache_embs_path, embeddings)
    print("Embedding cache saved successfully.")

    return news_dict
