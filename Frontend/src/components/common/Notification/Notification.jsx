import React, { useEffect } from 'react';
//import './Notification.scss';

const Notification = ({ 
  id,
  message, 
  type = 'info', 
  onClose,
  autoClose = true,
  duration = 5000
}) => {
  useEffect(() => {
    if (autoClose) {
      const timer = setTimeout(() => {
        onClose(id);
      }, duration);
      
      return () => clearTimeout(timer);
    }
  }, [id, onClose, autoClose, duration]);
  
  return (
    <div className={`notification notification-${type}`}>
      <div className="notification-content">
        <span className="message">{message}</span>
      </div>
      <button className="close-button" onClick={() => onClose(id)}>
        ×
      </button>
    </div>
  );
};

export default Notification;