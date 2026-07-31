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

import { Pie } from "react-chartjs-2";

import { getAdminDashboard } from "../services/newsService";

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend
);

function AdminDashboard() {

  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {

    try {

      const data = await getAdminDashboard();

      if (data.success) {
        setDashboard(data.dashboard);
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

  if (!dashboard) {
    return (
      <Container sx={{ mt: 6 }}>
        <Typography>No dashboard data available.</Typography>
      </Container>
    );
  }

  const reactionData = {
    labels: ["Likes", "Dislikes"],
    datasets: [
      {
        data: [
          dashboard.total_likes,
          dashboard.total_dislikes,
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
        👨‍💼 Admin Dashboard
      </Typography>

      <Grid container spacing={3}>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography>Total Users</Typography>
              <Typography variant="h4">
                {dashboard.total_users}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography>Total News</Typography>
              <Typography variant="h4">
                {dashboard.total_news}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography>Total Reads</Typography>
              <Typography variant="h4">
                {dashboard.total_reads}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography>Bookmarks</Typography>
              <Typography variant="h4">
                {dashboard.total_bookmarks}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>

              <Typography
                variant="h6"
                gutterBottom
              >
                👍 Likes vs 👎 Dislikes
              </Typography>

              <Pie data={reactionData} />

            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>

              <Typography
                variant="h6"
                gutterBottom
              >
                Most Popular Category
              </Typography>

              <Typography
                variant="h3"
                color="primary"
              >
                {dashboard.most_popular_category}
              </Typography>

            </CardContent>
          </Card>
        </Grid>

      </Grid>

    </Container>
  );
}

export default AdminDashboard;