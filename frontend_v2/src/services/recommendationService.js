import api from './api';

export const getPersonalizedRecommendations = () => api.get('/personalized-recommendations').then(({ data }) => data);
export const getRecommendationsForNews = (newsId) => api.get(`/recommendations/${newsId}`).then(({ data }) => data);
