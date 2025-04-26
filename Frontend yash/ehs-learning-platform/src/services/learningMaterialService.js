// src/services/learningMaterialService.js
import api from './api';

export const learningMaterialService = {
  // Get all learning materials for a component
  getMaterialsByComponent: (componentId) => {
    return api.get(`/components/${componentId}/materials`);
  },
  
  // Get materials with progress information
  getMaterialsWithProgress: (componentId) => {
    return api.get(`/components/${componentId}/materials/progress`);
  },
  
  // Get a specific material by ID
  getMaterialById: (materialId) => {
    return api.get(`/materials/${materialId}`);
  },
  
  // Get material with user progress
  getMaterialWithProgress: (materialId) => {
    return api.get(`/materials/${materialId}/progress`);
  },
  
  // Add file-based learning material
  uploadFileMaterial: (componentId, file, data) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', data.title);
    
    if (data.description) {
      formData.append('description', data.description);
    }
    
    if (data.estimatedDuration) {
      formData.append('estimatedDuration', data.estimatedDuration);
    }
    
    return api.post(`/components/${componentId}/materials/file`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  },
  
  // Use the new upload endpoint
  uploadMaterial: (componentId, file, data) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('componentId', componentId);
    formData.append('title', data.title);
    
    if (data.description) {
      formData.append('description', data.description);
    }
    
    if (data.estimatedDuration) {
      formData.append('estimatedDuration', data.estimatedDuration);
    }
    
    return api.post(`/components/learning/materials/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  },
  
  // Add content-based learning material (HTML, rich text)
  addContentMaterial: (componentId, data) => {
    return api.post(`/components/${componentId}/materials/content`, {
      title: data.title,
      description: data.description,
      content: data.content,
      estimatedDuration: data.estimatedDuration
    });
  },
  
  // Add external URL learning material (videos, websites)
  addExternalMaterial: (componentId, data) => {
    return api.post(`/components/${componentId}/materials/external`, {
      title: data.title,
      description: data.description,
      fileType: data.fileType,
      externalUrl: data.externalUrl,
      estimatedDuration: data.estimatedDuration
    });
  },
  
  // Update learning material
  updateMaterial: (materialId, data) => {
    return api.put(`/materials/${materialId}`, {
      title: data.title,
      description: data.description,
      content: data.content,
      externalUrl: data.externalUrl,
      estimatedDuration: data.estimatedDuration,
      sequenceOrder: data.sequenceOrder
    });
  },
  
  // Delete learning material
  deleteMaterial: (materialId) => {
    return api.delete(`/materials/${materialId}`);
  },
  
  // Reorder learning materials
  reorderMaterials: (componentId, materialOrder) => {
    return api.put(`/components/${componentId}/materials/reorder`, {
      materialOrder
    });
  },
  
  // Stream or download a learning material file
  streamFile: (materialId) => {
    return api.get(`/materials/${materialId}/stream`, {
      responseType: 'blob'
    });
  },
  
  // Update material progress
  updateProgress: (materialId, progressData) => {
    return api.post(`/materials/${materialId}/update-progress`, progressData);
  }
};