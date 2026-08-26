import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Box,
  Typography,
  Stack,
  Alert,
  Divider,
  Chip,
  IconButton,
  Tooltip,
  Paper,
  LinearProgress,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import LightbulbOutlinedIcon from '@mui/icons-material/LightbulbOutlined';
import CompassIcon from '@mui/icons-material/ExploreOutlined';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import PsychologyIcon from '@mui/icons-material/Psychology';

import {
  getAllNews,
  searchNews,
  getTrendingNews,
  getPersonalizedRecommendations,
  getAnalytics,
  bookmarkNews,
  likeNews,
} from '../services/newsService';
import { useAuth } from '../context/AuthContext';
import NewsCard from '../components/common/NewsCard';
import NewsCardSkeleton from '../components/common/NewsCardSkeleton';
import CategoryBar from '../components/common/CategoryBar';

const formatDate = (dateVal) => {
  if (!dateVal) return null;
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return null;

    const now = new Date();
    const diffMs = now - d;

    if (diffMs < -60000) return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    if (diffMs < 0) return 'Just now';

    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 60) return `${Math.max(1, diffMins)}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;

    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return null;
  }
};

const getArticleDate = (news) => {
  if (!news) return null;
  const dateVal = news.published || news.published_at || news.created_at || news.date;
  return formatDate(dateVal);
};

const getArticleSource = (news) => {
  if (!news) return 'Nexora';
  const raw = typeof news === 'string' ? news : (news.source || news.author || '');
  return raw.split('-')[0].split('|')[0].trim() || 'Nexora';
};

const cleanSnippet = (str, sourceName = '') => {
  const cleanSource = getArticleSource(sourceName);
  const fallbackText = cleanSource !== 'Nexora'
    ? `Read the latest coverage from ${cleanSource}.`
    : 'Read the full article coverage for complete details.';

  if (!str || typeof str !== 'string') return fallbackText;

  let clean = str;

  // 1. Remove raw HTML tags
  clean = clean.replace(/<[^>]*>?/gm, '');

  // 2. Remove character count annotations (e.g. [+1234 chars])
  clean = clean.replace(/\s*\[\+?\d+\s+chars\]/gi, '');

  // 3. Detect known scraper/header navigation garbage artifacts
  const navGarbagePattern = /(?:SearchSections|SectionsSections|SubscribeSubscribe|CloseSubscribe|Crosswords\s*&\s*Puzzles|Subscriber\s*Only|Subscriber\s*only|query=evt|x-on:|Mashable\s*101|g_displayableSlots|Search\s*Mashable|Appearance\s*\(BETA\)|Skip\s*to\s*content|Cookie\s*Policy|Privacy\s*Notice|Sign\s*in\s*to\s*read|Copyright\s*©|All\s*rights\s*reserved)/i;

  if (navGarbagePattern.test(clean)) {
    return fallbackText;
  }

  // 4. Detect concatenated navigation words (e.g. "SearchSections", "SectionsSubscribe", "SubscribeClose")
  if (/(?:Search|Sections|Subscribe|Close|Home|Latest|Menu|Nav|Navigation|Account|Profile){2,}/i.test(clean)) {
    return fallbackText;
  }

  // 5. Detect repeated standalone nav words (e.g. "Subscribe Subscribe", "Sections Sections")
  if (/\b(Subscribe|Search|Sections|Menu|Home|Latest|Close)\b(?:\s+\b\1\b)+/i.test(clean)) {
    return fallbackText;
  }

  // 6. Clean leading non-alphanumeric noise
  clean = clean.replace(/^[^a-zA-Z0-9"'(“]+/g, '');
  clean = clean.replace(/\s+/g, ' ').trim();

  // 7. Detect high density of navigation keywords in short snippet
  const navKeywordMatches = clean.match(/\b(Search|Sections|Subscribe|Close|Home|Latest|Menu|Crosswords|Puzzles|Subscriber|Sign in)\b/gi);
  if (navKeywordMatches && navKeywordMatches.length >= 3) {
    return fallbackText;
  }

  // 8. If text is too short or empty
  if (clean.length < 25) {
    return fallbackText;
  }

  return clean;
};

// Generate a human-readable signal label from real AI scores (no fake percentages)
const getSignalLabel = (article) => {
  if (!article) return null;
  const { hybrid_score, semantic_score, category } = article;
  if (!hybrid_score && !semantic_score) return null;

  if (category) {
    return `Recommended from your ${category} reading pattern`;
  }
  return 'Recommended from your reading activity pattern';
};

const getCleanFirstName = (userObj) => {
  if (!userObj) return null;
  const rawName = userObj.name || userObj.first_name || userObj.username || '';
  if (!rawName || typeof rawName !== 'string') return null;

  // Never expose email addresses or GUIDs
  if (rawName.includes('@')) return null;
  if (/^[0-9a-fA-F-]{12,}$/.test(rawName)) return null;

  // Strip trailing numbers/digits (e.g. "srinivaskandimalla14" -> "srinivaskandimalla")
  const alphaOnly = rawName.replace(/\d+$/g, '').trim();
  if (!alphaOnly) return null;

  // Take first name word
  const firstName = alphaOnly.split(' ')[0].trim();
  if (firstName.length < 2) return null;

  // Capitalize first letter cleanly
  return firstName.charAt(0).toUpperCase() + firstName.slice(1);
};

const getTimeOfDay = () => {
  const h = new Date().getHours();
  if (h < 12) return 'MORNING';
  if (h < 17) return 'AFTERNOON';
  return 'EVENING';
};

const getGreetingText = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
};

const sectionHeaderSx = (theme) => ({
  fontFamily: '"Plus Jakarta Sans", "Inter", sans-serif',
  fontWeight: 800,
  fontSize: '0.75rem',
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: theme.palette.text.secondary,
  mb: 0.5,
  display: 'flex',
  alignItems: 'center',
  gap: 1,
});

function Home() {
  const theme = useTheme();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { token, user, isAuthenticated } = useAuth();
  const isDark = theme.palette.mode === 'dark';

  const [news, setNews] = useState([]);
  const [personalizedNews, setPersonalizedNews] = useState([]);
  const [trendingNews, setTrendingNews] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [trendingLoading, setTrendingLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('All');

  const loadHomeData = useCallback(async (category = 'All') => {
    try {
      setLoading(true);
      setTrendingLoading(true);
      setError(null);

      const promises = [
        getAllNews(1, 40, category),
        getTrendingNews().catch(() => ({ success: false, trending_news: [] })),
      ];

      if (token) {
        promises.push(
          getPersonalizedRecommendations(token, 10).catch(() => ({ success: false, recommendations: [] }))
        );
        promises.push(
          getAnalytics(token).catch(() => ({ success: false, analytics: null }))
        );
      }

      const results = await Promise.all(promises);
      const allNewsRes = results[0];
      const trendingRes = results[1];

      if (allNewsRes.success) {
        setNews(allNewsRes.news || []);
      } else {
        setError(allNewsRes.message || 'Failed to load news stories.');
      }

      if (trendingRes.success) {
        setTrendingNews(trendingRes.trending_news || []);
      }

      if (token && results[2] && results[2].success) {
        setPersonalizedNews(results[2].recommendations || []);
      }

      if (token && results[3] && results[3].success) {
        setAnalytics(results[3].analytics || null);
      }
    } catch {
      setError('Unable to connect to Nexora intelligence service. Please check your connection.');
    } finally {
      setLoading(false);
      setTrendingLoading(false);
    }
  }, [token]);

  const handleSearch = useCallback(async (query) => {
    if (!query.trim()) { loadHomeData(selectedCategory); return; }
    try {
      setLoading(true);
      const res = await searchNews(query);
      if (res.success) setNews(res.news || []);
      else setError(res.message || 'Search query yielded no results.');
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
  }, [searchParams, selectedCategory, loadHomeData, handleSearch]);

  // Sanitized unique articles
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

  // Featured Item: Prefer top personalized recommendation if available, else first filtered news
  const featuredArticle = (personalizedNews.length > 0 && selectedCategory === 'All')
    ? personalizedNews[0]
    : filteredNews[0] || null;

  // Secondary grid articles — exclude featured article to prevent duplication
  const featuredId = featuredArticle?._id;
  const secondaryArticles = (personalizedNews.length > 1 && selectedCategory === 'All')
    ? personalizedNews.slice(1, 5)
    : filteredNews.filter(item => item._id !== featuredId).slice(0, 4);

  // Diversity articles ("Beyond Your Usual Reading"): Articles from secondary categories
  const dominantCategory = (featuredArticle?.category || 'Technology').toLowerCase();
  const diversityArticles = uniqueNews
    .filter((item) => item.category?.toLowerCase() !== dominantCategory)
    .slice(0, 3);

  // Trending items list
  const trendingItems = trendingNews.length > 0
    ? trendingNews.slice(0, 5)
    : uniqueNews.slice(0, 5);

  // Real interest distribution ratios derived from actual article set
  const categoryCounts = {};
  uniqueNews.forEach((n) => {
    const cat = n.category || 'General';
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
  });
  const totalCatCount = uniqueNews.length || 1;
  const interestSignals = Object.keys(categoryCounts)
    .map((cat) => ({
      name: cat,
      count: categoryCounts[cat],
      percentage: Math.round((categoryCounts[cat] / totalCatCount) * 100),
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 4);

  const handleBookmark = async (newsItem) => {
    if (!isAuthenticated || !token) { navigate('/login'); return; }
    try { await bookmarkNews(newsItem._id, token); } catch { /* silent */ }
  };

  const handleLike = async (newsItem) => {
    if (!isAuthenticated || !token) { navigate('/login'); return; }
    try { await likeNews(newsItem._id, token); } catch { /* silent */ }
  };

  const primaryAccent = isDark ? '#3B82F6' : '#2563EB';
  const surfaceBg = isDark ? '#111827' : '#FFFFFF';
  const borderCol = isDark ? '#1E293B' : '#E2E8F0';

  return (
    <Box sx={{ backgroundColor: theme.palette.background.default, minHeight: '100vh', pb: 8 }}>
      <Box
        sx={{
          maxWidth: 1280,
          mx: 'auto',
          px: { xs: 2, sm: 3, md: 4 },
          pt: { xs: 3, md: 4 },
        }}
      >
        {/* ─────────────────────────────────────────────────────────────
            SECTION 1 — PERSONAL INTELLIGENCE HEADER
            ───────────────────────────────────────────────────────────── */}
        <Box sx={{ mb: 3 }}>
          <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 1 }}>
            <Box
              sx={{
                px: 1.25,
                py: 0.35,
                borderRadius: '4px',
                bgcolor: isDark ? 'rgba(59, 130, 246, 0.12)' : 'rgba(37, 99, 235, 0.08)',
                border: `1px solid ${isDark ? 'rgba(59, 130, 246, 0.25)' : 'rgba(37, 99, 235, 0.18)'}`,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0.75,
              }}
            >
              <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#10B981' }} />
              <Typography
                variant="caption"
                sx={{
                  fontFamily: '"Inter", sans-serif',
                  fontWeight: 700,
                  fontSize: '0.65rem',
                  letterSpacing: '0.08em',
                  color: isDark ? '#60A5FA' : '#1D4ED8',
                  textTransform: 'uppercase',
                }}
              >
                NEXORA INTELLIGENCE · PERSONALIZATION ACTIVE
              </Typography>
            </Box>
          </Stack>
          <Typography
            variant="h4"
            sx={{
              fontFamily: '"Plus Jakarta Sans", "Inter", sans-serif',
              fontWeight: 800,
              fontSize: { xs: '1.4rem', sm: '1.75rem', md: '2.1rem' },
              color: theme.palette.text.primary,
              letterSpacing: '-0.03em',
              mb: 0.5,
            }}
          >
            {getGreetingText()}{getCleanFirstName(user) ? `, ${getCleanFirstName(user)}` : ''}
          </Typography>
          <Typography
            sx={{
              fontFamily: '"Inter", sans-serif',
              fontWeight: 400,
              fontSize: { xs: '0.9rem', md: '1.025rem' },
              color: theme.palette.text.secondary,
              lineHeight: 1.5,
            }}
          >
            Your personal news briefing, shaped by what matters now.
          </Typography>
        </Box>

        {/* ─────────────────────────────────────────────────────────────
            SECTION 2 — PERSONALIZATION CONTEXT
            ───────────────────────────────────────────────────────────── */}
        <Paper
          elevation={0}
          sx={{
            mb: 4,
            p: '10px 16px',
            borderRadius: '8px',
            backgroundColor: isDark ? '#172033' : '#F1F5F9',
            border: `1px solid ${borderCol}`,
            display: 'flex',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: { xs: 1.5, sm: 3 },
          }}
        >
          <Stack direction="row" alignItems="center" spacing={1}>
            <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: primaryAccent }} />
            <Typography
              variant="caption"
              sx={{
                fontFamily: '"Inter", sans-serif',
                fontWeight: 700,
                fontSize: '0.68rem',
                letterSpacing: '0.1em',
                color: theme.palette.text.secondary,
                textTransform: 'uppercase',
              }}
            >
              PERSONALIZATION CONTEXT
            </Typography>
          </Stack>

          <Divider orientation="vertical" flexItem sx={{ my: 0.5 }} />

          <Stack direction="row" alignItems="center" spacing={2} flexWrap="wrap">
            <Typography variant="caption" sx={{ fontFamily: '"Inter", sans-serif', fontWeight: 600, fontSize: '0.75rem', color: theme.palette.text.primary }}>
              {getTimeOfDay().charAt(0) + getTimeOfDay().slice(1).toLowerCase()}
            </Typography>
            <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>·</Typography>
            <Typography variant="caption" sx={{ fontFamily: '"Inter", sans-serif', fontWeight: 600, fontSize: '0.75rem', color: '#059669' }}>
              Active session
            </Typography>
            <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>·</Typography>
            <Typography variant="caption" sx={{ fontFamily: '"Inter", sans-serif', fontWeight: 600, fontSize: '0.75rem', color: primaryAccent }}>
              {(analytics?.favorite_category || featuredArticle?.category || 'Technology')} focus
            </Typography>
            {analytics?.total_articles_read != null && (
              <>
                <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>·</Typography>
                <Typography variant="caption" sx={{ fontFamily: '"Inter", sans-serif', fontWeight: 600, fontSize: '0.75rem', color: theme.palette.text.primary }}>
                  {analytics.total_articles_read} recent read{analytics.total_articles_read !== 1 ? 's' : ''}
                </Typography>
              </>
            )}
          </Stack>
        </Paper>

        {error && (
          <Alert severity="error" sx={{ mb: 4, borderRadius: '8px' }}>
            {error}
          </Alert>
        )}

        {/* ─────────────────────────────────────────────────────────────
            SECTION 3 & 4 — RECOMMENDED FOR YOU & WHY NEXORA RECOMMENDED THIS
            ───────────────────────────────────────────────────────────── */}
        <Box sx={{ mb: 6 }}>
          <Box sx={{ mb: 2 }}>
            <Typography component="h2" sx={sectionHeaderSx(theme)}>
              <AutoAwesomeIcon sx={{ fontSize: 16, color: primaryAccent }} />
              RECOMMENDED FOR YOU
            </Typography>
            <Typography variant="body2" sx={{ color: theme.palette.text.secondary, fontWeight: 400 }}>
              Stories selected from your reading interests and current context.
            </Typography>
          </Box>

          {loading ? (
            <NewsCardSkeleton variant="featured" />
          ) : featuredArticle ? (
            <Paper
              elevation={0}
              sx={{
                borderRadius: '12px',
                border: `1px solid ${borderCol}`,
                backgroundColor: surfaceBg,
                overflow: 'hidden',
                transition: 'all 0.2s ease',
                '&:hover': {
                  borderColor: primaryAccent,
                  boxShadow: isDark ? '0 8px 24px rgba(0,0,0,0.4)' : '0 6px 20px rgba(37,99,235,0.06)',
                },
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: { xs: 'column', md: 'row' },
                  alignItems: 'stretch',
                }}
              >
                {/* Featured Image Left */}
                <Box
                  sx={{
                    width: { xs: '100%', md: '52%' },
                    minHeight: { md: 320 },
                    maxHeight: { md: 420 },
                    position: 'relative',
                    overflow: 'hidden',
                    backgroundColor: borderCol,
                  }}
                >
                  <Box
                    component="img"
                    src={featuredArticle.image_url || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=800&q=80'}
                    alt={featuredArticle.title}
                    sx={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      display: 'block',
                      transition: 'transform 0.35s ease',
                      '&:hover': { transform: 'scale(1.04)' },
                    }}
                  />
                  {featuredArticle.category && (
                    <Chip
                      label={featuredArticle.category}
                      size="small"
                      sx={{
                        position: 'absolute',
                        top: 14,
                        left: 14,
                        fontWeight: 700,
                        fontSize: '0.65rem',
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                        bgcolor: primaryAccent,
                        color: '#FFFFFF',
                        borderRadius: '4px',
                      }}
                    />
                  )}
                </Box>

                {/* Featured Text & Recommendation Info Right */}
                <Box
                  sx={{
                    flex: 1,
                    p: { xs: 2.5, sm: 3, md: 3.5 },
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <Box>
                    <Typography
                      variant="caption"
                      sx={{ color: theme.palette.text.secondary, fontWeight: 500, display: 'block', mb: 1 }}
                    >
                      {getArticleSource(featuredArticle)}{getArticleDate(featuredArticle) ? ` · ${getArticleDate(featuredArticle)}` : ''}
                    </Typography>

                    <Typography
                      variant="h5"
                      onClick={() => navigate(`/news/${featuredArticle._id}`)}
                      sx={{
                        fontFamily: '"Plus Jakarta Sans", "Inter", sans-serif',
                        fontWeight: 800,
                        fontSize: { xs: '1.15rem', sm: '1.35rem', md: '1.45rem' },
                        color: theme.palette.text.primary,
                        lineHeight: 1.3,
                        mb: 1.5,
                        cursor: 'pointer',
                        '&:hover': { color: primaryAccent },
                      }}
                    >
                      {featuredArticle.title}
                    </Typography>

                    <Typography
                      variant="body2"
                      sx={{
                        color: theme.palette.text.secondary,
                        lineHeight: 1.6,
                        mb: 2.5,
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {cleanSnippet(featuredArticle.content || featuredArticle.description, featuredArticle.source || featuredArticle.author)}
                    </Typography>
                  </Box>

                  {/* Compact AI recommendation signal — visually secondary to article */}
                  {featuredArticle.hybrid_score != null && (
                    <Box sx={{ mb: 2.5 }}>
                      <Typography
                        variant="caption"
                        sx={{ color: theme.palette.text.secondary, fontWeight: 500, fontSize: '0.76rem', display: 'block', mb: 1.25, fontStyle: 'italic' }}
                      >
                        {getSignalLabel(featuredArticle)}
                      </Typography>
                      <Stack direction="row" spacing={3} flexWrap="wrap" rowGap={1.5}>
                        {[
                          { label: 'Semantic', value: featuredArticle.semantic_score },
                          { label: 'Recency', value: featuredArticle.recency_score },
                          { label: 'Interest', value: featuredArticle.interest_score },
                          ...(featuredArticle.context_debug?.context_relevance_factor != null
                            ? [{ label: 'Context', value: (featuredArticle.context_debug.context_relevance_factor - 0.80) / 0.45 }]
                            : []),
                        ]
                          .filter(s => s.value != null)
                          .map(({ label, value }) => (
                            <Box key={label} sx={{ minWidth: 58 }}>
                              <Typography variant="caption" sx={{ fontSize: '0.62rem', color: theme.palette.text.secondary, fontWeight: 600, display: 'block', mb: 0.5 }}>
                                {label}
                              </Typography>
                              <LinearProgress
                                variant="determinate"
                                value={Math.max(0, Math.min(100, value * 100))}
                                sx={{
                                  height: 3,
                                  borderRadius: 2,
                                  bgcolor: isDark ? '#1E293B' : '#E2E8F0',
                                  '& .MuiLinearProgress-bar': { bgcolor: primaryAccent, borderRadius: 2 },
                                }}
                              />
                            </Box>
                          ))}
                      </Stack>
                    </Box>
                  )}

                  {/* ─────────────────────────────────────────────────────────────
                      WHY NEXORA RECOMMENDED THIS — SIGNATURE EXPLANATION PANEL
                      ───────────────────────────────────────────────────────────── */}
                  <Box
                    sx={{
                      bgcolor: isDark ? 'rgba(23, 32, 51, 0.6)' : '#F8FAFC',
                      p: 2,
                      borderRadius: '8px',
                      border: `1px solid ${borderCol}`,
                    }}
                  >
                    <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                      <LightbulbOutlinedIcon sx={{ fontSize: 16, color: primaryAccent }} />
                      <Typography
                        variant="caption"
                        sx={{
                          fontFamily: '"Plus Jakarta Sans", sans-serif',
                          fontWeight: 800,
                          fontSize: '0.68rem',
                          letterSpacing: '0.08em',
                          textTransform: 'uppercase',
                          color: theme.palette.text.primary,
                        }}
                      >
                        WHY NEXORA RECOMMENDED THIS
                      </Typography>
                    </Stack>

                    <Stack spacing={1.25}>
                      <Box>
                        <Typography
                          variant="caption"
                          sx={{
                            color: primaryAccent,
                            fontWeight: 800,
                            fontSize: '0.62rem',
                            letterSpacing: '0.08em',
                            textTransform: 'uppercase',
                            display: 'block',
                            mb: 0.25,
                          }}
                        >
                          INTEREST
                        </Typography>
                        <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontWeight: 500, fontSize: '0.8rem' }}>
                          {featuredArticle.category ? `${featuredArticle.category} matches your recent reading pattern.` : (featuredArticle.reason || 'Matches your reading interest pattern.')}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography
                          variant="caption"
                          sx={{
                            color: primaryAccent,
                            fontWeight: 800,
                            fontSize: '0.62rem',
                            letterSpacing: '0.08em',
                            textTransform: 'uppercase',
                            display: 'block',
                            mb: 0.25,
                          }}
                        >
                          CONTENT
                        </Typography>
                        <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontWeight: 500, fontSize: '0.8rem' }}>
                          Semantically related to articles in your reading history.
                        </Typography>
                      </Box>
                      <Box>
                        <Typography
                          variant="caption"
                          sx={{
                            color: primaryAccent,
                            fontWeight: 800,
                            fontSize: '0.62rem',
                            letterSpacing: '0.08em',
                            textTransform: 'uppercase',
                            display: 'block',
                            mb: 0.25,
                          }}
                        >
                          CONTEXT
                        </Typography>
                        <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontWeight: 500, fontSize: '0.8rem' }}>
                          Fits your current {getTimeOfDay().toLowerCase()} reading session.
                        </Typography>
                      </Box>
                    </Stack>
                  </Box>

                  {/* Footer Actions */}
                  <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mt: 2 }}>
                    <Typography
                      variant="caption"
                      onClick={() => navigate(`/news/${featuredArticle._id}`)}
                      sx={{
                        fontWeight: 700,
                        color: primaryAccent,
                        cursor: 'pointer',
                        '&:hover': { textDecoration: 'underline' },
                      }}
                    >
                      Read full story →
                    </Typography>
                    <IconButton size="small" onClick={() => handleBookmark(featuredArticle)}>
                      <BookmarkBorderIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                  </Stack>
                </Box>
              </Box>
            </Paper>
          ) : !loading && (
            <Box sx={{ py: 4, textAlign: 'center' }}>
              <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mb: 0.5 }}>
                Start reading to personalize your feed.
              </Typography>
              <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                The more you interact with stories, the better Nexora can adapt to your interests.
              </Typography>
            </Box>
          )}
        </Box>

        {/* ─────────────────────────────────────────────────────────────
            SECTION 8 — SECONDARY ARTICLE GRID (3-4 EDITORIAL CARDS)
            ───────────────────────────────────────────────────────────── */}
        <Box sx={{ mb: 6 }}>
          <Typography component="h3" sx={sectionHeaderSx(theme)}>
            CURATED FOR YOU
          </Typography>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(2, 1fr)',
                md: 'repeat(4, 1fr)',
              },
              gap: 2.5,
            }}
          >
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <NewsCardSkeleton key={i} variant="standard" />
              ))
            ) : secondaryArticles.map((item) => (
              <NewsCard
                key={item._id}
                news={item}
                variant="standard"
                onBookmark={handleBookmark}
                onLike={handleLike}
                onClick={() => navigate(`/news/${item._id}`)}
              />
            ))}
          </Box>
        </Box>

        {/* ─────────────────────────────────────────────────────────────
            SECTION 9 — VISIBLE LEARNING LOOP STATUS BANNER
            ───────────────────────────────────────────────────────────── */}
        {isAuthenticated && analytics && (
          <Box
            sx={{
              mb: 5,
              p: '14px 20px',
              borderRadius: '8px',
              backgroundColor: isDark ? 'rgba(37, 99, 235, 0.07)' : 'rgba(37, 99, 235, 0.04)',
              border: `1px solid ${isDark ? 'rgba(59,130,246,0.2)' : 'rgba(37,99,235,0.14)'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 2,
            }}
          >
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <PsychologyIcon sx={{ fontSize: 18, color: primaryAccent, flexShrink: 0 }} />
              <Box>
                <Typography
                  variant="caption"
                  sx={{
                    fontFamily: '"Plus Jakarta Sans", sans-serif',
                    fontWeight: 800,
                    fontSize: '0.65rem',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: primaryAccent,
                    display: 'block',
                    mb: 0.25,
                  }}
                >
                  YOUR FEED IS LEARNING
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ fontFamily: '"Inter", sans-serif', fontWeight: 600, fontSize: '0.825rem', color: theme.palette.text.primary }}
                >
                  {analytics.total_articles_read > 0
                    ? `${analytics.total_articles_read} article${analytics.total_articles_read !== 1 ? 's' : ''} read · Nexora is adapting your recommendations`
                    : 'Start reading articles · Nexora will adapt your feed automatically.'}
                </Typography>
              </Box>
            </Stack>
            <Typography
              variant="caption"
              onClick={() => navigate('/analytics')}
              sx={{ fontWeight: 700, fontSize: '0.8rem', color: primaryAccent, cursor: 'pointer', whiteSpace: 'nowrap', '&:hover': { textDecoration: 'underline' } }}
            >
              View your reading profile →
            </Typography>
          </Box>
        )}

        {/* ─────────────────────────────────────────────────────────────
            FEED DISTRIBUTION & TRENDING NOW (2-COL)
            ───────────────────────────────────────────────────────────── */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
            gap: 4,
            mb: 6,
          }}
        >
          {/* Left: FEED DISTRIBUTION */}
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: '12px',
              border: `1px solid ${borderCol}`,
              backgroundColor: surfaceBg,
            }}
          >
            <Typography component="h3" sx={sectionHeaderSx(theme)}>
              <PsychologyIcon sx={{ fontSize: 16, color: primaryAccent }} />
              FEED DISTRIBUTION
            </Typography>
            <Typography variant="caption" sx={{ color: theme.palette.text.secondary, display: 'block', mb: 2.5 }}>
              What&apos;s represented in your current feed.
            </Typography>

            <Stack spacing={2}>
              {interestSignals.map((signal) => (
                <Box key={signal.name}>
                  <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.825rem', color: theme.palette.text.primary }}>
                      {signal.name}
                    </Typography>
                    <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontWeight: 600 }}>
                      {signal.percentage}%
                    </Typography>
                  </Stack>
                  <LinearProgress
                    variant="determinate"
                    value={signal.percentage}
                    sx={{
                      height: 6,
                      borderRadius: 3,
                      bgcolor: isDark ? '#1E293B' : '#E2E8F0',
                      '& .MuiLinearProgress-bar': {
                        bgcolor: primaryAccent,
                        borderRadius: 3,
                      },
                    }}
                  />
                </Box>
              ))}
            </Stack>

            {interestSignals.length > 0 && (
              <Box sx={{ mt: 2.5, pt: 2, borderTop: `1px solid ${borderCol}` }}>
                <Typography
                  variant="caption"
                  onClick={() => navigate('/analytics')}
                  sx={{ fontWeight: 700, fontSize: '0.78rem', color: primaryAccent, cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
                >
                  View your reading profile →
                </Typography>
              </Box>
            )}
          </Paper>

          {/* Right: TRENDING NOW (EDITORIAL NUMBERED LIST) */}
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: '12px',
              border: `1px solid ${borderCol}`,
              backgroundColor: surfaceBg,
            }}
          >
            <Typography component="h3" sx={sectionHeaderSx(theme)}>
              <TrendingUpIcon sx={{ fontSize: 16, color: primaryAccent }} />
              TRENDING NOW
            </Typography>

            <Stack spacing={2} sx={{ mt: 2 }}>
              {trendingLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <NewsCardSkeleton key={i} variant="compact" />
                ))
              ) : trendingItems.map((item, idx) => (
                <Stack
                  key={item._id || idx}
                  direction="row"
                  spacing={2}
                  alignItems="flex-start"
                  onClick={() => navigate(`/news/${item._id}`)}
                  sx={{
                    cursor: 'pointer',
                    py: 1,
                    borderBottom: idx < trendingItems.length - 1 ? `1px solid ${borderCol}` : 'none',
                    transition: 'color 0.15s ease',
                    '&:hover .trend-title': { color: primaryAccent },
                  }}
                >
                  <Typography
                    sx={{
                      fontFamily: '"Plus Jakarta Sans", sans-serif',
                      fontWeight: 800,
                      fontSize: '1rem',
                      color: primaryAccent,
                      minWidth: 24,
                    }}
                  >
                    0{idx + 1}
                  </Typography>

                  <Box sx={{ flex: 1 }}>
                    <Typography
                      className="trend-title"
                      variant="body2"
                      sx={{
                        fontWeight: 700,
                        fontSize: '0.875rem',
                        color: theme.palette.text.primary,
                        lineHeight: 1.35,
                        mb: 0.5,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {item.title}
                    </Typography>
                    <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontWeight: 500 }}>
                      {getArticleSource(item)}{getArticleDate(item) ? ` · ${getArticleDate(item)}` : ''}
                    </Typography>
                  </Box>
                </Stack>
              ))}
            </Stack>
          </Paper>
        </Box>

        {/* ─────────────────────────────────────────────────────────────
            SECTION 10 — BEYOND YOUR USUAL READING (DIVERSITY RECOMMENDATION)
            Collapses gracefully when no diversity articles are available
            ───────────────────────────────────────────────────────────── */}
        {diversityArticles.length > 0 && (
          <Box sx={{ mb: 6 }}>
            <Box sx={{ mb: 2 }}>
              <Typography component="h3" sx={sectionHeaderSx(theme)}>
                <CompassIcon sx={{ fontSize: 16, color: primaryAccent }} />
                BEYOND YOUR USUAL READING
              </Typography>
              <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                Stories selected to broaden your feed.
              </Typography>
            </Box>

            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
                gap: 2.5,
              }}
            >
              {diversityArticles.map((item) => (
                <NewsCard
                  key={item._id}
                  news={item}
                  variant="standard"
                  onBookmark={handleBookmark}
                  onLike={handleLike}
                  onClick={() => navigate(`/news/${item._id}`)}
                />
              ))}
            </Box>
          </Box>
        )}

        {/* ─────────────────────────────────────────────────────────────
            SECTION 12 — CATEGORY NAVIGATION & FULL FEED
            ───────────────────────────────────────────────────────────── */}
        <Divider sx={{ mb: 4 }} />

        <Box sx={{ mb: 3 }}>
          <Typography component="h3" sx={sectionHeaderSx(theme)}>
            EXPLORE BY TOPIC
          </Typography>
          <CategoryBar
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
          />
        </Box>

        {/* Main Category Article Grid */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, 1fr)',
              md: 'repeat(3, 1fr)',
            },
            gap: 2.5,
          }}
        >
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <NewsCardSkeleton key={i} variant="standard" />
            ))
          ) : filteredNews.length > 0 ? (
            filteredNews.map((item) => (
              <NewsCard
                key={item._id}
                news={item}
                variant="standard"
                onBookmark={handleBookmark}
                onLike={handleLike}
                onClick={() => navigate(`/news/${item._id}`)}
              />
            ))
          ) : (
            <Box sx={{ gridColumn: '1 / -1', py: 6, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                No stories available in this category right now.
              </Typography>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
}

export default Home;