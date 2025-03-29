import { api } from './api';

/**
 * Service for admin-related operations
 */
export const adminService = {
  /**
   * Get dashboard statistics
   * @returns {Promise<Object>} Dashboard statistics
   */
  async getDashboardStats() {
    try {
      const response = await api.get('/admin/dashboard/stats');
      return response.data;
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      throw error;
    }
  },
  
  /**
   * Get recent trainings
   * @param {number} limit - Number of trainings to retrieve
   * @returns {Promise<Array>} Array of recent trainings
   */
  async getRecentTrainings(limit = 5) {
    try {
      const response = await api.get(`/admin/trainings/recent?limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching recent trainings:', error);
      throw error;
    }
  },
  
  /**
   * Create a new training module
   * @param {Object} trainingData - The training data
   * @returns {Promise<Object>} Created training
   */
  async createTraining(trainingData) {
    try {
      const response = await api.post('/admin/trainings', trainingData);
      return response.data;
    } catch (error) {
      console.error('Error creating training:', error);
      throw error;
    }
  },
  
  /**
   * Create a learning module
   * @param {FormData} formData - Form data with file
   * @returns {Promise<Object>} Created module
   */
  async createLearningModule(formData) {
    try {
      const response = await api.post('/admin/modules', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error creating learning module:', error);
      throw error;
    }
  }
};