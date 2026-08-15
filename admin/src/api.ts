import axios from 'axios';

const API_URL = 'http://localhost:3001/api';

export const api = axios.create({ baseURL: API_URL });

// Автоматически добавляем токен в заголовки
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Автоматически разлогиниваем при 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('admin_token');
      window.location.reload();
    }
    return Promise.reject(error);
  }
);