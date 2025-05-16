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
  Chip
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

const CourseBuilder = ({ courseId, onUpdate }) => {
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
    if (!window.confirm('Are you sure you want to delete this component?')) {
      return;
    }

    try {
      await api.delete(`/v2/admin/courses/${courseId}/components/${componentId}`);
      fetchComponents();
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Error deleting component:', error);
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
    <Box sx={{ mt: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Course Components</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            startIcon={<AddIcon />}
            variant="outlined"
            size="small"
            onClick={() => handleAddComponent('PRE_ASSESSMENT')}
          >
            Pre-Assessment
          </Button>
          <Button
            startIcon={<AddIcon />}
            variant="outlined"
            size="small"
            onClick={() => handleAddComponent('POST_ASSESSMENT')}
          >
            Post-Assessment
          </Button>
        </Box>
      </Box>

      {components.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="body1" color="textSecondary">
            No components added yet. Add your first component to get started.
          </Typography>
        </Paper>
      ) : (
        <ComponentList
          components={components}
          onEdit={handleEditComponent}
          onDelete={handleDeleteComponent}
          onMoveUp={(id) => handleMoveComponent(id, 'up')}
          onMoveDown={(id) => handleMoveComponent(id, 'down')}
        />
      )}

      {/* Component Form Dialog */}
      {openAddDialog && selectedType && (
        <AssessmentForm
          open={openAddDialog}
          onClose={handleCloseDialog}
          onSave={handleSaveComponent}
          component={editingComponent}
          type={selectedType}
        />
      )}
    </Box>
  );
};

export default CourseBuilder;