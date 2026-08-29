import React, { useEffect, useState } from 'react';
import {
  Container,
  Box,
  Typography,
  Grid,
  Divider,
  CircularProgress,
  Alert,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Pie } from 'react-chartjs-2';

import { getAdminDashboard } from '../services/newsService';
import { useAuth } from '../context/AuthContext';

ChartJS.register(ArcElement, Tooltip, Legend);

function AdminDashboard() {
  const theme = useTheme();
  const { token } = useAuth();

  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadDashboard();
  }, [token]);

  const loadDashboard = async () => {
    try {
      const res = await getAdminDashboard(token);
      if (res.success) setDashboard(res.dashboard || res.stats || res);
      else setError(res.message || 'Failed to load dashboard.');
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Unable to load admin dashboard.';
      setError(errMsg);
    } finally {
      setLoading(false);
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

  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', backgroundColor: theme.palette.background.default, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress size={24} sx={{ color: theme.palette.text.secondary }} />
      </Box>
    );
  }

  const isDark = theme.palette.mode === 'dark';
  const stats = dashboard?.stats || dashboard;

  const reactionData = stats ? {
    labels: ['Likes', 'Dislikes'],
    datasets: [{
      data: [stats.total_likes || 0, stats.total_dislikes || 0],
      backgroundColor: isDark ? ['#F0F0F0', '#2A2A2A'] : ['#1A1A1A', '#E5E5E5'],
      borderWidth: 0,
    }],
  } : null;

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          font: { family: '"Inter", sans-serif', size: 12 },
          color: theme.palette.text.secondary,
          padding: 16,
          boxWidth: 12,
        },
      },
    },
  };

  const kpis = stats ? [
    { label: 'Total users', value: stats.total_users ?? stats.users_count ?? 0 },
    { label: 'Total articles', value: stats.total_news ?? stats.news_count ?? 0 },
    { label: 'Total reads', value: stats.total_reads ?? stats.reads_count ?? 0 },
    { label: 'Total bookmarks', value: stats.total_bookmarks ?? stats.bookmarks_count ?? 0 },
  ] : [];

  return (
    <Box sx={{ backgroundColor: theme.palette.background.default, minHeight: '100vh', pb: 6 }}>
      <Container maxWidth="lg" sx={{ pt: { xs: 3, md: 4 }, px: { xs: 2, md: 3 } }}>

        <Box sx={{ mb: 3 }}>
          <Typography
            variant="h3"
            component="h1"
            sx={{ fontFamily: '"Playfair Display", Georgia, serif', fontWeight: 700, color: theme.palette.text.primary, mb: 0.5 }}
          >
            Admin Dashboard
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Platform overview.
          </Typography>
        </Box>

        <Divider sx={{ mb: 3 }} />

        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

        {!dashboard ? (
          <Typography variant="body2" color="text.secondary">No dashboard data available.</Typography>
        ) : (
          <Grid container spacing={4}>
            {/* KPI row */}
            <Grid item xs={12}>
              <Typography sx={{ ...sectionLabel, mb: 2 }}>Platform Metrics</Typography>
              <Grid container spacing={2}>
                {kpis.map(({ label, value }) => (
                  <Grid item xs={6} sm={3} key={label}>
                    <Box
                      sx={{
                        p: 2.5,
                        border: `1px solid ${theme.palette.divider}`,
                        borderRadius: 1,
                        backgroundColor: theme.palette.background.paper,
                      }}
                    >
                      <Typography
                        sx={{
                          fontFamily: '"Playfair Display", serif',
                          fontWeight: 700,
                          fontSize: '2rem',
                          lineHeight: 1,
                          color: theme.palette.text.primary,
                          mb: 0.5,
                        }}
                      >
                        {value}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">{label}</Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Grid>

            {/* Pie chart */}
            {reactionData && (
              <Grid item xs={12} sm={6} md={4}>
                <Typography sx={{ ...sectionLabel, mb: 2 }}>Reactions</Typography>
                <Box
                  sx={{
                    p: 2.5,
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: 1,
                    backgroundColor: theme.palette.background.paper,
                    maxWidth: 280,
                  }}
                >
                  <Pie data={reactionData} options={chartOptions} />
                </Box>
              </Grid>
            )}

            {/* Most popular category */}
            {stats?.most_popular_category && (
              <Grid item xs={12} sm={6} md={4}>
                <Typography sx={{ ...sectionLabel, mb: 2 }}>Top Category</Typography>
                <Box
                  sx={{
                    p: 2.5,
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: 1,
                    backgroundColor: theme.palette.background.paper,
                  }}
                >
                  <Typography
                    sx={{
                      fontFamily: '"Playfair Display", serif',
                      fontWeight: 700,
                      fontSize: '1.5rem',
                      color: theme.palette.text.primary,
                    }}
                  >
                    {stats.most_popular_category}
                  </Typography>
                </Box>
              </Grid>
            )}
          </Grid>
        )}
      </Container>
    </Box>
  );
}

export default AdminDashboard;