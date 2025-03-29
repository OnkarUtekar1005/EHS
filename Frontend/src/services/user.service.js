import { api } from './api';

/**
 * Service for user-related operations
 */
export const userService = {
  /**
   * Get trainings by domain
   * @param {string} domainId - The domain ID
   * @returns {Promise<Array>} Array of trainings
   */
  async getTrainingsByDomain(domainId) {
    try {
      const response = await api.get(`/trainings/domain/${domainId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching trainings by domain:', error);
      throw error;
    }
  },
  
  /**
   * Get user profile
   * @returns {Promise<Object>} User profile
   */
  async getUserProfile() {
    try {
      const response = await api.get('/users/profile');
      return response.data;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      throw error;
    }
  },
  
  /**
   * Get user's completed trainings
   * @returns {Promise<Array>} Array of completed trainings
   */
  async getCompletedTrainings() {
    try {
      const response = await api.get('/users/trainings/completed');
      return response.data;
    } catch (error) {
      console.error('Error fetching completed trainings:', error);
      throw error;
    }
  }
};
