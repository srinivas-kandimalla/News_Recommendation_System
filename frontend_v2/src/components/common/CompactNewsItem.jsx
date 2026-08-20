import { Box, Stack, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { formatDate } from '../../utils/formatters';

/**
 * CompactNewsItem — compact list item for Trending, Bookmarks, History.
 * No image (or small thumbnail), single-line title, minimal metadata.
 */
export default function CompactNewsItem({ news, rank, showRank = false }) {
  const navigate = useNavigate();
  const id = news._id || news.id;

  return (
    <Box
      component="article"
      onClick={() => navigate(`/news/${id}`)}
      sx={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 1.5,
        py: 1.5,
        px: 0,
        cursor: 'pointer',
        borderRadius: 1.5,
        transition: 'background 140ms ease',
        '&:hover': { bgcolor: 'action.hover', mx: -1.5, px: 1.5 },
        '&:focus-visible': {
          outline: '2px solid',
          outlineColor: 'primary.main',
          outlineOffset: 2,
        },
      }}
      tabIndex={0}
      role="button"
      onKeyDown={(e) => e.key === 'Enter' && navigate(`/news/${id}`)}
      aria-label={`Read: ${news.title}`}
    >
      {/* Rank number */}
      {showRank && (
        <Typography
          sx={{
            fontWeight: 800,
            fontSize: '1.25rem',
            letterSpacing: '-0.04em',
            color: 'primary.main',
            opacity: 0.5,
            minWidth: 28,
            lineHeight: 1.2,
            flexShrink: 0,
            mt: 0.1,
          }}
        >
          {String(rank).padStart(2, '0')}
        </Typography>
      )}

      {/* Thumbnail if available */}
      {!showRank && news.image_url && (
        <Box
          component="img"
          src={news.image_url}
          alt=""
          loading="lazy"
          sx={{
            width: 56,
            height: 56,
            borderRadius: 1.5,
            objectFit: 'cover',
            flexShrink: 0,
          }}
          onError={(e) => { e.target.style.display = 'none'; }}
        />
      )}

      <Stack spacing={0.25} flex={1} minWidth={0}>
        <Typography
          variant="body2"
          sx={{
            fontWeight: 600,
            lineHeight: 1.35,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {news.title || 'Untitled'}
        </Typography>
        <Stack direction="row" spacing={1} alignItems="center">
          {news.category && (
            <Typography variant="caption" color="primary.main" sx={{ fontWeight: 600, fontSize: '0.68rem' }}>
              {news.category}
            </Typography>
          )}
          <Typography variant="caption" color="text.disabled" fontSize="0.68rem">
            {formatDate(news.created_at)}
          </Typography>
          {news.source && (
            <Typography variant="caption" color="text.disabled" fontSize="0.68rem" noWrap>
              · {news.source}
            </Typography>
          )}
        </Stack>
      </Stack>
    </Box>
  );
}
