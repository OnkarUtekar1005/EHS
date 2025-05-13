// src/components/learning/LearningMaterialViewer.js
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Card,
  CardContent,
  CardActions,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  CircularProgress,
  LinearProgress,
  Alert,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton
} from '@mui/material';
import {
  Description as DocumentIcon,
  OndemandVideo as VideoIcon,
  Link as LinkIcon,
  Code as CodeIcon,
  Image as ImageIcon,
  Article as ArticleIcon,
  Slideshow as PresentationIcon,
  ArrowBack as ArrowBackIcon,
  Done as DoneIcon,
  CheckCircle as CheckCircleIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { learningMaterialService } from '../../services/api';

const LearningMaterialViewer = ({ componentId, initialMaterials = [], onComplete, onBack }) => {
  const [materials, setMaterials] = useState(initialMaterials);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [activeMaterial, setActiveMaterial] = useState(null);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'view'
  const [contentDialogOpen, setContentDialogOpen] = useState(false);
  
  // Load materials if not provided
  useEffect(() => {
    if (initialMaterials && initialMaterials.length > 0) {
      setMaterials(initialMaterials);
      setActiveMaterial(initialMaterials[0]);
      return;
    }
    
    const fetchMaterials = async () => {
      if (!componentId) return;
      
      try {
        setLoading(true);
        const response = await learningMaterialService.getMaterialsWithProgress(componentId);
        setMaterials(response.data);
        
        if (response.data.length > 0) {
          setActiveMaterial(response.data[0]);
        }
      } catch (err) {
        console.error('Error fetching learning materials:', err);
        setError('Failed to load learning materials. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchMaterials();
  }, [componentId, initialMaterials]);
  
  // Update material progress
  const updateMaterialProgress = async (materialId, progress = 100) => {
    try {
      await learningMaterialService.updateProgress(materialId, {
        progress: progress,
        timeSpent: 5 // Default time spent (5 minutes)
      });
      
      // Update local state to reflect progress
      setMaterials(materials.map(material => 
        material.id === materialId 
          ? { ...material, progress: progress, completed: progress >= 100 } 
          : material
      ));
    } catch (err) {
      console.error('Error updating progress:', err);
    }
  };
  
  // View material
  const handleViewMaterial = (material, index) => {
    setActiveMaterial(material);
    setActiveIndex(index);
    setViewMode('view');
    
    // If it's an external link or file, also open it
    if (material.externalUrl) {
      window.open(material.externalUrl, '_blank');
      updateMaterialProgress(material.id);
    } else if (material.filePath) {
      window.open(`/api/materials/${material.id}/stream`, '_blank');
      updateMaterialProgress(material.id);
    } else if (material.content) {
      setContentDialogOpen(true);
    }
  };
  
  // Go back to list view
  const handleBackToList = () => {
    setViewMode('list');
  };
  
  // Mark material as completed
  const handleMarkCompleted = async (materialId) => {
    await updateMaterialProgress(materialId);
  };
  
  // Check if all materials are completed
  const checkAllCompleted = () => {
    return materials.every(material => material.completed);
  };
  
  // Mark all as completed and complete component
  const handleCompleteAll = () => {
    // Mark any incomplete materials as completed
    const incompleteMaterials = materials.filter(m => !m.completed);
    
    incompleteMaterials.forEach(material => {
      updateMaterialProgress(material.id);
    });
    
    if (onComplete) {
      onComplete();
    }
  };
  
  // Navigate to next/previous material
  const handleNext = () => {
    if (activeIndex < materials.length - 1) {
      const nextIndex = activeIndex + 1;
      setActiveIndex(nextIndex);
      setActiveMaterial(materials[nextIndex]);
    }
  };
  
  const handlePrevious = () => {
    if (activeIndex > 0) {
      const prevIndex = activeIndex - 1;
      setActiveIndex(prevIndex);
      setActiveMaterial(materials[prevIndex]);
    }
  };
  
  // Get icon based on material type
  const getMaterialIcon = (fileType) => {
    switch(fileType?.toUpperCase()) {
      case 'PDF':
        return <DocumentIcon />;
      case 'VIDEO':
        return <VideoIcon />;
      case 'PRESENTATION':
        return <PresentationIcon />;
      case 'HTML':
        return <ArticleIcon />;
      case 'IMAGE':
        return <ImageIcon />;
      case 'DOCUMENT':
        return <DocumentIcon />;
      case 'EXTERNAL':
        return <LinkIcon />;
      default:
        return <DocumentIcon />;
    }
  };
  
  // Handle content dialog close
  const handleCloseContentDialog = () => {
    setContentDialogOpen(false);
    
    // Mark as viewed if this is the first time viewing
    if (activeMaterial && !activeMaterial.completed) {
      updateMaterialProgress(activeMaterial.id);
    }
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
  
  if (materials.length === 0) {
    return (
      <Alert severity="info">
        No learning materials available for this component.
      </Alert>
    );
  }
  
  // List view - show all materials
  if (viewMode === 'list') {
    return (
      <Box>
        <Typography variant="h6" gutterBottom>
          Learning Materials
        </Typography>
        
        <List>
          {materials.map((material, index) => (
            <Card key={material.id} variant="outlined" sx={{ mb: 2 }}>
              <CardContent>
                <Box display="flex" alignItems="flex-start">
                  <ListItemIcon>
                    {getMaterialIcon(material.fileType)}
                  </ListItemIcon>
                  <Box flex={1}>
                    <Typography variant="h6">{material.title}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {material.description}
                    </Typography>
                    
                    {material.estimatedDuration && (
                      <Typography variant="caption" color="text.secondary" display="block">
                        Estimated duration: {material.estimatedDuration} minutes
                      </Typography>
                    )}
                    
                    {/* Progress indicator */}
                    {material.progress !== undefined && (
                      <Box mt={1}>
                        <LinearProgress 
                          variant="determinate" 
                          value={material.progress} 
                          sx={{ height: 8, borderRadius: 5, mb: 1 }} 
                        />
                        <Typography variant="body2" align="right" color="text.secondary">
                          {material.progress}%
                        </Typography>
                      </Box>
                    )}
                  </Box>
                  
                  {material.completed && (
                    <Chip 
                      icon={<CheckCircleIcon />} 
                      label="Completed" 
                      color="success" 
                      size="small" 
                      sx={{ ml: 1 }}
                    />
                  )}
                </Box>
              </CardContent>
              <CardActions>
                <Button 
                  size="small" 
                  variant="contained"
                  onClick={() => handleViewMaterial(material, index)}
                >
                  View Material
                </Button>
                
                {!material.completed && (
                  <Button 
                    size="small"
                    onClick={() => handleMarkCompleted(material.id)}
                  >
                    Mark as Completed
                  </Button>
                )}
              </CardActions>
            </Card>
          ))}
        </List>
        
        <Divider sx={{ my: 2 }} />
        
        <Box display="flex" justifyContent="space-between">
          {onBack && (
            <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={onBack}>
              Back
            </Button>
          )}
          
          <Button 
            variant="contained" 
            endIcon={<DoneIcon />} 
            onClick={handleCompleteAll}
            disabled={!checkAllCompleted()}
          >
            Complete All Materials
          </Button>
        </Box>
        
        {/* Content Dialog */}
        <Dialog 
          open={contentDialogOpen} 
          onClose={handleCloseContentDialog}
          maxWidth="lg"
          fullWidth
        >
          <DialogTitle>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              {activeMaterial?.title || 'Learning Material'}
              <IconButton onClick={handleCloseContentDialog}>
                <CloseIcon />
              </IconButton>
            </Box>
          </DialogTitle>
          <DialogContent>
            {activeMaterial?.content ? (
              <div dangerouslySetInnerHTML={{ __html: activeMaterial.content }} />
            ) : (
              <Typography>No content available</Typography>
            )}
          </DialogContent>
        </Dialog>
      </Box>
    );
  }
  
  // View mode - show single material
  return (
    <Box>
      <Box mb={2}>
        <Button startIcon={<ArrowBackIcon />} onClick={handleBackToList}>
          Back to Materials
        </Button>
      </Box>
      
      {activeMaterial && (
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h5" gutterBottom>
              {activeMaterial.title}
            </Typography>
            
            {activeMaterial.description && (
              <Typography variant="body2" color="text.secondary" paragraph>
                {activeMaterial.description}
              </Typography>
            )}
            
            {/* Content display based on type */}
            {activeMaterial.content && (
              <Paper sx={{ p: 2, mt: 2 }}>
                <div dangerouslySetInnerHTML={{ __html: activeMaterial.content }} />
              </Paper>
            )}
            
            {/* PDF Viewer */}
            {activeMaterial.filePath && activeMaterial.fileType?.toUpperCase() === 'PDF' && (
              <Box mt={2}>
                <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                  <Button 
                    variant="contained" 
                    onClick={() => window.open(`/api/materials/${activeMaterial.id}/stream`, '_blank')}
                    startIcon={<DocumentIcon />}
                  >
                    Open PDF in New Tab
                  </Button>
                </Box>
                <Box sx={{ position: 'relative', height: '500px', border: '1px solid #e0e0e0', borderRadius: '4px' }}>
                  <iframe
                    src={`/api/materials/${activeMaterial.id}/stream`}
                    style={{ width: '100%', height: '100%', border: 'none' }}
                    title={activeMaterial.title}
                  />
                </Box>
              </Box>
            )}
            
            {/* Word/Document Viewer */}
            {activeMaterial.filePath && (activeMaterial.fileType?.toUpperCase() === 'DOCUMENT' || 
                                         activeMaterial.fileType?.toUpperCase() === 'DOC' || 
                                         activeMaterial.fileType?.toUpperCase() === 'DOCX') && (
              <Box mt={2}>
                <Alert severity="info">
                  Word documents can be viewed by clicking the button below. The document will open in a new tab.
                </Alert>
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                  <Button 
                    variant="contained" 
                    onClick={() => window.open(`/api/materials/${activeMaterial.id}/stream`, '_blank')}
                    startIcon={<DocumentIcon />}
                  >
                    Open Document
                  </Button>
                </Box>
              </Box>
            )}
            
            {/* Image Viewer */}
            {activeMaterial.filePath && (activeMaterial.fileType?.toUpperCase() === 'IMAGE' || 
                                         activeMaterial.fileType?.toUpperCase() === 'JPG' || 
                                         activeMaterial.fileType?.toUpperCase() === 'JPEG' || 
                                         activeMaterial.fileType?.toUpperCase() === 'PNG' || 
                                         activeMaterial.fileType?.toUpperCase() === 'GIF') && (
              <Box mt={2} sx={{ display: 'flex', justifyContent: 'center' }}>
                <img 
                  src={`/api/materials/${activeMaterial.id}/stream`} 
                  alt={activeMaterial.title}
                  style={{ maxWidth: '100%', maxHeight: '500px', objectFit: 'contain' }}
                />
              </Box>
            )}
            
            {/* Video Player - External URL */}
            {activeMaterial.fileType?.toUpperCase() === 'VIDEO' && activeMaterial.externalUrl && (
              <Box mt={2} sx={{ position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden' }}>
                <iframe
                  src={activeMaterial.externalUrl}
                  style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  title={activeMaterial.title}
                />
              </Box>
            )}
            
            {/* Video Player - File */}
            {activeMaterial.filePath && (activeMaterial.fileType?.toUpperCase() === 'VIDEO' || 
                                         activeMaterial.fileType?.toUpperCase() === 'MP4') && (
              <Box mt={2} sx={{ display: 'flex', justifyContent: 'center' }}>
                <video 
                  controls 
                  style={{ maxWidth: '100%', maxHeight: '500px' }}
                  onEnded={() => updateMaterialProgress(activeMaterial.id)}
                >
                  <source src={`/api/materials/${activeMaterial.id}/stream`} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              </Box>
            )}
            
            {/* Progress indicator */}
            <Box mt={2}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Progress:
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={activeMaterial.progress || 0} 
                sx={{ height: 8, borderRadius: 5, mb: 1 }} 
              />
              <Typography variant="body2" align="right" color="text.secondary">
                {activeMaterial.progress || 0}%
              </Typography>
            </Box>
          </CardContent>
          
          <CardActions>
            <Button 
              disabled={activeIndex === 0} 
              onClick={handlePrevious}
            >
              Previous
            </Button>
            
            {!activeMaterial.completed && (
              <Button 
                variant="contained" 
                color="primary"
                onClick={() => handleMarkCompleted(activeMaterial.id)}
              >
                Mark as Completed
              </Button>
            )}
            
            <Button 
              disabled={activeIndex === materials.length - 1} 
              onClick={handleNext}
            >
              Next
            </Button>
          </CardActions>
        </Card>
      )}
    </Box>
  );
};

export default LearningMaterialViewer;