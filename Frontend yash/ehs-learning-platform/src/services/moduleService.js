// src/services/moduleService.js
import api from './api';

// Module/Course services
export const moduleService = {
  // Course CRUD operations
  getAllModules: (page = 0, size = 10, search = '', domainId = null, status = null) => {
    let url = `/api/modules?page=${page}&size=${size}`;
    
    if (search) {
      url += `&search=${encodeURIComponent(search)}`;
    }
    
    if (domainId) {
      url += `&domainId=${domainId}`;
    }
    
    if (status) {
      url += `&status=${status}`;
    }
    
    return api.get(url);
  },
  
  getModuleById: (id) => api.get(`/api/modules/${id}`),
  
  createModule: (moduleData) => api.post('/api/modules', moduleData),
  
  updateModule: (id, moduleData) => api.put(`/api/modules/${id}`, moduleData),
  
  deleteModule: (id) => api.delete(`/api/modules/${id}`),
  
  publishModule: (id) => api.put(`/api/modules/${id}/publish`),
  
  archiveModule: (id) => api.put(`/api/modules/${id}/archive`),
  
  cloneModule: (id) => api.post(`/api/modules/${id}/clone`),
  
  // Component operations
  getComponentsByModule: (moduleId) => api.get(`/api/modules/${moduleId}/components`),
  
  getComponentById: (id) => api.get(`/api/modules/components/${id}`),
  
  createComponent: (moduleId, componentData) => api.post(`/api/modules/${moduleId}/components`, componentData),
  
  updateComponent: (id, componentData) => api.put(`/api/modules/components/${id}`, componentData),
  
  deleteComponent: (id) => api.delete(`/api/modules/components/${id}`),
  
  updateComponentOrder: (moduleId, componentIds) => api.put(`/api/modules/${moduleId}/components/order`, componentIds),
  
  // Question operations
  getQuestionsByComponent: (componentId) => api.get(`/api/modules/components/${componentId}/questions`),
  
  getQuestionById: (id) => api.get(`/api/modules/questions/${id}`),
  
  createQuestion: (componentId, questionData) => api.post(`/api/modules/components/${componentId}/questions`, questionData),
  
  updateQuestion: (id, questionData) => api.put(`/api/modules/questions/${id}`, questionData),
  
  deleteQuestion: (id) => api.delete(`/api/modules/questions/${id}`),
  
  updateQuestionOrder: (componentId, questionIds) => api.put(`/api/modules/components/${componentId}/questions/order`, questionIds),
  
  // Answer operations
  createAnswer: (questionId, answerData) => api.post(`/api/modules/questions/${questionId}/answers`, answerData),
  
  updateAnswer: (id, answerData) => api.put(`/api/modules/answers/${id}`, answerData),
  
  deleteAnswer: (id) => api.delete(`/api/modules/answers/${id}`),
  
  // Learning material operations
  getMaterialsByComponent: (componentId) => api.get(`/api/materials/component/${componentId}`),
  
  getMaterialById: (id) => api.get(`/api/materials/${id}`),
  
  uploadMaterial: (formData) => api.post('/api/materials/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  }),
  
  updateMaterial: (id, materialData) => api.put(`/api/materials/${id}`, materialData),
  
  replaceMaterialFile: (id, formData) => api.put(`/api/materials/${id}/file`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  }),
  
  deleteMaterial: (id) => api.delete(`/api/materials/${id}`),
  
  updateMaterialOrder: (componentId, materialIds) => api.put(`/api/materials/component/${componentId}/order`, materialIds),
};

export default moduleService;