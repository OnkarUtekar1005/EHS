// src/pages/Assessment/AssessmentsPage.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './AssessmentsPage.scss';

// Import common components
import LoadingSpinner from '../../components/common/LoadingSpinner/LoadingSpinner';

const AssessmentsPage = () => {
  const [modules, setModules] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');

  useEffect(() => {
    const fetchModules = async () => {
      setIsLoading(true);
      setError('');
      
      try {
        // Get user's domain from localStorage or context
        const user = JSON.parse(localStorage.getItem('user'));
        
        // Fetch modules for the user's domain
        const response = await axios.get(`/api/modules/domain/${user.domainId}`);
        setModules(response.data);
      } catch (err) {
        console.error('Error fetching modules:', err);
        setError('Failed to load training modules. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchModules();
  }, []);

  // Filter modules based on status
  const getFilteredModules = () => {
    if (activeFilter === 'all') return modules;
    return modules.filter(module => module.status.toLowerCase() === activeFilter);
  };

  // Render module status badge
  const renderStatus = (status) => {
    switch(status.toUpperCase()) {
      case 'COMPLETED':
        return <span className="status-badge completed">Completed</span>;
      case 'IN_PROGRESS':
        return <span className="status-badge in-progress">In Progress</span>;
      case 'NOT_STARTED':
      default:
        return <span className="status-badge not-started">Not Started</span>;
    }
  };

  // Get the appropriate link based on module status
  const getModuleLink = (module) => {
    switch(module.status.toUpperCase()) {
      case 'NOT_STARTED':
        return `/assessments/${module.id}/pre-assessment`;
      case 'IN_PROGRESS':
        if (!module.preAssessmentCompleted) return `/assessments/${module.id}/pre-assessment`;
        if (!module.learningCompleted) return `/assessments/${module.id}/learning`;
        return `/assessments/${module.id}/post-assessment`;
      case 'COMPLETED':
        return `/assessments/${module.id}/certificate`;
      default:
        return `/assessments/${module.id}/pre-assessment`;
    }
  };
  
  // Get button text based on module status
  const getButtonText = (module) => {
    switch(module.status.toUpperCase()) {
      case 'NOT_STARTED':
        return 'Start Training';
      case 'IN_PROGRESS':
        if (!module.preAssessmentCompleted) return 'Continue Pre-Assessment';
        if (!module.learningCompleted) return 'Continue Learning';
        return 'Take Final Assessment';
      case 'COMPLETED':
        return 'View Certificate';
      default:
        return 'Start Training';
    }
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="assessments-page">
      <div className="page-header">
        <h1>Training Modules</h1>
        <p>Complete these training modules to enhance your skills and knowledge</p>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="filters-container">
        <button 
          className={`filter-button ${activeFilter === 'all' ? 'active' : ''}`}
          onClick={() => setActiveFilter('all')}
        >
          All
        </button>
        <button 
          className={`filter-button ${activeFilter === 'in_progress' ? 'active' : ''}`}
          onClick={() => setActiveFilter('in_progress')}
        >
          In Progress
        </button>
        <button 
          className={`filter-button ${activeFilter === 'completed' ? 'active' : ''}`}
          onClick={() => setActiveFilter('completed')}
        >
          Completed
        </button>
        <button 
          className={`filter-button ${activeFilter === 'not_started' ? 'active' : ''}`}
          onClick={() => setActiveFilter('not_started')}
        >
          Not Started
        </button>
      </div>

      <div className="modules-container">
        {getFilteredModules().length === 0 ? (
          <div className="no-modules">
            <p>No training modules found for this filter.</p>
          </div>
        ) : (
          getFilteredModules().map(module => (
            <div key={module.id} className="module-card">
              <div className="module-content">
                <div className="module-header">
                  <h2>{module.title}</h2>
                  {renderStatus(module.status)}
                </div>
                <p className="module-description">{module.description}</p>
                
                <div className="module-details">
                  <div className="detail-item">
                    <span className="detail-icon">📚</span>
                    <span className="detail-text">Domain: {module.domainName}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-icon">⏱️</span>
                    <span className="detail-text">Duration: {module.estimatedTime} min</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-icon">📝</span>
                    <span className="detail-text">Questions: {module.totalQuestions}</span>
                  </div>
                </div>

                {module.status.toUpperCase() === 'IN_PROGRESS' && (
                  <div className="progress-container">
                    <div className="progress-bar">
                      <div 
                        className="progress-fill" 
                        style={{ width: `${module.progressPercentage}%` }}
                      ></div>
                    </div>
                    <span className="progress-text">{module.progressPercentage}% complete</span>
                  </div>
                )}
              </div>
              
              <div className="module-actions">
                <Link to={getModuleLink(module)} className="action-button">
                  {getButtonText(module)}
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AssessmentsPage;