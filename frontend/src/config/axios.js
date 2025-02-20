import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL.replace(/\/api\/?$/, ''), // Remove trailing /api if present
  timeout: 30000, // 30 seconds timeout
  maxBodyLength: Infinity,
  maxContentLength: Infinity,
  withCredentials: true,
  headers: {
    'Accept': 'application/json'
  }
});

// Add request interceptor for auth token
api.interceptors.request.use(
  (config) => {
    // Clean up the URL to prevent double slashes
    let url = config.url || '';
    url = url.replace(/^\/+/, '').replace(/\/+/g, '/');
    
    // Ensure proper /api prefix
    if (!url.startsWith('api/')) {
      url = `api/${url}`;
    }
    
    config.url = url;
    
    const token = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).token : null;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Handle FormData content type
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type']; // Let browser set this
    } else if (!config.headers['Content-Type']) {
      config.headers['Content-Type'] = 'application/json';
    }
    
    console.log('Final request URL:', config.url); // Debug log
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
      data: error.response?.data,
      message: error.response?.data?.message
    });

    if (error.code === 'ERR_NETWORK') {
      return Promise.reject(new Error('Network error - please check your connection'));
    }

    if (error.response?.status === 400) {
      const message = error.response.data?.message || 'Invalid request data';
      return Promise.reject(new Error(message));
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