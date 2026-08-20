import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Grid,
  Stack,
  Skeleton,
  Alert,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Card,
  CardMedia,
  CardContent,
  Chip,
  Button,
  IconButton,
  Tooltip,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { motion } from 'framer-motion';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import ArticleIcon from '@mui/icons-material/Article';
import UpdateIcon from '@mui/icons-material/Update';
import SpeedIcon from '@mui/icons-material/Speed';
import SearchOffIcon from '@mui/icons-material/SearchOff';
import SparklesIcon from '@mui/icons-material/AutoAwesome';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import ShareIcon from '@mui/icons-material/Share';
import PublicIcon from '@mui/icons-material/Public';
import AccessTimeIcon from '@mui/icons-material/AccessTime';

import {
  getAllNews,
  searchNews,
  getTrendingNews,
  getPersonalizedRecommendations,
} from '../services/newsService';
import { useAuth } from '../context/AuthContext';
import NewsCard from '../components/common/NewsCard';
import CategoryBar from '../components/common/CategoryBar';
import StatCard from '../components/common/StatCard';
import TrendingWidget from '../components/common/TrendingWidget';
import InsightsWidget from '../components/common/InsightsWidget';
import ExplanationCard from '../components/common/ExplanationCard';
import BookmarksWidget from '../components/common/BookmarksWidget';
import LiveTopicsWidget from '../components/common/LiveTopicsWidget';
import SearchInput from '../components/Navbar/SearchInput';

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=1200&q=80';

function Home() {
  const theme = useTheme();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { token, isAuthenticated } = useAuth();

  const [news, setNews] = useState([]);
  const [trendingNews, setTrendingNews] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState('latest');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [featuredBookmarked, setFeaturedBookmarked] = useState(false);
  const [featuredLiked, setFeaturedLiked] = useState(false);

  useEffect(() => {
    const urlCategory = searchParams.get('category');
    const urlSearch = searchParams.get('search');

    if (urlCategory) {
      setSelectedCategory(urlCategory);
    }
    if (urlSearch) {
      setSearchQuery(urlSearch);
      handleSearch(urlSearch);
    } else {
      loadHomeData();
    }
  }, [searchParams]);

  const loadHomeData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [allNewsRes, trendingRes] = await Promise.all([
        getAllNews(1, 24),
        getTrendingNews().catch(() => ({ success: false, trending_news: [] })),
      ]);

      if (allNewsRes.success) {
        setNews(allNewsRes.news || []);
      } else {
        setError(allNewsRes.message || 'Failed to load news.');
      }

      if (trendingRes.success) {
        setTrendingNews(trendingRes.trending_news || []);
      }

      if (token) {
        try {
          const recRes = await getPersonalizedRecommendations(token);
          if (recRes.success) {
            setRecommendations(recRes.recommendations || []);
          }
        } catch (e) {
          console.warn('Personalized recommendations unavailable');
        }
      }
    } catch (err) {
      console.error(err);
      setError('Unable to connect to news service. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (value) => {
    setSearchQuery(value);

    try {
      if (!value || value.trim() === '') {
        loadHomeData();
        return;
      }

      setLoading(true);
      setError(null);
      const data = await searchNews(value);

      if (data.success) {
        setNews(data.news || []);
      } else {
        setError(data.message || 'Search failed.');
      }
    } catch (err) {
      console.error(err);
      setError('Search request failed.');
    } finally {
      setLoading(false);
    }
  };

  const filteredNews = news.filter((item) => {
    if (selectedCategory === 'All') return true;
    return item.category?.toLowerCase() === selectedCategory.toLowerCase();
  });

  const sortedNews = [...filteredNews].sort((a, b) => {
    if (sortBy === 'latest') {
      return new Date(b.created_at || 0) - new Date(a.created_at || 0);
    }
    if (sortBy === 'popular') {
      return (b.reads || 0) - (a.reads || 0);
    }
    return 0;
  });

  // Featured Article: Only the first item uses the large horizontal layout
  const featuredArticle = sortedNews.length > 0 ? sortedNews[0] : null;
  // Grid Articles: Remaining items use compact 3-column grid cards
  const gridArticles = sortedNews.length > 1 ? sortedNews.slice(1) : [];

  return (
    <Container maxWidth="xl" sx={{ py: 3, px: { xs: 2, md: 4 } }}>
      {/* ==================================================== */}
      {/* 1. HERO SECTION (FULL WIDTH TOP)                     */}
      {/* ==================================================== */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Box
          sx={{
            position: 'relative',
            borderRadius: `${theme.shape.borderRadius * 3}px`,
            p: { xs: 3, md: 4 },
            mb: 3,
            background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(
              theme.palette.secondary.main,
              0.07
            )} 100%)`,
            border: `1px solid ${alpha(theme.palette.primary.main, 0.12)}`,
            boxShadow: theme.shadows[1],
            overflow: 'hidden',
          }}
        >
          <Grid container spacing={3} alignItems="center">
            <Grid xs={12} md={7}>
              <Chip
                icon={<AutoAwesomeIcon sx={{ fontSize: 14 }} />}
                label="AI Curated Intelligence"
                size="small"
                sx={{
                  backgroundColor: alpha(theme.palette.secondary.main, 0.12),
                  color: theme.palette.secondary.main,
                  fontWeight: 600,
                  fontSize: '0.75rem',
                  mb: 1.5,
                  borderRadius: `${theme.shape.borderRadius * 2}px`,
                }}
              />

              <Typography
                variant="h3"
                component="h1"
                sx={{
                  fontFamily: theme.typography.h1.fontFamily,
                  fontWeight: 800,
                  fontSize: { xs: '1.8rem', md: '2.5rem' },
                  lineHeight: 1.15,
                  letterSpacing: '-0.02em',
                  color: theme.palette.text.primary,
                  mb: 1,
                }}
              >
                Stay Ahead with{' '}
                <Box
                  component="span"
                  sx={{
                    background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  AI-Powered News
                </Box>
              </Typography>

              <Typography
                variant="body1"
                color="text.secondary"
                sx={{ mb: 2.5, maxWidth: 640, lineHeight: 1.5 }}
              >
                Real-time news updates curated by semantic similarity, user interest vectors, and global popularity.
              </Typography>

              {/* Wider Search Bar */}
              <Box sx={{ mb: 3, maxWidth: 720, width: '100%' }}>
                <SearchInput
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  onSubmit={handleSearch}
                  placeholder="Search news, companies, topics..."
                />
              </Box>

              {/* Statistics StatCards Row */}
              <Grid container spacing={2}>
                <Grid xs={12} sm={4}>
                  <StatCard
                    icon={ArticleIcon}
                    value="1,250+"
                    label="Articles Today"
                    iconColor="primary"
                  />
                </Grid>
                <Grid xs={12} sm={4}>
                  <StatCard
                    icon={UpdateIcon}
                    value="24/7"
                    label="Live Updates"
                    iconColor="secondary"
                  />
                </Grid>
                <Grid xs={12} sm={4}>
                  <StatCard
                    icon={SpeedIcon}
                    value="98%"
                    label="AI Match Accuracy"
                    iconColor="success"
                  />
                </Grid>
              </Grid>
            </Grid>

            {/* Premium AI Illustration Banner Right */}
            <Grid xs={12} md={5} sx={{ display: { xs: 'none', md: 'block' } }}>
              <Box
                sx={{
                  position: 'relative',
                  display: 'flex',
                  justifyContent: 'center',
                }}
              >
                <Box
                  component="img"
                  src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80"
                  alt="AI Intelligence"
                  sx={{
                    width: '100%',
                    height: 260,
                    borderRadius: `${theme.shape.borderRadius * 2.5}px`,
                    objectFit: 'cover',
                    boxShadow: '0 12px 30px rgba(37, 99, 235, 0.15)',
                    border: `1px solid ${alpha(theme.palette.common.white, 0.8)}`,
                  }}
                />
              </Box>
            </Grid>
          </Grid>
        </Box>
      </motion.div>

      {/* Error Notification */}
      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: `${theme.shape.borderRadius * 2}px` }}>
          {error}
        </Alert>
      )}

      {/* ==================================================== */}
      {/* 2. CATEGORY PILL FILTER BAR                          */}
      {/* ==================================================== */}
      <Box sx={{ mb: 3 }}>
        <CategoryBar
          selectedCategory={selectedCategory}
          onSelectCategory={(cat) => setSelectedCategory(cat)}
        />
      </Box>

      {/* ==================================================== */}
      {/* 3. MAIN DASHBOARD LAYOUT                             */}
      {/* ==================================================== */}
      <Grid container spacing={3.5}>
        {/* ================= LEFT MAIN FEED (70% DESKTOP: lg={8.5}) ================= */}
        <Grid xs={12} lg={8.5}>
          {/* Main Feed Header & Sort Selector */}
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            sx={{ mb: 2.5 }}
          >
            <Typography variant="h5" fontWeight={700} color="text.primary">
              {selectedCategory === 'All' ? 'Latest News' : `${selectedCategory} News`}
            </Typography>

            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel id="sort-label">Sort by</InputLabel>
              <Select
                labelId="sort-label"
                value={sortBy}
                label="Sort by"
                onChange={(e) => setSortBy(e.target.value)}
                sx={{ borderRadius: `${theme.shape.borderRadius * 2}px` }}
              >
                <MenuItem value="latest">Latest</MenuItem>
                <MenuItem value="popular">Most Popular</MenuItem>
              </Select>
            </FormControl>
          </Stack>

          {/* Featured Large Horizontal Card (Only 1st Article) */}
          {!loading && featuredArticle && (
            <motion.div
              whileHover={{ y: -3 }}
              transition={{ duration: 0.2 }}
            >
              <Card
                onClick={() => navigate(`/news/${featuredArticle._id}`)}
                sx={{
                  mb: 3.5,
                  borderRadius: `${theme.shape.borderRadius * 2.5}px`,
                  backgroundColor: theme.palette.background.paper,
                  border: `1px solid ${theme.palette.divider}`,
                  boxShadow: theme.shadows[2],
                  overflow: 'hidden',
                  cursor: 'pointer',
                  '&:hover': {
                    boxShadow: theme.shadows[4],
                    borderColor: alpha(theme.palette.primary.main, 0.3),
                  },
                }}
              >
                <Grid container>
                  <Grid xs={12} md={5.5}>
                    <Box sx={{ position: 'relative', height: '100%', minHeight: 240 }}>
                      <CardMedia
                        component="img"
                        image={featuredArticle.image_url || DEFAULT_IMAGE}
                        alt={featuredArticle.title}
                        sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                      <Chip
                        icon={<SparklesIcon sx={{ fontSize: '13px !important', color: '#FFFFFF' }} />}
                        label="Featured Story"
                        size="small"
                        sx={{
                          position: 'absolute',
                          top: 12,
                          left: 12,
                          backgroundColor: theme.palette.primary.main,
                          color: '#FFFFFF',
                          fontWeight: 700,
                          fontSize: '0.725rem',
                        }}
                      />
                    </Box>
                  </Grid>

                  <Grid xs={12} md={6.5}>
                    <CardContent sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
                      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
                        <Chip
                          label={featuredArticle.category || 'General'}
                          size="small"
                          sx={{
                            backgroundColor: alpha(theme.palette.primary.main, 0.1),
                            color: theme.palette.primary.main,
                            fontWeight: 600,
                          }}
                        />
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.5,
                            backgroundColor: alpha(theme.palette.success.main, 0.1),
                            color: theme.palette.success.main,
                            px: 1,
                            py: 0.25,
                            borderRadius: `${theme.shape.borderRadius}px`,
                          }}
                        >
                          <AutoAwesomeIcon sx={{ fontSize: 13 }} />
                          <Typography variant="caption" fontWeight={700}>
                            96% Match
                          </Typography>
                        </Box>
                      </Stack>

                      <Typography variant="h5" component="h2" fontWeight={700} sx={{ mb: 1, lineHeight: 1.3 }}>
                        {featuredArticle.title}
                      </Typography>

                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          mb: 2,
                          display: '-webkit-box',
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {featuredArticle.content}
                      </Typography>

                      <Box sx={{ mt: 'auto', pt: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <PublicIcon sx={{ fontSize: 14, color: theme.palette.text.secondary }} />
                          <Typography variant="caption" color="text.secondary" fontWeight={600}>
                            {featuredArticle.source || featuredArticle.author || 'NewsPulse'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">•</Typography>
                          <Stack direction="row" alignItems="center" spacing={0.5}>
                            <AccessTimeIcon sx={{ fontSize: 12, color: theme.palette.text.secondary }} />
                            <Typography variant="caption" color="text.secondary">
                              Recent
                            </Typography>
                          </Stack>
                        </Stack>

                        <Button
                          variant="contained"
                          size="small"
                          endIcon={<ArrowForwardIcon fontSize="small" />}
                          sx={{
                            borderRadius: `${theme.shape.borderRadius * 2}px`,
                            textTransform: 'none',
                            fontWeight: 600,
                          }}
                        >
                          Read Story
                        </Button>
                      </Box>
                    </CardContent>
                  </Grid>
                </Grid>
              </Card>
            </motion.div>
          )}

          {/* Responsive News Grid (3 cards per row on Desktop: md={4}) */}
          <Grid container spacing={2.5}>
            {loading ? (
              Array.from(new Array(6)).map((_, index) => (
                <Grid xs={12} sm={6} md={4} key={index}>
                  <Card sx={{ height: 320, borderRadius: 3 }}>
                    <Skeleton variant="rectangular" height={160} />
                    <CardContent sx={{ p: 2 }}>
                      <Skeleton variant="text" width="40%" height={18} sx={{ mb: 1 }} />
                      <Skeleton variant="text" width="90%" height={24} />
                      <Skeleton variant="text" width="60%" height={18} />
                    </CardContent>
                  </Card>
                </Grid>
              ))
            ) : gridArticles.length > 0 ? (
              gridArticles.map((item, index) => (
                <Grid xs={12} sm={6} md={4} key={item._id || index}>
                  <NewsCard
                    news={item}
                    onClick={() => navigate(`/news/${item._id}`)}
                    showReason={Boolean(item.reason)}
                  />
                </Grid>
              ))
            ) : !featuredArticle ? (
              <Grid xs={12}>
                <Box
                  sx={{
                    textAlign: 'center',
                    py: 8,
                    px: 2,
                    backgroundColor: theme.palette.background.paper,
                    borderRadius: `${theme.shape.borderRadius * 2}px`,
                    border: `1px solid ${theme.palette.divider}`,
                  }}
                >
                  <SearchOffIcon sx={{ fontSize: 56, color: 'text.secondary', mb: 1 }} />
                  <Typography variant="h6" color="text.primary" fontWeight={600} gutterBottom>
                    No Articles Found
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {searchQuery
                      ? `No news matching "${searchQuery}". Try searching for another keyword.`
                      : `No articles available in category "${selectedCategory}".`}
                  </Typography>
                </Box>
              </Grid>
            ) : null}
          </Grid>
        </Grid>

        {/* ================= RIGHT STICKY SIDEBAR (30% DESKTOP: lg={3.5}) ================= */}
        <Grid xs={12} lg={3.5}>
          <Box
            sx={{
              position: { lg: 'sticky' },
              top: 90,
              display: 'flex',
              flexDirection: 'column',
              gap: 2.5,
            }}
          >
            {/* 1. Trending Widget */}
            <TrendingWidget items={trendingNews} />

            {/* 2. Reading Insights Widget */}
            <InsightsWidget />

            {/* 3. AI Recommendation Logic Widget */}
            <ExplanationCard
              title="Why This News?"
              reason="We analyze your reading patterns, saved topics, and engagement to recommend the most relevant stories."
              matchScore={98}
            />

            {/* 4. Bookmarks Quick Access Widget */}
            <BookmarksWidget />

            {/* 5. Live Trending Topics Widget */}
            <LiveTopicsWidget
              onSelectTopic={(keyword) => handleSearch(keyword)}
            />
          </Box>
        </Grid>
      </Grid>
    </Container>
  );
}

export default Home;