import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
  Paper,
  Divider,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Alert
} from '@mui/material';
import {
  Add as AddIcon,
  ExpandMore as ExpandMoreIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Quiz as AssessmentIcon
} from '@mui/icons-material';
import api from '../../../../services/api';
import ComponentList from './ComponentList';
import AssessmentForm from './ComponentForm/AssessmentForm';
import MaterialForm from './ComponentForm/MaterialForm';

const CourseBuilder = ({ courseId, course, onUpdate }) => {
  const [components, setComponents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [selectedType, setSelectedType] = useState(null);
  const [editingComponent, setEditingComponent] = useState(null);

  // Fetch components when courseId changes
  useEffect(() => {
    if (courseId) {
      fetchComponents();
    }
  }, [courseId]);

  const fetchComponents = async () => {
    if (!courseId) return;
    
    setLoading(true);
    try {
      const response = await api.get(`/v2/admin/courses/${courseId}/components`);
      setComponents(response.data.components || []);
    } catch (error) {
      console.error('Error fetching components:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMoveComponent = async (componentId, direction) => {
    const currentIndex = components.findIndex(c => c.id === componentId);
    if (currentIndex === -1) return;

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    
    // Check bounds
    if (newIndex < 0 || newIndex >= components.length) return;

    // Create new array with swapped items
    const newComponents = [...components];
    [newComponents[currentIndex], newComponents[newIndex]] = [newComponents[newIndex], newComponents[currentIndex]];

    // Update order indexes
    const componentOrders = newComponents.map((item, index) => ({
      componentId: item.id,
      newOrder: index + 1
    }));

    setComponents(newComponents);

    try {
      await api.put(`/v2/admin/courses/${courseId}/components/reorder`, {
        componentOrders
      });
    } catch (error) {
      console.error('Error reordering components:', error);
      fetchComponents(); // Revert on error
    }
  };

  const handleAddComponent = (type) => {
    setSelectedType(type);
    setEditingComponent(null);
    setOpenAddDialog(true);
  };

  const handleEditComponent = (component) => {
    setEditingComponent(component);
    setSelectedType(component.type);
    setOpenAddDialog(true);
  };

  const handleDeleteComponent = async (componentId) => {
    // Check if course has been published
    if (course?.hasBeenPublished) {
      console.warn('Cannot delete components from a course that has been previously published. You can only modify existing components.');
      return;
    }

    if (!window.confirm('Are you sure you want to delete this component?')) {
      return;
    }

    try {
      await api.delete(`/v2/admin/courses/${courseId}/components/${componentId}`);
      fetchComponents();
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Error deleting component:', error);
      console.error(error.response?.data?.message || 'Error deleting component');
    }
  };

  const handleSaveComponent = async (componentData) => {
    try {
      if (editingComponent) {
        // Update existing component
        await api.put(
          `/v2/admin/courses/${courseId}/components/${editingComponent.id}`,
          componentData
        );
      } else {
        // Check if course has been published before adding new component
        if (course?.hasBeenPublished) {
          console.warn('Cannot add new components to a course that has been previously published. You can only modify existing components.');
          setOpenAddDialog(false);
          setEditingComponent(null);
          setSelectedType(null);
          return;
        }
        // Add new component
        await api.post(`/v2/admin/courses/${courseId}/components`, componentData);
      }
      
      fetchComponents();
      setOpenAddDialog(false);
      setEditingComponent(null);
      setSelectedType(null);
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Error saving component:', error);
      console.error(error.response?.data?.message || 'Error saving component');
    }
  };

  const handleCloseDialog = () => {
    setOpenAddDialog(false);
    setEditingComponent(null);
    setSelectedType(null);
  };

  if (!courseId) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="body1" color="textSecondary">
          Save the course first to add components
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ mt: { xs: 2, sm: 4 } }}>
      {course?.hasBeenPublished && (
        <Alert severity="info" sx={{ mb: 2, fontSize: { xs: '0.875rem', sm: '1rem' } }}>
          This course has been previously published. You can only modify existing components, not add or delete components.
        </Alert>
      )}
      
      {/* Header - Mobile Responsive */}
      <Box sx={{ 
        display: 'flex', 
        flexDirection: { xs: 'column', sm: 'row' },
        justifyContent: 'space-between', 
        alignItems: { xs: 'stretch', sm: 'center' }, 
        mb: 2,
        gap: { xs: 2, sm: 0 }
      }}>
        <Typography 
          variant="h6" 
          sx={{ 
            fontSize: { xs: '1.125rem', sm: '1.25rem' },
            textAlign: { xs: 'center', sm: 'left' }
          }}
        >
          Course Components
        </Typography>
        
        {/* Mobile: Stack buttons vertically, Desktop: Horizontal */}
        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', sm: 'row' },
          gap: { xs: 1, sm: 1 },
          width: { xs: '100%', sm: 'auto' }
        }}>
          <Button
            startIcon={<AddIcon />}
            variant="outlined"
            size={window.innerWidth < 600 ? "medium" : "small"}
            disabled={course?.hasBeenPublished}
            onClick={() => handleAddComponent('PRE_ASSESSMENT')}
            sx={{ 
              width: { xs: '100%', sm: 'auto' },
              minHeight: { xs: 44, sm: 'auto' }
            }}
          >
            Pre-Assessment
          </Button>
          <Button
            startIcon={<AddIcon />}
            variant="outlined"
            size={window.innerWidth < 600 ? "medium" : "small"}
            disabled={course?.hasBeenPublished}
            onClick={() => handleAddComponent('MATERIAL')}
            sx={{ 
              width: { xs: '100%', sm: 'auto' },
              minHeight: { xs: 44, sm: 'auto' }
            }}
          >
            Material
          </Button>
          <Button
            startIcon={<AddIcon />}
            variant="outlined"
            size={window.innerWidth < 600 ? "medium" : "small"}
            disabled={course?.hasBeenPublished}
            onClick={() => handleAddComponent('POST_ASSESSMENT')}
            sx={{ 
              width: { xs: '100%', sm: 'auto' },
              minHeight: { xs: 44, sm: 'auto' }
            }}
          >
            Post-Assessment
          </Button>
        </Box>
      </Box>

      {components.length === 0 ? (
        <Paper sx={{ 
          p: { xs: 3, sm: 4 }, 
          textAlign: 'center',
          mt: 2
        }}>
          <AssessmentIcon 
            sx={{ 
              fontSize: { xs: 48, sm: 60 }, 
              color: 'text.secondary', 
              mb: 2 
            }} 
          />
          <Typography 
            variant="h6" 
            color="text.secondary" 
            gutterBottom
            sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}
          >
            No components added yet
          </Typography>
          <Typography 
            variant="body2" 
            color="text.secondary"
            sx={{ 
              mb: 3,
              fontSize: { xs: '0.875rem', sm: '1rem' }
            }}
          >
            Add your first component to get started building your course.
          </Typography>
          {!course?.hasBeenPublished && (
            <Box sx={{ 
              display: 'flex', 
              flexDirection: { xs: 'column', sm: 'row' },
              gap: 1, 
              justifyContent: 'center',
              maxWidth: 400,
              mx: 'auto'
            }}>
              <Button
                startIcon={<AddIcon />}
                variant="contained"
                size="medium"
                onClick={() => handleAddComponent('PRE_ASSESSMENT')}
                sx={{ width: { xs: '100%', sm: 'auto' } }}
              >
                Add Pre-Assessment
              </Button>
              <Button
                startIcon={<AddIcon />}
                variant="outlined"
                size="medium"
                onClick={() => handleAddComponent('MATERIAL')}
                sx={{ width: { xs: '100%', sm: 'auto' } }}
              >
                Add Material
              </Button>
            </Box>
          )}
        </Paper>
      ) : (
        <Box sx={{ mt: 2 }}>
          <ComponentList
            components={components}
            onEdit={handleEditComponent}
            onDelete={handleDeleteComponent}
            onMoveUp={(id) => handleMoveComponent(id, 'up')}
            onMoveDown={(id) => handleMoveComponent(id, 'down')}
            disableDelete={course?.hasBeenPublished}
          />
        </Box>
      )}

      {/* Component Form Dialog */}
      {openAddDialog && selectedType && (
        <>
          {(selectedType === 'PRE_ASSESSMENT' || selectedType === 'POST_ASSESSMENT') && (
            <AssessmentForm
              open={openAddDialog}
              onClose={handleCloseDialog}
              onSave={handleSaveComponent}
              component={editingComponent}
              type={selectedType}
            />
          )}
          {selectedType === 'MATERIAL' && (
            <MaterialForm
              open={openAddDialog}
              onClose={handleCloseDialog}
              onSave={handleSaveComponent}
              component={editingComponent}
              type={selectedType}
            />
          )}
        </>
      )}
    </Box>
  );
};

export default CourseBuilder;