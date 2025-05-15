// src/components/learning/EnhancedLearningContentViewer.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Button, Card, CardContent, CardActions,
  CircularProgress, Alert, Divider, Chip, LinearProgress,
  ListItemIcon, Dialog, DialogContent, DialogTitle, IconButton,
  Snackbar, useTheme, useMediaQuery
} from '@mui/material';
import {
  PictureAsPdf, VideoLibrary, Description, Link, Image, 
  CheckCircle, Done, InsertDriveFile, Close, Launch,
  Visibility, Download, PlayArrow
} from '@mui/icons-material';
import { learningMaterialService } from '../../services/api';
import EnhancedMaterialViewer from './EnhancedMaterialViewer';

/**
 * EnhancedLearningContentViewer Component
 * Displays a list of learning materials for a module component with improved viewing experience:
 * - Better error handling and fallbacks
 * - Enhanced material viewers for different file types
 * - Proper handling of progress tracking
 * - Responsive design for different screen sizes
 */
const EnhancedLearningContentViewer = ({ componentId, onComplete, onError: parentOnError }) => {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [loadRetries, setLoadRetries] = useState(0);
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const isMediumScreen = useMediaQuery(theme.breakpoints.down('md'));
  
  // Function to show notification
  const showNotification = (message) => {
    setSnackbarMessage(message);
    setSnackbarOpen(true);
  };
  
  // Memoized fetch logic to allow for retries
  const fetchMaterials = useCallback(async () => {
    if (!componentId) {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      
      // Use batch request to get both component and materials at once
      const componentResponse = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8080'}/api/components/${componentId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!componentResponse.ok) {
        throw new Error(`Failed to fetch component: ${componentResponse.status}`);
      }
      
      const componentData = await componentResponse.json();
      console.log("Component data:", componentData);
      
      // Check if component has content with material associations
      let materialAssociations = [];
      if (componentData.content) {
        try {
          const contentObj = JSON.parse(componentData.content);
          console.log("Parsed content:", contentObj);
          materialAssociations = contentObj.materialAssociations || [];
        } catch (e) {
          console.error("Error parsing component content:", e);
        }
      }
      
      console.log("Material associations:", materialAssociations);
      
      // Try both approaches to get materials
      const approachA = async () => {
        try {
          const response = await learningMaterialService.getMaterialsWithProgress(componentId);
          if (response && response.data && response.data.length > 0) {
            return response.data.map(material => ({
              ...material,
              progress: material.progress || 0,
              completed: material.completed || false
            }));
          }
          return [];
        } catch (error) {
          console.warn("Failed to fetch materials with approach A:", error);
          return null;
        }
      };
      
      const approachB = async () => {
        try {
          if (materialAssociations.length === 0) return [];
          
          const fetchedMaterials = [];
          
          // Use Promise.all to fetch materials in parallel
          const materialPromises = materialAssociations.map(association => 
            learningMaterialService.getMaterialWithProgress(association.materialId)
              .then(response => {
                if (response && response.data) {
                  return {
                    ...response.data,
                    progress: response.data.progress || 0,
                    completed: response.data.completed || false,
                    sequenceOrder: association.sequenceOrder
                  };
                }
                return null;
              })
              .catch(error => {
                console.error(`Error fetching material ${association.materialId}:`, error);
                return null;
              })
          );
          
          const results = await Promise.all(materialPromises);
          const validMaterials = results.filter(m => m !== null);
          
          // Sort by sequence order
          return validMaterials.sort((a, b) => (a.sequenceOrder || 0) - (b.sequenceOrder || 0));
        } catch (error) {
          console.warn("Failed to fetch materials with approach B:", error);
          return null;
        }
      };
      
      // Try both approaches and use the one that works
      const [materialsA, materialsB] = await Promise.all([approachA(), approachB()]);
      
      let finalMaterials = [];
      if (materialsA && materialsA.length > 0) {
        console.log("Using materials from approach A:", materialsA);
        finalMaterials = materialsA;
      } else if (materialsB && materialsB.length > 0) {
        console.log("Using materials from approach B:", materialsB);
        finalMaterials = materialsB;
      } else {
        console.warn("No materials found with either approach");
        finalMaterials = [];
      }
      
      setMaterials(finalMaterials);
      setLoading(false);
      
    } catch (err) {
      console.error("Error fetching materials:", err);
      
      // Implement retry logic
      if (loadRetries < 2) {
        console.log(`Retrying fetch (attempt ${loadRetries + 1})...`);
        setLoadRetries(prev => prev + 1);
        setTimeout(() => fetchMaterials(), 2000); // Wait 2 seconds before retrying
      } else {
        setError("Failed to load learning materials. Please try refreshing the page.");
        setLoading(false);
        
        // Propagate error to parent if callback exists
        if (parentOnError) {
          parentOnError(err);
        }
      }
    }
  }, [componentId, loadRetries, parentOnError]);
  
  // Fetch materials when component mounts
  useEffect(() => {
    fetchMaterials();
  }, [fetchMaterials]);
  
  // Update material progress
  const updateProgress = async (materialId, data = { progress: 100 }) => {
    try {
      // Default to 100% if not specified
      const progress = data.progress || 100;
      
      // Check if token exists first
      const token = localStorage.getItem('token');
      if (!token) {
        console.warn("No authentication token found. Progress may not be saved.");
        // Update state locally anyway to improve UX
        setMaterials(prevMaterials => 
          prevMaterials.map(material => 
            material.id === materialId 
              ? { 
                  ...material, 
                  progress: progress, 
                  completed: progress >= 100 
                }
              : material
          )
        );
        return;
      }
      
      // Attempt to update progress on the server
      await learningMaterialService.updateProgress(materialId, { 
        progress: progress,
        timeSpent: data.timeSpent || 1 // Default time spent
      });
      
      // Update local state
      setMaterials(prevMaterials => 
        prevMaterials.map(material => 
          material.id === materialId 
            ? { 
                ...material, 
                progress: progress, 
                completed: progress >= 100 
              }
            : material
        )
      );
      
      // Show notification for completion
      if (progress >= 100) {
        showNotification("Material marked as completed");
      }
      
    } catch (err) {
      console.error("Error updating material progress:", err);
      
      // Still update local state for better UX even if server update fails
      const progressValue = data.progress || 100;
      setMaterials(prevMaterials => 
        prevMaterials.map(material => 
          material.id === materialId 
            ? { 
                ...material, 
                progress: progressValue, 
                completed: progressValue >= 100 
              }
            : material
        )
      );
      
      // Don't show error to user for progress tracking - just log it
      console.warn("Progress tracking failed but content viewing will continue");
    }
  };
  
  // Check if all materials are completed
  const allCompleted = materials.length > 0 && 
    materials.every(material => material.completed || material.progress >= 100);
  
  // Material icon mapping with better type detection
  const getMaterialIcon = (material) => {
    if (!material) return <InsertDriveFile />;
    
    // Check if external URL is provided
    if (material.externalUrl && material.externalUrl.trim() !== '') {
      return <Link />;
    }
    
    // Check file type
    if (!material.fileType) return <InsertDriveFile />;
    
    const type = material.fileType.toUpperCase();
    if (type === 'PDF') return <PictureAsPdf />;
    if (type === 'VIDEO' || type === 'MP4') return <VideoLibrary />;
    if (type === 'DOCUMENT' || type === 'DOC' || type === 'DOCX') return <Description />;
    if (type === 'IMAGE' || type === 'JPG' || type === 'PNG' || type === 'JPEG') return <Image />;
    if (type === 'EXTERNAL') return <Link />;
    if (type === 'HTML' && material.content) return <InsertDriveFile />;
    
    return <InsertDriveFile />;
  };
  
  // Get primary action icon based on material type
  const getPrimaryActionIcon = (material) => {
    if (!material || !material.fileType) return <Visibility />;
    
    const type = material.fileType.toUpperCase();
    if (type === 'VIDEO' || type === 'MP4') return <PlayArrow />;
    return <Visibility />;
  };
  
  // Handle opening material
  const handleOpenMaterial = (material) => {
    console.log("Opening material:", material);
    setSelectedMaterial(material);
    setDialogOpen(true);
    
    // Mark as started/viewed
    if (material.progress < 50) {
      updateProgress(material.id, { progress: 50 });
    }
  };
  
  // Handle direct download/open of a material
  const handleOpenDirectly = (material) => {
    if (!material || !material.id) return;
    
    // Get the direct URL for the material
    const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:8080';
    const token = localStorage.getItem('token');
    const url = `${baseUrl}/api/materials/${material.id}/stream?token=${encodeURIComponent(token || '')}`;
    
    // Open in new tab
    window.open(url, '_blank');
    
    // Update progress
    if (material.progress < 75) {
      updateProgress(material.id, { progress: 75 });
    }
  };
  
  // Handle closing the material dialog
  const handleCloseDialog = () => {
    setDialogOpen(false);
    
    // If all materials are now completed, check if we should call onComplete
    if (allCompleted && onComplete) {
      // Wait a moment before showing notification to allow dialog to close
      setTimeout(() => {
        showNotification("All materials completed! You may proceed to the next step.");
      }, 500);
    }
  };
  
  // Handle material completion from child component
  const handleMaterialComplete = (materialId, data = {}) => {
    updateProgress(materialId, data);
    // Don't close dialog automatically, allow user to close when ready
  };
  
  // Handle component completion
  const handleComponentComplete = () => {
    if (onComplete) {
      onComplete();
    }
  };
  
  // Handle retry of loading materials
  const handleRetry = () => {
    setError(null);
    setLoadRetries(0);
    fetchMaterials();
  };
  
  // Error handling from child component
  const handleError = (error) => {
    console.error("Error in material viewer:", error);
    if (parentOnError) {
      parentOnError(error);
    }
  };
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (error) {
    return (
      <Box>
        <Alert 
          severity="error" 
          action={
            <Button color="inherit" size="small" onClick={handleRetry}>
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      </Box>
    );
  }
  
  if (materials.length === 0) {
    return (
      <Box>
        <Alert severity="info" sx={{ mb: 2 }}>
          No learning materials are defined for this step.
        </Alert>
        <Button 
          variant="contained" 
          color="primary" 
          onClick={handleComponentComplete}
          sx={{ mt: 2 }}
        >
          Continue to Next Step
        </Button>
      </Box>
    );
  }
  
  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Learning Materials
        {allCompleted && (
          <Chip 
            icon={<CheckCircle />}
            label="All Completed" 
            color="success"
            size="small"
            sx={{ ml: 2, verticalAlign: 'middle' }}
          />
        )}
      </Typography>
      
      {materials.map(material => (
        <Card key={material.id} variant="outlined" sx={{ mb: 2 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
              <ListItemIcon sx={{ minWidth: 40, mt: 0.5 }}>
                {getMaterialIcon(material)}
              </ListItemIcon>
              <Box sx={{ flex: 1 }}>
                <Typography variant="h6" component="div">
                  {material.title}
                </Typography>
                
                {material.description && (
                  <Typography variant="body2" color="text.secondary">
                    {material.description}
                  </Typography>
                )}
                
                {/* Progress bar */}
                <Box sx={{ mt: 1 }}>
                  <LinearProgress 
                    variant="determinate" 
                    value={material.progress || 0} 
                    sx={{ height: 8, borderRadius: 5, mb: 0.5 }} 
                    color={material.completed ? "success" : "primary"} 
                  />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="caption" color="text.secondary">
                      {material.completed ? "Completed" : material.progress > 0 ? "In Progress" : "Not Started"}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {Math.round(material.progress || 0)}%
                    </Typography>
                  </Box>
                </Box>
              </Box>
              
              {material.completed && !isSmallScreen && (
                <Chip 
                  icon={<CheckCircle />}
                  label="Completed"
                  color="success"
                  size="small"
                  sx={{ ml: 2 }}
                />
              )}
            </Box>
          </CardContent>
          <CardActions sx={{ flexWrap: 'wrap', gap: 1 }}>
            <Button 
              variant="contained" 
              size="small"
              onClick={() => handleOpenMaterial(material)}
              startIcon={getPrimaryActionIcon(material)}
            >
              View Material
            </Button>
            
            <Button
              variant="outlined"
              size="small"
              onClick={() => handleOpenDirectly(material)}
              startIcon={<Launch />}
            >
              Open in New Tab
            </Button>
            
            {!material.completed && (
              <Button 
                size="small"
                color="success"
                onClick={() => updateProgress(material.id)}
                startIcon={<CheckCircle />}
              >
                Mark as Completed
              </Button>
            )}
          </CardActions>
        </Card>
      ))}
      
      <Divider sx={{ my: 2 }} />
      
      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button 
          variant="contained" 
          color="primary"
          endIcon={<Done />}
          onClick={handleComponentComplete}
          disabled={!allCompleted}
        >
          {allCompleted ? "Complete Step" : "Complete All Materials First"}
        </Button>
      </Box>
      
      {/* Material Viewer Dialog */}
      <Dialog 
        open={dialogOpen} 
        onClose={handleCloseDialog}
        maxWidth="lg"
        fullWidth
        fullScreen={isSmallScreen}
        PaperProps={{
          sx: { 
            minHeight: isSmallScreen ? '100vh' : '80vh',
            maxHeight: isSmallScreen ? '100vh' : '90vh'
          }
        }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pr: 1 }}>
          <Typography variant="h6" noWrap sx={{ maxWidth: isMediumScreen ? '70vw' : '80vw', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {selectedMaterial?.title}
            {selectedMaterial?.completed && (
              <CheckCircle color="success" sx={{ ml: 1, verticalAlign: 'text-bottom' }} fontSize="small" />
            )}
          </Typography>
          <IconButton edge="end" color="inherit" onClick={handleCloseDialog} aria-label="close">
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ p: isSmallScreen ? 1 : 2 }}>
          {selectedMaterial && (
            <EnhancedMaterialViewer 
              material={selectedMaterial}
              onComplete={handleMaterialComplete}
              onError={handleError}
            />
          )}
        </DialogContent>
      </Dialog>
      
      {/* Notification snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
      />
    </Box>
  );
};

export default EnhancedLearningContentViewer;