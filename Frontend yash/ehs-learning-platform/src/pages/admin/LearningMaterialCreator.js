// src/pages/admin/LearningMaterialCreator.js
import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  TextField,
  Grid,
  Button,
  IconButton,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
  Tooltip,
  List,
  ListItem,
  Divider,
  ListItemText,
  Tab,
  Tabs
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  CloudUpload as CloudUploadIcon,
  Link as LinkIcon,
  Code as CodeIcon,
  VideoLibrary as VideoIcon,
  Description as DocumentIcon,
  Image as ImageIcon,
  PictureAsPdf as PdfIcon,
  Upload as UploadIcon
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';

// Mock API service - replace with actual API calls
const learningMaterialService = {
  getMaterials: (componentId) => Promise.resolve([]),
  uploadFile: (componentId, file, data) => Promise.resolve({ id: 'new-id', ...data }),
  createContent: (componentId, data) => Promise.resolve({ id: 'new-id', ...data }),
  addExternalUrl: (componentId, data) => Promise.resolve({ id: 'new-id', ...data }),
  updateMaterial: (id, data) => Promise.resolve({ id, ...data }),
  deleteMaterial: (id) => Promise.resolve(true),
  reorderMaterials: (componentId, materialOrder) => Promise.resolve(true)
};

// Material type constants - should match backend enum
const MATERIAL_TYPES = {
  PDF: "PDF",
  VIDEO: "VIDEO",
  PRESENTATION: "PRESENTATION",
  DOCUMENT: "DOCUMENT",
  HTML: "HTML",
  IMAGE: "IMAGE",
  EXTERNAL: "EXTERNAL"
};

const LearningMaterialCreator = ({ 
  componentId, 
  initialMaterials = [], 
  onSave, 
  onCancel 
}) => {
  // State
  const [materials, setMaterials] = useState(initialMaterials);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Dialog state
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogType, setDialogType] = useState('');
  const [currentMaterial, setCurrentMaterial] = useState(null);
  const [editingIndex, setEditingIndex] = useState(-1);
  
  // Material content state
  const [materialData, setMaterialData] = useState({
    title: '',
    description: '',
    fileType: MATERIAL_TYPES.PDF,
    externalUrl: '',
    content: '',
    estimatedDuration: 5,
    file: null
  });
  
  // Tab state for different material types
  const [tabValue, setTabValue] = useState(0);
  
  // File upload state
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  
  const navigate = useNavigate();
  
  // Load existing materials if component ID is provided and no initial materials
  useEffect(() => {
    if (componentId && initialMaterials.length === 0) {
      fetchMaterials();
    } else if (initialMaterials.length > 0) {
      setMaterials(initialMaterials);
    }
  }, [componentId, initialMaterials]);
  
  // Fetch materials
  const fetchMaterials = async () => {
    try {
      setLoading(true);
      const response = await learningMaterialService.getMaterials(componentId);
      setMaterials(response);
    } catch (err) {
      console.error('Error fetching materials:', err);
      setError('Failed to load learning materials.');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    
    // Update file type based on selected tab
    const fileTypes = [
      MATERIAL_TYPES.PDF, 
      MATERIAL_TYPES.VIDEO, 
      MATERIAL_TYPES.EXTERNAL, 
      MATERIAL_TYPES.HTML
    ];
    
    setMaterialData({
      ...materialData,
      fileType: fileTypes[newValue]
    });
  };
  
  // Handle input change for material data
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setMaterialData({
      ...materialData,
      [name]: value
    });
  };
  
  // Handle rich text editor change
  const handleContentChange = (content) => {
    setMaterialData({
      ...materialData,
      content
    });
  };
  
  // Handle file selection
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setSelectedFile(file);
    setMaterialData({
      ...materialData,
      file
    });
    
    // Generate preview URL for image files
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setPreviewUrl('');
    }
    
    // Automatically detect file type
    if (file.type.includes('pdf')) {
      setMaterialData(prev => ({ ...prev, fileType: MATERIAL_TYPES.PDF }));
      setTabValue(0);
    } else if (file.type.includes('video')) {
      setMaterialData(prev => ({ ...prev, fileType: MATERIAL_TYPES.VIDEO }));
      setTabValue(1);
    } else if (file.type.includes('image')) {
      setMaterialData(prev => ({ ...prev, fileType: MATERIAL_TYPES.IMAGE }));
    } else if (file.type.includes('powerpoint') || file.name.endsWith('.ppt') || file.name.endsWith('.pptx')) {
      setMaterialData(prev => ({ ...prev, fileType: MATERIAL_TYPES.PRESENTATION }));
    } else if (file.type.includes('word') || file.name.endsWith('.doc') || file.name.endsWith('.docx')) {
      setMaterialData(prev => ({ ...prev, fileType: MATERIAL_TYPES.DOCUMENT }));
    }
  };
  
  // Clear file selection
  const handleClearFile = () => {
    setSelectedFile(null);
    setPreviewUrl('');
    setMaterialData({
      ...materialData,
      file: null
    });
  };
  
  // Open dialog to add new material
  const handleAddMaterial = () => {
    setCurrentMaterial(null);
    setMaterialData({
      title: '',
      description: '',
      fileType: MATERIAL_TYPES.PDF,
      externalUrl: '',
      content: '',
      estimatedDuration: 5,
      file: null
    });
    setSelectedFile(null);
    setPreviewUrl('');
    setTabValue(0);
    setEditingIndex(-1);
    setOpenDialog(true);
  };
  
  // Open dialog to edit existing material
  const handleEditMaterial = (material, index) => {
    setCurrentMaterial(material);
    setMaterialData({
      title: material.title || '',
      description: material.description || '',
      fileType: material.fileType || MATERIAL_TYPES.PDF,
      externalUrl: material.externalUrl || '',
      content: material.content || '',
      estimatedDuration: material.estimatedDuration || 5,
      file: null
    });
    
    // Set appropriate tab
    if (material.fileType === MATERIAL_TYPES.PDF || 
        material.fileType === MATERIAL_TYPES.PRESENTATION ||
        material.fileType === MATERIAL_TYPES.DOCUMENT ||
        material.fileType === MATERIAL_TYPES.IMAGE) {
      setTabValue(0);
    } else if (material.fileType === MATERIAL_TYPES.VIDEO) {
      setTabValue(1);
    } else if (material.fileType === MATERIAL_TYPES.EXTERNAL) {
      setTabValue(2);
    } else if (material.fileType === MATERIAL_TYPES.HTML) {
      setTabValue(3);
    }
    
    setEditingIndex(index);
    setOpenDialog(true);
  };
  
  // Delete material
  const handleDeleteMaterial = async (material, index) => {
    try {
      setLoading(true);
      
      // If it's a new material that hasn't been saved yet
      if (!material.id) {
        const newMaterials = [...materials];
        newMaterials.splice(index, 1);
        setMaterials(newMaterials);
        return;
      }
      
      // Otherwise delete from server
      await learningMaterialService.deleteMaterial(material.id);
      
      const newMaterials = [...materials];
      newMaterials.splice(index, 1);
      setMaterials(newMaterials);
      
      setSuccess('Material deleted successfully');
    } catch (err) {
      console.error('Error deleting material:', err);
      setError('Failed to delete material');
    } finally {
      setLoading(false);
    }
  };
  
  // Close dialog
  const handleCloseDialog = () => {
    setOpenDialog(false);
  };
  
  // Save material
  const handleSaveMaterial = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Validate required fields
      if (!materialData.title) {
        setError('Title is required');
        setLoading(false);
        return;
      }
      
      // For file uploads
      if ((tabValue === 0) && !currentMaterial && !selectedFile) {
        setError('Please select a file to upload');
        setLoading(false);
        return;
      }
      
      // For external URLs
      if (tabValue === 2 && !materialData.externalUrl) {
        setError('External URL is required');
        setLoading(false);
        return;
      }
      
      // For HTML content
      if (tabValue === 3 && !materialData.content) {
        setError('Content is required');
        setLoading(false);
        return;
      }
      
      let newMaterial;
      
      // Handle file upload
      if (tabValue === 0 && selectedFile) {
        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('title', materialData.title);
        formData.append('description', materialData.description);
        formData.append('estimatedDuration', materialData.estimatedDuration);
        
        if (editingIndex >= 0 && currentMaterial.id) {
          // Update existing file material is not implemented in this mock
          // In a real implementation, you would need to handle file replacement
          newMaterial = await learningMaterialService.updateMaterial(currentMaterial.id, materialData);
        } else {
          newMaterial = await learningMaterialService.uploadFile(componentId, selectedFile, materialData);
        }
      } 
      // Handle external URL
      else if (tabValue === 2) {
        if (editingIndex >= 0 && currentMaterial.id) {
          newMaterial = await learningMaterialService.updateMaterial(currentMaterial.id, materialData);
        } else {
          newMaterial = await learningMaterialService.addExternalUrl(componentId, materialData);
        }
      } 
      // Handle HTML content
      else if (tabValue === 3) {
        if (editingIndex >= 0 && currentMaterial.id) {
          newMaterial = await learningMaterialService.updateMaterial(currentMaterial.id, materialData);
        } else {
          newMaterial = await learningMaterialService.createContent(componentId, materialData);
        }
      }
      // For editing existing material without changing file
      else if (editingIndex >= 0 && currentMaterial.id) {
        newMaterial = await learningMaterialService.updateMaterial(currentMaterial.id, materialData);
      }
      
      const newMaterials = [...materials];
      
      if (editingIndex >= 0) {
        newMaterials[editingIndex] = newMaterial;
      } else {
        newMaterials.push(newMaterial);
      }
      
      setMaterials(newMaterials);
      setSuccess('Material saved successfully');
      setOpenDialog(false);
    } catch (err) {
      console.error('Error saving material:', err);
      setError('Failed to save material');
    } finally {
      setLoading(false);
    }
  };
  
  // Move material up in the list
  const handleMoveUp = (index) => {
    if (index === 0) return;
    
    const newMaterials = [...materials];
    const temp = newMaterials[index];
    newMaterials[index] = newMaterials[index - 1];
    newMaterials[index - 1] = temp;
    
    setMaterials(newMaterials);
  };
  
  // Move material down in the list
  const handleMoveDown = (index) => {
    if (index === materials.length - 1) return;
    
    const newMaterials = [...materials];
    const temp = newMaterials[index];
    newMaterials[index] = newMaterials[index + 1];
    newMaterials[index + 1] = temp;
    
    setMaterials(newMaterials);
  };
  
  // Save all materials and close
  const handleSaveAll = async () => {
    try {
      setLoading(true);
      
      if (materials.length === 0) {
        setError('Please add at least one learning material');
        setLoading(false);
        return;
      }
      
      // In a real implementation, you would save the order here
      const materialOrder = materials.map(material => material.id);
      await learningMaterialService.reorderMaterials(componentId, materialOrder);
      
      setSuccess('All materials saved successfully');
      
      // Pass the updated materials to parent component
      onSave(materials);
    } catch (err) {
      console.error('Error saving materials:', err);
      setError('Failed to save materials');
    } finally {
      setLoading(false);
    }
  };
  
  // Get icon for material type
  const getMaterialIcon = (type) => {
    switch (type) {
      case MATERIAL_TYPES.PDF:
        return <PdfIcon />;
      case MATERIAL_TYPES.VIDEO:
        return <VideoIcon />;
      case MATERIAL_TYPES.PRESENTATION:
        return <DocumentIcon />;
      case MATERIAL_TYPES.DOCUMENT:
        return <DocumentIcon />;
      case MATERIAL_TYPES.HTML:
        return <CodeIcon />;
      case MATERIAL_TYPES.EXTERNAL:
        return <LinkIcon />;
      case MATERIAL_TYPES.IMAGE:
        return <ImageIcon />;
      default:
        return <DocumentIcon />;
    }
  };
  
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper elevation={2} sx={{ p: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4">
            Learning Materials
          </Typography>
          <Box>
            <Button 
              variant="contained" 
              color="primary" 
              startIcon={<SaveIcon />}
              onClick={handleSaveAll}
              disabled={loading}
              sx={{ mr: 1 }}
            >
              {loading ? <CircularProgress size={24} /> : 'Save All'}
            </Button>
            <Button 
              variant="outlined"
              startIcon={<CancelIcon />}
              onClick={onCancel}
              disabled={loading}
            >
              Cancel
            </Button>
          </Box>
        </Box>
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess('')}>
            {success}
          </Alert>
        )}
        
        {/* Learning Materials List */}
        <Box mb={3}>
          <Typography variant="h6" gutterBottom>
            Material List
          </Typography>
          
          {materials.length === 0 ? (
            <Box p={3} textAlign="center" border="1px dashed #ccc" borderRadius={1}>
              <Typography color="textSecondary" paragraph>
                No learning materials added yet. Add your first material.
              </Typography>
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={handleAddMaterial}
              >
                Add Learning Material
              </Button>
            </Box>
          ) : (
            <>
              <List>
                {materials.map((material, index) => (
                  <ListItem key={index} divider={index < materials.length - 1}>
                    <Card variant="outlined" sx={{ width: '100%' }}>
                      <CardContent>
                        <Grid container spacing={2}>
                          <Grid item xs={1}>
                            <Box display="flex" alignItems="center" justifyContent="center" height="100%">
                              <Typography variant="body2" fontWeight="bold">
                                {index + 1}
                              </Typography>
                            </Box>
                          </Grid>
                          <Grid item xs={7}>
                            <Box display="flex" alignItems="center">
                              {getMaterialIcon(material.fileType)}
                              <Box ml={2}>
                                <Typography variant="subtitle1" component="div">
                                  {material.title}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  Type: {material.fileType} • Duration: {material.estimatedDuration} min
                                </Typography>
                                {material.description && (
                                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                    {material.description}
                                  </Typography>
                                )}
                              </Box>
                            </Box>
                          </Grid>
                          <Grid item xs={4}>
                            <Box display="flex" justifyContent="flex-end">
                              <Tooltip title="Move Up">
                                <span>
                                  <IconButton 
                                    disabled={index === 0}
                                    onClick={() => handleMoveUp(index)}
                                  >
                                    <span className="material-icons">arrow_upward</span>
                                  </IconButton>
                                </span>
                              </Tooltip>
                              <Tooltip title="Move Down">
                                <span>
                                  <IconButton 
                                    disabled={index === materials.length - 1}
                                    onClick={() => handleMoveDown(index)}
                                  >
                                    <span className="material-icons">arrow_downward</span>
                                  </IconButton>
                                </span>
                              </Tooltip>
                              <Tooltip title="Edit">
                                <IconButton onClick={() => handleEditMaterial(material, index)}>
                                  <span className="material-icons">edit</span>
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Delete">
                                <IconButton onClick={() => handleDeleteMaterial(material, index)}>
                                  <DeleteIcon />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>
                  </ListItem>
                ))}
              </List>
              
              <Box mt={2} display="flex" justifyContent="center">
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={handleAddMaterial}
                >
                  Add More Material
                </Button>
              </Box>
            </>
          )}
        </Box>
      </Paper>
      
      {/* Add/Edit Material Dialog */}
      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>
          {editingIndex >= 0 ? 'Edit Learning Material' : 'Add Learning Material'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ width: '100%', mt: 2 }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs value={tabValue} onChange={handleTabChange} aria-label="material type tabs">
                <Tab icon={<UploadIcon />} label="Upload File" />
                <Tab icon={<VideoIcon />} label="Video" />
                <Tab icon={<LinkIcon />} label="External Link" />
                <Tab icon={<CodeIcon />} label="HTML Content" />
              </Tabs>
            </Box>
            
            <Box mt={3}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Title"
                    name="title"
                    value={materialData.title}
                    onChange={handleInputChange}
                    required
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Description"
                    name="description"
                    value={materialData.description}
                    onChange={handleInputChange}
                    multiline
                    rows={2}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Estimated Duration (minutes)"
                    name="estimatedDuration"
                    type="number"
                    value={materialData.estimatedDuration}
                    onChange={handleInputChange}
                    inputProps={{ min: 1 }}
                  />
                </Grid>
                
                {/* File Upload Tab */}
                {tabValue === 0 && (
                  <Grid item xs={12}>
                    <Box 
                      border="2px dashed #ccc"
                      borderRadius={1}
                      p={3}
                      textAlign="center"
                      sx={{
                        cursor: 'pointer',
                        '&:hover': {
                          borderColor: 'primary.main',
                        }
                      }}
                      component="label"
                    >
                      <input
                        type="file"
                        hidden
                        onChange={handleFileSelect}
                        accept=".pdf,.ppt,.pptx,.doc,.docx,.jpg,.jpeg,.png"
                      />
                      <CloudUploadIcon fontSize="large" color="primary" />
                      <Typography variant="h6" mt={1}>
                        Click to upload or drag and drop
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Supports PDF, PPT, DOC, and images
                      </Typography>
                      
                      {selectedFile && (
                        <Box mt={2} p={2} bgcolor="#f5f5f5" borderRadius={1}>
                          <Typography variant="body2">
                            Selected file: {selectedFile.name}
                          </Typography>
                          {previewUrl && (
                            <Box mt={2} display="flex" justifyContent="center">
                              <img 
                                src={previewUrl} 
                                alt="Preview" 
                                style={{ maxWidth: '100%', maxHeight: '200px' }} 
                              />
                            </Box>
                          )}
                          <Button 
                            size="small" 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleClearFile();
                            }}
                            sx={{ mt: 1 }}
                          >
                            Remove
                          </Button>
                        </Box>
                      )}
                    </Box>
                  </Grid>
                )}
                
                {/* Video Tab */}
                {tabValue === 1 && (
                  <Grid item xs={12}>
                    <Box 
                      border="2px dashed #ccc"
                      borderRadius={1}
                      p={3}
                      textAlign="center"
                      sx={{
                        cursor: 'pointer',
                        '&:hover': {
                          borderColor: 'primary.main',
                        }
                      }}
                      component="label"
                    >
                      <input
                        type="file"
                        hidden
                        onChange={handleFileSelect}
                        accept="video/*"
                      />
                      <VideoIcon fontSize="large" color="primary" />
                      <Typography variant="h6" mt={1}>
                        Upload Video
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Supports MP4, AVI, MOV, and other video formats
                      </Typography>
                      
                      {selectedFile && (
                        <Box mt={2} p={2} bgcolor="#f5f5f5" borderRadius={1}>
                          <Typography variant="body2">
                            Selected file: {selectedFile.name}
                          </Typography>
                          <Button 
                            size="small" 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleClearFile();
                            }}
                            sx={{ mt: 1 }}
                          >
                            Remove
                          </Button>
                        </Box>
                      )}
                    </Box>
                  </Grid>
                )}
                
                {/* External Link Tab */}
                {tabValue === 2 && (
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="External URL"
                      name="externalUrl"
                      value={materialData.externalUrl}
                      onChange={handleInputChange}
                      placeholder="https://example.com/video"
                      required
                      helperText="Enter URL for external content (YouTube, Vimeo, etc.)"
                    />
                  </Grid>
                )}
                
                {/* HTML Content Tab */}
                {tabValue === 3 && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle1" gutterBottom>
                      HTML Content
                      </Typography>
                    <Box sx={{ height: 300, mb: 2 }}>
                      <TextField
                        fullWidth
                        multiline
                        rows={10}
                        value={materialData.content}
                        onChange={(e) => handleContentChange(e.target.value)}
                        placeholder="Enter your HTML content here..."
                        variant="outlined"
                      />
                    </Box>
                  </Grid>
                )}
              </Grid>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button 
            onClick={handleSaveMaterial}
            variant="contained"
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Save Material'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default LearningMaterialCreator;