import axios from 'axios';

export const API_BASE_URL: string = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';
export const SERVER_URL: string = import.meta.env.VITE_SERVER_URL || API_BASE_URL.replace(/\/api\/v1\/?$/, '');
export const ML_URL: string = import.meta.env.VITE_ML_URL || 'http://localhost:8000/ml';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('buyerdna_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('buyerdna_token');
      localStorage.removeItem('buyerdna_user');
      if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);
