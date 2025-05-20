import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Box,
  LinearProgress,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Alert,
  CircularProgress,
  Chip,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  PlayArrow,
  CheckCircle,
  Assignment,
  School,
  Lock,
  Refresh,
  ArrowBack,
  RateReview as ReviewIcon
} from '@mui/icons-material';
import { courseService, progressService, assessmentService } from '../../services/api';
import CourseProgressView from '../../components/progress/CourseProgressView';
import AssessmentReview from '../../components/assessment/AssessmentReview';

const CourseView = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [courseProgress, setCourseProgress] = useState(null);
  const [componentProgress, setComponentProgress] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [enrolling, setEnrolling] = useState(false);
  const [justEnrolled, setJustEnrolled] = useState(false);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [currentReviewComponent, setCurrentReviewComponent] = useState(null);
  const [assessmentResult, setAssessmentResult] = useState(null);
  const [loadingReview, setLoadingReview] = useState(false);

  useEffect(() => {
    loadCourseData();
  }, [courseId]);

  const loadCourseData = async () => {
    try {
      setLoading(true);
      // Get course details
      const courseResponse = await courseService.getUserCourseById(courseId);
      setCourse(courseResponse.data);

      // Get progress data
      try {
        const progressResponse = await progressService.getCourseProgress(courseId);
        setCourseProgress(progressResponse.data.courseProgress);
        
        // Map component progress with course components
        const progressMap = {};
        progressResponse.data.componentProgresses.forEach(cp => {
          progressMap[cp.componentId] = cp;
        });
        
        // Create component progress array with all course components
        const mappedProgress = courseResponse.data.components.map(component => {
          const progress = progressMap[component.id] || {
            status: 'NOT_STARTED',
            progressPercentage: 0,
            score: null,
            attempts: 0,
            timeSpentSeconds: 0
          };
          
          // Ensure componentTitle is included from either progress or component
          const componentTitle = progress.componentTitle || component.data?.title || component.type;
          
          return {
            id: component.id,
            componentId: component.id,
            componentType: component.type,
            componentTitle: componentTitle,
            order: component.order,
            ...progress,
            componentTitle: componentTitle // Ensure the title is not overwritten by spread operator
          };
        }).sort((a, b) => a.order - b.order);
        
        console.log('Course components:', courseResponse.data.components);
        console.log('Mapped progress:', mappedProgress);
        setComponentProgress(mappedProgress);
      } catch (progressErr) {
        // Not enrolled yet, show components without progress
        if (progressErr.response?.status === 404) {
          const defaultProgress = courseResponse.data.components.map(component => ({
            id: component.id,
            componentId: component.id,
            componentType: component.type,
            componentTitle: component.data?.title || component.type,
            order: component.order,
            status: 'NOT_STARTED',
            progressPercentage: 0,
            score: null,
            attempts: 0,
            timeSpentSeconds: 0
          })).sort((a, b) => a.order - b.order);
          
          setComponentProgress(defaultProgress);
        } else {
          throw progressErr;
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load course');
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async () => {
    try {
      setEnrolling(true);
      await progressService.enrollInCourse(courseId);
      // Add a small delay to ensure enrollment is fully processed
      await new Promise(resolve => setTimeout(resolve, 1000));
      setJustEnrolled(true);
      await loadCourseData();
      // Clear the justEnrolled flag after a delay
      setTimeout(() => setJustEnrolled(false), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to enroll');
    } finally {
      setEnrolling(false);
    }
  };

  const handleStartComponent = async (componentId, componentType) => {
    // Navigate based on component type
    switch (componentType) {
      case 'PRE_ASSESSMENT':
      case 'POST_ASSESSMENT':
        navigate(`/course/${courseId}/assessment/${componentId}`);
        break;
      case 'MATERIAL':
        navigate(`/course/${courseId}/material/${componentId}`);
        break;
      default:
        console.error('Unknown component type:', componentType);
    }
  };
  
  // Function to handle the review button click
  const handleReviewComponent = async (componentId, componentType, componentProgress) => {
    try {
      console.log('Review button clicked for component:', componentId, 'type:', componentType);
      
      // Prevent multiple clicks
      if (loadingReview) {
        console.log('Already loading, ignoring click');
        return;
      }
      
      setLoadingReview(true);
      
      // Find the component in the course
      const componentData = course.components.find(c => c.id === componentId);
      if (!componentData) {
        console.error('Component not found in course data');
        throw new Error('Component not found');
      }
      
      console.log('Found component data:', componentData);
      
      // First show the dialog with the component data, we'll load the attempt data asynchronously
      setCurrentReviewComponent(componentData);
      setReviewDialogOpen(true);
      
      // Only handle assessment reviews for now
      if (componentType === 'PRE_ASSESSMENT' || componentType === 'POST_ASSESSMENT') {
        // Create a mock assessment result with basic info in case we can't load detailed data
        const mockResult = {
          score: componentProgress.score || 100,
          passed: true,
          correctAnswers: 'N/A',
          totalQuestions: 'N/A',
          detailedResults: []
        };
        
        // Set the mock result first, then try to load the real data
        setAssessmentResult(mockResult);
        
        console.log('Fetching latest attempt for assessment component');
        try {
          // Fetch the latest assessment attempt for this component
          const response = await assessmentService.getLatestAttempt(componentId);
          console.log('Latest attempt response:', response);
          
          if (response && response.data) {
            console.log('Setting assessment result from latest attempt:', response.data);
            setAssessmentResult(response.data);
          } else {
            console.warn('No data found in latest attempt response, trying all attempts');
            throw new Error('No data in latest attempt');
          }
        } catch (apiError) {
          console.error('API error getting latest attempt:', apiError);
          // Try getting all attempts as fallback
          try {
            console.log('Trying to get all attempts as fallback');
            const attemptsResponse = await assessmentService.getUserAttempts(componentId);
            console.log('All attempts response:', attemptsResponse);
            
            if (attemptsResponse && attemptsResponse.data && attemptsResponse.data.length > 0) {
              // Get the most recent attempt
              const latestAttempt = attemptsResponse.data.sort((a, b) => 
                new Date(b.submittedAt || b.createdAt) - new Date(a.submittedAt || a.createdAt)
              )[0];
              
              console.log('Using latest attempt from list:', latestAttempt);
              
              // If we got an attempt ID but no detailed results, try to fetch the specific attempt
              if (latestAttempt.id && (!latestAttempt.detailedResults || latestAttempt.detailedResults.length === 0)) {
                try {
                  console.log('Attempt found but no detailed results, fetching specific attempt:', latestAttempt.id);
                  const attemptResponse = await assessmentService.getAttempt(latestAttempt.id);
                  
                  if (attemptResponse && attemptResponse.data) {
                    console.log('Got detailed attempt data:', attemptResponse.data);
                    setAssessmentResult(attemptResponse.data);
                  } else {
                    console.warn('No detailed data in specific attempt response, using basic attempt data');
                    setAssessmentResult(latestAttempt);
                  }
                } catch (attemptError) {
                  console.error('Error fetching specific attempt:', attemptError);
                  setAssessmentResult(latestAttempt);
                }
              } else {
                setAssessmentResult(latestAttempt);
              }
            } else {
              console.warn('No assessment attempts found in the fallback request');
              // Keep using the mock result
            }
          } catch (fallbackError) {
            console.error('Fallback attempt also failed:', fallbackError);
            // Keep using the mock result
          }
        }
      } else if (componentType === 'MATERIAL') {
        // For materials, just navigate to the material view
        console.log('Navigating to material view');
        setReviewDialogOpen(false); // Close dialog before navigating
        navigate(`/course/${courseId}/material/${componentId}`);
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to load review data';
      console.error('Error in handleReviewComponent:', errorMessage, err);
      setError(errorMessage);
      
      // Keep the dialog open with error state instead of showing an alert
      if (!reviewDialogOpen) {
        setReviewDialogOpen(true);
      }
      
      // Create error result to display in the dialog
      setAssessmentResult({
        error: true,
        errorMessage: errorMessage
      });
    } finally {
      setLoadingReview(false);
    }
  };

  const getComponentIcon = (type) => {
    switch (type) {
      case 'PRE_ASSESSMENT':
      case 'POST_ASSESSMENT':
        return <Assignment />;
      case 'MATERIAL':
        return <School />;
      default:
        return <PlayArrow />;
    }
  };

  const getStatusChip = (status) => {
    switch (status) {
      case 'COMPLETED':
        return <Chip icon={<CheckCircle />} label="Completed" color="success" size="small" />;
      case 'IN_PROGRESS':
        return <Chip label="In Progress" color="primary" size="small" />;
      case 'FAILED':
        return <Chip label="Failed" color="error" size="small" />;
      default:
        return <Chip label="Not Started" size="small" />;
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
        <Button variant="contained" onClick={() => navigate('/my-courses')} sx={{ mt: 2 }}>
          Back to Courses
        </Button>
      </Container>
    );
  }

  const isEnrolled = courseProgress !== null;
  console.log('Is enrolled:', isEnrolled, 'Course progress:', courseProgress);

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box display="flex" alignItems="center" mb={3}>
        <IconButton onClick={() => navigate('/my-courses')} sx={{ mr: 2 }}>
          <ArrowBack />
        </IconButton>
        <Typography variant="h4" component="h1" sx={{ flexGrow: 1 }}>
          {course?.title}
        </Typography>
      </Box>

      {/* Course Info Card */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Typography variant="body1" paragraph>
                {course?.description}
              </Typography>
              <Box display="flex" gap={2} alignItems="center">
                <Chip label={course?.domain?.name} color="primary" />
                {course?.timeLimit && (
                  <Typography variant="body2" color="text.secondary">
                    Time Limit: {course.timeLimit} minutes
                  </Typography>
                )}
                {course?.passingScore && (
                  <Typography variant="body2" color="text.secondary">
                    Passing Score: {course.passingScore}%
                  </Typography>
                )}
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              {isEnrolled ? (
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Your Progress
                  </Typography>
                  <Box display="flex" alignItems="center" mb={1}>
                    <Typography variant="body2" sx={{ mr: 1 }}>
                      {courseProgress?.overallProgress || 0}%
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={courseProgress?.overallProgress || 0}
                      sx={{ flexGrow: 1, height: 8, borderRadius: 4 }}
                    />
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {courseProgress?.completedComponents || 0} of {course?.components?.length || 0} components completed
                  </Typography>
                  {courseProgress?.status === 'COMPLETED' && (
                    <Chip
                      icon={<CheckCircle />}
                      label="Course Completed"
                      color="success"
                      sx={{ mt: 2 }}
                    />
                  )}
                </Box>
              ) : (
                <Box textAlign="center">
                  <Typography variant="body1" gutterBottom>
                    You are not enrolled in this course yet
                  </Typography>
                  <Button
                    variant="contained"
                    size="large"
                    onClick={handleEnroll}
                    disabled={enrolling}
                    fullWidth
                  >
                    {enrolling ? 'Enrolling...' : 'Enroll Now'}
                  </Button>
                </Box>
              )}
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Course Components */}
      {course && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          {isEnrolled && (
            <Grid item xs={12} md={4}>
              <CourseProgressView courseId={courseId} />
            </Grid>
          )}
          <Grid item xs={12} md={isEnrolled ? 8 : 12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Course Components ({course?.components?.length || 0} total)
                </Typography>
                {course?.components?.length === 0 ? (
                  <Typography>No components available for this course</Typography>
                ) : (
                  <Stepper orientation="vertical" nonLinear activeStep={-1}>
                    {course.components.map((component, index) => {
                      // Find matching progress if enrolled
                      let comp = {
                        componentId: component.id,
                        componentType: component.type,
                        componentTitle: component.data?.title || component.type,
                        status: 'NOT_STARTED',
                        progressPercentage: 0,
                        score: null,
                        attempts: 0,
                        timeSpentSeconds: 0
                      };
                      
                      if (isEnrolled && componentProgress.length > 0) {
                        const found = componentProgress.find(cp => cp.componentId === component.id);
                        if (found) {
                          comp = { ...comp, ...found };
                        }
                      }
                      
                      // Check if this component is locked
                      let isLocked = false;
                      if (isEnrolled && index > 0 && comp.status === 'NOT_STARTED') {
                        // Check if previous component is completed
                        const prevComponent = componentProgress[index - 1];
                        isLocked = !prevComponent || prevComponent.status !== 'COMPLETED';
                      }
                      // Always allow first component or if already started/completed
                      const canStart = index === 0 || !isLocked || comp.status !== 'NOT_STARTED';
                    
                    return (
                      <Step key={component.id} expanded={true}>
                        <StepLabel
                          StepIconComponent={() => (
                            <Box sx={{ position: 'relative' }}>
                              {getComponentIcon(component.type)}
                              {comp.status === 'COMPLETED' && (
                                <CheckCircle
                                  sx={{
                                    position: 'absolute',
                                    bottom: -5,
                                    right: -5,
                                    fontSize: 16,
                                    color: 'success.main',
                                    backgroundColor: 'white',
                                    borderRadius: '50%'
                                  }}
                                />
                              )}
                            </Box>
                          )}
                        >
                          <Box display="flex" alignItems="center" gap={1}>
                            <Typography variant="subtitle1">
                              {comp.componentTitle || component.data?.title || component.type}
                            </Typography>
                            {isEnrolled && getStatusChip(comp.status)}
                            {isLocked && (
                              <Tooltip title="Complete previous component first">
                                <Lock fontSize="small" color="disabled" />
                              </Tooltip>
                            )}
                          </Box>
                        </StepLabel>
                        <StepContent>
                          <Box sx={{ mb: 2 }}>
                            <Grid container spacing={2}>
                              <Grid item xs={12} sm={8}>
                                <Typography variant="body2" color="text.secondary">
                                  Type: {component.type.replace('_', ' ')}
                                </Typography>
                                {isEnrolled && (
                                  <>
                                    {comp.score !== null && (
                                      <Typography variant="body2">
                                        Score: {comp.score}%
                                      </Typography>
                                    )}
                                    {comp.attempts > 0 && (
                                      <Typography variant="body2">
                                        Attempts: {comp.attempts}
                                      </Typography>
                                    )}
                                    {comp.timeSpentSeconds > 0 && (
                                      <Typography variant="body2">
                                        Time Spent: {Math.floor(comp.timeSpentSeconds / 60)} minutes
                                      </Typography>
                                    )}
                                  </>
                                )}
                              </Grid>
                              <Grid item xs={12} sm={4}>
                                {console.log('Button render:', {
                                  componentId: component.id,
                                  isEnrolled,
                                  canStart,
                                  index,
                                  status: comp.status,
                                  isLocked,
                                  componentType: component.type
                                })}
                                {isEnrolled ? (
                                  canStart ? (
                                    <>
                                      {/* Different button logic based on status and score */}
                                      {comp.status === 'COMPLETED' ? (
                                        // For completed components, show review button
                                        <Button
                                          variant="outlined"
                                          color="secondary"
                                          startIcon={<ReviewIcon />}
                                          onClick={(e) => {
                                            // Prevent default to stop any page refresh
                                            e.preventDefault();
                                            e.stopPropagation();
                                            // Store component data in state first to prevent race conditions
                                            setCurrentReviewComponent(component);
                                            // Use a slight delay to ensure state is updated
                                            setTimeout(() => {
                                              handleReviewComponent(component.id, component.type, comp);
                                            }, 0);
                                          }}
                                          fullWidth
                                          disabled={loadingReview}
                                        >
                                          {loadingReview ? 'Loading...' : 'Review'}
                                        </Button>
                                      ) : comp.status === 'FAILED' && (component.type === 'PRE_ASSESSMENT' || component.type === 'POST_ASSESSMENT') ? (
                                        // For failed assessments, show re-attempt button if attempts are left
                                        comp.attempts >= 3 ? (
                                          <Button
                                            variant="outlined"
                                            color="error"
                                            fullWidth
                                            disabled={true}
                                          >
                                            No attempts left
                                          </Button>
                                        ) : (
                                          <Button
                                            variant="contained"
                                            color="primary"
                                            startIcon={<Refresh />}
                                            onClick={() => handleStartComponent(component.id, component.type)}
                                            fullWidth
                                            disabled={justEnrolled}
                                          >
                                            Re-attempt ({3 - comp.attempts} left)
                                          </Button>
                                        )
                                      ) : (
                                        // For not started or in progress components
                                        <Button
                                          variant="contained"
                                          startIcon={comp.status === 'IN_PROGRESS' ? <PlayArrow /> : <PlayArrow />}
                                          onClick={() => handleStartComponent(component.id, component.type)}
                                          fullWidth
                                          disabled={justEnrolled}
                                        >
                                          {justEnrolled ? 'Loading...' :
                                           comp.status === 'IN_PROGRESS' ? 'Continue' : 'Start'}
                                        </Button>
                                      )}
                                    </>
                                  ) : (
                                    <Typography variant="caption" color="text.secondary">
                                      Complete previous component first
                                    </Typography>
                                  )
                                ) : (
                                  <Typography variant="caption" color="text.secondary">
                                    Enroll to access
                                  </Typography>
                                )}
                              </Grid>
                            </Grid>
                          </Box>
                        </StepContent>
                      </Step>
                      );
                    })}
                  </Stepper>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
      
      {/* Assessment Review Dialog */}
      <AssessmentReview
        open={reviewDialogOpen}
        onClose={() => {
          console.log('Closing review dialog');
          setReviewDialogOpen(false);
          setCurrentReviewComponent(null);
          setAssessmentResult(null);
        }}
        assessmentResult={assessmentResult}
        component={currentReviewComponent}
      />
    </Container>
  );
};

export default CourseView;