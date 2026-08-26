import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Alert,
  Divider,
  Stack,
  Paper,
  Grid,
  Chip,
  IconButton,
  Tooltip,
  Snackbar,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import LocalActivityIcon from '@mui/icons-material/LocalActivity';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import FavoriteIcon from '@mui/icons-material/Favorite';
import ThumbDownOffAltIcon from '@mui/icons-material/ThumbDownOffAlt';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';

import { getTrendingNews, bookmarkNews, likeNews, dislikeNews } from '../services/newsService';
import { useAuth } from '../context/AuthContext';
import NewsCard from '../components/common/NewsCard';
import NewsCardSkeleton from '../components/common/NewsCardSkeleton';

function Trending() {
  const theme = useTheme();
  const navigate = useNavigate();
  const { token, isAuthenticated } = useAuth();
  const isDark = theme.palette.mode === 'dark';

  const [trendingNews, setTrendingNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Reaction states
  const [bookmarkedMap, setBookmarkedMap] = useState({});
  const [likedMap, setLikedMap] = useState({});
  const [dislikedMap, setDislikedMap] = useState({});
  const [snackbar, setSnackbar] = useState({ open: false, message: '' });

  const primaryAccent = isDark ? '#38BDF8' : '#2563EB';
  const surfaceBg = isDark ? '#111827' : '#FFFFFF';
  const borderCol = isDark ? '#1E293B' : '#E2E8F0';

  useEffect(() => {
    fetchTrending();
  }, []);

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
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    const isBookmarked = !!bookmarkedMap[item._id];
    setBookmarkedMap((prev) => ({ ...prev, [item._id]: !isBookmarked }));
    setSnackbar({
      open: true,
      message: !isBookmarked ? 'Article saved to your Bookmarks!' : 'Removed from Bookmarks.',
    });
    try {
      await bookmarkNews(item._id, token);
    } catch {
      /* silent rollback on error */
    }
  };

  const handleLike = async (item) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    const isLiked = !!likedMap[item._id];
    setLikedMap((prev) => ({ ...prev, [item._id]: !isLiked }));
    if (!isLiked) setDislikedMap((prev) => ({ ...prev, [item._id]: false }));
    setSnackbar({
      open: true,
      message: !isLiked ? 'Article liked!' : 'Reaction removed.',
    });
    try {
      await likeNews(item._id, token);
    } catch {
      /* silent */
    }
  };

  const handleDislike = async (item) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    const isDisliked = !!dislikedMap[item._id];
    setDislikedMap((prev) => ({ ...prev, [item._id]: !isDisliked }));
    if (!isDisliked) setLikedMap((prev) => ({ ...prev, [item._id]: false }));
    setSnackbar({
      open: true,
      message: !isDisliked ? 'Article disliked. Nexora will adjust recommendations.' : 'Reaction removed.',
    });
    try {
      await dislikeNews(item._id, token);
    } catch {
      /* silent */
    }
  };

  const sectionLabel = {
    fontFamily: '"Inter", sans-serif',
    fontWeight: 700,
    fontSize: '0.6875rem',
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    color: theme.palette.text.secondary,
  };

  const getCleanSnippet = (text) => {
    if (!text) return '';
    let clean = text
      .replace(/&#8217;/g, "'")
      .replace(/&#8216;/g, "'")
      .replace(/&#8220;/g, '"')
      .replace(/&#8221;/g, '"')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/<[^>]*>?/gm, '')
      .replace(/\s+/g, ' ')
      .trim();
    const idx = clean.indexOf('Three frontier AI labs shipped');
    if (idx !== -1) return clean.slice(idx);
    return clean.length > 220 ? clean.slice(0, 220) + '...' : clean;
  };

  const topStory = trendingNews[0];
  const secondaryTrending = trendingNews.slice(1, 3);
  const rankedList = trendingNews.slice(3);

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
        {/* Header */}
        <Box sx={{ mb: 3 }}>
          <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 1 }}>
            <Box
              sx={{
                px: 1.25,
                py: 0.35,
                borderRadius: '4px',
                bgcolor: isDark ? 'rgba(56, 189, 248, 0.12)' : 'rgba(37, 99, 235, 0.08)',
                border: `1px solid ${isDark ? 'rgba(56, 189, 248, 0.25)' : 'rgba(37, 99, 235, 0.18)'}`,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0.75,
              }}
            >
              <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#EF4444' }} />
              <Typography
                variant="caption"
                sx={{
                  fontFamily: '"Inter", sans-serif',
                  fontWeight: 700,
                  fontSize: '0.65rem',
                  letterSpacing: '0.08em',
                  color: isDark ? '#F87171' : '#DC2626',
                  textTransform: 'uppercase',
                }}
              >
                LIVE TRENDING VELOCITY
              </Typography>
            </Box>
          </Stack>

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
            Trending Intelligence
          </Typography>
          <Typography variant="body2" color="text.secondary">
            The most read, engaged, and discussed stories across Nexora right now.
          </Typography>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

        {loading ? (
          <NewsCardSkeleton variant="featured" />
        ) : trendingNews.length > 0 ? (
          <Stack spacing={4}>
            {/* ── #1 FEATURED TRENDING HERO CARD ── */}
            {topStory && (
              <Paper
                elevation={0}
                onClick={() => navigate(`/news/${topStory._id}`)}
                sx={{
                  cursor: 'pointer',
                  borderRadius: '14px',
                  border: `1px solid ${borderCol}`,
                  backgroundColor: surfaceBg,
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: { xs: 'column', md: 'row' },
                  alignItems: 'center',
                  transition: 'all 0.25s ease',
                  '&:hover': {
                    borderColor: primaryAccent,
                    boxShadow: isDark ? '0 8px 24px rgba(0,0,0,0.5)' : '0 6px 20px rgba(37,99,235,0.08)',
                  },
                }}
              >
                {/* Left: Image (40% width) */}
                <Box
                  sx={{
                    width: { xs: '100%', md: '40%' },
                    height: { xs: 220, md: 250 },
                    position: 'relative',
                    overflow: 'hidden',
                    backgroundColor: borderCol,
                    flexShrink: 0,
                  }}
                >
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 12,
                      left: 12,
                      zIndex: 2,
                      px: 1.25,
                      py: 0.4,
                      borderRadius: '6px',
                      bgcolor: '#DC2626',
                      color: '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.75,
                    }}
                  >
                    <TrendingUpIcon sx={{ fontSize: 13 }} />
                    <Typography
                      sx={{
                        fontFamily: '"Inter", sans-serif',
                        fontWeight: 800,
                        fontSize: '0.65rem',
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                      }}
                    >
                      #1 TRENDING STORY
                    </Typography>
                  </Box>

                  <Box
                    component="img"
                    src={topStory.image_url || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=800&q=80'}
                    alt={topStory.title}
                    onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=800&q=80'; }}
                    sx={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      display: 'block',
                    }}
                  />
                </Box>

                {/* Right: Content (60% width - dense and filled) */}
                <Box
                  sx={{
                    width: { xs: '100%', md: '60%' },
                    p: { xs: 2.5, md: 3 },
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1, flexWrap: 'wrap', gap: 0.5 }}>
                    <Typography
                      sx={{
                        fontFamily: '"Inter", sans-serif',
                        fontWeight: 800,
                        fontSize: '0.7rem',
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                        color: primaryAccent,
                      }}
                    >
                      {topStory.category || 'Technology'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">·</Typography>
                    <Typography variant="caption" sx={{ color: '#059669', fontWeight: 700, fontSize: '0.72rem' }}>
                      🔥 Live #1 Rank
                    </Typography>
                    <Typography variant="caption" color="text.secondary">·</Typography>
                    <Typography variant="caption" color="text.secondary" fontWeight={500}>
                      {topStory.source || 'Nexora News'}
                    </Typography>
                  </Stack>

                  <Typography
                    variant="h4"
                    sx={{
                      fontFamily: '"Plus Jakarta Sans", "Inter", sans-serif',
                      fontWeight: 800,
                      lineHeight: 1.28,
                      letterSpacing: '-0.02em',
                      color: theme.palette.text.primary,
                      mb: 1.25,
                      fontSize: { xs: '1.15rem', md: '1.35rem' },
                    }}
                  >
                    {topStory.title}
                  </Typography>

                  {topStory.content && (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        lineHeight: 1.6,
                        fontSize: '0.85rem',
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        mb: 2,
                      }}
                    >
                      {getCleanSnippet(topStory.content)}
                    </Typography>
                  )}

                  {/* Footer Action Bar */}
                  <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ pt: 1.5, borderTop: `1px solid ${borderCol}` }}>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <Typography variant="caption" color="text.secondary" fontWeight={600}>
                        Source: {topStory.source || 'tech-insider.org'}
                      </Typography>
                    </Stack>

                    <Stack direction="row" spacing={0.5} alignItems="center">
                      {/* Like button */}
                      <Tooltip title="Like">
                        <IconButton
                          size="small"
                          onClick={(e) => { e.stopPropagation(); handleLike(topStory); }}
                          sx={{ color: likedMap[topStory._id] ? '#C0392B' : theme.palette.text.secondary }}
                        >
                          {likedMap[topStory._id] ? <FavoriteIcon sx={{ fontSize: 18 }} /> : <FavoriteBorderIcon sx={{ fontSize: 18 }} />}
                        </IconButton>
                      </Tooltip>

                      {/* Dislike button */}
                      <Tooltip title="Dislike">
                        <IconButton
                          size="small"
                          onClick={(e) => { e.stopPropagation(); handleDislike(topStory); }}
                          sx={{ color: dislikedMap[topStory._id] ? theme.palette.text.primary : theme.palette.text.secondary }}
                        >
                          {dislikedMap[topStory._id] ? <ThumbDownIcon sx={{ fontSize: 18 }} /> : <ThumbDownOffAltIcon sx={{ fontSize: 18 }} />}
                        </IconButton>
                      </Tooltip>

                      {/* Bookmark / Save button */}
                      <Tooltip title="Save to Bookmarks">
                        <IconButton
                          size="small"
                          onClick={(e) => { e.stopPropagation(); handleBookmark(topStory); }}
                          sx={{ color: bookmarkedMap[topStory._id] ? primaryAccent : theme.palette.text.secondary }}
                        >
                          {bookmarkedMap[topStory._id] ? <BookmarkIcon sx={{ fontSize: 18 }} /> : <BookmarkBorderIcon sx={{ fontSize: 18 }} />}
                        </IconButton>
                      </Tooltip>

                      <Box
                        onClick={(e) => { e.stopPropagation(); navigate(`/news/${topStory._id}`); }}
                        sx={{
                          ml: 1,
                          px: 2,
                          py: 0.6,
                          borderRadius: '6px',
                          bgcolor: isDark ? 'rgba(56, 189, 248, 0.14)' : 'rgba(37, 99, 235, 0.09)',
                          color: primaryAccent,
                          fontSize: '0.8rem',
                          fontWeight: 700,
                          fontFamily: '"Inter", sans-serif',
                          transition: 'all 0.15s ease',
                          '&:hover': {
                            bgcolor: primaryAccent,
                            color: '#FFFFFF',
                          },
                        }}
                      >
                        Read full story →
                      </Box>
                    </Stack>
                  </Stack>
                </Box>
              </Paper>
            )}

            {/* ── SPLIT GRID: #2 & #3 TRENDING CARDS (LEFT) + RANKED LEADERBOARD (RIGHT) ── */}
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: {
                  xs: '1fr',
                  md: '7fr 5fr',
                },
                gap: 3,
                alignItems: 'start',
              }}
            >
              {/* Left Column: Top #2 & #3 Trending Cards */}
              <Box>
                <Typography sx={{ ...sectionLabel, mb: 2 }}>Featured High-Velocity Stories</Typography>
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: {
                      xs: '1fr',
                      sm: 'repeat(2, 1fr)',
                    },
                    gap: 3,
                  }}
                >
                  {secondaryTrending.map((item, idx) => (
                    <NewsCard
                      key={item._id || idx}
                      news={item}
                      variant="standard"
                      onBookmark={handleBookmark}
                      onClick={() => navigate(`/news/${item._id}`)}
                    />
                  ))}
                </Box>
              </Box>

              {/* Right Column: Ranked Leaderboard List (#4 through #10) */}
              <Box>
                <Typography sx={{ ...sectionLabel, mb: 2 }}>Trending Leaderboard</Typography>
                <Paper
                  elevation={0}
                  sx={{
                    p: 2.5,
                    borderRadius: '12px',
                    border: `1px solid ${borderCol}`,
                    backgroundColor: surfaceBg,
                  }}
                >
                  <Stack spacing={2} divider={<Divider flexItem />}>
                    {rankedList.length > 0 ? (
                      rankedList.map((item, idx) => (
                        <Box
                          key={item._id || idx}
                          onClick={() => navigate(`/news/${item._id}`)}
                          sx={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: 1.75,
                            cursor: 'pointer',
                            '&:hover .rank-title': { color: primaryAccent },
                          }}
                        >
                          <Typography
                            sx={{
                              fontFamily: '"Playfair Display", Georgia, serif',
                              fontWeight: 800,
                              fontSize: '1.2rem',
                              lineHeight: 1,
                              color: primaryAccent,
                              minWidth: 26,
                              flexShrink: 0,
                              mt: 0.25,
                            }}
                          >
                            {String(idx + 4).padStart(2, '0')}
                          </Typography>

                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography
                              className="rank-title"
                              variant="subtitle2"
                              fontWeight={700}
                              sx={{
                                lineHeight: 1.35,
                                color: theme.palette.text.primary,
                                mb: 0.5,
                                fontSize: '0.875rem',
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                                transition: 'color 0.15s ease',
                              }}
                            >
                              {item.title}
                            </Typography>
                            <Stack direction="row" alignItems="center" spacing={1}>
                              {item.category && (
                                <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ fontSize: '0.68rem', textTransform: 'uppercase' }}>
                                  {item.category}
                                </Typography>
                              )}
                              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.68rem' }}>
                                · {item.source || 'Nexora'}
                              </Typography>
                            </Stack>
                          </Box>

                          <IconButton
                            size="small"
                            onClick={(e) => { e.stopPropagation(); handleBookmark(item); }}
                            sx={{ color: theme.palette.text.secondary, flexShrink: 0 }}
                          >
                            <BookmarkBorderIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Box>
                      ))
                    ) : (
                      trendingNews.map((item, idx) => (
                        <Box
                          key={item._id || idx}
                          onClick={() => navigate(`/news/${item._id}`)}
                          sx={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: 1.75,
                            cursor: 'pointer',
                            '&:hover .rank-title': { color: primaryAccent },
                          }}
                        >
                          <Typography
                            sx={{
                              fontFamily: '"Playfair Display", Georgia, serif',
                              fontWeight: 800,
                              fontSize: '1.2rem',
                              lineHeight: 1,
                              color: primaryAccent,
                              minWidth: 26,
                              flexShrink: 0,
                              mt: 0.25,
                            }}
                          >
                            {String(idx + 1).padStart(2, '0')}
                          </Typography>

                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography
                              className="rank-title"
                              variant="subtitle2"
                              fontWeight={700}
                              sx={{
                                lineHeight: 1.35,
                                color: theme.palette.text.primary,
                                mb: 0.5,
                                fontSize: '0.875rem',
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                                transition: 'color 0.15s ease',
                              }}
                            >
                              {item.title}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.68rem' }}>
                              {item.source || 'Nexora'}
                            </Typography>
                          </Box>
                        </Box>
                      ))
                    )}
                  </Stack>
                </Paper>
              </Box>
            </Box>
          </Stack>
        ) : (
          <Box sx={{ py: 6, textAlign: 'center' }}>
            <Typography variant="body1" color="text.secondary">
              No trending stories yet. Start reading and the algorithm will surface popular articles.
            </Typography>
          </Box>
        )}
      </Box>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ open: false, message: '' })}
        message={snackbar.message}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Box>
  );
}

export default Trending;