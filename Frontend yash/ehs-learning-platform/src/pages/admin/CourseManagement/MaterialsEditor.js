import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Button,
  Container,
  Grid,
  Typography,
  CircularProgress,
  Paper,
  Divider,
  Alert,
  Snackbar,
  Card,
  CardContent,
  CardActions,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Tooltip,
  Chip
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  DragIndicator as DragIcon,
  LibraryBooks as MaterialsIcon,
  Save as SaveIcon,
  Upload as UploadIcon,
  PictureAsPdf as PdfIcon,
  VideoLibrary as VideoIcon,
  Slideshow as PptIcon,
  Description as DocIcon,
  InsertDriveFile as FileIcon
} from '@mui/icons-material';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import AdminLayout from '../../../components/layout/AdminLayout';
import api from '../../../services/api';
import { useNavigate, useParams } from 'react-router-dom';

const MaterialsEditor = () => {
  const navigate = useNavigate();
  const { componentId } = useParams();
  
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  
  const [component, setComponent] = useState(null);
  const [materials, setMaterials] = useState([]);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    estimatedDuration: 15,
    file: null
  });
  
  // Form validation
  const [formErrors, setFormErrors] = useState({});
  
  // Load component and materials
  const fetchComponentData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Get component details
      const componentResponse = await api.get(`/api/modules/components/${componentId}`);
      setComponent(componentResponse.data);
      
      // Get materials
      const materialsResponse = await api.get(`/api/materials/component/${componentId}`);
      setMaterials(materialsResponse.data);
      
      setError(null);
    } catch (err) {
      console.error('Error fetching component data:', err);
      setError('Failed to load component data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [componentId]);
  
  useEffect(() => {
    fetchComponentData();
  }, [fetchComponentData]);
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Clear validation error when field is updated
    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: null
      });
    }
  };
  
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFormData({
        ...formData,
        file: e.target.files[0]
      });
      
      // Clear validation error when field is updated
      if (formErrors.file) {
        setFormErrors({
          ...formErrors,
          file: null
        });
      }
    }
  };
  
  const validateForm = (isEdit = false) => {
    const errors = {};
    
    if (!formData.title.trim()) {
      errors.title = 'Title is required';
    }
    
    if (formData.estimatedDuration <= 0) {
      errors.estimatedDuration = 'Duration must be greater than 0';
    }
    
    if (!isEdit && !formData.file) {
      errors.file = 'Please select a file to upload';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      estimatedDuration: 15,
      file: null
    });
    setFormErrors({});
    setEditingMaterial(null);
  };
  
  const handleOpenUploadDialog = () => {
    resetForm();
    setShowUploadDialog(true);
  };
  
  const handleCloseUploadDialog = () => {
    setShowUploadDialog(false);
    resetForm();
  };
  
  const handleOpenEditDialog = (material) => {
    setEditingMaterial(material);
    setFormData({
      title: material.title,
      description: material.description || '',
      estimatedDuration: material.estimatedDuration || 15,
      file: null
    });
    setShowEditDialog(true);
  };
  
  const handleCloseEditDialog = () => {
    setShowEditDialog(false);
    resetForm();
  };
  
  const handleUploadMaterial = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setUploading(true);
    try {
      const formDataObj = new FormData();
      formDataObj.append('file', formData.file);
      formDataObj.append('title', formData.title);
      formDataObj.append('description', formData.description || '');
      formDataObj.append('estimatedDuration', formData.estimatedDuration);
      formDataObj.append('componentId', componentId);
      
      await api.post('/api/materials/upload', formDataObj, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      setSuccess(true);
      handleCloseUploadDialog();
      
      // Refresh materials list
      fetchComponentData();
    } catch (err) {
      console.error('Error uploading material:', err);
      setError(err.response?.data?.message || 'Failed to upload material');
    } finally {
      setUploading(false);
    }
  };
  
  const handleUpdateMaterial = async (e) => {
    e.preventDefault();
    
    if (!validateForm(true)) {
      return;
    }
    
    setSaving(true);
    try {
      await api.put(`/api/materials/${editingMaterial.id}`, {
        title: formData.title,
        description: formData.description,
        estimatedDuration: formData.estimatedDuration
      });
      
      setSuccess(true);
      handleCloseEditDialog();
      
      // Refresh materials list
      fetchComponentData();
    } catch (err) {
      console.error('Error updating material:', err);
      setError(err.response?.data?.message || 'Failed to update material');
    } finally {
      setSaving(false);
    }
  };
  
  const handleReplaceMaterialFile = async (materialId) => {
    if (!formData.file) {
      setFormErrors({
        ...formErrors,
        file: 'Please select a file to upload'
      });
      return;
    }
    
    setUploading(true);
    try {
      const formDataObj = new FormData();
      formDataObj.append('file', formData.file);
      
      await api.put(`/api/materials/${materialId}/file`, formDataObj, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      setSuccess(true);
      handleCloseEditDialog();
      
      // Refresh materials list
      fetchComponentData();
    } catch (err) {
      console.error('Error replacing material file:', err);
      setError(err.response?.data?.message || 'Failed to replace material file');
    } finally {
      setUploading(false);
    }
  };
  
  const handleDeleteMaterial = async (materialId) => {
    if (window.confirm('Are you sure you want to delete this material? This action cannot be undone.')) {
      try {
        await api.delete(`/api/materials/${materialId}`);
        
        // Update local state
        setMaterials(materials.filter(m => m.id !== materialId));
        setSuccess(true);
      } catch (err) {
        console.error('Error deleting material:', err);
        setError(err.response?.data?.message || 'Failed to delete material');
      }
    }
  };
  
  const handleDragEnd = async (result) => {
    if (!result.destination) {
      return;
    }
    
    // Reorder the materials in the local state
    const reordered = Array.from(materials);
    const [removed] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, removed);
    
    setMaterials(reordered);
    
    // Send the new order to the server
    try {
      await api.put(`/api/materials/component/${componentId}/order`, reordered.map(m => m.id));
    } catch (err) {
      console.error('Error updating material order:', err);
      setError('Failed to save material order');
      // Revert to the original order if the API call fails
      fetchComponentData();
    }
  };
  
  const handleBackToModule = () => {
    // Extract moduleId from component and navigate back
    if (component?.trainingModule?.id) {
      navigate(`/admin/courses/edit/${component.trainingModule.id}`);
    } else {
      navigate('/admin/courses');
    }
  };
  
  const getFileTypeIcon = (fileType) => {
    switch (fileType) {
      case 'PDF':
        return <PdfIcon color="error" />;
      case 'VIDEO':
        return <VideoIcon color="primary" />;
      case 'PPT':
        return <PptIcon color="warning" />;
      case 'DOC':
        return <DocIcon color="info" />;
      default:
        return <FileIcon />;
    }
  };
  
  const getFileTypeName = (fileType) => {
    switch (fileType) {
      case 'PDF':
        return 'PDF Document';
      case 'VIDEO':
        return 'Video';
      case 'PPT':
        return 'Presentation';
      case 'DOC':
        return 'Document';
      case 'IMAGE':
        return 'Image';
      case 'XLS':
        return 'Spreadsheet';
      default:
        return 'File';
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
            <CircularProgress />
          </Box>
        </Container>
      </AdminLayout>
    );
  }

  const isPublished = component?.trainingModule?.status === 'PUBLISHED';

  return (
    <AdminLayout>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Box display="flex" alignItems="center" mb={3}>
              <Button
                startIcon={<ArrowBackIcon />}
                onClick={handleBackToModule}
                sx={{ mr: 2 }}
              >
                Back to Module
              </Button>
              <Typography variant="h4" component="h1">
                Learning Materials: {component.title}
              </Typography>
            </Box>
          </Grid>
          
          {error && (
            <Grid item xs={12}>
              <Alert severity="error">{error}</Alert>
            </Grid>
          )}
          
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, height: '100%' }}>
              <Typography variant="h6" gutterBottom>
                Component Details
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Module
                </Typography>
                <Typography variant="body1">
                  {component.trainingModule?.title || 'Unknown Module'}
                </Typography>
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Description
                </Typography>
                <Typography variant="body1">
                  {component.description || 'No description available'}
                </Typography>
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Materials
                </Typography>
                <Typography variant="body1">
                  {materials.length} material{materials.length !== 1 ? 's' : ''}
                </Typography>
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Total Duration
                </Typography>
                <Typography variant="body1">
                  {materials.reduce((sum, m) => sum + (m.estimatedDuration || 0), 0)} minutes
                </Typography>
              </Box>
              
              {isPublished && (
                <Alert severity="warning" sx={{ mt: 3 }}>
                  This module is published. You cannot modify the materials.
                </Alert>
              )}
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 3 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">
                  Learning Materials
                </Typography>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<AddIcon />}
                  onClick={handleOpenUploadDialog}
                  disabled={isPublished}
                >
                  Upload Material
                </Button>
              </Box>
              <Divider sx={{ mb: 3 }} />
              
              {materials.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="body1" color="text.secondary" gutterBottom>
                    No materials added yet
                  </Typography>
                  <Button
                    variant="outlined"
                    startIcon={<UploadIcon />}
                    onClick={handleOpenUploadDialog}
                    disabled={isPublished}
                    sx={{ mt: 2 }}
                  >
                    Upload Your First Material
                  </Button>
                </Box>
              ) : (
                <DragDropContext onDragEnd={handleDragEnd}>
                  <Droppable droppableId="materials">
                    {(provided) => (
                      <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                      >
                        {materials.map((material, index) => (
                          <Draggable
                            key={material.id}
                            draggableId={material.id}
                            index={index}
                            isDragDisabled={isPublished}
                          >
                            {(provided) => (
                              <Card
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                variant="outlined"
                                sx={{ mb: 2, position: 'relative' }}
                              >
                                <CardContent sx={{ pb: 1 }}>
                                  <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                                    {!isPublished && (
                                      <Box {...provided.dragHandleProps} sx={{ mr: 1, color: 'text.secondary', mt: 0.5 }}>
                                        <DragIcon />
                                      </Box>
                                    )}
                                    <Box sx={{ mr: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', width: 40, height: 40 }}>
                                      {getFileTypeIcon(material.fileType)}
                                    </Box>
                                    <Box sx={{ flexGrow: 1 }}>
                                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                                        <Box>
                                          <Typography variant="subtitle1" component="div" sx={{ fontWeight: 500 }}>
                                            {material.title}
                                          </Typography>
                                          <Typography variant="body2" color="text.secondary">
                                            {getFileTypeName(material.fileType)} · {material.estimatedDuration} min
                                          </Typography>
                                        </Box>
                                        <Chip 
                                          label={`${index + 1} of ${materials.length}`} 
                                          size="small" 
                                          variant="outlined" 
                                        />
                                      </Box>
                                      
                                      {material.description && (
                                        <Typography variant="body2" sx={{ mt: 1 }}>
                                          {material.description}
                                        </Typography>
                                      )}
                                    </Box>
                                  </Box>
                                </CardContent>
                                {!isPublished && (
                                  <CardActions sx={{ justifyContent: 'flex-end', pt: 0 }}>
                                    <Button
                                      size="small"
                                      onClick={() => handleOpenEditDialog(material)}
                                    >
                                      Edit
                                    </Button>
                                    <Button
                                      size="small"
                                      color="error"
                                      onClick={() => handleDeleteMaterial(material.id)}
                                    >
                                      Delete
                                    </Button>
                                  </CardActions>
                                )}
                              </Card>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>
              )}
            </Paper>
          </Grid>
        </Grid>
      </Container>
      
      {/* Upload Material Dialog */}
      <Dialog
        open={showUploadDialog}
        onClose={handleCloseUploadDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Upload Learning Material
        </DialogTitle>
        <DialogContent dividers>
          <form onSubmit={handleUploadMaterial}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={8}>
                <TextField
                  fullWidth
                  required
                  label="Title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  error={!!formErrors.title}
                  helperText={formErrors.title}
                />
              </Grid>
              
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  required
                  type="number"
                  label="Estimated Duration (minutes)"
                  name="estimatedDuration"
                  value={formData.estimatedDuration}
                  onChange={handleInputChange}
                  InputProps={{ inputProps: { min: 1 } }}
                  error={!!formErrors.estimatedDuration}
                  helperText={formErrors.estimatedDuration}
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Description (optional)"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                />
              </Grid>
              
              <Grid item xs={12}>
                <Box sx={{ border: 1, borderColor: formErrors.file ? 'error.main' : 'divider', borderRadius: 1, p: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Upload Material File
                  </Typography>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                    <Button
                      variant="outlined"
                      component="label"
                      startIcon={<UploadIcon />}
                    >
                      Select File
                      <input
                        type="file"
                        hidden
                        onChange={handleFileChange}
                        accept=".pdf,.doc,.docx,.ppt,.pptx,.mp4,.avi,.mov,.jpg,.jpeg,.png"
                      />
                    </Button>
                    <Typography variant="body2" sx={{ ml: 2 }}>
                      {formData.file ? formData.file.name : 'No file selected'}
                    </Typography>
                  </Box>
                  
                  {formErrors.file && (
                    <Typography variant="caption" color="error" sx={{ display: 'block', mt: 1 }}>
                      {formErrors.file}
                    </Typography>
                  )}
                  
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                    Supported file types: PDF, PowerPoint, Word, Video (MP4, AVI, MOV), Images
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </form>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseUploadDialog} disabled={uploading}>
            Cancel
          </Button>
          <Button 
            onClick={handleUploadMaterial}
            variant="contained" 
            color="primary"
            disabled={uploading}
            startIcon={uploading ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
          >
            {uploading ? 'Uploading...' : 'Upload Material'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Edit Material Dialog */}
      <Dialog
        open={showEditDialog}
        onClose={handleCloseEditDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Edit Learning Material
        </DialogTitle>
        <DialogContent dividers>
          <form onSubmit={handleUpdateMaterial}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={8}>
                <TextField
                  fullWidth
                  required
                  label="Title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  error={!!formErrors.title}
                  helperText={formErrors.title}
                />
              </Grid>
              
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  required
                  type="number"
                  label="Estimated Duration (minutes)"
                  name="estimatedDuration"
                  value={formData.estimatedDuration}
                  onChange={handleInputChange}
                  InputProps={{ inputProps: { min: 1 } }}
                  error={!!formErrors.estimatedDuration}
                  helperText={formErrors.estimatedDuration}
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Description (optional)"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                />
              </Grid>
              
              <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom>
                  Replace File (Optional)
                </Typography>
                
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                  <Button
                    variant="outlined"
                    component="label"
                    startIcon={<UploadIcon />}
                    size="small"
                  >
                    Select New File
                    <input
                      type="file"
                      hidden
                      onChange={handleFileChange}
                      accept=".pdf,.doc,.docx,.ppt,.pptx,.mp4,.avi,.mov,.jpg,.jpeg,.png"
                    />
                  </Button>
                  <Typography variant="body2" sx={{ ml: 2 }}>
                    {formData.file ? formData.file.name : 'Keep existing file'}
                  </Typography>
                </Box>
                
                {formData.file && (
                  <Button
                    variant="outlined"
                    color="primary"
                    onClick={() => handleReplaceMaterialFile(editingMaterial.id)}
                    disabled={uploading}
                    startIcon={uploading ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                    sx={{ mt: 2 }}
                  >
                    {uploading ? 'Uploading...' : 'Upload New File'}
                  </Button>
                )}
              </Grid>
            </Grid>
          </form>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEditDialog} disabled={saving}>
            Cancel
          </Button>
          <Button 
            onClick={handleUpdateMaterial}
            variant="contained" 
            color="primary"
            disabled={saving}
            startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>
      
      <Snackbar
        open={success}
        autoHideDuration={3000}
        onClose={() => setSuccess(false)}
      >
        <Alert severity="success" sx={{ width: '100%' }}>
          Operation completed successfully!
        </Alert>
      </Snackbar>
    </AdminLayout>
  );
};

export default MaterialsEditor;