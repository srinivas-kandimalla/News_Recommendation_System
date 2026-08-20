import { alpha, Box, Card, CardActionArea, CardContent, Chip, IconButton, Stack, Tooltip, Typography } from '@mui/material';
import {
  BookmarkBorderRounded, BookmarkRounded,
  ThumbUpAltOutlined, ThumbDownAltOutlined,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { formatDate, truncate } from '../../utils/formatters';
import SignalEdge from './SignalEdge';
import RecommendationReason from './RecommendationReason';

function ImagePlaceholder({ category }) {
  const colors = {
    Technology: ['#0EA5E9', '#0284C7'],
    Science: ['#8B5CF6', '#7C3AED'],
    Business: ['#F59E0B', '#D97706'],
    Sports: ['#22C55E', '#16A34A'],
    Entertainment: ['#EC4899', '#DB2777'],
    Health: ['#14B8A6', '#0D9488'],
    Politics: ['#6366F1', '#4F46E5'],
    World: ['#F97316', '#EA580C'],
  };
  const [from, to] = colors[category] || ['#00C2E0', '#0090B0'];
  return (
    <Box
      sx={{
        background: `linear-gradient(135deg, ${from} 0%, ${to} 100%)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        flexShrink: 0,
      }}
    >
      <Typography
        sx={{
          fontWeight: 800,
          fontSize: '0.65rem',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          opacity: 0.9,
        }}
      >
        {category || 'NEWS'}
      </Typography>
    </Box>
  );
}

/**
 * Standard recommendation card — horizontal layout (desktop), vertical (mobile).
 * Has SignalEdge when it's a recommendation (has hybrid_score).
 */
export default function NewsCard({
  news,
  bookmarked = false,
  onBookmark,
  showMetrics = false,
  priority = false,
}) {
  const navigate = useNavigate();
  const id = news._id || news.id;
  const isRecommendation = news.hybrid_score !== undefined || news.semantic_score !== undefined;
  const score = news.hybrid_score ?? news.semantic_score ?? 0;

  const handleAction = (callback) => (e) => {
    e.preventDefault();
    e.stopPropagation();
    callback?.(news);
  };

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
        pl: isRecommendation ? { sm: '3px', xs: 0 } : 0,
        pt: isRecommendation ? { xs: '3px', sm: 0 } : 0,
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: (theme) =>
            theme.palette.mode === 'dark'
              ? '0 8px 32px rgba(0,0,0,0.4)'
              : '0 8px 32px rgba(0,0,0,0.10)',
        },
      }}
    >
      {isRecommendation && <SignalEdge score={score} />}

      <CardActionArea
        onClick={() => navigate(`/news/${id}`)}
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'stretch',
        }}
      >
        {/* Image */}
        {news.image_url ? (
          <Box
            component="img"
            src={news.image_url}
            alt=""
            loading={priority ? 'eager' : 'lazy'}
            sx={{
              width: '100%',
              height: 180,
              objectFit: 'cover',
              flexShrink: 0,
              display: 'block',
            }}
            onError={(e) => { e.target.style.display = 'none'; }}
          />
        ) : (
          <Box sx={{ height: 180, flexShrink: 0 }}>
            <ImagePlaceholder category={news.category} />
          </Box>
        )}

        <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', pb: 1 }}>
          {/* Category + date */}
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
            <Chip
              label={news.category || 'General'}
              size="small"
              color="primary"
              sx={{ height: 20, fontSize: '0.68rem' }}
            />
            <Typography variant="caption" color="text.disabled" noWrap>
              {formatDate(news.created_at)}
            </Typography>
          </Stack>

          {/* Title */}
          <Typography
            variant="h6"
            sx={{
              fontWeight: 650,
              lineHeight: 1.35,
              fontSize: '0.95rem',
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              mb: 0.75,
            }}
          >
            {news.title || 'Untitled story'}
          </Typography>

          {/* Excerpt */}
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              fontSize: '0.8rem',
              lineHeight: 1.55,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              mb: 1,
            }}
          >
            {truncate(news.content || '', 140)}
          </Typography>

          {/* Recommendation reason */}
          {isRecommendation && (
            <RecommendationReason
              reason={news.reason}
              score={score}
              showExpand
            />
          )}
        </CardContent>
      </CardActionArea>

      {/* Actions */}
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ px: 1.5, pb: 1.25, pt: 0 }}
      >
        <Typography variant="caption" color="text.disabled" noWrap sx={{ maxWidth: 140 }}>
          {news.source || news.author || ''}
        </Typography>
        <Stack direction="row" spacing={0} alignItems="center">
          {showMetrics && (
            <Typography variant="caption" color="text.disabled" sx={{ mr: 0.5 }}>
              {news.reads || 0} reads
            </Typography>
          )}
          {onBookmark && (
            <Tooltip title={bookmarked ? 'Remove bookmark' : 'Save story'}>
              <IconButton
                size="small"
                color={bookmarked ? 'primary' : 'default'}
                onClick={handleAction(onBookmark)}
                aria-label={bookmarked ? 'Remove bookmark' : 'Save story'}
              >
                {bookmarked ? (
                  <BookmarkRounded sx={{ fontSize: 18 }} />
                ) : (
                  <BookmarkBorderRounded sx={{ fontSize: 18 }} />
                )}
              </IconButton>
            </Tooltip>
          )}
        </Stack>
      </Stack>
    </Card>
  );
}
