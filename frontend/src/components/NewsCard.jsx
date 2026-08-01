import {
  Card,
  CardMedia,
  CardContent,
  Typography,
  CardActions,
  Button,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { bookmarkNews } from "../services/newsService";
import { useAuth } from "../context/AuthContext";

function NewsCard({ news }) {
  const navigate = useNavigate();
  const { token } = useAuth();

  const handleBookmark = async () => {
    if (!token) {
      alert("Please login first.");
      return;
    }

    try {
      const data = await bookmarkNews(news._id, token);

      alert(data.message);
    } catch (error) {
      console.error(error);

      if (error.response?.data?.message) {
        alert(error.response.data.message);
      } else {
        alert("Failed to bookmark news.");
      }
    }
  };

  return (
    <Card
      sx={{
        maxWidth: 360,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        transition: "0.3s",
        "&:hover": {
          transform: "translateY(-5px)",
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

        <Typography
          variant="body2"
          color="primary"
          sx={{ mb: 1 }}
        >
          {news.category}
        </Typography>

        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mb: 2 }}
        >
          By {news.author?.trim() || "Unknown"}
        </Typography>

        <Typography variant="body2">
          {news.content?.length > 120
            ? `${news.content.substring(0, 120)}...`
            : news.content}
        </Typography>
      </CardContent>

      <CardActions
        sx={{
          justifyContent: "space-between",
          px: 2,
          pb: 2,
        }}
      >
        <Button
          variant="contained"
          onClick={() => navigate(`/news/${news._id}`)}
        >
          Read More
        </Button>

        <Button
          variant="outlined"
          onClick={handleBookmark}
        >
          Bookmark
        </Button>
      </CardActions>
    </Card>
  );
}

export default NewsCard;