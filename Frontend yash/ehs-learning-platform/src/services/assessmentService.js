// src/services/assessmentService.js
import api from './api';

export const assessmentService = {
  // Get questions for a component
  getQuestions: (componentId) => {
    return api.get(`/components/${componentId}/questions`);
  },

  // Add question to assessment
  addQuestion: (componentId, questionData) => {
    return api.post(`/components/${componentId}/questions`, questionData);
  },

  // Update question
  updateQuestion: (questionId, questionData) => {
    return api.put(`/questions/${questionId}`, questionData);
  },

  // Delete question
  deleteQuestion: (questionId) => {
    return api.delete(`/questions/${questionId}`);
  },

  // Submit assessment answers
  submitAnswers: (componentId, submissionData) => {
    return api.post(`/components/${componentId}/submit`, submissionData);
  }
};

export default assessmentService;