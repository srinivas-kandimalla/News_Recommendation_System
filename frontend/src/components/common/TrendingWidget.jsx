import React from 'react';
import { Card, CardContent, Typography, Box, Stack, Avatar, Button } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { useNavigate } from 'react-router-dom';

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=400&q=80';

const TrendingWidget = ({ items = [] }) => {
  const theme = useTheme();
  const navigate = useNavigate();

  const displayItems = items.slice(0, 4);

  return (
    <Card
      sx={{
        borderRadius: `${theme.shape.borderRadius * 2}px`,
        backgroundColor: theme.palette.background.paper,
        border: `1px solid ${theme.palette.divider}`,
        boxShadow: theme.shadows[1],
        p: 0.5,
      }}
    >
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 32,
                height: 32,
                borderRadius: '50%',
                backgroundColor: alpha(theme.palette.warning.main, 0.12),
                color: theme.palette.warning.main,
              }}
            >
              <TrendingUpIcon fontSize="small" />
            </Box>
            <Typography variant="h6" fontSize="1rem" fontWeight={700} color="text.primary">
              Trending Now
            </Typography>
          </Stack>

          <Button
            size="small"
            endIcon={<ArrowForwardIcon fontSize="small" />}
            onClick={() => navigate('/trending')}
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.8rem',
              color: theme.palette.primary.main,
            }}
          >
            View all
          </Button>
        </Stack>

        <Stack spacing={1.5}>
          {displayItems.length > 0 ? (
            displayItems.map((item, index) => (
              <Box
                key={item._id || index}
                onClick={() => navigate(`/news/${item._id}`)}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  p: 1,
                  borderRadius: `${theme.shape.borderRadius * 1.5}px`,
                  cursor: 'pointer',
                  transition: theme.transitions.create(['background-color'], {
                    duration: theme.transitions.duration.shorter,
                  }),
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.04),
                  },
                }}
              >
                <Typography
                  variant="subtitle2"
                  fontWeight={800}
                  sx={{
                    minWidth: 20,
                    color: index === 0 ? theme.palette.warning.main : theme.palette.text.secondary,
                    textAlign: 'center',
                  }}
                >
                  {index + 1}
                </Typography>

                <Avatar
                  variant="rounded"
                  src={item.image_url || DEFAULT_IMAGE}
                  alt={item.title}
                  sx={{ width: 52, height: 52, borderRadius: `${theme.shape.borderRadius}px` }}
                />

                <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                  <Typography
                    variant="body2"
                    fontWeight={600}
                    color="text.primary"
                    sx={{
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      lineHeight: 1.3,
                      fontSize: '0.875rem',
                    }}
                  >
                    {item.title}
                  </Typography>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }}>
                    <Typography variant="caption" color="primary" fontWeight={600}>
                      {item.category || 'General'}
                    </Typography>
                    {item.reads && (
                      <Typography variant="caption" color="text.secondary">
                        • {item.reads} reads
                      </Typography>
                    )}
                  </Stack>
                </Box>
              </Box>
            ))
          ) : (
            <Typography variant="caption" color="text.secondary" textAlign="center" sx={{ py: 2 }}>
              No trending news available right now.
            </Typography>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
};

export default TrendingWidget;
