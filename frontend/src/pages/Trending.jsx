import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Stack,
  Box,
  Skeleton,
  Alert,
} from "@mui/material";

import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import WhatshotIcon from "@mui/icons-material/Whatshot";

import { getTrendingNews } from "../services/newsService";
import NewsCard from "../components/NewsCard";

function Trending() {
  const navigate = useNavigate();
  const [trendingNews, setTrendingNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTrending();
  }, []);

  const fetchTrending = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getTrendingNews();

      if (data.success) {
        setTrendingNews(data.trending_news || []);
      } else {
        setError(data.message || "Failed to load trending news.");
      }
    } catch (err) {
      console.error(err);
      setError("Unable to fetch trending news. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 5, mb: 6 }}>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 4 }}>
        <WhatshotIcon color="secondary" sx={{ fontSize: 36 }} />
        <Typography variant="h4" fontWeight="bold">
          Trending News
        </Typography>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 4 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {loading
          ? Array.from(new Array(6)).map((_, index) => (
              <Grid xs={12} sm={6} md={4} key={index}>
                <Card sx={{ height: "100%" }}>
                  <Skeleton variant="rectangular" height={200} />
                  <CardContent>
                    <Skeleton variant="text" width="60%" height={24} sx={{ mb: 1 }} />
                    <Skeleton variant="text" width="90%" height={32} />
                    <Skeleton variant="text" width="40%" height={20} sx={{ mb: 2 }} />
                    <Skeleton variant="rectangular" height={40} />
                  </CardContent>
                </Card>
              </Grid>
            ))
          : trendingNews.map((news) => (
              <Grid xs={12} sm={6} md={4} key={news._id}>
                <NewsCard news={news} showTrendingMetrics />
              </Grid>
            ))}
      </Grid>

      {!loading && !error && trendingNews.length === 0 && (
        <Box
          sx={{
            textAlign: "center",
            py: 8,
            px: 2,
            backgroundColor: "background.paper",
            borderRadius: 2,
            boxShadow: 1,
            mt: 2,
          }}
        >
          <TrendingUpIcon sx={{ fontSize: 60, color: "text.secondary", mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No Trending Articles Yet
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Check back later after articles receive reads, likes, and bookmarks!
          </Typography>
          <Button variant="contained" onClick={() => navigate("/")}>
            Browse News
          </Button>
        </Box>
      )}
    </Container>
  );
}

export default Trending;