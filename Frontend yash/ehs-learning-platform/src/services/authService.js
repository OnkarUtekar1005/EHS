// src/services/authService.js
import axios from 'axios';

// Create base API instance
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8080/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor for adding auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear auth data on 401 Unauthorized
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Only redirect if we're not on login page
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Authentication service with all auth-related functions
const authService = {
  // Login function that returns token and stores it
  login: async (credentials) => {
    try {
      const response = await api.post('/auth/login', credentials);
      if (response.data && response.data.token) {
        // Store token WITHOUT Bearer prefix
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data));
      }
      return response;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },

  // Logout function
  logout: async () => {
    try {
      // Try to call the logout endpoint if token exists
      if (localStorage.getItem('token')) {
        await api.post('/auth/logout');
      }
    } catch (error) {
      console.error('Logout API error (continuing with local logout):', error);
    } finally {
      // Always clear localStorage
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  },

  // Get current user from API (verifies token on backend)
  getCurrentUser: async () => {
    return api.get('/auth/user');
  },

  // Check if token exists in localStorage
  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  },

  // Get stored user data from localStorage
  getStoredUser: () => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch (e) {
        return null;
      }
    }
    return null;
  },

  // Verify token validity with backend
  verifyToken: async () => {
    try {
      const response = await api.get('/auth/user');
      return !!response.data;
    } catch (error) {
      return false;
    }
  },

  // Change password
  changePassword: (passwordData) => {
    return api.put('/auth/password', passwordData);
  }
};

// Export both the auth service and the API instance
export { api };
export default authService;