import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const client = axios.create({
  baseURL: `${baseURL}/api`,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// Attach JWT token
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('esomero_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 responses
client.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('esomero_token');
      localStorage.removeItem('esomero_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default client;
