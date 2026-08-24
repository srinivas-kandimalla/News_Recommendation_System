import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Box, Typography, Stack, Alert, Divider } from '@mui/material';
import { useTheme } from '@mui/material/styles';

import { getAllNews, searchNews, getTrendingNews, bookmarkNews } from '../services/newsService';
import { useAuth } from '../context/AuthContext';
import NewsCard from '../components/common/NewsCard';
import NewsCardSkeleton from '../components/common/NewsCardSkeleton';
import CategoryBar from '../components/common/CategoryBar';

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
};

// ── Shared section label style ────────────────────────────
const useSectionLabel = (theme) => ({
  fontFamily: '"Inter", sans-serif',
  fontWeight: 600,
  fontSize: '0.6875rem',
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: theme.palette.text.secondary,
  display: 'block',
  mb: 1.5,
});

function Home() {
  const theme = useTheme();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { token, user, isAuthenticated } = useAuth();

  const [news, setNews] = useState([]);
  const [trendingNews, setTrendingNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [trendingLoading, setTrendingLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('All');

  const loadHomeData = useCallback(async (category = 'All') => {
    try {
      setLoading(true);
      setTrendingLoading(true);
      setError(null);
      const [allNewsRes, trendingRes] = await Promise.all([
        getAllNews(1, 40, category),
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
    } catch {
      setError('Unable to connect to the news service. Please try again.');
    } finally {
      setLoading(false);
      setTrendingLoading(false);
    }
  }, []);

  const handleSearch = useCallback(async (query) => {
    if (!query.trim()) { loadHomeData(selectedCategory); return; }
    try {
      setLoading(true);
      const res = await searchNews(query);
      if (res.success) setNews(res.news || []);
      else setError(res.message || 'Search failed.');
    } catch {
      setError('Search failed.');
    } finally {
      setLoading(false);
    }
  }, [loadHomeData, selectedCategory]);

  useEffect(() => {
    const urlSearch = searchParams.get('search');
    const urlCategory = searchParams.get('category');
    const catToUse = urlCategory || selectedCategory;
    if (urlCategory && urlCategory !== selectedCategory) setSelectedCategory(urlCategory);
    if (urlSearch) { handleSearch(urlSearch); }
    else { loadHomeData(catToUse); }
  }, [searchParams, selectedCategory]);

  const uniqueNews = [];
  const seenTitles = new Set();
  news.forEach((item) => {
    const t = (item.title || '').trim().toLowerCase();
    if (t && !seenTitles.has(t)) {
      seenTitles.add(t);
      uniqueNews.push(item);
    }
  });

  const filteredNews = uniqueNews.filter((item) =>
    selectedCategory === 'All' || item.category?.toLowerCase() === selectedCategory.toLowerCase()
  );

  const featuredArticle = filteredNews[0] || null;
  const gridArticles = filteredNews.slice(1);

  // Prefer real trending; fall back to news[1..5]
  const trendingItems = trendingNews.length > 0
    ? trendingNews.slice(0, 5)
    : news.slice(1, 6);

  const handleBookmark = async (newsItem) => {
    if (!isAuthenticated || !token) { navigate('/login'); return; }
    try { await bookmarkNews(newsItem._id, token); } catch { /* silent */ }
  };

  const sectionLabel = useSectionLabel(theme);

  const bgDefault = theme.palette.background.default;
  const dividerColor = theme.palette.divider;

  return (
    <Box sx={{ backgroundColor: bgDefault, minHeight: '100vh', pb: '48px' }}>
      {/*
       * ─────────────────────────────────────────────────────────────
       * FULL-WIDTH WRAPPER — max-width 1280px, gutter 24px each side
       * ─────────────────────────────────────────────────────────────
       */}
      <Box
        sx={{
          maxWidth: 1280,
          mx: 'auto',
          px: { xs: 2, sm: 3 },
          pt: { xs: '20px', md: '24px' },
        }}
      >
        {/* ── Compact one-line greeting ── */}
        <Typography
          sx={{
            fontFamily: '"Inter", sans-serif',
            fontWeight: 400,
            fontSize: { xs: '0.8125rem', md: '0.875rem' },
            color: theme.palette.text.secondary,
            mb: '24px',
          }}
        >
          {getGreeting()}{user?.name ? `, ${user.name}` : ''} — news that understands what matters to you.
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: '24px', borderRadius: 1 }}>{error}</Alert>
        )}

        {/* ══════════════════════════════════════════════════════════
            TOP SECTION — 2fr Featured  :  1fr Trending
            grid-template-columns: minmax(0, 2fr) minmax(280px, 1fr)
            ══════════════════════════════════════════════════════════ */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              md: 'minmax(0, 2fr) minmax(280px, 1fr)',
            },
            gap: { xs: '32px', md: '32px' },
            mb: { xs: '40px', md: '40px' },
            alignItems: 'start',
          }}
        >
          {/* ── LEFT: Featured Story ── */}
          <Box>
            {loading ? (
              <NewsCardSkeleton variant="featured" />
            ) : featuredArticle ? (
              <NewsCard
                news={featuredArticle}
                variant="featured"
                onBookmark={handleBookmark}
                onClick={() => navigate(`/news/${featuredArticle._id}`)}
              />
            ) : (
              <Typography variant="body2" color="text.secondary">
                No stories available.
              </Typography>
            )}
          </Box>

          {/* ── RIGHT: Trending Today ── */}
          <Box>
            <Typography component="span" sx={sectionLabel}>
              Trending Today
            </Typography>

            {trendingLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <NewsCardSkeleton key={i} variant="compact" />
              ))
            ) : trendingItems.length > 0 ? (
              trendingItems.map((item, idx) => (
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
              <Typography variant="body2" color="text.secondary">
                No trending stories yet.
              </Typography>
            )}

            {/* Discover prompt */}
            <Box
              onClick={() => navigate('/discover')}
              sx={{
                mt: 3,
                cursor: 'pointer',
                p: '14px 16px',
                border: `1px solid ${dividerColor}`,
                borderRadius: '4px',
                transition: 'border-color 0.15s ease',
                '&:hover': {
                  borderColor: theme.palette.text.secondary,
                },
              }}
            >
              <Typography component="span" sx={{ ...sectionLabel, mb: '4px' }}>
                Discover
              </Typography>
              <Typography
                variant="body2"
                sx={{ color: theme.palette.text.secondary, mt: 0, lineHeight: 1.5 }}
              >
                Explore stories outside your usual interests.
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* ══════════════════════════════════════════════════════════
            BOTTOM SECTION — full width Category tabs + 3-col grid
            ══════════════════════════════════════════════════════════ */}
        <Divider sx={{ mb: 0 }} />

        <CategoryBar
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
        />

        {/* Section label */}
        <Box sx={{ pt: '24px', mb: '20px' }}>
          <Typography component="span" sx={sectionLabel}>
            {selectedCategory === 'All' ? 'Latest Stories' : selectedCategory}
          </Typography>
        </Box>

        {/* ── 3-column grid ── */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, minmax(0, 1fr))',
              md: 'repeat(3, minmax(0, 1fr))',
            },
            gap: '24px',
          }}
        >
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <NewsCardSkeleton key={i} variant="standard" />
            ))
          ) : gridArticles.length > 0 ? (
            gridArticles.map((item) => (
              <NewsCard
                key={item._id}
                news={item}
                variant="standard"
                onBookmark={handleBookmark}
                onClick={() => navigate(`/news/${item._id}`)}
              />
            ))
          ) : (
            <Box
              sx={{
                gridColumn: '1 / -1',
                py: '40px',
                textAlign: 'center',
              }}
            >
              <Typography variant="body2" color="text.secondary">
                No more stories in this category.
              </Typography>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
}

export default Home;