import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../../common/Button';
//import './TrainingCard.scss';

const TrainingCard = ({ training }) => {
  const { id, title, description, domain, duration, completionStatus } = training;
  
  const getStatusLabel = () => {
    switch (completionStatus) {
      case 'completed':
        return 'Completed';
      case 'in_progress':
        return 'In Progress';
      case 'not_started':
      default:
        return 'Not Started';
    }
  };
  
  const getStatusClass = () => {
    switch (completionStatus) {
      case 'completed':
        return 'status-completed';
      case 'in_progress':
        return 'status-in-progress';
      case 'not_started':
      default:
        return 'status-not-started';
    }
  };
  
  return (
    <div className="training-card">
      <div 
        className="card-image"
        style={{ backgroundImage: `url(/assets/images/${domain}.jpg)` }}
      />
      <div className="card-content">
        <h3>{title}</h3>
        <p className="description">{description}</p>
        <div className="meta-info">
          <div className="duration">
            <span className="icon">⏱️</span>
            <span>{duration} min</span>
          </div>
          <div className={`status ${getStatusClass()}`}>
            {getStatusLabel()}
          </div>
        </div>
      </div>
      <div className="card-footer">
        <Link to={`/training/${id}`}>
          <Button className="start-button">
            {completionStatus === 'in_progress' ? 'Continue' : 'Start Training'}
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default TrainingCard;