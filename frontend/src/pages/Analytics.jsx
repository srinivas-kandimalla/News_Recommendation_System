import { useEffect, useState } from "react";
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CircularProgress,
} from "@mui/material";

import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";

import { Doughnut } from "react-chartjs-2";

import { getAnalytics } from "../services/newsService";
import { useAuth } from "../context/AuthContext";

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend
);

function Analytics() {

  const { token } = useAuth();

  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {

    try {

      const data = await getAnalytics(token);

      if (data.success) {
        setAnalytics(data.analytics);
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

  if (!analytics) {
    return (
      <Container sx={{ mt: 6 }}>
        <Typography>No analytics available.</Typography>
      </Container>
    );
  }

  const reactionChart = {
    labels: ["Likes", "Dislikes"],
    datasets: [
      {
        data: [
          analytics.total_likes,
          analytics.total_dislikes,
        ],
      },
    ],
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 5, mb: 5 }}>

      <Typography
        variant="h4"
        fontWeight="bold"
        gutterBottom
      >
        📊 Analytics Dashboard
      </Typography>

      <Grid container spacing={3}>

        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6">
                Articles Read
              </Typography>

              <Typography variant="h3">
                {analytics.total_articles_read}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6">
                Bookmarks
              </Typography>

              <Typography variant="h3">
                {analytics.total_bookmarks}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6">
                Favorite Category
              </Typography>

              <Typography variant="h5">
                {analytics.favorite_category}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={6}>
          <Card>
            <CardContent>

              <Typography
                variant="h6"
                gutterBottom
              >
                Favorite Author
              </Typography>

              <Typography variant="h5">
                {analytics.favorite_author}
              </Typography>

            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={6}>
          <Card>
            <CardContent>

              <Typography
                variant="h6"
                gutterBottom
              >
                Likes vs Dislikes
              </Typography>

              <Doughnut data={reactionChart} />

            </CardContent>
          </Card>
        </Grid>

      </Grid>

    </Container>
  );
}

export default Analytics;