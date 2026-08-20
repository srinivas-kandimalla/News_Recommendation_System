import React, { useEffect, useState } from 'react';
import { Card, CardContent, Typography, Box, Stack, Avatar, Button, IconButton } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CloseIcon from '@mui/icons-material/Close';
import { useNavigate } from 'react-router-dom';

import { getBookmarks, removeBookmark } from '../../services/newsService';
import { useAuth } from '../../context/AuthContext';

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=400&q=80';

const BookmarksWidget = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { token, isAuthenticated } = useAuth();
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated && token) {
      loadBookmarks();
    }
  }, [token, isAuthenticated]);

  const loadBookmarks = async () => {
    try {
      setLoading(true);
      const res = await getBookmarks(token);
      if (res.success) {
        setBookmarks(res.bookmarks || []);
      }
    } catch (err) {
      console.warn('Bookmarks loading error');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveBookmark = async (e, newsId) => {
    e.stopPropagation();
    try {
      await removeBookmark(newsId, token);
      setBookmarks((prev) => prev.filter((b) => (b._id || b.news_id) !== newsId));
    } catch (err) {
      console.error(err);
    }
  };

  if (!isAuthenticated) {
    return (
      <Card
        sx={{
          borderRadius: `${theme.shape.borderRadius * 2}px`,
          backgroundColor: theme.palette.background.paper,
          border: `1px solid ${theme.palette.divider}`,
          boxShadow: theme.shadows[1],
          p: 0.5,
        }}
      >
        <CardContent sx={{ p: 2, textAlign: 'center', '&:last-child': { pb: 2 } }}>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
            <BookmarkIcon color="primary" fontSize="small" />
            <Typography variant="h6" fontSize="1rem" fontWeight={700} color="text.primary">
              Saved Bookmarks
            </Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Sign in to view your saved articles and reading history.
          </Typography>
          <Button
            variant="outlined"
            size="small"
            onClick={() => navigate('/login')}
            sx={{ textTransform: 'none', borderRadius: `${theme.shape.borderRadius * 2}px`, fontWeight: 600 }}
          >
            Sign In
          </Button>
        </CardContent>
      </Card>
    );
  }

  const displayBookmarks = bookmarks.slice(0, 3);

  return (
    <Card
      sx={{
        borderRadius: `${theme.shape.borderRadius * 2}px`,
        backgroundColor: theme.palette.background.paper,
        border: `1px solid ${theme.palette.divider}`,
        boxShadow: theme.shadows[1],
        p: 0.5,
      }}
    >
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.5 }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 32,
                height: 32,
                borderRadius: '50%',
                backgroundColor: alpha(theme.palette.primary.main, 0.1),
                color: theme.palette.primary.main,
              }}
            >
              <BookmarkIcon fontSize="small" />
            </Box>
            <Typography variant="h6" fontSize="1rem" fontWeight={700} color="text.primary">
              Bookmarks ({bookmarks.length})
            </Typography>
          </Stack>

          <Button
            size="small"
            endIcon={<ArrowForwardIcon fontSize="small" />}
            onClick={() => navigate('/bookmarks')}
            sx={{ textTransform: 'none', fontWeight: 600, fontSize: '0.8rem' }}
          >
            View all
          </Button>
        </Stack>

        <Stack spacing={1}>
          {displayBookmarks.length > 0 ? (
            displayBookmarks.map((item) => {
              const newsObj = item.news || item;
              const newsId = newsObj._id || item._id;

              return (
                <Box
                  key={newsId}
                  onClick={() => navigate(`/news/${newsId}`)}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    p: 1,
                    borderRadius: `${theme.shape.borderRadius * 1.5}px`,
                    cursor: 'pointer',
                    position: 'relative',
                    '&:hover': {
                      backgroundColor: alpha(theme.palette.primary.main, 0.04),
                    },
                  }}
                >
                  <Avatar
                    variant="rounded"
                    src={newsObj.image_url || DEFAULT_IMAGE}
                    alt={newsObj.title}
                    sx={{ width: 44, height: 44, borderRadius: `${theme.shape.borderRadius}px` }}
                  />

                  <Box sx={{ flexGrow: 1, minWidth: 0, pr: 2 }}>
                    <Typography
                      variant="body2"
                      fontWeight={600}
                      color="text.primary"
                      sx={{
                        display: '-webkit-box',
                        WebkitLineClamp: 1,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        fontSize: '0.85rem',
                      }}
                    >
                      {newsObj.title}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {newsObj.category || 'General'}
                    </Typography>
                  </Box>

                  <IconButton
                    size="small"
                    onClick={(e) => handleRemoveBookmark(e, newsId)}
                    sx={{ position: 'absolute', right: 4, top: 4, opacity: 0.7, '&:hover': { opacity: 1 } }}
                  >
                    <CloseIcon sx={{ fontSize: 14 }} />
                  </IconButton>
                </Box>
              );
            })
          ) : (
            <Typography variant="caption" color="text.secondary" textAlign="center" sx={{ py: 1.5 }}>
              No saved bookmarks yet.
            </Typography>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
};

export default BookmarksWidget;
