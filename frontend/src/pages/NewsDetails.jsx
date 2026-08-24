import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Divider,
  Stack,
  IconButton,
  Snackbar,
  Alert,
  Skeleton,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  Slide,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import FavoriteIcon from '@mui/icons-material/Favorite';
import ShareIcon from '@mui/icons-material/Share';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import CloseIcon from '@mui/icons-material/Close';
import ArticleIcon from '@mui/icons-material/Article';

import {
  getNewsById,
  bookmarkNews,
  likeNews,
  recordReadingHistory,
} from '../services/newsService';
import { useAuth } from '../context/AuthContext';

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=1400&q=80';

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

function NewsDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const { token, isAuthenticated } = useAuth();

  const [news, setNews] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bookmarked, setBookmarked] = useState(false);
  const [liked, setLiked] = useState(false);
  const [readerOpen, setReaderOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const showMsg = (message, severity = 'success') =>
    setSnackbar({ open: true, message, severity });

  useEffect(() => { fetchArticle(); }, [id]);

  useEffect(() => {
    if (news && isAuthenticated && token) {
      recordReadingHistory(news._id, token).catch(() => {});
    }
  }, [news, isAuthenticated, token]);

  const fetchArticle = async () => {
    try {
      setLoading(true);
      const res = await getNewsById(id);
      if (res.success) setNews(res.news);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleBookmark = async () => {
    if (!isAuthenticated || !token) {
      showMsg('Please sign in to bookmark stories.', 'info');
      setTimeout(() => navigate('/login'), 1200);
      return;
    }
    const targetId = news?._id || news?.id || id;
    if (!targetId) {
      showMsg('Article identifier missing.', 'error');
      return;
    }
    try {
      const res = await bookmarkNews(targetId, token);
      setBookmarked((p) => !p);
      showMsg(res.message || 'Bookmark updated.');
    } catch (err) {
      if (err?.response?.status === 401 || err?.response?.status === 403) {
        showMsg('Session expired. Please sign in again.', 'info');
        setTimeout(() => navigate('/login'), 1200);
      } else {
        showMsg(err?.response?.data?.message || 'Failed to update bookmark.', 'error');
      }
    }
  };

  const handleLike = async () => {
    if (!isAuthenticated || !token) {
      showMsg('Please sign in to like stories.', 'info');
      setTimeout(() => navigate('/login'), 1200);
      return;
    }
    const targetId = news?._id || news?.id || id;
    if (!targetId) {
      showMsg('Article identifier missing.', 'error');
      return;
    }
    try {
      const res = await likeNews(targetId, token);
      setLiked((p) => !p);
      showMsg(res.message || 'Reaction saved.');
    } catch (err) {
      if (err?.response?.status === 401 || err?.response?.status === 403) {
        showMsg('Session expired. Please sign in again.', 'info');
        setTimeout(() => navigate('/login'), 1200);
      } else {
        showMsg(err?.response?.data?.message || 'Failed to save reaction.', 'error');
      }
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: news?.title, url: window.location.href }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      showMsg('Link copied to clipboard.');
    }
  };

  const ActionBar = () => (
    <Stack direction="row" spacing={1} alignItems="center">
      <IconButton
        onClick={handleLike}
        sx={{ color: liked ? '#C0392B' : theme.palette.text.secondary, borderRadius: 1 }}
      >
        {liked ? <FavoriteIcon sx={{ fontSize: 20 }} /> : <FavoriteBorderIcon sx={{ fontSize: 20 }} />}
      </IconButton>
      <IconButton
        onClick={handleBookmark}
        sx={{ color: bookmarked ? theme.palette.text.primary : theme.palette.text.secondary, borderRadius: 1 }}
      >
        {bookmarked ? <BookmarkIcon sx={{ fontSize: 20 }} /> : <BookmarkBorderIcon sx={{ fontSize: 20 }} />}
      </IconButton>
      <IconButton
        onClick={handleShare}
        sx={{ color: theme.palette.text.secondary, borderRadius: 1 }}
      >
        <ShareIcon sx={{ fontSize: 20 }} />
      </IconButton>
    </Stack>
  );

  if (loading) {
    return (
      <Box sx={{ backgroundColor: theme.palette.background.default, minHeight: '100vh', pb: 6 }}>
        <Container maxWidth="md" sx={{ pt: 4, px: { xs: 2, md: 3 } }}>
          <Skeleton width={60} height={32} sx={{ mb: 3 }} />
          <Skeleton width="30%" height={20} sx={{ mb: 1.5 }} />
          <Skeleton width="90%" height={56} sx={{ mb: 0.5 }} />
          <Skeleton width="75%" height={56} sx={{ mb: 2 }} />
          <Skeleton width="45%" height={20} sx={{ mb: 3 }} />
          <Skeleton variant="rectangular" width="100%" sx={{ aspectRatio: '16/9', borderRadius: 1, mb: 3 }} />
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} width="100%" height={24} sx={{ mb: 0.5 }} />)}
        </Container>
      </Box>
    );
  }

  if (!news) {
    return (
      <Box sx={{ backgroundColor: theme.palette.background.default, minHeight: '100vh', pb: 6 }}>
        <Container maxWidth="md" sx={{ pt: 8, textAlign: 'center' }}>
          <Typography variant="h4" sx={{ fontFamily: '"Playfair Display", serif', fontWeight: 700, mb: 2 }}>
            Article not found
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            This story may have been removed or the link is incorrect.
          </Typography>
          <Box
            onClick={() => navigate('/')}
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 0.75,
              cursor: 'pointer',
              fontFamily: '"Inter", sans-serif',
              fontWeight: 500,
              fontSize: '0.875rem',
              color: theme.palette.text.secondary,
              '&:hover': { color: theme.palette.text.primary },
            }}
          >
            <ArrowBackIcon sx={{ fontSize: 16 }} /> Back to home
          </Box>
        </Container>
      </Box>
    );
  }

  const formattedDate = news.created_at
    ? new Date(news.created_at).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
    : '';

  return (
    <Box sx={{ backgroundColor: theme.palette.background.default, minHeight: '100vh', pb: 8 }}>
      <Container maxWidth="md" sx={{ pt: { xs: 3, md: 4 }, px: { xs: 2, md: 3 } }}>

        {/* Back */}
        <Box
          onClick={() => navigate(-1)}
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 0.75,
            cursor: 'pointer',
            fontFamily: '"Inter", sans-serif',
            fontWeight: 500,
            fontSize: '0.8125rem',
            color: theme.palette.text.secondary,
            mb: 3,
            '&:hover': { color: theme.palette.text.primary },
          }}
        >
          <ArrowBackIcon sx={{ fontSize: 15 }} /> Back
        </Box>

        {/* Category */}
        {news.category && (
          <Typography
            variant="overline"
            sx={{
              color: theme.palette.accent?.main || '#C0392B',
              fontFamily: '"Inter", sans-serif',
              fontWeight: 600,
              fontSize: '0.6875rem',
              letterSpacing: '0.08em',
              display: 'block',
              mb: 1.25,
            }}
          >
            {news.category}
          </Typography>
        )}

        {/* Headline */}
        <Typography
          variant="h1"
          component="h1"
          sx={{
            fontFamily: '"Playfair Display", Georgia, serif',
            fontWeight: 800,
            fontSize: { xs: '1.75rem', md: '2.5rem' },
            lineHeight: 1.2,
            color: theme.palette.text.primary,
            mb: 2,
          }}
        >
          {news.title}
        </Typography>

        {/* Source + date + actions */}
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          flexWrap="wrap"
          gap={1}
          sx={{ mb: 3 }}
        >
          <Typography variant="body2" color="text.secondary" sx={{ fontFamily: '"Inter", sans-serif' }}>
            {news.source || news.author || 'Nexora'}
            {formattedDate && ` · ${formattedDate}`}
          </Typography>
          <ActionBar />
        </Stack>

        {/* Hero image */}
        <Box
          sx={{
            width: '100%',
            aspectRatio: '16/9',
            overflow: 'hidden',
            borderRadius: '4px',
            mb: 3,
            backgroundColor: theme.palette.divider,
          }}
        >
          <Box
            component="img"
            src={news.image_url || DEFAULT_IMAGE}
            alt={news.title}
            onError={(e) => { e.target.src = DEFAULT_IMAGE; }}
            sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        </Box>

        {/* Article body */}
        <Box
          sx={{
            maxWidth: 760,
            mx: 'auto',
          }}
        >
          {/* Main Content Paragraphs */}
          {(() => {
            const rawContent = news.content || news.description || '';
            const cleanedContent = rawContent.replace(/\s*\[\+?\d+\s+chars\]/gi, '').trim();
            const paragraphs = cleanedContent.split(/\n\s*\n/).filter(Boolean);

            return (
              <Box sx={{ mb: 4 }}>
                {paragraphs.map((p, idx) => (
                  <Typography
                    key={idx}
                    component="p"
                    sx={{
                      fontFamily: '"Inter", sans-serif',
                      fontSize: { xs: '1.05rem', md: '1.125rem' },
                      lineHeight: 1.85,
                      color: theme.palette.text.primary,
                      mb: 2.5,
                      letterSpacing: '-0.01em',
                    }}
                  >
                    {p}
                  </Typography>
                ))}
              </Box>
            );
          })()}

          {/* Publisher Source Card & Dual Action Buttons */}
          {news.url && (() => {
            const rawSrc = news.source || news.author || '';
            const cleanSrc = rawSrc.split('-')[0].split('|')[0].trim() || 'Original Publisher';

            return (
              <Box
                sx={{
                  my: 4,
                  p: { xs: 2.5, md: 3 },
                  borderRadius: '16px',
                  backgroundColor: theme.palette.mode === 'dark' ? 'rgba(30, 41, 59, 0.5)' : 'rgba(241, 245, 249, 0.8)',
                  border: `1px solid ${theme.palette.divider}`,
                  textAlign: 'center',
                }}
              >
                <Typography variant="subtitle2" fontWeight={700} color="text.primary" sx={{ mb: 0.5 }}>
                  Read Full Coverage
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
                  This story was published by <strong>{cleanSrc}</strong>. You can read the full story in-app or visit their official site.
                </Typography>

                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center" alignItems="center">
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() => setReaderOpen(true)}
                    startIcon={<ArticleIcon />}
                    sx={{
                      borderRadius: '12px',
                      px: 3.5,
                      py: 1.25,
                      fontFamily: '"Inter", sans-serif',
                      fontWeight: 600,
                      fontSize: '0.9375rem',
                      textTransform: 'none',
                      boxShadow: '0 4px 14px rgba(37, 99, 235, 0.35)',
                      width: { xs: '100%', sm: 'auto' },
                    }}
                  >
                    Open In-App Reader
                  </Button>

                  <Button
                    variant="outlined"
                    component="a"
                    href={news.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    endIcon={<OpenInNewIcon />}
                    sx={{
                      borderRadius: '12px',
                      px: 3,
                      py: 1.25,
                      fontFamily: '"Inter", sans-serif',
                      fontWeight: 600,
                      fontSize: '0.9375rem',
                      textTransform: 'none',
                      width: { xs: '100%', sm: 'auto' },
                    }}
                  >
                    Visit {cleanSrc}
                  </Button>
                </Stack>
              </Box>
            );
          })()}

          {/* In-App Reader Full-Screen Modal Overlay */}
          {news.url && (
            <Dialog
              fullScreen
              open={readerOpen}
              onClose={() => setReaderOpen(false)}
              TransitionComponent={Transition}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  px: 3,
                  py: 1.5,
                  backgroundColor: theme.palette.background.paper,
                  borderBottom: `1px solid ${theme.palette.divider}`,
                }}
              >
                <Stack direction="row" alignItems="center" spacing={1.5}>
                  <ArticleIcon color="primary" />
                  <Typography variant="subtitle1" fontWeight={700} color="text.primary" noWrap sx={{ maxWidth: { xs: 200, sm: 400, md: 600 } }}>
                    {news.title}
                  </Typography>
                </Stack>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Button
                    size="small"
                    component="a"
                    href={news.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    endIcon={<OpenInNewIcon />}
                    sx={{ fontSize: '0.8rem' }}
                  >
                    Open Tab
                  </Button>
                  <IconButton onClick={() => setReaderOpen(false)}>
                    <CloseIcon />
                  </IconButton>
                </Stack>
              </Box>
              <DialogContent sx={{ p: { xs: 2.5, md: 5 }, backgroundColor: theme.palette.background.default, maxWidth: 840, mx: 'auto', width: '100%' }}>
                {/* Reader Header */}
                <Box sx={{ mb: 4, textAlign: 'center' }}>
                  <Typography variant="overline" color="primary" fontWeight={700} letterSpacing="0.1em">
                    {news.category || 'NEWS'} · NEXORA READER MODE
                  </Typography>
                  <Typography variant="h3" fontWeight={800} sx={{ fontFamily: '"Playfair Display", Georgia, serif', mt: 1, mb: 2, lineHeight: 1.25 }}>
                    {news.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Published by <strong>{news.source || news.author || 'Original Source'}</strong>
                  </Typography>
                </Box>

                {/* Hero Image */}
                {news.image_url && (
                  <Box sx={{ width: '100%', aspectRatio: '16/9', borderRadius: '16px', overflow: 'hidden', mb: 4, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
                    <Box component="img" src={news.image_url} alt={news.title} sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </Box>
                )}

                {/* Article Text in Reader Mode */}
                <Box sx={{ maxWidth: 720, mx: 'auto' }}>
                  {(() => {
                    const rawContent = news.content || news.description || '';
                    const cleanedContent = rawContent.replace(/\s*\[\+?\d+\s+chars\]/gi, '').trim();
                    const paragraphs = cleanedContent.split(/\n\s*\n/).filter(Boolean);

                    return paragraphs.map((p, idx) => (
                      <Typography
                        key={idx}
                        component="p"
                        sx={{
                          fontFamily: '"Merriweather", "Georgia", serif',
                          fontSize: { xs: '1.05rem', md: '1.18rem' },
                          lineHeight: 1.9,
                          color: theme.palette.text.primary,
                          mb: 3,
                        }}
                      >
                        {p}
                      </Typography>
                    ));
                  })()}

                  {/* Notice & Direct Link */}
                  <Box sx={{ mt: 5, p: 3, borderRadius: '16px', backgroundColor: theme.palette.mode === 'dark' ? 'rgba(30,41,59,0.5)' : 'rgba(241,245,249,0.8)', border: `1px solid ${theme.palette.divider}`, textAlign: 'center' }}>
                    <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
                      Reading on Nexora AI Reader
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      To view live comments, interactive graphics, or full original formatting on <strong>{news.source || 'Publisher'}</strong>'s website:
                    </Typography>
                    <Button
                      variant="contained"
                      component="a"
                      href={news.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      endIcon={<OpenInNewIcon />}
                      sx={{ borderRadius: '12px', px: 3, py: 1 }}
                    >
                      Visit {news.source || 'Publisher'} Official Site
                    </Button>
                  </Box>
                </Box>
              </DialogContent>
            </Dialog>
          )}

          <Divider sx={{ mb: 3 }} />

          {/* Bottom actions */}
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Typography variant="body2" color="text.secondary">
              Did you find this story useful?
            </Typography>
            <ActionBar />
          </Stack>
        </Box>
      </Container>

      {/* Mobile sticky action bar */}
      <Box
        sx={{
          display: { xs: 'flex', md: 'none' },
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          height: 56,
          backgroundColor: theme.palette.background.paper,
          borderTop: `1px solid ${theme.palette.divider}`,
          alignItems: 'center',
          justifyContent: 'center',
          gap: 2,
          zIndex: 1100,
        }}
      >
        <ActionBar />
      </Box>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} variant="filled" sx={{ borderRadius: 1 }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default NewsDetails;