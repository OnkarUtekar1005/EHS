import React from 'react';
import './ProgressBar.scss';

const ProgressBar = ({ percentage, color, size }) => {
  // Ensure percentage is within 0-100 range
  const validPercentage = Math.min(Math.max(percentage || 0, 0), 100);
  
  return (
    <div className={`progress-bar ${size || ''}`}>
      <div 
        className="progress-fill" 
        style={{ 
          width: `${validPercentage}%`,
          backgroundColor: color || '#3498db'
        }}
      ></div>
    </div>
  );
};

export default ProgressBar;