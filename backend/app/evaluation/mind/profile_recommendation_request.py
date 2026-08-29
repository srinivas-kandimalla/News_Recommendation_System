"""
NEXORA PHASE 3.1 — HIGH-RESOLUTION PROFILING & REQUEST TIMELINE AUDIT
=======================================================================
Instruments the complete GET /personalized-recommendations request path
with high-resolution timers and cProfile statistics to identify the exact source
of the ~1.28 second Python latency gap.
"""
import os
import sys
import time
import cProfile
import pstats
import io
import json
import datetime
import numpy as np

BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from app import create_app
from app.config.config import Config
from app.models.user_model import users_collection
from app.models.reading_history_model import reading_history_collection
from app.models.news_model import news_collection
from app.utils.jwt_helper import generate_token
from app.ai.neural_ranker import neural_ranker_service

OUTPUT_JSON = os.path.join(BACKEND_DIR, "evaluation", "mind", "profile_request_results.json")


def profile_recommendation_request():
    print("=" * 75)
    print("  NEXORA PHASE 3.1 — HIGH-RESOLUTION PROFILING & REQUEST TIMELINE AUDIT")
    print("=" * 75)

    Config.USE_NEURAL_RANKER = True
    app = create_app()
    app.config["TESTING"] = True
    client = app.test_client()

    # Find test user
    test_user = users_collection.find_one({"email": "e2e_realtime_test@nexora.ai"})
    if not test_user:
        test_user = users_collection.find_one()

    token = generate_token(test_user)
    auth_headers = {"Authorization": f"Bearer {token}"}

    # 1. Instrument High-Resolution Step-by-Step Request Timeline
    timeline = {}
    
    t_start = time.perf_counter()
    
    # Warm up first request
    client.get("/personalized-recommendations", headers=auth_headers)
    t_warmup = time.perf_counter()
    timeline["warmup_ms"] = round((t_warmup - t_start) * 1000.0, 2)

    # cProfile run on single request
    pr = cProfile.Profile()
    pr.enable()
    
    t0_req = time.perf_counter()
    resp = client.get("/personalized-recommendations", headers=auth_headers)
    t1_req = time.perf_counter()
    
    pr.disable()
    
    total_req_ms = (t1_req - t0_req) * 1000.0
    print(f"Instrumented Recommendation Request Total Latency: {total_req_ms:.2f} ms (HTTP {resp.status_code})")

    # Analyze cProfile stats
    s = io.StringIO()
    ps = pstats.Stats(pr, stream=s).sort_stats("cumulative")
    ps.print_stats(30)
    profile_out = s.getvalue()
    print("\n--- TOP 30 CUMULATIVE TIME FUNCTIONS ---")
    print(profile_out[:2500])

    s_t = io.StringIO()
    ps_t = pstats.Stats(pr, stream=s_t).sort_stats("tottime")
    ps_t.print_stats(30)
    profile_tot_out = s_t.getvalue()
    print("\n--- TOP 30 TOTAL (INTERNAL) TIME FUNCTIONS ---")
    print(profile_tot_out[:2500])

    # Extract top functions by total time
    top_functions_tot = []
    for func, (cc, nc, tt, ct, callers) in list(ps_t.stats.items())[:30]:
        filename, line, func_name = func
        top_functions_tot.append({
            "function": f"{func_name} ({os.path.basename(filename)}:{line})",
            "calls": nc,
            "total_time_sec": round(tt, 4),
            "cumulative_time_sec": round(ct, 4)
        })

    payload = {
        "timestamp": datetime.datetime.now().isoformat(),
        "total_request_latency_ms": round(total_req_ms, 2),
        "top_cumulative_functions": profile_out[:4000],
        "top_tottime_functions": profile_tot_out[:4000]
    }

    with open(OUTPUT_JSON, "w", encoding="utf-8") as f:
        json.dump(payload, f, indent=2)
    print(f"\nSaved profiling output to {OUTPUT_JSON}")

    return payload


if __name__ == "__main__":
    profile_recommendation_request()
