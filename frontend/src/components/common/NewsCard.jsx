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

const formatDate = (dateVal) => {
  if (!dateVal) return null;
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return null;

    const now = new Date();
    const diffMs = now - d;

    if (diffMs < -60000) return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    if (diffMs < 0) return 'Just now';

    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 60) return `${Math.max(1, diffMins)}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;

    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return null;
  }
};

const getArticleDate = (news) => {
  if (!news) return null;
  const dateVal = news.published || news.published_at || news.created_at || news.date;
  return formatDate(dateVal);
};

const getArticleSource = (news) => {
  if (!news) return 'Nexora';
  const raw = typeof news === 'string' ? news : (news?.source || news?.author || '');
  return raw.split('-')[0].split('|')[0].trim() || 'Nexora';
};

const cleanSnippet = (str, sourceName = '') => {
  const cleanSource = getArticleSource(sourceName);
  const fallbackText = cleanSource !== 'Nexora'
    ? `Read the latest coverage from ${cleanSource}.`
    : 'Read the full article coverage for complete details.';

  if (!str || typeof str !== 'string') return fallbackText;

  let clean = str;

  // 1. Remove raw HTML tags
  clean = clean.replace(/<[^>]*>?/gm, '');

  // 2. Remove character count annotations (e.g. [+1234 chars])
  clean = clean.replace(/\s*\[\+?\d+\s+chars\]/gi, '');

  // 3. Detect known scraper/header navigation garbage artifacts
  const navGarbagePattern = /(?:SearchSections|SectionsSections|SubscribeSubscribe|CloseSubscribe|Crosswords\s*&\s*Puzzles|Subscriber\s*Only|Subscriber\s*only|query=evt|x-on:|Mashable\s*101|g_displayableSlots|Search\s*Mashable|Appearance\s*\(BETA\)|Skip\s*to\s*content|Cookie\s*Policy|Privacy\s*Notice|Sign\s*in\s*to\s*read|Copyright\s*©|All\s*rights\s*reserved)/i;

  if (navGarbagePattern.test(clean)) {
    return fallbackText;
  }

  // 4. Detect concatenated navigation words (e.g. "SearchSections", "SectionsSubscribe", "SubscribeClose")
  if (/(?:Search|Sections|Subscribe|Close|Home|Latest|Menu|Nav|Navigation|Account|Profile){2,}/i.test(clean)) {
    return fallbackText;
  }

  // 5. Detect repeated standalone nav words (e.g. "Subscribe Subscribe", "Sections Sections")
  if (/\b(Subscribe|Search|Sections|Menu|Home|Latest|Close)\b(?:\s+\b\1\b)+/i.test(clean)) {
    return fallbackText;
  }

  // 6. Clean leading non-alphanumeric noise
  clean = clean.replace(/^[^a-zA-Z0-9"'(“]+/g, '');
  clean = clean.replace(/\s+/g, ' ').trim();

  // 7. Detect high density of navigation keywords in short snippet
  const navKeywordMatches = clean.match(/\b(Search|Sections|Subscribe|Close|Home|Latest|Menu|Crosswords|Puzzles|Subscriber|Sign in)\b/gi);
  if (navKeywordMatches && navKeywordMatches.length >= 3) {
    return fallbackText;
  }

  // 8. If text is too short or empty
  if (clean.length < 25) {
    return fallbackText;
  }

  return clean;
};

const Meta = ({ source, author, published, published_at, created_at, date, news, sx }) => {
  const theme = useTheme();
  const articleObj = news || { source, author, published, published_at, created_at, date };
  const cleanSrc = getArticleSource(articleObj);
  const displayDate = getArticleDate(articleObj);

  return (
    <Typography
      variant="caption"
      sx={{ color: theme.palette.text.secondary, fontFamily: '"Inter", sans-serif', fontWeight: 500, ...sx }}
    >
      {cleanSrc}{displayDate ? ` · ${displayDate}` : ''}
    </Typography>
  );
};

// ── FEATURED — horizontal on desktop, stacked on mobile ───
const FeaturedCard = ({ news, onBookmark, onLike, onClick, isBookmarked, isLiked }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [bookmarked, setBookmarked] = useState(!!isBookmarked);
  const [liked, setLiked] = useState(!!isLiked);
  const { title, content, category, source, author, image_url, created_at } = news;
  const accent = isDark ? '#38BDF8' : '#2563EB';

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
        borderRadius: '14px',
        overflow: 'hidden',
        backgroundColor: theme.palette.background.paper,
        boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.4)' : '0 1px 3px rgba(0,0,0,0.05), 0 6px 16px rgba(15,23,42,0.04)',
        transition: 'all 0.25s ease',
        '&:hover': {
          borderColor: isDark ? 'rgba(56, 189, 248, 0.4)' : 'rgba(37, 99, 235, 0.3)',
          boxShadow: isDark ? '0 8px 25px rgba(0,0,0,0.5)' : '0 8px 20px rgba(15,23,42,0.08)',
        },
        '&:hover .feat-img': { transform: 'scale(1.03)' },
      }}
    >
      {/* Image */}
      <Box
        sx={{
          width: { xs: '100%', md: '52%' },
          aspectRatio: { xs: '16/9', md: 'unset' },
          minHeight: { md: 280 },
          maxHeight: { md: 380 },
          overflow: 'hidden',
          flexShrink: 0,
          backgroundColor: theme.palette.divider,
          position: 'relative',
        }}
      >
        {/* Glassmorphic Featured Badge */}
        <Box
          sx={{
            position: 'absolute',
            top: 14,
            left: 14,
            zIndex: 2,
            px: 1.5,
            py: 0.5,
            borderRadius: '6px',
            bgcolor: isDark ? 'rgba(15, 23, 42, 0.85)' : 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(10px)',
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.15)' : 'rgba(15,23,42,0.1)'}`,
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            display: 'flex',
            alignItems: 'center',
            gap: 0.75,
          }}
        >
          <Box
            sx={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              bgcolor: accent,
            }}
          />
          <Typography
            sx={{
              fontFamily: '"Inter", sans-serif',
              fontWeight: 700,
              fontSize: '0.65rem',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: theme.palette.text.primary,
            }}
          >
            Featured Insight
          </Typography>
        </Box>

        <Box
          component="img"
          src={image_url || DEFAULT_IMAGE}
          alt={title}
          className="feat-img"
          onError={(e) => { e.target.src = DEFAULT_IMAGE; }}
          sx={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
            transform: 'scale(1.08)',
            transition: 'transform 0.35s ease',
          }}
        />
      </Box>

      {/* Text panel */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          p: { xs: 2.5, md: 3 },
          minWidth: 0,
        }}
      >
        {/* Top: category + source + headline + excerpt */}
        <Box>
          <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap" sx={{ mb: 1.25 }}>
            {category && (
              <Typography sx={{
                fontFamily: '"Inter", sans-serif',
                fontWeight: 700,
                fontSize: '0.72rem',
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
            fontFamily: '"Plus Jakarta Sans", "Inter", sans-serif',
            fontWeight: 800,
            fontSize: { xs: '1.25rem', md: '1.45rem', lg: '1.6rem' },
            lineHeight: 1.25,
            color: theme.palette.text.primary,
            letterSpacing: '-0.02em',
            mb: 1.5,
          }}>
            {title}
          </Typography>

          {content && (
            <Typography variant="body2" sx={{
              color: theme.palette.text.secondary,
              lineHeight: 1.6,
              fontSize: '0.9rem',
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
              px: 2,
              py: 0.8,
              borderRadius: '8px',
              cursor: 'pointer',
              fontFamily: '"Inter", sans-serif',
              fontWeight: 600,
              fontSize: '0.8125rem',
              color: isDark ? '#38BDF8' : '#0F172A',
              border: `1px solid ${theme.palette.divider}`,
              mr: 'auto',
              transition: 'all 0.2s ease',
              '&:hover': {
                borderColor: accent,
                bgcolor: isDark ? 'rgba(56, 189, 248, 0.1)' : 'rgba(15, 23, 42, 0.05)',
              },
            }}
          >
            Read story
          </Box>
          <Tooltip title={liked ? 'Unlike' : 'Like'}>
            <IconButton size="small" onClick={stopAndLike}
              sx={{ color: liked ? (isDark ? '#38BDF8' : '#2563EB') : theme.palette.text.secondary, borderRadius: '8px' }}>
              {liked ? <FavoriteIcon sx={{ fontSize: 18 }} /> : <FavoriteBorderIcon sx={{ fontSize: 18 }} />}
            </IconButton>
          </Tooltip>
          <Tooltip title={bookmarked ? 'Remove bookmark' : 'Bookmark'}>
            <IconButton size="small" onClick={stopAndBookmark}
              sx={{ color: bookmarked ? theme.palette.text.primary : theme.palette.text.secondary, borderRadius: '8px' }}>
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
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: '12px',
        p: 2,
        backgroundColor: theme.palette.background.paper,
        boxShadow: theme.palette.mode === 'dark' ? '0 4px 14px rgba(0,0,0,0.3)' : '0 1px 3px rgba(0,0,0,0.04)',
        transition: 'all 0.2s ease',
        '&:hover': {
          borderColor: theme.palette.mode === 'dark' ? 'rgba(56, 189, 248, 0.4)' : 'rgba(37, 99, 235, 0.3)',
          transform: 'translateY(-2px)',
          boxShadow: theme.palette.mode === 'dark' ? '0 6px 20px rgba(0,0,0,0.4)' : '0 4px 12px rgba(15,23,42,0.08)',
        },
        '&:hover .std-img': { transform: 'scale(1.04)' },
      }}
    >
      {/* Image — Fixed aspect frame so images stay clean & aligned */}
      <Box sx={{
        width: '100%',
        height: 180,
        overflow: 'hidden',
        borderRadius: '8px',
        mb: 1.5,
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
          fontSize: '1.05rem',
          lineHeight: 1.3,
          color: theme.palette.text.primary,
          mb: 0.75,
          minHeight: 44,
          display: '-webkit-box',
          WebkitLineClamp: 2,
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
