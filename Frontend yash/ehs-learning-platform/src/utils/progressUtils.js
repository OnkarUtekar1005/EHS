// src/utils/progressUtils.js

/**
 * Maps the backend ProgressState enum values to frontend-friendly display values
 * @param {string} state - The ProgressState from the backend
 * @returns {string} User-friendly status text
 */
export const mapProgressStateToDisplay = (state) => {
    switch (state) {
      case 'NOT_STARTED':
        return 'Not Started';
      case 'IN_PROGRESS':
        return 'In Progress';
      case 'COMPLETED':
        return 'Completed';
      default:
        return state;
    }
  };
  
  /**
   * Calculates the percentage completion of a module based on completed components
   * @param {Object} progressData - The module progress data from the backend API
   * @param {Array} componentProgressData - Optional component progress data
   * @returns {number} Percentage completion (0-100)
   */
  export const calculateModuleProgress = (progressData, componentProgressData = []) => {
    // If module is completed, return 100%
    if (progressData.state === 'COMPLETED') {
      return 100;
    }
    
    // If we have component progress data
    if (componentProgressData.length > 0) {
      const total = componentProgressData.length;
      const completed = componentProgressData.filter(cp => cp.completed).length;
      return total ? Math.round((completed / total) * 100) : 0;
    }
    
    // If we have component data in the progress object itself
    if (progressData.componentProgress && Array.isArray(progressData.componentProgress)) {
      const total = progressData.componentProgress.length;
      const completed = progressData.componentProgress.filter(cp => cp.completed).length;
      return total ? Math.round((completed / total) * 100) : 0; 
    }
    
    // If we don't have component data, but have current component info
    if (progressData.currentComponent && 
        progressData.trainingModule && 
        progressData.trainingModule.components) {
      
      const components = progressData.trainingModule.components;
      const currentIndex = components.findIndex(c => 
        c.id === progressData.currentComponent.id);
      
      if (currentIndex >= 0) {
        return Math.round(((currentIndex) / components.length) * 100);
      }
    }
    
    // Default to 0% if we can't calculate
    return 0;
  };
  
  /**
   * Formats a timestamp for display
   * @param {string} timestamp - ISO timestamp string
   * @returns {string} Formatted date/time
   */
  export const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'N/A';
    
    try {
      const date = new Date(timestamp);
      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    } catch (e) {
      return timestamp;
    }
  };
  
  /**
   * Extracts domain icons based on domain name
   * Useful for displaying icons in domain lists
   * @param {string} domainName - The name of the domain
   * @returns {string} Icon identifier
   */
  export const getDomainIconType = (domainName) => {
    if (!domainName) return 'default';
    
    const lowerName = domainName.toLowerCase();
    
    if (lowerName.includes('fire') || lowerName.includes('burn')) return 'fire';
    if (lowerName.includes('osha') || lowerName.includes('compliance')) return 'security';
    if (lowerName.includes('first aid') || lowerName.includes('medical')) return 'firstAid';
    if (lowerName.includes('hazard') || lowerName.includes('warning')) return 'warning';
    if (lowerName.includes('construction')) return 'construction';
    if (lowerName.includes('chemical')) return 'chemical';
    
    return 'default';
  };
  
  /**
   * Calculates improvement between pre and post assessment scores
   * @param {number} preScore - Pre-assessment score
   * @param {number} postScore - Post-assessment score
   * @returns {number} Improvement percentage (can be negative)
   */
  export const calculateImprovement = (preScore, postScore) => {
    if (typeof preScore !== 'number' || typeof postScore !== 'number') {
      return 0;
    }
    
    return postScore - preScore;
  };
  
  export default {
    mapProgressStateToDisplay,
    calculateModuleProgress,
    formatTimestamp,
    getDomainIconType,
    calculateImprovement
  };