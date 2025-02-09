import api from './api';
import EmailService from './email.service';

const emailService = new EmailService();

const register = async (userData) => {
  try {
    const response = await api.post('/api/auth/register', {
      name: userData.name,
      email: userData.email.toLowerCase().trim(),
      password: userData.password
    });

    if (response.data.token && response.data.user) {
      const userData = {
        ...response.data.user,
        token: response.data.token
      };
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(userData));
      return userData;
    }
    throw new Error('Invalid response from server');
  } catch (error) {
    console.error('Registration error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Registration failed');
  }
};

const login = async (credentials) => {
  try {
    const response = await api.post('/api/auth/login', {
      email: credentials.email.toLowerCase().trim(),
      password: credentials.password
    });

    if (response.data.token && response.data.user) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      return response.data.user;
    }
    throw new Error('Invalid response from server');
  } catch (error) {
    console.error('Login error:', error.response?.data || error);
    throw new Error(error.response?.data?.message || 'Login failed');
  }
};

const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

const getCurrentUser = () => {
  return JSON.parse(localStorage.getItem('user'));
};

const adminLogin = async (credentials) => {
  try {
    const response = await api.post('/api/auth/admin/login', credentials);
    if (response.data.token) {
      localStorage.setItem('adminToken', response.data.token);
    }
    return response.data;
  } catch (error) {
    console.error('Admin login error:', error);
    throw error.response?.data || { message: 'Login failed' };
  }
};

const verifyAdminToken = async () => {
  try {
    const token = localStorage.getItem('adminToken');
    if (!token) throw new Error('No token found');

    const response = await api.get('/api/auth/admin/verify', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    localStorage.removeItem('adminToken');
    throw error.response?.data || { message: 'Verification failed' };
  }
};

const authService = {
  register,
  login,
  logout,
  getCurrentUser,
  adminLogin,
  verifyAdminToken
};

export default authService; 