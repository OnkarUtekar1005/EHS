// src/components/modules/ModuleCard/ModuleCard.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import './ModuleCard.scss';

const ModuleCard = ({ module, actionText, actionPath }) => {
  const { title, description, status, progressPercentage, estimatedDuration, domainName } = module;
  
  // Function to render status badge based on status
  const renderStatusBadge = (status) => {
    const statusMap = {
      'COMPLETED': { className: 'completed', label: 'Completed' },
      'IN_PROGRESS': { className: 'in-progress', label: 'In Progress' },
      'NOT_STARTED': { className: 'not-started', label: 'Not Started' },
    };
    
    const { className, label } = statusMap[status] || { className: '', label: status };
    
    return <span className={`status-badge ${className}`}>{label}</span>;
  };

  return (
    <div className="module-card">
      <div className="module-content">
        <div className="module-header">
          <h3>{title}</h3>
          {renderStatusBadge(status)}
        </div>
        
        <p className="module-description">{description}</p>
        
        <div className="module-details">
          <div className="detail-item">
            <span className="detail-icon">📚</span>
            <span className="detail-text">{domainName}</span>
          </div>
          <div className="detail-item">
            <span className="detail-icon">⏱️</span>
            <span className="detail-text">{estimatedDuration} min</span>
          </div>
        </div>

        {status === 'IN_PROGRESS' && (
          <div className="progress-container">
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
            <span className="progress-text">{progressPercentage}% complete</span>
          </div>
        )}
      </div>
      
      <div className="module-actions">
        <Link to={actionPath} className="action-button">
          {actionText || (status === 'NOT_STARTED' ? 'Start' : status === 'IN_PROGRESS' ? 'Continue' : 'View')}
        </Link>
      </div>
    </div>
  );
};

export default ModuleCard;