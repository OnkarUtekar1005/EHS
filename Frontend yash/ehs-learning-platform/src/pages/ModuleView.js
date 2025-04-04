// src/pages/ModuleView.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Stepper,
  Step,
  StepLabel,
  StepButton,
  LinearProgress,
  Card,
  CardContent,
  Divider,
  Alert,
  CircularProgress,
  Grid,
  FormControl,
  FormControlLabel,
  Radio,
  RadioGroup,
  FormLabel,
  Chip
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  ArrowForward as ArrowForwardIcon,
  CheckCircle as CheckCircleIcon,
  PlayArrow as PlayArrowIcon,
  Assignment as AssignmentIcon,
  Book as BookIcon,
  Done as DoneIcon
} from '@mui/icons-material';
import { moduleService, progressService, assessmentService } from '../services/api';

const ModuleView = () => {
  const { moduleId } = useParams();
  const navigate = useNavigate();
  
  // Module state
  const [moduleData, setModuleData] = useState(null);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Component state
  const [activeComponent, setActiveComponent] = useState(null);
  const [componentLoading, setComponentLoading] = useState(false);
  const [componentError, setComponentError] = useState(null);
  
  // Assessment state
  const [assessmentAnswers, setAssessmentAnswers] = useState({});
  const [assessmentComplete, setAssessmentComplete] = useState(false);
  const [assessmentScore, setAssessmentScore] = useState(null);
  const [assessmentFeedback, setAssessmentFeedback] = useState(null);
  
  // Fetch module data and user progress
  useEffect(() => {
    const fetchModuleData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch module data
        const moduleResponse = await moduleService.getById(moduleId);
        const moduleData = moduleResponse.data;
        
        // Fetch user progress for this module
        const progressResponse = await progressService.getModuleProgress(moduleId);
        const progressData = progressResponse.data;
        
        // Calculate progress percentage
        const completedComponents = progressData.componentProgress?.filter(c => c.completed) || [];
        const progressPercentage = moduleData.components?.length > 0 
          ? (completedComponents.length / moduleData.components.length) * 100 
          : 0;
        
        // Set current step based on progress
        let currentCompIndex = 0;
        if (progressData.currentComponent) {
          currentCompIndex = moduleData.components.findIndex(c => 
            c.id === progressData.currentComponent.id
          );
          if (currentCompIndex === -1) currentCompIndex = 0;
        }
        
        setModuleData(moduleData);
        setProgress(progressPercentage);
        setCurrentStep(currentCompIndex);
        
        // If user hasn't started this module yet, start it
        if (progressData.state === 'NOT_STARTED') {
          await progressService.startModule(moduleId);
        }
      } catch (err) {
        console.error('Error fetching module data:', err);
        setError('Failed to load module. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchModuleData();
  }, [moduleId]);
  
  // Load component when current step changes
  useEffect(() => {
    if (!moduleData || !moduleData.components || moduleData.components.length === 0) return;
    
    const loadComponent = async () => {
      try {
        setComponentLoading(true);
        setComponentError(null);
        
        // Get the component at current step
        const component = moduleData.components[currentStep];
        
        // If it's an assessment, load questions
        if (component.type === 'PRE_ASSESSMENT' || component.type === 'POST_ASSESSMENT') {
          try {
            const assessmentResponse = await assessmentService.getQuestions(component.id);
            const assessmentData = {
              ...component,
              questions: assessmentResponse.data
            };
            setActiveComponent(assessmentData);
            
            // Reset assessment state
            setAssessmentAnswers({});
            setAssessmentComplete(false);
            setAssessmentScore(null);
            setAssessmentFeedback(null);
          } catch (err) {
            console.error('Error loading assessment questions:', err);
            setComponentError('Failed to load assessment questions.');
          }
        } else {
          // For other component types
          setActiveComponent(component);
        }
      } catch (err) {
        console.error('Error loading component:', err);
        setComponentError('Failed to load component. Please try again.');
      } finally {
        setComponentLoading(false);
      }
    };
    
    loadComponent();
  }, [moduleData, currentStep]);
  
  // Handle step change
  const handleStepChange = (step) => {
    // Check if the step is accessible
    // For example, don't allow skipping to post-assessment if pre-assessment not completed
    if (step > currentStep && moduleData.components[step].type === 'POST_ASSESSMENT') {
      // Check if all previous components are completed
      const isPreAssessmentCompleted = moduleData.components
        .filter(c => c.type === 'PRE_ASSESSMENT')
        .every(c => isComponentCompleted(c.id));
        
      const isLearningMaterialCompleted = moduleData.components
        .filter(c => c.type === 'LEARNING_MATERIALS' || c.type === 'VIDEO' || c.type === 'PRESENTATION')
        .every(c => isComponentCompleted(c.id));
        
      if (!isPreAssessmentCompleted || !isLearningMaterialCompleted) {
        alert('Please complete all prior components before taking the post-assessment.');
        return;
      }
    }
    
    setCurrentStep(step);
  };
  
  // Check if a component is completed
  const isComponentCompleted = (componentId) => {
    if (!moduleData || !moduleData.progress || !moduleData.progress.componentProgress) return false;
    
    return moduleData.progress.componentProgress.some(c => 
      c.componentId === componentId && c.completed
    );
  };
  
  // Handle next/previous component
  const handleNext = () => {
    if (currentStep < moduleData.components.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };
  
  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };
  
  // Handle assessment answer change
  const handleAnswerChange = (questionId, value) => {
    setAssessmentAnswers({
      ...assessmentAnswers,
      [questionId]: value
    });
  };
  
  // Submit assessment
  const handleSubmitAssessment = async () => {
    if (!activeComponent || !activeComponent.questions) return;
    
    // Check if all questions are answered
    const allAnswered = activeComponent.questions.every(q => 
      assessmentAnswers[q.id] !== undefined
    );
    
    if (!allAnswered) {
      alert('Please answer all questions before submitting.');
      return;
    }
    
    try {
      setComponentLoading(true);
      
      // Format answers for submission
      const formattedAnswers = Object.entries(assessmentAnswers).map(([questionId, answerId]) => ({
        questionId,
        answerId
      }));
      
      // Submit answers
      const response = await assessmentService.submitAnswers(activeComponent.id, formattedAnswers);
      const result = response.data;
      
      setAssessmentComplete(true);
      setAssessmentScore(result.score);
      setAssessmentFeedback(result.feedback);
      
      // Mark component as completed
      await progressService.completeComponent(moduleId, activeComponent.id, {
        score: result.score
      });
      
      // If this was the last component, show completion message or navigate
      if (currentStep === moduleData.components.length - 1) {
        // Handle module completion
      }
    } catch (err) {
      console.error('Error submitting assessment:', err);
      setComponentError('Failed to submit assessment. Please try again.');
    } finally {
      setComponentLoading(false);
    }
  };
  
  // Mark learning material as completed
  const handleCompleteLearningMaterial = async () => {
    try {
      setComponentLoading(true);
      
      // Mark component as completed
      await progressService.completeComponent(moduleId, activeComponent.id);
      
      // Move to next component
      handleNext();
    } catch (err) {
      console.error('Error marking component as completed:', err);
      setComponentError('Failed to mark as completed. Please try again.');
    } finally {
      setComponentLoading(false);
    }
  };
  
  // Go back to domain or course list
  const handleBackToCourses = () => {
    navigate('/my-courses');
  };
  
  // Render loading state
  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
          <CircularProgress />
        </Box>
      </Container>
    );
  }
  
  // Render error state
  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error">{error}</Alert>
        <Button 
          variant="outlined" 
          onClick={handleBackToCourses}
          startIcon={<ArrowBackIcon />}
          sx={{ mt: 2 }}
        >
          Back to Courses
        </Button>
      </Container>
    );
  }
  
  // If no module data
  if (!moduleData) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="info">Module not found or not available.</Alert>
        <Button 
          variant="outlined" 
          onClick={handleBackToCourses}
          startIcon={<ArrowBackIcon />}
          sx={{ mt: 2 }}
        >
          Back to Courses
        </Button>
      </Container>
    );
  }
  
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Back button and title */}
      <Box display="flex" alignItems="center" mb={3}>
        <Button 
          variant="text"
          onClick={handleBackToCourses}
          startIcon={<ArrowBackIcon />}
        >
          Back to Courses
        </Button>
        <Typography variant="h4" sx={{ ml: 2 }}>
          {moduleData.title}
        </Typography>
      </Box>
      
      {/* Module progress bar */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom>
          Module Progress
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Box sx={{ width: '100%', mr: 1 }}>
            <LinearProgress 
              variant="determinate" 
              value={progress} 
              sx={{ height: 10, borderRadius: 5 }}
            />
          </Box>
          <Box sx={{ minWidth: 35 }}>
            <Typography variant="body2" color="text.secondary">
              {Math.round(progress)}%
            </Typography>
          </Box>
        </Box>
      </Paper>
      
      {/* Module components stepper */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Stepper 
          activeStep={currentStep}
          alternativeLabel
          nonLinear
        >
          {moduleData.components.map((component, index) => {
            const isCompleted = isComponentCompleted(component.id);
            const stepProps = {};
            const labelProps = {};
            
            // Get icon based on component type
            let StepIcon;
            switch (component.type) {
              case 'PRE_ASSESSMENT':
              case 'POST_ASSESSMENT':
                StepIcon = AssignmentIcon;
                break;
              case 'LEARNING_MATERIALS':
                StepIcon = BookIcon;
                break;
              case 'VIDEO':
                StepIcon = PlayArrowIcon;
                break;
              default:
                StepIcon = null;
            }
            
            return (
              <Step key={component.id} {...stepProps} completed={isCompleted}>
                <StepButton onClick={() => handleStepChange(index)}>
                  <StepLabel 
                    {...labelProps} 
                    StepIconComponent={isCompleted ? CheckCircleIcon : StepIcon}
                  >
                    {component.title || getComponentTypeLabel(component.type)}
                  </StepLabel>
                </StepButton>
              </Step>
            );
          })}
        </Stepper>
      </Paper>
      
      {/* Component content */}
      <Paper sx={{ p: 3 }}>
        {componentLoading ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
            <CircularProgress />
          </Box>
        ) : componentError ? (
          <Alert severity="error">{componentError}</Alert>
        ) : activeComponent ? (
          <>
            <Box mb={3}>
              <Typography variant="h5" gutterBottom>
                {activeComponent.title || getComponentTypeLabel(activeComponent.type)}
              </Typography>
              {activeComponent.description && (
                <Typography variant="body1" color="textSecondary">
                  {activeComponent.description}
                </Typography>
              )}
              
              {(activeComponent.type === 'PRE_ASSESSMENT' || activeComponent.type === 'POST_ASSESSMENT') && (
                <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
                  {activeComponent.timeLimit && (
                    <Chip 
                      label={`Time Limit: ${activeComponent.timeLimit} min`}
                      color="primary"
                      variant="outlined"
                    />
                  )}
                  {activeComponent.passingScore && (
                    <Chip 
                      label={`Passing Score: ${activeComponent.passingScore}%`}
                      color="primary"
                      variant="outlined"
                    />
                  )}
                </Box>
              )}
            </Box>
            
            <Divider sx={{ mb: 3 }} />
            
            {/* Assessment content */}
            {(activeComponent.type === 'PRE_ASSESSMENT' || activeComponent.type === 'POST_ASSESSMENT') && (
              assessmentComplete ? (
                <Box>
                  <Alert 
                    severity={assessmentScore >= (activeComponent.passingScore || 70) ? "success" : "warning"}
                    sx={{ mb: 3 }}
                  >
                    <Typography variant="h6">
                      Assessment Score: {assessmentScore}%
                    </Typography>
                    <Typography variant="body1">
                      {assessmentScore >= (activeComponent.passingScore || 70) 
                        ? 'Congratulations! You have passed this assessment.' 
                        : 'You did not meet the passing score. Review the material and try again.'}
                    </Typography>
                  </Alert>
                  
                  {assessmentFeedback && (
                    <Box mt={3}>
                      <Typography variant="h6" gutterBottom>Feedback</Typography>
                      <Typography variant="body1">{assessmentFeedback}</Typography>
                    </Box>
                  )}
                  
                  <Box mt={3} display="flex" justifyContent="space-between">
                    <Button
                      variant="outlined"
                      onClick={handlePrevious}
                      startIcon={<ArrowBackIcon />}
                      disabled={currentStep === 0}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="contained"
                      onClick={handleNext}
                      endIcon={<ArrowForwardIcon />}
                      disabled={currentStep === moduleData.components.length - 1}
                    >
                      Next
                    </Button>
                  </Box>
                </Box>
              ) : (
                <Box>
                  {activeComponent.questions && activeComponent.questions.map((question, qIndex) => (
                    <Card key={question.id} variant="outlined" sx={{ mb: 3 }}>
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          {qIndex + 1}. {question.text}
                        </Typography>
                        
                        <FormControl component="fieldset" sx={{ width: '100%' }}>
                          <RadioGroup
                            value={assessmentAnswers[question.id] || ''}
                            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                          >
                            {question.options.map((option) => (
                              <FormControlLabel
                                key={option.id}
                                value={option.id}
                                control={<Radio />}
                                label={option.text}
                              />
                            ))}
                          </RadioGroup>
                        </FormControl>
                      </CardContent>
                    </Card>
                  ))}
                  
                  <Box mt={3} display="flex" justifyContent="space-between">
                    <Button
                      variant="outlined"
                      onClick={handlePrevious}
                      startIcon={<ArrowBackIcon />}
                      disabled={currentStep === 0}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="contained"
                      onClick={handleSubmitAssessment}
                      disabled={componentLoading}
                    >
                      {componentLoading ? <CircularProgress size={24} /> : 'Submit Assessment'}
                    </Button>
                  </Box>
                </Box>
              )
            )}
            
            {/* Learning material content */}
            {activeComponent.type === 'LEARNING_MATERIALS' && (
              <Box>
                <Box dangerouslySetInnerHTML={{ __html: activeComponent.content || '<p>No content available for this learning material.</p>' }} />
                
                <Box mt={3} display="flex" justifyContent="space-between">
                  <Button
                    variant="outlined"
                    onClick={handlePrevious}
                    startIcon={<ArrowBackIcon />}
                    disabled={currentStep === 0}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="contained"
                    onClick={handleCompleteLearningMaterial}
                    endIcon={<DoneIcon />}
                    disabled={componentLoading}
                  >
                    {componentLoading ? <CircularProgress size={24} /> : 'Mark as Completed'}
                  </Button>
                </Box>
              </Box>
            )}
            
            {/* Video content */}
            {activeComponent.type === 'VIDEO' && (
              <Box>
                {activeComponent.videoUrl ? (
                  <Box sx={{ position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden', maxWidth: '100%', mb: 3 }}>
                    <iframe
                      src={activeComponent.videoUrl}
                      style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      title={activeComponent.title}
                    />
                  </Box>
                ) : (
                  <Alert severity="info" sx={{ mb: 3 }}>
                    No video available for this component.
                  </Alert>
                )}
                
                <Box mt={3} display="flex" justifyContent="space-between">
                  <Button
                    variant="outlined"
                    onClick={handlePrevious}
                    startIcon={<ArrowBackIcon />}
                    disabled={currentStep === 0}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="contained"
                    onClick={handleCompleteLearningMaterial}
                    endIcon={<DoneIcon />}
                    disabled={componentLoading}
                  >
                    {componentLoading ? <CircularProgress size={24} /> : 'Mark as Completed'}
                  </Button>
                </Box>
              </Box>
            )}
          </>
        ) : (
          <Typography>No component selected.</Typography>
        )}
      </Paper>
    </Container>
  );
};

// Helper function to get readable label for component type
const getComponentTypeLabel = (type) => {
  switch (type) {
    case 'PRE_ASSESSMENT':
      return 'Pre-Assessment';
    case 'POST_ASSESSMENT':
      return 'Post-Assessment';
    case 'LEARNING_MATERIALS':
      return 'Learning Materials';
    case 'VIDEO':
      return 'Video';
    case 'PRESENTATION':
      return 'Presentation';
    case 'INTERACTIVE':
      return 'Interactive Exercise';
    default:
      return 'Component';
  }
};

export default ModuleView;