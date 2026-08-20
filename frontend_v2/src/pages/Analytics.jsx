import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Box, Card, CardContent, Divider, Grid,
  LinearProgress, Skeleton, Stack, Typography, useTheme,
} from '@mui/material';
import { ArcElement, Chart as ChartJS, Legend, Tooltip } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import EmptyState from '../components/common/EmptyState';
import ErrorState from '../components/common/ErrorState';
import Loader from '../components/common/Loader';
import SectionHeader from '../components/common/SectionHeader';
import useDocumentTitle from '../hooks/useDocumentTitle';
import { getAnalytics } from '../services/analyticsService';
import { getApiErrorMessage } from '../utils/apiError';

ChartJS.register(ArcElement, Tooltip, Legend);

const CATEGORY_COLORS = {
  Technology: '#0EA5E9',
  Science: '#8B5CF6',
  Business: '#F59E0B',
  Sports: '#22C55E',
  Entertainment: '#EC4899',
  Health: '#14B8A6',
  Politics: '#6366F1',
  World: '#F97316',
};
const fallbackColors = ['#00C2E0', '#7C6F5E', '#6B6863', '#9E9B94'];

function StatRow({ label, value, max, color }) {
  const pct = max ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.75 }}>
        <Typography variant="body2" fontWeight={600}>{label}</Typography>
        <Typography variant="body2" color="text.secondary" fontWeight={700}>{value}</Typography>
      </Stack>
      <LinearProgress
        variant="determinate"
        value={pct}
        sx={{
          height: 6,
          bgcolor: 'divider',
          '& .MuiLinearProgress-bar': { bgcolor: color || 'primary.main' },
        }}
      />
    </Box>
  );
}

export default function Analytics() {
  useDocumentTitle('Reading Signature — Nexora');
  const theme = useTheme();
  const dark = theme.palette.mode === 'dark';
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getAnalytics();
      setAnalytics(data.analytics || null);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const hasData = analytics && (
    analytics.total_articles_read > 0 ||
    analytics.total_bookmarks > 0 ||
    analytics.total_likes > 0
  );

  const donutData = useMemo(() => {
    if (!analytics) return null;
    const reads = analytics.total_articles_read || 0;
    const saves = analytics.total_bookmarks || 0;
    const likes = analytics.total_likes || 0;
    const dislikes = analytics.total_dislikes || 0;

    return {
      labels: ['Articles read', 'Saved', 'Liked', 'Not interested'],
      datasets: [{
        data: [reads, saves, likes, dislikes],
        backgroundColor: ['#00C2E0', '#8B5CF6', '#22C55E', '#F59E0B'],
        borderWidth: 0,
        hoverOffset: 4,
      }],
    };
  }, [analytics]);

  const donutOptions = useMemo(() => ({
    cutout: '70%',
    animation: { duration: 600 },
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: theme.palette.text.secondary,
          padding: 16,
          usePointStyle: true,
          pointStyleWidth: 8,
          font: { size: 12, weight: '600' },
        },
      },
      tooltip: {
        backgroundColor: dark ? '#232328' : '#18181A',
        titleColor: '#F0EEE8',
        bodyColor: '#9E9B94',
        padding: 12,
        cornerRadius: 8,
      },
    },
  }), [theme, dark]);

  const totalEngagement = analytics
    ? (analytics.total_articles_read || 0) + (analytics.total_bookmarks || 0) + (analytics.total_likes || 0)
    : 0;

  if (loading) return <Loader minHeight="50vh" />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <>
      <SectionHeader
        eyebrow="YOUR READING SIGNATURE"
        title="Reading insights"
        description="A clear picture of how you explore, save, and shape your feed."
        sx={{ mb: 5 }}
      />

      {!hasData ? (
        <EmptyState
          title="Your signature is forming"
          description="Start reading stories to build your personal reading profile. The more you read, the better Nexora understands you."
          actionLabel="Explore stories"
          onAction={() => window.location.assign('/')}
        />
      ) : (
        <Grid container spacing={2.5}>
          {/* Left: Narrative + stats */}
          <Grid item xs={12} md={7}>
            <Stack spacing={2.5}>
              {/* Narrative card */}
              <Card>
                <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
                  <Typography variant="overline" color="primary.main" sx={{ fontWeight: 700, fontSize: '0.68rem', letterSpacing: '0.12em' }}>
                    YOUR STORY
                  </Typography>
                  <Typography
                    sx={{
                      fontFamily: 'Georgia, "Times New Roman", serif',
                      fontSize: { xs: '1.1rem', sm: '1.3rem' },
                      lineHeight: 1.5,
                      letterSpacing: '-0.01em',
                      mt: 1.5,
                      color: 'text.primary',
                    }}
                  >
                    {analytics.favorite_category && analytics.favorite_category !== 'N/A'
                      ? `You read ${analytics.favorite_category} most`
                      : 'You\'re building your reading profile'}
                    {analytics.favorite_author && analytics.favorite_author !== 'N/A'
                      ? `, especially pieces by ${analytics.favorite_author}.`
                      : '.'}
                    {analytics.total_articles_read > 5
                      ? ` With ${analytics.total_articles_read} articles read, Nexora is learning your interests.`
                      : ''}
                  </Typography>
                </CardContent>
              </Card>

              {/* Activity breakdown */}
              <Card>
                <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
                  <Typography variant="h6" fontWeight={650} sx={{ mb: 2.5 }}>
                    Activity breakdown
                  </Typography>
                  <Stack spacing={2}>
                    <StatRow
                      label="Articles read"
                      value={analytics.total_articles_read || 0}
                      max={totalEngagement}
                      color="#00C2E0"
                    />
                    <StatRow
                      label="Stories saved"
                      value={analytics.total_bookmarks || 0}
                      max={totalEngagement}
                      color="#8B5CF6"
                    />
                    <StatRow
                      label="Stories liked"
                      value={analytics.total_likes || 0}
                      max={totalEngagement}
                      color="#22C55E"
                    />
                    <StatRow
                      label="Not interested"
                      value={analytics.total_dislikes || 0}
                      max={totalEngagement}
                      color="#F59E0B"
                    />
                  </Stack>
                </CardContent>
              </Card>

              {/* Likes vs dislikes balance */}
              {(analytics.total_likes > 0 || analytics.total_dislikes > 0) && (
                <Card>
                  <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
                    <Typography variant="h6" fontWeight={650} sx={{ mb: 1 }}>
                      Reaction balance
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Your overall signal quality
                    </Typography>
                    {(() => {
                      const total = (analytics.total_likes || 0) + (analytics.total_dislikes || 0);
                      const positivePct = total ? Math.round((analytics.total_likes / total) * 100) : 0;
                      return (
                        <>
                          <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.75 }}>
                            <Typography variant="body2" color="text.secondary">Positive</Typography>
                            <Typography variant="body2" fontWeight={700} color="primary.main">
                              {positivePct}%
                            </Typography>
                          </Stack>
                          <LinearProgress
                            variant="determinate"
                            value={positivePct}
                            sx={{
                              height: 8,
                              bgcolor: 'divider',
                              '& .MuiLinearProgress-bar': { bgcolor: positivePct >= 60 ? '#22C55E' : '#F59E0B' },
                            }}
                          />
                          <Typography variant="caption" color="text.disabled" sx={{ mt: 1, display: 'block' }}>
                            {analytics.total_likes || 0} likes · {analytics.total_dislikes || 0} not interested
                          </Typography>
                        </>
                      );
                    })()}
                  </CardContent>
                </Card>
              )}
            </Stack>
          </Grid>

          {/* Right: Doughnut + profile */}
          <Grid item xs={12} md={5}>
            <Stack spacing={2.5}>
              {/* Engagement donut */}
              {donutData && (
                <Card>
                  <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
                    <Typography variant="h6" fontWeight={650} sx={{ mb: 0.5 }}>
                      Engagement mix
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      How you interact with news
                    </Typography>
                    <Box sx={{ maxWidth: 280, mx: 'auto' }}>
                      <Doughnut data={donutData} options={donutOptions} />
                    </Box>
                  </CardContent>
                </Card>
              )}

              {/* Reading profile */}
              <Card>
                <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
                  <Typography variant="h6" fontWeight={650} sx={{ mb: 2 }}>
                    Reading profile
                  </Typography>
                  <Stack spacing={0}>
                    <Box sx={{ py: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
                      <Typography variant="caption" color="text.disabled" sx={{ letterSpacing: '0.08em', fontWeight: 700 }}>
                        FAVOURITE CATEGORY
                      </Typography>
                      <Typography variant="h5" sx={{ mt: 0.5, fontWeight: 700 }}>
                        {analytics.favorite_category !== 'N/A' ? analytics.favorite_category : '—'}
                      </Typography>
                    </Box>
                    <Box sx={{ py: 2 }}>
                      <Typography variant="caption" color="text.disabled" sx={{ letterSpacing: '0.08em', fontWeight: 700 }}>
                        FAVOURITE AUTHOR
                      </Typography>
                      <Typography variant="h5" sx={{ mt: 0.5, fontWeight: 700 }}>
                        {analytics.favorite_author !== 'N/A' ? analytics.favorite_author : '—'}
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Stack>
          </Grid>
        </Grid>
      )}
    </>
  );
}
