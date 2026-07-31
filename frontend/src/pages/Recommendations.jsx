import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Container,
  Typography,
  Grid,
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Button,
  CircularProgress,
  Chip,
  Box,
} from "@mui/material";

import { getPersonalizedRecommendations } from "../services/newsService";
import { useAuth } from "../context/AuthContext";

function Recommendations() {
  const navigate = useNavigate();
  const { token } = useAuth();

  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRecommendations();
  }, []);

  const loadRecommendations = async () => {
    try {
      const data = await getPersonalizedRecommendations(token);

      if (data.success) {
        setRecommendations(data.recommendations);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Container sx={{ mt: 6, textAlign: "center" }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 5, mb: 5 }}>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        🤖 AI Personalized Recommendations
      </Typography>

      {recommendations.length === 0 ? (
        <Box sx={{ mt: 8, textAlign: "center" }}>
          <Typography variant="h6">
            No personalized recommendations available.
          </Typography>

          <Typography color="text.secondary" sx={{ mt: 1 }}>
            Read a few news articles first so the AI can learn your interests.
          </Typography>

          <Button
            variant="contained"
            sx={{ mt: 3 }}
            onClick={() => navigate("/")}
          >
            Browse News
          </Button>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {recommendations.map((news) => (
            <Grid item xs={12} sm={6} md={4} key={news._id}>
              <Card
                sx={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  transition: "0.3s",
                  "&:hover": {
                    transform: "translateY(-6px)",
                    boxShadow: 6,
                  },
                }}
              >
                {news.image_url && (
                  <CardMedia
                    component="img"
                    height="200"
                    image={news.image_url}
                    alt={news.title}
                  />
                )}

                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography variant="h6" gutterBottom>
                    {news.title}
                  </Typography>

                  <Chip
                    label={news.category}
                    color="primary"
                    size="small"
                  />

                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mt: 2 }}
                  >
                    {news.author || "Unknown Author"}
                  </Typography>

                  <Typography
                    variant="body2"
                    color="success.main"
                    sx={{ mt: 1 }}
                  >
                    AI Score: {(news.hybrid_score * 100).toFixed(1)}%
                  </Typography>
                </CardContent>

                <CardActions>
                  <Button
                    variant="contained"
                    onClick={() => navigate(`/news/${news._id}`)}
                  >
                    Read More
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
}

export default Recommendations;