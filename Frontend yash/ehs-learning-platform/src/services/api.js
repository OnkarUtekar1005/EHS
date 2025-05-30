// src/services/api.js
import axios from 'axios';

// Set this to false in production
const DEBUG_MODE = false;

// Helper function to handle API errors
const handleApiError = (error) => {
  console.error('API Error:', error);
  if (error.response) {
    console.error('Response error details:', {
      status: error.response.status,
      headers: error.response.headers,
      data: error.response.data
    });
  }
  return error;
};

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
      // Make sure the token format is correct
      config.headers.Authorization = `Bearer ${token}`;
      
      // Log for debugging
      console.log('Authorization header:', config.headers.Authorization);
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

// Auth services
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

    // New password reset flow endpoints
    requestPasswordReset: (emailData) => {
      console.log('Requesting password reset for:', emailData);
      return api.post('/auth/forgot-password', emailData);
    },
    validateResetToken: (token) => {
      console.log('Validating reset token:', token);
      const endpoint = `/auth/reset-password/validate?token=${token}`;
      console.log('Validation endpoint:', endpoint);
      console.log('Full URL:', api.defaults.baseURL + endpoint);
      return api.get(endpoint);
    },
    resetPassword: (resetData) => {
      console.log('Resetting password with token');
      console.log('Reset password payload:', JSON.stringify(resetData, null, 2));
      return api.post('/auth/reset-password', resetData);
    },
};

// User services
export const userService = {
  getAll: () => api.get('/users'),
  getById: (id) => api.get(`/users/${id}`),
  create: (userData) => api.post('/users', userData),
  update: (id, userData) => api.put(`/users/${id}`, userData),
  delete: (id) => api.delete(`/users/${id}`),
  bulkCreate: (usersData) => api.post('/users/bulk', usersData),
  bulkDelete: (userIds) => api.delete('/users/bulk', { data: userIds }),
  search: (criteria) => api.get('/users/search', { params: criteria }),
  assignDomains: (userId, domains) => api.put(`/users/${userId}/domains`, domains),
  assignBulkDomains: (data) => api.put('/users/domains/assign', data),
   exportUsers: () => {
    return api.get('/users/export');
   }
};

// Domain services
export const domainService = {
  getAll: () => api.get('/domains'),
  getById: (id) => api.get(`/domains/${id}`),
  create: (domainData) => api.post('/domains', domainData),
  update: (id, domainData) => api.put(`/domains/${id}`, domainData),
  delete: (id) => api.delete(`/domains/${id}`)
};

// Course services
export const courseService = {
  // Admin course endpoints
  getAllCourses: (params) => api.get('/v2/admin/courses', { params }),
  getCourseById: (id) => api.get(`/v2/admin/courses/${id}`),
  createCourse: (courseData) => api.post('/v2/admin/courses', courseData),
  updateCourse: (id, courseData) => api.put(`/v2/admin/courses/${id}`, courseData),
  deleteCourse: (id) => api.delete(`/v2/admin/courses/${id}`),
  publishCourse: (id) => api.post(`/v2/admin/courses/${id}/publish`),
  takeDownCourse: (id) => api.post(`/v2/admin/courses/${id}/takedown`),
  cloneCourse: (id) => api.post(`/v2/admin/courses/${id}/clone`),
  
  // User course endpoints
  getUserCourses: (params) => api.get('/v2/user/courses', { params }),
  getUserCourseById: (id) => api.get(`/v2/user/courses/${id}`)
};

// Progress services
export const progressService = {
  // Get user's course progress
  getUserCourseProgress: () => api.get('/v2/user/progress/courses'),
  
  // Get specific course progress
  getCourseProgress: (courseId) => api.get(`/v2/user/progress/courses/${courseId}`),
  
  // Enroll in a course
  enrollInCourse: (courseId) => api.post(`/v2/user/progress/courses/${courseId}/enroll`),
  
  // Start a component
  startComponent: (componentId) => api.post(`/v2/user/progress/components/${componentId}/start`),
  
  // Update component progress
  updateComponentProgress: (componentId, progressPercentage) => 
    api.put(`/v2/user/progress/components/${componentId}/progress`, { progressPercentage }),
  
  // Complete a component
  completeComponent: (componentId, score = null) => 
    api.post(`/v2/user/progress/components/${componentId}/complete`, score ? { score } : {}),
  
  // Update time spent
  updateTimeSpent: (componentId, additionalSeconds) => 
    api.put(`/v2/user/progress/components/${componentId}/time`, { additionalSeconds }),
  
  // Check component access
  checkComponentAccess: (componentId) => api.get(`/v2/user/progress/components/${componentId}/access`)
};

// Assessment services
export const assessmentService = {
  // Get assessment questions
  getQuestions: (componentId) => api.get(`/v2/user/assessments/${componentId}/questions`),
  
  // Start assessment attempt
  startAttempt: (componentId) => api.post(`/v2/user/assessments/${componentId}/start`),
  
  // Submit assessment
  submitAttempt: (attemptId, answers) => 
    api.post(`/v2/user/assessments/attempts/${attemptId}/submit`, answers),
  
  // Get user attempts
  getUserAttempts: (componentId) => {
    console.log('Fetching user attempts for component:', componentId);
    return api.get(`/v2/user/assessments/${componentId}/attempts`);
  },
  
  // Get latest attempt
  getLatestAttempt: (componentId) => {
    console.log('Fetching latest attempt for component:', componentId);
    return api.get(`/v2/user/assessments/${componentId}/latest-attempt`);
  },
  
  // Get a specific attempt
  getAttempt: (attemptId) => {
    console.log('Fetching specific attempt:', attemptId);
    return api.get(`/v2/user/assessments/attempts/${attemptId}`);
  },
  
  // Check if can retry
  canRetry: (componentId) => api.get(`/v2/user/assessments/${componentId}/can-retry`),
  
  // Get incomplete attempts
  getIncompleteAttempts: () => api.get('/v2/user/assessments/incomplete'),
  
  // Auto-submit incomplete attempt
  autoSubmitAttempt: (attemptId) => api.post(`/v2/user/assessments/attempts/${attemptId}/auto-submit`),
  
  // Admin assessment services
  admin: {
    // Get all assessment attempts with filtering
    getAttempts: (filters) => api.get('/v2/admin/assessments/attempts', { params: filters }),
    
    // Get assessment summary for dashboard
    getSummary: () => api.get('/v2/admin/assessments/summary'),
    
    // Reset user attempts for a component
    resetAttempts: (componentId, userId) => 
      api.post(`/v2/admin/assessments/${componentId}/users/${userId}/reset`),
    
    // Manually mark assessment as passed
    markAsPassed: (componentId, userId, score) =>
      api.post(`/v2/admin/assessments/${componentId}/users/${userId}/pass?score=${score}`)
  }
};

// Material services
export const materialService = {
  getMaterialById: (id) => api.get(`/v2/materials/${id}`),
  getAllMaterials: () => api.get('/v2/materials'),
  searchMaterials: (query) => api.get('/v2/materials/search', { params: { query } })
};

// Certificate services
export const certificateService = {
  // Get certificate for a specific course
  getUserCourseCertificate: (courseId) => api.get(`/v2/certificates/user/${courseId}`),

  // Generate certificate for a course
  generateCertificate: (courseId) => api.post(`/v2/certificates/generate/${courseId}`),

  // Download certificate
  downloadCertificate: (certificateId) =>
    api.get(`/v2/certificates/download/${certificateId}`, { responseType: 'blob' }),

  // View certificate
  viewCertificate: (certificateId) =>
    api.get(`/v2/certificates/view/${certificateId}`, { responseType: 'blob' }),

  // Get all user certificates
  getUserCertificates: () => api.get('/v2/certificates/user/all'),

  // Verify certificate
  verifyCertificate: (certificateNumber) => api.get(`/v2/certificates/verify/${certificateNumber}`)
};

export default api;