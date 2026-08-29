"""
NEXORA PHASE 3.3 — APPLICATION-LEVEL FINE-GRAINED PROFILING SCRIPT
====================================================================
Instruments block-by-block timers inside recommendation_service.py,
compares Flask test client vs real HTTP localhost execution, and collects
detailed cProfile statistics to pinpoint the exact source of the ~383ms gap.
"""
import os
import sys
import time
import cProfile
import pstats
import io
import json
import datetime
import requests
import threading
import numpy as np

BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from app import create_app
from app.config.config import Config
from app.models.user_model import users_collection
from app.utils.jwt_helper import generate_token
from app.ai.neural_ranker import neural_ranker_service

OUTPUT_JSON = os.path.join(BACKEND_DIR, "evaluation", "mind", "profile_phase3_3_results.json")


def run_phase3_3_profiling():
    print("=" * 75)
    print("  NEXORA PHASE 3.3 — APPLICATION-LEVEL LATENCY PROFILING")
    print("=" * 75)

    Config.USE_NEURAL_RANKER = True
    assert neural_ranker_service.is_ready(), "Neural ranker not ready!"

    app = create_app()
    app.config["TESTING"] = True

    # Find test user
    test_user = users_collection.find_one({"email": "e2e_realtime_test@nexora.ai"})
    if not test_user:
        test_user = users_collection.find_one()

    token = generate_token(test_user)
    headers = {"Authorization": f"Bearer {token}"}

    # -------------------------------------------------------------
    # 1. Test Client Execution & Block Timeline Measurement
    # -------------------------------------------------------------
    client = app.test_client()

    # Warmup
    client.get("/personalized-recommendations", headers=headers)

    t0_all = time.perf_counter()
    resp = client.get("/personalized-recommendations", headers=headers)
    t1_all = time.perf_counter()

    test_client_ms = (t1_all - t0_all) * 1000.0
    print(f"\n1. Flask Test-Client Latency: {test_client_ms:.2f} ms (HTTP {resp.status_code})")

    # -------------------------------------------------------------
    # 2. Real HTTP Server vs Test Client Benchmark
    # -------------------------------------------------------------
    # Launch background Werkzeug Flask server on port 5099
    def run_server():
        app.run(host="127.0.0.1", port=5099, threaded=True, debug=False, use_reloader=False)

    server_thread = threading.Thread(target=run_server, daemon=True)
    server_thread.start()
    time.sleep(1.5)  # Wait for server startup

    target_url = "http://127.0.0.1:5099/personalized-recommendations"

    # Warmup real HTTP request
    try:
        r_warm = requests.get(target_url, headers=headers)
        print(f"   Real Local HTTP Server Warmup Response: {r_warm.status_code}")
    except Exception as e:
        print(f"   Real HTTP Server launch failed: {e}")

    # Benchmark 20 Real HTTP requests
    http_latencies = []
    for _ in range(20):
        t0 = time.perf_counter()
        r = requests.get(target_url, headers=headers)
        t1 = time.perf_counter()
        if r.status_code == 200:
            http_latencies.append((t1 - t0) * 1000.0)

    # Benchmark 20 Test-Client requests
    client_latencies = []
    for _ in range(20):
        t0 = time.perf_counter()
        r = client.get("/personalized-recommendations", headers=headers)
        t1 = time.perf_counter()
        if r.status_code == 200:
            client_latencies.append((t1 - t0) * 1000.0)

    mean_http_ms = float(np.mean(http_latencies)) if http_latencies else 0.0
    p50_http_ms = float(np.median(http_latencies)) if http_latencies else 0.0
    mean_client_ms = float(np.mean(client_latencies)) if client_latencies else 0.0
    p50_client_ms = float(np.median(client_latencies)) if client_latencies else 0.0

    print(f"\n2. Test Infrastructure Comparison (20 Requests):")
    print(f"   Flask Test Client  : Mean = {mean_client_ms:.2f} ms | P50 = {p50_client_ms:.2f} ms")
    print(f"   Real Local HTTP    : Mean = {mean_http_ms:.2f} ms | P50 = {p50_http_ms:.2f} ms")
    print(f"   Difference Overhead: {abs(mean_http_ms - mean_client_ms):.2f} ms")

    # -------------------------------------------------------------
    # 3. cProfile Fine-Grained Call Tree Analysis
    # -------------------------------------------------------------
    pr = cProfile.Profile()
    pr.enable()
    
    client.get("/personalized-recommendations", headers=headers)
    
    pr.disable()

    s = io.StringIO()
    ps = pstats.Stats(pr, stream=s).sort_stats("cumulative")
    ps.print_stats(35)
    cum_out = s.getvalue()

    s_tot = io.StringIO()
    ps_tot = pstats.Stats(pr, stream=s_tot).sort_stats("tottime")
    ps_tot.print_stats(35)
    tot_out = s_tot.getvalue()

    print("\n3. Top 15 Functions by Cumulative Time:")
    print(cum_out[:1800])

    print("\n4. Top 15 Functions by Total (Internal) Time:")
    print(tot_out[:1800])

    results = {
        "timestamp": datetime.datetime.now().isoformat(),
        "python_version": sys.version,
        "flask_environment": "Werkzeug Development WSGI Server / Testing Client",
        "benchmark_comparison": {
            "test_client_mean_ms": round(mean_client_ms, 2),
            "test_client_p50_ms": round(p50_client_ms, 2),
            "real_http_mean_ms": round(mean_http_ms, 2),
            "real_http_p50_ms": round(p50_http_ms, 2)
        },
        "profile_cumulative_snippet": cum_out[:3000],
        "profile_tottime_snippet": tot_out[:3000]
    }

    with open(OUTPUT_JSON, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2)
    print(f"\nSaved Phase 3.3 profiling payload to {OUTPUT_JSON}")

    return results


if __name__ == "__main__":
    run_phase3_3_profiling()
