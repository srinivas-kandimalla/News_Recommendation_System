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
  Tooltip,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { motion } from 'framer-motion';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import ShareIcon from '@mui/icons-material/Share';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PublicIcon from '@mui/icons-material/Public';

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=800&q=80';

const NewsCard = ({
  news,
  onBookmark,
  onLike,
  onShare,
  onClick,
  isBookmarked: initialBookmarked = false,
  isLiked: initialLiked = false,
  showReason = false,
}) => {
  const theme = useTheme();
  const [bookmarked, setBookmarked] = useState(initialBookmarked);
  const [liked, setLiked] = useState(initialLiked);
  const [likesCount, setLikesCount] = useState(news?.likes || 0);

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
    hybrid_score,
    trending_score,
    reason,
  } = news;

  // Calculate match percentage if available
  const matchScore = semantic_score
    ? Math.round(semantic_score * 100)
    : hybrid_score
    ? Math.round(hybrid_score * 100)
    : null;

  const handleBookmarkClick = (e) => {
    e.stopPropagation();
    setBookmarked((prev) => !prev);
    if (onBookmark) onBookmark(news);
  };

  const handleLikeClick = (e) => {
    e.stopPropagation();
    setLiked((prev) => {
      const nextState = !prev;
      setLikesCount((count) => (nextState ? count + 1 : Math.max(0, count - 1)));
      return nextState;
    });
    if (onLike) onLike(news);
  };

  const handleShareClick = (e) => {
    e.stopPropagation();
    if (onShare) {
      onShare(news);
    } else if (navigator.share) {
      navigator.share({
        title,
        text: content?.slice(0, 100),
        url: window.location.href,
      }).catch(() => {});
    }
  };

  const formattedDate = created_at
    ? new Date(created_at).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
      })
    : 'Recent';

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      style={{ height: '100%' }}
    >
      <Card
        onClick={onClick}
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: `${theme.shape.borderRadius * 2}px`,
          backgroundColor: theme.palette.background.paper,
          border: `1px solid ${theme.palette.divider}`,
          boxShadow: theme.shadows[1],
          overflow: 'hidden',
          cursor: onClick ? 'pointer' : 'default',
          transition: theme.transitions.create(['box-shadow', 'border-color'], {
            duration: theme.transitions.duration.shorter,
          }),
          '&:hover': {
            boxShadow: theme.shadows[4],
            borderColor: alpha(theme.palette.primary.main, 0.3),
          },
        }}
      >
        {/* Media Container with Overlay Badges */}
        <Box sx={{ position: 'relative', pt: '56.25%', overflow: 'hidden' }}>
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
              transition: 'transform 0.4s ease-in-out',
              '&:hover': {
                transform: 'scale(1.05)',
              },
            }}
          />

          {/* Top Overlay Badges */}
          <Stack
            direction="row"
            spacing={1}
            sx={{
              position: 'absolute',
              top: 12,
              left: 12,
              zIndex: 2,
            }}
          >
            {trending_score && trending_score > 0.5 && (
              <Chip
                icon={<TrendingUpIcon sx={{ fontSize: '14px !important', color: '#FFFFFF' }} />}
                label="Trending"
                size="small"
                sx={{
                  backgroundColor: theme.palette.warning.main,
                  color: '#FFFFFF',
                  fontWeight: 600,
                  fontSize: '0.725rem',
                  backdropFilter: 'blur(8px)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                }}
              />
            )}
            {matchScore && matchScore >= 80 && (
              <Chip
                icon={<AutoAwesomeIcon sx={{ fontSize: '14px !important', color: '#FFFFFF' }} />}
                label="AI Recommended"
                size="small"
                sx={{
                  backgroundColor: theme.palette.secondary.main,
                  color: '#FFFFFF',
                  fontWeight: 600,
                  fontSize: '0.725rem',
                  backdropFilter: 'blur(8px)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                }}
              />
            )}
          </Stack>

          {/* Top Right Quick Bookmark Button */}
          <IconButton
            size="small"
            onClick={handleBookmarkClick}
            sx={{
              position: 'absolute',
              top: 12,
              right: 12,
              zIndex: 2,
              backgroundColor: alpha(theme.palette.background.paper, 0.85),
              backdropFilter: 'blur(8px)',
              color: bookmarked ? theme.palette.primary.main : theme.palette.text.secondary,
              '&:hover': {
                backgroundColor: theme.palette.background.paper,
                color: theme.palette.primary.main,
              },
            }}
          >
            {bookmarked ? <BookmarkIcon fontSize="small" /> : <BookmarkBorderIcon fontSize="small" />}
          </IconButton>
        </Box>

        {/* Card Main Body Content */}
        <CardContent sx={{ p: 2.5, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
          {/* Category Chip & Match Score Row */}
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.5 }}>
            {category && (
              <Chip
                label={category}
                size="small"
                sx={{
                  backgroundColor: alpha(theme.palette.primary.main, 0.08),
                  color: theme.palette.primary.main,
                  fontWeight: 600,
                  fontSize: '0.75rem',
                  borderRadius: `${theme.shape.borderRadius}px`,
                  textTransform: 'capitalize',
                }}
              />
            )}
            {matchScore !== null && (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                  backgroundColor: alpha(theme.palette.success.main, 0.1),
                  color: theme.palette.success.main,
                  px: 1,
                  py: 0.25,
                  borderRadius: `${theme.shape.borderRadius}px`,
                }}
              >
                <AutoAwesomeIcon sx={{ fontSize: 13 }} />
                <Typography variant="caption" fontWeight={700}>
                  {matchScore}% Match
                </Typography>
              </Box>
            )}
          </Stack>

          {/* Title */}
          <Typography
            variant="h6"
            component="h3"
            sx={{
              fontFamily: theme.typography.h6.fontFamily,
              fontWeight: 600,
              fontSize: '1.05rem',
              lineHeight: 1.35,
              color: theme.palette.text.primary,
              mb: 1,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {title}
          </Typography>

          {/* Excerpt Content */}
          {content && (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                mb: 2,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                lineHeight: 1.5,
              }}
            >
              {content}
            </Typography>
          )}

          {/* AI Reason Banner if enabled */}
          {showReason && reason && (
            <Box
              sx={{
                mt: 'auto',
                mb: 1.5,
                p: 1.25,
                borderRadius: `${theme.shape.borderRadius}px`,
                backgroundColor: alpha(theme.palette.secondary.main, 0.06),
                borderLeft: `3px solid ${theme.palette.secondary.main}`,
              }}
            >
              <Typography variant="caption" color="text.secondary" fontWeight={500} display="block">
                ✨ {reason}
              </Typography>
            </Box>
          )}

          {/* Source & Metadata Footer */}
          <Box sx={{ mt: 'auto', pt: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <PublicIcon sx={{ fontSize: 14, color: theme.palette.text.secondary }} />
              <Typography variant="caption" color="text.secondary" fontWeight={500}>
                {source || author || 'NewsPulse'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                •
              </Typography>
              <Stack direction="row" alignItems="center" spacing={0.5}>
                <AccessTimeIcon sx={{ fontSize: 12, color: theme.palette.text.secondary }} />
                <Typography variant="caption" color="text.secondary">
                  {formattedDate}
                </Typography>
              </Stack>
            </Stack>
          </Box>
        </CardContent>

        {/* Card Action Controls Footer */}
        <CardActions
          sx={{
            px: 2,
            py: 1,
            borderTop: `1px solid ${theme.palette.divider}`,
            justify: 'space-between',
            backgroundColor: alpha(theme.palette.background.default, 0.5),
          }}
        >
          <Stack direction="row" spacing={0.5} alignItems="center">
            <Tooltip title={liked ? 'Unlike' : 'Like'}>
              <IconButton size="small" onClick={handleLikeClick} color={liked ? 'error' : 'default'}>
                {liked ? <FavoriteIcon fontSize="small" /> : <FavoriteBorderIcon fontSize="small" />}
              </IconButton>
            </Tooltip>
            <Typography variant="caption" color="text.secondary" fontWeight={600}>
              {likesCount}
            </Typography>
          </Stack>

          <Stack direction="row" spacing={0.5}>
            <Tooltip title="Share">
              <IconButton size="small" onClick={handleShareClick}>
                <ShareIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
        </CardActions>
      </Card>
    </motion.div>
  );
};

export default NewsCard;
