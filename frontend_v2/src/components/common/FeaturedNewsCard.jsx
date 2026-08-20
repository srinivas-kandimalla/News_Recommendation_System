import { alpha, Box, Chip, Stack, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { formatDate, truncate } from '../../utils/formatters';
import RecommendationReason from './RecommendationReason';

/**
 * FeaturedNewsCard — large editorial lead card.
 * Used for the Home page lead story.
 * Large serif headline, full-width image, no SignalEdge.
 */
export default function FeaturedNewsCard({ news, reason, score }) {
  const navigate = useNavigate();
  if (!news) return null;
  const id = news._id || news.id;

  return (
    <Box
      onClick={() => navigate(`/news/${id}`)}
      role="article"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && navigate(`/news/${id}`)}
      aria-label={`Lead story: ${news.title}`}
      sx={{
        cursor: 'pointer',
        borderRadius: 2,
        overflow: 'hidden',
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
        transition: 'box-shadow 160ms ease',
        '&:hover': {
          boxShadow: (theme) =>
            theme.palette.mode === 'dark'
              ? '0 12px 48px rgba(0,0,0,0.5)'
              : '0 12px 48px rgba(0,0,0,0.12)',
        },
        '&:focus-visible': { outline: '2px solid', outlineColor: 'primary.main', outlineOffset: 2 },
      }}
    >
      {/* Hero image */}
      {news.image_url && (
        <Box
          component="img"
          src={news.image_url}
          alt=""
          loading="eager"
          sx={{
            width: '100%',
            height: { xs: 220, sm: 300, md: 400 },
            objectFit: 'cover',
            display: 'block',
          }}
          onError={(e) => { e.target.style.display = 'none'; }}
        />
      )}

      <Box sx={{ p: { xs: 2.5, sm: 3.5, md: 4 } }}>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
          <Chip
            label={news.category || 'General'}
            size="small"
            color="primary"
            sx={{ height: 22, fontSize: '0.7rem' }}
          />
          <Typography variant="caption" color="text.disabled">
            {formatDate(news.created_at)}
          </Typography>
          {news.source && (
            <Typography variant="caption" color="text.disabled">
              · {news.source}
            </Typography>
          )}
        </Stack>

        {/* Serif editorial headline */}
        <Typography
          className="signal-headline"
          sx={{
            fontFamily: 'Georgia, "Times New Roman", serif',
            fontWeight: 700,
            fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem' },
            lineHeight: 1.18,
            letterSpacing: '-0.02em',
            mb: 1.5,
            color: 'text.primary',
          }}
        >
          {news.title}
        </Typography>

        {/* Excerpt */}
        <Typography
          variant="body1"
          color="text.secondary"
          sx={{
            lineHeight: 1.65,
            maxWidth: 720,
            fontSize: { xs: '0.95rem', md: '1.05rem' },
            mb: 2,
          }}
        >
          {truncate(news.content || '', 240)}
        </Typography>

        {/* Recommendation reason if applicable */}
        {(reason || score) && (
          <RecommendationReason reason={reason} score={score} showExpand={false} />
        )}
      </Box>
    </Box>
  );
}
