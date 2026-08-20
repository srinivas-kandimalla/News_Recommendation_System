import { useCallback, useEffect, useState } from 'react';
import {
  Box, Button, Card, CardContent, Chip, CircularProgress,
  Grid, Stack, Table, TableBody, TableCell, TableHead, TableRow,
  Typography,
} from '@mui/material';
import {
  ArticleOutlined, CloudDownloadOutlined,
  GroupOutlined, RefreshRounded, TrendingUpOutlined, ThumbUpAltOutlined,
} from '@mui/icons-material';
import ErrorState from '../components/common/ErrorState';
import Loader from '../components/common/Loader';
import SectionHeader from '../components/common/SectionHeader';
import useDocumentTitle from '../hooks/useDocumentTitle';
import useFeedback from '../hooks/useFeedback';
import { getAdminDashboard } from '../services/adminService';
import { fetchNews } from '../services/newsService';
import { getApiErrorMessage } from '../utils/apiError';
import AppSnackbar from '../components/common/AppSnackbar';

function StatCard({ icon: Icon, label, value, color = 'primary.main', caption }) {
  return (
    <Card>
      <CardContent sx={{ p: { xs: 2, sm: 2.5 } }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Box
            sx={{
              width: 42, height: 42,
              borderRadius: 2,
              bgcolor: color,
              display: 'grid',
              placeItems: 'center',
              color: '#fff',
              flexShrink: 0,
            }}
          >
            <Icon sx={{ fontSize: 20 }} />
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ letterSpacing: '0.05em', textTransform: 'uppercase', fontSize: '0.68rem' }}>
              {label}
            </Typography>
            <Typography variant="h5" fontWeight={800} sx={{ letterSpacing: '-0.03em', lineHeight: 1.1 }}>
              {value ?? '—'}
            </Typography>
            {caption && <Typography variant="caption" color="text.disabled">{caption}</Typography>}
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

function StatusDot({ status }) {
  const color = status === 'running' || status === 'ok' || status === 'connected'
    ? '#22C55E'
    : status === 'warning' ? '#F59E0B' : '#6B7280';
  return (
    <Box
      component="span"
      sx={{
        display: 'inline-block',
        width: 8, height: 8,
        borderRadius: '50%',
        bgcolor: color,
        mr: 1,
        verticalAlign: 'middle',
      }}
    />
  );
}

export default function AdminDashboard() {
  useDocumentTitle('Admin — Nexora');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [fetching, setFetching] = useState(false);
  const { feedback, notify, dismiss } = useFeedback();

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const d = await getAdminDashboard();
      setData(d);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleFetchNews = async () => {
    setFetching(true);
    try {
      const d = await fetchNews();
      notify(d.message || 'News fetched successfully.', 'success');
      load();
    } catch (err) {
      notify(getApiErrorMessage(err), 'error');
    } finally {
      setFetching(false);
    }
  };

  // Backend returns: { dashboard: { total_users, total_news, total_reads, total_bookmarks, total_likes, total_dislikes, most_popular_category } }
  const dashboard = data?.dashboard || {};
  const systemStatus = data?.system_status || {};
  const recentNews = data?.recent_news || [];
  const topEngagement = data?.top_engagement || [];

  const totalUsers = dashboard.total_users ?? '—';
  const totalNews = dashboard.total_news ?? '—';
  const totalReads = dashboard.total_reads ?? '—';
  const totalEngagement = typeof dashboard.total_likes === 'number' && typeof dashboard.total_dislikes === 'number'
    ? (dashboard.total_likes + dashboard.total_dislikes)
    : dashboard.total_reactions ?? '—';

  if (loading) return <Loader minHeight="50vh" />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <>
      <SectionHeader
        eyebrow="OPERATIONS"
        title="Admin dashboard"
        action={
          <Stack direction="row" spacing={1.5}>
            <Button
              size="small"
              startIcon={fetching ? <CircularProgress size={14} color="inherit" /> : <CloudDownloadOutlined />}
              variant="contained"
              onClick={handleFetchNews}
              disabled={fetching}
            >
              {fetching ? 'Fetching…' : 'Fetch news'}
            </Button>
            <Button size="small" startIcon={<RefreshRounded />} onClick={load} variant="outlined">
              Refresh
            </Button>
          </Stack>
        }
        sx={{ mb: 4 }}
      />

      {/* Stats */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={6} sm={3}>
          <StatCard icon={GroupOutlined} label="Users" value={totalUsers} color="#6366F1" />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatCard icon={ArticleOutlined} label="Articles" value={totalNews} color="#00C2E0" />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatCard icon={TrendingUpOutlined} label="Reads" value={totalReads} color="#22C55E" />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatCard icon={ThumbUpAltOutlined} label="Reactions" value={totalEngagement} color="#F59E0B" />
        </Grid>
      </Grid>

      <Grid container spacing={2.5}>
        {/* System status */}
        {Object.keys(systemStatus).length > 0 && (
          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%' }}>
              <CardContent sx={{ p: 2.5 }}>
                <Typography variant="h6" fontWeight={650} sx={{ mb: 2 }}>
                  System status
                </Typography>
                <Stack spacing={1.5}>
                  {Object.entries(systemStatus).map(([key, val]) => {
                    const status = typeof val === 'string' ? val.toLowerCase() : typeof val === 'boolean' ? (val ? 'ok' : 'error') : 'unknown';
                    const label = key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
                    return (
                      <Box key={key} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body2" fontWeight={500}>{label}</Typography>
                        <Chip
                          label={
                            <><StatusDot status={status} />{typeof val === 'string' ? val : status}</>
                          }
                          size="small"
                          sx={{ fontSize: '0.7rem', height: 22 }}
                        />
                      </Box>
                    );
                  })}
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Recent news table */}
        {recentNews.length > 0 && (
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent sx={{ p: 2.5 }}>
                <Typography variant="h6" fontWeight={650} sx={{ mb: 2 }}>
                  Recent articles
                </Typography>
                <Box sx={{ overflowX: 'auto' }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Title</TableCell>
                        <TableCell>Category</TableCell>
                        <TableCell align="right">Reads</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {recentNews.slice(0, 8).map((n) => (
                        <TableRow key={n._id} hover sx={{ cursor: 'pointer' }} onClick={() => window.open(`/news/${n._id}`, '_self')}>
                          <TableCell sx={{ maxWidth: 260 }}>
                            <Typography variant="body2" noWrap fontWeight={500}>
                              {n.title || 'Untitled'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip label={n.category || 'General'} size="small" sx={{ height: 18, fontSize: '0.65rem' }} />
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" color="text.secondary">
                              {n.reads || 0}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>

      <AppSnackbar feedback={feedback} onClose={dismiss} />
    </>
  );
}
