// src/pages/LearningMaterialsPage.js
import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Tabs,
  Tab,
  Button,
  Divider,
  CircularProgress,
  Alert,
  Dialog,
  DialogContent,
  IconButton
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { learningMaterialService, moduleService, componentService } from '../services/api';
import LearningMaterialViewer from '../components/learning/LearningMaterialViewer';
import LearningMaterialGrid from '../components/learning/LearningMaterialGrid';

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`material-tabpanel-${index}`}
      aria-labelledby={`material-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ pt: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const LearningMaterialsPage = () => {
  const navigate = useNavigate();
  const { moduleId, componentId } = useParams();
  
  // State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [moduleData, setModuleData] = useState(null);
  const [components, setComponents] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [tabValue, setTabValue] = useState(0);
  
  // Viewer dialog state
  const [viewerOpen, setViewerOpen] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  
  // Fetch module data and components
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch module data if moduleId is provided
        if (moduleId) {
          const moduleResponse = await moduleService.getById(moduleId);
          setModuleData(moduleResponse.data);
          
          // Get all learning material components from this module
          const componentsResponse = await componentService.getByModule(moduleId);
          const learningComponents = componentsResponse.data.filter(
            comp => comp.type === 'LEARNING_MATERIALS' || comp.type === 'LEARNING_MATERIAL'
          );
          setComponents(learningComponents);
          
          // If there are components, fetch materials for the first one by default
          if (learningComponents.length > 0) {
            const selectedComponentId = componentId || learningComponents[0].id;
            await fetchMaterials(selectedComponentId);
            
            // Set initial tab value based on selected component
            if (componentId) {
              const index = learningComponents.findIndex(comp => comp.id === componentId);
              if (index !== -1) {
                setTabValue(index);
              }
            }
          }
        } 
        // If no moduleId, we're showing all learning materials for the user
        else {
          // This would be a union of materials from all modules in a real implementation
          // Here we're just using mock data
          setMaterials([
            { 
              id: 'm1', 
              title: 'Fire Safety PDF Guide', 
              description: 'Comprehensive guide for fire safety procedures', 
              fileType: 'PDF',
              estimatedDuration: 15,
              sequenceOrder: 1,
              progress: 100,
              completed: true
            },
            { 
              id: 'm2', 
              title: 'Chemical Handling Video', 
              description: 'Video demonstrating proper chemical handling procedures', 
              fileType: 'VIDEO',
              estimatedDuration: 8,
              sequenceOrder: 2,
              progress: 75,
              completed: false
            },
            { 
              id: 'm3', 
              title: 'First Aid Instructions', 
              description: 'Basic first aid procedures and techniques', 
              fileType: 'HTML',
              estimatedDuration: 10,
              sequenceOrder: 3,
              progress: 50,
              completed: false
            },
            { 
              id: 'm4', 
              title: 'Emergency Response Slides', 
              description: 'Presentation slides for emergency response protocols', 
              fileType: 'PRESENTATION',
              estimatedDuration: 12,
              sequenceOrder: 4,
              progress: 25,
              completed: false
            }
          ]);
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load learning materials. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [moduleId, componentId]);
  
  // Fetch materials for a component
  const fetchMaterials = async (componentId) => {
    try {
      // Use progress API to get materials with progress information
      const response = await learningMaterialService.getMaterialsWithProgress(componentId);
      setMaterials(response.data);
    } catch (err) {
      console.error('Error fetching materials:', err);
      setError('Failed to load learning materials');
      setMaterials([]);
    }
  };
  
  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    
    // Load materials for selected component
    if (components[newValue]) {
      fetchMaterials(components[newValue].id);
    }
  };
  
  // Open material viewer
  const handleViewMaterial = (material) => {
    setSelectedMaterial(material);
    setViewerOpen(true);
  };
  
  // Close material viewer
  const handleCloseViewer = () => {
    setViewerOpen(false);
    setSelectedMaterial(null);
  };
  
  // Refresh material progress after completion
  const handleMaterialComplete = async () => {
    // Refresh the current component's materials
    if (components[tabValue]) {
      await fetchMaterials(components[tabValue].id);
    }
    setViewerOpen(false);
  };
  
  // Handle back navigation
  const handleBack = () => {
    if (moduleId) {
      navigate(`/modules/${moduleId}`);
    } else {
      navigate('/my-courses');
    }
  };
  
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Back button and page title */}
      <Box display="flex" alignItems="center" mb={3}>
        <Button
          variant="text"
          startIcon={<ArrowBackIcon />}
          onClick={handleBack}
        >
          Back
        </Button>
        <Typography variant="h4" ml={2}>
          {moduleData ? `${moduleData.title} - Learning Materials` : 'All Learning Materials'}
        </Typography>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
          <CircularProgress />
        </Box>
      ) : (
        <Paper elevation={2} sx={{ p: 3 }}>
          {/* Tabs for module components (if viewing a module) */}
          {moduleId && components.length > 0 && (
            <>
              <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs
                  value={tabValue}
                  onChange={handleTabChange}
                  variant="scrollable"
                  scrollButtons="auto"
                  aria-label="learning components tabs"
                >
                  {components.map((component) => (
                    <Tab 
                      key={component.id} 
                      label={component.title} 
                    />
                  ))}
                </Tabs>
              </Box>
              
              {components.map((component, index) => (
                <TabPanel key={component.id} value={tabValue} index={index}>
                  <Typography variant="h6" gutterBottom>
                    {component.description || 'Browse through learning materials'}
                  </Typography>
                  
                  <LearningMaterialGrid
                    materials={materials}
                    loading={loading}
                    error={null}
                    onViewMaterial={handleViewMaterial}
                  />
                </TabPanel>
              ))}
            </>
          )}
          
          {/* All materials view (if not viewing a specific module) */}
          {!moduleId && (
            <LearningMaterialGrid
              materials={materials}
              loading={loading}
              error={null}
              onViewMaterial={handleViewMaterial}
            />
          )}
        </Paper>
      )}
      
      {/* Material Viewer Dialog */}
      <Dialog 
        open={viewerOpen} 
        onClose={handleCloseViewer}
        fullWidth
        maxWidth="lg"
      >
        <Box display="flex" justifyContent="flex-end" p={1}>
          <IconButton onClick={handleCloseViewer}>
            <CloseIcon />
          </IconButton>
        </Box>
        <DialogContent sx={{ p: 2 }}>
          {selectedMaterial && (
            <LearningMaterialViewer
              initialMaterials={[selectedMaterial]}
              onComplete={handleMaterialComplete}
              onBack={handleCloseViewer}
            />
          )}
        </DialogContent>
      </Dialog>
    </Container>
  );
};

export default LearningMaterialsPage;