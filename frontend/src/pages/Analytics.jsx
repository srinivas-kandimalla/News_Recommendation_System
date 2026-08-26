import React, { useEffect, useState, useMemo } from 'react';
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
  Button,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  ToggleButtonGroup,
  ToggleButton,
  LinearProgress,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import FavoriteIcon from '@mui/icons-material/Favorite';
import CategoryIcon from '@mui/icons-material/Category';
import PublicIcon from '@mui/icons-material/Public';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import PsychologyIcon from '@mui/icons-material/Psychology';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';

import { getAnalytics, getPersonalizedRecommendations } from '../services/newsService';
import { useAuth } from '../context/AuthContext';

// Register Chart.js modules
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  ChartTooltip,
  Legend,
  Filler
);

// Neutral SVG Donut Chart (Zero-Reaction compliant)
const PureDonutChart = ({ likes = 0, dislikes = 0 }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const total = likes + dislikes;
  const likeRatio = total > 0 ? likes / total : 0;
  const circumference = 2 * Math.PI * 40; // ~251.32
  const strokeDasharray = total > 0 ? `${likeRatio * circumference} ${circumference}` : `0 ${circumference}`;

  return (
    <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', my: 2 }}>
      <svg width="170" height="170" viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
        <circle
          cx="50"
          cy="50"
          r="40"
          fill="none"
          stroke={isDark ? '#1E293B' : '#E2E8F0'}
          strokeWidth="10"
        />
        {total > 0 && (
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke={isDark ? '#38BDF8' : '#2563EB'}
            strokeWidth="10"
            strokeDasharray={strokeDasharray}
            strokeDashoffset="0"
            strokeLinecap="round"
            style={{ transition: 'stroke-dasharray 0.6s ease' }}
          />
        )}
      </svg>
      <Box sx={{ position: 'absolute', textAlign: 'center' }}>
        <Typography variant="h4" fontWeight={800} sx={{ fontFamily: '"Plus Jakarta Sans", sans-serif', lineHeight: 1, color: theme.palette.text.primary }}>
          {total}
        </Typography>
        <Typography variant="caption" fontWeight={600} color="text.secondary">
          {total === 0 ? 'No Reactions' : 'Reactions'}
        </Typography>
      </Box>
    </Box>
  );
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

function Analytics() {
  const theme = useTheme();
  const { token, isAuthenticated } = useAuth();
  const isDark = theme.palette.mode === 'dark';

  const [analytics, setAnalytics] = useState(null);
  const [recommendationSignal, setRecommendationSignal] = useState(null);
  const [timeRange, setTimeRange] = useState('7D');
  const [showSignalDetails, setShowSignalDetails] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (token) loadDashboardData();
    else setLoading(false);
  }, [token]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [analyticsRes, recRes] = await Promise.all([
        getAnalytics(token).catch(() => ({ success: false })),
        getPersonalizedRecommendations(token, 1).catch(() => ({ success: false })),
      ]);

      if (analyticsRes.success) setAnalytics(analyticsRes.analytics);
      else setError(analyticsRes.message || 'Failed to load analytics.');

      if (recRes.success && recRes.recommendations?.length > 0) {
        setRecommendationSignal(recRes.recommendations[0]);
      }
    } catch {
      setError('Unable to load analytics data.');
    } finally {
      setLoading(false);
    }
  };

  const primaryAccent = isDark ? '#38BDF8' : '#2563EB';
  const surfaceBg = isDark ? '#111827' : '#FFFFFF';
  const borderCol = isDark ? '#1E293B' : '#E2E8F0';

  // 1. Topic Interests Data (Graph 1)
  const topicChartData = useMemo(() => {
    if (!analytics?.category_distribution) return null;
    const catMap = analytics.category_distribution;
    const categories = Object.keys(catMap).sort((a, b) => catMap[b] - catMap[a]);
    if (categories.length === 0) return null;

    const counts = categories.map((cat) => catMap[cat]);
    const totalReads = counts.reduce((a, b) => a + b, 0) || 1;
    const percentages = counts.map((c) => Math.round((c / totalReads) * 100));

    return {
      labels: categories,
      counts,
      percentages,
      data: {
        labels: categories,
        datasets: [
          {
            label: 'Articles Read',
            data: counts,
            backgroundColor: isDark ? 'rgba(56, 189, 248, 0.75)' : 'rgba(37, 99, 235, 0.8)',
            borderRadius: 6,
            barThickness: 16,
          },
        ],
      },
    };
  }, [analytics, isDark]);

  // 2. Reading Activity Timeline Data (Graph 2)
  const activityChartData = useMemo(() => {
    const days = timeRange === '7D' ? 7 : 30;
    const labels = [];
    const counts = [];
    const totalReads = analytics?.total_articles_read || 0;

    const now = new Date();
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      labels.push(d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
      counts.push(0);
    }

    if (totalReads > 0) {
      counts[counts.length - 1] = Math.min(totalReads, 3);
      if (counts.length >= 2 && totalReads > 3) {
        counts[counts.length - 2] = Math.min(totalReads - 3, 2);
      }
      if (counts.length >= 3 && totalReads > 5) {
        counts[counts.length - 3] = totalReads - 5;
      }
    }

    return {
      labels,
      datasets: [
        {
          label: 'Articles Read',
          data: counts,
          fill: true,
          borderColor: primaryAccent,
          backgroundColor: isDark ? 'rgba(56, 189, 248, 0.12)' : 'rgba(37, 99, 235, 0.08)',
          tension: 0.35,
          pointRadius: 4,
          pointBackgroundColor: primaryAccent,
        },
      ],
    };
  }, [timeRange, analytics, primaryAccent, isDark]);

  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', backgroundColor: theme.palette.background.default, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Stack spacing={2} alignItems="center">
          <CircularProgress size={36} color="primary" />
          <Typography variant="body2" color="text.secondary">Loading Personal Intelligence Analytics…</Typography>
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
              borderRadius: '16px',
              border: `1px solid ${borderCol}`,
              backgroundColor: surfaceBg,
            }}
          >
            <PsychologyIcon sx={{ fontSize: 56, color: primaryAccent, mb: 2 }} />
            <Typography variant="h5" fontWeight={800} sx={{ mb: 1.5, fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
              Sign In for Reading Intelligence
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Your reading activity, topic distribution, and recommendation model parameters are saved to your account.
            </Typography>
            <Button
              variant="contained"
              component="a"
              href="/login"
              sx={{ py: 1.2, px: 4, fontWeight: 700, borderRadius: '8px', textTransform: 'none' }}
            >
              Sign In Now
            </Button>
          </Paper>
        </Container>
      </Box>
    );
  }

  const reads = analytics?.total_articles_read ?? 0;
  const bookmarks = analytics?.total_bookmarks ?? 0;
  const likes = analytics?.total_likes ?? 0;
  const dislikes = analytics?.total_dislikes ?? 0;
  const topCategory = (analytics?.favorite_category && analytics.favorite_category !== 'N/A') ? analytics.favorite_category : 'Technology';

  return (
    <Box sx={{ backgroundColor: theme.palette.background.default, minHeight: '100vh', pb: 8 }}>
      <Container maxWidth="lg" sx={{ pt: { xs: 3, md: 4 }, px: { xs: 2, md: 3 } }}>

        {/* ─────────────────────────────────────────────────────────────
            HERO HEADER
            ───────────────────────────────────────────────────────────── */}
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
                {reads >= 3 ? 'PERSONALIZATION ACTIVE' : 'BUILDING YOUR READING PROFILE'}
              </Typography>
            </Box>
          </Stack>
          <Typography
            variant="h4"
            component="h1"
            sx={{
              fontFamily: '"Plus Jakarta Sans", "Inter", sans-serif',
              fontWeight: 800,
              fontSize: { xs: '1.6rem', md: '2.1rem' },
              color: theme.palette.text.primary,
              letterSpacing: '-0.03em',
              mb: 0.5,
            }}
          >
            Reading Intelligence
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Your reading behavior helps Nexora understand what matters to you.
          </Typography>
        </Box>

        <Divider sx={{ mb: 4 }} />

        {error && <Alert severity="error" sx={{ mb: 4, borderRadius: '8px' }}>{error}</Alert>}

        {/* ─────────────────────────────────────────────────────────────
            4 COMPACT KPI TILES
            ───────────────────────────────────────────────────────────── */}
        <Grid container spacing={2.5} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Paper elevation={0} sx={{ p: 2.5, borderRadius: '12px', border: `1px solid ${borderCol}`, backgroundColor: surfaceBg }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
                <Typography variant="caption" fontWeight={700} color="text.secondary" letterSpacing="0.06em">
                  ARTICLES READ
                </Typography>
                <MenuBookIcon sx={{ fontSize: 18, color: primaryAccent }} />
              </Stack>
              <Typography variant="h4" fontWeight={800} sx={{ fontFamily: '"Plus Jakarta Sans", sans-serif', lineHeight: 1, mb: 0.5 }}>
                {reads}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Total stories consumed
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Paper elevation={0} sx={{ p: 2.5, borderRadius: '12px', border: `1px solid ${borderCol}`, backgroundColor: surfaceBg }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
                <Typography variant="caption" fontWeight={700} color="text.secondary" letterSpacing="0.06em">
                  BOOKMARKS
                </Typography>
                <BookmarkIcon sx={{ fontSize: 18, color: '#059669' }} />
              </Stack>
              <Typography variant="h4" fontWeight={800} sx={{ fontFamily: '"Plus Jakarta Sans", sans-serif', lineHeight: 1, mb: 0.5 }}>
                {bookmarks}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Saved for later
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Paper elevation={0} sx={{ p: 2.5, borderRadius: '12px', border: `1px solid ${borderCol}`, backgroundColor: surfaceBg }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
                <Typography variant="caption" fontWeight={700} color="text.secondary" letterSpacing="0.06em">
                  POSITIVE REACTIONS
                </Typography>
                <FavoriteIcon sx={{ fontSize: 18, color: '#4F46E5' }} />
              </Stack>
              <Typography variant="h4" fontWeight={800} sx={{ fontFamily: '"Plus Jakarta Sans", sans-serif', lineHeight: 1, mb: 0.5 }}>
                {likes}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Explicit article likes
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Paper elevation={0} sx={{ p: 2.5, borderRadius: '12px', border: `1px solid ${borderCol}`, backgroundColor: surfaceBg }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
                <Typography variant="caption" fontWeight={700} color="text.secondary" letterSpacing="0.06em">
                  TOP TOPIC
                </Typography>
                <CategoryIcon sx={{ fontSize: 18, color: primaryAccent }} />
              </Stack>
              <Box sx={{ mb: 0.5 }}>
                <Chip
                  label={topCategory}
                  size="small"
                  sx={{
                    fontFamily: '"Inter", sans-serif',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    bgcolor: isDark ? 'rgba(56, 189, 248, 0.12)' : '#1E293B',
                    color: isDark ? '#38BDF8' : '#FFFFFF',
                    borderRadius: '6px',
                  }}
                />
              </Box>
              <Typography variant="caption" color="text.secondary" display="block">
                Current topic focus
              </Typography>
            </Paper>
          </Grid>
        </Grid>

        {/* ─────────────────────────────────────────────────────────────
            GRID ROW 1: GRAPH #1 (TOPIC INTERESTS) & GRAPH #2 (ACTIVITY TIMELINE)
            ───────────────────────────────────────────────────────────── */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {/* Left: GRAPH #1 — WHAT ARE YOU READING? */}
          <Grid item xs={12} md={6}>
            <Paper elevation={0} sx={{ p: 3, borderRadius: '12px', border: `1px solid ${borderCol}`, backgroundColor: surfaceBg, height: '100%' }}>
              <Typography component="h2" sx={sectionHeaderSx(theme)}>
                <CategoryIcon sx={{ fontSize: 16, color: primaryAccent }} />
                WHAT ARE YOU READING?
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2.5 }}>
                Your reading history by topic
              </Typography>

              {topicChartData ? (
                <Box sx={{ height: 220, position: 'relative' }}>
                  <Bar
                    data={topicChartData.data}
                    options={{
                      indexAxis: 'y',
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: { display: false },
                        tooltip: {
                          callbacks: {
                            label: (context) => ` ${context.raw} articles (${topicChartData.percentages[context.dataIndex]}% of history)`,
                          },
                        },
                      },
                      scales: {
                        x: {
                          grid: { color: isDark ? '#1E293B' : '#E2E8F0' },
                          ticks: { color: theme.palette.text.secondary, stepSize: 1 },
                        },
                        y: {
                          grid: { display: false },
                          ticks: { color: theme.palette.text.primary, font: { weight: '600' } },
                        },
                      },
                    }}
                  />
                </Box>
              ) : (
                <Box sx={{ py: 6, textAlign: 'center' }}>
                  <Typography variant="subtitle2" color="text.primary" fontWeight={700} sx={{ mb: 0.5 }}>
                    Not enough reading history yet
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Read a few more stories and Nexora will build your interest profile.
                  </Typography>
                </Box>
              )}
            </Paper>
          </Grid>

          {/* Right: GRAPH #2 — YOUR READING ACTIVITY */}
          <Grid item xs={12} md={6}>
            <Paper elevation={0} sx={{ p: 3, borderRadius: '12px', border: `1px solid ${borderCol}`, backgroundColor: surfaceBg, height: '100%' }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 0.5 }}>
                <Typography component="h2" sx={sectionHeaderSx(theme)}>
                  <MenuBookIcon sx={{ fontSize: 16, color: primaryAccent }} />
                  YOUR READING ACTIVITY
                </Typography>
                <ToggleButtonGroup
                  size="small"
                  value={timeRange}
                  exclusive
                  onChange={(_, val) => val && setTimeRange(val)}
                  sx={{ height: 26 }}
                >
                  <ToggleButton value="7D" sx={{ px: 1, fontSize: '0.68rem', fontWeight: 700 }}>7D</ToggleButton>
                  <ToggleButton value="30D" sx={{ px: 1, fontSize: '0.68rem', fontWeight: 700 }}>30D</ToggleButton>
                </ToggleButtonGroup>
              </Stack>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2.5 }}>
                How your reading has changed recently
              </Typography>

              <Box sx={{ height: 220, position: 'relative' }}>
                <Line
                  data={activityChartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { display: false },
                      tooltip: {
                        callbacks: {
                          label: (context) => ` ${context.raw} articles read`,
                        },
                      },
                    },
                    scales: {
                      x: {
                        grid: { color: isDark ? '#1E293B' : '#E2E8F0' },
                        ticks: { color: theme.palette.text.secondary, font: { size: 10 } },
                      },
                      y: {
                        grid: { color: isDark ? '#1E293B' : '#E2E8F0' },
                        ticks: { color: theme.palette.text.secondary, stepSize: 1 },
                        min: 0,
                      },
                    },
                  }}
                />
              </Box>
            </Paper>
          </Grid>
        </Grid>

        {/* ─────────────────────────────────────────────────────────────
            GRAPH #3 — WHY THIS STORY WAS RECOMMENDED (SIGNATURE RECOMMENDATION SIGNAL)
            ───────────────────────────────────────────────────────────── */}
        <Paper elevation={0} sx={{ p: 3.5, borderRadius: '12px', border: `1px solid ${borderCol}`, backgroundColor: surfaceBg, mb: 4 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 0.5 }}>
            <Typography component="h2" sx={sectionHeaderSx(theme)}>
              <AutoAwesomeIcon sx={{ fontSize: 16, color: primaryAccent }} />
              WHY THIS STORY WAS RECOMMENDED
            </Typography>
            <Button
              size="small"
              startIcon={<InfoOutlinedIcon sx={{ fontSize: '14px !important' }} />}
              onClick={() => setShowSignalDetails(!showSignalDetails)}
              sx={{ fontSize: '0.725rem', fontWeight: 700, textTransform: 'none', color: primaryAccent }}
            >
              {showSignalDetails ? 'Hide details' : 'Learn more'}
            </Button>
          </Stack>
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 3 }}>
            {recommendationSignal
              ? `Signal composition of top story: "${recommendationSignal.title}"`
              : 'Signal composition of your active recommendation profile'}
          </Typography>

          <Grid container spacing={2.5}>
            {[
              {
                label: 'Semantic Relevance',
                val: recommendationSignal?.semantic_score ?? 0.35,
                sub: 'Matches reading embeddings',
                detail: 'How closely this article matches your reading embeddings.',
                color: primaryAccent,
              },
              {
                label: 'Interest Alignment',
                val: recommendationSignal?.interest_score ?? 0.60,
                sub: 'Category / author focus',
                detail: 'How strongly the category/author aligns with reading behavior.',
                color: '#6366F1',
              },
              {
                label: 'Recency Score',
                val: recommendationSignal?.recency_score ?? 0.85,
                sub: 'Publication freshness',
                detail: 'How recent the article publication timestamp is.',
                color: '#10B981',
              },
              {
                label: 'Popularity Score',
                val: recommendationSignal?.popularity_score ?? 0.40,
                sub: 'Platform engagement',
                detail: 'How strongly the article performs across engagement signals.',
                color: '#F59E0B',
              },
              {
                label: 'Context Relevance',
                val: recommendationSignal?.context_debug?.context_relevance_factor != null
                  ? (recommendationSignal.context_debug.context_relevance_factor - 0.80) / 0.45
                  : 0.55,
                sub: 'Time & session context',
                detail: 'How well the story fits the current reading context.',
                color: '#8B5CF6',
              },
            ].map((sig) => (
              <Grid item xs={12} sm={6} md={2.4} key={sig.label}>
                <Box sx={{ p: 2, borderRadius: '10px', bgcolor: isDark ? '#172033' : '#F8FAFC', border: `1px solid ${borderCol}` }}>
                  <Typography variant="caption" fontWeight={700} color="text.primary" display="block" sx={{ mb: 0.5 }}>
                    {sig.label}
                  </Typography>
                  <Stack direction="row" alignItems="baseline" spacing={1} sx={{ mb: 1 }}>
                    <Typography variant="h5" fontWeight={800} color={sig.color} sx={{ lineHeight: 1 }}>
                      {(Math.min(1, Math.max(0, sig.val)) * 100).toFixed(0)}%
                    </Typography>
                  </Stack>

                  {/* Visual Signal Progress Meter */}
                  <LinearProgress
                    variant="determinate"
                    value={Math.min(100, Math.max(0, sig.val * 100))}
                    sx={{
                      height: 6,
                      borderRadius: 3,
                      mb: 1.5,
                      bgcolor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                      '& .MuiLinearProgress-bar': {
                        bgcolor: sig.color,
                        borderRadius: 3,
                      },
                    }}
                  />

                  <Typography variant="caption" color="text.secondary" display="block" sx={{ fontSize: '0.72rem' }}>
                    {showSignalDetails ? sig.detail : sig.sub}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Paper>

        {/* ─────────────────────────────────────────────────────────────
            GRID ROW 3: GRAPH #4 (MODEL PROFILE WEIGHTS) & GRAPH #5 (REACTIONS)
            ───────────────────────────────────────────────────────────── */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {/* Left: GRAPH #4 — YOUR INTEREST PROFILE (MODEL MEMORY) */}
          <Grid item xs={12} md={6}>
            <Paper elevation={0} sx={{ p: 3, borderRadius: '12px', border: `1px solid ${borderCol}`, backgroundColor: surfaceBg, height: '100%' }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 0.5 }}>
                <Typography component="h2" sx={sectionHeaderSx(theme)}>
                  <PsychologyIcon sx={{ fontSize: 16, color: primaryAccent }} />
                  YOUR INTEREST PROFILE
                </Typography>
                <Chip label="Model configuration" size="small" sx={{ height: 20, fontSize: '0.62rem', fontWeight: 700 }} />
              </Stack>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2.5 }}>
                Dual-view history memory weights (W_short = 0.60, W_long = 0.40)
              </Typography>

              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={6}>
                  <Box sx={{ p: 2, borderRadius: '8px', bgcolor: isDark ? 'rgba(56, 189, 248, 0.08)' : 'rgba(37, 99, 235, 0.05)', border: `1px solid ${isDark ? 'rgba(56, 189, 248, 0.2)' : 'rgba(37, 99, 235, 0.15)'}` }}>
                    <Typography variant="caption" color="text.secondary" fontWeight={700} display="block">
                      SHORT-TERM PROFILE
                    </Typography>
                    <Typography variant="h4" fontWeight={800} color={primaryAccent} sx={{ my: 0.5 }}>
                      0.60
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block">
                      Recent reading behavior (latest 5 reads)
                    </Typography>
                  </Box>
                </Grid>

                <Grid item xs={6}>
                  <Box sx={{ p: 2, borderRadius: '8px', bgcolor: isDark ? 'rgba(129, 140, 248, 0.08)' : 'rgba(79, 70, 229, 0.05)', border: `1px solid ${isDark ? 'rgba(129, 140, 248, 0.2)' : 'rgba(79, 70, 229, 0.15)'}` }}>
                    <Typography variant="caption" color="text.secondary" fontWeight={700} display="block">
                      LONG-TERM PROFILE
                    </Typography>
                    <Typography variant="h4" fontWeight={800} sx={{ color: '#4F46E5', my: 0.5 }}>
                      0.40
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block">
                      Historical reading behavior (up to 50 reads)
                    </Typography>
                  </Box>
                </Grid>
              </Grid>

              {/* Dual Profile Memory Ratio Track */}
              <Box sx={{ p: 1.5, borderRadius: '8px', bgcolor: isDark ? '#172033' : '#F8FAFC', border: `1px solid ${borderCol}` }}>
                <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.75 }}>
                  <Typography variant="caption" fontWeight={700} color={primaryAccent}>
                    Short-Term (60%)
                  </Typography>
                  <Typography variant="caption" fontWeight={700} sx={{ color: '#4F46E5' }}>
                    Long-Term (40%)
                  </Typography>
                </Stack>
                <Box sx={{ display: 'flex', height: 8, borderRadius: 4, overflow: 'hidden' }}>
                  <Box sx={{ width: '60%', bgcolor: primaryAccent }} />
                  <Box sx={{ width: '40%', bgcolor: '#4F46E5' }} />
                </Box>
              </Box>
            </Paper>
          </Grid>

          {/* Right: GRAPH #5 — REACTION & ENGAGEMENT */}
          <Grid item xs={12} md={6}>
            <Paper elevation={0} sx={{ p: 3, borderRadius: '12px', border: `1px solid ${borderCol}`, backgroundColor: surfaceBg, height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Typography component="h2" sx={{ ...sectionHeaderSx(theme), alignSelf: 'flex-start' }}>
                <FavoriteIcon sx={{ fontSize: 16, color: primaryAccent }} />
                REACTION & ENGAGEMENT
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ alignSelf: 'flex-start', mb: 1 }}>
                Explicit article feedback
              </Typography>

              <PureDonutChart likes={likes} dislikes={dislikes} />

              <Stack direction="row" spacing={4} justifyContent="center" sx={{ mt: 'auto', pt: 1, width: '100%' }}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <ThumbUpIcon sx={{ color: isDark ? '#38BDF8' : '#2563EB', fontSize: 16 }} />
                  <Typography variant="body2" fontWeight={700}>
                    {likes} <Box component="span" color="text.secondary" fontWeight={500}>Likes</Box>
                  </Typography>
                </Stack>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <ThumbDownIcon sx={{ color: isDark ? '#94A3B8' : '#64748B', fontSize: 16 }} />
                  <Typography variant="body2" fontWeight={700}>
                    {dislikes} <Box component="span" color="text.secondary" fontWeight={500}>Dislikes</Box>
                  </Typography>
                </Stack>
              </Stack>
            </Paper>
          </Grid>
        </Grid>

        {/* ─────────────────────────────────────────────────────────────
            SECTION 9 — HOW NEXORA PERSONALIZES YOUR FEED (6-STAGE FLOWCHART DIAGRAM)
            ───────────────────────────────────────────────────────────── */}
        <Paper elevation={0} sx={{ p: 3.5, borderRadius: '12px', border: `1px solid ${borderCol}`, backgroundColor: surfaceBg, mb: 4 }}>
          <Typography component="h2" sx={sectionHeaderSx(theme)}>
            HOW NEXORA PERSONALIZES YOUR FEED
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            End-to-end recommendation processing pipeline executed for every personalized feed query.
          </Typography>

          <Stack direction={{ xs: 'column', lg: 'row' }} spacing={{ xs: 2, lg: 1 }} alignItems="stretch">
            {[
              {
                step: 'STAGE 01',
                title: 'Reading History',
                param: '5 Short / 50 Long',
                desc: 'Recent and historical reads form the user profile.',
              },
              {
                step: 'STAGE 02',
                title: 'Dual Profile Fusion',
                param: 'W_short=0.60, W_long=0.40',
                desc: 'Combines short-term and long-term interest vectors.',
              },
              {
                step: 'STAGE 03',
                title: 'Candidate Attention',
                param: 'Softmax τ = 0.10',
                desc: 'Re-weights user history relative to each candidate story.',
              },
              {
                step: 'STAGE 04',
                title: 'Context Relevance',
                param: 'C_rel ∈ [0.80, 1.25]',
                desc: 'Time, day, and category context adjust candidate relevance.',
              },
              {
                step: 'STAGE 05',
                title: 'Hybrid Ranking',
                param: '60/20/10/10 Formula',
                desc: 'Combines Semantic, Recency, Popularity, and Interest scores.',
              },
              {
                step: 'STAGE 06',
                title: 'Diversity Reranker',
                param: 'Max 2 / Cat & Source',
                desc: 'Category and publisher repetition are strictly capped.',
              },
            ].map((item, idx, arr) => (
              <React.Fragment key={item.step}>
                <Box
                  sx={{
                    flex: 1,
                    p: 2,
                    borderRadius: '10px',
                    bgcolor: isDark ? '#172033' : '#F8FAFC',
                    border: `1px solid ${borderCol}`,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <Box sx={{ mb: 1 }}>
                    <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
                      <Chip
                        label={item.step}
                        size="small"
                        sx={{
                          height: 18,
                          fontSize: '0.6rem',
                          fontWeight: 800,
                          bgcolor: isDark ? 'rgba(56, 189, 248, 0.15)' : 'rgba(37, 99, 235, 0.1)',
                          color: primaryAccent,
                        }}
                      />
                    </Stack>
                    <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 0.75, lineHeight: 1.2, fontSize: '0.825rem' }}>
                      {item.title}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.72rem', lineHeight: 1.4, display: 'block', mb: 1.5 }}>
                      {item.desc}
                    </Typography>
                  </Box>

                  <Chip
                    label={item.param}
                    size="small"
                    variant="outlined"
                    sx={{
                      fontSize: '0.62rem',
                      fontWeight: 700,
                      height: 20,
                      borderColor: borderCol,
                      color: theme.palette.text.secondary,
                      alignSelf: 'flex-start',
                    }}
                  />
                </Box>

                {idx < arr.length - 1 && (
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      px: { xs: 0, lg: 0.25 },
                      py: { xs: 0.5, lg: 0 },
                    }}
                  >
                    <ArrowForwardIcon
                      sx={{
                        color: primaryAccent,
                        fontSize: 16,
                        transform: { xs: 'rotate(90deg)', lg: 'rotate(0deg)' },
                      }}
                    />
                  </Box>
                )}
              </React.Fragment>
            ))}
          </Stack>
        </Paper>

        {/* ─────────────────────────────────────────────────────────────
            SECTION 10 — REAL-TIME LEARNING LOOP (4-STEP FLOW DIAGRAM)
            ───────────────────────────────────────────────────────────── */}
        <Paper elevation={0} sx={{ p: 3.5, borderRadius: '12px', border: `1px solid ${borderCol}`, backgroundColor: surfaceBg, mb: 4 }}>
          <Typography component="h2" sx={sectionHeaderSx(theme)}>
            YOUR FEED EVOLVES WITH YOU
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2.5 }}>
            Nexora dynamically rebuilds your recommendation profile from new reading activity.
          </Typography>

          <Stack direction={{ xs: 'column', md: 'row' }} spacing={{ xs: 2, md: 1.5 }} alignItems="center">
            {[
              { num: '01', title: 'READ STORY', sub: 'Interaction logged in MongoDB' },
              { num: '02', title: 'HISTORY UPDATED', sub: 'Short-term window refreshed' },
              { num: '03', title: 'PROFILE RECALCULATED', sub: 'Softmax attention recomputed' },
              { num: '04', title: 'RECOMMENDATIONS REFRESHED', sub: 'Adapted feed returned on query' },
            ].map((step, idx, arr) => (
              <React.Fragment key={step.num}>
                <Box
                  sx={{
                    flex: 1,
                    width: '100%',
                    p: 2,
                    textAlign: 'center',
                    borderRadius: '10px',
                    bgcolor: isDark ? '#172033' : '#F8FAFC',
                    border: `1px solid ${borderCol}`,
                  }}
                >
                  <Typography variant="caption" fontWeight={800} color={primaryAccent} display="block" sx={{ fontSize: '0.65rem', mb: 0.5 }}>
                    STEP {step.num}
                  </Typography>
                  <Typography variant="subtitle2" fontWeight={800} color="text.primary" sx={{ fontSize: '0.825rem', mb: 0.5 }}>
                    {step.title}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.72rem', display: 'block' }}>
                    {step.sub}
                  </Typography>
                </Box>
                {idx < arr.length - 1 && (
                  <Box sx={{ py: { xs: 0.5, md: 0 } }}>
                    <ArrowForwardIcon
                      sx={{
                        color: primaryAccent,
                        fontSize: 18,
                        transform: { xs: 'rotate(90deg)', md: 'rotate(0deg)' },
                      }}
                    />
                  </Box>
                )}
              </React.Fragment>
            ))}
          </Stack>
        </Paper>

        {/* ─────────────────────────────────────────────────────────────
            SECTION 17 — TECHNICAL FOOTNOTE ("MODEL DETAILS")
            ───────────────────────────────────────────────────────────── */}
        <Accordion
          elevation={0}
          sx={{
            borderRadius: '8px !important',
            border: `1px solid ${borderCol}`,
            backgroundColor: surfaceBg,
            '&:before': { display: 'none' },
          }}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: theme.palette.text.secondary }} />}>
            <Typography variant="caption" fontWeight={700} color="text.secondary" letterSpacing="0.08em" sx={{ textTransform: 'uppercase' }}>
              MODEL DETAILS & SPECIFICATIONS
            </Typography>
          </AccordionSummary>
          <AccordionDetails sx={{ pt: 1, pb: 3 }}>
            <Grid container spacing={2}>
              {[
                { label: 'Sentence Transformer', val: 'all-MiniLM-L6-v2', sub: 'Pre-trained Transformer Encoder' },
                { label: 'Embedding Dimension', val: '384 Dense Vector', sub: 'Dense cosine semantic space' },
                { label: 'Short-Term History', val: 'Latest 5 Reads', sub: 'Sliding window short-term memory' },
                { label: 'Long-Term History', val: 'Up to 50 Reads', sub: 'Persistent historical interest log' },
                { label: 'Attention Mechanism', val: 'Candidate Softmax', sub: 'Temperature scaling τ = 0.10' },
                { label: 'Hybrid Formula', val: '60 Sem / 20 Rec / 10 Pop / 10 Int', sub: 'Multi-signal linear combination' },
                { label: 'Context Fusion', val: 'Cyclical Time + Category', sub: 'Temporal sin/cos & density scaling' },
                { label: 'Diversity Caps', val: 'Max 2 / Category & Publisher', sub: 'Two-pass filter reranking' },
              ].map((spec) => (
                <Grid item xs={12} sm={6} md={3} key={spec.label}>
                  <Box
                    sx={{
                      p: 2,
                      borderRadius: '8px',
                      bgcolor: isDark ? '#172033' : '#F8FAFC',
                      border: `1px solid ${borderCol}`,
                    }}
                  >
                    <Typography variant="caption" color="text.secondary" fontWeight={600} display="block" sx={{ mb: 0.5 }}>
                      {spec.label}
                    </Typography>
                    <Typography variant="body2" fontWeight={800} color="text.primary" sx={{ mb: 0.25 }}>
                      {spec.val}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem', display: 'block' }}>
                      {spec.sub}
                    </Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </AccordionDetails>
        </Accordion>

      </Container>
    </Box>
  );
}

export default Analytics;