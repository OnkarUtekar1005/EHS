import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Grid,
  Typography,
  CircularProgress,
  Paper,
  Divider,
  Alert,
  Snackbar,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  FormHelperText,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  DragIndicator as DragIcon,
  Assessment as AssessmentIcon,
  LibraryBooks as MaterialsIcon,
  Quiz as QuizIcon,
  Save as SaveIcon
} from '@mui/icons-material';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import AdminLayout from '../../../components/layout/AdminLayout';
import api from '../../../services/api';
import { useNavigate, useParams } from 'react-router-dom';
import ComponentPreviewCard from '../../../components/admin/ComponentPreviewCard';

const ComponentTypes = {
  PRE_ASSESSMENT: 'PRE_ASSESSMENT',
  LEARNING_MATERIAL: 'LEARNING_MATERIAL',
  POST_ASSESSMENT: 'POST_ASSESSMENT'
};

const CourseEditor = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  
  const [course, setCourse] = useState(null);
  const [components, setComponents] = useState([]);
  const [showAddComponent, setShowAddComponent] = useState(false);
  const [componentForm, setComponentForm] = useState({
    title: '',
    description: '',
    type: '',
    isRequired: true,
    timeLimit: 30,
    passingScore: 70
  });
  const [componentFormErrors, setComponentFormErrors] = useState({});
  const [editingComponentId, setEditingComponentId] = useState(null);
  
  // Load course and components
  const fetchCourseData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Get course details
      const courseResponse = await api.get(`/api/modules/${id}`);
      setCourse(courseResponse.data);
      
      // Get components
      const componentsResponse = await api.get(`/api/modules/${id}/components`);
      setComponents(componentsResponse.data);
      
      setError(null);
    } catch (err) {
      console.error('Error fetching course data:', err);
      setError('Failed to load course data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [id]);
  
  useEffect(() => {
    fetchCourseData();
  }, [fetchCourseData]);
  
  const handleComponentInputChange = (e) => {
    const { name, value } = e.target;
    setComponentForm({
      ...componentForm,
      [name]: value
    });
    
    // Clear validation error when field is updated
    if (componentFormErrors[name]) {
      setComponentFormErrors({
        ...componentFormErrors,
        [name]: null
      });
    }
  };
  
  const handleSwitchChange = (e) => {
    setComponentForm({
      ...componentForm,
      [e.target.name]: e.target.checked
    });
  };
  
  const validateComponentForm = () => {
    const errors = {};
    
    if (!componentForm.title.trim()) {
      errors.title = 'Title is required';
    }
    
    if (!componentForm.type) {
      errors.type = 'Component type is required';
    }
    
    if (componentForm.type === ComponentTypes.PRE_ASSESSMENT || 
        componentForm.type === ComponentTypes.POST_ASSESSMENT) {
      if (!componentForm.timeLimit || componentForm.timeLimit <= 0) {
        errors.timeLimit = 'Time limit must be greater than 0';
      }
      
      if (!componentForm.passingScore || 
          componentForm.passingScore < 0 || 
          componentForm.passingScore > 100) {
        errors.passingScore = 'Passing score must be between 0 and 100';
      }
    }
    
    setComponentFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  const resetComponentForm = () => {
    setComponentForm({
      title: '',
      description: '',
      type: '',
      isRequired: true,
      timeLimit: 30,
      passingScore: 70
    });
    setComponentFormErrors({});
    setEditingComponentId(null);
  };
  
  const handleAddComponent = () => {
    resetComponentForm();
    setShowAddComponent(true);
  };
  
  const handleEditComponent = (component) => {
    setComponentForm({
      title: component.title,
      description: component.description || '',
      type: component.type,
      isRequired: component.isRequired !== false, // Default to true if undefined
      timeLimit: component.timeLimit || 30,
      passingScore: component.passingScore || 70
    });
    setEditingComponentId(component.id);
    setShowAddComponent(true);
  };
  
  const handleCloseDialog = () => {
    setShowAddComponent(false);
    resetComponentForm();
  };
  
  const handleSaveComponent = async () => {
    if (!validateComponentForm()) {
      return;
    }
    
    setSaving(true);
    try {
      let response;
      
      if (editingComponentId) {
        // Update existing component
        response = await api.put(`/api/modules/components/${editingComponentId}`, componentForm);
        
        // Update local state
        setComponents(components.map(comp => 
          comp.id === editingComponentId ? response.data : comp
        ));
      } else {
        // Create new component
        response = await api.post(`/api/modules/${id}/components`, componentForm);
        
        // Add to local state
        setComponents([...components, response.data]);
      }
      
      setSuccess(true);
      handleCloseDialog();
    } catch (err) {
      console.error('Error saving component:', err);
      setError(err.response?.data?.message || 'Failed to save component');
    } finally {
      setSaving(false);
    }
  };
  
  const handleDeleteComponent = async (componentId) => {
    if (window.confirm('Are you sure you want to delete this component? This action cannot be undone.')) {
      try {
        await api.delete(`/api/modules/components/${componentId}`);
        
        // Update local state
        setComponents(components.filter(comp => comp.id !== componentId));
        setSuccess(true);
      } catch (err) {
        console.error('Error deleting component:', err);
        setError(err.response?.data?.message || 'Failed to delete component');
      }
    }
  };
  
  const handleDragEnd = async (result) => {
    if (!result.destination) {
      return;
    }
    
    // Reorder the components in the local state
    const reordered = Array.from(components);
    const [removed] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, removed);
    
    setComponents(reordered);
    
    // Send the new order to the server
    try {
      await api.put(`/api/modules/${id}/components/order`, reordered.map(comp => comp.id));
    } catch (err) {
      console.error('Error updating component order:', err);
      setError('Failed to save component order');
      // Revert to the original order if the API call fails
      fetchCourseData();
    }
  };
  
  const handleGoToAssessment = (componentId) => {
    navigate(`/admin/courses/components/${componentId}/assessment`);
  };
  
  const handleGoToMaterials = (componentId) => {
    navigate(`/admin/courses/components/${componentId}/materials`);
  };
  
  const handleBackToCourses = () => {
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
                onClick={handleBackToCourses}
                sx={{ mr: 2 }}
              >
                Back to Courses
              </Button>
              <Typography variant="h4" component="h1">
                Edit Course: {course?.title}
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
                Course Details
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Domain
                </Typography>
                <Typography variant="body1">
                  {course?.domain?.name || 'No domain assigned'}
                </Typography>
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Description
                </Typography>
                <Typography variant="body1">
                  {course?.description || 'No description available'}
                </Typography>
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Passing Score
                </Typography>
                <Typography variant="body1">
                  {course?.passingScore || 70}%
                </Typography>
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Estimated Duration
                </Typography>
                <Typography variant="body1">
                  {course?.estimatedDuration || 0} minutes
                </Typography>
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Status
                </Typography>
                <Typography 
                  variant="body1" 
                  sx={{ 
                    color: course?.status === 'PUBLISHED' 
                      ? 'success.main' 
                      : course?.status === 'ARCHIVED' 
                        ? 'warning.main' 
                        : 'text.primary'
                  }}
                >
                  {course?.status || 'DRAFT'}
                </Typography>
              </Box>
              
              <Box sx={{ mt: 3 }}>
                <Button
                  variant="outlined"
                  fullWidth
                  onClick={() => navigate(`/admin/courses/edit/${id}`)}
                >
                  Edit Course Details
                </Button>
              </Box>
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 3 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">
                  Course Components
                </Typography>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<AddIcon />}
                  onClick={handleAddComponent}
                  disabled={course?.status === 'PUBLISHED'}
                >
                  Add Component
                </Button>
              </Box>
              <Divider sx={{ mb: 3 }} />
              
              {components.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="body1" color="text.secondary" gutterBottom>
                    No components added yet
                  </Typography>
                  <Button
                    variant="outlined"
                    startIcon={<AddIcon />}
                    onClick={handleAddComponent}
                    disabled={course?.status === 'PUBLISHED'}
                    sx={{ mt: 2 }}
                  >
                    Add Your First Component
                  </Button>
                </Box>
              ) : (
                <DragDropContext onDragEnd={handleDragEnd}>
                  <Droppable droppableId="components">
                    {(provided) => (
                      <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                      >
                        <Stepper orientation="vertical" nonLinear>
                          {components.map((component, index) => (
                            <Draggable
                              key={component.id}
                              draggableId={component.id}
                              index={index}
                              isDragDisabled={course?.status === 'PUBLISHED'}
                            >
                              {(provided) => (
                                <Step
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  completed={false}
                                  active={true}
                                >
                                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    {course?.status !== 'PUBLISHED' && (
                                      <Box {...provided.dragHandleProps} sx={{ mr: 1, color: 'text.secondary' }}>
                                        <DragIcon />
                                      </Box>
                                    )}
                                    <StepLabel
                                      icon={
                                        component.type === ComponentTypes.PRE_ASSESSMENT || 
                                        component.type === ComponentTypes.POST_ASSESSMENT ? (
                                          <AssessmentIcon color="primary" />
                                        ) : (
                                          <MaterialsIcon color="primary" />
                                        )
                                      }
                                    >
                                      <Typography variant="subtitle1">
                                        {component.title}
                                        {component.isRequired === false && (
                                          <Typography 
                                            component="span" 
                                            variant="caption" 
                                            sx={{ ml: 1, color: 'text.secondary' }}
                                          >
                                            (Optional)
                                          </Typography>
                                        )}
                                      </Typography>
                                    </StepLabel>
                                  </Box>
                                  <StepContent>
                                    <Box sx={{ mb: 2 }}>
                                      <Typography variant="body2" color="text.secondary">
                                        {component.type === ComponentTypes.PRE_ASSESSMENT ? 'Pre-Assessment' : 
                                         component.type === ComponentTypes.POST_ASSESSMENT ? 'Post-Assessment' : 
                                         'Learning Materials'}
                                      </Typography>
                                      <Typography variant="body1">
                                        {component.description || 'No description available'}
                                      </Typography>
                                    </Box>
                                    
                                    <ComponentPreviewCard component={component} />
                                    
                                    <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                                      {component.type === ComponentTypes.PRE_ASSESSMENT || 
                                       component.type === ComponentTypes.POST_ASSESSMENT ? (
                                        <Button
                                          variant="outlined"
                                          startIcon={<QuizIcon />}
                                          onClick={() => handleGoToAssessment(component.id)}
                                          size="small"
                                        >
                                          Manage Questions
                                        </Button>
                                      ) : (
                                        <Button
                                          variant="outlined"
                                          startIcon={<MaterialsIcon />}
                                          onClick={() => handleGoToMaterials(component.id)}
                                          size="small"
                                        >
                                          Manage Materials
                                        </Button>
                                      )}
                                      
                                      {course?.status !== 'PUBLISHED' && (
                                        <>
                                          <IconButton 
                                            size="small" 
                                            color="primary"
                                            onClick={() => handleEditComponent(component)}
                                          >
                                            <EditIcon />
                                          </IconButton>
                                          <IconButton 
                                            size="small" 
                                            color="error"
                                            onClick={() => handleDeleteComponent(component.id)}
                                          >
                                            <DeleteIcon />
                                          </IconButton>
                                        </>
                                      )}
                                    </Box>
                                  </StepContent>
                                </Step>
                              )}
                            </Draggable>
                          ))}
                        </Stepper>
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
      
      {/* Add/Edit Component Dialog */}
      <Dialog
        open={showAddComponent}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingComponentId ? 'Edit Component' : 'Add New Component'}
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <TextField
                fullWidth
                required
                label="Title"
                name="title"
                value={componentForm.title}
                onChange={handleComponentInputChange}
                error={!!componentFormErrors.title}
                helperText={componentFormErrors.title}
              />
            </Grid>
            
            <Grid item xs={12} md={4}>
              <FormControl 
                fullWidth 
                required 
                error={!!componentFormErrors.type}
                disabled={!!editingComponentId} // Can't change type after creation
              >
                <InputLabel>Component Type</InputLabel>
                <Select
                  name="type"
                  value={componentForm.type}
                  onChange={handleComponentInputChange}
                  label="Component Type"
                >
                  <MenuItem value={ComponentTypes.PRE_ASSESSMENT}>Pre-Assessment</MenuItem>
                  <MenuItem value={ComponentTypes.LEARNING_MATERIAL}>Learning Materials</MenuItem>
                  <MenuItem value={ComponentTypes.POST_ASSESSMENT}>Post-Assessment</MenuItem>
                </Select>
                {componentFormErrors.type && (
                  <FormHelperText>{componentFormErrors.type}</FormHelperText>
                )}
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Description"
                name="description"
                value={componentForm.description}
                onChange={handleComponentInputChange}
              />
            </Grid>
            
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={componentForm.isRequired}
                    onChange={handleSwitchChange}
                    name="isRequired"
                    color="primary"
                  />
                }
                label="Required to progress (students must complete this component before proceeding)"
              />
            </Grid>
            
            {(componentForm.type === ComponentTypes.PRE_ASSESSMENT || 
              componentForm.type === ComponentTypes.POST_ASSESSMENT) && (
              <>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    required
                    type="number"
                    label="Time Limit (minutes)"
                    name="timeLimit"
                    value={componentForm.timeLimit}
                    onChange={handleComponentInputChange}
                    InputProps={{ inputProps: { min: 1 } }}
                    error={!!componentFormErrors.timeLimit}
                    helperText={componentFormErrors.timeLimit}
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    required
                    type="number"
                    label="Passing Score (%)"
                    name="passingScore"
                    value={componentForm.passingScore}
                    onChange={handleComponentInputChange}
                    InputProps={{ inputProps: { min: 0, max: 100 } }}
                    error={!!componentFormErrors.passingScore}
                    helperText={componentFormErrors.passingScore}
                  />
                </Grid>
              </>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={saving}>
            Cancel
          </Button>
          <Button 
            onClick={handleSaveComponent} 
            variant="contained" 
            color="primary"
            disabled={saving}
            startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
          >
            {saving ? 'Saving...' : 'Save Component'}
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

export default CourseEditor;