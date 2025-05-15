import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  FormControl,
  FormHelperText,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
  CircularProgress,
  Paper,
  Divider,
  Alert,
  Snackbar
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon
} from '@mui/icons-material';
import AdminLayout from '../../../components/layout/AdminLayout';
import { domainService } from '../../../services/api';
import { moduleService } from '../../../services/moduleService';
import { useNavigate, useParams } from 'react-router-dom';

const CourseCreation = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;
  
  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [domains, setDomains] = useState([]);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    domainId: '',
    passingScore: 70,
    estimatedDuration: 60,
    iconUrl: ''
  });
  
  // Form validation
  const [formErrors, setFormErrors] = useState({});
  
  useEffect(() => {
    // Load domains for dropdown
    const fetchDomains = async () => {
      try {
        const response = await domainService.getAll();
        setDomains(response.data);
      } catch (err) {
        console.error('Error fetching domains:', err);
        setError('Failed to load domains. Please try again.');
      }
    };

    fetchDomains();
    
    // If in edit mode, load the course data
    if (isEditMode) {
      const fetchCourse = async () => {
        try {
          const response = await moduleService.getModuleById(id);
          const course = response.data;
          
          setFormData({
            title: course.title,
            description: course.description || '',
            domainId: course.domain?.id || '',
            passingScore: course.passingScore || 70,
            estimatedDuration: course.estimatedDuration || 60,
            iconUrl: course.iconUrl || ''
          });
        } catch (err) {
          console.error('Error fetching course:', err);
          setError('Failed to load course data. Please try again.');
        } finally {
          setLoading(false);
        }
      };
      
      fetchCourse();
    }
  }, [id, isEditMode]);

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
  
  const validateForm = () => {
    const errors = {};
    
    if (!formData.title.trim()) {
      errors.title = 'Title is required';
    }
    
    if (!formData.domainId) {
      errors.domainId = 'Domain is required';
    }
    
    if (formData.passingScore < 0 || formData.passingScore > 100) {
      errors.passingScore = 'Passing score must be between 0 and 100';
    }
    
    if (formData.estimatedDuration <= 0) {
      errors.estimatedDuration = 'Duration must be greater than 0';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setSaving(true);
    try {
      if (isEditMode) {
        await moduleService.updateModule(id, formData);
      } else {
        await moduleService.createModule(formData);
      }
      setSuccess(true);
      
      // Redirect to course list after 2 seconds
      setTimeout(() => {
        navigate('/admin/courses');
      }, 2000);
    } catch (err) {
      console.error('Error saving course:', err);
      setError(err.response?.data?.message || 'Failed to save course');
    } finally {
      setSaving(false);
    }
  };
  
  const handleCancel = () => {
    navigate('/admin/courses');
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

  return (
    <AdminLayout>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Box display="flex" alignItems="center" mb={3}>
              <Button
                startIcon={<ArrowBackIcon />}
                onClick={handleCancel}
                sx={{ mr: 2 }}
              >
                Back to Courses
              </Button>
              <Typography variant="h4" component="h1">
                {isEditMode ? 'Edit Course' : 'Create New Course'}
              </Typography>
            </Box>
          </Grid>
          
          {error && (
            <Grid item xs={12}>
              <Alert severity="error">{error}</Alert>
            </Grid>
          )}
          
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <form onSubmit={handleSubmit}>
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <Typography variant="h6" gutterBottom>
                      Course Details
                    </Typography>
                    <Divider sx={{ mb: 3 }} />
                  </Grid>
                  
                  <Grid item xs={12} md={8}>
                    <TextField
                      required
                      fullWidth
                      label="Course Title"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      error={!!formErrors.title}
                      helperText={formErrors.title}
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={4}>
                    <FormControl fullWidth required error={!!formErrors.domainId}>
                      <InputLabel>Domain</InputLabel>
                      <Select
                        name="domainId"
                        value={formData.domainId}
                        onChange={handleInputChange}
                        label="Domain"
                      >
                        {domains.map((domain) => (
                          <MenuItem key={domain.id} value={domain.id}>
                            {domain.name}
                          </MenuItem>
                        ))}
                      </Select>
                      {formErrors.domainId && (
                        <FormHelperText>{formErrors.domainId}</FormHelperText>
                      )}
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      multiline
                      rows={4}
                      label="Description"
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Passing Score (%)"
                      name="passingScore"
                      value={formData.passingScore}
                      onChange={handleInputChange}
                      InputProps={{ inputProps: { min: 0, max: 100 } }}
                      error={!!formErrors.passingScore}
                      helperText={formErrors.passingScore}
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
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
                  
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="Icon URL (optional)"
                      name="iconUrl"
                      value={formData.iconUrl}
                      onChange={handleInputChange}
                      helperText="URL to course icon image"
                    />
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Box display="flex" justifyContent="flex-end" mt={3}>
                      <Button
                        variant="outlined"
                        onClick={handleCancel}
                        sx={{ mr: 2 }}
                        disabled={saving}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        variant="contained"
                        color="primary"
                        startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                        disabled={saving}
                      >
                        {saving ? 'Saving...' : isEditMode ? 'Update Course' : 'Create Course'}
                      </Button>
                    </Box>
                  </Grid>
                </Grid>
              </form>
            </Paper>
          </Grid>
        </Grid>
      </Container>
      
      <Snackbar
        open={success}
        autoHideDuration={2000}
        onClose={() => setSuccess(false)}
      >
        <Alert severity="success" sx={{ width: '100%' }}>
          Course {isEditMode ? 'updated' : 'created'} successfully!
        </Alert>
      </Snackbar>
    </AdminLayout>
  );
};

export default CourseCreation;