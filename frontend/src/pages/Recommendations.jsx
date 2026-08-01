import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Box,
  Skeleton,
  Alert,
} from "@mui/material";
import SmartToyIcon from "@mui/icons-material/SmartToy";

import { getPersonalizedRecommendations } from "../services/newsService";
import { useAuth } from "../context/AuthContext";
import NewsCard from "../components/NewsCard";

function Recommendations() {
  const navigate = useNavigate();
  const { token } = useAuth();

  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadRecommendations();
  }, []);

  const loadRecommendations = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getPersonalizedRecommendations(token);

      if (data.success) {
        setRecommendations(data.recommendations || []);
      } else {
        setError(data.message || "Failed to fetch recommendations.");
      }
    } catch (err) {
      console.error(err);
      setError("Unable to load recommendations. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 5, mb: 6 }}>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        🤖 AI Personalized Recommendations
      </Typography>

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
          : recommendations.map((news) => (
              <Grid xs={12} sm={6} md={4} key={news._id}>
                <NewsCard news={news} showScore showExplanation />
              </Grid>
            ))}
      </Grid>

      {!loading && !error && recommendations.length === 0 && (
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
          <SmartToyIcon sx={{ fontSize: 60, color: "text.secondary", mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No Personalized Recommendations Yet
          </Typography>

          <Typography color="text.secondary" sx={{ mb: 3 }}>
            Read a few news articles first so the AI recommendation engine can learn your preferences!
          </Typography>

          <Button
            variant="contained"
            onClick={() => navigate("/")}
          >
            Browse News
          </Button>
        </Box>
      )}
    </Container>
  );
}

export default Recommendations;