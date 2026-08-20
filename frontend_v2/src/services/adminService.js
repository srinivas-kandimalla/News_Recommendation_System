import api from './api';

export const getAdminDashboard = () => api.get('/admin/dashboard').then(({ data }) => data);
export const fetchLatestNews = () => api.post('/news/fetch').then(({ data }) => data);
