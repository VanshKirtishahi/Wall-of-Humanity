import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 60000,
  maxContentLength: Infinity,
  maxBodyLength: Infinity
});

// Add request interceptor for auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).token : null;
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
  (response) => response,
  (error) => {
    if (error.code === 'ERR_NETWORK') {
      console.error('Network Error:', error);
      return Promise.reject(new Error('Network error - please check your connection'));
    }
    if (error.response?.status === 400) {
      console.error('Bad Request:', error.response.data);
      return Promise.reject(new Error(error.response.data.message || 'Invalid request'));
    }
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