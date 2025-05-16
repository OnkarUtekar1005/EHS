import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  IconButton,
  LinearProgress,
  Alert
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  AttachFile as FileIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import api from '../../../../../services/api';

const MaterialForm = ({ open, onClose, onSave, component }) => {
  const [formData, setFormData] = useState({
    type: 'MATERIAL',
    required: false,
    data: {
      title: '',
      type: '',
      driveFileId: '',
      driveFileUrl: '',
      fileName: '',
      fileSize: 0,
      duration: null
    }
  });
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (component) {
      setFormData(component);
    } else {
      setFormData({
        type: 'MATERIAL',
        required: false,
        data: {
          title: '',
          type: '',
          driveFileId: '',
          driveFileUrl: '',
          fileName: '',
          fileSize: 0,
          duration: null
        }
      });
    }
  }, [component, open]);

  const handleFieldChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      data: {
        ...prev.data,
        [field]: value
      }
    }));
    
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handleFileSelect = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      // Validate file type
      const allowedTypes = {
        'PDF': ['application/pdf'],
        'VIDEO': ['video/mp4', 'video/webm', 'video/ogg'],
        'PPT': [
          'application/vnd.ms-powerpoint',
          'application/vnd.openxmlformats-officedocument.presentationml.presentation'
        ]
      };

      let fileType = '';
      for (const [type, mimeTypes] of Object.entries(allowedTypes)) {
        if (mimeTypes.includes(selectedFile.type)) {
          fileType = type;
          break;
        }
      }

      if (!fileType) {
        setUploadError('Invalid file type. Please upload PDF, Video (MP4, WebM, OGG), or PowerPoint files.');
        return;
      }

      setFile(selectedFile);
      setUploadError('');
      handleFieldChange('type', fileType);
      handleFieldChange('fileName', selectedFile.name);
      handleFieldChange('fileSize', selectedFile.size);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setUploadError('Please select a file to upload');
      return;
    }

    setUploading(true);
    setUploadError('');
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', formData.get('type'));

      const response = await api.post('/v2/admin/courses/upload-material', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      const uploadResult = response.data;
      handleFieldChange('driveFileId', uploadResult.driveFileId);
      handleFieldChange('driveFileUrl', uploadResult.driveFileUrl);
      handleFieldChange('fileName', uploadResult.fileName);
      handleFieldChange('fileSize', uploadResult.fileSize);
      
      setFile(null);
    } catch (error) {
      console.error('Upload error:', error);
      setUploadError('Failed to upload file. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.data.title.trim()) {
      newErrors.title = 'Title is required';
    }
    
    if (!formData.data.type) {
      newErrors.type = 'Material type is required';
    }
    
    if (!formData.data.driveFileId && !formData.data.driveFileUrl) {
      newErrors.file = 'Please upload a file';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      onSave(formData);
    }
  };

  const clearFile = () => {
    setFile(null);
    handleFieldChange('driveFileId', '');
    handleFieldChange('driveFileUrl', '');
    handleFieldChange('fileName', '');
    handleFieldChange('fileSize', 0);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {component ? 'Edit' : 'Add'} Learning Material
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          <TextField
            fullWidth
            label="Title"
            value={formData.data.title}
            onChange={(e) => handleFieldChange('title', e.target.value)}
            error={!!errors.title}
            helperText={errors.title}
            sx={{ mb: 2 }}
          />

          <FormControl fullWidth sx={{ mb: 2 }} error={!!errors.type}>
            <InputLabel>Material Type</InputLabel>
            <Select
              value={formData.data.type}
              onChange={(e) => handleFieldChange('type', e.target.value)}
              label="Material Type"
            >
              <MenuItem value="PDF">PDF Document</MenuItem>
              <MenuItem value="VIDEO">Video</MenuItem>
              <MenuItem value="PPT">PowerPoint Presentation</MenuItem>
            </Select>
          </FormControl>

          <FormControlLabel
            control={
              <Switch
                checked={formData.required}
                onChange={(e) => setFormData(prev => ({ ...prev, required: e.target.checked }))}
              />
            }
            label="Required Component"
            sx={{ mb: 2 }}
          />

          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              File Upload
            </Typography>
            
            {formData.data.fileName && !file ? (
              <Box sx={{ 
                p: 2, 
                border: '1px solid #e0e0e0', 
                borderRadius: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <FileIcon />
                  <Box>
                    <Typography variant="body2">{formData.data.fileName}</Typography>
                    <Typography variant="caption" color="textSecondary">
                      {(formData.data.fileSize / (1024 * 1024)).toFixed(2)} MB
                    </Typography>
                  </Box>
                </Box>
                <IconButton onClick={clearFile} size="small" color="error">
                  <DeleteIcon />
                </IconButton>
              </Box>
            ) : (
              <>
                <input
                  type="file"
                  id="file-upload"
                  style={{ display: 'none' }}
                  onChange={handleFileSelect}
                  accept=".pdf,.mp4,.webm,.ogg,.ppt,.pptx"
                />
                <label htmlFor="file-upload">
                  <Button
                    component="span"
                    variant="outlined"
                    startIcon={<UploadIcon />}
                    disabled={uploading}
                    fullWidth
                  >
                    Select File
                  </Button>
                </label>
                
                {file && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2" gutterBottom>
                      Selected: {file.name} ({(file.size / (1024 * 1024)).toFixed(2)} MB)
                    </Typography>
                    <Button
                      variant="contained"
                      onClick={handleUpload}
                      disabled={uploading}
                      fullWidth
                    >
                      {uploading ? 'Uploading...' : 'Upload to Google Drive'}
                    </Button>
                  </Box>
                )}
              </>
            )}
            
            {uploading && <LinearProgress sx={{ mt: 2 }} />}
            
            {uploadError && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {uploadError}
              </Alert>
            )}
            
            {errors.file && (
              <Typography color="error" variant="body2" sx={{ mt: 1 }}>
                {errors.file}
              </Typography>
            )}
          </Box>

          {formData.data.type === 'VIDEO' && (
            <TextField
              fullWidth
              label="Duration (minutes)"
              type="number"
              value={formData.data.duration || ''}
              onChange={(e) => handleFieldChange('duration', parseInt(e.target.value) || null)}
              sx={{ mb: 2 }}
            />
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={uploading}>
          Cancel
        </Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          disabled={uploading}
        >
          {component ? 'Update' : 'Add'} Material
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default MaterialForm;