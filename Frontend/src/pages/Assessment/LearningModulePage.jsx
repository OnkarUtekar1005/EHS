// src/pages/Assessment/LearningModulePage.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './LearningModulePage.scss';

// Import common components
import LoadingSpinner from '../../components/common/LoadingSpinner/LoadingSpinner';

const LearningModulePage = () => {
  const { moduleId } = useParams();
  const navigate = useNavigate();
  
  const [moduleInfo, setModuleInfo] = useState(null);
  const [learningMaterial, setLearningMaterial] = useState(null);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [slidesCompleted, setSlidesCompleted] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isCompletingModule, setIsCompletingModule] = useState(false);
  
  // Ref for video player
  const videoRef = useRef(null);

  // Fetch module data
  useEffect(() => {
    const fetchModuleData = async () => {
      setIsLoading(true);
      setError('');
      
      try {
        // Fetch module info
        const moduleResponse = await axios.get(`/api/modules/${moduleId}`);
        setModuleInfo(moduleResponse.data);
        
        // Fetch learning material
        const materialId = moduleResponse.data.learningMaterialId;
        const materialResponse = await axios.get(`/api/materials/${materialId}`);
        setLearningMaterial(materialResponse.data);
        
        // Initialize slides completed array
        if (materialResponse.data.slides) {
          setSlidesCompleted(new Array(materialResponse.data.slides.length).fill(false));
        }
        
      } catch (err) {
        console.error('Error fetching module data:', err);
        setError('Failed to load learning materials. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchModuleData();
  }, [moduleId]);

  // Handle slide change
  const handleSlideChange = (index) => {
    // Mark current slide as completed
    setSlidesCompleted(prev => {
      const updated = [...prev];
      updated[currentSlideIndex] = true;
      return updated;
    });
    
    // Change to selected slide
    setCurrentSlideIndex(index);
  };

  // Handle video progress
  const handleVideoProgress = () => {
    if (videoRef.current && videoRef.current.currentTime > 0) {
      const videoProgress = videoRef.current.currentTime / videoRef.current.duration;
      
      // Mark slide as completed if video watched at least 90%
      if (videoProgress >= 0.9) {
        setSlidesCompleted(prev => {
          const updated = [...prev];
          updated[currentSlideIndex] = true;
          return updated;
        });
      }
    }
  };

  // Handle next slide
  const handleNextSlide = () => {
    if (currentSlideIndex < learningMaterial.slides.length - 1) {
      handleSlideChange(currentSlideIndex + 1);
    }
  };

  // Handle previous slide
  const handlePreviousSlide = () => {
    if (currentSlideIndex > 0) {
      handleSlideChange(currentSlideIndex - 1);
    }
  };

  // Complete learning module and proceed to post-assessment
  const completeModule = async () => {
    if (isCompletingModule) return;
    
    setIsCompletingModule(true);
    setError('');
    
    try {
      await axios.post(`/api/modules/${moduleId}/complete-learning`);
      
      // Navigate to post-assessment
      navigate(`/assessments/${moduleId}/post-assessment`);
      
    } catch (err) {
      console.error('Error completing module:', err);
      setError('Failed to complete learning module. Please try again.');
      setIsCompletingModule(false);
    }
  };

  // Check if all slides have been viewed
  const areAllSlidesCompleted = () => {
    return slidesCompleted.every(completed => completed);
  };

  // Render current slide content
  const renderSlideContent = () => {
    if (!learningMaterial || !learningMaterial.slides || learningMaterial.slides.length === 0) {
      return <div className="no-content">No learning content available.</div>;
    }
    
    const currentSlide = learningMaterial.slides[currentSlideIndex];
    
    switch (currentSlide.type) {
      case 'VIDEO':
        return (
          <div className="video-container">
            <video
              ref={videoRef}
              controls
              onTimeUpdate={handleVideoProgress}
              poster={currentSlide.thumbnail}
              className="video-player"
            >
              <source src={currentSlide.filePath} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </div>
        );
        
      case 'IMAGE':
        return (
          <div className="image-container">
            <img 
              src={currentSlide.filePath} 
              alt={currentSlide.title || 'Learning material image'} 
              className="slide-image"
            />
          </div>
        );
        
      case 'TEXT':
        return (
          <div className="text-container">
            <div 
              className="slide-text"
              dangerouslySetInnerHTML={{ __html: currentSlide.content }}
            ></div>
          </div>
        );
        
      case 'PDF':
        return (
          <div className="pdf-container">
            <iframe
              src={`${currentSlide.filePath}#toolbar=0`}
              title={currentSlide.title || 'PDF document'}
              className="pdf-viewer"
            ></iframe>
          </div>
        );
        
      default:
        return <div className="no-content">Unsupported content type.</div>;
    }
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="learning-module-page">
      {error && <div className="error-message">{error}</div>}
      
      <div className="learning-header">
        <h1>{moduleInfo?.title}</h1>
        <p className="module-description">{moduleInfo?.description}</p>
        
        <div className="progress-tracker">
          <div className="progress-text">
            Slide {currentSlideIndex + 1} of {learningMaterial?.slides?.length || 0}
          </div>
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ 
                width: `${((currentSlideIndex + 1) / (learningMaterial?.slides?.length || 1)) * 100}%` 
              }}
            ></div>
          </div>
        </div>
      </div>
      
      <div className="learning-content">
        <div className="content-sidebar">
          <div className="slide-list">
            <h3>Contents</h3>
            <ul>
              {learningMaterial?.slides?.map((slide, index) => (
                <li 
                  key={index}
                  className={`slide-item ${currentSlideIndex === index ? 'active' : ''} ${slidesCompleted[index] ? 'completed' : ''}`}
                  onClick={() => handleSlideChange(index)}
                >
                  <div className="slide-indicator">
                    {slidesCompleted[index] ? (
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16">
                        <circle cx="12" cy="12" r="10" fill="#4A90E2" />
                        <path d="M9 12l2 2 4-4" stroke="white" strokeWidth="2" fill="none" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16">
                        <circle cx="12" cy="12" r="10" stroke="#ccc" strokeWidth="2" fill="none" />
                      </svg>
                    )}
                  </div>
                  <span className="slide-title">{slide.title || `Slide ${index + 1}`}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
        
        <div className="content-main">
          <div className="slide-content">
            <div className="slide-title">
              <h2>{learningMaterial?.slides?.[currentSlideIndex]?.title || `Slide ${currentSlideIndex + 1}`}</h2>
            </div>
            
            {renderSlideContent()}
          </div>
          
          <div className="navigation-controls">
            <button 
              className="nav-button previous"
              onClick={handlePreviousSlide}
              disabled={currentSlideIndex === 0}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="19" y1="12" x2="5" y2="12"></line>
                <polyline points="12 19 5 12 12 5"></polyline>
              </svg>
              Previous
            </button>
            
            {currentSlideIndex < (learningMaterial?.slides?.length - 1) ? (
              <button 
                className="nav-button next"
                onClick={handleNextSlide}
              >
                Next
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                  <polyline points="12 5 19 12 12 19"></polyline>
                </svg>
              </button>
            ) : (
              <button 
                className="nav-button complete"
                onClick={completeModule}
                disabled={!areAllSlidesCompleted() || isCompletingModule}
              >
                {isCompletingModule ? 'Completing...' : 'Complete & Continue'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LearningModulePage;