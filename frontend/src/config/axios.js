import axios from 'axios';

const isProduction = import.meta.env.PROD;
const baseURL = isProduction 
  ? 'https://wall-of-humanity-xhoc.onrender.com'
  : 'http://localhost:5000';

const api = axios.create({
  baseURL,
  withCredentials: true
});

// Add request interceptor for auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Add /api prefix to all requests
    if (!config.url?.startsWith('/api')) {
      config.url = `/api${config.url}`;
    }
    
    // Don't override Content-Type for FormData
    if (!config.headers['Content-Type'] && !(config.data instanceof FormData)) {
      config.headers['Content-Type'] = 'application/json';
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor to handle errors
api.interceptors.response.use(
  response => response,
  error => {
    console.error('API Error:', error);
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api; 