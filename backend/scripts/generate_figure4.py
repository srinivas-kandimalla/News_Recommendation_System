"""
IEEE Research Paper Figure 4 Generator (AUTHORITATIVE BENCHMARK TRUTH)
Title: Model Performance Comparison (Baseline Heuristic vs Proposed Neural Ranker)
System: Nexora News Recommendation System
Aspect Ratio: Compact IEEE Paper Figure Standard (7.5 in x 4.2 in at 300 DPI)
Source of Truth: backend/evaluation/mind/final_research_results.json
"""

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
import os

OUT_DIR = r"d:\News_Recommendation_System\figures"
os.makedirs(OUT_DIR, exist_ok=True)
OUT_PATH = os.path.join(OUT_DIR, "Model_Performance_Comparison.png")

# Authoritative Data: Baseline Heuristic (Model E) vs Proposed Neural Ranker (Model F)
metrics      = ["AUC", "MRR@10", "NDCG@10", "ILD@10"]
baseline     = [0.6427, 0.3551, 0.4119, 0.8959]
proposed     = [0.6998, 0.3904, 0.4423, 0.9296]

# Recalculated gains from displayed raw values:
# AUC:     (0.6998 - 0.6427) / 0.6427 = +8.88%
# MRR@10:  (0.3904 - 0.3551) / 0.3551 = +9.94%
# NDCG@10: (0.4423 - 0.4119) / 0.4119 = +7.38%
# ILD@10:  (0.9296 - 0.8959) / 0.8959 = +3.76%
improvements = ["+8.88%", "+9.94%", "+7.38%", "+3.76%"]

x = np.arange(len(metrics))
width = 0.32

plt.rcParams.update({
    "font.family": "DejaVu Sans",
    "text.color": "#0f172a",
    "figure.facecolor": "white",
    "axes.facecolor": "white",
})

fig, ax = plt.subplots(figsize=(7.5, 4.2), dpi=300)

# Bars
rects1 = ax.bar(
    x - width / 2 - 0.02, baseline, width,
    label="Baseline Heuristic",
    color="#64748b", hatch="///", edgecolor="#0f172a", linewidth=1.1, zorder=3
)
rects2 = ax.bar(
    x + width / 2 + 0.02, proposed, width,
    label="Proposed Neural Ranker",
    color="#1e293b", hatch="...", edgecolor="#0f172a", linewidth=1.1, zorder=3
)

# Axis labels & Limits
ax.set_ylabel("Metric Value", fontsize=10.5, fontweight="bold", color="#0f172a", labelpad=8)
ax.set_xlabel("Evaluation Metrics", fontsize=10.5, fontweight="bold", color="#0f172a", labelpad=8)
ax.set_xticks(x)
ax.set_xticklabels(metrics, fontsize=10.5, fontweight="bold", color="#0f172a")
ax.set_ylim(0.0, 1.14)

# Gridlines
ax.grid(axis="y", linestyle="--", alpha=0.35, color="#94a3b8", zorder=0)
ax.set_axisbelow(True)

# Spines
ax.spines["top"].set_visible(False)
ax.spines["right"].set_visible(False)
ax.spines["left"].set_color("#1e293b")
ax.spines["bottom"].set_color("#1e293b")
ax.spines["left"].set_linewidth(1.1)
ax.spines["bottom"].set_linewidth(1.1)

# Value annotations & Improvement badges
for i in range(len(metrics)):
    v_e = baseline[i]
    v_f = proposed[i]
    imp = improvements[i]

    # Baseline value label
    ax.text(
        x[i] - width / 2 - 0.02, v_e + 0.018, f"{v_e:.4f}",
        ha="center", va="bottom", fontsize=8.4, fontweight="bold", color="#334155", zorder=5
    )

    # Proposed Neural Ranker value label
    ax.text(
        x[i] + width / 2 + 0.02, v_f + 0.018, f"{v_f:.4f}",
        ha="center", va="bottom", fontsize=8.4, fontweight="bold", color="#0f172a", zorder=5
    )

    # Improvement badge box above Proposed bar
    ax.text(
        x[i] + width / 2 + 0.02, v_f + 0.072, imp,
        ha="center", va="bottom", fontsize=7.8, fontweight="bold", color="#0f172a", zorder=5,
        bbox=dict(boxstyle="square,pad=0.18", facecolor="#f1f5f9", edgecolor="#334155", linewidth=0.8)
    )

# Legend
ax.legend(
    loc="upper left", fontsize=9.2, frameon=True,
    facecolor="#ffffff", edgecolor="#cbd5e1", framealpha=1.0
)

plt.tight_layout()
fig.savefig(OUT_PATH, dpi=300, bbox_inches="tight", facecolor="white", edgecolor="none")
plt.close(fig)
print(f"Generated successfully: {OUT_PATH}")
