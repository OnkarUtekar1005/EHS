import { api } from './api';

/**
 * Service for AI-related operations
 */
export const aiService = {
  /**
   * Generate assessment content from uploaded document
   * @param {File} file - The document file (PDF or Word)
   * @returns {Promise<Object>} Generated assessment content
   */
  async generateFromDocument(file) {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await api.post('/ai/generate-assessment', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Error generating assessment from document:', error);
      throw error;
    }
  },
  
  /**
   * Generate questions based on learning content
   * @param {string} content - The learning content text
   * @param {string} type - The question type ('pre' or 'post')
   * @param {number} count - Number of questions to generate
   * @returns {Promise<Array>} Generated questions
   */
  async generateQuestions(content, type, count = 5) {
    try {
      const response = await api.post('/ai/generate-questions', {
        content,
        type,
        count
      });
      
      return response.data;
    } catch (error) {
      console.error('Error generating questions:', error);
      throw error;
    }
  }
};