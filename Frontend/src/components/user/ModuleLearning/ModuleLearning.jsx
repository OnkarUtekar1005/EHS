import React, { useState, useEffect } from 'react';
import Button from '../../common/Button';
import VideoPlayer from './VideoPlayer';
import PptViewer from './PptViewer';
//import './ModuleLearning.scss';

const ModuleLearning = ({ content, onComplete }) => {
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [completed, setCompleted] = useState(false);
  
  useEffect(() => {
    // Simulate content loading
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1500);
    
    return () => clearTimeout(timer);
  }, []);
  
  const handleProgressUpdate = (newProgress) => {
    setProgress(newProgress);
    
    // Mark as completed when progress reaches 100%
    if (newProgress >= 100 && !completed) {
      setCompleted(true);
    }
  };
  
  const renderContentViewer = () => {
    switch (content.contentType) {
      case 'video':
        return (
          <VideoPlayer
            src={content.url}
            onProgressUpdate={handleProgressUpdate}
          />
        );
      case 'presentation':
        return (
          <PptViewer
            url={content.url}
            onProgressUpdate={handleProgressUpdate}
          />
        );
      case 'document':
        return (
          <iframe
            src={`${content.url}#toolbar=0`}
            className="pdf-viewer"
            title="PDF Document"
            onLoad={() => handleProgressUpdate(50)}
          />
        );
      default:
        return (
          <div className="text-content">
            <p>{content.description || 'No content available'}</p>
          </div>
        );
    }
  };
  
  return (
    <div className="module-learning-container">
      <h2>{content.title}</h2>
      
      {loading ? (
        <div className="loading-content">Loading learning content...</div>
      ) : (
        <>
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${progress}%` }}
            />
            <span className="progress-text">{progress}% Complete</span>
          </div>
          
          <div className="content-container">
            {renderContentViewer()}
          </div>
          
          <div className="learning-footer">
            <Button
              onClick={onComplete}
              disabled={!completed}
              className="continue-button"
            >
              {completed ? 'Continue to Post-Assessment' : 'Please Complete the Module'}
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

export default ModuleLearning;