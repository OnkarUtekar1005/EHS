// src/pages/admin/MaterialEditor.js
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  InputAdornment
} from '@mui/material';
import {
  CloudUpload as CloudUploadIcon,
  Link as LinkIcon,
  Code as CodeIcon,
  Save as SaveIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';

// Material type constants
const MATERIAL_TYPES = {
  PDF: "PDF",
  VIDEO: "VIDEO",
  PRESENTATION: "PRESENTATION",
  DOCUMENT: "DOCUMENT",
  HTML: "HTML",
  IMAGE: "IMAGE",
  EXTERNAL: "EXTERNAL"
};

const MaterialEditor = ({ material, mode = 'create', onSave, onCancel }) => {
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
  
  // UI State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tabValue, setTabValue] = useState(0);
  
  // File upload state
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  
  // Initialize form when material changes
  useEffect(() => {
    if (material && mode === 'edit') {
      setMaterialData({
        title: material.title || '',
        description: material.description || '',
        fileType: material.fileType || MATERIAL_TYPES.PDF,
        externalUrl: material.externalUrl || '',
        content: material.content || '',
        estimatedDuration: material.estimatedDuration || 5,
        file: null
      });
      
      // Set appropriate tab based on material type
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
    }
  }, [material, mode]);
  
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
    } else if (file.type.includes('video')) {
      setMaterialData(prev => ({ ...prev, fileType: MATERIAL_TYPES.VIDEO }));
    } else if (file.type.includes('image')) {
      setMaterialData(prev => ({ ...prev, fileType: MATERIAL_TYPES.IMAGE }));
    } else if (file.type.includes('powerpoint') || file.name.endsWith('.ppt') || file.name.endsWith('.pptx')) {
      setMaterialData(prev => ({ ...prev, fileType: MATERIAL_TYPES.PRESENTATION }));
    } else if (file.type.includes('word') || file.name.endsWith('.doc') || file.name.endsWith('.docx')) {
      setMaterialData(prev => ({ ...prev, fileType: MATERIAL_TYPES.DOCUMENT }));
    }
  };
  
  // Clear file selection
  const handleClearFile = (e) => {
    e.stopPropagation(); // Prevent the click from bubbling up to the label
    setSelectedFile(null);
    setPreviewUrl('');
    setMaterialData({
      ...materialData,
      file: null
    });
  };
  
  // Handle form submission
  const handleSubmit = () => {
    // Validate form
    if (!materialData.title) {
      setError('Title is required');
      return;
    }
    
    // For file uploads
    if (tabValue === 0 && mode === 'create' && !selectedFile) {
      setError('Please select a file to upload');
      return;
    }
    
    // For external URLs
    if (tabValue === 2 && !materialData.externalUrl) {
      setError('External URL is required');
      return;
    }
    
    // For HTML content
    if (tabValue === 3 && !materialData.content) {
      setError('Content is required');
      return;
    }
    
    // Call parent save function
    onSave(materialData);
  };
  
  return (
    <Paper sx={{ p: 3 }}>
      <Box mb={3}>
        <Typography variant="h5">
          {mode === 'create' ? 'Create New Material' : 'Edit Material'}
        </Typography>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}
      
      <Box sx={{ width: '100%', mb: 3 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="material type tabs">
            <Tab icon={<CloudUploadIcon />} label="Upload File" />
            <Tab icon={<LinkIcon />} label="Video" />
            <Tab icon={<LinkIcon />} label="External Link" />
            <Tab icon={<CodeIcon />} label="HTML Content" />
          </Tabs>
        </Box>
      </Box>
      
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
            InputProps={{
              endAdornment: <InputAdornment position="end">minutes</InputAdornment>,
            }}
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
                    onClick={handleClearFile}
                    sx={{ mt: 1 }}
                  >
                    Remove
                  </Button>
                </Box>
              )}
              
              {mode === 'edit' && material && material.filePath && !selectedFile && (
                <Box mt={2} p={2} bgcolor="#f5f5f5" borderRadius={1}>
                  <Typography variant="body2">
                    Current file: {material.filePath}
                  </Typography>
                  <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                    Upload a new file to replace the current one
                  </Typography>
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
      
      <Box display="flex" justifyContent="flex-end" mt={3}>
        <Button
          variant="outlined"
          startIcon={<CancelIcon />}
          onClick={onCancel}
          sx={{ mr: 2 }}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          color="primary"
          startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
          onClick={handleSubmit}
          disabled={loading}
        >
          {mode === 'create' ? 'Create' : 'Update'} Material
        </Button>
      </Box>
    </Paper>
  );
};

export default MaterialEditor;