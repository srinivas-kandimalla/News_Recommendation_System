import api from "./api";

// ======================================================
// Helper Function
// ======================================================

const authHeader = (token) => ({
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

// ======================================================
// Public News APIs
// ======================================================

// Get all news with category filter
export const getAllNews = async (page = 1, limit = 10, category = '') => {
  const catParam = category && category.toLowerCase() !== 'all' ? `&category=${encodeURIComponent(category)}` : '';
  const { data } = await api.get(`/news?page=${page}&limit=${limit}${catParam}`);
  return data;
};

// Get single news
export const getNewsById = async (id) => {
  const { data } = await api.get(`/news/${id}`);
  return data;
};

// Search news
export const searchNews = async (query) => {
  const { data } = await api.get(`/news/search?q=${query}`);
  return data;
};

// Trending news
export const getTrendingNews = async () => {
  const { data } = await api.get("/trending");
  return data;
};

// ======================================================
// AI Recommendations
// ======================================================

// Similar News Recommendation
export const getRecommendations = async (newsId) => {
  const { data } = await api.get(`/recommendations/${newsId}`);
  return data;
};

// Personalized Recommendation
export const getPersonalizedRecommendations = async (token) => {
  const { data } = await api.get(
    "/personalized-recommendations",
    authHeader(token)
  );

  return data;
};

// ======================================================
// Bookmarks
// ======================================================

// Add Bookmark
export const bookmarkNews = async (newsId, token) => {
  const { data } = await api.post(
    `/bookmark/${newsId}`,
    {},
    authHeader(token)
  );

  return data;
};

// Get Bookmarks
export const getBookmarks = async (token) => {
  const { data } = await api.get(
    "/bookmarks",
    authHeader(token)
  );

  return data;
};

// Remove Bookmark
export const removeBookmark = async (newsId, token) => {
  const { data } = await api.delete(
    `/bookmark/${newsId}`,
    authHeader(token)
  );

  return data;
};

// ======================================================
// Reactions
// ======================================================

// Like News
export const likeNews = async (newsId, token) => {
  const { data } = await api.post(
    `/like/${newsId}`,
    {},
    authHeader(token)
  );

  return data;
};

// Dislike News
export const dislikeNews = async (newsId, token) => {
  const { data } = await api.post(
    `/dislike/${newsId}`,
    {},
    authHeader(token)
  );

  return data;
};

// ======================================================
// Analytics
// ======================================================

export const getAnalytics = async (token) => {
  const { data } = await api.get(
    "/analytics",
    authHeader(token)
  );

  return data;
};

// ======================================================
// Admin Dashboard
// ======================================================

export const getAdminDashboard = async () => {
  const { data } = await api.get("/admin/dashboard");
  return data;
};

// ======================================================
// Reading History
// ======================================================

export const recordReadingHistory = async (newsId, token) => {
  const { data } = await api.post(
    `/reading-history/${newsId}`,
    {},
    authHeader(token)
  );

  return data;
};