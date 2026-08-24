import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Grid,
  Alert,
  Divider,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';

import { getAllNews, bookmarkNews } from '../services/newsService';
import { useAuth } from '../context/AuthContext';
import NewsCard from '../components/common/NewsCard';
import NewsCardSkeleton from '../components/common/NewsCardSkeleton';
import CategoryBar from '../components/common/CategoryBar';

const CATEGORIES = ['All', 'Technology', 'Sports', 'Business', 'Science', 'Entertainment', 'Health', 'World'];

function Discover() {
  const theme = useTheme();
  const navigate = useNavigate();
  const { token, isAuthenticated } = useAuth();

  const [news, setNews] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchNews();
  }, []);

  const fetchNews = async () => {
    try {
      setLoading(true);
      const res = await getAllNews(1, 30);
      if (res.success) setNews(res.news || []);
      else setError(res.message || 'Failed to load stories.');
    } catch {
      setError('Unable to connect to the news service.');
    } finally {
      setLoading(false);
    }
  };

  const handleBookmark = async (item) => {
    if (!isAuthenticated) { navigate('/login'); return; }
    try { await bookmarkNews(item._id, token); } catch { /* silent */ }
  };

  const filtered = selectedCategory === 'All'
    ? news
    : news.filter((item) => item.category?.toLowerCase() === selectedCategory.toLowerCase());

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
            Discover
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Explore stories outside your normal interests.
          </Typography>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

        {/* Category tabs */}
        <CategoryBar
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          categories={CATEGORIES}
        />
        <Divider sx={{ mb: 3 }} />

        {/* 2-column story grid */}
        <Typography sx={{ ...sectionLabel, mb: 2 }}>
          {selectedCategory === 'All' ? 'All Categories' : selectedCategory}
        </Typography>

        <Grid container spacing={3}>
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <Grid item xs={12} sm={6} key={i}>
                <NewsCardSkeleton variant="standard" />
              </Grid>
            ))
          ) : filtered.length > 0 ? (
            filtered.map((item) => (
              <Grid item xs={12} sm={6} key={item._id}>
                <NewsCard
                  news={item}
                  variant="standard"
                  onBookmark={handleBookmark}
                  onClick={() => navigate(`/news/${item._id}`)}
                />
              </Grid>
            ))
          ) : (
            <Grid item xs={12}>
              <Box sx={{ py: 6, textAlign: 'center' }}>
                <Typography variant="body1" color="text.secondary">
                  No stories available for this category.
                </Typography>
              </Box>
            </Grid>
          )}
        </Grid>
      </Container>
    </Box>
  );
}

export default Discover;
