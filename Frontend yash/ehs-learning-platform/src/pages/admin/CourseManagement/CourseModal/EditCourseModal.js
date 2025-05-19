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
  InputAdornment,
  Alert,
  Tabs,
  Tab,
  Chip
} from '@mui/material';
import api from '../../../../services/api';
import CourseBuilder from '../CourseBuilder/CourseBuilder';

const EditCourseModal = ({ open, onClose, courseId, onSuccess }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    domainId: '',
    icon: '',
    timeLimit: '',
    passingScore: ''
  });
  const [course, setCourse] = useState(null);
  const [domains, setDomains] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Fetch course details and domains when modal opens
  useEffect(() => {
    if (open && courseId) {
      fetchCourseDetails();
      fetchDomains();
    }
  }, [open, courseId]);

  const fetchCourseDetails = async () => {
    try {
      const response = await api.get(`/v2/admin/courses/${courseId}`);
      const courseData = response.data;
      setCourse(courseData);
      setFormData({
        title: courseData.title,
        description: courseData.description || '',
        domainId: courseData.domain.id,
        icon: courseData.icon || '',
        timeLimit: courseData.timeLimit || '',
        passingScore: courseData.passingScore || ''
      });
    } catch (error) {
      console.error('Error fetching course details:', error);
      setErrors({ fetch: 'Failed to load course details' });
    }
  };

  const fetchDomains = async () => {
    try {
      const response = await api.get('/domains');
      setDomains(response.data);
    } catch (error) {
      console.error('Error fetching domains:', error);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
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

      const response = await api.put(`/v2/admin/courses/${courseId}`, courseData);
      
      onSuccess(response.data);
      onClose();
    } catch (error) {
      console.error('Error updating course:', error);
      if (error.response?.data?.message) {
        setErrors({ submit: error.response.data.message });
      } else {
        setErrors({ submit: 'Failed to update course. Please try again.' });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setActiveTab(0);
      setErrors({});
      onClose();
    }
  };

  const handleComponentUpdate = () => {
    // Refresh course details when components are updated
    fetchCourseDetails();
  };

  if (!course) {
    return null;
  }

  const isPublished = course.status === 'PUBLISHED';

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          Edit Course
          <Chip
            label={course.status}
            color={isPublished ? 'success' : 'default'}
            size="small"
          />
        </Box>
      </DialogTitle>
      <DialogContent>
        {isPublished && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            This course is published. Some details cannot be edited while published.
          </Alert>
        )}

        <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 3 }}>
          <Tab label="Course Details" />
          <Tab label="Components" />
        </Tabs>

        {activeTab === 0 && (
          <Box>
            <TextField
              fullWidth
              label="Course Title"
              value={formData.title}
              onChange={handleChange('title')}
              error={!!errors.title}
              helperText={errors.title}
              required
              disabled={isPublished}
              sx={{ mb: 2 }}
            />

            <FormControl fullWidth sx={{ mb: 2 }} error={!!errors.domainId} disabled={isPublished}>
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
              disabled={isPublished}
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              label="Icon URL"
              value={formData.icon}
              onChange={handleChange('icon')}
              placeholder="/default-course-icon.png"
              disabled={isPublished}
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
              disabled={isPublished}
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
              disabled={isPublished}
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
        )}

        {activeTab === 1 && (
          <Box>
            {isPublished && (
              <Alert severity="info" sx={{ mb: 2 }}>
                Components cannot be modified while the course is published.
              </Alert>
            )}
            <CourseBuilder 
              courseId={courseId} 
              course={course}
              onUpdate={handleComponentUpdate}
              disabled={isPublished}
            />
          </Box>
        )}

      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        {activeTab === 0 && !isPublished && (
          <Button 
            onClick={handleSubmit} 
            variant="contained" 
            disabled={loading}
          >
            {loading ? 'Updating...' : 'Update Course'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default EditCourseModal;