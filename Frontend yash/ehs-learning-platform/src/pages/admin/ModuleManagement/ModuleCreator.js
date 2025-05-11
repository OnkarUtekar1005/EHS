// src/pages/admin/ModuleCreator.js
import React, { useState, useEffect, useCallback } from 'react';
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
  SmartToy as AIIcon
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  moduleService, 
  domainService, 
  materialLibraryService, 
  componentService, 
  assessmentService 
} from '../../../services/api';
import AssessmentCreator from './AssessmentCreator';
import LearningMaterialBrowser from '../LearningMaterialManagment/LearningMaterialBrowser';

// Component type constants
const COMPONENT_TYPES = {
  PRE_ASSESSMENT: 'PRE_ASSESSMENT',
  POST_ASSESSMENT: 'POST_ASSESSMENT',
  LEARNING_MATERIAL: 'LEARNING_MATERIAL',
  VIDEO: 'VIDEO',
  PRESENTATION: 'PRESENTATION',
  INTERACTIVE: 'INTERACTIVE'
};

// Default component templates
const DEFAULT_COMPONENTS = [
  { id: 'pre-assess', type: COMPONENT_TYPES.PRE_ASSESSMENT, title: 'Pre-Assessment', configured: false, data: {} },
  { id: 'learning', type: COMPONENT_TYPES.LEARNING_MATERIAL, title: 'Learning Materials', configured: false, data: {} },
  { id: 'post-assess', type: COMPONENT_TYPES.POST_ASSESSMENT, title: 'Post-Assessment', configured: false, data: {} }
];

// Component type options for dropdown
const COMPONENT_TYPE_OPTIONS = [
  { value: COMPONENT_TYPES.PRE_ASSESSMENT, label: 'Pre-Assessment' },
  { value: COMPONENT_TYPES.LEARNING_MATERIAL, label: 'Learning Materials' },
  { value: COMPONENT_TYPES.VIDEO, label: 'Video Content' },
  { value: COMPONENT_TYPES.PRESENTATION, label: 'Presentation Slides' },
  { value: COMPONENT_TYPES.INTERACTIVE, label: 'Interactive Exercise' },
  { value: COMPONENT_TYPES.POST_ASSESSMENT, label: 'Post-Assessment' }
];

const ModuleCreator = () => {
  const navigate = useNavigate();
  const { moduleId } = useParams();
  const isEditing = Boolean(moduleId);
  
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
  const [components, setComponents] = useState(DEFAULT_COMPONENTS);
  
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
  
  // Helper function to get default title for component type
  const getDefaultTitleForType = useCallback((type) => {
    switch (type) {
      case COMPONENT_TYPES.PRE_ASSESSMENT:
        return 'Pre-Assessment';
      case COMPONENT_TYPES.POST_ASSESSMENT:
        return 'Post-Assessment';
      case COMPONENT_TYPES.LEARNING_MATERIAL:
        return 'Learning Materials';
      case COMPONENT_TYPES.VIDEO:
        return 'Video Content';
      case COMPONENT_TYPES.PRESENTATION:
        return 'Presentation Slides';
      case COMPONENT_TYPES.INTERACTIVE:
        return 'Interactive Exercise';
      default:
        return 'New Component';
    }
  }, []);
  
  // Helper function to parse options
  const parseOptions = useCallback((options) => {
    if (!options) return [];
    
    try {
      if (typeof options === 'string') {
        return JSON.parse(options);
      }
      return options;
    } catch (e) {
      console.error('Error parsing options:', e);
      return [];
    }
  }, []);

  // Helper function to process component data
  const processComponentData = useCallback(async (comp) => {
    const componentData = {
      id: comp.id,
      type: comp.type,
      title: comp.title || getDefaultTitleForType(comp.type),
      description: comp.description || '',
      sequenceOrder: comp.sequenceOrder,
      estimatedDuration: comp.estimatedDuration,
      requiredToAdvance: comp.requiredToAdvance,
      configured: true,
      data: {}
    };
    
    // Process based on component type
    if ([COMPONENT_TYPES.PRE_ASSESSMENT, COMPONENT_TYPES.POST_ASSESSMENT].includes(comp.type)) {
      try {
        console.log(`[ModuleCreator] Fetching questions for component ${comp.id}`);
        const questionsResponse = await assessmentService.getQuestions(comp.id);
        const questionData = questionsResponse.data || [];
        
        const questions = questionData.map(q => ({
          id: q.id,
          text: q.text,
          type: q.type,
          points: q.points || 1,
          options: parseOptions(q.options),
          correctAnswer: q.correctAnswer,
          explanation: q.explanation || '',
          sequenceOrder: q.sequenceOrder
        }));
        
        componentData.data = {
          title: comp.title,
          type: comp.type,
          questions
        };
      } catch (err) {
        console.error(`[ModuleCreator] Error fetching questions for component ${comp.id}:`, err);
        componentData.data = {
          title: comp.title,
          type: comp.type,
          questions: []
        };
      }
    } else if (comp.type === COMPONENT_TYPES.LEARNING_MATERIAL) {
      try {
        const materialsResponse = await materialLibraryService.getMaterialsByComponent(comp.id);
        componentData.data = {
          materials: materialsResponse.data || []
        };
      } catch (err) {
        console.error(`[ModuleCreator] Error fetching materials for component ${comp.id}:`, err);
        componentData.data = { materials: [] };
      }
    } else if (comp.content) {
      try {
        componentData.data = typeof comp.content === 'string' 
          ? JSON.parse(comp.content) 
          : comp.content;
      } catch (e) {
        componentData.data = { content: comp.content };
      }
    }
    
    return componentData;
  }, [getDefaultTitleForType, parseOptions]);
  
  // Load data effect
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch domains
        const domainsResponse = await domainService.getAll();
        setDomains(domainsResponse.data || []);
        
        // If editing, fetch module data
        if (isEditing) {
          const moduleResponse = await moduleService.getById(moduleId);
          const module = moduleResponse.data.module || moduleResponse.data;
          
          // Set basic module data
          setModuleData({
            title: module.title || '',
            domainId: module.domain?.id || '',
            description: module.description || '',
            estimatedDuration: module.estimatedDuration || 45,
            requiredScore: module.requiredCompletionScore || 70,
            status: module.status || 'DRAFT'
          });
          
          // Fetch and process components
          const componentsResponse = await componentService.getByModule(moduleId);
          const moduleComponents = componentsResponse.data || [];
          
          if (moduleComponents.length > 0) {
            const componentsWithData = await Promise.all(
              moduleComponents.map(processComponentData)
            );
            setComponents(componentsWithData);
          }
        }
      } catch (err) {
        console.error('[ModuleCreator] Error loading data:', err);
        setError(err.response?.data?.message || 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [isEditing, moduleId, processComponentData]);
  
  // Handle input changes for module data
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setModuleData(prev => ({
      ...prev,
      [name]: value
    }));
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
  };

  // Save learning material configuration
  const handleSaveLearningMaterial = (materials) => {
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
  
  // Component movement handlers
  const handleMoveUp = (index) => {
    if (index === 0) return;
    
    const items = Array.from(components);
    [items[index], items[index - 1]] = [items[index - 1], items[index]];
    setComponents(items);
  };
  
  const handleMoveDown = (index) => {
    if (index === components.length - 1) return;
    
    const items = Array.from(components);
    [items[index], items[index + 1]] = [items[index + 1], items[index]];
    setComponents(items);
  };
  
  // Delete component
  const handleDeleteComponent = (index) => {
    setComponents(components.filter((_, i) => i !== index));
  };
  
  // Add component dialog handlers
  const handleOpenAddDialog = () => {
    setAddComponentDialog(true);
    setNewComponentType('');
  };
  
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
  
  // Format module data for submission
  const formatModuleDataForSubmission = useCallback(() => {
    const formattedData = {
      title: moduleData.title,
      description: moduleData.description,
      domainId: moduleData.domainId,
      estimatedDuration: moduleData.estimatedDuration,
      requiredCompletionScore: moduleData.requiredScore,
      status: moduleData.status,
      components: components.map((comp, index) => {
        let formattedData = { ...comp.data };
        
        // Format assessment questions
        if ([COMPONENT_TYPES.PRE_ASSESSMENT, COMPONENT_TYPES.POST_ASSESSMENT].includes(comp.type) && 
            formattedData.questions) {
          formattedData.questions = formattedData.questions.map(q => ({
            text: q.text,
            type: q.type,
            points: q.points || 1,
            options: q.options || [],
            explanation: q.explanation || ''
          }));
        }
        
        // Format learning materials
        if (comp.type === COMPONENT_TYPES.LEARNING_MATERIAL && formattedData.materials) {
          formattedData.materialAssociations = formattedData.materials.map((material, idx) => ({
            materialId: material.id,
            sequenceOrder: idx + 1
          }));
          
          delete formattedData.materials;
        }
        
        return {
          id: comp.id && comp.id.startsWith('comp-') ? null : comp.id,
          title: comp.title,
          type: comp.type,
          description: comp.description || '',
          sequenceOrder: index + 1,
          requiredToAdvance: true,
          estimatedDuration: comp.estimatedDuration || 30,
          data: formattedData
        };
      })
    };
    
    return formattedData;
  }, [moduleData, components]);
  
  // Save module
  const handleSaveModule = async () => {
    try {
      setSaveLoading(true);
      setError('');
      
      // Validate form
      if (!moduleData.title) {
        setError('Module title is required');
        setSaveLoading(false);
        return;
      }
      
      if (!moduleData.domainId) {
        setError('Please select a domain');
        setSaveLoading(false);
        return;
      }
      
      // Prepare and submit data
      const submitData = formatModuleDataForSubmission();
      const response = await moduleService.create(submitData);
      const createdModule = response.data;
      
      // Associate materials with components
      if (createdModule?.components) {
        try {
          const learningMaterialComponents = components.filter(c => 
            c.type === COMPONENT_TYPES.LEARNING_MATERIAL
          );
          
          for (const component of learningMaterialComponents) {
            if (!component.data?.materials?.length) continue;
            
            const createdComponent = createdModule.components.find(cc => 
              cc.title === component.title && cc.type === component.type
            );
            
            if (createdComponent) {
              const materialIds = component.data.materials.map(m => m.id);
              
              if (materialIds.length > 0) {
                await materialLibraryService.associateMaterialsWithComponent(
                  createdComponent.id,
                  materialIds
                );
              }
            }
          }
        } catch (materialErr) {
          console.error('[ModuleCreator] Error associating materials:', materialErr);
          setError('Module saved, but some materials could not be associated');
          setSaveLoading(false);
          return;
        }
      }
      
      setSuccess('Module saved successfully');
      
      // Redirect after delay
      setTimeout(() => {
        navigate('/admin/modules');
      }, 2000);
      
    } catch (err) {
      console.error('[ModuleCreator] Error saving module:', err);
      setError(err.response?.data?.message || 'Failed to save module');
    } finally {
      setSaveLoading(false);
    }
  };
  
  // Cancel and go back
  const handleCancel = () => navigate('/admin/modules');
  
  // Placeholder function
  const handleAIGenerate = () => alert('This feature is not implemented yet');
  
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={2} sx={{ p: 3 }}>
        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4">
            {isEditing ? 'Edit Module: ' : 'Create Module: '}
            {moduleData.title || 'New Module'}
          </Typography>
          <Box>
            <Button 
              variant="contained" 
              color="primary" 
              startIcon={saveLoading ? <CircularProgress size={24} /> : <SaveIcon />}
              onClick={handleSaveModule}
              disabled={saveLoading}
              sx={{ mr: 1 }}
            >
              {saveLoading ? 'Saving...' : 'Save'}
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
        
        {/* Alerts */}
        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 3 }}>{success}</Alert>}
        
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
          
          {loading ? (
            <Box display="flex" justifyContent="center" py={4}>
              <CircularProgress />
            </Box>
          ) : (
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
                                    {component.type === COMPONENT_TYPES.LEARNING_MATERIAL && 
                                     component.data?.materials?.length > 0 && (
                                      <Typography variant="body2" color="textSecondary">
                                        Materials: {component.data.materials.length}
                                      </Typography>
                                    )}
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
          )}
          
          <Box mt={2} display="flex" justifyContent="space-between">
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={handleOpenAddDialog}
              disabled={loading}
            >
              Add Component
            </Button>
            <Box>
              <Button
                variant="outlined"
                startIcon={<AIIcon />}
                sx={{ mr: 2 }}
                onClick={handleAIGenerate}
                disabled={loading}
              >
                AI Generate
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
              {COMPONENT_TYPE_OPTIONS.map((type) => (
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
        open={openDialog && (dialogType === COMPONENT_TYPES.PRE_ASSESSMENT || dialogType === COMPONENT_TYPES.POST_ASSESSMENT)} 
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
        open={openDialog && dialogType === COMPONENT_TYPES.LEARNING_MATERIAL} 
        onClose={handleCloseDialog}
        fullWidth
        maxWidth="lg"
      >
        <DialogContent sx={{ p: 0 }}>
          {selectedComponent && (
            <LearningMaterialBrowser
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