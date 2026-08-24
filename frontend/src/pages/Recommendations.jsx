import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Grid,
  Alert,
  Divider,
  Stack,
  LinearProgress,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';

import { getPersonalizedRecommendations, getAnalytics, bookmarkNews, likeNews } from '../services/newsService';
import { useAuth } from '../context/AuthContext';
import NewsCard from '../components/common/NewsCard';
import NewsCardSkeleton from '../components/common/NewsCardSkeleton';

function Recommendations() {
  const theme = useTheme();
  const navigate = useNavigate();
  const { token, isAuthenticated } = useAuth();

  const [recommendations, setRecommendations] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!token) { setLoading(false); return; }
    loadData();
  }, [token]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [recRes, analyticsRes] = await Promise.allSettled([
        getPersonalizedRecommendations(token),
        getAnalytics(token),
      ]);
      if (recRes.status === 'fulfilled' && recRes.value.success) {
        setRecommendations(recRes.value.recommendations || []);
      } else {
        setError(recRes.value?.message || 'Failed to load recommendations.');
      }
      if (analyticsRes.status === 'fulfilled' && analyticsRes.value.success) {
        setAnalytics(analyticsRes.value.analytics);
      }
    } catch (err) {
      setError('Unable to load recommendations.');
    } finally {
      setLoading(false);
    }
  };

  const handleBookmark = async (item) => {
    if (!isAuthenticated) { navigate('/login'); return; }
    try { await bookmarkNews(item._id, token); } catch { /* silent */ }
  };
  const handleLike = async (item) => {
    if (!isAuthenticated) { navigate('/login'); return; }
    try { await likeNews(item._id, token); } catch { /* silent */ }
  };

  const sectionLabel = {
    fontFamily: '"Inter", sans-serif',
    fontWeight: 600,
    fontSize: '0.6875rem',
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    color: theme.palette.text.secondary,
  };

  // Build reading pulse from analytics.category_distribution or top categories
  const categoryDist = analytics?.category_distribution
    ? Object.entries(analytics.category_distribution)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 4)
    : [];
  const totalReads = categoryDist.reduce((sum, [, v]) => sum + v, 0);

  return (
    <Box sx={{ backgroundColor: theme.palette.background.default, minHeight: '100vh', pb: 6 }}>
      <Container maxWidth="lg" sx={{ pt: { xs: 3, md: 4 }, px: { xs: 2, md: 3 } }}>

        {/* Header */}
        <Box sx={{ mb: 3 }}>
          <Typography
            variant="h3"
            component="h1"
            sx={{
              fontFamily: '"Playfair Display", Georgia, serif',
              fontWeight: 700,
              color: theme.palette.text.primary,
              mb: 0.5,
            }}
          >
            Picked for you
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Stories selected around your interests.
          </Typography>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

        <Grid container spacing={5}>
          {/* Left: recommendations feed */}
          <Grid item xs={12} md={8}>
            <Typography sx={{ ...sectionLabel, mb: 2 }}>Your Feed</Typography>

            <Grid container spacing={3}>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <Grid item xs={12} sm={6} key={i}>
                    <NewsCardSkeleton variant="standard" />
                  </Grid>
                ))
              ) : recommendations.length > 0 ? (
                recommendations.map((item) => (
                  <Grid item xs={12} sm={6} key={item._id}>
                    <NewsCard
                      news={item}
                      variant="standard"
                      showReason={true}
                      onBookmark={handleBookmark}
                      onLike={handleLike}
                      onClick={() => navigate(`/news/${item._id}`)}
                    />
                  </Grid>
                ))
              ) : !loading && (
                <Grid item xs={12}>
                  <Box sx={{ py: 6, textAlign: 'center' }}>
                    <Typography variant="h5" sx={{ fontFamily: '"Playfair Display", Georgia, serif', fontWeight: 700, mb: 1 }}>
                      No recommendations yet
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                      Read a few articles on the home feed and Nexora will learn your interests.
                    </Typography>
                    <Box
                      onClick={() => navigate('/')}
                      sx={{
                        display: 'inline-block',
                        px: 3,
                        py: 1.25,
                        border: `1px solid ${theme.palette.text.primary}`,
                        borderRadius: 1,
                        cursor: 'pointer',
                        fontFamily: '"Inter", sans-serif',
                        fontWeight: 500,
                        fontSize: '0.875rem',
                        color: theme.palette.text.primary,
                        '&:hover': { backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)' },
                      }}
                    >
                      Browse news
                    </Box>
                  </Box>
                </Grid>
              )}
            </Grid>
          </Grid>

          {/* Right: reading pulse sidebar */}
          <Grid item xs={12} md={4}>
            <Box sx={{ position: { md: 'sticky' }, top: 72 }}>
              <Typography sx={{ ...sectionLabel, mb: 2 }}>Your Reading Pulse</Typography>

              {analytics ? (
                <Box
                  sx={{
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: 1,
                    p: 2.5,
                  }}
                >
                  {/* Stats row */}
                  <Grid container spacing={2} sx={{ mb: 2.5 }}>
                    {[
                      { label: 'Articles read', value: analytics.total_articles_read ?? '—' },
                      { label: 'Bookmarks', value: analytics.total_bookmarks ?? '—' },
                      { label: 'Likes', value: analytics.total_likes ?? '—' },
                    ].map(({ label, value }) => (
                      <Grid item xs={4} key={label}>
                        <Typography sx={{
                          fontFamily: '"Playfair Display", Georgia, serif',
                          fontWeight: 700,
                          fontSize: '1.5rem',
                          color: theme.palette.text.primary,
                          lineHeight: 1,
                          mb: 0.25,
                        }}>
                          {value}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">{label}</Typography>
                      </Grid>
                    ))}
                  </Grid>

                  <Divider sx={{ mb: 2 }} />

                  {/* Category breakdown */}
                  {categoryDist.length > 0 ? (
                    <Stack spacing={1.5}>
                      {categoryDist.map(([cat, count]) => {
                        const pct = totalReads > 0 ? Math.round((count / totalReads) * 100) : 0;
                        return (
                          <Box key={cat}>
                            <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                              <Typography variant="caption" sx={{ fontFamily: '"Inter", sans-serif', fontWeight: 500, color: theme.palette.text.primary }}>
                                {cat}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">{pct}%</Typography>
                            </Stack>
                            <LinearProgress
                              variant="determinate"
                              value={pct}
                              sx={{
                                height: 3,
                                borderRadius: 0,
                                backgroundColor: theme.palette.divider,
                                '& .MuiLinearProgress-bar': {
                                  backgroundColor: theme.palette.text.primary,
                                  borderRadius: 0,
                                },
                              }}
                            />
                          </Box>
                        );
                      })}
                    </Stack>
                  ) : (
                    <Typography variant="caption" color="text.secondary">
                      Start reading to build your interest profile.
                    </Typography>
                  )}

                  {analytics.favorite_category && (
                    <>
                      <Divider sx={{ my: 2 }} />
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.25 }}>
                        Favourite category
                      </Typography>
                      <Typography sx={{ fontFamily: '"Playfair Display", serif', fontWeight: 700, color: theme.palette.text.primary }}>
                        {analytics.favorite_category}
                      </Typography>
                    </>
                  )}
                </Box>
              ) : (
                <Box
                  sx={{
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: 1,
                    p: 2.5,
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    Your reading stats will appear here as you explore Nexora.
                  </Typography>
                </Box>
              )}
            </Box>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}

export default Recommendations;