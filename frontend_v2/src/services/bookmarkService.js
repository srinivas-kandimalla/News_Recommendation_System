import api from './api';

export const getBookmarks = () => api.get('/bookmarks').then(({ data }) => data);
export const addBookmark = (newsId) => api.post(`/bookmark/${newsId}`).then(({ data }) => data);
export const removeBookmark = (newsId) => api.delete(`/bookmark/${newsId}`).then(({ data }) => data);
