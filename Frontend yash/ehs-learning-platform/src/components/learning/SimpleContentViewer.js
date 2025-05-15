import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Button, Card, CardContent, CardActions,
  CircularProgress, Alert, Divider, Dialog, DialogContent, 
  DialogTitle, IconButton, LinearProgress
} from '@mui/material';
import {
  Close, OpenInNew, CheckCircle
} from '@mui/icons-material';
import { learningMaterialService } from '../../services/api';
import SimpleMaterialViewer from './SimpleMaterialViewer';

/**
 * Simple Content Viewer
 * A stripped-down learning content viewer that uses a minimalist approach to display files
 */
const SimpleContentViewer = ({ componentId, onComplete }) => {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  
  // Fetch materials for the component
  useEffect(() => {
    if (!componentId) {
      setLoading(false);
      return;
    }
    
    const fetchMaterials = async () => {
      try {
        setLoading(true);
        const response = await learningMaterialService.getMaterialsWithProgress(componentId);
        
        if (response && response.data && response.data.length > 0) {
          // Process materials data
          const materialsData = response.data.map(material => ({
            ...material,
            progress: material.progress || 0,
            completed: material.completed || false
          }));
          
          setMaterials(materialsData);
        } else {
          console.warn("No materials received for component:", componentId);
          setMaterials([]);
        }
      } catch (err) {
        console.error("Error fetching materials:", err);
        setError("Failed to load learning materials. Please refresh the page to try again.");
      } finally {
        setLoading(false);
      }
    };
    
    fetchMaterials();
  }, [componentId]);
  
  // Update material progress
  const updateProgress = async (materialId, data = { progress: 100 }) => {
    try {
      // Call API to update progress
      await learningMaterialService.updateProgress(materialId, { 
        progress: data.progress || 100,
        timeSpent: data.timeSpent || 1
      });
      
      // Update local state
      setMaterials(prevMaterials => 
        prevMaterials.map(material => 
          material.id === materialId 
            ? { 
                ...material, 
                progress: data.progress || 100, 
                completed: (data.progress || 100) >= 100 
              }
            : material
        )
      );
    } catch (err) {
      console.error("Error updating material progress:", err);
      // Still update local state for better UX
      setMaterials(prevMaterials => 
        prevMaterials.map(material => 
          material.id === materialId 
            ? { 
                ...material, 
                progress: data.progress || 100, 
                completed: (data.progress || 100) >= 100 
              }
            : material
        )
      );
    }
  };
  
  // Check if all materials are completed
  const allCompleted = materials.length > 0 && 
    materials.every(material => material.completed || material.progress >= 100);
  
  // Handle opening material
  const handleOpenMaterial = (material) => {
    setSelectedMaterial(material);
    setDialogOpen(true);
  };
  
  // Open material directly in a new tab
  const handleOpenDirectly = (material) => {
    if (!material || !material.id) return;
    
    // Get the URL
    const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:8080';
    const token = localStorage.getItem('token');
    const url = `${baseUrl}/api/materials/${material.id}/stream?token=${encodeURIComponent(token || '')}`;
    
    window.open(url, '_blank');
    
    // Update progress
    if (material.progress < 75) {
      updateProgress(material.id, { progress: 75 });
    }
  };
  
  // Handle closing dialog
  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedMaterial(null);
  };
  
  // Handle material completion
  const handleMaterialComplete = (materialId, data = {}) => {
    updateProgress(materialId, data);
  };
  
  // Handle component completion
  const handleComponentComplete = () => {
    if (onComplete) {
      onComplete();
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
    return <Alert severity="error">{error}</Alert>;
  }
  
  if (materials.length === 0) {
    return (
      <Box>
        <Alert severity="info" sx={{ mb: 2 }}>
          No learning materials defined for this step.
        </Alert>
        <Button 
          variant="contained" 
          color="primary" 
          onClick={handleComponentComplete}
        >
          Continue to Next Step
        </Button>
      </Box>
    );
  }
  
  return (
    <Box>
      <Typography variant="h6" gutterBottom>Learning Materials</Typography>
      
      {materials.map(material => (
        <Card key={material.id} variant="outlined" sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant="h6">{material.title}</Typography>
            
            {material.description && (
              <Typography variant="body2" color="text.secondary">
                {material.description}
              </Typography>
            )}
            
            {/* Progress bar */}
            <Box sx={{ mt: 2 }}>
              <LinearProgress 
                variant="determinate" 
                value={material.progress || 0} 
                color={material.completed ? "success" : "primary"}
                sx={{ height: 10, borderRadius: 5 }}
              />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                <Typography variant="caption" color="text.secondary">
                  {material.completed ? "Completed" : material.progress > 0 ? "In Progress" : "Not Started"}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {Math.round(material.progress || 0)}%
                </Typography>
              </Box>
            </Box>
          </CardContent>
          
          <CardActions>
            <Button 
              variant="contained" 
              size="small"
              onClick={() => handleOpenMaterial(material)}
            >
              View Material
            </Button>
            
            <Button
              variant="outlined"
              size="small"
              startIcon={<OpenInNew />}
              onClick={() => handleOpenDirectly(material)}
            >
              Open in New Tab
            </Button>
            
            {!material.completed && (
              <Button 
                color="success"
                size="small"
                startIcon={<CheckCircle />}
                onClick={() => updateProgress(material.id)}
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
        PaperProps={{
          sx: { minHeight: '80vh', maxHeight: '90vh' }
        }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">{selectedMaterial?.title}</Typography>
          <IconButton onClick={handleCloseDialog}>
            <Close />
          </IconButton>
        </DialogTitle>
        
        <DialogContent dividers>
          {selectedMaterial && (
            <SimpleMaterialViewer 
              material={selectedMaterial}
              onComplete={handleMaterialComplete}
            />
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default SimpleContentViewer;