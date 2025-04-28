// src/services/progressService.js
import api from './api';

export const progressService = {
  // Get progress for current user
  getUserProgress: () => {
    return api.get('/progress/user');
  },
  
  // Get progress for specific user
  getUserProgressById: (userId) => {
    return api.get(`/progress/user/${userId}`);
  },
  
  // Get all user progress for a module (admin only)
  getModuleProgress: (moduleId) => {
    return api.get(`/progress/module/${moduleId}`);
  },
  
  // Get progress for a specific user and module
  getUserModuleProgress: (userId, moduleId) => {
    // If userId is not provided, get current user's progress
    const url = userId 
      ? `/progress/user/${userId}/module/${moduleId}`
      : `/progress/user/module/${moduleId}`;
    
    return api.get(url);
  },
  
  // Start a module
  startModule: (moduleId) => {
    return api.post(`/progress/module/${moduleId}/start`);
  },
  
  // Complete a component
  completeComponent: (moduleId, componentId, data = {}) => {
    return api.post(`/progress/module/${moduleId}/component/${componentId}/complete`, data);
  },
  
  // Track progress on a material
  trackMaterialProgress: (moduleId, componentId, materialId, progressData) => {
    return api.post(`/progress/module/${moduleId}/component/${componentId}/material/${materialId}/track`, progressData);
  },
  
  // Get user dashboard data
  getUserDashboard: () => {
    return api.get('/progress/user/dashboard');
  },
  
  // Get module flow for user
  getModuleFlow: (moduleId) => {
    return api.get(`/course/flow/modules/${moduleId}/flow`);
  },
  
  // Get module state for user
  getModuleState: (moduleId) => {
    return api.get(`/course/flow/modules/${moduleId}/state`);
  },
  
  // Get next component for user
  getNextComponent: (moduleId) => {
    return api.get(`/course/flow/modules/${moduleId}/next`);
  }
};

export default progressService;