// src/components/learning/LearningMaterialViewer.js
import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Card, CardContent, CardActions, 
  Button, CircularProgress, Alert, Divider,
  List, ListItemIcon, ListItemText, Chip, Paper
} from '@mui/material';
import {
  PictureAsPdf, VideoLibrary, Description, Link, Image,
  Article, CheckCircle, Done, InsertDriveFile
} from '@mui/icons-material';
import { learningMaterialService } from '../../services/api';

const LearningMaterialViewer = ({ materialId, showControls = true, onComplete }) => {
  const [material, setMaterial] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
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
  const updateProgress = async (progress = 100) => {
    if (!material || !material.id) return;
    
    try {
      await learningMaterialService.updateProgress(material.id, {
        progress: progress,
        timeSpent: 1 // Default time spent
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
      setError("Failed to update progress. Please try again.");
    }
  };
  
  // Handle material completion
  const handleComplete = () => {
    updateProgress(100);
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
  
  // Render material content based on type
  const renderMaterialContent = () => {
    if (material.content) {
      return (
        <Paper elevation={0} sx={{ p: 2 }}>
          <div dangerouslySetInnerHTML={{ __html: material.content }} />
        </Paper>
      );
    }
    
    if (material.externalUrl) {
      return (
        <Box>
          <Alert severity="info" sx={{ mb: 2 }}>
            This material links to an external resource. Click the button below to view it.
          </Alert>
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <Button 
              variant="contained"
              onClick={() => {
                window.open(material.externalUrl, '_blank', 'noopener,noreferrer');
                updateProgress();
              }}
            >
              Open External Link
            </Button>
          </Box>
        </Box>
      );
    }
    
    if (material.filePath) {
      const fileType = material.fileType?.toUpperCase();
      // Ensure we're constructing the URL correctly
      const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:8080';
      const fileUrl = `${baseUrl}/api/materials/${material.id}/stream`;
      
      console.log("File URL for streaming:", fileUrl);
      
      if (fileType === 'PDF') {
        return (
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
              <Button 
                variant="contained"
                onClick={() => {
                  window.open(fileUrl, '_blank', 'noopener,noreferrer');
                  updateProgress();
                }}
              >
                Open PDF in New Tab
              </Button>
            </Box>
            <Box sx={{ height: '70vh', width: '100%', border: '1px solid #ddd' }}>
              <iframe 
                src={fileUrl}
                style={{ width: '100%', height: '100%', border: 'none' }}
                title={material.title}
                onLoad={() => updateProgress(50)}
              />
            </Box>
          </Box>
        );
      }
      
      if (fileType === 'VIDEO' || fileType === 'MP4') {
        return (
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <video 
              controls 
              autoPlay
              width="100%"
              style={{ maxHeight: '70vh' }}
              onEnded={() => updateProgress()}
            >
              <source src={fileUrl} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </Box>
        );
      }
      
      if (fileType === 'IMAGE' || fileType === 'JPG' || fileType === 'JPEG' || fileType === 'PNG' || fileType === 'GIF') {
        return (
          <Box sx={{ display: 'flex', justifyContent: 'center' }} onClick={() => updateProgress()}>
            <img 
              src={fileUrl}
              alt={material.title}
              style={{ maxWidth: '100%', maxHeight: '70vh' }}
            />
          </Box>
        );
      }
      
      if (fileType === 'DOCUMENT' || fileType === 'DOC' || fileType === 'DOCX') {
        return (
          <Box>
            <Alert severity="info" sx={{ mb: 2 }}>
              This document may not display properly in the browser. Click the button below to open it in a new tab.
            </Alert>
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <Button 
                variant="contained"
                onClick={() => {
                  window.open(fileUrl, '_blank', 'noopener,noreferrer');
                  updateProgress();
                }}
              >
                Open Document
              </Button>
            </Box>
          </Box>
        );
      }
      
      // Generic file download for other types
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <Button 
            variant="contained"
            onClick={() => {
              window.open(fileUrl, '_blank', 'noopener,noreferrer');
              updateProgress();
            }}
          >
            Download File
          </Button>
        </Box>
      );
    }
    
    return <Typography>No viewable content available for this material.</Typography>;
  };
  
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
          
          {renderMaterialContent()}
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