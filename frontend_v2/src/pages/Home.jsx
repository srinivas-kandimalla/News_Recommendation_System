import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Box, Button, Chip, Grid, IconButton, InputAdornment,
  Skeleton, Stack, TextField, Typography,
} from '@mui/material';
import {
  AutoAwesomeRounded, CloseRounded, LocalFireDepartmentRounded,
  RefreshRounded, SearchRounded,
} from '@mui/icons-material';
import { useSearchParams, Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import useDebounce from '../hooks/useDebounce';
import useDocumentTitle from '../hooks/useDocumentTitle';
import useFeedback from '../hooks/useFeedback';
import { addBookmark, getBookmarks, removeBookmark } from '../services/bookmarkService';
import { getNews, searchNews } from '../services/newsService';
import { getPersonalizedRecommendations } from '../services/recommendationService';
import { getTrendingNews } from '../services/newsService';
import { getApiErrorMessage } from '../utils/apiError';
import AppSnackbar from '../components/common/AppSnackbar';
import CompactNewsItem from '../components/common/CompactNewsItem';
import EmptyState from '../components/common/EmptyState';
import ErrorState from '../components/common/ErrorState';
import FeaturedNewsCard from '../components/common/FeaturedNewsCard';
import NewsCard from '../components/common/NewsCard';
import NewsSkeleton from '../components/common/NewsSkeleton';
import SectionHeader from '../components/common/SectionHeader';

const PAGE_SIZE = 9;

function PersonalizationHeadline({ user, analytics, loading }) {
  if (loading) return <Skeleton width={320} height={28} sx={{ mb: 4, borderRadius: 1 }} />;

  if (!user) {
    return (
      <Box sx={{ mb: 4 }}>
        <Typography variant="overline" color="primary.main" sx={{ fontWeight: 700, letterSpacing: '0.1em', fontSize: '0.68rem' }}>
          START EXPLORING
        </Typography>
        <Typography variant="h3" sx={{ mt: 0.5, fontWeight: 800, letterSpacing: '-0.035em' }}>
          Popular stories to get you started
        </Typography>
      </Box>
    );
  }

  const category = analytics?.favorite_category;
  const headline = category && category !== 'N/A'
    ? `Because you've been reading ${category}`
    : 'Your personalised feed';

  return (
    <Box sx={{ mb: 4 }}>
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
        <AutoAwesomeRounded sx={{ fontSize: 14, color: 'primary.main' }} />
        <Typography variant="overline" color="primary.main" sx={{ fontWeight: 700, letterSpacing: '0.1em', fontSize: '0.68rem' }}>
          NEXORA FOR YOU
        </Typography>
      </Stack>
      <Typography variant="h3" sx={{ fontWeight: 800, letterSpacing: '-0.035em' }}>
        {headline}
      </Typography>
    </Box>
  );
}

export default function Home() {
  useDocumentTitle('Nexora — News, tuned to what matters');
  const [searchParams, setSearchParams] = useSearchParams();
  const urlQuery = searchParams.get('q') || '';
  const [query, setQuery] = useState(urlQuery);
  const debouncedQuery = useDebounce(query);
  const [page, setPage] = useState(1);
  const [news, setNews] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [category, setCategory] = useState('');
  const [recommendations, setRecommendations] = useState([]);
  const [recLoading, setRecLoading] = useState(false);
  const [trending, setTrending] = useState([]);
  const [bookmarked, setBookmarked] = useState(new Set());
  const [analytics, setAnalytics] = useState(null);
  const { isAuthenticated, user } = useAuth();
  const { feedback, notify, dismiss } = useFeedback();
  const requestVersion = useRef(0);
  const searchRef = useRef(null);
  const focusSearch = searchParams.get('focusSearch') === '1';

  useEffect(() => { setQuery(urlQuery); }, [urlQuery]);
  useEffect(() => { setPage(1); }, [debouncedQuery]);

  // Focus search if requested from navbar
  useEffect(() => {
    if (focusSearch && searchRef.current) {
      searchRef.current.focus();
      setSearchParams({}, { replace: true });
    }
  }, [focusSearch, setSearchParams]);

  // Load bookmarks
  useEffect(() => {
    if (!isAuthenticated) { setBookmarked(new Set()); return; }
    let alive = true;
    getBookmarks()
      .then((d) => { if (alive) setBookmarked(new Set((d.bookmarks || []).map((b) => b._id))); })
      .catch(() => {});
    return () => { alive = false; };
  }, [isAuthenticated]);

  // Load user analytics for personalization headline
  useEffect(() => {
    if (!isAuthenticated) return;
    import('../services/analyticsService').then(({ getAnalytics }) => {
      getAnalytics()
        .then((d) => setAnalytics(d.analytics || null))
        .catch(() => {});
    });
  }, [isAuthenticated]);

  // Load personalized recommendations
  useEffect(() => {
    if (!isAuthenticated) return;
    setRecLoading(true);
    getPersonalizedRecommendations()
      .then((d) => setRecommendations(d.recommendations || []))
      .catch(() => setRecommendations([]))
      .finally(() => setRecLoading(false));
  }, [isAuthenticated]);

  // Load trending (mini strip)
  useEffect(() => {
    getTrendingNews()
      .then((d) => setTrending((d.trending_news || []).slice(0, 5)))
      .catch(() => {});
  }, []);

  // Load main news
  const loadNews = useCallback(async () => {
    const id = requestVersion.current + 1;
    requestVersion.current = id;
    setLoading(true);
    setError('');
    try {
      const term = debouncedQuery.trim();
      const data = term ? await searchNews(term) : await getNews(page, PAGE_SIZE);
      if (id !== requestVersion.current) return;
      setNews(data.news || []);
      setTotalPages(term ? 1 : (data.total_pages || 1));
    } catch (err) {
      if (id === requestVersion.current) setError(getApiErrorMessage(err));
    } finally {
      if (id === requestVersion.current) setLoading(false);
    }
  }, [page, debouncedQuery]);

  useEffect(() => { loadNews(); }, [loadNews]);

  // Derived: unique categories
  const categories = useMemo(
    () => [...new Set(news.map((n) => n.category).filter(Boolean))],
    [news]
  );

  const visibleNews = useMemo(
    () => news.filter((n) => !category || n.category === category),
    [news, category]
  );

  const toggleBookmark = async (newsItem) => {
    if (!isAuthenticated) { notify('Sign in to save stories.', 'info'); return; }
    const id = newsItem._id;
    try {
      if (bookmarked.has(id)) {
        await removeBookmark(id);
        setBookmarked((prev) => { const s = new Set(prev); s.delete(id); return s; });
        notify('Bookmark removed.');
      } else {
        await addBookmark(id);
        setBookmarked((prev) => new Set(prev).add(id));
        notify('Saved to your bookmarks.');
      }
    } catch (err) {
      notify(getApiErrorMessage(err), 'error');
    }
  };

  const updateSearch = (val) => {
    setQuery(val);
    setSearchParams(val ? { q: val } : {}, { replace: true });
  };

  // Determine lead story
  const isSearching = Boolean(debouncedQuery.trim());
  const leadStory = !isSearching
    ? (recommendations[0] || news[0])
    : null;
  const leadReason = recommendations[0] ? recommendations[0].reason : null;
  const leadScore = recommendations[0] ? (recommendations[0].hybrid_score ?? 0) : 0;

  // For You items (skip lead story if it came from recommendations)
  const forYouItems = recommendations.slice(leadStory === recommendations[0] ? 1 : 0);

  return (
    <>
      {/* Personalization headline */}
      {!isSearching && (
        <PersonalizationHeadline
          user={user}
          analytics={analytics}
          loading={recLoading && isAuthenticated}
        />
      )}

      {/* Search bar */}
      <Box
        component="form"
        onSubmit={(e) => { e.preventDefault(); }}
        sx={{ mb: 3 }}
      >
        <TextField
          inputRef={searchRef}
          fullWidth
          value={query}
          onChange={(e) => updateSearch(e.target.value)}
          placeholder="Search stories, authors, topics…"
          size="medium"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchRounded sx={{ opacity: 0.45, fontSize: 20 }} />
              </InputAdornment>
            ),
            endAdornment: query ? (
              <InputAdornment position="end">
                <IconButton size="small" onClick={() => updateSearch('')} aria-label="Clear search">
                  <CloseRounded fontSize="small" />
                </IconButton>
              </InputAdornment>
            ) : null,
          }}
          sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
        />
      </Box>

      {/* Category chips */}
      {categories.length > 0 && (
        <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ mb: 3 }}>
          <Chip
            label="All"
            color={!category ? 'primary' : 'default'}
            variant={!category ? 'filled' : 'outlined'}
            onClick={() => setCategory('')}
            size="small"
          />
          {categories.map((cat) => (
            <Chip
              key={cat}
              label={cat}
              color={category === cat ? 'primary' : 'default'}
              variant={category === cat ? 'filled' : 'outlined'}
              onClick={() => setCategory(cat)}
              size="small"
            />
          ))}
        </Stack>
      )}

      {/* Search results */}
      {isSearching && (
        <>
          <SectionHeader
            eyebrow="SEARCH RESULTS"
            title={`"${debouncedQuery}"`}
            action={
              <Button size="small" startIcon={<CloseRounded />} onClick={() => updateSearch('')}>
                Clear
              </Button>
            }
            sx={{ mb: 2.5 }}
          />
          {loading ? (
            <Grid container spacing={2.5}>
              {Array.from({ length: 6 }, (_, i) => (
                <Grid item xs={12} sm={6} md={4} key={i}><NewsSkeleton count={1} /></Grid>
              ))}
            </Grid>
          ) : error ? (
            <ErrorState message={error} onRetry={loadNews} />
          ) : visibleNews.length === 0 ? (
            <EmptyState
              title="No results found"
              description={`We couldn't find any stories matching "${debouncedQuery}". Try a different search term.`}
              actionLabel="Clear search"
              onAction={() => updateSearch('')}
            />
          ) : (
            <Grid container spacing={2.5}>
              {visibleNews.map((item, i) => (
                <Grid item xs={12} sm={6} md={4} key={item._id}>
                  <NewsCard
                    news={item}
                    priority={i < 3}
                    bookmarked={bookmarked.has(item._id)}
                    onBookmark={isAuthenticated ? toggleBookmark : null}
                  />
                </Grid>
              ))}
            </Grid>
          )}
        </>
      )}

      {!isSearching && (
        <>
          {/* Lead story */}
          {(loading || recLoading) && !leadStory ? (
            <Skeleton variant="rectangular" height={480} sx={{ borderRadius: 2, mb: 5 }} />
          ) : leadStory ? (
            <Box sx={{ mb: 5 }}>
              <FeaturedNewsCard
                news={leadStory}
                reason={leadReason}
                score={leadScore}
              />
            </Box>
          ) : null}

          {/* For You — personalized recommendations */}
          {isAuthenticated && (
            <Box sx={{ mb: 6 }}>
              <SectionHeader
                eyebrow="FOR YOU"
                title="Recommended"
                description={recLoading ? 'Finding the best stories for you…' : ''}
                action={
                  <Button
                    size="small"
                    startIcon={<RefreshRounded />}
                    onClick={() => {
                      setRecLoading(true);
                      getPersonalizedRecommendations()
                        .then((d) => setRecommendations(d.recommendations || []))
                        .catch(() => {})
                        .finally(() => setRecLoading(false));
                    }}
                  >
                    Refresh
                  </Button>
                }
                sx={{ mb: 2.5 }}
              />
              {recLoading ? (
                <Grid container spacing={2.5}>
                  {[1, 2, 3].map((i) => <Grid item xs={12} sm={6} md={4} key={i}><NewsSkeleton count={1} /></Grid>)}
                </Grid>
              ) : forYouItems.length > 0 ? (
                <Grid container spacing={2.5}>
                  {forYouItems.slice(0, 6).map((item, i) => (
                    <Grid item xs={12} sm={6} md={4} key={item._id}>
                      <NewsCard news={item} priority={i < 2} bookmarked={bookmarked.has(item._id)} onBookmark={toggleBookmark} />
                    </Grid>
                  ))}
                </Grid>
              ) : (
                <EmptyState
                  icon={AutoAwesomeRounded}
                  title="Your feed is ready to learn"
                  description="Read a few stories and Nexora will start building personalised picks around your interests."
                  compact
                />
              )}
            </Box>
          )}

          {/* Trending strip */}
          {trending.length > 0 && (
            <Box sx={{ mb: 6 }}>
              <SectionHeader
                eyebrow="TRENDING NOW"
                title="What readers are watching"
                action={
                  <Button size="small" startIcon={<LocalFireDepartmentRounded />} component={RouterLink} to="/trending">
                    See all
                  </Button>
                }
                sx={{ mb: 1 }}
              />
              <Box sx={{ borderTop: '1px solid', borderColor: 'divider' }}>
                {trending.map((item, i) => (
                  <Box key={item._id} sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
                    <CompactNewsItem news={item} rank={i + 1} showRank />
                  </Box>
                ))}
              </Box>
            </Box>
          )}

          {/* Explore more */}
          <Box>
            <SectionHeader
              eyebrow="EXPLORE"
              title="More stories"
              action={
                <Stack direction="row" spacing={1}>
                  <Button size="small" startIcon={<RefreshRounded />} onClick={loadNews}>Refresh</Button>
                </Stack>
              }
              sx={{ mb: 2.5 }}
            />
            {error ? (
              <ErrorState message={error} onRetry={loadNews} />
            ) : loading ? (
              <Grid container spacing={2.5}>
                {Array.from({ length: PAGE_SIZE }, (_, i) => (
                  <Grid item xs={12} sm={6} md={4} key={i}><NewsSkeleton count={1} /></Grid>
                ))}
              </Grid>
            ) : visibleNews.length === 0 ? (
              <EmptyState title="No stories yet" description="Stories will appear here as they're added to Nexora." />
            ) : (
              <Grid container spacing={2.5}>
                {(leadStory ? visibleNews.filter((n) => n._id !== leadStory._id) : visibleNews).map((item, i) => (
                  <Grid item xs={12} sm={6} md={4} key={item._id}>
                    <NewsCard
                      news={item}
                      priority={i < 3}
                      bookmarked={bookmarked.has(item._id)}
                      onBookmark={isAuthenticated ? toggleBookmark : null}
                    />
                  </Grid>
                ))}
              </Grid>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <Stack direction="row" justifyContent="center" spacing={1} sx={{ mt: 4 }}>
                <Button
                  variant="outlined"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  size="small"
                >
                  Previous
                </Button>
                <Typography variant="body2" sx={{ alignSelf: 'center', color: 'text.secondary' }}>
                  Page {page} of {totalPages}
                </Typography>
                <Button
                  variant="outlined"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  size="small"
                >
                  Next
                </Button>
              </Stack>
            )}
          </Box>
        </>
      )}

      <AppSnackbar feedback={feedback} onClose={dismiss} />
    </>
  );
}
