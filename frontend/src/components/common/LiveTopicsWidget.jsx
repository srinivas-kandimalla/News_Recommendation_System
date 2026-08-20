import React from 'react';
import { Card, CardContent, Typography, Box, Stack, Chip } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import TagIcon from '@mui/icons-material/Tag';
import { useNavigate } from 'react-router-dom';

const TOPICS = [
  { name: '#ArtificialIntelligence', count: '34 articles' },
  { name: '#GlobalMarkets', count: '28 articles' },
  { name: '#TechInnovations', count: '21 articles' },
  { name: '#ClimateChange', count: '18 articles' },
  { name: '#CyberSecurity', count: '15 articles' },
];

const LiveTopicsWidget = ({ onSelectTopic }) => {
  const theme = useTheme();
  const navigate = useNavigate();

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
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 32,
              height: 32,
              borderRadius: '50%',
              backgroundColor: alpha(theme.palette.secondary.main, 0.1),
              color: theme.palette.secondary.main,
            }}
          >
            <TagIcon fontSize="small" />
          </Box>
          <Typography variant="h6" fontSize="1rem" fontWeight={700} color="text.primary">
            Live Trending Topics
          </Typography>
        </Stack>

        <Stack spacing={1}>
          {TOPICS.map((topic) => (
            <Box
              key={topic.name}
              onClick={() => {
                const keyword = topic.name.replace('#', '');
                if (onSelectTopic) onSelectTopic(keyword);
                else navigate(`/?search=${encodeURIComponent(keyword)}`);
              }}
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                p: 1,
                borderRadius: `${theme.shape.borderRadius * 1.5}px`,
                cursor: 'pointer',
                transition: theme.transitions.create(['background-color'], {
                  duration: theme.transitions.duration.shorter,
                }),
                '&:hover': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.05),
                },
              }}
            >
              <Typography variant="body2" fontWeight={600} color="text.primary">
                {topic.name}
              </Typography>
              <Chip
                label={topic.count}
                size="small"
                sx={{
                  height: 20,
                  fontSize: '0.7rem',
                  backgroundColor: theme.palette.action.hover,
                  color: theme.palette.text.secondary,
                }}
              />
            </Box>
          ))}
        </Stack>
      </CardContent>
    </Card>
  );
};

export default LiveTopicsWidget;
