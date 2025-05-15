// src/components/learning/LearningMaterialViewer.js
import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Card, CardContent, CardActions, 
  Button, CircularProgress, Alert, Divider,
  ListItemIcon, Chip
} from '@mui/material';
import {
  PictureAsPdf, VideoLibrary, Description, Link, Image,
  Article, CheckCircle, Done, InsertDriveFile
} from '@mui/icons-material';
import { learningMaterialService } from '../../services/api';
import EnhancedMaterialViewer from './EnhancedMaterialViewer';

/**
 * LearningMaterialViewer
 * This component has been updated to use the EnhancedMaterialViewer for file rendering
 * while maintaining its original API for backward compatibility.
 */
const LearningMaterialViewer = ({ materialId, showControls = true, onComplete }) => {
  const [material, setMaterial] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewerMode, setViewerMode] = useState(false);
  
  useEffect(() => {
    if (!materialId) {
      setLoading(false);
      return;
    }
    
    const fetchMaterial = async () => {
      try {
        setLoading(true);
        const response = await learningMaterialService.getMaterialWithProgress(materialId);
        
        if (response && response.data) {
          console.log("Fetched material:", response.data);
          setMaterial({
            ...response.data,
            progress: response.data.progress || 0,
            completed: response.data.completed || false
          });
        } else {
          setMaterial(null);
          setError("No material data received.");
        }
      } catch (err) {
        console.error("Error fetching material:", err);
        setError("Failed to load material. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    
    fetchMaterial();
  }, [materialId]);
  
  // Update material progress
  const updateProgress = async (materialId, data = { progress: 100 }) => {
    if (!material || !material.id) return;
    
    const progress = data.progress || 100;
    
    try {
      await learningMaterialService.updateProgress(material.id, {
        progress: progress,
        timeSpent: data.timeSpent || 1 // Default time spent
      });
      
      // Update local state
      setMaterial(prevMaterial => ({
        ...prevMaterial,
        progress: progress,
        completed: progress >= 100
      }));
      
      // Call completion callback if needed
      if (progress >= 100 && onComplete) {
        onComplete(material.id, { completed: true });
      }
    } catch (err) {
      console.error("Error updating material progress:", err);
      console.warn("Progress tracking failed but content viewing will continue");
      
      // Update local state anyway for better UX
      setMaterial(prevMaterial => ({
        ...prevMaterial,
        progress: progress,
        completed: progress >= 100
      }));
    }
  };
  
  // Handle material completion
  const handleComplete = () => {
    updateProgress(material.id, { progress: 100 });
  };
  
  // Get appropriate icon for material type
  const getMaterialIcon = () => {
    if (!material || !material.fileType) return <InsertDriveFile />;
    
    const type = material.fileType.toUpperCase();
    if (type === 'PDF') return <PictureAsPdf />;
    if (type === 'VIDEO' || type === 'MP4') return <VideoLibrary />;
    if (type === 'DOCUMENT' || type === 'DOC' || type === 'DOCX') return <Description />;
    if (type === 'IMAGE' || type === 'JPG' || type === 'PNG' || type === 'JPEG') return <Image />;
    if (type === 'HTML' || type === 'CONTENT') return <Article />;
    if (type === 'EXTERNAL') return <Link />;
    
    return <InsertDriveFile />;
  };
  
  // Toggle viewer mode
  const toggleViewerMode = () => {
    setViewerMode(!viewerMode);
  };
  
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }
  
  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }
  
  if (!material) {
    return <Alert severity="info">No material found.</Alert>;
  }
  
  // Display in enhanced viewer mode
  if (viewerMode) {
    return (
      <Box>
        <Button 
          variant="outlined" 
          size="small" 
          onClick={toggleViewerMode}
          sx={{ mb: 2 }}
        >
          Back to Standard View
        </Button>
        
        <EnhancedMaterialViewer 
          material={material}
          onComplete={updateProgress}
          onError={(err) => console.error("Error in material viewer:", err)}
        />
      </Box>
    );
  }
  
  // Standard card view with button to launch enhanced viewer
  return (
    <Box>
      <Card variant="outlined">
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <ListItemIcon>
              {getMaterialIcon()}
            </ListItemIcon>
            <Box>
              <Typography variant="h6">{material.title}</Typography>
              {material.description && (
                <Typography variant="body2" color="text.secondary">
                  {material.description}
                </Typography>
              )}
            </Box>
            {material.completed && (
              <Chip 
                icon={<CheckCircle />}
                label="Completed"
                color="success"
                size="small"
                sx={{ ml: 'auto' }}
              />
            )}
          </Box>
          
          <Divider sx={{ mb: 2 }} />
          
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <Button 
              variant="contained"
              onClick={toggleViewerMode}
            >
              View Material
            </Button>
          </Box>
        </CardContent>
        
        {showControls && (
          <CardActions sx={{ justifyContent: 'flex-end' }}>
            {!material.completed && (
              <Button 
                variant="contained"
                color="primary"
                endIcon={<Done />}
                onClick={handleComplete}
              >
                Mark as Completed
              </Button>
            )}
          </CardActions>
        )}
      </Card>
    </Box>
  );
};

export default LearningMaterialViewer;