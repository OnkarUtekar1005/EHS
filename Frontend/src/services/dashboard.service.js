// src/services/dashboard.service.js
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';

class DashboardService {
  /**
   * Get dashboard data for the current user
   * @returns {Promise} with dashboard data
   */
  async getUserDashboard() {
    try {
      const response = await axios.get(`${API_URL}/progress/user/dashboard`);
      return response.data;
    } catch (error) {
      this.handleError(error, 'Error fetching dashboard data');
    }
  }

  /**
   * Get all modules for the current user's domain
   * @returns {Promise} with modules data
   */
  async getUserModules() {
    try {
      const response = await axios.get(`${API_URL}/modules`);
      return response.data;
    } catch (error) {
      this.handleError(error, 'Error fetching user modules');
    }
  }

  /**
   * Get modules in progress for the current user
   * @returns {Promise} with modules in progress data
   */
  async getInProgressModules() {
    try {
      const response = await axios.get(`${API_URL}/progress/user/current`);
      return response.data;
    } catch (error) {
      this.handleError(error, 'Error fetching in-progress modules');
    }
  }

  /**
   * Get recent activity for the current user
   * @param {number} limit - Number of activities to fetch
   * @returns {Promise} with activity data
   */
  async getRecentActivity(limit = 5) {
    try {
      const response = await axios.get(`${API_URL}/reports/user/current/activity?limit=${limit}`);
      return response.data;
    } catch (error) {
      this.handleError(error, 'Error fetching recent activity');
    }
  }

  /**
   * Get statistics for the current user
   * @returns {Promise} with statistics data
   */
  async getUserStatistics() {
    try {
      const response = await axios.get(`${API_URL}/reports/user/current/statistics`);
      return response.data;
    } catch (error) {
      this.handleError(error, 'Error fetching user statistics');
    }
  }

  /**
   * Consistent error handling across methods
   * @param {Error} error - The caught error
   * @param {string} defaultMessage - Default error message
   */
  handleError(error, defaultMessage) {
    if (error.response) {
      throw new Error(error.response.data.message || defaultMessage);
    } else if (error.request) {
      throw new Error('No response from server');
    } else {
      throw new Error(defaultMessage);
    }
  }
}

export default new DashboardService();