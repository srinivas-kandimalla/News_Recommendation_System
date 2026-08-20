import { useEffect, useState } from 'react';
import {
  Avatar, Box, Button, Card, CardContent, Chip, Divider,
  Grid, Stack, Typography,
} from '@mui/material';
import {
  AdminPanelSettingsOutlined, BarChartRounded,
  BookmarkBorderRounded, LogoutRounded,
} from '@mui/icons-material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import AppSnackbar from '../components/common/AppSnackbar';
import SectionHeader from '../components/common/SectionHeader';
import useDocumentTitle from '../hooks/useDocumentTitle';
import useFeedback from '../hooks/useFeedback';
import { useAuth } from '../context/AuthContext';
import { getAnalytics } from '../services/analyticsService';
import { getBookmarks } from '../services/bookmarkService';
import { initials } from '../utils/formatters';

export default function Profile() {
  useDocumentTitle('Profile — Nexora');
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { feedback, notify, dismiss } = useFeedback();
  const [analytics, setAnalytics] = useState(null);
  const [bookmarkCount, setBookmarkCount] = useState(0);

  useEffect(() => {
    getAnalytics()
      .then((d) => setAnalytics(d.analytics || null))
      .catch(() => {});
    getBookmarks()
      .then((d) => setBookmarkCount((d.bookmarks || []).length))
      .catch(() => {});
  }, []);

  const isAdmin = user?.role === 'admin';

  const signOut = () => {
    logout();
    navigate('/');
  };

  return (
    <>
      <SectionHeader
        eyebrow="YOUR ACCOUNT"
        title="Profile"
        sx={{ mb: 4 }}
      />

      <Grid container spacing={3}>
        {/* Left: identity */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent sx={{ p: 3, textAlign: 'center' }}>
              <Avatar
                sx={{
                  width: 80, height: 80,
                  bgcolor: 'primary.main',
                  color: 'primary.contrastText',
                  fontSize: '1.5rem',
                  fontWeight: 800,
                  mx: 'auto',
                  mb: 2,
                }}
              >
                {initials(user?.name)}
              </Avatar>
              <Typography variant="h5" fontWeight={700}>{user?.name || 'Reader'}</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                {user?.email}
              </Typography>
              {isAdmin && (
                <Chip label="Admin" size="small" color="primary" sx={{ mb: 2 }} />
              )}
              <Divider sx={{ my: 2 }} />
              <Stack spacing={1.5}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<BookmarkBorderRounded />}
                  component={RouterLink}
                  to="/bookmarks"
                  size="small"
                >
                  Saved stories ({bookmarkCount})
                </Button>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<BarChartRounded />}
                  component={RouterLink}
                  to="/analytics"
                  size="small"
                >
                  Reading insights
                </Button>
                {isAdmin && (
                  <Button
                    fullWidth
                    variant="contained"
                    startIcon={<AdminPanelSettingsOutlined />}
                    component={RouterLink}
                    to="/admin"
                    size="small"
                  >
                    Admin dashboard
                  </Button>
                )}
                <Button
                  fullWidth
                  variant="text"
                  startIcon={<LogoutRounded />}
                  onClick={signOut}
                  color="error"
                  size="small"
                >
                  Sign out
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Right: quick stats */}
        <Grid item xs={12} md={8}>
          <Stack spacing={2.5}>
            {/* Reading stats */}
            <Card>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight={650} sx={{ mb: 2.5 }}>
                  Your reading activity
                </Typography>
                <Grid container spacing={2}>
                  {[
                    { label: 'Articles read', value: analytics?.total_articles_read ?? '—' },
                    { label: 'Saved', value: bookmarkCount ?? '—' },
                    { label: 'Liked', value: analytics?.total_likes ?? '—' },
                    { label: 'Not interested', value: analytics?.total_dislikes ?? '—' },
                  ].map(({ label, value }) => (
                    <Grid item xs={6} sm={3} key={label}>
                      <Box sx={{ textAlign: 'center', p: 1.5, borderRadius: 2, bgcolor: 'action.hover' }}>
                        <Typography variant="h4" fontWeight={800} sx={{ letterSpacing: '-0.04em' }}>
                          {value}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                          {label}
                        </Typography>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>

            {/* Favourite category */}
            {analytics?.favorite_category && analytics.favorite_category !== 'N/A' && (
              <Card>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="overline" color="primary.main" sx={{ fontWeight: 700, letterSpacing: '0.1em', fontSize: '0.68rem' }}>
                    YOUR SIGNATURE
                  </Typography>
                  <Typography
                    sx={{
                      fontFamily: 'Georgia, "Times New Roman", serif',
                      fontSize: '1.4rem',
                      fontWeight: 700,
                      lineHeight: 1.3,
                      mt: 1,
                      letterSpacing: '-0.015em',
                    }}
                  >
                    You read{' '}
                    <Box component="span" sx={{ color: 'primary.main' }}>
                      {analytics.favorite_category}
                    </Box>{' '}
                    most
                    {analytics.favorite_author && analytics.favorite_author !== 'N/A' &&
                      `, especially ${analytics.favorite_author}`}
                    .
                  </Typography>
                </CardContent>
              </Card>
            )}
          </Stack>
        </Grid>
      </Grid>

      <AppSnackbar feedback={feedback} onClose={dismiss} />
    </>
  );
}
