import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
  Container,
  Card,
  CardMedia,
  CardContent,
  Typography,
  CircularProgress,
  Button,
  Stack,
  Snackbar,
  Alert,
} from "@mui/material";

import BookmarkIcon from "@mui/icons-material/Bookmark";
import ThumbUpIcon from "@mui/icons-material/ThumbUp";
import ThumbDownIcon from "@mui/icons-material/ThumbDown";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

import {
  getNewsById,
  bookmarkNews,
  likeNews,
  dislikeNews,
  recordReadingHistory,
} from "../services/newsService";

import { useAuth } from "../context/AuthContext";

function NewsDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { token, isAuthenticated } = useAuth();

  const [news, setNews] = useState(null);
  const [loading, setLoading] = useState(true);

  const [snackbar, setSnackbar] = useState({
    open: false,
    severity: "success",
    message: "",
  });

  useEffect(() => {
    fetchNews();
  }, [id]);

  useEffect(() => {
    if (news && isAuthenticated && token) {
      recordReadingHistory(news._id, token).catch((err) => {
        console.warn(
          "Failed to record reading history:",
          err?.response?.data?.message || err.message
        );
      });
    }
  }, [news, isAuthenticated, token]);

  const fetchNews = async () => {
    try {
      const data = await getNewsById(id);

      if (data.success) {
        setNews(data.news);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (message, severity = "success") => {
    setSnackbar({
      open: true,
      message,
      severity,
    });
  };

  const handleBookmark = async () => {
    if (!isAuthenticated) {
      showMessage("Please login first.", "warning");
      return;
    }

    try {
      const data = await bookmarkNews(news._id, token);
      showMessage(data.message);
    } catch (error) {
      showMessage(
        error.response?.data?.message ||
          "Failed to bookmark news.",
        "error"
      );
    }
  };

  const handleLike = async () => {
    if (!isAuthenticated) {
      showMessage("Please login first.", "warning");
      return;
    }

    try {
      const data = await likeNews(news._id, token);
      showMessage(data.message);
    } catch (error) {
      showMessage(
        error.response?.data?.message ||
          "Failed to like news.",
        "error"
      );
    }
  };

  const handleDislike = async () => {
    if (!isAuthenticated) {
      showMessage("Please login first.", "warning");
      return;
    }

    try {
      const data = await dislikeNews(news._id, token);
      showMessage(data.message);
    } catch (error) {
      showMessage(
        error.response?.data?.message ||
          "Failed to dislike news.",
        "error"
      );
    }
  };

  if (loading) {
    return (
      <Container sx={{ mt: 5, textAlign: "center" }}>
        <CircularProgress />
      </Container>
    );
  }

  if (!news) {
    return (
      <Container sx={{ mt: 5 }}>
        <Typography variant="h5">
          News not found.
        </Typography>
      </Container>
    );
  }

  return (
    <>
      <Container maxWidth="md" sx={{ mt: 5, mb: 5 }}>
        <Card elevation={4}>
          {news.image_url && (
            <CardMedia
              component="img"
              height="400"
              image={news.image_url}
              alt={news.title}
            />
          )}

          <CardContent>
            <Typography
              variant="h4"
              fontWeight="bold"
              gutterBottom
            >
              {news.title}
            </Typography>

            <Typography color="primary" gutterBottom>
              {news.category}
            </Typography>

            <Typography color="text.secondary">
              <strong>Author:</strong>{" "}
              {news.author || "Unknown"}
            </Typography>

            <Typography color="text.secondary">
              <strong>Source:</strong>{" "}
              {news.source || "Unknown"}
            </Typography>

            <Typography
              color="text.secondary"
              gutterBottom
            >
              <strong>Published:</strong>{" "}
              {news.created_at
                ? new Date(news.created_at).toLocaleString()
                : "N/A"}
            </Typography>

            <Typography
              variant="body1"
              sx={{
                mt: 3,
                lineHeight: 2,
              }}
            >
              {news.content}
            </Typography>

            <Stack
              direction="row"
              spacing={2}
              flexWrap="wrap"
              sx={{ mt: 4 }}
            >
              <Button
                variant="contained"
                startIcon={<ArrowBackIcon />}
                onClick={() => navigate(-1)}
              >
                Back
              </Button>

              <Button
                variant="outlined"
                startIcon={<BookmarkIcon />}
                onClick={handleBookmark}
              >
                Bookmark
              </Button>

              <Button
                color="success"
                variant="contained"
                startIcon={<ThumbUpIcon />}
                onClick={handleLike}
              >
                Like
              </Button>

              <Button
                color="error"
                variant="contained"
                startIcon={<ThumbDownIcon />}
                onClick={handleDislike}
              >
                Dislike
              </Button>
            </Stack>
          </CardContent>
        </Card>
      </Container>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() =>
          setSnackbar({
            ...snackbar,
            open: false,
          })
        }
      >
        <Alert
          severity={snackbar.severity}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
}

export default NewsDetails;