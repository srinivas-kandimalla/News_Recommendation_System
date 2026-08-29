"""
NEXORA PHASE 3.5 — REPEATED BENCHMARK & VARIANCE AUDIT
======================================================
Executes 3 consecutive 100-request warm REST API benchmarks on identical inputs
to measure run-to-run CPU scheduling variance and establish statistical confidence.
"""
import os
import sys
import time
import json
import numpy as np

BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from app import create_app
from app.config.config import Config
from app.models.user_model import users_collection
from app.utils.jwt_helper import generate_token
from app.ai.neural_ranker import neural_ranker_service

OUTPUT_JSON = os.path.join(BACKEND_DIR, "evaluation", "mind", "repeated_benchmark_results.json")


def run_repeated_benchmarks():
    print("=" * 75)
    print("  NEXORA PHASE 3.5 — 3 REPEATED 100-REQUEST BENCHMARKS")
    print("=" * 75)

    Config.USE_NEURAL_RANKER = True
    assert neural_ranker_service.is_ready(), "Neural ranker not ready!"

    app = create_app()
    app.config["TESTING"] = True
    client = app.test_client()

    test_user = users_collection.find_one({"email": "e2e_realtime_test@nexora.ai"})
    if not test_user:
        test_user = users_collection.find_one()

    token = generate_token(test_user)
    headers = {"Authorization": f"Bearer {token}"}

    # Cold start warmup
    client.get("/personalized-recommendations", headers=headers)

    runs = []
    for run_idx in range(1, 4):
        print(f"\nExecuting Benchmark Run #{run_idx} (100 warm requests)...")
        latencies = []
        t0_run = time.time()
        for _ in range(100):
            t0 = time.perf_counter()
            r = client.get("/personalized-recommendations", headers=headers)
            t1 = time.perf_counter()
            if r.status_code == 200:
                latencies.append((t1 - t0) * 1000.0)
        t_total = time.time() - t0_run

        mean_v = float(np.mean(latencies))
        p50_v = float(np.median(latencies))
        p90_v = float(np.percentile(latencies, 90))
        p95_v = float(np.percentile(latencies, 95))
        p99_v = float(np.percentile(latencies, 99))
        tput_v = float(len(latencies) / t_total)

        print(f"  Run #{run_idx} Results: Mean={mean_v:.2f}ms | P50={p50_v:.2f}ms | P90={p90_v:.2f}ms | P95={p95_v:.2f}ms | P99={p99_v:.2f}ms | Throughput={tput_v:.2f} req/s")

        runs.append({
            "run_index": run_idx,
            "requests": len(latencies),
            "mean_ms": round(mean_v, 2),
            "p50_ms": round(p50_v, 2),
            "p90_ms": round(p90_v, 2),
            "p95_ms": round(p95_v, 2),
            "p99_ms": round(p99_v, 2),
            "throughput": round(tput_v, 2)
        })

    all_means = [r["mean_ms"] for r in runs]
    all_p50s = [r["p50_ms"] for r in runs]
    all_p99s = [r["p99_ms"] for r in runs]

    summary = {
        "runs": runs,
        "overall_mean_across_runs_ms": round(float(np.mean(all_means)), 2),
        "overall_p50_across_runs_ms": round(float(np.mean(all_p50s)), 2),
        "overall_p99_across_runs_ms": round(float(np.mean(all_p99s)), 2),
        "run_to_run_variance_std_ms": round(float(np.std(all_means)), 2)
    }

    print(f"\nOverall 3-Run Summary: Mean={summary['overall_mean_across_runs_ms']}ms | Std={summary['run_to_run_variance_std_ms']}ms")

    with open(OUTPUT_JSON, "w", encoding="utf-8") as f:
        json.dump(summary, f, indent=2)

    return summary


if __name__ == "__main__":
    run_repeated_benchmarks()
