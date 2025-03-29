// src/pages/Certificates/CertificatesPage.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './CertificatesPage.scss';

// Import common components
import LoadingSpinner from '../../components/common/LoadingSpinner/LoadingSpinner';

const CertificatesPage = () => {
  const [certificates, setCertificates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCertificates = async () => {
      setIsLoading(true);
      setError('');
      
      try {
        const response = await axios.get('/api/certificates');
        setCertificates(response.data);
      } catch (err) {
        console.error('Error fetching certificates:', err);
        setError('Failed to load certificates. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchCertificates();
  }, []);

  // View certificate details
  const viewCertificate = (certificateId) => {
    navigate(`/certificates/${certificateId}`);
  };

  // Download certificate as PDF
  const downloadCertificate = async (certificateId) => {
    try {
      const response = await axios.get(`/api/certificates/${certificateId}/download`, {
        responseType: 'blob'
      });
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `certificate-${certificateId}.pdf`);
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
    } catch (err) {
      console.error('Error downloading certificate:', err);
      setError('Failed to download certificate. Please try again.');
    }
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    }).format(date);
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="certificates-page">
      <div className="page-header">
        <h1>Your Certificates</h1>
        <p>View and download your training completion certificates</p>
      </div>

      {error && <div className="error-message">{error}</div>}

      {certificates.length === 0 ? (
        <div className="no-certificates">
          <div className="empty-icon">🏆</div>
          <h2>No Certificates Yet</h2>
          <p>Complete training modules to earn certificates.</p>
          <button 
            className="action-button"
            onClick={() => navigate('/assessments')}
          >
            Browse Training Modules
          </button>
        </div>
      ) : (
        <div className="certificates-grid">
          {certificates.map(certificate => (
            <div key={certificate.id} className="certificate-card">
              <div className="certificate-preview" onClick={() => viewCertificate(certificate.id)}>
                <div className="certificate-icon">🏆</div>
                <div className="certificate-overlay">
                  <span>View Certificate</span>
                </div>
              </div>
              
              <div className="certificate-details">
                <h3 className="certificate-title">{certificate.title}</h3>
                <p className="certificate-domain">Domain: {certificate.domainName}</p>
                <p className="certificate-date">Earned on: {formatDate(certificate.issuedDate)}</p>
                <p className="certificate-score">Final Score: {certificate.score}%</p>
              </div>
              
              <div className="certificate-actions">
                <button 
                  className="action-view"
                  onClick={() => viewCertificate(certificate.id)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                  View
                </button>
                <button 
                  className="action-download"
                  onClick={() => downloadCertificate(certificate.id)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="7 10 12 15 17 10"></polyline>
                    <line x1="12" y1="15" x2="12" y2="3"></line>
                  </svg>
                  Download
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CertificatesPage;