// src/components/learning/UserLearningContentViewer.js
import React, { useState, useEffect, useMemo } from 'react';
import {
  Box, Typography, Button, Card, CardContent, CardActions,
  Divider, List, ListItemText, ListItemIcon, CircularProgress,
  LinearProgress, Alert, Chip, Dialog, DialogTitle, DialogContent, IconButton, Paper
} from '@mui/material';
import {
  Description as DocumentIcon, OndemandVideo as VideoIcon, Link as LinkIcon,
  Article as ArticleIcon, Slideshow as PresentationIcon, CheckCircle as CheckCircleIcon,
  Close as CloseIcon, Done as DoneIcon
} from '@mui/icons-material';
import { learningMaterialService } from '../../services/api'; // Adjust path if needed

// Define a prefix for console logs from this component
const LOG_PREFIX = "[UserLearningContentViewer]";

/**
 * Displays learning materials for a specific component for the end-user.
 * Fetches its own materials based on componentId.
 * @param {object} props
 * @param {string} props.componentId - The ID of the component whose materials should be loaded.
 * @param {function} props.onComplete - Callback function invoked when the user clicks the final 'Complete Step' button.
 */
const UserLearningContentViewer = ({ componentId, onComplete }) => {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [contentDialogOpen, setContentDialogOpen] = useState(false);
  const [materialInDialog, setMaterialInDialog] = useState(null);

  console.log(`${LOG_PREFIX} Rendering or Re-rendering. ComponentId: ${componentId}`);

  // --- Fetch Materials ---
  useEffect(() => {
    console.log(`${LOG_PREFIX} useEffect triggered. ComponentId: ${componentId}`);
    if (!componentId) {
      console.log(`${LOG_PREFIX} No componentId provided, skipping fetch.`);
      setMaterials([]); // Clear materials if componentId is missing
      return;
    }

    const fetchMaterials = async () => {
      console.log(`${LOG_PREFIX} Starting fetch for componentId: ${componentId}`);
      try {
        setLoading(true);
        setError(null);
        const response = await learningMaterialService.getMaterialsWithProgress(componentId);
        console.log(`${LOG_PREFIX} API response received for componentId ${componentId}:`, response);

        // Ensure progress is a number, default to 0 if missing or null
        const materialsWithProgress = (response.data || []).map(m => ({
            ...m,
            progress: typeof m.progress === 'number' ? m.progress : 0,
            completed: m.completed === true // Ensure boolean
        }));
        console.log(`${LOG_PREFIX} Processed materials with progress:`, materialsWithProgress);
        setMaterials(materialsWithProgress);

      } catch (err) {
        console.error(`${LOG_PREFIX} Error fetching materials for componentId ${componentId}:`, err);
        setError('Failed to load learning materials for this step.');
      } finally {
        console.log(`${LOG_PREFIX} Finished fetch attempt for componentId: ${componentId}`);
        setLoading(false);
      }
    };

    fetchMaterials();
  }, [componentId]); // Re-fetch only when componentId changes

  // --- Update Material Progress Locally and via API ---
  const handleMaterialProgressUpdate = async (materialId, newProgressValue = 100) => {
     console.log(`${LOG_PREFIX} handleMaterialProgressUpdate called for materialId: ${materialId}, progress: ${newProgressValue}`);
     const materialIndex = materials.findIndex(m => m.id === materialId);
     if (materialIndex === -1) {
        console.warn(`${LOG_PREFIX} Material ${materialId} not found in local state.`);
        return;
     }

     const currentProgress = materials[materialIndex].progress;
      if (newProgressValue <= currentProgress && materials[materialIndex].completed) {
          console.log(`${LOG_PREFIX} Material ${materialId} progress already ${currentProgress} or completed. No update needed.`);
          return;
      }

      // Optimistic UI update
      console.log(`${LOG_PREFIX} Applying optimistic UI update for material ${materialId}.`);
      const updatedMaterials = materials.map(m =>
        m.id === materialId
          ? { ...m, progress: newProgressValue, completed: newProgressValue >= 100 }
          : m
      );
      setMaterials(updatedMaterials);

     try {
       console.log(`${LOG_PREFIX} Calling API to update progress for material ${materialId}.`);
       await learningMaterialService.updateProgress(materialId, { progress: newProgressValue });
       console.log(`${LOG_PREFIX} Successfully updated progress API for material ${materialId}`);
     } catch (err) {
       console.error(`${LOG_PREFIX} Error updating progress API for material ${materialId}:`, err);
       setError(`Failed to save progress for a material.`);
       // Note: No rollback implemented for simplicity, UI remains optimistically updated.
     }
   };

  // --- Material Interaction Handlers ---
  const handleViewMaterial = (material) => {
    console.log(`${LOG_PREFIX} handleViewMaterial called for material:`, material);
    
    // Handle external URLs
    if (material.externalUrl) {
      console.log(`${LOG_PREFIX} Opening external URL: ${material.externalUrl}`);
      window.open(material.externalUrl, '_blank', 'noopener,noreferrer');
      handleMaterialProgressUpdate(material.id, 100);
      return;
    }
    
    // Different file handling based on type
    if (material.filePath) {
      const fileType = material.fileType?.toUpperCase();
      const fileUrl = `${process.env.REACT_APP_API_URL || 'http://localhost:8080'}/api/materials/${material.id}/stream`;
      console.log(`${LOG_PREFIX} Handling file type: ${fileType} for material:`, material.id);
      
      // For documents that should always open in a new tab 
      // (specific Word files or large PDFs that might be better in native viewers)
      if (fileType === 'DOCX' || fileType === 'DOC' || fileType === 'DOCUMENT' || 
          (fileType === 'PDF' && material.fileName?.endsWith('.pdf') && material.fileName?.length > 0 && material.fileName?.includes('large'))) {
        console.log(`${LOG_PREFIX} Opening document in new tab: ${fileUrl}`);
        window.open(fileUrl, '_blank', 'noopener,noreferrer');
        handleMaterialProgressUpdate(material.id, 100);
        return;
      }
      
      // For all other file types, show in the dialog
      console.log(`${LOG_PREFIX} Opening file in dialog: ${fileType}`);
      setMaterialInDialog(material);
      setContentDialogOpen(true);
      handleMaterialProgressUpdate(material.id, 50); // Start at 50% progress when viewing
      return;
    } 
    
    // Handle HTML/rich text content
    if (material.content) {
      console.log(`${LOG_PREFIX} Opening content in dialog for material:`, material.id);
      setMaterialInDialog(material);
      setContentDialogOpen(true);
      handleMaterialProgressUpdate(material.id, 50); // Start at 50% for content viewing
      return;
    }
    
    // Fallback if no content is available
    console.warn(`${LOG_PREFIX} Material ${material.id} has no viewable content. Marking complete.`);
    handleMaterialProgressUpdate(material.id, 100);
  };

  const handleCloseContentDialog = () => {
    console.log(`${LOG_PREFIX} Closing content dialog.`);
    // Mark material as complete when the dialog is closed
    if (materialInDialog?.id) {
      console.log(`${LOG_PREFIX} Marking material complete on dialog close:`, materialInDialog.id);
      handleMaterialProgressUpdate(materialInDialog.id, 100);
    }
    setContentDialogOpen(false);
    setMaterialInDialog(null);
  };

  // --- Completion Logic ---
  const allMaterialsCompleted = useMemo(() => {
    if (materials.length === 0) {
        console.log(`${LOG_PREFIX} No materials, considered 'completed' for component progression.`);
        return true; // If no materials, allow completion immediately.
    }
    const result = materials.every(material => material.completed === true || material.progress >= 100);
    console.log(`${LOG_PREFIX} Recalculating allMaterialsCompleted. Result: ${result}`, materials);
    return result;
  }, [materials]);

  const handleCompleteComponentClick = () => {
    console.log(`${LOG_PREFIX} handleCompleteComponentClick called. allMaterialsCompleted: ${allMaterialsCompleted}`);
    if (allMaterialsCompleted && typeof onComplete === 'function') {
      console.log(`${LOG_PREFIX} Calling onComplete callback.`);
      onComplete();
    } else if (typeof onComplete !== 'function') {
       console.error(`${LOG_PREFIX} onComplete prop is not a function!`);
    } else {
        console.warn(`${LOG_PREFIX} Attempted to complete component, but not all materials are marked as completed.`);
        setError("Please ensure all materials are viewed or marked as complete.");
    }
  };

  // --- Rendering ---
  const getMaterialIcon = (fileType) => {
    const type = fileType?.toUpperCase();
    if (type?.includes('PDF')) return <DocumentIcon />;
    if (type?.includes('VIDEO')) return <VideoIcon />;
    if (type?.includes('PRESENTATION') || type?.includes('PPT')) return <PresentationIcon />;
    if (type === 'HTML' || type === 'CONTENT') return <ArticleIcon />;
    if (type === 'EXTERNAL') return <LinkIcon />;
    return <DocumentIcon />;
  };

  // --- Render states ---
  if (loading) {
    console.log(`${LOG_PREFIX} Rendering loading state.`);
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Loading Materials...</Typography>
      </Box>
    );
  }

  if (error) {
    console.log(`${LOG_PREFIX} Rendering error state: ${error}`);
    return <Alert severity="error" onClose={() => setError(null)}>{error}</Alert>;
  }

  console.log(`${LOG_PREFIX} Rendering material list or completion button.`);

  // Main render logic
  return (
    <Box>
      {materials.length === 0 ? (
         // Render if no materials were found/defined
         <Box>
             <Alert severity="info" sx={{ mb: 2 }}>
                 No specific learning materials are defined for this step.
             </Alert>
             {/* Provide the completion button even if no materials */}
             <Box display="flex" justifyContent="flex-end" mt={2}>
                 <Button
                     variant="contained"
                     endIcon={<DoneIcon />}
                     onClick={handleCompleteComponentClick} // Still use the same handler
                 >
                     Proceed to Next Step
                 </Button>
             </Box>
         </Box>
      ) : (
         // Render the list if materials exist
        <>
          <List sx={{ mb: 2 }}>
            {materials.map((material) => (
              <Card key={material.id} variant="outlined" sx={{ mb: 2 }}>
                <CardContent>
                  <Box display="flex" alignItems="flex-start">
                    <ListItemIcon sx={{ minWidth: 40, mt: 0.5 }}>{getMaterialIcon(material.fileType)}</ListItemIcon>
                    <Box flex={1}>
                      <Typography variant="h6" component="div">{material.title}</Typography>
                      {material.description && <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{material.description}</Typography>}
                      {material.estimatedDuration && <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>Est: {material.estimatedDuration} min</Typography>}
                      <Box mt={1}>
                        <LinearProgress variant="determinate" value={material.progress || 0} sx={{ height: 8, borderRadius: 5, mb: 0.5 }} color={material.completed ? "success" : "primary"} />
                        <Typography variant="caption" align="right" color="text.secondary">{Math.round(material.progress || 0)}%</Typography>
                      </Box>
                    </Box>
                    {material.completed && <Chip icon={<CheckCircleIcon fontSize="small" />} label="Completed" color="success" size="small" sx={{ ml: 1, alignSelf: 'center' }} />}
                  </Box>
                </CardContent>
                <CardActions sx={{ justifyContent: 'flex-end' }}>
                  <Button size="small" variant="contained" onClick={() => handleViewMaterial(material)}> View Material </Button>
                </CardActions>
              </Card>
            ))}
          </List>
          <Divider sx={{ my: 2 }} />
          <Box display="flex" justifyContent="flex-end">
            <Button variant="contained" color="primary" endIcon={<DoneIcon />} onClick={handleCompleteComponentClick} disabled={!allMaterialsCompleted}>
              Complete Learning Step
            </Button>
          </Box>
        </>
      )}

      {/* Content Dialog */}
      <Dialog open={contentDialogOpen} onClose={handleCloseContentDialog} maxWidth="lg" fullWidth >
        <DialogTitle sx={{ m: 0, p: 2 }}>
           <Box display="flex" justifyContent="space-between" alignItems="center">
              {materialInDialog?.title || 'Learning Material'}
              <IconButton aria-label="close" onClick={handleCloseContentDialog} sx={{ color: (theme) => theme.palette.grey[500] }}> <CloseIcon /> </IconButton>
           </Box>
        </DialogTitle>
        <DialogContent dividers>
          {materialInDialog?.content ? (
            <Paper elevation={0} sx={{ p: 2 }}><div dangerouslySetInnerHTML={{ __html: materialInDialog.content }} /></Paper>
          ) : materialInDialog?.filePath && (materialInDialog.fileType?.toUpperCase() === 'PDF') ? (
            <Box sx={{ height: '70vh', width: '100%' }}>
              <iframe
                src={`${process.env.REACT_APP_API_URL || 'http://localhost:8080'}/api/materials/${materialInDialog.id}/stream`}
                style={{ width: '100%', height: '100%', border: 'none' }}
                title={materialInDialog.title}
              />
            </Box>
          ) : materialInDialog?.filePath && (materialInDialog.fileType?.toUpperCase() === 'IMAGE' || 
                                        materialInDialog.fileType?.toUpperCase() === 'JPG' || 
                                        materialInDialog.fileType?.toUpperCase() === 'JPEG' || 
                                        materialInDialog.fileType?.toUpperCase() === 'PNG' || 
                                        materialInDialog.fileType?.toUpperCase() === 'GIF') ? (
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <img 
                src={`${process.env.REACT_APP_API_URL || 'http://localhost:8080'}/api/materials/${materialInDialog.id}/stream`} 
                alt={materialInDialog.title}
                style={{ maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain' }}
              />
            </Box>
          ) : materialInDialog?.filePath && (materialInDialog.fileType?.toUpperCase() === 'VIDEO' || 
                                        materialInDialog.fileType?.toUpperCase() === 'MP4') ? (
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <video 
                controls 
                autoPlay
                style={{ maxWidth: '100%', maxHeight: '70vh' }}
                onEnded={() => handleMaterialProgressUpdate(materialInDialog.id, 100)}
              >
                <source src={`${process.env.REACT_APP_API_URL || 'http://localhost:8080'}/api/materials/${materialInDialog.id}/stream`} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            </Box>
          ) : materialInDialog?.filePath && (materialInDialog.fileType?.toUpperCase() === 'DOCUMENT' || 
                                        materialInDialog.fileType?.toUpperCase() === 'DOC' || 
                                        materialInDialog.fileType?.toUpperCase() === 'DOCX') ? (
            <Box>
              <Alert severity="info" sx={{ mb: 2 }}>
                Word documents may not display properly in this viewer. Click the button below to open in a new tab.
              </Alert>
              <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                <Button 
                  variant="contained" 
                  onClick={() => window.open(`${process.env.REACT_APP_API_URL || 'http://localhost:8080'}/api/materials/${materialInDialog.id}/stream`, '_blank')}
                  startIcon={<DocumentIcon />}
                >
                  Open Document in New Tab
                </Button>
              </Box>
              <Box sx={{ height: '60vh', width: '100%' }}>
                <iframe
                  src={`${process.env.REACT_APP_API_URL || 'http://localhost:8080'}/api/materials/${materialInDialog.id}/stream`}
                  style={{ width: '100%', height: '100%', border: 'none' }}
                  title={materialInDialog.title}
                />
              </Box>
            </Box>
          ) : ( 
            <Typography>No content available or unsupported file type.</Typography> 
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default UserLearningContentViewer;
