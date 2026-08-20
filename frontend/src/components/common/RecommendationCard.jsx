import React, { useState } from 'react';
import {
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Typography,
  Chip,
  Box,
  IconButton,
  Stack,
  Collapse,
  Button,
  LinearProgress,
  Tooltip,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { motion } from 'framer-motion';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import ShareIcon from '@mui/icons-material/Share';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import PublicIcon from '@mui/icons-material/Public';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import PsychofarmacologyIcon from '@mui/icons-material/Psychology';

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=800&q=80';

const RecommendationCard = ({
  news,
  onBookmark,
  onLike,
  onShare,
  onClick,
}) => {
  const theme = useTheme();
  const [bookmarked, setBookmarked] = useState(false);
  const [liked, setLiked] = useState(false);
  const [expanded, setExpanded] = useState(false);

  if (!news) return null;

  const {
    title,
    content,
    category,
    author,
    source,
    image_url,
    created_at,
    semantic_score,
    recency_score,
    popularity_score,
    interest_score,
    hybrid_score,
    reason,
  } = news;

  // Calculate Match %
  const rawScore = hybrid_score ?? semantic_score ?? 0.85;
  const matchPct = Math.round(rawScore * 100);

  const handleBookmarkClick = (e) => {
    e.stopPropagation();
    setBookmarked((prev) => !prev);
    if (onBookmark) onBookmark(news);
  };

  const handleLikeClick = (e) => {
    e.stopPropagation();
    setLiked((prev) => !prev);
    if (onLike) onLike(news);
  };

  const handleShareClick = (e) => {
    e.stopPropagation();
    if (onShare) onShare(news);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3 }}
      style={{ height: '100%' }}
    >
      <Card
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: `${theme.shape.borderRadius * 2.5}px`,
          backgroundColor: theme.palette.background.paper,
          border: `1px solid ${alpha(theme.palette.secondary.main, 0.2)}`,
          boxShadow: theme.shadows[2],
          overflow: 'hidden',
          transition: theme.transitions.create(['box-shadow', 'border-color']),
          '&:hover': {
            boxShadow: theme.shadows[4],
            borderColor: theme.palette.secondary.main,
          },
        }}
      >
        {/* Card Header Media */}
        <Box sx={{ position: 'relative', pt: '50%', overflow: 'hidden' }}>
          <CardMedia
            component="img"
            image={image_url || DEFAULT_IMAGE}
            alt={title}
            onError={(e) => {
              e.target.src = DEFAULT_IMAGE;
            }}
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />

          {/* AI Match Badge */}
          <Chip
            icon={<AutoAwesomeIcon sx={{ fontSize: '14px !important', color: '#FFFFFF' }} />}
            label={`${matchPct}% Match`}
            size="small"
            sx={{
              position: 'absolute',
              top: 12,
              left: 12,
              backgroundColor: theme.palette.secondary.main,
              color: '#FFFFFF',
              fontWeight: 700,
              fontSize: '0.75rem',
              backdropFilter: 'blur(8px)',
              boxShadow: '0 4px 12px rgba(124, 58, 237, 0.3)',
            }}
          />

          {/* Quick Bookmark IconButton */}
          <IconButton
            size="small"
            onClick={handleBookmarkClick}
            sx={{
              position: 'absolute',
              top: 12,
              right: 12,
              backgroundColor: alpha(theme.palette.background.paper, 0.85),
              backdropFilter: 'blur(8px)',
              color: bookmarked ? theme.palette.primary.main : theme.palette.text.secondary,
            }}
          >
            {bookmarked ? <BookmarkIcon fontSize="small" /> : <BookmarkBorderIcon fontSize="small" />}
          </IconButton>
        </Box>

        {/* Card Body */}
        <CardContent sx={{ p: 2.5, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
            <Chip
              label={category || 'General'}
              size="small"
              sx={{
                backgroundColor: alpha(theme.palette.primary.main, 0.08),
                color: theme.palette.primary.main,
                fontWeight: 600,
                fontSize: '0.75rem',
              }}
            />
            <Typography variant="caption" color="text.secondary" fontWeight={500}>
              Confidence: {(rawScore).toFixed(2)}
            </Typography>
          </Stack>

          <Typography
            variant="h6"
            component="h3"
            fontWeight={700}
            onClick={onClick}
            sx={{
              fontSize: '1.05rem',
              lineHeight: 1.35,
              mb: 1,
              cursor: onClick ? 'pointer' : 'default',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              '&:hover': {
                color: theme.palette.primary.main,
              },
            }}
          >
            {title}
          </Typography>

          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              mb: 2,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {content}
          </Typography>

          {/* Highlight Reason Banner */}
          <Box
            sx={{
              p: 1.5,
              borderRadius: `${theme.shape.borderRadius * 1.5}px`,
              backgroundColor: alpha(theme.palette.secondary.main, 0.06),
              borderLeft: `3px solid ${theme.palette.secondary.main}`,
              mb: 2,
            }}
          >
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
              <PsychofarmacologyIcon sx={{ fontSize: 16, color: theme.palette.secondary.main }} />
              <Typography variant="caption" color="secondary" fontWeight={700}>
                AI Reason
              </Typography>
            </Stack>
            <Typography variant="caption" color="text.primary" fontWeight={500} display="block">
              {reason || 'Recommended based on your reading vector and high topic affinity.'}
            </Typography>
          </Box>

          {/* Expandable Technical AI Breakdown */}
          <Box sx={{ mt: 'auto' }}>
            <Button
              size="small"
              onClick={() => setExpanded(!expanded)}
              endIcon={
                <ExpandMoreIcon
                  sx={{
                    transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: theme.transitions.create('transform'),
                  }}
                />
              }
              sx={{
                p: 0,
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '0.75rem',
                color: theme.palette.text.secondary,
                '&:hover': { color: theme.palette.primary.main, backgroundColor: 'transparent' },
              }}
            >
              {expanded ? 'Hide Score Breakdown' : 'View Score Breakdown'}
            </Button>

            <Collapse in={expanded} timeout="auto" unmountOnExit>
              <Box
                sx={{
                  mt: 1.5,
                  p: 1.5,
                  borderRadius: `${theme.shape.borderRadius}px`,
                  backgroundColor: alpha(theme.palette.text.primary, 0.03),
                  border: `1px solid ${theme.palette.divider}`,
                }}
              >
                <Stack spacing={1}>
                  <Box>
                    <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.25 }}>
                      <Typography variant="caption" color="text.secondary">Semantic Similarity (60%)</Typography>
                      <Typography variant="caption" fontWeight={700}>{(semantic_score ?? 0.85).toFixed(2)}</Typography>
                    </Stack>
                    <LinearProgress
                      variant="determinate"
                      value={(semantic_score ?? 0.85) * 100}
                      sx={{ height: 4, borderRadius: 2 }}
                    />
                  </Box>

                  <Box>
                    <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.25 }}>
                      <Typography variant="caption" color="text.secondary">Recency Score (20%)</Typography>
                      <Typography variant="caption" fontWeight={700}>{(recency_score ?? 0.80).toFixed(2)}</Typography>
                    </Stack>
                    <LinearProgress
                      variant="determinate"
                      value={(recency_score ?? 0.80) * 100}
                      color="secondary"
                      sx={{ height: 4, borderRadius: 2 }}
                    />
                  </Box>

                  <Box>
                    <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.25 }}>
                      <Typography variant="caption" color="text.secondary">Popularity Score (10%)</Typography>
                      <Typography variant="caption" fontWeight={700}>{(popularity_score ?? 0.75).toFixed(2)}</Typography>
                    </Stack>
                    <LinearProgress
                      variant="determinate"
                      value={(popularity_score ?? 0.75) * 100}
                      color="success"
                      sx={{ height: 4, borderRadius: 2 }}
                    />
                  </Box>

                  <Box>
                    <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.25 }}>
                      <Typography variant="caption" color="text.secondary">User Affinity (10%)</Typography>
                      <Typography variant="caption" fontWeight={700}>{(interest_score ?? 0.60).toFixed(2)}</Typography>
                    </Stack>
                    <LinearProgress
                      variant="determinate"
                      value={(interest_score ?? 0.60) * 100}
                      color="warning"
                      sx={{ height: 4, borderRadius: 2 }}
                    />
                  </Box>
                </Stack>
              </Box>
            </Collapse>
          </Box>
        </CardContent>

        {/* Card Footer Actions */}
        <CardActions
          sx={{
            px: 2,
            py: 1,
            borderTop: `1px solid ${theme.palette.divider}`,
            justifyContent: 'space-between',
            backgroundColor: alpha(theme.palette.background.default, 0.5),
          }}
        >
          <Stack direction="row" spacing={0.5} alignItems="center">
            <IconButton size="small" onClick={handleLikeClick} color={liked ? 'error' : 'default'}>
              {liked ? <FavoriteIcon fontSize="small" /> : <FavoriteBorderIcon fontSize="small" />}
            </IconButton>
            <IconButton size="small" onClick={handleShareClick}>
              <ShareIcon fontSize="small" />
            </IconButton>
          </Stack>

          <Button
            size="small"
            onClick={onClick}
            endIcon={<ArrowForwardIcon fontSize="small" />}
            sx={{ textTransform: 'none', fontWeight: 600 }}
          >
            Read Article
          </Button>
        </CardActions>
      </Card>
    </motion.div>
  );
};

export default RecommendationCard;
