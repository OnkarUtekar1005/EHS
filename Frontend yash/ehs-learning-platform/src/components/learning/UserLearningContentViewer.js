// src/components/learning/UserLearningContentViewer.js
import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Button, Card, CardContent, CardActions,
  CircularProgress, Alert, Grid, Divider, Chip, Dialog, 
  DialogTitle, DialogContent, DialogActions, IconButton,
  Paper, List, ListItem, ListItemIcon, ListItemText
} from '@mui/material';
import {
  PictureAsPdf, VideoLibrary, Description, Link, Image, 
  Article, CheckCircle, Close, Done, InsertDriveFile
} from '@mui/icons-material';
import { learningMaterialService } from '../../services/api';

// Helper component for displaying PDF files
const PdfDisplay = ({ materialId, title }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Use direct URL approach for PDFs
  const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:8080';
  const fileUrl = `${baseUrl}/api/materials/${materialId}/stream`;
  
  return (
    <Box>
      <Box sx={{ height: '70vh', width: '100%', border: '1px solid #ddd' }}>
        <iframe 
          src={fileUrl}
          style={{ width: '100%', height: '100%', border: 'none' }}
          title={title}
        />
      </Box>
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
        <Button 
          variant="contained"
          onClick={() => window.open(fileUrl, '_blank')}
        >
          Open PDF in New Tab
        </Button>
      </Box>
    </Box>
  );
};

// Helper component for displaying images
const ImageDisplay = ({ materialId, title }) => {
  // Use direct URL approach for images
  const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:8080';
  const fileUrl = `${baseUrl}/api/materials/${materialId}/stream`;
  
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
      <img 
        src={fileUrl}
        alt={title}
        style={{ maxWidth: '100%', maxHeight: '70vh' }}
        onLoad={() => console.log("Image loaded successfully from direct URL")}
        onError={(e) => console.error("Image load error from direct URL:", e)}
      />
    </Box>
  );
};

// Helper component for displaying videos
const VideoDisplay = ({ materialId, title, onComplete }) => {
  // Use direct URL approach for videos
  const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:8080';
  const fileUrl = `${baseUrl}/api/materials/${materialId}/stream`;
  
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
      <video 
        controls 
        autoPlay
        width="100%"
        style={{ maxHeight: '70vh' }}
        onEnded={onComplete}
      >
        <source src={fileUrl} type="video/mp4" />
        Your browser does not support the video tag.
      </video>
    </Box>
  );
};

const UserLearningContentViewer = ({ componentId, onComplete }) => {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  
  // Fetch learning materials when component mounts
  useEffect(() => {
    const fetchMaterials = async () => {
      if (!componentId) {
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        
        // First get the component itself to access its content property
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
        
        if (materialAssociations.length === 0) {
          // Try the standard API call as fallback
          const response = await learningMaterialService.getMaterialsWithProgress(componentId);
          
          if (response && response.data && response.data.length > 0) {
            const materialsData = response.data.map(material => ({
              ...material,
              progress: material.progress || 0,
              completed: material.completed || false
            }));
            
            console.log("Fetched materials from API:", materialsData);
            setMaterials(materialsData);
          } else {
            console.warn("No materials received for component:", componentId);
            setMaterials([]);
          }
        } else {
          // Use the material associations to fetch individual materials
          const fetchedMaterials = [];
          
          for (const association of materialAssociations) {
            try {
              const materialResponse = await learningMaterialService.getMaterialWithProgress(association.materialId);
              if (materialResponse && materialResponse.data) {
                fetchedMaterials.push({
                  ...materialResponse.data,
                  progress: materialResponse.data.progress || 0,
                  completed: materialResponse.data.completed || false,
                  sequenceOrder: association.sequenceOrder
                });
              }
            } catch (materialErr) {
              console.error(`Error fetching material ${association.materialId}:`, materialErr);
            }
          }
          
          // Sort by sequence order
          fetchedMaterials.sort((a, b) => (a.sequenceOrder || 0) - (b.sequenceOrder || 0));
          
          console.log("Fetched materials from associations:", fetchedMaterials);
          setMaterials(fetchedMaterials);
        }
      } catch (err) {
        console.error("Error fetching materials:", err);
        setError("Failed to load learning materials. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    
    fetchMaterials();
  }, [componentId]);
  
  // Update material progress
  const updateProgress = async (materialId, progress = 100) => {
    try {
      await learningMaterialService.updateProgress(materialId, { 
        progress: progress,
        timeSpent: 1 // Default time spent
      });
      
      // Update local state
      setMaterials(prevMaterials => 
        prevMaterials.map(material => 
          material.id === materialId 
            ? { ...material, progress, completed: progress >= 100 }
            : material
        )
      );
    } catch (err) {
      console.error("Error updating material progress:", err);
      setError("Failed to update progress. Please try again.");
    }
  };
  
  // Check if all materials are completed
  const allCompleted = materials.length > 0 && 
    materials.every(material => material.completed || material.progress >= 100);
  
  // Material icon mapping
  const getMaterialIcon = (fileType) => {
    if (!fileType) return <InsertDriveFile />;
    
    const type = fileType.toUpperCase();
    if (type === 'PDF') return <PictureAsPdf />;
    if (type === 'VIDEO' || type === 'MP4') return <VideoLibrary />;
    if (type === 'DOCUMENT' || type === 'DOC' || type === 'DOCX') return <Description />;
    if (type === 'IMAGE' || type === 'JPG' || type === 'PNG' || type === 'JPEG') return <Image />;
    if (type === 'HTML' || type === 'CONTENT') return <Article />;
    if (type === 'EXTERNAL') return <Link />;
    
    return <InsertDriveFile />;
  };
  
  // Handle opening material
  const handleOpenMaterial = async (material) => {
    console.log("Opening material:", material);
    setSelectedMaterial(material);
    
    if (material.externalUrl) {
      // Open external URL in new tab
      console.log("Opening external URL:", material.externalUrl);
      window.open(material.externalUrl, '_blank', 'noopener,noreferrer');
      updateProgress(material.id);
    } else if (material.filePath) {
      const fileType = material.fileType?.toUpperCase();
      console.log("Opening file type:", fileType, "File path:", material.filePath);
      
      // For document types, open in new tab or iframe
      if (fileType === 'DOCUMENT' || fileType === 'DOC' || fileType === 'DOCX' || fileType === 'PDF') {
        // Direct URL approach for better browser viewing
        const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:8080';
        const fileUrl = `${baseUrl}/api/materials/${material.id}/stream`;
        console.log("Opening file directly with URL:", fileUrl);
        
        // For PDFs, we can open them in an iframe in the dialog
        if (fileType === 'PDF') {
          console.log("Opening PDF in dialog");
          setDialogOpen(true);
        } else {
          // For other document types, open in new tab
          console.log("Opening document in new tab");
          window.open(fileUrl, '_blank', 'noopener,noreferrer');
          // Mark as completed
          updateProgress(material.id);
        }
      } else {
        // For other types, open in dialog
        console.log("Opening dialog for file type:", fileType);
        setDialogOpen(true);
      }
    } else if (material.content) {
      // Open content in dialog
      console.log("Opening content in dialog");
      setDialogOpen(true);
    } else {
      // No content, just mark as completed
      console.log("No viewable content, marking as completed");
      updateProgress(material.id);
    }
  };
  
  // Close dialog
  const handleCloseDialog = () => {
    if (selectedMaterial) {
      updateProgress(selectedMaterial.id);
    }
    setDialogOpen(false);
  };
  
  // Handle component completion
  const handleComplete = () => {
    if (onComplete) {
      onComplete();
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
      <Box>
        <Alert severity="info" sx={{ mb: 2 }}>
          No learning materials are defined for this step.
        </Alert>
        <Button 
          variant="contained" 
          color="primary" 
          onClick={handleComplete}
          sx={{ mt: 2 }}
        >
          Continue to Next Step
        </Button>
      </Box>
    );
  }
  
  return (
    <Box>
      <Typography variant="h6" gutterBottom>Learning Materials</Typography>
      
      <List sx={{ mb: 3 }}>
        {materials.map(material => (
          <Card key={material.id} variant="outlined" sx={{ mb: 2 }}>
            <CardContent>
              <Grid container spacing={2} alignItems="center">
                <Grid item>
                  <ListItemIcon>
                    {getMaterialIcon(material.fileType)}
                  </ListItemIcon>
                </Grid>
                <Grid item xs>
                  <Typography variant="h6" component="div">
                    {material.title}
                  </Typography>
                  
                  {material.description && (
                    <Typography variant="body2" color="text.secondary">
                      {material.description}
                    </Typography>
                  )}
                </Grid>
                
                {material.completed && (
                  <Grid item>
                    <Chip 
                      icon={<CheckCircle />}
                      label="Completed"
                      color="success"
                      size="small"
                    />
                  </Grid>
                )}
              </Grid>
            </CardContent>
            <CardActions>
              <Button 
                variant="contained" 
                size="small"
                onClick={() => handleOpenMaterial(material)}
              >
                View Material
              </Button>
              
              {!material.completed && (
                <Button 
                  size="small"
                  onClick={() => updateProgress(material.id)}
                >
                  Mark as Completed
                </Button>
              )}
            </CardActions>
          </Card>
        ))}
      </List>
      
      <Divider sx={{ my: 2 }} />
      
      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button 
          variant="contained" 
          color="primary"
          endIcon={<Done />}
          onClick={handleComplete}
          disabled={!allCompleted}
        >
          Complete Step
        </Button>
      </Box>
      
      {/* Material Viewer Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        fullWidth
        maxWidth="lg"
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">{selectedMaterial?.title}</Typography>
            <IconButton onClick={handleCloseDialog} size="small">
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        
        <DialogContent dividers>
          {selectedMaterial?.content && (
            <Paper elevation={0} sx={{ p: 2 }}>
              <div dangerouslySetInnerHTML={{ __html: selectedMaterial.content }} />
            </Paper>
          )}
          
          {selectedMaterial?.filePath && selectedMaterial.fileType?.toUpperCase() === 'VIDEO' && (
            <VideoDisplay materialId={selectedMaterial.id} title={selectedMaterial.title} onComplete={() => updateProgress(selectedMaterial.id)} />
          )}
          
          {selectedMaterial?.filePath && ['IMAGE', 'JPG', 'JPEG', 'PNG', 'GIF'].includes(selectedMaterial.fileType?.toUpperCase()) && (
            <ImageDisplay materialId={selectedMaterial.id} title={selectedMaterial.title} />
          )}
          
          {selectedMaterial?.filePath && selectedMaterial.fileType?.toUpperCase() === 'PDF' && (
            <PdfDisplay materialId={selectedMaterial.id} title={selectedMaterial.title} />
          )}
        </DialogContent>
        
        <DialogActions>
          <Button onClick={handleCloseDialog}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UserLearningContentViewer;