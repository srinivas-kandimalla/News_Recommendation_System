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
  Paper,
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
      <Box
        sx={{
          maxWidth: 1280,
          mx: 'auto',
          px: { xs: 2, sm: 3, md: 4 },
          pt: { xs: 3, md: 4 },
        }}
      >

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

        {/* Top Reading Pulse Banner */}
        {analytics && (
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              mb: 4,
              borderRadius: '12px',
              border: `1px solid ${theme.palette.divider}`,
              backgroundColor: theme.palette.mode === 'dark' ? '#111827' : '#FFFFFF',
            }}
          >
            <Grid container spacing={3} alignItems="center">
              <Grid item xs={6} sm={3}>
                <Typography variant="caption" color="text.secondary" fontWeight={600} display="block">
                  ARTICLES READ
                </Typography>
                <Typography variant="h5" fontWeight={800} color={theme.palette.text.primary}>
                  {analytics.total_articles_read ?? 0}
                </Typography>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Typography variant="caption" color="text.secondary" fontWeight={600} display="block">
                  BOOKMARKS
                </Typography>
                <Typography variant="h5" fontWeight={800} color={theme.palette.text.primary}>
                  {analytics.total_bookmarks ?? 0}
                </Typography>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Typography variant="caption" color="text.secondary" fontWeight={600} display="block">
                  LIKES
                </Typography>
                <Typography variant="h5" fontWeight={800} color={theme.palette.mode === 'dark' ? '#38BDF8' : '#2563EB'}>
                  {analytics.total_likes ?? 0}
                </Typography>
              </Grid>
              {analytics.favorite_category && (
                <Grid item xs={6} sm={3}>
                  <Typography variant="caption" color="text.secondary" fontWeight={600} display="block">
                    TOP FOCUS CATEGORY
                  </Typography>
                  <Typography variant="h6" fontWeight={800} color={theme.palette.mode === 'dark' ? '#38BDF8' : '#2563EB'}>
                    {analytics.favorite_category}
                  </Typography>
                </Grid>
              )}
            </Grid>
          </Paper>
        )}

        {/* 3-column recommendation story grid */}
        <Typography sx={{ ...sectionLabel, mb: 2 }}>Your Personalized Feed</Typography>

        {loading ? (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(2, 1fr)',
                md: 'repeat(3, 1fr)',
              },
              gap: 3,
            }}
          >
            {Array.from({ length: 6 }).map((_, i) => (
              <NewsCardSkeleton key={i} variant="standard" />
            ))}
          </Box>
        ) : recommendations.length > 0 ? (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(2, 1fr)',
                md: 'repeat(3, 1fr)',
              },
              gap: 3,
            }}
          >
            {recommendations.map((item) => (
              <NewsCard
                key={item._id}
                news={item}
                variant="standard"
                showReason={true}
                onBookmark={handleBookmark}
                onLike={handleLike}
                onClick={() => navigate(`/news/${item._id}`)}
              />
            ))}
          </Box>
        ) : (
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
        )}
      </Box>
    </Box>
  );
}

export default Recommendations;