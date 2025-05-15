// src/components/module/UserModuleViewer.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container, Paper, Typography, Box, Button, Stepper, Step, StepLabel,
  LinearProgress, Alert, CircularProgress, Divider, Chip
} from '@mui/material';
import {
  ArrowBack, ArrowForward, CheckCircle, Assignment, Book,
  Timer, Domain, PlayArrow
} from '@mui/icons-material';
import { moduleService, progressService, componentService } from '../../services/api';
import AssessmentViewer from './AssessmentViewer';
import SimpleLearningMaterialsViewer from './SimpleLearningMaterialsViewer';

const UserModuleViewer = () => {
  const { moduleId } = useParams();
  const navigate = useNavigate();
  
  // Module and loading states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [module, setModule] = useState(null);
  const [components, setComponents] = useState([]);
  
  // Navigation and progress states
  const [currentStep, setCurrentStep] = useState(0);
  const [componentProgress, setComponentProgress] = useState({});
  const [overallProgress, setOverallProgress] = useState(0);
  
  // Active component states
  const [activeComponent, setActiveComponent] = useState(null);
  const [componentLoading, setComponentLoading] = useState(false);
  const [componentError, setComponentError] = useState(null);
  
  // Fetch module data and progress on mount
  useEffect(() => {
    const fetchModuleData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log(`Fetching module data for moduleId: ${moduleId}`);
        
        // Get module details
        const moduleResponse = await moduleService.getById(moduleId);
        const moduleData = moduleResponse.data.module || moduleResponse.data;
        console.log('Module data:', moduleData);
        
        // Get module components
        const componentsResponse = await componentService.getByModule(moduleId);
        const componentsData = componentsResponse.data;
        console.log('Components data:', componentsData);
        
        // Get user progress for this module
        const progressResponse = await progressService.getUserModuleProgress(null, moduleId);
        const progressData = progressResponse.data;
        console.log('Progress data:', progressData);
        
        // Set data
        setModule(moduleData);
        setComponents(componentsData);
        
        // Initialize progress map
        const progressMap = {};
        if (progressData.componentProgress) {
          progressData.componentProgress.forEach(comp => {
            progressMap[comp.componentId] = {
              completed: comp.completed || false,
              score: comp.score
            };
          });
        }
        setComponentProgress(progressMap);
        
        // Calculate overall progress
        const completedCount = Object.values(progressMap).filter(p => p.completed).length;
        const progressPercentage = componentsData.length > 0 
          ? (completedCount / componentsData.length) * 100 
          : 0;
        setOverallProgress(progressPercentage);
        
        // Set current step (find first incomplete component)
        let initialStep = 0;
        if (progressData.currentComponent) {
          const currentIndex = componentsData.findIndex(c => c.id === progressData.currentComponent.id);
          if (currentIndex !== -1) {
            initialStep = currentIndex;
          }
        } else {
          // Find first incomplete component
          const firstIncompleteIndex = componentsData.findIndex(
            comp => !progressMap[comp.id]?.completed
          );
          initialStep = firstIncompleteIndex !== -1 ? firstIncompleteIndex : 0;
        }
        setCurrentStep(initialStep);
        
        // Start module if not already started
        if (progressData.state === 'NOT_STARTED') {
          await progressService.startModule(moduleId);
        }
      } catch (err) {
        console.error('Error fetching module data:', err);
        setError('Failed to load module data. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchModuleData();
  }, [moduleId]);
  
  // Load active component when currentStep changes
  useEffect(() => {
    const loadComponent = async () => {
      if (!components || components.length === 0 || currentStep >= components.length) {
        return;
      }
      
      const component = components[currentStep];
      console.log(`Loading component: ${component.id} (${component.type})`);
      
      setComponentLoading(true);
      setComponentError(null);
      
      try {
        // Add any additional component data needed
        let enhancedComponent = { ...component };
        
        // For assessments, fetch questions if not completed
        if (isAssessment(component.type) && !componentProgress[component.id]?.completed) {
          try {
            const questionsResponse = await moduleService.getComponentQuestions(component.id);
            enhancedComponent.questions = questionsResponse.data;
          } catch (err) {
            console.error('Error loading assessment questions:', err);
            setComponentError('Could not load assessment questions');
          }
        }
        
        setActiveComponent(enhancedComponent);
      } catch (err) {
        console.error('Error loading component:', err);
        setComponentError('Failed to load component content');
      } finally {
        setComponentLoading(false);
      }
    };
    
    loadComponent();
  }, [components, currentStep, componentProgress]);
  
  // Helper function to check if component is assessment type
  const isAssessment = (type) => {
    return type === 'PRE_ASSESSMENT' || type === 'POST_ASSESSMENT';
  };
  
  // Navigation handlers
  const handleBack = () => navigate('/my-courses');
  
  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };
  
  const handleNext = () => {
    if (currentStep < components.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };
  
  const handleStepClick = (index) => {
    // Only allow clicking completed steps or the next available step
    const isCompleted = componentProgress[components[index].id]?.completed;
    const isNextAvailable = index === 0 || componentProgress[components[index - 1].id]?.completed;
    
    if (isCompleted || isNextAvailable) {
      setCurrentStep(index);
    }
  };
  
  // Component completion handler
  const handleComponentComplete = async (componentId, data = {}) => {
    console.log(`Completing component ${componentId} with data:`, data);
    
    try {
      // Call API to complete component
      await progressService.completeComponent(moduleId, componentId, data);
      
      // Update local progress state
      setComponentProgress(prev => ({
        ...prev,
        [componentId]: {
          completed: true,
          ...data
        }
      }));
      
      // Update overall progress
      const newCompletedCount = Object.keys(componentProgress).filter(
        id => id === componentId || componentProgress[id]?.completed
      ).length;
      
      const newProgress = components.length > 0 
        ? (newCompletedCount / components.length) * 100 
        : 0;
      
      setOverallProgress(newProgress);
      
      // Move to next step if available
      if (currentStep < components.length - 1) {
        handleNext();
      } else {
        // We're on the last component - show completion
        console.log('Module completed!');
      }
    } catch (err) {
      console.error('Error completing component:', err);
      setComponentError('Failed to save progress. Please try again.');
    }
  };
  
  // Render loading, error states
  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" my={4}>
          <CircularProgress />
          <Typography variant="h6" sx={{ ml: 2 }}>Loading module...</Typography>
        </Box>
      </Container>
    );
  }
  
  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert 
          severity="error" 
          action={<Button color="inherit" size="small" onClick={handleBack}>Go Back</Button>}
          sx={{ mb: 2 }}
        >
          {error}
        </Alert>
      </Container>
    );
  }
  
  // Render module viewer
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Button 
        variant="text" 
        startIcon={<ArrowBack />} 
        onClick={handleBack}
        sx={{ mb: 2 }}
      >
        Back to Courses
      </Button>
      
      <Paper elevation={3} sx={{ p: 3 }}>
        {/* Module header */}
        <Typography variant="h4" gutterBottom>{module?.title}</Typography>
        <Typography variant="body1" color="text.secondary" paragraph>{module?.description}</Typography>
        
        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
          {module?.domain?.name && (
            <Chip icon={<Domain />} label={module.domain.name} size="small" />
          )}
          {module?.estimatedDuration && (
            <Chip icon={<Timer />} label={`${module.estimatedDuration} min`} size="small" />
          )}
        </Box>
        
        <Divider sx={{ my: 2 }} />
        
        {/* Progress bar */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="body2" gutterBottom>
            Overall Progress: {Math.round(overallProgress)}%
          </Typography>
          <LinearProgress 
            variant="determinate" 
            value={overallProgress} 
            sx={{ height: 10, borderRadius: 5 }} 
          />
        </Box>
        
        {/* Component stepper */}
        <Stepper 
          activeStep={currentStep} 
          alternativeLabel 
          sx={{ mb: 4 }}
          nonLinear
        >
          {components.map((component, index) => {
            const isStepCompleted = componentProgress[component.id]?.completed;
            let icon;
            
            if (isStepCompleted) {
              icon = <CheckCircle />;
            } else if (isAssessment(component.type)) {
              icon = <Assignment />;
            } else {
              icon = <Book />;
            }
            
            return (
              <Step 
                key={component.id} 
                completed={isStepCompleted}
                onClick={() => handleStepClick(index)}
                sx={{ cursor: 'pointer' }}
              >
                <StepLabel StepIconComponent={() => icon}>
                  {component.title}
                </StepLabel>
              </Step>
            );
          })}
        </Stepper>
        
        {/* Active component content */}
        <Paper variant="outlined" sx={{ p: 3, minHeight: '300px', position: 'relative' }}>
          {/* Loading overlay */}
          {componentLoading && (
            <Box 
              sx={{ 
                position: 'absolute', 
                top: 0, 
                left: 0, 
                right: 0, 
                bottom: 0, 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center',
                backgroundColor: 'rgba(255, 255, 255, 0.7)',
                zIndex: 10
              }}
            >
              <CircularProgress />
            </Box>
          )}
          
          {/* Error message */}
          {componentError && (
            <Alert 
              severity="error" 
              onClose={() => setComponentError(null)}
              sx={{ mb: 2 }}
            >
              {componentError}
            </Alert>
          )}
          
          {/* Render appropriate component viewer */}
          {activeComponent && (
            <>
              {isAssessment(activeComponent.type) ? (
                <AssessmentViewer 
                  componentId={activeComponent.id}
                  isCompleted={componentProgress[activeComponent.id]?.completed}
                  questions={activeComponent.questions}
                  onComplete={handleComponentComplete}
                />
              ) : (
                <SimpleLearningMaterialsViewer 
                  componentId={activeComponent.id}
                  isCompleted={componentProgress[activeComponent.id]?.completed}
                  onComplete={handleComponentComplete}
                />
              )}
            </>
          )}
        </Paper>
        
        {/* Navigation buttons */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
          <Button 
            variant="outlined"
            startIcon={<ArrowBack />}
            onClick={handlePrevious}
            disabled={currentStep === 0 || componentLoading}
          >
            Previous
          </Button>
          
          <Button 
            variant="contained"
            endIcon={<ArrowForward />}
            onClick={handleNext}
            disabled={
              currentStep >= components.length - 1 || // At last step
              componentLoading || // Component is loading
              (!componentProgress[components[currentStep]?.id]?.completed && // Current step not completed
               components[currentStep]?.requiredToAdvance !== false) // And it's required to advance
            }
          >
            Next
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default UserModuleViewer;