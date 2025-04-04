// src/services/api.js
import axios from 'axios';

// Set this to false in production
const DEBUG_MODE = true;

// Debug function to get token details
const debugToken = () => {
    const token = localStorage.getItem('token');
    console.log('==== TOKEN DEBUG ====');
    console.log('Token exists:', !!token);
    if (token) {
      console.log('Token length:', token.length);
      console.log('Token starts with "Bearer ":', token.startsWith('Bearer '));
      console.log('First 20 chars of token:', token.substring(0, 20) + '...');
      
      // Check token format (should have 3 parts separated by dots)
      const tokenParts = token.split('.');
      console.log('Token has valid JWT format (3 parts):', tokenParts.length === 3);
    }
    console.log('=====================');
};

// Create axios instance with base URL
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
    
    // Log this for debugging
    console.log('Adding token to request:', token ? 'Token exists' : 'No token');
    
    if (token) {
      // Never store the token with 'Bearer ' prefix in localStorage
      // Always add it here in the interceptor
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Track if we're already redirecting to avoid loops
let isRedirecting = false;

// Response interceptor for handling errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error);
    
    // Debug mode: don't redirect on 401 so you can see the console logs
    if (DEBUG_MODE && error.response && error.response.status === 401) {
      console.warn('Unauthorized request detected, but not redirecting (DEBUG_MODE)');
      console.log('Request URL:', error.config.url);
      console.log('Request method:', error.config.method);
      console.log('Auth header:', error.config.headers.Authorization || 'No Auth header');
      
      // Don't redirect in debug mode, just return the error
      return Promise.reject(error);
    }
    
    // Normal behavior for production - only runs if DEBUG_MODE is false
    if (!DEBUG_MODE && error.response && error.response.status === 401 && !isRedirecting) {
      console.log('Unauthorized request detected, redirecting to login');
      
      // Set redirecting flag
      isRedirecting = true;
      
      // Clear auth data
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Redirect to login after a short delay to allow console logs to be seen
      setTimeout(() => {
        window.location.href = '/login';
        // Reset flag after redirect
        isRedirecting = false;
      }, 100);
    }
    
    // Log complete error details for debugging
    if (error.response) {
      console.error('Response error details:', {
        status: error.response.status,
        headers: error.response.headers,
        data: error.response.data
      });
    }
    
    return Promise.reject(error);
  }
);

// Auth services - UPDATED VERSION
export const authService = {
    login: async (credentials) => {
      try {
        const response = await api.post('/auth/login', credentials);
        
        // Store token in localStorage when login is successful
        if (response.data && response.data.token) {
          // IMPORTANT: Store the token WITHOUT 'Bearer ' prefix
          // The interceptor will add it when making requests
          localStorage.setItem('token', response.data.token);
          console.log('Token stored in localStorage after login', response.data.token.substring(0, 10) + '...');
          
          // Store user info
          localStorage.setItem('user', JSON.stringify(response.data));
        }
        
        return response;
      } catch (error) {
        console.error('Login error:', error);
        throw error;
      }
    },
    logout: async () => {
      try {
        if (localStorage.getItem('token')) {
          await api.post('/auth/logout');
        }
      } catch (error) {
        console.warn('Logout API error (continuing with local logout):', error);
      } finally {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    },
    getCurrentUser: () => api.get('/auth/user'),
    changePassword: (passwordData) => api.put('/auth/password', passwordData),
    requestPasswordReset: (email) => api.post('/auth/password/reset-request', email),
    validateResetToken: (token) => api.get(`/auth/password/validate-token/${token}`),
    resetPassword: (resetData) => api.post('/auth/password/reset', resetData),
};

// User services
export const userService = {
  getAll: () => api.get('/users'),
  getById: (id) => api.get(`/users/${id}`),
  create: (userData) => api.post('/users', userData),
  update: (id, userData) => api.put(`/users/${id}`, userData),
  delete: (id) => api.delete(`/users/${id}`),
  search: (criteria) => api.get('/users/search', { params: criteria }),
  assignDomains: (userId, domains) => api.put(`/users/${userId}/domains`, domains),
};

// Update to src/services/api.js - Add search method to domainService

export const domainService = {
  getAll: () => api.get('/domains'),
  getById: (id) => api.get(`/domains/${id}`),
  create: (domainData) => api.post('/domains', domainData),
  update: (id, domainData) => api.put(`/domains/${id}`, domainData),
  delete: (id) => api.delete(`/domains/${id}`),
  getModules: (domainId) => api.get(`/domains/${domainId}/modules`),
  search: (query) => api.get('/domains/search', { params: { query } }),
};

// Module services
export const moduleService = {
  getAll: (params) => api.get('/modules', { params }),
  getById: (id) => api.get(`/modules/${id}`),
  create: (moduleData) => api.post('/modules', moduleData),
  update: (id, moduleData) => api.put(`/modules/${id}`, moduleData),
  delete: (id) => api.delete(`/modules/${id}`),
  getByDomain: (domainId) => api.get(`/modules/domain/${domainId}`),
  publish: (id) => api.post(`/modules/${id}/publish`),
  archive: (id) => api.post(`/modules/${id}/archive`),
  clone: (id) => api.post(`/modules/${id}/clone`),
  getStats: (id) => api.get(`/modules/${id}/stats`),
};

// Component services
export const componentService = {
  getByModule: (moduleId) => api.get(`/modules/${moduleId}/components`),
  getById: (id) => api.get(`/components/${id}`),
  create: (moduleId, componentData) => api.post(`/modules/${moduleId}/components`, componentData),
  update: (id, componentData) => api.put(`/components/${id}`, componentData),
  delete: (id) => api.delete(`/components/${id}`),
  reorder: (moduleId, componentOrder) => api.put(`/modules/${moduleId}/components/reorder`, { componentOrder }),
};

// Assessment services
export const assessmentService = {
  getQuestions: (componentId) => api.get(`/components/${componentId}/questions`),
  addQuestion: (componentId, questionData) => api.post(`/components/${componentId}/questions`, questionData),
  updateQuestion: (id, questionData) => api.put(`/questions/${id}`, questionData),
  deleteQuestion: (id) => api.delete(`/questions/${id}`),
  submitAnswers: (componentId, answers) => api.post(`/components/${componentId}/submit`, { answers }),
};

// Progress services
export const progressService = {
  getUserProgress: (userId) => api.get(`/progress/user/${userId}`),
  getModuleProgress: (moduleId) => api.get(`/progress/module/${moduleId}`),
  getUserModuleProgress: (userId, moduleId) => api.get(`/progress/user/${userId}/module/${moduleId}`),
  startModule: (moduleId) => api.post(`/progress/module/${moduleId}/start`),
  completeComponent: (moduleId, componentId, data) => api.post(`/progress/module/${moduleId}/component/${componentId}/complete`, data),
  getDashboard: () => api.get('/progress/user/dashboard'),
};

export default api;