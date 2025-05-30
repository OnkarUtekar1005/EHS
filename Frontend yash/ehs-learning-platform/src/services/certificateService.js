// src/services/certificateService.js
import api from './api';

export const certificateService = {
  // Get certificate for a specific course
  getUserCourseCertificate: (courseId) => api.get(`/v2/certificates/user/${courseId}`),
  
  // Generate certificate for a course
  generateCertificate: (courseId) => api.post(`/v2/certificates/generate/${courseId}`),
  
  // Download certificate
  downloadCertificate: (certificateId) => 
    api.get(`/v2/certificates/download/${certificateId}`, { responseType: 'blob' }),
  
  // View certificate
  viewCertificate: (certificateId) => 
    api.get(`/v2/certificates/view/${certificateId}`, { responseType: 'blob' }),
    
  // Get all user certificates
  getUserCertificates: () => api.get('/v2/certificates/user/all'),
  
  // Verify certificate
  verifyCertificate: (certificateNumber) => api.get(`/v2/certificates/verify/${certificateNumber}`)
};

export default certificateService;