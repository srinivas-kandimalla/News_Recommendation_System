import React, { useState } from 'react';
import { Card, CardContent, Typography, Box, Stack, Collapse, IconButton } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import LightbulbIcon from '@mui/icons-material/Lightbulb';

const ExplanationCard = ({
  reason = "Recommended based on your reading history.",
  matchScore = 96,
  title = "Why This News?",
  expandable = true,
}) => {
  const theme = useTheme();
  const [expanded, setExpanded] = useState(false);

  return (
    <Card
      sx={{
        borderRadius: `${theme.shape.borderRadius * 2}px`,
        backgroundColor: alpha(theme.palette.secondary.main, 0.04),
        border: `1px solid ${alpha(theme.palette.secondary.main, 0.2)}`,
        boxShadow: theme.shadows[1],
        p: 0.5,
      }}
    >
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 36,
                height: 36,
                borderRadius: '50%',
                backgroundColor: alpha(theme.palette.secondary.main, 0.12),
                color: theme.palette.secondary.main,
              }}
            >
              <LightbulbIcon sx={{ fontSize: 20 }} />
            </Box>
            <Box>
              <Typography variant="subtitle2" fontWeight={700} color="text.primary">
                {title}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                AI Personalization Engine
              </Typography>
            </Box>
          </Stack>

          {matchScore && (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                backgroundColor: theme.palette.success.main,
                color: '#FFFFFF',
                px: 1.25,
                py: 0.5,
                borderRadius: `${theme.shape.borderRadius * 2}px`,
                fontWeight: 700,
                fontSize: '0.75rem',
                boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)',
              }}
            >
              <AutoAwesomeIcon sx={{ fontSize: 13 }} />
              {matchScore}% Match
            </Box>
          )}
        </Stack>

        <Box
          sx={{
            mt: 2,
            p: 1.5,
            borderRadius: `${theme.shape.borderRadius * 1.5}px`,
            backgroundColor: theme.palette.background.paper,
            border: `1px solid ${theme.palette.divider}`,
          }}
        >
          <Typography variant="body2" color="text.primary" fontWeight={500} lineHeight={1.5}>
            ✨ {reason}
          </Typography>

          {expandable && (
            <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography
                variant="caption"
                color="secondary"
                fontWeight={600}
                onClick={() => setExpanded(!expanded)}
                sx={{ cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
              >
                {expanded ? 'Hide details' : 'How this score was calculated'}
              </Typography>
              <IconButton
                size="small"
                onClick={() => setExpanded(!expanded)}
                sx={{
                  transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: theme.transitions.create('transform'),
                }}
              >
                <ExpandMoreIcon fontSize="small" />
              </IconButton>
            </Box>
          )}

          <Collapse in={expanded} timeout="auto" unmountOnExit>
            <Box sx={{ pt: 1.5, mt: 1, borderTop: `1px dashed ${theme.palette.divider}` }}>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
                • <strong>Semantic Similarity:</strong> High relevance to your recent tech articles.
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
                • <strong>User Affinity:</strong> Frequently read topic category.
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block">
                • <strong>Freshness & Popularity:</strong> Breaking story trending today.
              </Typography>
            </Box>
          </Collapse>
        </Box>
      </CardContent>
    </Card>
  );
};

export default ExplanationCard;
