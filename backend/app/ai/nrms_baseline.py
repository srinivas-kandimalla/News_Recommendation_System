"""
NRMS-Lite Neural Baseline (Neural News Recommendation with Multi-Head Self-Attention)
=====================================================================================
Reference: Chuhan Wu et al., "Neural News Recommendation with Multi-Head Self-Attention", EMNLP 2019.

This module implements a standard NRMS-style baseline operating on the exact same:
  - 384-dimensional semantic news embeddings (all-MiniLM-L6-v2)
  - User history (up to M=50 items)
  - User-disjoint train/validation/test split
  - Canonical 500-user test cohort

Architecture:
  - User Encoder:
      1. Multi-Head Self-Attention over history representations: MultiheadAttention(embed_dim=384, num_heads=4)
      2. Additive Attention Pooling over transformed history states to obtain user representation u in R^384
  - Candidate Scoring:
      Inner product s(u, c) = u^T c
"""
import torch
import torch.nn as nn
import torch.nn.functional as F
import numpy as np
from typing import Optional, Tuple


class AdditiveAttention(nn.Module):
    """Additive attention mechanism for pooling sequence representations into a single vector."""
    def __init__(self, embed_dim: int = 384, hidden_dim: int = 200):
        super(AdditiveAttention, self).__init__()
        self.proj = nn.Linear(embed_dim, hidden_dim)
        self.query = nn.Linear(hidden_dim, 1, bias=False)

    def forward(self, x: torch.Tensor, mask: Optional[torch.Tensor] = None) -> torch.Tensor:
        """
        Args:
            x: (batch_size, seq_len, embed_dim)
            mask: (batch_size, seq_len) boolean tensor where True = masked out (padding)
        Returns:
            pooled: (batch_size, embed_dim)
        """
        # (batch_size, seq_len, hidden_dim)
        h = torch.tanh(self.proj(x))
        # (batch_size, seq_len, 1) -> (batch_size, seq_len)
        scores = self.query(h).squeeze(-1)

        if mask is not None:
            scores = scores.masked_fill(mask, -1e9)

        weights = F.softmax(scores, dim=-1) # (batch_size, seq_len)
        weights = weights.unsqueeze(-1)      # (batch_size, seq_len, 1)

        pooled = torch.sum(x * weights, dim=1) # (batch_size, embed_dim)
        return pooled


class NRMSLite(nn.Module):
    """
    NRMS-Lite baseline model.
    News representations are pretrained 384-dim sentence transformers embeddings.
    User history is processed via Multi-Head Self-Attention followed by Additive Attention Pooling.
    Candidate score is the inner product between user representation and candidate embedding.
    """
    def __init__(self, embed_dim: int = 384, num_heads: int = 4, hidden_dim: int = 200, dropout: float = 0.2):
        super(NRMSLite, self).__init__()
        self.embed_dim = embed_dim
        self.num_heads = num_heads
        
        # Multi-head self-attention over news history
        self.multihead_self_att = nn.MultiheadAttention(
            embed_dim=embed_dim,
            num_heads=num_heads,
            dropout=dropout,
            batch_first=True
        )
        self.layer_norm = nn.LayerNorm(embed_dim)
        self.dropout = nn.Dropout(p=dropout)
        self.user_att = AdditiveAttention(embed_dim=embed_dim, hidden_dim=hidden_dim)

    def forward_user(self, history_embs: torch.Tensor, history_mask: Optional[torch.Tensor] = None) -> torch.Tensor:
        """
        Args:
            history_embs: (batch_size, seq_len, embed_dim)
            history_mask: (batch_size, seq_len) True for padding items
        Returns:
            user_vec: (batch_size, embed_dim)
        """
        # If sequence length is 0 or all masked, return zeros
        if history_embs.size(1) == 0:
            return torch.zeros(history_embs.size(0), self.embed_dim, device=history_embs.device)

        att_out, _ = self.multihead_self_att(
            query=history_embs,
            key=history_embs,
            value=history_embs,
            key_padding_mask=history_mask
        )
        x = self.layer_norm(history_embs + self.dropout(att_out))
        user_vec = self.user_att(x, mask=history_mask)
        return user_vec

    def forward(self, history_embs: torch.Tensor, candidate_embs: torch.Tensor, history_mask: Optional[torch.Tensor] = None) -> torch.Tensor:
        """
        Args:
            history_embs: (batch_size, seq_len, embed_dim)
            candidate_embs: (batch_size, embed_dim)
            history_mask: (batch_size, seq_len)
        Returns:
            logits: (batch_size, 1)
        """
        user_vec = self.forward_user(history_embs, history_mask) # (batch_size, embed_dim)
        # Dot product score
        score = torch.sum(user_vec * candidate_embs, dim=1, keepdim=True) # (batch_size, 1)
        return score
