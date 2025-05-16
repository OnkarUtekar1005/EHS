import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  TextField,
  FormControl,
  FormControlLabel,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Card,
  CardContent,
  CardMedia,
  Grid,
  Chip,
  CircularProgress,
  Alert,
  IconButton,
  Checkbox
} from '@mui/material';
import {
  PictureAsPdf as PdfIcon,
  VideoLibrary as VideoIcon,
  Slideshow as PptIcon,
  Description as DocIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import api from '../../../../../services/api';

const MaterialForm = ({ open, onClose, onSave, component, type }) => {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    type: type,
    required: false,
    data: {
      materialId: '',
      title: '',
      type: '',
      driveFileId: '',
      driveFileUrl: ''
    }
  });

  useEffect(() => {
    if (component) {
      setFormData(component);
    } else {
      setFormData({
        type: type,
        required: false,
        data: {
          materialId: '',
          title: '',
          type: '',
          driveFileId: '',
          driveFileUrl: ''
        }
      });
    }
  }, [component, type]);

  useEffect(() => {
    fetchMaterials();
  }, []);

  const fetchMaterials = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/materials');
      setMaterials(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching materials:', err);
      setError('Failed to load materials');
    } finally {
      setLoading(false);
    }
  };

  const handleMaterialSelect = (materialId) => {
    const material = materials.find(m => m.id === materialId);
    if (material) {
      setFormData({
        ...formData,
        data: {
          materialId: materialId,
          title: material.title,
          type: material.type,
          driveFileId: material.driveFileId,
          driveFileUrl: material.driveFileUrl
        }
      });
    }
  };

  const handleRequiredChange = (event) => {
    setFormData({
      ...formData,
      required: event.target.checked
    });
  };

  const handleSave = () => {
    if (!formData.data.materialId) {
      setError('Please select a material');
      return;
    }
    onSave(formData);
  };

  const getMaterialIcon = (type) => {
    switch (type) {
      case 'PDF':
        return <PdfIcon color="error" />;
      case 'VIDEO':
        return <VideoIcon color="primary" />;
      case 'PPT':
        return <PptIcon color="warning" />;
      default:
        return <DocIcon color="action" />;
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="h6">
            {component ? 'Edit Material Component' : 'Add Material Component'}
          </Typography>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent dividers>
        {loading ? (
          <Box display="flex" justifyContent="center" p={3}>
            <CircularProgress />
          </Box>
        ) : error && !materials.length ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        ) : materials.length === 0 ? (
          <Alert severity="info">
            No materials available. Please add materials from the Materials section first.
          </Alert>
        ) : (
          <>
            <FormControl fullWidth margin="normal">
              <InputLabel>Select Material</InputLabel>
              <Select
                value={formData.data.materialId || ''}
                onChange={(e) => handleMaterialSelect(e.target.value)}
                label="Select Material"
              >
                {materials.map((material) => (
                  <MenuItem key={material.id} value={material.id}>
                    <Box display="flex" alignItems="center" gap={1}>
                      {getMaterialIcon(material.type)}
                      <span>{material.title}</span>
                      <Chip size="small" label={material.type} sx={{ ml: 1 }} />
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {formData.data.materialId && (
              <Box mt={3}>
                <Typography variant="subtitle1" gutterBottom>
                  Selected Material Preview
                </Typography>
                {materials
                  .filter(m => m.id === formData.data.materialId)
                  .map(material => (
                    <Card key={material.id} sx={{ mt: 2 }}>
                      <CardContent>
                        <Box display="flex" alignItems="center" gap={2}>
                          {getMaterialIcon(material.type)}
                          <Box>
                            <Typography variant="h6">{material.title}</Typography>
                            <Typography variant="body2" color="textSecondary">
                              {material.description}
                            </Typography>
                            <Chip 
                              size="small" 
                              label={material.type} 
                              sx={{ mt: 1 }}
                              color="primary"
                            />
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  ))}
              </Box>
            )}

            <Box mt={3}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.required}
                    onChange={handleRequiredChange}
                  />
                }
                label="Required component"
              />
            </Box>
          </>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button 
          onClick={handleSave} 
          variant="contained" 
          color="primary"
          disabled={!formData.data.materialId}
        >
          {component ? 'Update' : 'Add'} Material
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default MaterialForm;