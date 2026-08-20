import api from './api';

export const registerUser = (payload) => api.post('/register', payload).then(({ data }) => data);
export const loginUser = (payload) => api.post('/login', payload).then(({ data }) => data);
export const getProfile = () => api.get('/profile').then(({ data }) => data);
