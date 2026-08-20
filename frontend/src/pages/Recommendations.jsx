import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Grid,
  Stack,
  Skeleton,
  Alert,
  Button,
  Chip,
  Card,
  CardContent,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { motion } from 'framer-motion';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import MemoryIcon from '@mui/icons-material/Memory';
import SpeedIcon from '@mui/icons-material/Speed';
import CategoryIcon from '@mui/icons-material/Category';

import { getPersonalizedRecommendations } from '../services/newsService';
import { useAuth } from '../context/AuthContext';
import RecommendationCard from '../components/common/RecommendationCard';
import ExplanationCard from '../components/common/ExplanationCard';
import InsightsWidget from '../components/common/InsightsWidget';
import StatCard from '../components/common/StatCard';

function Recommendations() {
  const theme = useTheme();
  const navigate = useNavigate();
  const { token, isAuthenticated } = useAuth();

  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadRecommendations();
  }, [token]);

  const loadRecommendations = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getPersonalizedRecommendations(token);

      if (data.success) {
        setRecommendations(data.recommendations || []);
      } else {
        setError(data.message || 'Failed to fetch personalized recommendations.');
      }
    } catch (err) {
      console.error(err);
      setError('Unable to load recommendations. Please ensure you are signed in.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4, px: { xs: 2, md: 4 } }}>
      {/* ==================================================== */}
      {/* PAGE HEADER                                          */}
      {/* ==================================================== */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Box
          sx={{
            borderRadius: `${theme.shape.borderRadius * 3}px`,
            p: { xs: 3, md: 4 },
            mb: 4,
            background: `linear-gradient(135deg, ${alpha(theme.palette.secondary.main, 0.08)} 0%, ${alpha(
              theme.palette.primary.main,
              0.06
            )} 100%)`,
            border: `1px solid ${alpha(theme.palette.secondary.main, 0.2)}`,
            boxShadow: theme.shadows[1],
          }}
        >
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
            <Chip
              icon={<AutoAwesomeIcon sx={{ fontSize: 14 }} />}
              label="AI Neural Engine"
              size="small"
              sx={{
                backgroundColor: theme.palette.secondary.main,
                color: '#FFFFFF',
                fontWeight: 700,
                fontSize: '0.75rem',
              }}
            />
          </Stack>

          <Typography
            variant="h3"
            component="h1"
            sx={{
              fontFamily: theme.typography.h1.fontFamily,
              fontWeight: 800,
              fontSize: { xs: '1.8rem', md: '2.4rem' },
              color: theme.palette.text.primary,
              mb: 1,
            }}
          >
            Personalized AI Recommendations
          </Typography>

          <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 640, mb: 3 }}>
            Articles tailored to your reading profile using high-dimensional sentence transformers, recency weighting, and engagement scoring.
          </Typography>

          {/* AI Metric Highlights */}
          <Grid container spacing={2}>
            <Grid xs={12} sm={3}>
              <StatCard
                icon={MemoryIcon}
                value="384d"
                label="Semantic Vectors"
                iconColor="secondary"
              />
            </Grid>
            <Grid xs={12} sm={3}>
              <StatCard
                icon={SpeedIcon}
                value="94%"
                label="Avg Match Score"
                iconColor="success"
              />
            </Grid>
            <Grid xs={12} sm={3}>
              <StatCard
                icon={CategoryIcon}
                value="Technology"
                label="Favorite Topic"
                iconColor="primary"
              />
            </Grid>
            <Grid xs={12} sm={3}>
              <StatCard
                icon={AutoAwesomeIcon}
                value="High"
                label="Confidence Level"
                iconColor="warning"
              />
            </Grid>
          </Grid>
        </Box>
      </motion.div>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 4, borderRadius: `${theme.shape.borderRadius * 2}px` }}>
          {error}
        </Alert>
      )}

      {/* ==================================================== */}
      {/* MAIN CONTENT GRID                                    */}
      {/* ==================================================== */}
      <Grid container spacing={3.5}>
        {/* Left Recommendations Cards (Column 1 & 2: lg={8.5}) */}
        <Grid xs={12} lg={8.5}>
          <Grid container spacing={3}>
            {loading ? (
              Array.from(new Array(6)).map((_, index) => (
                <Grid xs={12} sm={6} key={index}>
                  <Card sx={{ height: 380, borderRadius: 3 }}>
                    <Skeleton variant="rectangular" height={180} />
                    <CardContent sx={{ p: 2 }}>
                      <Skeleton variant="text" width="40%" height={20} sx={{ mb: 1 }} />
                      <Skeleton variant="text" width="90%" height={28} />
                      <Skeleton variant="text" width="60%" height={20} />
                    </CardContent>
                  </Card>
                </Grid>
              ))
            ) : recommendations.length > 0 ? (
              recommendations.map((item, index) => (
                <Grid xs={12} sm={6} key={item._id || index}>
                  <RecommendationCard
                    news={item}
                    onClick={() => navigate(`/news/${item._id}`)}
                  />
                </Grid>
              ))
            ) : (
              <Grid xs={12}>
                <Box
                  sx={{
                    textAlign: 'center',
                    py: 8,
                    px: 3,
                    backgroundColor: theme.palette.background.paper,
                    borderRadius: `${theme.shape.borderRadius * 2.5}px`,
                    border: `1px solid ${theme.palette.divider}`,
                  }}
                >
                  <SmartToyIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" color="text.primary" fontWeight={700} gutterBottom>
                    No Personalized Recommendations Yet
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 460, mx: 'auto', mb: 3 }}>
                    Read a few news articles first so the AI recommendation engine can calculate your vector profile!
                  </Typography>
                  <Button
                    variant="contained"
                    onClick={() => navigate('/')}
                    sx={{
                      borderRadius: `${theme.shape.borderRadius * 2}px`,
                      px: 3,
                      py: 1,
                      textTransform: 'none',
                      fontWeight: 600,
                    }}
                  >
                    Browse News Feed
                  </Button>
                </Box>
              </Grid>
            )}
          </Grid>
        </Grid>

        {/* Right Sidebar Widget (Column 3: lg={3.5}) */}
        <Grid xs={12} lg={3.5}>
          <Stack spacing={3} sx={{ position: { lg: 'sticky' }, top: 90 }}>
            {/* Explanation Widget */}
            <ExplanationCard
              title="Hybrid Scoring Model"
              reason="Hybrid Score = (Semantic Vector × 60%) + (Recency × 20%) + (Popularity × 10%) + (Category Affinity × 10%)."
              matchScore={96}
            />

            {/* Reading Insights */}
            <InsightsWidget />
          </Stack>
        </Grid>
      </Grid>
    </Container>
  );
}

export default Recommendations;