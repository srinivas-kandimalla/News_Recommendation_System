import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Alert,
  Divider,
  Stack,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';

import { getTrendingNews, bookmarkNews } from '../services/newsService';
import { useAuth } from '../context/AuthContext';
import NewsCard from '../components/common/NewsCard';
import NewsCardSkeleton from '../components/common/NewsCardSkeleton';

function Trending() {
  const theme = useTheme();
  const navigate = useNavigate();
  const { token, isAuthenticated } = useAuth();

  const [trendingNews, setTrendingNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => { fetchTrending(); }, []);

  const fetchTrending = async () => {
    try {
      setLoading(true);
      const res = await getTrendingNews();
      if (res.success) setTrendingNews(res.trending_news || []);
      else setError(res.message || 'Failed to load trending news.');
    } catch {
      setError('Unable to load trending news.');
    } finally {
      setLoading(false);
    }
  };

  const handleBookmark = async (item) => {
    if (!isAuthenticated) { navigate('/login'); return; }
    try { await bookmarkNews(item._id, token); } catch { /* silent */ }
  };

  const sectionLabel = {
    fontFamily: '"Inter", sans-serif',
    fontWeight: 600,
    fontSize: '0.6875rem',
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    color: theme.palette.text.secondary,
  };

  return (
    <Box sx={{ backgroundColor: theme.palette.background.default, minHeight: '100vh', pb: 6 }}>
      <Container maxWidth="md" sx={{ pt: { xs: 3, md: 4 }, px: { xs: 2, md: 3 } }}>

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
            Trending
          </Typography>
          <Typography variant="body2" color="text.secondary">
            The most read and engaged stories right now.
          </Typography>
        </Box>

        <Divider sx={{ mb: 3 }} />
        <Typography sx={{ ...sectionLabel, mb: 0 }}>Most Read</Typography>

        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}

        {/* Editorial ranked list */}
        <Box sx={{ mt: 0 }}>
          {loading ? (
            Array.from({ length: 8 }).map((_, i) => (
              <NewsCardSkeleton key={i} variant="compact" />
            ))
          ) : trendingNews.length > 0 ? (
            trendingNews.map((item, idx) => (
              <NewsCard
                key={item._id || idx}
                news={item}
                variant="compact"
                rankIndex={idx + 1}
                onBookmark={handleBookmark}
                onClick={() => navigate(`/news/${item._id}`)}
              />
            ))
          ) : (
            <Box sx={{ py: 6, textAlign: 'center' }}>
              <Typography variant="body1" color="text.secondary">
                No trending stories yet. Start reading and the algorithm will surface popular articles.
              </Typography>
            </Box>
          )}
        </Box>
      </Container>
    </Box>
  );
}

export default Trending;