import api from './api';

export const likeNews = (newsId) => api.post(`/news/${newsId}/like`).then(({ data }) => data);
export const dislikeNews = (newsId) => api.post(`/news/${newsId}/dislike`).then(({ data }) => data);
export const getReactions = (newsId) => api.get(`/news/${newsId}/reactions`).then(({ data }) => data);
export const recordReadingHistory = (newsId) => api.post(`/reading-history/${newsId}`).then(({ data }) => data);
