import { useState } from 'react';
import { Box, Collapse, IconButton, Tooltip, Typography } from '@mui/material';
import { AutoAwesomeRounded, InfoOutlined } from '@mui/icons-material';

/**
 * Maps raw backend reason strings or scores to human-readable qualitative labels.
 * Does NOT expose raw ML scores to users.
 */
function qualityLabel(score) {
  if (!score && score !== 0) return null;
  if (score >= 0.75) return 'Strong match';
  if (score >= 0.5) return 'Good match';
  return 'Worth a look';
}

function humanizeReason(reason, score) {
  if (!reason) return qualityLabel(score);
  // Map common backend reason strings to friendly copy
  if (/trending/i.test(reason)) return 'Currently trending';
  if (/reading.*history|recent.*read|you.*read/i.test(reason)) return 'Related to something you read recently';
  if (/interest|category/i.test(reason)) return `Matches your interests`;
  if (/similar|semantic/i.test(reason)) return 'Semantically similar to your recent reads';
  if (/popular/i.test(reason)) return 'Popular with readers like you';
  if (/fresh|published|new/i.test(reason)) return reason; // keep fresh/time-based reasons
  return reason.length > 60 ? reason.slice(0, 60) + '…' : reason;
}

export default function RecommendationReason({ reason, score, showExpand = false }) {
  const [open, setOpen] = useState(false);
  const displayReason = humanizeReason(reason, score);
  const scoreLabel = qualityLabel(score);

  if (!displayReason && !scoreLabel) return null;

  return (
    <Box sx={{ mt: 'auto', pt: 1.5 }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0.75,
          color: 'primary.main',
        }}
      >
        <AutoAwesomeRounded sx={{ fontSize: 13, opacity: 0.8 }} />
        <Typography
          variant="caption"
          sx={{
            color: 'primary.main',
            fontWeight: 600,
            opacity: 0.85,
            flex: 1,
            fontSize: '0.72rem',
            letterSpacing: '0.01em',
          }}
        >
          {displayReason || scoreLabel}
        </Typography>
        {showExpand && scoreLabel && (
          <Tooltip title="Why this?">
            <IconButton
              size="small"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen((v) => !v); }}
              aria-label="Why this recommendation?"
              aria-expanded={open}
              sx={{ p: 0.25, opacity: 0.6, '&:hover': { opacity: 1 } }}
            >
              <InfoOutlined sx={{ fontSize: 14 }} />
            </IconButton>
          </Tooltip>
        )}
      </Box>
      {showExpand && (
        <Collapse in={open}>
          <Box
            sx={{
              mt: 0.75,
              p: 1.25,
              borderRadius: 1.5,
              bgcolor: 'action.hover',
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Typography variant="caption" color="text.secondary" display="block">
              <strong style={{ color: 'inherit' }}>{scoreLabel}</strong>
              {displayReason && ` — ${displayReason}`}
            </Typography>
          </Box>
        </Collapse>
      )}
    </Box>
  );
}
