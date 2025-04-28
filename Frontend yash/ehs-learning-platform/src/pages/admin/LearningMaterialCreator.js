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
import { learningMaterialService } from '../../services/api';

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
  const [materials, setMaterials] = useState(initialMaterials || []);
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
  
  // Check if component is temporary
  const isTemporaryComponent = () => {
    return componentId && String(componentId).startsWith('comp-');
  };
  
  // Load existing materials if component ID is provided and no initial materials
  useEffect(() => {
    console.log("ComponentId:", componentId);
    console.log("InitialMaterials:", initialMaterials);
    
    if (componentId && (!initialMaterials || initialMaterials.length === 0) && !isTemporaryComponent()) {
      fetchMaterials();
    } else if (initialMaterials && initialMaterials.length > 0) {
      setMaterials(initialMaterials);
    }
  }, [componentId, initialMaterials]);
  
  // Fetch materials
  const fetchMaterials = async () => {
    try {
      setLoading(true);
      console.log("Fetching materials for component:", componentId);
      const response = await learningMaterialService.getMaterialsByComponent(componentId);
      if (response && response.data) {
        console.log("Materials fetched:", response.data);
        setMaterials(response.data);
      } else {
        console.log("No materials found or empty response");
        setMaterials([]);
      }
    } catch (err) {
      console.error('Error fetching materials:', err);
      setError('Failed to load learning materials. ' + (err.response?.data?.message || err.message));
      setMaterials([]);
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
    if (!material) {
      console.error("Attempted to edit undefined material");
      setError("Cannot edit undefined material");
      return;
    }
    
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
    if (!material) {
      console.error("Attempted to delete undefined material");
      setError("Cannot delete undefined material");
      return;
    }
    
    try {
      setLoading(true);
      
      // If it's a new material that hasn't been saved yet or a temp material
      if (!material.id || material.id.toString().startsWith('temp-')) {
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
      setError('Failed to delete material: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };
  
  // Close dialog
  const handleCloseDialog = () => {
    setOpenDialog(false);
  };
  
  // Create a temporary material for unsaved components
  const createTemporaryMaterial = () => {
    return {
      id: `temp-material-${Date.now()}`,
      title: materialData.title,
      description: materialData.description || '',
      fileType: materialData.fileType,
      estimatedDuration: materialData.estimatedDuration || 5,
      // For file uploads
      _isTemporary: true,
      _file: selectedFile || null,
      _filePath: selectedFile ? selectedFile.name : null,
      // For external URLs
      externalUrl: materialData.externalUrl || '',
      // For HTML content
      content: materialData.content || ''
    };
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
      
      // Check if we're working with a temporary component
      if (isTemporaryComponent()) {
        console.log("Using temporary material for unsaved component");
        newMaterial = createTemporaryMaterial();
      } else {
        // Normal flow for saved components
        // Handle file upload
        if (tabValue === 0 && selectedFile) {
          try {
            console.log("Uploading file for component:", componentId);
            console.log("File details:", selectedFile.name, selectedFile.type, selectedFile.size);
            
            if (editingIndex >= 0 && currentMaterial && currentMaterial.id) {
              // Update existing file material
              newMaterial = await learningMaterialService.updateMaterial(currentMaterial.id, materialData);
            } else {
              newMaterial = await learningMaterialService.uploadMaterial(componentId, selectedFile, materialData);
            }
            
            console.log("File upload response:", newMaterial);
          } catch (uploadError) {
            console.error('File upload error:', uploadError);
            setError('Failed to upload file: ' + (uploadError.response?.data?.message || uploadError.message));
            setLoading(false);
            return;
          }
        } 
        // Handle external URL
        else if (tabValue === 2) {
          if (editingIndex >= 0 && currentMaterial && currentMaterial.id) {
            newMaterial = await learningMaterialService.updateMaterial(currentMaterial.id, materialData);
          } else {
            newMaterial = await learningMaterialService.addExternalMaterial(componentId, materialData);
          }
        } 
        // Handle HTML content
        else if (tabValue === 3) {
          if (editingIndex >= 0 && currentMaterial && currentMaterial.id) {
            newMaterial = await learningMaterialService.updateMaterial(currentMaterial.id, materialData);
          } else {
            newMaterial = await learningMaterialService.addContentMaterial(componentId, materialData);
          }
        }
        // For editing existing material without changing file
        else if (editingIndex >= 0 && currentMaterial && currentMaterial.id) {
          newMaterial = await learningMaterialService.updateMaterial(currentMaterial.id, materialData);
        }
      }
      
      if (!newMaterial) {
        throw new Error('Failed to save material - response was empty');
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
      setError('Failed to save material: ' + (err.response?.data?.message || err.message));
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
      
      // For temporary components, just pass the materials back to parent
      if (isTemporaryComponent()) {
        console.log("Saving temporary materials for later upload");
        setSuccess('Materials prepared for saving with module');
        
        if (onSave) {
          onSave(materials);
        }
        
        setLoading(false);
        return;
      }
      
      // For real components, save the order
      const materialOrder = materials
        .map(material => material.id)
        .filter(id => id && !String(id).startsWith('temp-')); // Filter out temp IDs
      
      if (materialOrder.length > 0) {
        try {
          await learningMaterialService.reorderMaterials(componentId, materialOrder);
        } catch (orderError) {
          console.error('Error reordering materials (continuing):', orderError);
          // Continue without failing the entire save operation
        }
      }
      
      setSuccess('All materials saved successfully');
      
      // Pass the updated materials to parent component
      if (onSave) {
        onSave(materials);
      }
    } catch (err) {
      console.error('Error saving materials:', err);
      setError('Failed to save materials: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };
  
  // Get icon for material type
  const getMaterialIcon = (type) => {
    if (!type) return <DocumentIcon />; // Default icon for undefined type
    
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
        
        {isTemporaryComponent() && (
          <Alert severity="info" sx={{ mb: 3 }}>
            You are adding materials to an unsaved component. The files will be uploaded when the module is saved.
          </Alert>
        )}
        
        {/* Learning Materials List */}
        <Box mb={3}>
          <Typography variant="h6" gutterBottom>
            Material List
          </Typography>
          
          {!materials || materials.length === 0 ? (
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
                  material ? (
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
                                    {material.title || "Untitled Material"}
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary">
                                    Type: {material.fileType || "Unknown"} • Duration: {material.estimatedDuration || 0} min
                                    {material._isTemporary && " • Not yet uploaded"}
                                  </Typography>
                                  {material.description && (
                                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                      {material.description}
                                    </Typography>
                                  )}
                                  {material._filePath && (
                                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                      File: {material._filePath}
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
                  ) : null // Skip rendering undefined materials
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
                    <TextField
                      fullWidth
                      label="Video URL"
                      name="externalUrl"
                      value={materialData.externalUrl}
                      onChange={handleInputChange}
                      placeholder="Enter YouTube, Vimeo, or other video URL"
                      required
                      helperText="Enter the URL of the video from YouTube, Vimeo, or other video platforms"
                    />
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
                      placeholder="https://..."
                      required
                      helperText="Enter the URL of the external resource"
                    />
                  </Grid>
                )}
                
                {/* HTML Content Tab */}
                {tabValue === 3 && (
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="HTML Content"
                      name="content"
                      value={materialData.content}
                      onChange={handleInputChange}
                      multiline
                      rows={10}
                      required
                      placeholder="Enter HTML content here..."
                      variant="outlined"
                    />
                    {/* This would ideally be a rich text editor component in a real implementation */}
                  </Grid>
                )}
              </Grid>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={handleCloseDialog}
            startIcon={<CancelIcon />}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSaveMaterial} 
            variant="contained" 
            color="primary"
            startIcon={loading ? <CircularProgress size={16} /> : <SaveIcon />}
            disabled={loading}
          >
            {editingIndex >= 0 ? 'Update' : 'Save'} Material
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default LearningMaterialCreator;