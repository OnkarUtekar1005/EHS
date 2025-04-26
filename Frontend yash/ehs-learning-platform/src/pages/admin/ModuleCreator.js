import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  TextField,
  MenuItem,
  Grid,
  Button,
  IconButton,
  List,
  ListItem,
  Divider,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
  Tooltip
} from '@mui/material';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import {
  Add as AddIcon,
  ArrowUpward as ArrowUpIcon,
  ArrowDownward as ArrowDownIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  SmartToy as AIIcon,
  Visibility as PreviewIcon
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { moduleService, domainService } from '../../services/api';
import AssessmentCreator from './AssessmentCreator';
import LearningMaterialCreator from './LearningMaterialCreator';
const ModuleCreator = () => {
  const navigate = useNavigate();
  const { moduleId } = useParams();
  const isEditing = !!moduleId;
  
  // Module state
  const [moduleData, setModuleData] = useState({
    title: '',
    domainId: '',
    description: '',
    estimatedDuration: 45,
    requiredScore: 70,
    status: 'DRAFT'
  });
  
  // Components state
  const [components, setComponents] = useState([
    { id: 'pre-assess', type: 'PRE_ASSESSMENT', title: 'Pre-Assessment', configured: false, data: {} },
    { id: 'learning', type: 'LEARNING_MATERIALS', title: 'Learning Materials', configured: false, data: {} },
    { id: 'post-assess', type: 'POST_ASSESSMENT', title: 'Post-Assessment', configured: false, data: {} }
  ]);
  
  // UI state
  const [domains, setDomains] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Dialog state
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogType, setDialogType] = useState('');
  const [selectedComponent, setSelectedComponent] = useState(null);
  const [addComponentDialog, setAddComponentDialog] = useState(false);
  const [newComponentType, setNewComponentType] = useState('');
  
  // Load domains and module data (if editing)
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch domains
        const domainsResponse = await domainService.getAll();
        setDomains(domainsResponse.data);
        
        // If editing, fetch module data
        if (isEditing) {
          const moduleResponse = await moduleService.getById(moduleId);
          const module = moduleResponse.data;
          
          // Set basic module data
          setModuleData({
            title: module.title || '',
            domainId: module.domain?.id || '',
            description: module.description || '',
            estimatedDuration: module.estimatedDuration || 45,
            requiredScore: module.requiredScore || 70,
            status: module.status || 'DRAFT'
          });
          
          // Set components if available
          if (module.components && module.components.length > 0) {
            setComponents(module.components.map(comp => ({
              id: comp.id,
              type: comp.type,
              title: comp.title || getDefaultTitleForType(comp.type),
              configured: true, // Assuming components from API are configured
              data: comp.data || {}
            })));
          }
        }
      } catch (err) {
        console.error('Error loading data:', err);
        setError(err.response?.data?.message || 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [isEditing, moduleId]);
  
  // Helper function to get default title for component type
  const getDefaultTitleForType = (type) => {
    switch (type) {
      case 'PRE_ASSESSMENT':
        return 'Pre-Assessment';
      case 'POST_ASSESSMENT':
        return 'Post-Assessment';
      case 'LEARNING_MATERIALS':
        return 'Learning Materials';
      case 'VIDEO':
        return 'Video Content';
      case 'PRESENTATION':
        return 'Presentation Slides';
      case 'INTERACTIVE':
        return 'Interactive Exercise';
      default:
        return 'New Component';
    }
  };
  
  // Handle input changes for module data
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setModuleData({
      ...moduleData,
      [name]: value
    });
  };
  
  // Handle drag and drop reordering
  const handleDragEnd = (result) => {
    if (!result.destination) return;
    
    const items = Array.from(components);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    setComponents(items);
  };
  




// Open component configuration dialog
const handleConfigureComponent = (component) => {
  setSelectedComponent(component);
  setDialogType(component.type);
  setOpenDialog(true);
  
  // For learning materials, use the specific handler
  if (component.type === 'LEARNING_MATERIALS' || component.type === 'LEARNING_MATERIAL') {
    setDialogType('LEARNING_MATERIALS');
  }
};

// Save learning material configuration
const handleSaveLearningMaterial = (materials) => {
  // Update the component with the new materials
  const updatedComponents = components.map(comp => 
    comp.id === selectedComponent.id
      ? { 
          ...comp, 
          title: comp.title || 'Learning Materials', 
          configured: true, 
          data: { 
            ...comp.data,
            materials 
          } 
        }
      : comp
  );
  
  setComponents(updatedComponents);
  setOpenDialog(false);
};
  // Move component up
  const handleMoveUp = (index) => {
    if (index === 0) return;
    
    const items = Array.from(components);
    const temp = items[index];
    items[index] = items[index - 1];
    items[index - 1] = temp;
    
    setComponents(items);
  };
  
  // Move component down
  const handleMoveDown = (index) => {
    if (index === components.length - 1) return;
    
    const items = Array.from(components);
    const temp = items[index];
    items[index] = items[index + 1];
    items[index + 1] = temp;
    
    setComponents(items);
  };
  
  // Delete component
  const handleDeleteComponent = (index) => {
    const items = Array.from(components);
    items.splice(index, 1);
    setComponents(items);
  };
  
  // Open add component dialog
  const handleOpenAddDialog = () => {
    setAddComponentDialog(true);
    setNewComponentType('');
  };
  
  // Close add component dialog
  const handleCloseAddDialog = () => {
    setAddComponentDialog(false);
  };
  
  // Add new component
  const handleAddComponent = () => {
    if (!newComponentType) return;
    
    const newComponent = {
      id: `comp-${Date.now()}`,
      type: newComponentType,
      title: getDefaultTitleForType(newComponentType),
      configured: false,
      data: {}
    };
    
    setComponents([...components, newComponent]);
    setAddComponentDialog(false);
  };
  
  // Save assessment configuration
  const handleSaveAssessment = (assessmentData) => {
    // Update the component with the new configuration
    const updatedComponents = components.map(comp => 
      comp.id === selectedComponent.id
        ? { ...comp, title: assessmentData.title, configured: true, data: assessmentData }
        : comp
    );
    
    setComponents(updatedComponents);
    setOpenDialog(false);
  };
  
  // Close component dialog
  const handleCloseDialog = () => {
    setOpenDialog(false);
  };
  
  // Save module
  const handleSaveModule = async () => {
    try {
      setSaveLoading(true);
      setError('');
      
      // Validate form
      if (!moduleData.title) {
        setError('Module title is required');
        return;
      }
      
      if (!moduleData.domainId) {
        setError('Please select a domain');
        return;
      }
      
      // Prepare data for API
      const submitData = {
        ...moduleData,
        components: components.map(comp => ({
          id: comp.id,
          type: comp.type,
          title: comp.title,
          data: comp.data
        }))
      };
      
      // Either create new or update existing
      let response;
      if (isEditing) {
        response = await moduleService.update(moduleId, submitData);
      } else {
        response = await moduleService.create(submitData);
      }
      
      setSuccess('Module saved successfully');
      
      // Redirect to module list after a short delay
      setTimeout(() => {
        navigate('/admin/modules');
      }, 2000);
      
    } catch (err) {
      console.error('Error saving module:', err);
      setError(err.response?.data?.message || 'Failed to save module');
    } finally {
      setSaveLoading(false);
    }
  };
  
  // Cancel and go back
  const handleCancel = () => {
    navigate('/admin/modules');
  };
  
  // AI Generate
  const handleAIGenerate = () => {
    // Placeholder for AI generation
    alert('This feature is not implemented yet');
  };
  
  // Preview module
  const handlePreviewModule = () => {
    // Open preview in new tab or modal
    alert('Preview functionality not implemented yet');
  };
  
  // Component type options
  const componentTypes = [
    { value: 'PRE_ASSESSMENT', label: 'Pre-Assessment' },
    { value: 'LEARNING_MATERIALS', label: 'Learning Materials' },
    { value: 'VIDEO', label: 'Video' },
    { value: 'PRESENTATION', label: 'Presentation' },
    { value: 'INTERACTIVE', label: 'Interactive Exercise' },
    { value: 'POST_ASSESSMENT', label: 'Post-Assessment' }
  ];
  
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={2} sx={{ p: 3, position: 'relative' }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4">
            {isEditing ? 'Edit Module: ' : 'Create Module: '}
            {moduleData.title || 'New Module'}
          </Typography>
          <Box>
            <Button 
              variant="contained" 
              color="primary" 
              startIcon={<SaveIcon />}
              onClick={handleSaveModule}
              disabled={saveLoading}
              sx={{ mr: 1 }}
            >
              {saveLoading ? <CircularProgress size={24} /> : 'Save'}
            </Button>
            <Button 
              variant="outlined"
              startIcon={<CancelIcon />}
              onClick={handleCancel}
              disabled={saveLoading}
            >
              Cancel
            </Button>
          </Box>
        </Box>
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert severity="success" sx={{ mb: 3 }}>
            {success}
          </Alert>
        )}
        
        {/* Module Settings */}
        <Box mb={4}>
          <Typography variant="h6" gutterBottom>Module Settings</Typography>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Title"
                name="title"
                value={moduleData.title}
                onChange={handleInputChange}
                required
                disabled={loading}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Domain</InputLabel>
                <Select
                  name="domainId"
                  value={moduleData.domainId}
                  onChange={handleInputChange}
                  label="Domain"
                  disabled={loading}
                >
                  {domains.map(domain => (
                    <MenuItem key={domain.id} value={domain.id}>
                      {domain.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                label="Estimated Duration"
                name="estimatedDuration"
                type="number"
                value={moduleData.estimatedDuration}
                onChange={handleInputChange}
                InputProps={{
                  endAdornment: <InputAdornment position="end">minutes</InputAdornment>,
                }}
                disabled={loading}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                label="Required Completion Score"
                name="requiredScore"
                type="number"
                value={moduleData.requiredScore}
                onChange={handleInputChange}
                InputProps={{
                  endAdornment: <InputAdornment position="end">%</InputAdornment>,
                }}
                disabled={loading}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                name="description"
                value={moduleData.description}
                onChange={handleInputChange}
                multiline
                rows={3}
                disabled={loading}
              />
            </Grid>
          </Grid>
        </Box>
        
        {/* Module Components */}
        <Box>
          <Typography variant="h6" gutterBottom>Module Components</Typography>
          <Typography variant="body2" color="textSecondary" gutterBottom>
            Drag components to reorder
          </Typography>
          
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="components">
              {(provided) => (
                <List
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  sx={{ bgcolor: 'background.paper' }}
                >
                  {components.map((component, index) => (
                    <Draggable key={component.id} draggableId={component.id} index={index}>
                      {(provided) => (
                        <ListItem
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          sx={{ mb: 2 }}
                        >
                          <Card variant="outlined" sx={{ width: '100%' }}>
                            <CardContent>
                              <Box display="flex" justifyContent="space-between" alignItems="center">
                                <Box>
                                  <Typography variant="subtitle1">
                                    {index + 1}. {component.title}
                                  </Typography>
                                  <Typography variant="body2" color="textSecondary">
                                    Type: {getDefaultTitleForType(component.type)}
                                  </Typography>
                                  <Typography variant="body2" color="textSecondary">
                                    Status: {component.configured ? 'Configured' : 'Not configured'}
                                  </Typography>
                                  <Button
                                    variant="outlined"
                                    size="small"
                                    sx={{ mt: 1 }}
                                    onClick={() => handleConfigureComponent(component)}
                                  >
                                    Configure {component.title}
                                  </Button>
                                </Box>
                                <Box>
                                  <Tooltip title="Move Up">
                                    <span>
                                      <IconButton 
                                        onClick={() => handleMoveUp(index)}
                                        disabled={index === 0}
                                      >
                                        <ArrowUpIcon />
                                      </IconButton>
                                    </span>
                                  </Tooltip>
                                  <Tooltip title="Move Down">
                                    <span>
                                      <IconButton 
                                        onClick={() => handleMoveDown(index)}
                                        disabled={index === components.length - 1}
                                      >
                                        <ArrowDownIcon />
                                      </IconButton>
                                    </span>
                                  </Tooltip>
                                  <Tooltip title="Edit">
                                    <IconButton onClick={() => handleConfigureComponent(component)}>
                                      <EditIcon />
                                    </IconButton>
                                  </Tooltip>
                                  <Tooltip title="Delete">
                                    <IconButton onClick={() => handleDeleteComponent(index)}>
                                      <DeleteIcon />
                                    </IconButton>
                                  </Tooltip>
                                </Box>
                              </Box>
                            </CardContent>
                          </Card>
                        </ListItem>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </List>
              )}
            </Droppable>
          </DragDropContext>
          
          <Box mt={2} display="flex" justifyContent="space-between">
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={handleOpenAddDialog}
            >
              Add Component
            </Button>
            <Box>
              <Button
                variant="outlined"
                startIcon={<AIIcon />}
                sx={{ mr: 2 }}
                onClick={handleAIGenerate}
              >
                AI Generate Complete Module
              </Button>
              <Button
                variant="outlined"
                startIcon={<PreviewIcon />}
                onClick={handlePreviewModule}
              >
                Preview Module
              </Button>
            </Box>
          </Box>
        </Box>
      </Paper>
      
      {/* Add Component Dialog */}
      <Dialog open={addComponentDialog} onClose={handleCloseAddDialog}>
        <DialogTitle>Add New Component</DialogTitle>
        <DialogContent sx={{ minWidth: 400 }}>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel id="component-type-label">Component Type</InputLabel>
            <Select
              labelId="component-type-label"
              value={newComponentType}
              onChange={(e) => setNewComponentType(e.target.value)}
              label="Component Type"
            >
              {componentTypes.map((type) => (
                <MenuItem key={type.value} value={type.value}>
                  {type.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAddDialog}>Cancel</Button>
          <Button 
            onClick={handleAddComponent} 
            variant="contained" 
            disabled={!newComponentType}
          >
            Add
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Assessment Component Dialog */}
      <Dialog 
        open={openDialog && (dialogType === 'PRE_ASSESSMENT' || dialogType === 'POST_ASSESSMENT')} 
        onClose={handleCloseDialog}
        fullWidth
        maxWidth="md"
      >
        <DialogContent sx={{ p: 0 }}>
          {selectedComponent && (
            <AssessmentCreator
              assessment={selectedComponent.data}
              moduleTitle={moduleData.title}
              assessmentType={dialogType}
              onSave={handleSaveAssessment}
              onCancel={handleCloseDialog}
            />
          )}
        </DialogContent>
      </Dialog>
      {/* Learning Materials Component Dialog */}
      <Dialog 
        open={openDialog && (dialogType === 'LEARNING_MATERIALS' || dialogType === 'LEARNING_MATERIAL')} 
        onClose={handleCloseDialog}
        fullWidth
        maxWidth="lg"
      >
        <DialogContent sx={{ p: 0 }}>
          {selectedComponent && (
            <LearningMaterialCreator
              componentId={selectedComponent.id}
              initialMaterials={selectedComponent.data?.materials || []}
              onSave={handleSaveLearningMaterial}
              onCancel={handleCloseDialog}
            />
          )}
        </DialogContent>
      </Dialog>
      
     
    </Container>
  );
};

export default ModuleCreator;