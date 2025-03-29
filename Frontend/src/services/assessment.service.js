import { api } from './api';

/**
 * Service for assessment-related operations
 */
export const assessmentService = {
  /**
   * Get training by ID
   * @param {string} trainingId - The training ID
   * @returns {Promise<Object>} Training data
   */
  async getTrainingById(trainingId) {
    try {
      const response = await api.get(`/trainings/${trainingId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching training:', error);
      throw error;
    }
  },
  
  /**
   * Submit pre-assessment results
   * @param {string} trainingId - The training ID
   * @param {Object} results - The assessment results
   * @returns {Promise<Object>} Submission response
   */
  async submitPreAssessment(trainingId, results) {
    try {
      const response = await api.post(`/assessments/${trainingId}/pre`, results);
      return response.data;
    } catch (error) {
      console.error('Error submitting pre-assessment:', error);
      throw error;
    }
  },
  
  /**
   * Submit post-assessment results
   * @param {string} trainingId - The training ID
   * @param {Object} results - The assessment results
   * @returns {Promise<Object>} Submission response with comparison
   */
  async submitPostAssessment(trainingId, results) {
    try {
      const response = await api.post(`/assessments/${trainingId}/post`, results);
      return response.data;
    } catch (error) {
      console.error('Error submitting post-assessment:', error);
      throw error;
    }
  }
};