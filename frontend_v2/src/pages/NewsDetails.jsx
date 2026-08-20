import { useCallback, useEffect, useState } from 'react';
import {
  Alert, Box, Button, Chip, Divider, Grid,
  IconButton, Stack, Tooltip, Typography,
} from '@mui/material';
import {
  ArrowBackRounded,
  BookmarkBorderRounded, BookmarkRounded,
  ThumbDownAltOutlined, ThumbUpAltOutlined,
  ThumbDownAlt, ThumbUpAlt,
} from '@mui/icons-material';
import { Link as RouterLink, useParams } from 'react-router-dom';
import AppSnackbar from '../components/common/AppSnackbar';
import ArticleSkeleton from '../components/common/ArticleSkeleton';
import EmptyState from '../components/common/EmptyState';
import ErrorState from '../components/common/ErrorState';
import NewsCard from '../components/common/NewsCard';
import ReadingProgress from '../components/common/ReadingProgress';
import RecommendationReason from '../components/common/RecommendationReason';
import SectionHeader from '../components/common/SectionHeader';
import { useAuth } from '../context/AuthContext';
import useDocumentTitle from '../hooks/useDocumentTitle';
import useFeedback from '../hooks/useFeedback';
import { addBookmark, getBookmarks, removeBookmark } from '../services/bookmarkService';
import { getNewsById, getSimilarNews } from '../services/newsService';
import { dislikeNews, getReactions, likeNews, recordReadingHistory } from '../services/reactionService';
import { getApiErrorMessage } from '../utils/apiError';
import { formatDate } from '../utils/formatters';

export default function NewsDetails() {
  const { newsId } = useParams();
  const { isAuthenticated } = useAuth();
  const [news, setNews] = useState(null);
  const [related, setRelated] = useState([]);
  const [reactions, setReactions] = useState({ likes: 0, dislikes: 0 });
  const [userReaction, setUserReaction] = useState(null); // 'like' | 'dislike' | null
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [bookmarked, setBookmarked] = useState(false);
  const { feedback, notify, dismiss } = useFeedback();

  useDocumentTitle(news?.title || 'Story — Nexora');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [storyRes, relatedRes, reactionsRes] = await Promise.all([
        getNewsById(newsId),
        getSimilarNews(newsId).catch(() => ({ recommendations: [] })),
        getReactions(newsId).catch(() => ({})),
      ]);
      setNews(storyRes.news || null);
      setRelated(relatedRes.recommendations || []);
      const r = reactionsRes.reactions || reactionsRes;
      setReactions({ likes: r.likes || 0, dislikes: r.dislikes || 0 });
      if (isAuthenticated) {
        recordReadingHistory(newsId).catch(() => {});
      }
    } catch (err) {
      setError(getApiErrorMessage(err, 'This story is not available.'));
    } finally {
      setLoading(false);
    }
  }, [newsId, isAuthenticated]);

  useEffect(() => { load(); }, [load]);

  // Load bookmark state
  useEffect(() => {
    if (!isAuthenticated) { setBookmarked(false); return; }
    let alive = true;
    getBookmarks()
      .then((d) => { if (alive) setBookmarked((d.bookmarks || []).some((b) => b._id === newsId)); })
      .catch(() => {});
    return () => { alive = false; };
  }, [isAuthenticated, newsId]);

  const toggleBookmark = async () => {
    if (!isAuthenticated) { notify('Sign in to save stories.', 'info'); return; }
    try {
      if (bookmarked) {
        await removeBookmark(newsId);
        notify('Bookmark removed.');
      } else {
        await addBookmark(newsId);
        notify('Saved to bookmarks.');
      }
      setBookmarked((v) => !v);
    } catch (err) {
      notify(getApiErrorMessage(err), 'error');
    }
  };

  const react = async (type) => {
    if (!isAuthenticated) { notify('Sign in to react to stories.', 'info'); return; }
    try {
      if (type === 'like') await likeNews(newsId);
      else await dislikeNews(newsId);
      setUserReaction((prev) => prev === type ? null : type);
      notify('Reaction saved.');
      const latest = await getReactions(newsId).catch(() => ({}));
      const r = latest.reactions || latest;
      setReactions({ likes: r.likes || 0, dislikes: r.dislikes || 0 });
    } catch (err) {
      notify(getApiErrorMessage(err), 'error');
    }
  };

  if (loading) return <><ReadingProgress /><ArticleSkeleton /></>;
  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!news) return (
    <EmptyState
      title="Story not found"
      description="This article may have been removed or the link is incorrect."
      actionLabel="Browse stories"
      onAction={() => window.history.back()}
    />
  );

  return (
    <>
      <ReadingProgress />

      {/* Back */}
      <Button
        component={RouterLink}
        to="/"
        startIcon={<ArrowBackRounded />}
        size="small"
        sx={{ mb: 3, opacity: 0.7 }}
        color="inherit"
      >
        Back
      </Button>

      {/* Article layout */}
      <Box sx={{ maxWidth: 720, mx: 'auto' }}>
        {/* Metadata */}
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }} flexWrap="wrap">
          <Chip label={news.category || 'General'} size="small" color="primary" />
          <Typography variant="caption" color="text.disabled">
            {formatDate(news.created_at)}
          </Typography>
          {news.source && (
            <Typography variant="caption" color="text.disabled">· {news.source}</Typography>
          )}
        </Stack>

        {/* Headline */}
        <Typography
          component="h1"
          className="signal-headline"
          sx={{
            fontFamily: 'Georgia, "Times New Roman", serif',
            fontWeight: 700,
            fontSize: { xs: '1.75rem', sm: '2.25rem', md: '2.5rem' },
            lineHeight: 1.18,
            letterSpacing: '-0.02em',
            mb: 2.5,
          }}
        >
          {news.title}
        </Typography>

        {/* Author + actions */}
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          sx={{ mb: 3, pb: 2.5, borderBottom: '1px solid', borderColor: 'divider' }}
          flexWrap="wrap"
          gap={1}
        >
          <Box>
            <Typography variant="body2" fontWeight={650}>
              {news.author || 'Nexora editorial'}
            </Typography>
            <Typography variant="caption" color="text.disabled">
              {news.source || ''}
            </Typography>
          </Box>

          {/* Desktop actions */}
          <Stack direction="row" spacing={0.5} alignItems="center">
            <Tooltip title={bookmarked ? 'Remove bookmark' : 'Save story'}>
              <IconButton
                color={bookmarked ? 'primary' : 'default'}
                onClick={toggleBookmark}
                aria-label={bookmarked ? 'Remove bookmark' : 'Save story'}
                size="small"
              >
                {bookmarked ? <BookmarkRounded /> : <BookmarkBorderRounded />}
              </IconButton>
            </Tooltip>
            <Tooltip title="Like this story">
              <IconButton
                onClick={() => react('like')}
                color={userReaction === 'like' ? 'primary' : 'default'}
                aria-label="Like"
                size="small"
              >
                {userReaction === 'like' ? <ThumbUpAlt /> : <ThumbUpAltOutlined />}
              </IconButton>
            </Tooltip>
            <Typography variant="caption" color="text.secondary">{reactions.likes}</Typography>
            <Tooltip title="Not interested">
              <IconButton
                onClick={() => react('dislike')}
                color={userReaction === 'dislike' ? 'error' : 'default'}
                aria-label="Not interested"
                size="small"
              >
                {userReaction === 'dislike' ? <ThumbDownAlt /> : <ThumbDownAltOutlined />}
              </IconButton>
            </Tooltip>
            <Typography variant="caption" color="text.secondary">{reactions.dislikes}</Typography>
          </Stack>
        </Stack>

        {/* Hero image */}
        {news.image_url && (
          <Box
            component="img"
            src={news.image_url}
            alt={news.title}
            sx={{
              width: '100%',
              maxHeight: 460,
              objectFit: 'cover',
              borderRadius: 2,
              display: 'block',
              mb: 4,
            }}
            onError={(e) => { e.target.style.display = 'none'; }}
          />
        )}

        {/* Article body */}
        <Typography
          className="signal-editorial"
          component="div"
          sx={{
            fontFamily: 'Georgia, "Times New Roman", serif',
            fontSize: { xs: '1rem', md: '1.125rem' },
            lineHeight: 1.78,
            color: 'text.primary',
            '& p': { mb: 2 },
            whiteSpace: 'pre-line',
          }}
        >
          {news.content || (
            <Typography color="text.secondary" fontStyle="italic">
              Full article content is not available. Visit the original source to read the complete story.
            </Typography>
          )}
        </Typography>

        {/* Source link */}
        {news.url && (
          <Box sx={{ mt: 4, pt: 3, borderTop: '1px solid', borderColor: 'divider' }}>
            <Typography variant="body2" color="text.secondary">
              Read the original article on{' '}
              <a
                href={news.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: 'inherit', textDecoration: 'underline', fontWeight: 600 }}
              >
                {news.source || 'source'}
              </a>
            </Typography>
          </Box>
        )}
      </Box>

      {/* Mobile sticky action bar */}
      <Box
        sx={{
          display: { xs: 'flex', md: 'none' },
          position: 'fixed',
          bottom: 60, // above bottom nav
          left: 0,
          right: 0,
          zIndex: 1100,
          bgcolor: 'background.paper',
          borderTop: '1px solid',
          borderColor: 'divider',
          px: 2,
          py: 1,
          gap: 1,
          justifyContent: 'center',
        }}
      >
        <IconButton
          color={bookmarked ? 'primary' : 'default'}
          onClick={toggleBookmark}
          aria-label={bookmarked ? 'Remove bookmark' : 'Save'}
          size="small"
        >
          {bookmarked ? <BookmarkRounded /> : <BookmarkBorderRounded />}
        </IconButton>
        <IconButton onClick={() => react('like')} color={userReaction === 'like' ? 'primary' : 'default'} size="small" aria-label="Like">
          {userReaction === 'like' ? <ThumbUpAlt /> : <ThumbUpAltOutlined />}
        </IconButton>
        <Typography variant="caption" sx={{ alignSelf: 'center' }}>{reactions.likes}</Typography>
        <IconButton onClick={() => react('dislike')} color={userReaction === 'dislike' ? 'error' : 'default'} size="small" aria-label="Not interested">
          {userReaction === 'dislike' ? <ThumbDownAlt /> : <ThumbDownAltOutlined />}
        </IconButton>
        <Typography variant="caption" sx={{ alignSelf: 'center' }}>{reactions.dislikes}</Typography>
      </Box>

      {/* Related stories */}
      {related.length > 0 && (
        <Box sx={{ mt: 8 }}>
          <Divider sx={{ mb: 5 }} />
          <SectionHeader eyebrow="KEEP EXPLORING" title="Related stories" sx={{ mb: 3 }} />
          <Grid container spacing={2.5}>
            {related.slice(0, 3).map((item, i) => (
              <Grid item xs={12} sm={6} md={4} key={item._id}>
                <NewsCard news={item} priority={i === 0} />
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      <AppSnackbar feedback={feedback} onClose={dismiss} />
    </>
  );
}
