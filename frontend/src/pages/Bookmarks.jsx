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
  Box,
} from "@mui/material";

import {
  getBookmarks,
  removeBookmark,
} from "../services/newsService";

import { useAuth } from "../context/AuthContext";

function Bookmarks() {
  const navigate = useNavigate();
  const { token } = useAuth();

  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBookmarks();
  }, []);

  const loadBookmarks = async () => {
    try {
      const data = await getBookmarks(token);

      if (data.success) {
        setBookmarks(data.bookmarks);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (id) => {
    const confirmDelete = window.confirm(
      "Remove this bookmark?"
    );

    if (!confirmDelete) return;

    try {
      const data = await removeBookmark(id, token);

      if (data.success) {
        setBookmarks((prev) =>
          prev.filter((news) => news._id !== id)
        );
      }
    } catch (error) {
      console.error(error);
      alert("Failed to remove bookmark.");
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
      <Typography
        variant="h4"
        fontWeight="bold"
        gutterBottom
      >
        📚 My Bookmarks
      </Typography>

      {bookmarks.length === 0 ? (
        <Box
          sx={{
            mt: 8,
            textAlign: "center",
          }}
        >
          <Typography variant="h6">
            No bookmarks yet.
          </Typography>

          <Typography color="text.secondary" sx={{ mt: 1 }}>
            Bookmark articles to read them later.
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
          {bookmarks.map((news) => (
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
                  <Typography
                    variant="h6"
                    gutterBottom
                  >
                    {news.title}
                  </Typography>

                  <Typography
                    variant="body2"
                    color="primary"
                  >
                    {news.category}
                  </Typography>

                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mt: 1 }}
                  >
                    {news.author || "Unknown Author"}
                  </Typography>

                  <Typography
                    variant="body2"
                    color="text.secondary"
                  >
                    {news.created_at
                      ? new Date(news.created_at).toLocaleDateString()
                      : ""}
                  </Typography>

                  <Typography
                    sx={{
                      mt: 2,
                      display: "-webkit-box",
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {news.content}
                  </Typography>
                </CardContent>

                <CardActions>
                  <Button
                    variant="contained"
                    onClick={() =>
                      navigate(`/news/${news._id}`)
                    }
                  >
                    Read More
                  </Button>

                  <Button
                    color="error"
                    onClick={() =>
                      handleRemove(news._id)
                    }
                  >
                    Remove
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

export default Bookmarks;