import { useEffect, useState } from "react";
import { Grid, Container, Typography } from "@mui/material";

import { getAllNews, searchNews } from "../services/newsService";

import NewsCard from "../components/NewsCard";
import SearchBar from "../components/SearchBar";

function Home() {
  const [news, setNews] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadNews();
  }, []);

  const loadNews = async () => {
    try {
      const data = await getAllNews();

      if (data.success) {
        setNews(data.news);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleSearch = async (value) => {
    setSearch(value);

    try {
      if (value.trim() === "") {
        loadNews();
        return;
      }

      const data = await searchNews(value);

      if (data.success) {
        setNews(data.news);
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <Container sx={{ mt: 5 }}>
      <Typography
        variant="h4"
        gutterBottom
        fontWeight="bold"
      >
        Latest News
      </Typography>

      <SearchBar
        value={search}
        onChange={handleSearch}
      />

      <Grid container spacing={3}>
        {news.map((item) => (
          <Grid
            item
            xs={12}
            sm={6}
            md={4}
            key={item._id}
          >
            <NewsCard news={item} />
          </Grid>
        ))}
      </Grid>
    </Container>
  );
}

export default Home;