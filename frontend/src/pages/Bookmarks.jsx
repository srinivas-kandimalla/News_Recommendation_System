import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Grid,
  Alert,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Snackbar,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';

import { getBookmarks, removeBookmark } from '../services/newsService';
import { useAuth } from '../context/AuthContext';
import NewsCard from '../components/common/NewsCard';
import NewsCardSkeleton from '../components/common/NewsCardSkeleton';

function Bookmarks() {
  const theme = useTheme();
  const navigate = useNavigate();
  const { token } = useAuth();

  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [confirmId, setConfirmId] = useState(null);
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });

  const showToast = (message, severity = 'success') => setToast({ open: true, message, severity });

  useEffect(() => {
    if (token) loadBookmarks();
    else setLoading(false);
  }, [token]);

  const loadBookmarks = async () => {
    try {
      setLoading(true);
      const res = await getBookmarks(token);
      if (res.success) setBookmarks(res.bookmarks || []);
      else setError(res.message || 'Failed to load bookmarks.');
    } catch {
      setError('Unable to load bookmarks.');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async () => {
    if (!confirmId) return;
    const id = confirmId;
    setConfirmId(null);
    try {
      const res = await removeBookmark(id, token);
      if (res.success) {
        setBookmarks((prev) => prev.filter((b) => b._id !== id));
        showToast('Bookmark removed.');
      } else showToast(res.message || 'Failed to remove.', 'error');
    } catch {
      showToast('Failed to remove bookmark.', 'error');
    }
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
            Bookmarks
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Stories you've saved to read later.
          </Typography>
        </Box>

        <Divider sx={{ mb: 3 }} />

        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

        <Typography sx={{ ...sectionLabel, mb: 2 }}>
          {loading ? 'Loading…' : `${bookmarks.length} saved ${bookmarks.length === 1 ? 'story' : 'stories'}`}
        </Typography>

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
        ) : bookmarks.length > 0 ? (
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
            {bookmarks.map((item) => (
              <NewsCard
                key={item._id}
                news={item}
                variant="standard"
                isBookmarked={true}
                onBookmark={() => setConfirmId(item._id)}
                onClick={() => navigate(`/news/${item._id}`)}
              />
            ))}
          </Box>
        ) : (
          <Box sx={{ py: 8, textAlign: 'center' }}>
            <Typography
              variant="h5"
              sx={{ fontFamily: '"Playfair Display", Georgia, serif', fontWeight: 700, mb: 1, color: theme.palette.text.primary }}
            >
              No saved stories yet
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Tap the bookmark icon on any story to save it here.
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

      {/* Remove confirm dialog */}
      <Dialog open={Boolean(confirmId)} onClose={() => setConfirmId(null)}>
        <DialogTitle sx={{ fontFamily: '"Playfair Display", serif', fontWeight: 700 }}>
          Remove bookmark?
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ fontFamily: '"Inter", sans-serif', fontSize: '0.875rem' }}>
            This story will be removed from your saved list. You can re-bookmark it at any time.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setConfirmId(null)} variant="outlined" sx={{ borderRadius: 1 }}>Cancel</Button>
          <Button onClick={handleRemove} variant="contained" color="error" sx={{ borderRadius: 1 }}>Remove</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={toast.open} autoHideDuration={3000} onClose={() => setToast((t) => ({ ...t, open: false }))}>
        <Alert severity={toast.severity} variant="filled" sx={{ borderRadius: 1 }}>{toast.message}</Alert>
      </Snackbar>
    </Box>
  );
}

export default Bookmarks;