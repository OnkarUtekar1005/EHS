// src/components/learning/LearningMaterialViewer.js
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  CardActions,
  Divider,
  LinearProgress,
  IconButton,
  Grid,
  Paper,
  Tooltip
} from '@mui/material';
import {
  OpenInNew as OpenInNewIcon,
  PlayArrow as PlayArrowIcon,
  Pause as PauseIcon,
  SkipNext as SkipNextIcon,
  ArrowBack as ArrowBackIcon,
  CheckCircle as CheckCircleIcon,
  Description as DescriptionIcon,
  VideoLibrary as VideoIcon,
  Slideshow as SlideshowIcon,
  Image as ImageIcon,
  Link as LinkIcon,
  PictureAsPdf as PdfIcon,
  Article as ArticleIcon
} from '@mui/icons-material';
import { learningMaterialService } from '../../services/learningMaterialService';

const LearningMaterialViewer = ({ 
  componentId, 
  initialMaterials = [], 
  onComplete,
  onBack
}) => {
  // State
  const [materials, setMaterials] = useState(initialMaterials);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const [completed, setCompleted] = useState(false);
  
  // Get the current material
  const currentMaterial = materials[currentIndex] || null;
  
  // Fetch materials if not provided
  useEffect(() => {
    if (initialMaterials.length === 0 && componentId) {
      fetchMaterials();
    }
  }, [componentId, initialMaterials]);
  
  // Handle timer for tracking elapsed time
  useEffect(() => {
    let timer;
    if (timerActive) {
      timer = setInterval(() => {
        setElapsedTime(prevTime => prevTime + 1);
      }, 1000);
    }
    
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [timerActive]);
  
  // Start timer when a material is loaded
  useEffect(() => {
    if (currentMaterial) {
      setTimerActive(true);
      
      // Check if material is already completed
      if (currentMaterial.completed) {
        setCompleted(true);
      } else {
        setCompleted(false);
        
        // Initialize progress if available
        if (currentMaterial.progress !== undefined) {
          setProgress(currentMaterial.progress);
        } else {
          setProgress(0);
        }
        
        // Initialize elapsed time if available
        if (currentMaterial.timeSpent !== undefined) {
          setElapsedTime(currentMaterial.timeSpent);
        } else {
          setElapsedTime(0);
        }
      }
    }
    
    return () => {
      setTimerActive(false);
    };
  }, [currentMaterial]);
  
  // Fetch materials from API
  const fetchMaterials = async () => {
    try {
      setLoading(true);
      const response = await learningMaterialService.getMaterialsWithProgress(componentId);
      setMaterials(response.data);
    } catch (err) {
      console.error('Error fetching materials:', err);
      setError('Failed to load learning materials.');
    } finally {
      setLoading(false);
    }
  };
  
  // Mark current material as completed
  const handleComplete = async () => {
    if (!currentMaterial) return;
    
    try {
      setLoading(true);
      
      // Prepare progress data
      const progressData = {
        progress: 100,
        timeSpent: elapsedTime
      };
      
      // Update progress on server
      await learningMaterialService.updateProgress(currentMaterial.id, progressData);
      
      // Update local state
      const updatedMaterials = [...materials];
      updatedMaterials[currentIndex] = {
        ...updatedMaterials[currentIndex],
        progress: 100,
        timeSpent: elapsedTime,
        completed: true
      };
      
      setMaterials(updatedMaterials);
      setCompleted(true);
      
      // Check if all materials are completed
      const allCompleted = updatedMaterials.every(m => m.completed);
      if (allCompleted && onComplete) {
        onComplete();
      }
    } catch (err) {
      console.error('Error updating progress:', err);
      setError('Failed to mark material as completed.');
    } finally {
      setLoading(false);
    }
  };
  
  // Update progress periodically
  const updateProgress = async () => {
    if (!currentMaterial || completed) return;
    
    try {
      // Calculate progress based on elapsed time and estimated duration
      const estimatedDuration = currentMaterial.estimatedDuration || 5; // Default 5 minutes
      const calculatedProgress = Math.min(
        Math.round((elapsedTime / (estimatedDuration * 60)) * 100),
        99 // Cap at 99% until user explicitly marks as complete
      );
      
      // Only update if progress has changed significantly
      if (Math.abs(calculatedProgress - progress) >= 5) {
        setProgress(calculatedProgress);
        
        // Prepare progress data
        const progressData = {
          progress: calculatedProgress,
          timeSpent: elapsedTime
        };
        
        // Update progress on server
        await learningMaterialService.updateProgress(currentMaterial.id, progressData);
        
        // Update local state
        const updatedMaterials = [...materials];
        updatedMaterials[currentIndex] = {
          ...updatedMaterials[currentIndex],
          progress: calculatedProgress,
          timeSpent: elapsedTime
        };
        
        setMaterials(updatedMaterials);
      }
    } catch (err) {
      console.error('Error updating progress:', err);
    }
  };
  
  // Update progress every minute
  useEffect(() => {
    if (elapsedTime > 0 && elapsedTime % 60 === 0) {
      updateProgress();
    }
  }, [elapsedTime]);
  
  // Navigate to next material
  const handleNext = () => {
    if (currentIndex < materials.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else if (onComplete) {
      onComplete();
    }
  };
  
  // Navigate to previous material
  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    } else if (onBack) {
      onBack();
    }
  };
  
  // Format time display
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };
  
  // Render appropriate content based on material type
  const renderMaterialContent = () => {
    if (!currentMaterial) return null;
    
    switch (currentMaterial.fileType) {
      case 'PDF':
        return (
          <Box sx={{ height: 600, width: '100%', overflow: 'auto' }}>
            <iframe 
              src={`/api/materials/${currentMaterial.id}/stream`}
              title={currentMaterial.title}
              width="100%"
              height="100%"
              style={{ border: 'none' }}
            />
          </Box>
        );
      
      case 'VIDEO':
        return (
          <Box sx={{ width: '100%', aspectRatio: '16/9', backgroundColor: '#000' }}>
            {currentMaterial.externalUrl ? (
              <iframe 
                src={currentMaterial.externalUrl}
                title={currentMaterial.title}
                width="100%"
                height="100%"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <video
                src={`/api/materials/${currentMaterial.id}/stream`}
                controls
                width="100%"
                height="100%"
                onPlay={() => setTimerActive(true)}
                onPause={() => setTimerActive(false)}
              >
                Your browser does not support the video tag.
              </video>
            )}
          </Box>
        );
      
      case 'PRESENTATION':
        return (
          <Box sx={{ height: 600, width: '100%', overflow: 'auto' }}>
            <iframe 
              src={`/api/materials/${currentMaterial.id}/stream`}
              title={currentMaterial.title}
              width="100%"
              height="100%"
              style={{ border: 'none' }}
            />
          </Box>
        );
      
      case 'DOCUMENT':
        return (
          <Box sx={{ height: 600, width: '100%', overflow: 'auto' }}>
            <iframe 
              src={`/api/materials/${currentMaterial.id}/stream`}
              title={currentMaterial.title}
              width="100%"
              height="100%"
              style={{ border: 'none' }}
            />
          </Box>
        );
      
      case 'HTML':
        return (
          <Box sx={{ p: 2, border: '1px solid #ddd', borderRadius: 1 }}>
            <div dangerouslySetInnerHTML={{ __html: currentMaterial.content }} />
          </Box>
        );
      
      case 'IMAGE':
        return (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
            <img 
              src={`/api/materials/${currentMaterial.id}/stream`}
              alt={currentMaterial.title}
              style={{ maxWidth: '100%', maxHeight: '600px' }}
            />
          </Box>
        );
      
      case 'EXTERNAL':
        return (
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="body1" paragraph>
              This material is hosted externally. Click the button below to access it.
            </Typography>
            <Button
              variant="contained"
              color="primary"
              startIcon={<OpenInNewIcon />}
              href={currentMaterial.externalUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              Open External Content
            </Button>
          </Box>
        );
      
      default:
        return (
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="body1">
              This material type is not supported for preview.
            </Typography>
          </Box>
        );
    }
  };
  
  // Get icon for material type
  const getMaterialIcon = (type) => {
    switch (type) {
      case 'PDF':
        return <PdfIcon />;
      case 'VIDEO':
        return <VideoIcon />;
      case 'PRESENTATION':
        return <SlideshowIcon />;
      case 'DOCUMENT':
        return <DescriptionIcon />;
      case 'HTML':
        return <ArticleIcon />;
      case 'IMAGE':
        return <ImageIcon />;
      case 'EXTERNAL':
        return <LinkIcon />;
      default:
        return <DescriptionIcon />;
    }
  };
  
  // Loading state
  if (loading && materials.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
        <CircularProgress />
      </Box>
    );
  }
  
  // Error state
  if (error && materials.length === 0) {
    return (
      <Alert severity="error">{error}</Alert>
    );
  }
  
  // No materials
  if (materials.length === 0) {
    return (
      <Alert severity="info">
        No learning materials available for this component.
      </Alert>
    );
  }
  
  return (
    <Box>
      {/* Materials Progress Bar */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
          <Typography variant="subtitle1">
            Progress: {currentIndex + 1} of {materials.length} materials
          </Typography>
          <Typography variant="body2">
            Time Spent: {formatTime(elapsedTime)}
          </Typography>
        </Box>
        
        <LinearProgress 
          variant="determinate" 
          value={(currentIndex / materials.length) * 100} 
          sx={{ height: 8, borderRadius: 4 }}
        />
        
        <Box display="flex" mt={2}>
          {materials.map((material, index) => (
            <Tooltip key={index} title={material.title}>
              <Box
                sx={{
                  width: `${100 / materials.length}%`,
                  p: 0.5,
                  cursor: 'pointer'
                }}
                onClick={() => setCurrentIndex(index)}
              >
                <Paper
                  elevation={index === currentIndex ? 3 : 1}
                  sx={{
                    p: 1,
                    textAlign: 'center',
                    bgcolor: index === currentIndex ? 'primary.light' : 
                            material.completed ? 'success.light' : 'background.paper',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {getMaterialIcon(material.fileType)}
                  {material.completed && (
                    <CheckCircleIcon 
                      color="success" 
                      fontSize="small" 
                      sx={{ ml: 1 }}
                    />
                  )}
                </Paper>
              </Box>
            </Tooltip>
          ))}
        </Box>
      </Paper>
      
      {/* Current Material */}
      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" alignItems="center" mb={2}>
            {getMaterialIcon(currentMaterial.fileType)}
            <Typography variant="h5" component="div" sx={{ ml: 1 }}>
              {currentMaterial.title}
            </Typography>
          </Box>
          
          {currentMaterial.description && (
            <Typography variant="body2" color="text.secondary" paragraph>
              {currentMaterial.description}
            </Typography>
          )}
          
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="body2" color="text.secondary">
              Estimated Duration: {currentMaterial.estimatedDuration || 5} minutes
            </Typography>
            
            <Box display="flex" alignItems="center">
              <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
                Your Progress:
              </Typography>
              <Box sx={{ width: 100, mr: 1 }}>
                <LinearProgress 
                  variant="determinate" 
                  value={completed ? 100 : progress} 
                  color={completed ? "success" : "primary"}
                />
              </Box>
              <Typography variant="body2" color="text.secondary">
                {completed ? '100%' : `${progress}%`}
              </Typography>
            </Box>
          </Box>
          
          <Divider sx={{ my: 2 }} />
          
          {/* Material Content */}
          {renderMaterialContent()}
        </CardContent>
        
        <CardActions sx={{ justifyContent: 'space-between', p: 2 }}>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={handlePrevious}
            disabled={loading}
          >
            {currentIndex === 0 ? 'Back' : 'Previous'}
          </Button>
          
          <Box>
            {!completed ? (
              <Button
                variant="contained"
                color="primary"
                onClick={handleComplete}
                disabled={loading}
                startIcon={<CheckCircleIcon />}
              >
                {loading ? <CircularProgress size={24} /> : 'Mark as Completed'}
              </Button>
            ) : (
              <Button
                variant="contained"
                color="success"
                startIcon={<CheckCircleIcon />}
                disabled
              >
                Completed
              </Button>
            )}
          </Box>
          
          <Button
            variant="contained"
            endIcon={<SkipNextIcon />}
            onClick={handleNext}
            disabled={loading}
          >
            {currentIndex === materials.length - 1 ? 'Finish' : 'Next'}
          </Button>
        </CardActions>
      </Card>
    </Box>
  );
};

export default LearningMaterialViewer;