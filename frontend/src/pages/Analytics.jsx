import React, { useEffect, useState } from 'react';
import {
  Container,
  Box,
  Typography,
  Grid,
  Divider,
  CircularProgress,
  Alert,
  Stack,
  Chip,
  Paper,
  LinearProgress,
  Button,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import FavoriteIcon from '@mui/icons-material/Favorite';
import CategoryIcon from '@mui/icons-material/Category';
import PublicIcon from '@mui/icons-material/Public';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import PsychologyIcon from '@mui/icons-material/Psychology';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';

import { getAnalytics } from '../services/newsService';
import { useAuth } from '../context/AuthContext';

// Pure React 19 SVG Donut Chart — 100% compatible & crash-free
const PureDonutChart = ({ likes = 0, dislikes = 0 }) => {
  const total = likes + dislikes;
  const likeRatio = total > 0 ? likes / total : 0.5;
  const circumference = 2 * Math.PI * 40; // ~251.32
  const strokeDasharray = `${likeRatio * circumference} ${circumference}`;

  return (
    <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', my: 2 }}>
      <svg width="180" height="180" viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
        {/* Background track (Dislikes / Secondary) */}
        <circle cx="50" cy="50" r="40" fill="none" stroke="#EC4899" strokeWidth="12" />
        {/* Foreground track (Likes / Primary) */}
        <circle
          cx="50"
          cy="50"
          r="40"
          fill="none"
          stroke="#2563EB"
          strokeWidth="12"
          strokeDasharray={strokeDasharray}
          strokeDashoffset="0"
          strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 0.6s ease' }}
        />
      </svg>
      <Box sx={{ position: 'absolute', textAlign: 'center' }}>
        <Typography variant="h4" fontWeight={800} sx={{ fontFamily: '"Plus Jakarta Sans", sans-serif', lineHeight: 1 }}>
          {total}
        </Typography>
        <Typography variant="caption" fontWeight={600} color="text.secondary">
          Reactions
        </Typography>
      </Box>
    </Box>
  );
};

function Analytics() {
  const theme = useTheme();
  const { token, user, isAuthenticated } = useAuth();
  const isDark = theme.palette.mode === 'dark';

  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (token) loadAnalytics();
    else setLoading(false);
  }, [token]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getAnalytics(token);
      if (res.success) setAnalytics(res.analytics);
      else setError(res.message || 'Failed to load analytics.');
    } catch (err) {
      setError('Unable to load analytics data.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', backgroundColor: theme.palette.background.default, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Stack spacing={2} alignItems="center">
          <CircularProgress size={36} color="primary" />
          <Typography variant="body2" color="text.secondary">Loading AI Readership Intelligence…</Typography>
        </Stack>
      </Box>
    );
  }

  if (!isAuthenticated || !token) {
    return (
      <Box sx={{ minHeight: '100vh', backgroundColor: theme.palette.background.default, py: 8 }}>
        <Container maxWidth="sm">
          <Paper
            elevation={0}
            sx={{
              p: 5,
              textAlign: 'center',
              borderRadius: '24px',
              border: `1px solid ${theme.palette.divider}`,
              backgroundColor: theme.palette.background.paper,
              boxShadow: isDark ? '0 10px 30px rgba(0,0,0,0.4)' : '0 10px 30px rgba(37,99,235,0.06)',
            }}
          >
            <PsychologyIcon sx={{ fontSize: 56, color: theme.palette.primary.main, mb: 2 }} />
            <Typography variant="h5" fontWeight={800} sx={{ mb: 1.5, fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
              Sign In for AI Readership Analytics
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Your reading statistics, category preferences, and AI context profile are saved to your account.
            </Typography>
            <Button
              variant="contained"
              component="a"
              href="/login"
              sx={{ py: 1.2, px: 4, fontWeight: 700, borderRadius: '12px', fontSize: '0.9375rem', textTransform: 'none' }}
            >
              Sign In Now
            </Button>
          </Paper>
        </Container>
      </Box>
    );
  }

  const kpis = analytics ? [
    {
      label: 'Articles Consumed',
      value: analytics.total_articles_read ?? 0,
      subtext: 'Total stories read',
      icon: <MenuBookIcon sx={{ color: '#2563EB', fontSize: 26 }} />,
      gradient: 'linear-gradient(135deg, rgba(37, 99, 235, 0.12) 0%, rgba(37, 99, 235, 0.03) 100%)',
      borderColor: 'rgba(37, 99, 235, 0.25)',
      progress: Math.min(100, ((analytics.total_articles_read || 0) / 20) * 100),
      progressColor: '#2563EB',
    },
    {
      label: 'Saved Bookmarks',
      value: analytics.total_bookmarks ?? 0,
      subtext: 'Articles saved for later',
      icon: <BookmarkIcon sx={{ color: '#10B981', fontSize: 26 }} />,
      gradient: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(16, 185, 129, 0.03) 100%)',
      borderColor: 'rgba(16, 185, 129, 0.25)',
      progress: Math.min(100, ((analytics.total_bookmarks || 0) / 10) * 100),
      progressColor: '#10B981',
    },
    {
      label: 'Story Reactions',
      value: (analytics.total_likes || 0) + (analytics.total_dislikes || 0),
      subtext: `${analytics.total_likes || 0} Likes · ${analytics.total_dislikes || 0} Dislikes`,
      icon: <FavoriteIcon sx={{ color: '#EC4899', fontSize: 26 }} />,
      gradient: 'linear-gradient(135deg, rgba(236, 72, 153, 0.12) 0%, rgba(236, 72, 153, 0.03) 100%)',
      borderColor: 'rgba(236, 72, 153, 0.25)',
      progress: Math.min(100, (((analytics.total_likes || 0) + (analytics.total_dislikes || 0)) / 10) * 100),
      progressColor: '#EC4899',
    },
    {
      label: 'Top Category Affinity',
      value: analytics.favorite_category || 'General',
      subtext: 'Primary interest focus',
      icon: <CategoryIcon sx={{ color: '#7C3AED', fontSize: 26 }} />,
      gradient: 'linear-gradient(135deg, rgba(124, 58, 237, 0.12) 0%, rgba(124, 58, 237, 0.03) 100%)',
      borderColor: 'rgba(124, 58, 237, 0.25)',
      isChip: true,
    },
  ] : [];

  return (
    <Box sx={{ backgroundColor: theme.palette.background.default, minHeight: '100vh', pb: 8 }}>
      <Container maxWidth="lg" sx={{ pt: { xs: 3, md: 5 }, px: { xs: 2, md: 3 } }}>

        {/* Header Hero Section */}
        <Box sx={{ mb: 3.5 }}>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
            <Typography variant="overline" color="primary" fontWeight={800} letterSpacing="0.1em">
              ANALYTICS
            </Typography>
            <Chip
              icon={<AutoAwesomeIcon sx={{ fontSize: '13px !important' }} />}
              label="AI Engine Active"
              size="small"
              sx={{
                height: 20,
                fontSize: '0.65rem',
                fontWeight: 700,
                backgroundColor: isDark ? 'rgba(59, 130, 246, 0.15)' : 'rgba(37, 99, 235, 0.08)',
                color: theme.palette.primary.main,
                border: `1px solid ${isDark ? 'rgba(59, 130, 246, 0.3)' : 'rgba(37, 99, 235, 0.2)'}`,
              }}
            />
          </Stack>

          <Typography
            variant="h3"
            component="h1"
            sx={{
              fontFamily: '"Plus Jakarta Sans", "Inter", sans-serif',
              fontWeight: 800,
              fontSize: { xs: '1.8rem', md: '2.2rem' },
              color: theme.palette.text.primary,
              letterSpacing: '-0.02em',
              mb: 0.5,
            }}
          >
            Reading Insights
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Overview of your reading activity and topic preferences on Nexora.
          </Typography>
        </Box>

        <Divider sx={{ mb: 4 }} />

        {error && <Alert severity="error" sx={{ mb: 4, borderRadius: '12px' }}>{error}</Alert>}

        {!analytics ? (
          <Paper
            sx={{
              p: 5,
              textAlign: 'center',
              borderRadius: '20px',
              border: `1px solid ${theme.palette.divider}`,
              backgroundColor: theme.palette.background.paper,
            }}
          >
            <PsychologyIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>
              No Readership Analytics Yet
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Start exploring and reading stories to build your personalized AI reading profile!
            </Typography>
          </Paper>
        ) : (
          <Grid container spacing={3}>
            {/* KPI Tiles */}
            {kpis.map((kpi, idx) => (
              <Grid item xs={12} sm={6} md={3} key={idx}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 3,
                    height: '100%',
                    borderRadius: '20px',
                    border: `1px solid ${kpi.borderColor}`,
                    background: kpi.gradient,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    transition: 'transform 0.25s ease, box-shadow 0.25s ease',
                    '&:hover': {
                      transform: 'translateY(-3px)',
                      boxShadow: '0 8px 25px rgba(0, 0, 0, 0.08)',
                    },
                  }}
                >
                  <Box>
                    <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
                      <Box
                        sx={{
                          width: 44,
                          height: 44,
                          borderRadius: '12px',
                          backgroundColor: isDark ? 'rgba(15, 23, 42, 0.6)' : '#FFFFFF',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                        }}
                      >
                        {kpi.icon}
                      </Box>
                      <TrendingUpIcon sx={{ fontSize: 18, color: 'text.secondary', opacity: 0.5 }} />
                    </Stack>

                    <Typography variant="caption" fontWeight={700} color="text.secondary" letterSpacing="0.05em" sx={{ textTransform: 'uppercase' }}>
                      {kpi.label}
                    </Typography>

                    {kpi.isChip ? (
                      <Box sx={{ mt: 1, mb: 1 }}>
                        <Chip
                          label={kpi.value}
                          color="primary"
                          sx={{
                            fontFamily: '"Inter", sans-serif',
                            fontWeight: 800,
                            fontSize: '1rem',
                            py: 2,
                            px: 1.5,
                            borderRadius: '12px',
                            background: 'linear-gradient(135deg, #7C3AED 0%, #2563EB 100%)',
                          }}
                        />
                      </Box>
                    ) : (
                      <Typography
                        sx={{
                          fontFamily: '"Plus Jakarta Sans", sans-serif',
                          fontWeight: 800,
                          fontSize: '2.4rem',
                          lineHeight: 1.1,
                          color: theme.palette.text.primary,
                          mt: 0.5,
                          mb: 0.5,
                        }}
                      >
                        {kpi.value}
                      </Typography>
                    )}
                  </Box>

                  <Box sx={{ mt: 2 }}>
                    <Typography variant="caption" color="text.secondary">
                      {kpi.subtext}
                    </Typography>
                    {kpi.progress !== undefined && (
                      <LinearProgress
                        variant="determinate"
                        value={kpi.progress}
                        sx={{
                          mt: 1,
                          height: 5,
                          borderRadius: 3,
                          backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                          '& .MuiLinearProgress-bar': {
                            backgroundColor: kpi.progressColor,
                            borderRadius: 3,
                          },
                        }}
                      />
                    )}
                  </Box>
                </Paper>
              </Grid>
            ))}

            {/* AI Personal Profile Model Card */}
            <Grid item xs={12} md={7}>
              <Paper
                elevation={0}
                sx={{
                  p: 3.5,
                  borderRadius: '20px',
                  border: `1px solid ${theme.palette.divider}`,
                  backgroundColor: theme.palette.background.paper,
                  height: '100%',
                }}
              >
                <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 2.5 }}>
                  <PsychologyIcon color="primary" />
                  <Typography variant="h6" fontWeight={800} sx={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
                    AI Context & Model Architecture Profile
                  </Typography>
                </Stack>

                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid item xs={6} sm={4}>
                    <Box sx={{ p: 2, borderRadius: '14px', backgroundColor: isDark ? 'rgba(30, 41, 59, 0.5)' : 'rgba(241, 245, 249, 0.8)', border: `1px solid ${theme.palette.divider}` }}>
                      <Typography variant="caption" color="text.secondary" fontWeight={600}>Short-Term Weight</Typography>
                      <Typography variant="h5" fontWeight={800} color="primary" sx={{ mt: 0.5 }}>
                        W<sub>short</sub> = 0.60
                      </Typography>
                      <Typography variant="caption" color="text.secondary">Last 5 reading events</Typography>
                    </Box>
                  </Grid>

                  <Grid item xs={6} sm={4}>
                    <Box sx={{ p: 2, borderRadius: '14px', backgroundColor: isDark ? 'rgba(30, 41, 59, 0.5)' : 'rgba(241, 245, 249, 0.8)', border: `1px solid ${theme.palette.divider}` }}>
                      <Typography variant="caption" color="text.secondary" fontWeight={600}>Long-Term Weight</Typography>
                      <Typography variant="h5" fontWeight={800} color="secondary" sx={{ mt: 0.5 }}>
                        W<sub>long</sub> = 0.40
                      </Typography>
                      <Typography variant="caption" color="text.secondary">Historical 50 events</Typography>
                    </Box>
                  </Grid>

                  <Grid item xs={12} sm={4}>
                    <Box sx={{ p: 2, borderRadius: '14px', backgroundColor: isDark ? 'rgba(30, 41, 59, 0.5)' : 'rgba(241, 245, 249, 0.8)', border: `1px solid ${theme.palette.divider}` }}>
                      <Typography variant="caption" color="text.secondary" fontWeight={600}>Attention Softmax Temp</Typography>
                      <Typography variant="h5" fontWeight={800} sx={{ color: '#10B981', mt: 0.5 }}>
                        &tau; = 0.10
                      </Typography>
                      <Typography variant="caption" color="text.secondary">Sharp interest focus</Typography>
                    </Box>
                  </Grid>
                </Grid>

                {/* Top Author / Source Highlight */}
                {analytics.favorite_author && (
                  <Box sx={{ p: 2.5, borderRadius: '16px', background: isDark ? 'linear-gradient(135deg, rgba(30,41,59,0.7) 0%, rgba(15,23,42,0.8) 100%)' : 'linear-gradient(135deg, rgba(239,246,255,0.9) 0%, rgba(243,244,246,0.8) 100%)', border: `1px solid ${theme.palette.divider}` }}>
                    <Stack direction="row" alignItems="center" spacing={2}>
                      <Box sx={{ width: 44, height: 44, borderRadius: '50%', backgroundColor: theme.palette.primary.main, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF' }}>
                        <PublicIcon />
                      </Box>
                      <Box>
                        <Typography variant="caption" fontWeight={700} color="text.secondary" letterSpacing="0.05em">
                          FAVOURITE NEWS PUBLISHER
                        </Typography>
                        <Typography variant="h6" fontWeight={800} sx={{ lineHeight: 1.2 }}>
                          {analytics.favorite_author}
                        </Typography>
                      </Box>
                    </Stack>
                  </Box>
                )}
              </Paper>
            </Grid>

            {/* Reactions Pure Donut Chart Card */}
            <Grid item xs={12} md={5}>
              <Paper
                elevation={0}
                sx={{
                  p: 3.5,
                  borderRadius: '20px',
                  border: `1px solid ${theme.palette.divider}`,
                  backgroundColor: theme.palette.background.paper,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                }}
              >
                <Typography variant="h6" fontWeight={800} sx={{ fontFamily: '"Plus Jakarta Sans", sans-serif', mb: 1, alignSelf: 'flex-start' }}>
                  Reaction & Sentiment Breakdown
                </Typography>

                <PureDonutChart likes={analytics.total_likes || 0} dislikes={analytics.total_dislikes || 0} />

                <Stack direction="row" spacing={3} justifyContent="center" sx={{ mt: 'auto', pt: 2, width: '100%' }}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <ThumbUpIcon sx={{ color: '#2563EB', fontSize: 18 }} />
                    <Box>
                      <Typography variant="body2" fontWeight={800} color="primary.main">
                        {analytics.total_likes || 0} Likes
                      </Typography>
                    </Box>
                  </Stack>

                  <Divider orientation="vertical" flexItem />

                  <Stack direction="row" alignItems="center" spacing={1}>
                    <ThumbDownIcon sx={{ color: '#EC4899', fontSize: 18 }} />
                    <Box>
                      <Typography variant="body2" fontWeight={800} sx={{ color: '#EC4899' }}>
                        {analytics.total_dislikes || 0} Dislikes
                      </Typography>
                    </Box>
                  </Stack>
                </Stack>
              </Paper>
            </Grid>
          </Grid>
        )}
      </Container>
    </Box>
  );
}

export default Analytics;