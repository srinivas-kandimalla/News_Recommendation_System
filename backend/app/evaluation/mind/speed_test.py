"""
Speed test — writes results directly to file, bypasses pipe buffering.
"""
import os, sys, csv, json, time, logging, numpy as np
logging.basicConfig(level=logging.WARNING)

LOG = "D:/News_Recommendation_System/backend/evaluation/mind/speed_test_result.txt"

DATA_DIR   = "D:/News_Recommendation_System/backend/evaluation/mind/data"
CACHE_DIR  = "D:/News_Recommendation_System/backend/evaluation/mind/cache"
CACHE_META = CACHE_DIR + "/news_meta.json"
CACHE_EMBS = CACHE_DIR + "/news_embs.npy"
BEH_TSV    = DATA_DIR  + "/behaviors.tsv"

def out(msg=""):
    print(msg, flush=True)
    with open(LOG, "a", encoding="utf-8") as f:
        f.write(msg + "\n")
        f.flush()

# Clear log
open(LOG, "w").close()
out("NEXORA SPEED TEST — Original Evaluator")
out("=" * 50)

from app.evaluation.mind.evaluator import evaluate_mind_behavior_impression

with open(CACHE_META, "r", encoding="utf-8") as f:
    meta = json.load(f)
embs = np.load(CACHE_EMBS)
news_dict = {}
for idx, (nid, info) in enumerate(meta.items()):
    news_dict[nid] = {
        "news_id": nid, "category": info["category"],
        "subcategory": info.get("subcategory",""),
        "title": info.get("title",""), "abstract": info.get("abstract",""),
        "embedding": embs[idx]
    }
out(f"Cache loaded: {len(news_dict)} articles")

all_behaviors = []
total_candidates = 0
with open(BEH_TSV, "r", encoding="utf-8") as f:
    reader = csv.reader(f, delimiter="\t")
    for row in reader:
        if len(row) < 5: continue
        history_ids = row[3].strip().split() if row[3].strip() else []
        candidates, labels = [], []
        for item in row[4].strip().split():
            if "-" in item:
                nid, lbl = item.rsplit("-", 1)
                candidates.append(nid); labels.append(int(lbl))
        if candidates and labels:
            all_behaviors.append({"impression_id": row[0], "user_id": row[1],
                                   "timestamp": row[2], "history": history_ids,
                                   "candidates": candidates, "labels": labels})

user_behavior_map = {}
for b in all_behaviors:
    uid = b["user_id"]
    if uid not in user_behavior_map: user_behavior_map[uid] = []
    user_behavior_map[uid].append(b)

all_unique_users = sorted(list(user_behavior_map.keys()))
out(f"Total unique users: {len(all_unique_users)}")

# Test exactly 500 users
TEST_N = 500
test_users = all_unique_users[:TEST_N]

out(f"\nRunning {TEST_N}-user speed test...")
t0 = time.time()
impressions_done = 0
candidates_done  = 0
skipped = 0

for uid in test_users:
    for b in user_behavior_map[uid]:
        if not b["history"]:
            skipped += 1; continue
        res = evaluate_mind_behavior_impression(b, news_dict)
        if res is None:
            skipped += 1; continue
        impressions_done += 1
        candidates_done  += len(b["candidates"])

elapsed = time.time() - t0

out(f"\nSPEED TEST RESULTS")
out(f"=" * 50)
out(f"  Users tested     : {TEST_N}")
out(f"  Impressions done : {impressions_done}")
out(f"  Candidates proc  : {candidates_done}")
out(f"  Skipped          : {skipped}")
out(f"  Elapsed          : {elapsed:.2f}s")
out(f"  Throughput:")
out(f"    Users/sec      : {TEST_N/elapsed:.3f}")
out(f"    Impr/sec       : {impressions_done/elapsed:.3f}")
out(f"    Cands/sec      : {candidates_done/elapsed:.1f}")

# Extrapolate
scale = len(all_unique_users) / TEST_N
est_total_impr = impressions_done * scale
est_total_sec  = elapsed * scale
out(f"\n  EXTRAPOLATION to {len(all_unique_users)} users:")
out(f"    Est total impr : {est_total_impr:.0f}")
out(f"    Est total time : {est_total_sec:.0f}s  = {est_total_sec/60:.1f} min  = {est_total_sec/3600:.2f} hrs")
out(f"\nDONE")
