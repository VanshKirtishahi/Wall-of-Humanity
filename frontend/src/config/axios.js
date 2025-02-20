import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL.replace(/\/api$/, ''),
  timeout: 60000,
  maxBodyLength: Infinity,
  maxContentLength: Infinity
});

// Add request interceptor for auth token
api.interceptors.request.use(
  (config) => {
    // Remove duplicate /api prefix if present
    config.url = config.url.replace(/^\/api\/api/, '/api');
    
    const token = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).token : null;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
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
    console.error('API Error:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      data: error.response?.data
    });

    if (error.code === 'ERR_NETWORK') {
      console.error('Network Error:', error);
      return Promise.reject(new Error('Network error - please check your connection'));
    }
    if (error.response?.status === 400) {
      console.error('Bad Request:', error.response.data);
      return Promise.reject(new Error(error.response.data.message || 'Invalid request'));
    }
    if (error.response?.status === 401) {
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      window.location.href = '/login';
      return Promise.reject(new Error('Authentication required'));
    }
    return Promise.reject(error);
  }
);

export default api; 