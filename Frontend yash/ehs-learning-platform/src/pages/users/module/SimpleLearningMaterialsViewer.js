// src/pages/users/module/SimpleLearningMaterialsViewer.js
import React, { useState, useEffect } from 'react';
import {
  Typography, Box, Card, CardContent, CardActions, Button,
  Grid, LinearProgress, Chip, Divider, CircularProgress, Alert,
  Dialog, DialogTitle, DialogContent, DialogActions, IconButton
} from '@mui/material';
import {
  CheckCircle, Book, Description, PictureAsPdf, VideoLibrary,
  Image, Link as LinkIcon, Code, Close, Done, Schedule,
  OpenInNew, Download
} from '@mui/icons-material';
import { learningMaterialService } from '../../../services/api';

const SimpleLearningMaterialsViewer = ({ componentId, isCompleted, onComplete }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [materials, setMaterials] = useState([]);
  const [materialProgress, setMaterialProgress] = useState({});
  
  // Dialog state for material viewing
  const [viewerOpen, setViewerOpen] = useState(false);
  const [currentMaterial, setCurrentMaterial] = useState(null);
  
  // Fetch materials data
  useEffect(() => {
    const fetchMaterials = async () => {
      try {
        setLoading(true);
        
        // Get materials with progress info
        const response = await learningMaterialService.getMaterialsWithProgress(componentId);
        setMaterials(response.data || []);
        
        // Initialize progress tracking
        const progressMap = {};
        response.data.forEach(material => {
          progressMap[material.id] = {
            progress: material.progress || 0,
            completed: material.completed || false,
            timeSpent: material.timeSpent || 0
          };
        });
        
        setMaterialProgress(progressMap);
      } catch (err) {
        console.error('Error loading materials:', err);
        setError('Failed to load learning materials.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchMaterials();
  }, [componentId]);
  
  // Calculate overall component progress
  const calculateOverallProgress = () => {
    if (materials.length === 0) return 0;
    
    const totalProgress = Object.values(materialProgress).reduce(
      (sum, item) => sum + item.progress, 0
    );
    
    return Math.round(totalProgress / materials.length);
  };
  
  // Check if all materials are completed
  const areAllMaterialsCompleted = () => {
    if (materials.length === 0) return false;
    
    return materials.every(material => 
      materialProgress[material.id]?.completed
    );
  };
  
  // Handle material selection
  const handleViewMaterial = (material) => {
    setCurrentMaterial(material);
    setViewerOpen(true);
  };
  
  // Close material viewer
  const handleCloseViewer = () => {
    setViewerOpen(false);
    setCurrentMaterial(null);
  };
  
  // Update material progress
  const handleUpdateProgress = async (materialId, progress = 100, timeSpent = 0) => {
    try {
      // Update progress on server
      await learningMaterialService.updateProgress(materialId, {
        progress,
        timeSpent
      });
      
      // Update local state
      setMaterialProgress(prev => ({
        ...prev,
        [materialId]: {
          ...prev[materialId],
          progress,
          completed: progress >= 100,
          timeSpent: (prev[materialId]?.timeSpent || 0) + timeSpent
        }
      }));
      
      // Close viewer
      handleCloseViewer();
      
      // Check if all materials are now completed
      const updatedProgress = {
        ...materialProgress,
        [materialId]: {
          ...materialProgress[materialId],
          progress,
          completed: progress >= 100
        }
      };
      
      const allCompleted = materials.every(material => 
        material.id === materialId 
          ? progress >= 100 
          : updatedProgress[material.id]?.completed
      );
      
      if (allCompleted) {
        // Auto-complete the component if all materials are completed
        onComplete(componentId);
      }
    } catch (err) {
      console.error('Error updating progress:', err);
      setError('Failed to update progress. Please try again.');
    }
  };
  
  // Manually complete component
  const handleCompleteComponent = () => {
    onComplete(componentId);
  };
  
  // Get appropriate icon for material type
  const getMaterialIcon = (type) => {
    switch (type) {
      case 'PDF': return <PictureAsPdf />;
      case 'VIDEO': return <VideoLibrary />;
      case 'PRESENTATION': return <Description />;
      case 'DOCUMENT': return <Description />;
      case 'HTML': return <Code />;
      case 'IMAGE': return <Image />;
      case 'EXTERNAL': return <LinkIcon />;
      default: return <Book />;
    }
  };
  
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" my={4}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }
  
  if (isCompleted) {
    return (
      <Box>
        <Alert severity="success" icon={<CheckCircle />} sx={{ mb: 3 }}>
          <Typography variant="h6">
            Learning Materials Completed
          </Typography>
          <Typography>
            You have completed all the required learning materials for this component.
          </Typography>
        </Alert>
        
        <Grid container spacing={3}>
          {materials.map(material => (
            <Grid item xs={12} sm={6} key={material.id}>
              <Card variant="outlined">
                <CardContent>
                  <Box display="flex" alignItems="center" mb={1}>
                    {getMaterialIcon(material.fileType)}
                    <Typography variant="subtitle1" sx={{ ml: 1 }}>
                      {material.title}
                    </Typography>
                  </Box>
                  
                  <Chip 
                    label="Completed" 
                    color="success" 
                    size="small" 
                    icon={<CheckCircle />} 
                    sx={{ mb: 1 }} 
                  />
                  
                  {material.description && (
                    <Typography variant="body2" color="textSecondary">
                      {material.description}
                    </Typography>
                  )}
                </CardContent>
                <CardActions>
                  <Button size="small" onClick={() => handleViewMaterial(material)}>
                    Review
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }
  
  return (
    <Box>
      <Typography variant="h5" gutterBottom>Learning Materials</Typography>
      
      {materials.length === 0 ? (
        <Alert severity="info">No learning materials found for this component.</Alert>
      ) : (
        <>
          {/* Overall progress */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" gutterBottom>
              Component Progress: {calculateOverallProgress()}%
            </Typography>
            <LinearProgress 
              variant="determinate" 
              value={calculateOverallProgress()} 
              sx={{ height: 10, borderRadius: 5 }} 
            />
          </Box>
          
          <Grid container spacing={3}>
            {materials.map(material => (
              <Grid item xs={12} sm={6} key={material.id}>
                <Card variant="outlined">
                  <CardContent>
                    <Box display="flex" alignItems="center" mb={1}>
                      {getMaterialIcon(material.fileType)}
                      <Typography variant="subtitle1" sx={{ ml: 1 }}>
                        {material.title}
                      </Typography>
                    </Box>
                    
                    {materialProgress[material.id]?.completed ? (
                      <Chip 
                        label="Completed" 
                        color="success" 
                        size="small" 
                        icon={<CheckCircle />} 
                        sx={{ mb: 1 }} 
                      />
                    ) : (
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Schedule fontSize="small" color="action" sx={{ mr: 1 }} />
                        <Typography variant="body2" color="textSecondary">
                          {material.estimatedDuration || 0} min
                        </Typography>
                      </Box>
                    )}
                    
                    {material.description && (
                      <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                        {material.description}
                      </Typography>
                    )}
                    
                    {/* Progress bar for this material */}
                    {!materialProgress[material.id]?.completed && (
                      <>
                        <Typography variant="caption" display="block" gutterBottom>
                          Progress: {materialProgress[material.id]?.progress || 0}%
                        </Typography>
                        <LinearProgress 
                          variant="determinate" 
                          value={materialProgress[material.id]?.progress || 0} 
                          sx={{ height: 6, borderRadius: 3 }} 
                        />
                      </>
                    )}
                  </CardContent>
                  <CardActions>
                    <Button 
                      size="small" 
                      onClick={() => handleViewMaterial(material)}
                    >
                      {materialProgress[material.id]?.completed ? 'Review' : 'View'}
                    </Button>
                    
                    {!materialProgress[material.id]?.completed && (
                      <Button 
                        size="small" 
                        onClick={() => handleUpdateProgress(material.id, 100, material.estimatedDuration || 5)}
                      >
                        Mark Complete
                      </Button>
                    )}
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
          
          {/* Complete Component Button */}
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
            <Button 
              variant="contained" 
              color="primary"
              disabled={!areAllMaterialsCompleted()}
              endIcon={<Done />}
              onClick={handleCompleteComponent}
            >
              Complete Section
            </Button>
          </Box>
        </>
      )}
      
      {/* Material Viewer Dialog */}
      <Dialog 
        open={viewerOpen} 
        onClose={handleCloseViewer}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">{currentMaterial?.title}</Typography>
            <IconButton onClick={handleCloseViewer}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        
        <DialogContent dividers>
          {currentMaterial && (
            <Box>
              {/* Material metadata */}
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="textSecondary">
                  Type: {currentMaterial.fileType}
                  {currentMaterial.estimatedDuration && ` • Duration: ${currentMaterial.estimatedDuration} min`}
                </Typography>
                
                {currentMaterial.description && (
                  <Typography variant="body1" paragraph sx={{ mt: 1 }}>
                    {currentMaterial.description}
                  </Typography>
                )}
              </Box>
              
              <Divider sx={{ mb: 2 }} />
              
              {/* Use a simplified universal approach for all content types */}
              {currentMaterial.externalUrl ? (
                /* External URL content */
                <Box sx={{ width: '100%', textAlign: 'center' }}>
                  <iframe
                    src={currentMaterial.externalUrl}
                    width="100%"
                    height="500px"
                    title={currentMaterial.title}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </Box>
              ) : currentMaterial.content && currentMaterial.fileType === 'HTML' ? (
                /* HTML content */
                <Box 
                  sx={{ border: '1px solid #ddd', p: 2, borderRadius: 1 }}
                  dangerouslySetInnerHTML={{ __html: currentMaterial.content }} 
                />
              ) : (
                /* All file-based content in a simple iframe */
                <Box>
                  <Box sx={{ width: '100%', height: '70vh', border: '1px solid #ddd' }}>
                    <iframe
                      src={`/api/materials/${currentMaterial.id}/stream`}
                      width="100%"
                      height="100%"
                      title={currentMaterial.title || "Learning Material"}
                      frameBorder="0"
                      style={{ backgroundColor: '#f5f5f5' }}
                    />
                  </Box>
                  
                  {/* Always provide fallback options */}
                  <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2, gap: 2 }}>
                    <Button
                      variant="outlined"
                      startIcon={<OpenInNew />}
                      onClick={() => window.open(`/api/materials/${currentMaterial.id}/stream`, '_blank')}
                    >
                      Open in New Tab
                    </Button>
                    
                    <Button
                      variant="outlined"
                      startIcon={<Download />}
                      onClick={() => window.open(`/api/materials/${currentMaterial.id}/stream?download=true`, '_blank')}
                    >
                      Download File
                    </Button>
                  </Box>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        
        <DialogActions>
          <Button onClick={handleCloseViewer}>Close</Button>
          
          {currentMaterial && !materialProgress[currentMaterial.id]?.completed && (
            <Button
              variant="contained"
              color="primary"
              onClick={() => handleUpdateProgress(
                currentMaterial.id, 
                100, 
                currentMaterial.estimatedDuration || 5
              )}
              endIcon={<CheckCircle />}
            >
              Mark as Completed
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SimpleLearningMaterialsViewer;