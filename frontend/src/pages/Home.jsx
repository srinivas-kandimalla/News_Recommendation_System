import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Grid,
  Container,
  Typography,
  Skeleton,
  Card,
  CardMedia,
  CardContent,
  Button,
  Chip,
  Stack,
  Box,
  Alert,
} from "@mui/material";
import SearchOffIcon from "@mui/icons-material/SearchOff";
import WhatshotIcon from "@mui/icons-material/Whatshot";

import { getAllNews, searchNews, getTrendingNews } from "../services/newsService";
import NewsCard from "../components/NewsCard";
import SearchBar from "../components/SearchBar";

const CATEGORIES = [
  "All",
  "Technology",
  "Business",
  "World",
  "Science",
  "Entertainment",
  "Health",
  "Sports",
];

function Home() {
  const navigate = useNavigate();
  const [news, setNews] = useState([]);
  const [trendingNews, setTrendingNews] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadHomeData();
  }, []);

  const loadHomeData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [allNewsRes, trendingRes] = await Promise.all([
        getAllNews(),
        getTrendingNews().catch(() => ({ success: false, trending_news: [] })),
      ]);

      if (allNewsRes.success) {
        setNews(allNewsRes.news || []);
      } else {
        setError(allNewsRes.message || "Failed to load news.");
      }

      if (trendingRes.success) {
        setTrendingNews(trendingRes.trending_news || []);
      }
    } catch (err) {
      console.error(err);
      setError("Unable to connect to news service. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (value) => {
    setSearch(value);

    try {
      if (value.trim() === "") {
        loadHomeData();
        return;
      }

      setLoading(true);
      setError(null);
      const data = await searchNews(value);

      if (data.success) {
        setNews(data.news || []);
      } else {
        setError(data.message || "Search failed.");
      }
    } catch (err) {
      console.error(err);
      setError("Search request failed.");
    } finally {
      setLoading(false);
    }
  };

  // Filter news by selected category
  const filteredNews = news.filter((item) => {
    if (selectedCategory === "All") return true;
    return item.category?.toLowerCase() === selectedCategory.toLowerCase();
  });

  // Featured Article: Selected as most recent article in news array
  const featuredArticle = news.length > 0 ? news[0] : null;

  return (
    <Container maxWidth="lg" sx={{ mt: 3, mb: 6 }}>
      {/* 1. Compact Header Section (Brand + Tagline + Search + Category Chips) */}
      <Box sx={{ mb: 3 }}>
        <Stack direction="row" alignItems="baseline" spacing={1.5} sx={{ mb: 0.5 }}>
          <Typography variant="h3" component="h1" fontWeight="800" sx={{ letterSpacing: "-0.5px" }}>
            NovaNews
          </Typography>
          <Typography variant="h6" color="secondary.main" fontWeight="600" sx={{ fontStyle: "italic" }}>
            News That Knows You.
          </Typography>
        </Stack>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Personalized news platform delivering real-time articles curated to your interests.
        </Typography>

        <SearchBar value={search} onChange={handleSearch} />

        {/* Category Chips */}
        <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ gap: 0.75, mt: 2 }}>
          {CATEGORIES.map((category) => (
            <Chip
              key={category}
              label={category}
              clickable
              color={selectedCategory === category ? "primary" : "default"}
              variant={selectedCategory === category ? "filled" : "outlined"}
              onClick={() => setSelectedCategory(category)}
              size="small"
            />
          ))}
        </Stack>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* 2. Latest News Section (Primary Grid - Immediately Visible Below Header) */}
      <Box sx={{ mb: 5 }}>
        <Typography variant="h5" fontWeight="bold" sx={{ mb: 2 }}>
          {selectedCategory === "All" ? "Latest News" : `${selectedCategory} News`}
        </Typography>

        <Grid container spacing={2.5}>
          {loading
            ? Array.from(new Array(6)).map((_, index) => (
                <Grid xs={12} sm={6} md={4} key={index}>
                  <Card sx={{ height: "100%" }}>
                    <Skeleton variant="rectangular" height={180} />
                    <CardContent sx={{ p: 2 }}>
                      <Skeleton variant="text" width="50%" height={20} sx={{ mb: 1 }} />
                      <Skeleton variant="text" width="90%" height={28} />
                      <Skeleton variant="text" width="40%" height={18} sx={{ mb: 2 }} />
                      <Skeleton variant="rectangular" height={36} />
                    </CardContent>
                  </Card>
                </Grid>
              ))
            : filteredNews.map((item) => (
                <Grid xs={12} sm={6} md={4} key={item._id}>
                  <NewsCard news={item} />
                </Grid>
              ))}
        </Grid>

        {!loading && !error && filteredNews.length === 0 && (
          <Box
            sx={{
              textAlign: "center",
              py: 6,
              px: 2,
              backgroundColor: "background.paper",
              borderRadius: 2,
              border: "1px solid",
              borderColor: "divider",
              mt: 2,
            }}
          >
            <SearchOffIcon sx={{ fontSize: 50, color: "text.secondary", mb: 1 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No Articles Found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {search
                ? `No news matching "${search}". Try searching for another topic.`
                : `No articles available in category "${selectedCategory}".`}
            </Typography>
          </Box>
        )}
      </Box>

      {/* 3. Featured Story Section (Secondary Section Below Latest News) */}
      {!loading && !error && featuredArticle && (
        <Box
          sx={{
            mb: 5,
            p: 3,
            backgroundColor: "background.paper",
            borderRadius: 3,
            border: "1px solid",
            borderColor: "divider",
          }}
        >
          <Typography
            variant="overline"
            color="secondary"
            fontWeight="bold"
            sx={{ letterSpacing: 1.2, display: "block", mb: 1 }}
          >
            ★ FEATURED STORY
          </Typography>

          <Grid container spacing={3} alignItems="center">
            {featuredArticle.image_url && (
              <Grid xs={12} md={5}>
                <CardMedia
                  component="img"
                  height="220"
                  image={featuredArticle.image_url}
                  alt={featuredArticle.title}
                  sx={{ borderRadius: 2, objectFit: "cover" }}
                />
              </Grid>
            )}
            <Grid xs={12} md={featuredArticle.image_url ? 7 : 12}>
              <Chip
                label={featuredArticle.category || "General"}
                variant="outlined"
                color="primary"
                size="small"
                sx={{ mb: 1 }}
              />
              <Typography variant="h5" component="h3" fontWeight="bold" gutterBottom>
                {featuredArticle.title}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                By {featuredArticle.author?.trim() || "Unknown"}
                {featuredArticle.created_at
                  ? ` • ${new Date(featuredArticle.created_at).toLocaleDateString()}`
                  : ""}
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  mb: 2.5,
                  display: "-webkit-box",
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}
              >
                {featuredArticle.content}
              </Typography>
              <Button
                variant="contained"
                color="primary"
                onClick={() => navigate(`/news/${featuredArticle._id}`)}
              >
                Read Featured Story
              </Button>
            </Grid>
          </Grid>
        </Box>
      )}

      {/* 4. Trending Section (Compact Preview at Bottom) */}
      {!loading && !error && trendingNews.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            sx={{ mb: 2 }}
          >
            <Stack direction="row" alignItems="center" spacing={1}>
              <WhatshotIcon color="secondary" />
              <Typography variant="h5" fontWeight="bold">
                Trending Right Now
              </Typography>
            </Stack>
            <Button
              color="secondary"
              fontWeight="bold"
              onClick={() => navigate("/trending")}
            >
              View All Trending →
            </Button>
          </Stack>

          <Grid container spacing={2.5}>
            {trendingNews.slice(0, 3).map((item) => (
              <Grid xs={12} sm={6} md={4} key={item._id}>
                <NewsCard news={item} showTrendingMetrics />
              </Grid>
            ))}
          </Grid>
        </Box>
      )}
    </Container>
  );
}

export default Home;