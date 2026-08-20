import { useCallback, useEffect, useState } from 'react';
import {
  Box, Chip, Divider, Grid, Skeleton, Stack, Typography,
} from '@mui/material';
import { LocalFireDepartmentRounded } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import EmptyState from '../components/common/EmptyState';
import ErrorState from '../components/common/ErrorState';
import Loader from '../components/common/Loader';
import NewsCard from '../components/common/NewsCard';
import SectionHeader from '../components/common/SectionHeader';
import useDocumentTitle from '../hooks/useDocumentTitle';
import { getTrendingNews } from '../services/newsService';
import { getApiErrorMessage } from '../utils/apiError';
import { formatDate } from '../utils/formatters';

function TrendingHero({ item, rank }) {
  const navigate = useNavigate();
  if (!item) return null;

  return (
    <Box
      onClick={() => navigate(`/news/${item._id}`)}
      role="article"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && navigate(`/news/${item._id}`)}
      aria-label={`Trending #${rank}: ${item.title}`}
      sx={{
        cursor: 'pointer',
        borderRadius: 2,
        overflow: 'hidden',
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' },
        gap: 0,
        transition: 'box-shadow 160ms ease',
        '&:hover': {
          boxShadow: (theme) =>
            theme.palette.mode === 'dark'
              ? '0 8px 32px rgba(0,0,0,0.4)'
              : '0 8px 32px rgba(0,0,0,0.1)',
        },
        '&:focus-visible': { outline: '2px solid', outlineColor: 'primary.main', outlineOffset: 2 },
      }}
    >
      {/* Image */}
      {item.image_url && (
        <Box
          component="img"
          src={item.image_url}
          alt=""
          loading="eager"
          sx={{
            width: { xs: '100%', md: '45%' },
            height: { xs: 220, md: 320 },
            objectFit: 'cover',
            flexShrink: 0,
          }}
          onError={(e) => { e.target.style.display = 'none'; }}
        />
      )}

      {/* Content */}
      <Box
        sx={{
          p: { xs: 2.5, md: 3.5 },
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          flex: 1,
        }}
      >
        <Box>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
            <Typography
              sx={{
                fontWeight: 800,
                fontSize: '2rem',
                letterSpacing: '-0.06em',
                color: 'primary.main',
                opacity: 0.5,
                lineHeight: 1,
              }}
            >
              01
            </Typography>
            {item.category && (
              <Chip label={item.category} size="small" color="primary" sx={{ height: 20, fontSize: '0.68rem' }} />
            )}
          </Stack>
          <Typography
            className="signal-headline"
            sx={{
              fontFamily: 'Georgia, "Times New Roman", serif',
              fontWeight: 700,
              fontSize: { xs: '1.4rem', md: '1.75rem' },
              lineHeight: 1.2,
              letterSpacing: '-0.02em',
              mb: 1.5,
            }}
          >
            {item.title}
          </Typography>
          {item.content && (
            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.65, mb: 2 }}>
              {item.content.slice(0, 200)}{item.content.length > 200 ? '…' : ''}
            </Typography>
          )}
        </Box>
        <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
          <Typography variant="caption" color="text.disabled">{item.source || ''}</Typography>
          <Typography variant="caption" color="text.disabled">{formatDate(item.created_at)}</Typography>
          {(item.reads || item.likes) ? (
            <Stack direction="row" spacing={1.5}>
              {item.reads > 0 && (
                <Typography variant="caption" color="text.secondary" fontWeight={600}>
                  {item.reads.toLocaleString()} reads
                </Typography>
              )}
              {item.likes > 0 && (
                <Typography variant="caption" color="primary.main" fontWeight={600}>
                  ♥ {item.likes}
                </Typography>
              )}
            </Stack>
          ) : null}
        </Stack>
      </Box>
    </Box>
  );
}

export default function Trending() {
  useDocumentTitle('Trending — Nexora');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getTrendingNews();
      setItems(data.trending_news || []);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <Loader minHeight="60vh" />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  const [hero, ...rest] = items;

  return (
    <>
      <SectionHeader
        eyebrow="WHAT READERS ARE WATCHING"
        title="Trending now"
        description="Stories gaining momentum across the Nexora community."
        sx={{ mb: 4 }}
      />

      {items.length === 0 ? (
        <EmptyState
          icon={LocalFireDepartmentRounded}
          title="The feed is warming up"
          description="Trending stories will appear as readers discover and engage with the news."
        />
      ) : (
        <>
          {/* Hero story */}
          {hero && (
            <Box sx={{ mb: 4 }}>
              <TrendingHero item={hero} rank={1} />
            </Box>
          )}

          {/* Ranked list */}
          {rest.length > 0 && (
            <Box sx={{ mb: 6 }}>
              <SectionHeader eyebrow="ALSO TRENDING" title="More stories" sx={{ mb: 1 }} />
              <Box sx={{ borderTop: '1px solid', borderColor: 'divider' }}>
                {rest.map((item, i) => (
                  <Box key={item._id}>
                    <Box
                      sx={{
                        display: 'flex',
                        gap: 2,
                        py: 2,
                        cursor: 'pointer',
                        borderRadius: 1.5,
                        transition: 'background 140ms ease',
                        '&:hover': { bgcolor: 'action.hover', mx: -1.5, px: 1.5 },
                      }}
                      onClick={() => {}}
                      component="article"
                    >
                      <Typography
                        sx={{
                          fontWeight: 800,
                          fontSize: '1.4rem',
                          letterSpacing: '-0.05em',
                          color: 'primary.main',
                          opacity: 0.35,
                          minWidth: 32,
                          flexShrink: 0,
                          mt: 0.15,
                          lineHeight: 1.2,
                        }}
                      >
                        {String(i + 2).padStart(2, '0')}
                      </Typography>
                      <Box flex={1} minWidth={0}>
                        <Stack direction="row" spacing={1} sx={{ mb: 0.5 }}>
                          {item.category && (
                            <Chip label={item.category} size="small" color="primary" sx={{ height: 18, fontSize: '0.65rem' }} />
                          )}
                          <Typography variant="caption" color="text.disabled">
                            {formatDate(item.created_at)}
                          </Typography>
                        </Stack>
                        <Typography
                          variant="subtitle2"
                          component="a"
                          href={`/news/${item._id}`}
                          onClick={(e) => { e.preventDefault(); window.location.assign(`/news/${item._id}`); }}
                          sx={{ color: 'text.primary', textDecoration: 'none', fontWeight: 650, lineHeight: 1.35, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
                        >
                          {item.title}
                        </Typography>
                        <Stack direction="row" spacing={1.5} sx={{ mt: 0.5 }}>
                          {item.source && <Typography variant="caption" color="text.disabled">{item.source}</Typography>}
                          {item.reads > 0 && <Typography variant="caption" color="text.secondary" fontWeight={600}>{item.reads.toLocaleString()} reads</Typography>}
                          {item.likes > 0 && <Typography variant="caption" color="primary.main" fontWeight={600}>♥ {item.likes}</Typography>}
                        </Stack>
                      </Box>
                      {item.image_url && (
                        <Box
                          component="img"
                          src={item.image_url}
                          alt=""
                          loading="lazy"
                          sx={{ width: 72, height: 72, borderRadius: 1.5, objectFit: 'cover', flexShrink: 0, alignSelf: 'center' }}
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                      )}
                    </Box>
                    {i < rest.length - 1 && <Divider />}
                  </Box>
                ))}
              </Box>
            </Box>
          )}
        </>
      )}
    </>
  );
}
