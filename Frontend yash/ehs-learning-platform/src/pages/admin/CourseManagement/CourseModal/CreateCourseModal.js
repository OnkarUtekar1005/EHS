import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  InputAdornment
} from '@mui/material';
import { domainService } from '../../../../services/api';
import api from '../../../../services/api';

const CreateCourseModal = ({ open, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    domainId: '',
    icon: '',
    timeLimit: '',
    passingScore: ''
  });
  const [domains, setDomains] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Fetch domains when modal opens
  useEffect(() => {
    if (open) {
      fetchDomains();
    }
  }, [open]);

  const fetchDomains = async () => {
    try {
      const response = await domainService.getAll();
      setDomains(response.data);
    } catch (error) {
      console.error('Error fetching domains:', error);
    }
  };

  const handleChange = (field) => (event) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value
    }));
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }
    if (!formData.domainId) {
      newErrors.domainId = 'Domain is required';
    }
    if (formData.timeLimit && formData.timeLimit < 0) {
      newErrors.timeLimit = 'Time limit must be positive';
    }
    if (formData.passingScore && (formData.passingScore < 0 || formData.passingScore > 100)) {
      newErrors.passingScore = 'Passing score must be between 0 and 100';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      // Prepare data for API
      const courseData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        domainId: formData.domainId,
        icon: formData.icon || '/default-course-icon.png',
        timeLimit: formData.timeLimit ? parseInt(formData.timeLimit) : null,
        passingScore: formData.passingScore ? parseInt(formData.passingScore) : null
      };

      const response = await api.post('/v2/admin/courses', courseData);
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        domainId: '',
        icon: '',
        timeLimit: '',
        passingScore: ''
      });
      
      onSuccess(response.data);
      onClose();
    } catch (error) {
      console.error('Error creating course:', error);
      if (error.response?.data?.message) {
        setErrors({ submit: error.response.data.message });
      } else {
        setErrors({ submit: 'Failed to create course. Please try again.' });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setFormData({
        title: '',
        description: '',
        domainId: '',
        icon: '',
        timeLimit: '',
        passingScore: ''
      });
      setErrors({});
      onClose();
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>Create New Course</DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 2 }}>
          <TextField
            fullWidth
            label="Course Title"
            value={formData.title}
            onChange={handleChange('title')}
            error={!!errors.title}
            helperText={errors.title}
            required
            sx={{ mb: 2 }}
          />

          <FormControl fullWidth sx={{ mb: 2 }} error={!!errors.domainId}>
            <InputLabel required>Domain</InputLabel>
            <Select
              value={formData.domainId}
              onChange={handleChange('domainId')}
              label="Domain"
            >
              {domains.map(domain => (
                <MenuItem key={domain.id} value={domain.id}>
                  {domain.name}
                </MenuItem>
              ))}
            </Select>
            {errors.domainId && (
              <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                {errors.domainId}
              </Typography>
            )}
          </FormControl>

          <TextField
            fullWidth
            label="Description"
            value={formData.description}
            onChange={handleChange('description')}
            multiline
            rows={3}
            sx={{ mb: 2 }}
          />

          <TextField
            fullWidth
            label="Icon URL"
            value={formData.icon}
            onChange={handleChange('icon')}
            placeholder="/default-course-icon.png"
            sx={{ mb: 2 }}
          />

          <TextField
            fullWidth
            label="Time Limit"
            type="number"
            value={formData.timeLimit}
            onChange={handleChange('timeLimit')}
            error={!!errors.timeLimit}
            helperText={errors.timeLimit}
            InputProps={{
              endAdornment: <InputAdornment position="end">minutes</InputAdornment>,
            }}
            sx={{ mb: 2 }}
          />

          <TextField
            fullWidth
            label="Passing Score"
            type="number"
            value={formData.passingScore}
            onChange={handleChange('passingScore')}
            error={!!errors.passingScore}
            helperText={errors.passingScore}
            InputProps={{
              endAdornment: <InputAdornment position="end">%</InputAdornment>,
            }}
            sx={{ mb: 2 }}
          />

          {errors.submit && (
            <Typography color="error" sx={{ mt: 1 }}>
              {errors.submit}
            </Typography>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          disabled={loading}
        >
          {loading ? 'Creating...' : 'Create Course'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateCourseModal;