"""
BENCHMARK: PRE-CONVERTING USER HISTORY EMBEDDINGS TO NUMPY MATRICES
===================================================================
Tests pre-converting user long-term and short-term embedding lists
to contiguous NumPy arrays ONCE vs repeated conversion inside the candidate loop.
"""
import time
import numpy as np

N_cand = 457
N_long = 40
N_short = 10
dim = 384

long_embeddings_list = [np.random.randn(dim).tolist() for _ in range(N_long)]
short_embeddings_list = [np.random.randn(dim).tolist() for _ in range(N_short)]
candidate_embeddings_list = [np.random.randn(dim).tolist() for _ in range(N_cand)]

# Strategy A: Converting Python lists to np.array inside the 457 candidate loop (914 times)
t0 = time.perf_counter()
for c in candidate_embeddings_list:
    c_arr = np.array(c, dtype=np.float32)
    # Long term
    long_mat = np.array(long_embeddings_list, dtype=np.float32)
    long_norms = np.linalg.norm(long_mat, axis=1, keepdims=True)
    # Short term
    short_mat = np.array(short_embeddings_list, dtype=np.float32)
    short_norms = np.linalg.norm(short_mat, axis=1, keepdims=True)
t_loop = (time.perf_counter() - t0) * 1000.0

# Strategy B: Pre-converting user history to pre-normalized unit matrices ONCE
t0 = time.perf_counter()
long_mat_pre = np.array(long_embeddings_list, dtype=np.float32)
long_norms_pre = np.linalg.norm(long_mat_pre, axis=1, keepdims=True)
long_norms_pre = np.where(long_norms_pre == 0, 1.0, long_norms_pre)
long_units_pre = long_mat_pre / long_norms_pre

short_mat_pre = np.array(short_embeddings_list, dtype=np.float32)
short_norms_pre = np.linalg.norm(short_mat_pre, axis=1, keepdims=True)
short_norms_pre = np.where(short_norms_pre == 0, 1.0, short_norms_pre)
short_units_pre = short_mat_pre / short_norms_pre

for c in candidate_embeddings_list:
    c_arr = np.array(c, dtype=np.float32)
    # Uses pre-computed units directly
    s_long = (long_units_pre @ c_arr).flatten()
    s_short = (short_units_pre @ c_arr).flatten()
t_pre = (time.perf_counter() - t0) * 1000.0

print(f"Strategy A (Convert inside loop 914x) : {t_loop:.2f} ms")
print(f"Strategy B (Pre-convert ONCE)         : {t_pre:.2f} ms")
print(f"Speedup Factor                       : {t_loop / t_pre:.1f}x faster (Saved {t_loop - t_pre:.2f} ms)")
