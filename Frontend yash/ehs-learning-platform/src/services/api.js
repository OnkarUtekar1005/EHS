// src/services/api.js
import axios from 'axios';

// Set this to false in production
const DEBUG_MODE = true;

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
  getAvailableModules: () => api.get('/modules/available'),
  getRecommendedModules: () => api.get('/modules/recommended'),
  getUserProfile: () => api.get('/auth/user'),
  getComponentQuestions: async (componentId) => {
    try {
      console.log(`[API] Getting questions for component: ${componentId}`);
      const response = await api.get(`/components/${componentId}/questions`);
      return response;
    } catch (error) {
      console.error('Error fetching component questions:', error);
      // Return empty data array to prevent mapping errors
      return { data: [] };
    }
  }
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
  getQuestions: async (componentId) => {
    try {
      console.log(`[API] Getting assessment questions for component: ${componentId}`);
      const response = await api.get(`/components/${componentId}/questions`);
      return response;
    } catch (error) {
      console.error('Error fetching assessment questions:', error);
      // Return empty data array to prevent mapping errors
      return { data: [] };
    }
  },
  addQuestion: (componentId, questionData) => api.post(`/components/${componentId}/questions`, questionData),
  updateQuestion: (id, questionData) => api.put(`/questions/${id}`, questionData),
  deleteQuestion: (id) => api.delete(`/questions/${id}`),
  submitAnswers: (componentId, answers) => api.post(`/components/${componentId}/submit`, { answers }),
};

// Progress tracking services
export const progressService = {
  getUserProgress: (userId) => api.get(`/progress/user/${userId}`),
  getModuleProgress: (moduleId) => api.get(`/progress/module/${moduleId}`),
  getUserModuleProgress: (userId, moduleId) => api.get(`/progress/user/${userId}/module/${moduleId}`),
  startModule: (moduleId) => api.post(`/progress/module/${moduleId}/start`),
  completeComponent: (moduleId, componentId, data) => api.post(`/progress/module/${moduleId}/component/${componentId}/complete`, data),
  getDashboard: () => api.get('/progress/user/dashboard'),
};

// Learning Material services
export const learningMaterialService = {
  // Get all learning materials for a component
  getMaterialsByComponent: async (componentId) => {
    try {
      console.log("[API] Getting materials for component:", componentId);
      const response = await api.get(`/components/${componentId}/materials`);
      return response;
    } catch (error) {
      console.error('Error fetching materials for component:', error);
      // Return empty data array to prevent mapping errors
      return { data: [] };
    }
  },
  
  // Get materials with progress information
  getMaterialsWithProgress: (componentId) => {
    console.log("[API] Getting materials with progress for component:", componentId);
    return api.get(`/components/${componentId}/materials/progress`);
  },
  
  // Get a specific material by ID
  getMaterialById: (materialId) => {
    console.log("[API] Getting material by ID:", materialId);
    return api.get(`/materials/${materialId}`);
  },
  
  // Get material with user progress
  getMaterialWithProgress: (materialId) => {
    console.log("[API] Getting material with progress by ID:", materialId);
    return api.get(`/materials/${materialId}/progress`);
  },
  
  // Add file-based learning material
  uploadMaterial: (componentId, file, data) => {
    console.log("[API] Uploading material file for component:", componentId);
    console.log("[API] File details:", file.name, file.type, file.size);
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', data.title);
    
    if (data.description) {
      formData.append('description', data.description);
    }
    
    if (data.estimatedDuration) {
      formData.append('estimatedDuration', data.estimatedDuration);
    }
    
    return api.post(`/components/${componentId}/materials/file`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  },
  
  // Add content-based learning material (HTML, rich text)
  addContentMaterial: (componentId, data) => {
    console.log("[API] Adding content material for component:", componentId);
    return api.post(`/components/${componentId}/materials/content`, {
      title: data.title,
      description: data.description,
      content: data.content,
      estimatedDuration: data.estimatedDuration
    });
  },
  
  // Add external URL learning material (videos, websites)
  addExternalMaterial: (componentId, data) => {
    console.log("[API] Adding external material for component:", componentId);
    return api.post(`/components/${componentId}/materials/external`, {
      title: data.title,
      description: data.description,
      fileType: data.fileType,
      externalUrl: data.externalUrl,
      estimatedDuration: data.estimatedDuration
    });
  },
  
  // Update learning material
  updateMaterial: (materialId, data) => {
    console.log("[API] Updating material:", materialId);
    return api.put(`/materials/${materialId}`, {
      title: data.title,
      description: data.description,
      content: data.content,
      externalUrl: data.externalUrl,
      estimatedDuration: data.estimatedDuration,
      sequenceOrder: data.sequenceOrder
    });
  },
  
  // Delete learning material
  deleteMaterial: (materialId) => {
    console.log("[API] Deleting material:", materialId);
    return api.delete(`/materials/${materialId}`);
  },
  
  // Reorder learning materials
  reorderMaterials: (componentId, materialOrder) => {
    console.log("[API] Reordering materials for component:", componentId);
    console.log("[API] New order:", materialOrder);
    return api.put(`/components/${componentId}/materials/reorder`, {
      materialOrder
    });
  },
  
  // Stream or download a learning material file
  streamFile: (materialId, preview = false) => {
    console.log("[API] Streaming file for material:", materialId, preview ? "(preview mode)" : "");

    // Create a special axios instance that doesn't add auth headers for preview requests
    const requestConfig = {
      responseType: 'blob'
    };

    // For preview requests, create a direct request without auth headers
    if (preview) {
      // Create a new axios instance without the interceptors
      const directAxios = axios.create({
        baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8080/api'
      });

      // Add cache-busting parameter
      const cacheBuster = new Date().getTime();
      return directAxios.get(`/materials/${materialId}/stream?preview=true&cacheBuster=${cacheBuster}`, requestConfig);
    }

    // Regular request with auth
    return api.get(`/materials/${materialId}/stream`, requestConfig);
  },

  // Get preview info for a material
  getPreviewInfo: (materialId) => {
    console.log("[API] Getting preview info for material:", materialId);

    // Create a special axios instance that doesn't add auth headers for preview requests
    const directAxios = axios.create({
      baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8080/api'
    });

    // Add cache-busting parameter
    const cacheBuster = new Date().getTime();
    return directAxios.get(`/materials/${materialId}/preview-info?preview=true&cacheBuster=${cacheBuster}`);
  },
  
  // Update material progress
  updateProgress: (materialId, progressData) => {
    console.log("[API] Updating progress for material:", materialId);
    return api.post(`/materials/${materialId}/update-progress`, progressData);
  }
};

// Material Library Service
export const materialLibraryService = {
  // Get all materials from library with filtering/pagination
  getAll: (params) => {
    console.log("[API] Getting all materials from library with params:", params);
    return api.get('/material-library', { params });
  },
  
  // Get a specific material by ID
  getById: (materialId) => {
    console.log("[API] Getting material from library by ID:", materialId);
    return api.get(`/material-library/${materialId}`);
  },
  
  // Upload a file-based material to the library
  uploadFile: (data) => {
    console.log("[API] Uploading file to material library:", data.title);
    
    const formData = new FormData();
    formData.append('file', data.file);
    formData.append('title', data.title);
    
    if (data.description) {
      formData.append('description', data.description);
    }
    
    if (data.estimatedDuration) {
      formData.append('estimatedDuration', data.estimatedDuration);
    }
    
    return api.post('/material-library/file', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  },
  
  // Create HTML content material
  createContent: (data) => {
    console.log("[API] Creating content material in library:", data.title);
    return api.post('/material-library/content', {
      title: data.title,
      description: data.description,
      content: data.content,
      estimatedDuration: data.estimatedDuration
    });
  },
  
  // Create external URL material
  createExternal: (data) => {
    console.log("[API] Creating external URL material in library:", data.title);
    return api.post('/material-library/external', {
      title: data.title,
      description: data.description,
      fileType: data.fileType,
      externalUrl: data.externalUrl,
      estimatedDuration: data.estimatedDuration
    });
  },
  
  // Update existing material
  update: (materialId, data) => {
    console.log("[API] Updating material in library:", materialId);
    return api.put(`/material-library/${materialId}`, {
      title: data.title,
      description: data.description,
      content: data.content,
      externalUrl: data.externalUrl,
      estimatedDuration: data.estimatedDuration
    });
  },
  
  // Delete a material
  delete: (materialId) => {
    console.log("[API] Deleting material from library:", materialId);
    return api.delete(`/material-library/${materialId}`);
  },
  
  // Get where a material is used
  getUsage: (materialId) => {
    console.log("[API] Getting usage for material:", materialId);
    return api.get(`/material-library/${materialId}/components`);
  },
  
  // Associate a material with a component
  associateMaterialWithComponent: (componentId, materialId, sequenceOrder = 0) => {
    console.log(`[API] Associating material ${materialId} with component ${componentId}`);
    return api.post(`/material-library/${materialId}/components/${componentId}`, { sequenceOrder });
  },
  
  // Associate multiple materials with a component in bulk
  associateMaterialsWithComponent: (componentId, materialIds) => {
    console.log(`[API] Associating ${materialIds.length} materials with component ${componentId}`);
    
    // Make multiple API calls - one for each association
    return materialIds.reduce((promise, materialId, index) => {
      return promise.then(() => {
        return materialLibraryService.associateMaterialWithComponent(componentId, materialId, index + 1);
      });
    }, Promise.resolve());
  },

  // Get materials for a component
  getMaterialsByComponent: async (componentId) => {
    try {
      console.log(`[API] Getting materials for component: ${componentId}`);
      const response = await api.get(`/components/${componentId}/materials`);
      return response;
    } catch (error) {
      console.error('Error fetching materials for component:', error);
      // Return empty data array to prevent mapping errors
      return { data: [] };
    }
  },
  
  // Disassociate a material from a component
  disassociateMaterialFromComponent: (componentId, materialId) => {
    console.log(`[API] Disassociating material ${materialId} from component ${componentId}`);
    return api.delete(`/material-library/${materialId}/components/${componentId}`);
  }
};

export default api;