import React, { useState } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Stack,
  Tooltip,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import FavoriteIcon from '@mui/icons-material/Favorite';

const DEFAULT_IMAGE =
  'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=800&q=80';

const cleanSnippet = (str) => {
  if (!str) return '';
  let clean = str;

  // Decode basic HTML entities
  clean = clean
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ');

  // Remove web navigation boilerplate / promo header artifacts
  clean = clean.replace(/^[A-Z0-9_\-\s|]{3,40}(Home|News|Share|Like|Follow|Google|Yahoo|Bursa).*?(Google|Yahoo|KUALA|REUTERS|AP|AFP|—|-|:)\s*/gi, '');
  clean = clean.replace(/Make .*? your preferred source on Google\s*/gi, '');
  clean = clean.replace(/Follow us on .*?\s*/gi, '');
  clean = clean.replace(/Click here to .*?\s*/gi, '');

  // Strip [+1234 chars] trailer
  clean = clean.replace(/\s*\[\+?\d+\s+chars\]/gi, '');

  return clean.trim();
};

const formatDate = (dateStr) => {
  if (!dateStr) return 'Just now';
  try {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now - d;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 60 && diffMins >= 0) return `${Math.max(1, diffMins)}m ago`;
    if (diffHours < 24 && diffHours > 0) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7 && diffDays > 1) return `${diffDays}d ago`;

    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch (e) {
    return 'Recent';
  }
};

const Meta = ({ source, author, created_at, sx }) => {
  const theme = useTheme();
  const rawSrc = source || author || '';
  const cleanSrc = rawSrc.split('-')[0].split('|')[0].trim() || 'Nexora';
  const displayDate = formatDate(created_at);

  return (
    <Typography
      variant="caption"
      sx={{ color: theme.palette.text.secondary, fontFamily: '"Inter", sans-serif', ...sx }}
    >
      {cleanSrc} · {displayDate}
    </Typography>
  );
};

// ── FEATURED — horizontal on desktop, stacked on mobile ───
// Headline always visible without scrolling
const FeaturedCard = ({ news, onBookmark, onLike, onClick, isBookmarked, isLiked }) => {
  const theme = useTheme();
  const [bookmarked, setBookmarked] = useState(!!isBookmarked);
  const [liked, setLiked] = useState(!!isLiked);
  const { title, content, category, source, author, image_url, created_at } = news;
  const accent = theme.palette.accent?.main || '#C0392B';

  const stopAndBookmark = (e) => { e.stopPropagation(); setBookmarked((p) => !p); onBookmark?.(news); };
  const stopAndLike = (e) => { e.stopPropagation(); setLiked((p) => !p); onLike?.(news); };
  const stopAndRead = (e) => { e.stopPropagation(); onClick?.(); };

  return (
    <Box
      onClick={onClick}
      sx={{
        cursor: onClick ? 'pointer' : 'default',
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' },
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: '4px',
        overflow: 'hidden',
        backgroundColor: theme.palette.background.paper,
        transition: 'border-color 0.15s ease',
        '&:hover': { borderColor: theme.palette.text.secondary },
        '&:hover .feat-img': { transform: 'scale(1.03)' },
      }}
    >
      {/* Image */}
      <Box
        sx={{
          width: { xs: '100%', md: '56%' },
          aspectRatio: { xs: '16/9', md: 'unset' },
          minHeight: { md: 260 },
          maxHeight: { md: 400 },
          overflow: 'hidden',
          flexShrink: 0,
          backgroundColor: theme.palette.divider,
        }}
      >
        <Box
          component="img"
          src={image_url || DEFAULT_IMAGE}
          alt={title}
          className="feat-img"
          onError={(e) => { e.target.src = DEFAULT_IMAGE; }}
          sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform 0.35s ease' }}
        />
      </Box>

      {/* Text panel */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          p: { xs: 2, md: 2.5 },
          minWidth: 0,
        }}
      >
        {/* Top: category + source + headline + excerpt */}
        <Box>
          <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap" sx={{ mb: 1 }}>
            {category && (
              <Typography sx={{
                fontFamily: '"Inter", sans-serif',
                fontWeight: 700,
                fontSize: '0.6875rem',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: accent,
              }}>
                {category}
              </Typography>
            )}
            {category && (
              <Box sx={{ width: 3, height: 3, borderRadius: '50%', bgcolor: theme.palette.divider, flexShrink: 0 }} />
            )}
            <Meta source={source} author={author} created_at={created_at} />
          </Stack>

          <Typography sx={{
            fontFamily: '"Playfair Display", Georgia, serif',
            fontWeight: 700,
            fontSize: { xs: '1.3rem', md: '1.5rem', lg: '1.75rem' },
            lineHeight: 1.25,
            color: theme.palette.text.primary,
            mb: 1.25,
          }}>
            {title}
          </Typography>

          {content && (
            <Typography variant="body2" sx={{
              color: theme.palette.text.secondary,
              lineHeight: 1.65,
              display: '-webkit-box',
              WebkitLineClamp: { xs: 2, md: 3 },
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              mb: 2,
            }}>
              {cleanSnippet(content)}
            </Typography>
          )}
        </Box>

        {/* Bottom: actions */}
        <Stack direction="row" alignItems="center" spacing={0.5}>
          <Box
            onClick={stopAndRead}
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              px: 1.75,
              py: 0.75,
              border: `1px solid ${theme.palette.text.primary}`,
              borderRadius: '4px',
              cursor: 'pointer',
              fontFamily: '"Inter", sans-serif',
              fontWeight: 500,
              fontSize: '0.8125rem',
              color: theme.palette.text.primary,
              mr: 'auto',
              transition: 'all 0.15s ease',
              '&:hover': { bgcolor: theme.palette.text.primary, color: theme.palette.background.paper },
            }}
          >
            Read article
          </Box>
          <Tooltip title={liked ? 'Unlike' : 'Like'}>
            <IconButton size="small" onClick={stopAndLike}
              sx={{ color: liked ? '#C0392B' : theme.palette.text.secondary, borderRadius: '4px' }}>
              {liked ? <FavoriteIcon sx={{ fontSize: 18 }} /> : <FavoriteBorderIcon sx={{ fontSize: 18 }} />}
            </IconButton>
          </Tooltip>
          <Tooltip title={bookmarked ? 'Remove bookmark' : 'Bookmark'}>
            <IconButton size="small" onClick={stopAndBookmark}
              sx={{ color: bookmarked ? theme.palette.text.primary : theme.palette.text.secondary, borderRadius: '4px' }}>
              {bookmarked ? <BookmarkIcon sx={{ fontSize: 18 }} /> : <BookmarkBorderIcon sx={{ fontSize: 18 }} />}
            </IconButton>
          </Tooltip>
        </Stack>
      </Box>
    </Box>
  );
};

// ── STANDARD — 3-column grid card ─────────────────────────
const StandardCard = ({ news, onBookmark, onLike, onClick, isBookmarked, isLiked, showReason }) => {
  const theme = useTheme();
  const [bookmarked, setBookmarked] = useState(!!isBookmarked);
  const [liked, setLiked] = useState(!!isLiked);
  const { title, content, category, source, author, image_url, created_at, reason } = news;

  const stopAndBookmark = (e) => { e.stopPropagation(); setBookmarked((p) => !p); onBookmark?.(news); };
  const stopAndLike = (e) => { e.stopPropagation(); setLiked((p) => !p); onLike?.(news); };

  return (
    <Box
      onClick={onClick}
      sx={{
        cursor: onClick ? 'pointer' : 'default',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderBottom: `1px solid ${theme.palette.divider}`,
        pb: 2,
        '&:hover .std-img': { transform: 'scale(1.03)' },
      }}
    >
      {/* Image */}
      <Box sx={{
        width: '100%',
        aspectRatio: '16/9',
        overflow: 'hidden',
        borderRadius: '4px',
        mb: 1.25,
        backgroundColor: theme.palette.divider,
        flexShrink: 0,
      }}>
        <Box
          component="img"
          src={image_url || DEFAULT_IMAGE}
          alt={title}
          className="std-img"
          onError={(e) => { e.target.src = DEFAULT_IMAGE; }}
          sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform 0.3s ease' }}
        />
      </Box>

      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {category && (
          <Typography sx={{
            fontFamily: '"Inter", sans-serif',
            fontWeight: 700,
            fontSize: '0.6875rem',
            letterSpacing: '0.07em',
            textTransform: 'uppercase',
            color: theme.palette.accent?.main || '#C0392B',
            display: 'block',
            mb: 0.5,
          }}>
            {category}
          </Typography>
        )}

        <Typography sx={{
          fontFamily: '"Playfair Display", Georgia, serif',
          fontWeight: 700,
          fontSize: '1.0625rem',
          lineHeight: 1.3,
          color: theme.palette.text.primary,
          mb: 0.75,
          display: '-webkit-box',
          WebkitLineClamp: 3,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}>
          {title}
        </Typography>

        {showReason && reason && (
          <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontStyle: 'italic', mb: 0.75, display: 'block' }}>
            {reason}
          </Typography>
        )}

        <Box sx={{ mt: 'auto' }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Meta source={source} author={author} created_at={created_at} />
            <Stack direction="row" spacing={0} alignItems="center">
              <IconButton size="small" onClick={stopAndLike}
                sx={{ color: liked ? '#C0392B' : theme.palette.text.secondary }}>
                {liked ? <FavoriteIcon sx={{ fontSize: 14 }} /> : <FavoriteBorderIcon sx={{ fontSize: 14 }} />}
              </IconButton>
              <IconButton size="small" onClick={stopAndBookmark}
                sx={{ color: bookmarked ? theme.palette.text.primary : theme.palette.text.secondary }}>
                {bookmarked ? <BookmarkIcon sx={{ fontSize: 14 }} /> : <BookmarkBorderIcon sx={{ fontSize: 14 }} />}
              </IconButton>
            </Stack>
          </Stack>
        </Box>
      </Box>
    </Box>
  );
};

// ── COMPACT — ranked row, no image ────────────────────────
const CompactCard = ({ news, rankIndex, onBookmark, onClick, isBookmarked }) => {
  const theme = useTheme();
  const [bookmarked, setBookmarked] = useState(!!isBookmarked);
  const { title, source, author, created_at } = news;
  const rank = rankIndex !== undefined ? String(rankIndex).padStart(2, '0') : null;

  const stopAndBookmark = (e) => { e.stopPropagation(); setBookmarked((p) => !p); onBookmark?.(news); };

  return (
    <Box
      onClick={onClick}
      sx={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 1.5,
        cursor: onClick ? 'pointer' : 'default',
        py: 1.5,
        borderBottom: `1px solid ${theme.palette.divider}`,
        '&:hover .compact-title': { color: theme.palette.accent?.main || '#C0392B' },
      }}
    >
      {rank && (
        <Typography sx={{
          fontFamily: '"Playfair Display", Georgia, serif',
          fontWeight: 800,
          fontSize: '1.25rem',
          lineHeight: 1,
          color: theme.palette.divider,
          minWidth: 28,
          flexShrink: 0,
          mt: 0.25,
        }}>
          {rank}
        </Typography>
      )}

      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography
          className="compact-title"
          sx={{
            fontFamily: '"Inter", sans-serif',
            fontWeight: 600,
            fontSize: '0.875rem',
            lineHeight: 1.4,
            color: theme.palette.text.primary,
            mb: 0.5,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            transition: 'color 0.15s ease',
          }}
        >
          {title}
        </Typography>
        <Meta source={source} author={author} created_at={created_at} />
      </Box>

      <IconButton size="small" onClick={stopAndBookmark}
        sx={{ color: bookmarked ? theme.palette.text.primary : theme.palette.text.secondary, flexShrink: 0, mt: -0.5 }}>
        {bookmarked ? <BookmarkIcon sx={{ fontSize: 15 }} /> : <BookmarkBorderIcon sx={{ fontSize: 15 }} />}
      </IconButton>
    </Box>
  );
};

// ── Main dispatcher ───────────────────────────────────────
const NewsCard = ({
  news,
  variant = 'standard',
  rankIndex,
  onBookmark,
  onLike,
  onClick,
  isBookmarked = false,
  isLiked = false,
  showReason = false,
}) => {
  if (!news) return null;
  if (variant === 'featured')
    return <FeaturedCard news={news} onBookmark={onBookmark} onLike={onLike} onClick={onClick} isBookmarked={isBookmarked} isLiked={isLiked} />;
  if (variant === 'compact')
    return <CompactCard news={news} rankIndex={rankIndex} onBookmark={onBookmark} onClick={onClick} isBookmarked={isBookmarked} />;
  return <StandardCard news={news} onBookmark={onBookmark} onLike={onLike} onClick={onClick} isBookmarked={isBookmarked} isLiked={isLiked} showReason={showReason} />;
};

export default NewsCard;
