// src/services/dashboardService.js
import api from './api';

export const dashboardService = {
  // Get dashboard summary data - This endpoint exists in your backend
  getDashboardSummary: () => {
    return api.get('/progress/user/dashboard');
  },
  
  // Get all user module progress - this matches your backend
  getUserModuleProgress: () => {
    // This gets the current user's ID from localStorage
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const userId = user.id;
    
    if (!userId) {
      return Promise.reject(new Error('User ID not found in storage'));
    }
    
    return api.get(`/progress/user/${userId}`);
  },
  
  // Get modules by status
  getModulesByStatus: (status) => {
    // Valid status values: DRAFT, PUBLISHED, ARCHIVED
    return api.get('/modules', { 
      params: { status } 
    });
  },
  
  // Get all published modules (for recommendations)
  getPublishedModules: () => {
    return api.get('/modules', {
      params: { status: 'PUBLISHED' }
    });
  },
  
  // Get modules for a specific domain
  getModulesByDomain: (domainId) => {
    return api.get(`/modules/domain/${domainId}`);
  },
  
  // Get domains (for dashboard quick access)
  getAllDomains: () => {
    return api.get('/domains');
  },
  
  // Process dashboard data for frontend use
  processDashboardData: (progressData, modulesData) => {
    // Filter modules by ProgressState
    const inProgressModules = progressData.filter(p => p.state === 'IN_PROGRESS')
      .map(p => ({
        id: p.trainingModule.id,
        title: p.trainingModule.title,
        description: p.trainingModule.description,
        domain: p.trainingModule.domain,
        progress: calculateModuleProgress(p),
        lastAccessed: p.lastAccessedAt
      }));
    
    const completedModules = progressData.filter(p => p.state === 'COMPLETED')
      .map(p => ({
        id: p.trainingModule.id,
        title: p.trainingModule.title,
        description: p.trainingModule.description,
        domain: p.trainingModule.domain,
        completedAt: p.completedAt,
        score: p.postAssessmentScore
      }));
    
    // Return processed data
    return {
      inProgressModules,
      completedModules
    };
  }
};

// Helper function to calculate percentage completion of a module
function calculateModuleProgress(moduleProgress) {
  // If module is completed, return 100%
  if (moduleProgress.state === 'COMPLETED') {
    return 100;
  }
  
  // For modules in progress, we need to calculate based on components
  // This is an approximation - your backend might provide better data
  // Check if we have component progress data
  if (moduleProgress.componentProgress) {
    const total = moduleProgress.componentProgress.length;
    const completed = moduleProgress.componentProgress.filter(cp => cp.completed).length;
    return total ? Math.round((completed / total) * 100) : 0;
  }
  
  // If we don't have component data, estimate from current position
  if (moduleProgress.currentComponent && moduleProgress.trainingModule.components) {
    const total = moduleProgress.trainingModule.components.length;
    const current = moduleProgress.trainingModule.components.findIndex(
      c => c.id === moduleProgress.currentComponent.id
    );
    return total ? Math.round((current / total) * 100) : 0;
  }
  
  return 0;
}

export default dashboardService;