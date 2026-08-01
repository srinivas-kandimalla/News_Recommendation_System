import { useState } from "react";
import {
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Typography,
  Button,
  Chip,
  Stack,
  Snackbar,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  LinearProgress,
  Box,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import SmartToyIcon from "@mui/icons-material/SmartToy";
import WhatshotIcon from "@mui/icons-material/Whatshot";
import VisibilityIcon from "@mui/icons-material/Visibility";
import ThumbUpIcon from "@mui/icons-material/ThumbUp";
import ThumbDownIcon from "@mui/icons-material/ThumbDown";
import BookmarkIcon from "@mui/icons-material/Bookmark";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import PsychologyIcon from "@mui/icons-material/Psychology";

import { bookmarkNews } from "../services/newsService";
import { useAuth } from "../context/AuthContext";

function NewsCard({
  news,
  showScore = false,
  showTrendingMetrics = false,
  showExplanation = false,
  onRemove = null,
}) {
  const navigate = useNavigate();
  const { token } = useAuth();

  const [toast, setToast] = useState({
    open: false,
    severity: "success",
    message: "",
  });

  const showToast = (message, severity = "success") => {
    setToast({ open: true, message, severity });
  };

  const handleBookmark = async () => {
    if (!token) {
      showToast("Please login first to bookmark articles.", "warning");
      return;
    }

    try {
      const data = await bookmarkNews(news._id, token);
      showToast(data.message || "Bookmark added!", "success");
    } catch (error) {
      console.error(error);
      showToast(
        error.response?.data?.message || "Failed to bookmark news.",
        "error"
      );
    }
  };

  return (
    <>
      <Card
        sx={{
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
            height="180"
            image={news.image_url}
            alt={news.title}
          />
        )}

        <CardContent sx={{ flexGrow: 1, display: "flex", flexDirection: "column" }}>
          {/* Header Row: Category & Badges */}
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            sx={{ mb: 1.5 }}
          >
            <Chip
              label={news.category || "General"}
              color="primary"
              size="small"
              variant="outlined"
            />

            {showScore && news.hybrid_score !== undefined && (
              <Chip
                icon={<SmartToyIcon fontSize="small" />}
                label={`AI Match: ${(news.hybrid_score * 100).toFixed(0)}%`}
                color="success"
                size="small"
                variant="outlined"
              />
            )}

            {showTrendingMetrics && news.trending_score !== undefined && (
              <Chip
                icon={<WhatshotIcon />}
                label={`Score: ${news.trending_score}`}
                color="secondary"
                size="small"
                variant="outlined"
              />
            )}
          </Stack>

          {/* Article Title (Max 2 lines) */}
          <Typography
            variant="h6"
            gutterBottom
            sx={{
              fontWeight: "bold",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              lineHeight: 1.3,
              minHeight: "2.6em",
            }}
          >
            {news.title}
          </Typography>

          {/* Author & Date */}
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
            By {news.author?.trim() || "Unknown"}
            {news.created_at
              ? ` • ${new Date(news.created_at).toLocaleDateString()}`
              : ""}
          </Typography>

          {/* Content Summary (Max 3 lines) */}
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              display: "-webkit-box",
              WebkitLineClamp: 3,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              mb: 2,
            }}
          >
            {news.content}
          </Typography>

          {/* Engagement metrics chips for Trending */}
          {showTrendingMetrics && (
            <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ gap: 1, mt: "auto", pt: 1 }}>
              <Chip
                icon={<VisibilityIcon fontSize="small" />}
                label={`${news.reads || 0} Reads`}
                size="small"
                variant="outlined"
              />
              <Chip
                icon={<BookmarkIcon fontSize="small" />}
                label={`${news.bookmarks || 0} Bookmarks`}
                size="small"
                color="primary"
                variant="outlined"
              />
              <Chip
                icon={<ThumbUpIcon fontSize="small" />}
                label={`${news.likes || 0} Likes`}
                size="small"
                color="success"
                variant="outlined"
              />
              <Chip
                icon={<ThumbDownIcon fontSize="small" />}
                label={`${news.dislikes || 0} Dislikes`}
                size="small"
                color="error"
                variant="outlined"
              />
            </Stack>
          )}

          {/* Explainable AI Collapsible Section */}
          {showExplanation && (
            <Accordion
              elevation={0}
              sx={{
                mt: "auto",
                border: "1px solid",
                borderColor: "divider",
                borderRadius: "8px !important",
                "&:before": { display: "none" },
              }}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon fontSize="small" />}
                sx={{ minHeight: 36, py: 0, px: 1.5 }}
              >
                <Stack direction="row" alignItems="center" spacing={1}>
                  <PsychologyIcon color="primary" fontSize="small" />
                  <Typography variant="body2" fontWeight="bold" color="primary">
                    Why Recommended?
                  </Typography>
                </Stack>
              </AccordionSummary>

              <AccordionDetails sx={{ pt: 0, pb: 1.5, px: 1.5 }}>
                <Stack spacing={1}>
                  {news.semantic_score !== undefined && (
                    <Box>
                      <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                        <Typography variant="caption" color="text.secondary">
                          Semantic Similarity
                        </Typography>
                        <Typography variant="caption" fontWeight="bold">
                          {(news.semantic_score * 100).toFixed(0)}%
                        </Typography>
                      </Stack>
                      <LinearProgress
                        variant="determinate"
                        value={Math.min(news.semantic_score * 100, 100)}
                        color="info"
                        sx={{ height: 6, borderRadius: 3 }}
                      />
                    </Box>
                  )}

                  {news.interest_score !== undefined && (
                    <Box>
                      <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                        <Typography variant="caption" color="text.secondary">
                          User Interest Match
                        </Typography>
                        <Typography variant="caption" fontWeight="bold">
                          {(news.interest_score * 100).toFixed(0)}%
                        </Typography>
                      </Stack>
                      <LinearProgress
                        variant="determinate"
                        value={Math.min(news.interest_score * 100, 100)}
                        color="secondary"
                        sx={{ height: 6, borderRadius: 3 }}
                      />
                    </Box>
                  )}

                  {news.recency_score !== undefined && (
                    <Box>
                      <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                        <Typography variant="caption" color="text.secondary">
                          Recency Factor
                        </Typography>
                        <Typography variant="caption" fontWeight="bold">
                          {(news.recency_score * 100).toFixed(0)}%
                        </Typography>
                      </Stack>
                      <LinearProgress
                        variant="determinate"
                        value={Math.min(news.recency_score * 100, 100)}
                        color="warning"
                        sx={{ height: 6, borderRadius: 3 }}
                      />
                    </Box>
                  )}

                  {news.popularity_score !== undefined && (
                    <Box>
                      <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                        <Typography variant="caption" color="text.secondary">
                          Popularity Score
                        </Typography>
                        <Typography variant="caption" fontWeight="bold">
                          {(news.popularity_score * 100).toFixed(0)}%
                        </Typography>
                      </Stack>
                      <LinearProgress
                        variant="determinate"
                        value={Math.min(news.popularity_score * 100, 100)}
                        color="success"
                        sx={{ height: 6, borderRadius: 3 }}
                      />
                    </Box>
                  )}
                </Stack>
              </AccordionDetails>
            </Accordion>
          )}
        </CardContent>

        <CardActions
          sx={{
            justifyContent: "space-between",
            px: 2,
            pb: 2,
            pt: 0,
            mt: "auto",
          }}
        >
          <Button
            variant="contained"
            onClick={() => navigate(`/news/${news._id}`)}
          >
            Read More
          </Button>

          {onRemove ? (
            <Button
              color="error"
              variant="outlined"
              onClick={() => onRemove(news._id)}
            >
              Remove
            </Button>
          ) : (
            <Button variant="outlined" onClick={handleBookmark}>
              Bookmark
            </Button>
          )}
        </CardActions>
      </Card>

      <Snackbar
        open={toast.open}
        autoHideDuration={3000}
        onClose={() => setToast({ ...toast, open: false })}
      >
        <Alert severity={toast.severity} variant="filled">
          {toast.message}
        </Alert>
      </Snackbar>
    </>
  );
}

export default NewsCard;