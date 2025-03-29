import React, { useState, useEffect } from 'react';
import Button from '../../common/Button';

const PptViewer = ({ url, onProgressUpdate }) => {
  const [currentSlide, setCurrentSlide] = useState(1);
  const [totalSlides, setTotalSlides] = useState(10); // Default value, would be set from API
  const [loaded, setLoaded] = useState(false);
  
  useEffect(() => {
    // Simulate loading slides
    setTimeout(() => {
      setLoaded(true);
    }, 1000);
    
    // In a real app, you would fetch the presentation data
    // and set the total slides count here
  }, [url]);
  
  useEffect(() => {
    if (loaded) {
      const progress = Math.round((currentSlide / totalSlides) * 100);
      onProgressUpdate(progress);
    }
  }, [currentSlide, totalSlides, loaded, onProgressUpdate]);
  
  const handlePrevious = () => {
    if (currentSlide > 1) {
      setCurrentSlide(currentSlide - 1);
    }
  };
  
  const handleNext = () => {
    if (currentSlide < totalSlides) {
      setCurrentSlide(currentSlide + 1);
    }
  };
  
  if (!loaded) {
    return <div className="loading-slides">Loading slides...</div>;
  }
  
  return (
    <div className="ppt-viewer-container">
      <div className="slide-container">
        {/* In a real implementation, this would show the actual slide content */}
        <img 
          src={`${url}/slide-${currentSlide}`} 
          alt={`Slide ${currentSlide}`}
          onError={(e) => {
            // Fallback for demo purposes
            e.target.src = "/assets/images/placeholder.png";
          }}
          className="slide-image"
        />
      </div>
      
      <div className="slide-controls">
        <Button
          onClick={handlePrevious}
          disabled={currentSlide === 1}
          variant="secondary"
        >
          Previous
        </Button>
        
        <div className="slide-info">
          Slide {currentSlide} of {totalSlides}
        </div>
        
        <Button
          onClick={handleNext}
          disabled={currentSlide === totalSlides}
        >
          Next
        </Button>
      </div>
    </div>
  );
};

export default PptViewer;