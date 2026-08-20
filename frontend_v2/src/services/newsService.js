import api from './api';

export const getNews = (page = 1, limit = 9) => api.get('/news', { params: { page, limit } }).then(({ data }) => data);
export const getNewsById = (newsId) => api.get(`/news/${newsId}`).then(({ data }) => data);
export const searchNews = (query) => api.get('/news/search', { params: { q: query } }).then(({ data }) => ({
  ...data,
  news: data.results || data.news || [],
}));
export const getTrendingNews = () => api.get('/trending').then(({ data }) => data);
export const getSimilarNews = (newsId) => api.get(`/recommendations/${newsId}`).then(({ data }) => data);
export const fetchNews = () => api.post('/news/fetch').then(({ data }) => data);
export const createNews = (payload) => api.post('/news', payload).then(({ data }) => data);
export const updateNews = (newsId, payload) => api.put(`/news/${newsId}`, payload).then(({ data }) => data);
export const deleteNews = (newsId) => api.delete(`/news/${newsId}`).then(({ data }) => data);


