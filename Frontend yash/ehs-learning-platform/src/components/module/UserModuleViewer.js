// src/components/module/UserModuleViewer.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container, Paper, Typography, Box, Button, Stepper, Step, StepLabel,
  LinearProgress, Alert, CircularProgress, Divider
} from '@mui/material';
import { ArrowBack, ArrowForward, CheckCircle } from '@mui/icons-material';
import { moduleService, progressService } from '../../services/api';
import AssessmentViewer from './AssessmentViewer';
import LearningMaterialsViewer from './LearningMaterialsViewer';

const UserModuleViewer = () => {
  const { moduleId } = useParams();
  const navigate = useNavigate();
  
  // State variables
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [module, setModule] = useState(null);
  const [components, setComponents] = useState([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState({});
  
  // Fetch module data
  useEffect(() => {
    const fetchModuleData = async () => {
      try {
        setLoading(true);
        // Get module details
        const moduleResponse = await moduleService.getById(moduleId);
        setModule(moduleResponse.data);
        
        // Get components
        const componentsResponse = await moduleService.getComponents(moduleId);
        setComponents(componentsResponse.data);
        
        // Get user progress
        const progressResponse = await progressService.getUserModuleProgress(null, moduleId);
        setProgress(progressResponse.data);
        
        // Start module if not already started
        if (progressResponse.data.state === 'NOT_STARTED') {
          await progressService.startModule(moduleId);
        }
        
        // Set current step based on progress
        if (progressResponse.data.currentComponentIndex) {
          setCurrentStep(progressResponse.data.currentComponentIndex);
        }
      } catch (err) {
        console.error('Error loading module:', err);
        setError('Failed to load module data. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchModuleData();
  }, [moduleId]);
  
  // Component completion handler
  const handleComponentComplete = async (componentId, data = {}) => {
    try {
      await progressService.completeComponent(moduleId, componentId, data);
      // Update progress state
      setProgress(prev => ({
        ...prev,
        componentProgress: {
          ...prev.componentProgress,
          [componentId]: { completed: true, ...data }
        }
      }));
      // Move to next step
      handleNext();
    } catch (err) {
      console.error('Error completing component:', err);
      setError('Failed to save progress. Please try again.');
    }
  };
  
  // Navigation handlers
  const handleNext = () => {
    if (currentStep < components.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };
  
  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };
  
  // Render active component based on type
  const renderComponent = () => {
    if (!components || components.length === 0) return null;
    
    const component = components[currentStep];
    const isCompleted = progress?.componentProgress?.[component.id]?.completed;
    
    switch (component.type) {
      case 'PRE_ASSESSMENT':
      case 'POST_ASSESSMENT':
        return (
          <AssessmentViewer 
            componentId={component.id}
            isCompleted={isCompleted}
            onComplete={handleComponentComplete}
          />
        );
      case 'LEARNING_MATERIAL':
        return (
          <LearningMaterialsViewer 
            componentId={component.id}
            isCompleted={isCompleted}
            onComplete={handleComponentComplete}
          />
        );
      default:
        return <Typography>Unsupported component type: {component.type}</Typography>;
    }
  };
  
  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Box display="flex" justifyContent="center" my={4}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }
  
  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
        <Button onClick={() => navigate('/my-courses')} sx={{ mt: 2 }}>
          Back to Courses
        </Button>
      </Container>
    );
  }
  
  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Button 
        startIcon={<ArrowBack />} 
        onClick={() => navigate('/my-courses')}
        sx={{ mb: 2 }}
      >
        Back to Courses
      </Button>
      
      <Paper sx={{ p: 3 }}>
        {/* Module title and info */}
        <Typography variant="h4" gutterBottom>{module?.title}</Typography>
        <Typography color="textSecondary" paragraph>{module?.description}</Typography>
        
        {/* Progress bar */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="body2" gutterBottom>
            Overall Progress
          </Typography>
          <LinearProgress 
            variant="determinate" 
            value={calculateProgress()} 
            sx={{ height: 10, borderRadius: 5 }}
          />
        </Box>
        
        <Divider sx={{ mb: 3 }} />
        
        {/* Component stepper */}
        <Stepper activeStep={currentStep} alternativeLabel sx={{ mb: 4 }}>
          {components.map((component, index) => (
            <Step 
              key={component.id} 
              completed={progress?.componentProgress?.[component.id]?.completed}
            >
              <StepLabel>{component.title}</StepLabel>
            </Step>
          ))}
        </Stepper>
        
        {/* Render current component */}
        <Box sx={{ minHeight: '300px' }}>
          {renderComponent()}
        </Box>
        
        {/* Navigation buttons */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
          <Button 
            variant="outlined"
            startIcon={<ArrowBack />}
            onClick={handlePrevious}
            disabled={currentStep === 0}
          >
            Previous
          </Button>
          
          <Button 
            variant="contained"
            endIcon={<ArrowForward />}
            onClick={handleNext}
            disabled={
              currentStep === components.length - 1 ||
              (components[currentStep]?.requiredToAdvance && 
               !progress?.componentProgress?.[components[currentStep].id]?.completed)
            }
          >
            Next
          </Button>
        </Box>
      </Paper>
    </Container>
  );
  
  // Helper function to calculate overall progress percentage
  function calculateProgress() {
    if (!components || components.length === 0) return 0;
    
    const completedCount = components.filter(comp => 
      progress?.componentProgress?.[comp.id]?.completed
    ).length;
    
    return (completedCount / components.length) * 100;
  }
};

export default UserModuleViewer;