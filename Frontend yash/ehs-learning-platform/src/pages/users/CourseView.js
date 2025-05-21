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
  Tooltip,
  Paper,
  Divider,
  Avatar,
  useTheme,
  alpha
} from '@mui/material';
import {
  PlayArrow,
  CheckCircle,
  Assignment,
  School,
  Lock,
  Refresh,
  ArrowBack,
  RateReview as ReviewIcon,
  Timer,
  Info as InfoIcon,
  MenuBook,
  Flag as FlagIcon,
  AccessTime as AccessTimeIcon
} from '@mui/icons-material';
import { courseService, progressService, assessmentService } from '../../services/api';
import CourseHorizontalMilestone from '../../components/progress/CourseHorizontalMilestone';
import AssessmentReview from '../../components/assessment/AssessmentReview';

const CourseView = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
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
  const [activeComponent, setActiveComponent] = useState(null);

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

        // Find active component (in-progress or first not started)
        const inProgress = mappedProgress.find(c => c.status === 'IN_PROGRESS');
        if (inProgress) {
          setActiveComponent(inProgress.componentId);
        } else {
          const notStarted = mappedProgress.find(c => c.status === 'NOT_STARTED');
          if (notStarted) {
            setActiveComponent(notStarted.componentId);
          }
        }

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

  // Function to handle the Continue Course button click
  const handleContinueCourse = () => {
    // Always prioritize in-progress components
    const inProgress = componentProgress.find(c => c.status === 'IN_PROGRESS');
    if (inProgress) {
      const component = course.components.find(c => c.id === inProgress.componentId);
      if (component) {
        // Navigate to the in-progress component
        handleStartComponent(component.id, component.type);
        return;
      }
    }

    // If no components are in progress, find the first component that isn't completed
    // We only want to find the first unlocked component that isn't completed

    // First, try to find the first unlocked not-started component
    let foundNextAvailable = false;
    let nextComponentToStart = null;

    // Loop through components in order
    for (let i = 0; i < componentProgress.length; i++) {
      const comp = componentProgress[i];

      if (comp.status === 'COMPLETED') {
        // This component is completed, so the next one would be unlocked
        continue;
      }

      if (comp.status !== 'COMPLETED') {
        // Found a non-completed component

        // Check if this is the very first component (always unlocked)
        if (i === 0) {
          nextComponentToStart = comp;
          break;
        }

        // Check if the previous component is completed (which means this one is unlocked)
        const prevComponentCompleted = i > 0 && componentProgress[i-1].status === 'COMPLETED';
        if (prevComponentCompleted) {
          nextComponentToStart = comp;
          break;
        }

        // If we're here, the component is locked
        break;
      }
    }

    if (nextComponentToStart) {
      const component = course.components.find(c => c.id === nextComponentToStart.componentId);
      if (component) {
        handleStartComponent(component.id, component.type);
      }
    }
  };

  // Handle milestone component click
  const handleMilestoneClick = (componentData) => {
    // Find the component in the course components
    const component = course.components.find(c => c.id === componentData.componentId);
    if (component) {
      handleStartComponent(component.id, component.type);
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
        return <MenuBook />;
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

  // Format time for display
  const formatTime = (seconds) => {
    if (!seconds) return '0m';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  // Calculate how many components are available to start (not locked)
  const getAvailableComponentsCount = () => {
    if (!isEnrolled || componentProgress.length === 0) return 0;
    
    let availableCount = 0;
    let prevComponentCompleted = true; // First component is always available
    
    for (const comp of componentProgress) {
      if (prevComponentCompleted || comp.status !== 'NOT_STARTED') {
        availableCount++;
      }
      prevComponentCompleted = comp.status === 'COMPLETED';
    }
    
    return availableCount;
  };

  if (loading) {
    return (
      <Container disableGutters maxWidth={false} sx={{ px: { xs: 2, sm: 4 }, mt: 4, mb: 6 }}>
        <Box
          display="flex"
          flexDirection="column"
          justifyContent="center"
          alignItems="center"
          minHeight="400px"
          sx={{
            bgcolor: 'white',
            borderRadius: '12px',
            boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
            p: 5
          }}
        >
          <CircularProgress size={60} thickness={4} sx={{ mb: 3 }} />
          <Typography variant="h6" fontWeight="500" color="text.secondary" sx={{ mb: 1 }}>
            Loading course details...
          </Typography>
          <Typography variant="body2" color="text.disabled">
            Please wait while we prepare your learning experience
          </Typography>
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container disableGutters maxWidth={false} sx={{ px: { xs: 2, sm: 4 }, mt: 4, mb: 6 }}>
        <Box
          sx={{
            bgcolor: 'white',
            borderRadius: '12px',
            boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
            p: 5,
            textAlign: 'center'
          }}
        >
          <Box
            sx={{
              bgcolor: alpha(theme.palette.error.main, 0.08),
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mb: 3,
              mx: 'auto'
            }}
          >
            <InfoIcon color="error" sx={{ fontSize: 30 }} />
          </Box>

          <Typography variant="h5" component="h1" fontWeight="700" gutterBottom>
            Something went wrong
          </Typography>

          <Alert
            severity="error"
            sx={{
              mb: 3,
              mt: 2,
              maxWidth: '600px',
              mx: 'auto',
              '& .MuiAlert-message': {
                fontWeight: 500
              }
            }}
          >
            {error}
          </Alert>

          <Button
            variant="contained"
            color="primary"
            size="large"
            startIcon={<ArrowBack />}
            onClick={() => navigate('/my-courses')}
            sx={{
              mt: 2,
              px: 4,
              py: 1.2,
              borderRadius: '8px',
              fontWeight: 600,
              textTransform: 'none'
            }}
          >
            Back to My Courses
          </Button>
        </Box>
      </Container>
    );
  }

  const isEnrolled = courseProgress !== null;

  return (
    <Container disableGutters maxWidth={false} sx={{ px: { xs: 2, sm: 4 }, mt: 4, mb: 6 }}>
      {/* Just Enrolled Alert */}
      {justEnrolled && (
        <Alert
          severity="success"
          variant="filled"
          icon={<CheckCircle fontSize="inherit" />}
          sx={{
            mb: 3,
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,120,0,0.15)',
            '& .MuiAlert-message': {
              fontWeight: 500
            }
          }}
          onClose={() => setJustEnrolled(false)}
        >
          Successfully enrolled in this course! Your progress will now be tracked.
        </Alert>
      )}

      {/* Back button and page title */}
      <Box
        display="flex"
        alignItems="center"
        mb={3}
        justifyContent="space-between"
      >
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate('/my-courses')}
          sx={{
            fontWeight: 500,
            px: 2,
            py: 1,
            borderRadius: '8px',
            bgcolor: 'white',
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
            '&:hover': {
              bgcolor: 'white',
              boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
            }
          }}
          variant="text"
          color="primary"
        >
          Back to My Courses
        </Button>

        {courseProgress?.status === 'COMPLETED' && (
          <Chip
            icon={<School />}
            label="Course Completed!"
            color="success"
            variant="filled"
            sx={{
              fontWeight: 600,
              px: 1.5,
              py: 2.5,
              fontSize: '0.875rem',
              borderRadius: '8px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            }}
          />
        )}
      </Box>

      {/* Course Header - Single Horizontal Component with Two Color Sections */}
      <Card
        elevation={3}
        sx={{
          mb: 4,
          overflow: 'hidden',
          borderRadius: '16px',
          boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          height: { md: '300px' }
        }}
      >
        {/* Course Information Section - Left Side, White Background */}
        <Box sx={{
          flex: '1 1 50%',
          p: 3,
          bgcolor: 'white',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center'
        }}>
          <Typography variant="h4" component="h1" fontWeight="700" gutterBottom sx={{ color: 'primary.dark' }}>
            {course?.title}
          </Typography>

          <Box display="flex" gap={1.5} flexWrap="wrap" mb={2.5}>
            {course?.domain?.name && (
              <Typography variant="subtitle1" color="text.secondary" fontWeight="500">
                {course.domain.name}
              </Typography>
            )}
            {course?.timeLimit && (
              <Typography variant="subtitle1" color="text.secondary" fontWeight="500" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <AccessTimeIcon fontSize="small" color="primary" />
                {course.timeLimit} min
              </Typography>
            )}
            {course?.passingScore && (
              <Typography variant="subtitle1" color="text.secondary" fontWeight="500" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <FlagIcon fontSize="small" color="primary" />
                Passing: {course.passingScore}%
              </Typography>
            )}
          </Box>

          <Typography variant="subtitle1" fontWeight="600" gutterBottom color="primary.main" sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
            <InfoIcon fontSize="small" /> Course Description
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{
            lineHeight: 1.7,
            mt: 0.5,
            maxHeight: { md: '120px' },
            overflow: 'auto'
          }}>
            {course?.description}
          </Typography>
        </Box>

        {/* Progress Summary Widget - Right Side, Blue Background */}
        <Box
          sx={{
            flex: '1 1 50%',
            bgcolor: 'primary.main',
            p: 3,
            color: 'white',
            position: 'relative',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            borderLeft: { md: '6px solid', xs: 'none' },
            borderTop: { xs: '6px solid', md: 'none' },
            borderColor: 'primary.light',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: '-50px',
              right: '-50px',
              width: '150px',
              height: '150px',
              borderRadius: '50%',
              backgroundColor: 'rgba(255, 255, 255, 0.07)',
              zIndex: 1
            },
            '&::after': {
              content: '""',
              position: 'absolute',
              bottom: '-40px',
              left: '-40px',
              width: '120px',
              height: '120px',
              borderRadius: '50%',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              zIndex: 1
            }
          }}
        >
          {isEnrolled ? (
            <Grid container spacing={3} alignItems="center" sx={{ position: 'relative', zIndex: 2 }}>
              <Grid item xs={12} sm={4} md={4} sx={{ textAlign: 'center' }}>
                <Box sx={{ position: 'relative', display: 'inline-block' }}>
                  <CircularProgress
                    variant="determinate"
                    value={100}
                    size={100}
                    thickness={4}
                    sx={{
                      color: 'rgba(255, 255, 255, 0.2)',
                      position: 'absolute',
                      left: 0
                    }}
                  />
                  <CircularProgress
                    variant="determinate"
                    value={courseProgress?.overallProgress || 0}
                    size={100}
                    thickness={4}
                    sx={{ color: 'white' }}
                  />
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      bottom: 0,
                      right: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexDirection: 'column'
                    }}
                  >
                    <Typography variant="h4" component="div" fontWeight="bold" color="white">
                      {Math.round(courseProgress?.overallProgress || 0)}%
                    </Typography>
                    <Typography variant="caption" color="rgba(255, 255, 255, 0.8)" sx={{ mt: 0.5 }}>
                      Complete
                    </Typography>
                  </Box>
                </Box>
              </Grid>

              <Grid item xs={12} sm={8} md={8}>
                <Typography variant="h5" fontWeight="600" gutterBottom color="white">
                  Your Progress
                </Typography>

                <Box sx={{ mb: 3 }}>
                  <Box sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 1.5
                  }}>
                    <Box sx={{
                      bgcolor: 'rgba(255, 255, 255, 0.15)',
                      p: 1.5,
                      borderRadius: '10px',
                    }}>
                      <Typography variant="body2" color="white" sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontWeight: 500,
                      }}>
                        <span>Components completed:</span>
                        <Box component="span" fontWeight="bold">
                          {courseProgress?.completedComponents || 0} of {course?.components?.length || 0}
                        </Box>
                      </Typography>
                    </Box>

                    <Box sx={{
                      bgcolor: 'rgba(255, 255, 255, 0.15)',
                      p: 1.5,
                      borderRadius: '10px',
                    }}>
                      <Typography variant="body2" color="white" sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontWeight: 500,
                      }}>
                        <span>Available to start:</span>
                        <Box component="span" fontWeight="bold">{getAvailableComponentsCount()}</Box>
                      </Typography>
                    </Box>

                    {courseProgress?.status === 'COMPLETED' && (
                      <Box sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: 'rgba(255, 255, 255, 0.2)',
                        p: 1.5,
                        borderRadius: '10px',
                      }}>
                        <CheckCircle sx={{ mr: 1, fontSize: 20 }} />
                        <Typography variant="body2" fontWeight="600" color="white">
                          Course Completed
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </Box>

                {courseProgress?.status !== 'COMPLETED' && (
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleContinueCourse}
                    startIcon={<PlayArrow />}
                    sx={{
                      bgcolor: 'white',
                      color: 'primary.main',
                      fontWeight: 600,
                      py: 1.2,
                      px: 3,
                      '&:hover': {
                        bgcolor: 'rgba(255, 255, 255, 0.9)',
                      },
                      boxShadow: '0 4px 10px rgba(0, 0, 0, 0.1)',
                      borderRadius: '8px',
                      textTransform: 'none',
                      fontSize: '1rem'
                    }}
                  >
                    Continue Learning
                  </Button>
                )}
              </Grid>
            </Grid>
          ) : (
            <Box sx={{ width: '100%', textAlign: 'center', position: 'relative', zIndex: 2, py: 2 }}>
              <Typography variant="h5" fontWeight="600" gutterBottom color="white">
                Ready to Start Learning?
              </Typography>

              <Typography variant="body1" paragraph color="white" sx={{ mb: 3, opacity: 0.9, maxWidth: '600px', mx: 'auto' }}>
                Enroll to track your progress and complete this course
              </Typography>

              <Button
                variant="contained"
                size="large"
                onClick={handleEnroll}
                disabled={enrolling}
                sx={{
                  bgcolor: 'white',
                  color: 'primary.main',
                  fontWeight: 600,
                  py: 1.5,
                  px: 4,
                  '&:hover': {
                    bgcolor: 'rgba(255, 255, 255, 0.9)',
                  },
                  boxShadow: '0 4px 10px rgba(0, 0, 0, 0.1)',
                  borderRadius: '8px',
                  textTransform: 'none',
                  fontSize: '1rem',
                  maxWidth: '300px',
                  width: '100%',
                  mx: 'auto'
                }}
              >
                {enrolling ? (
                  <Box display="flex" alignItems="center" justifyContent="center">
                    <CircularProgress
                      size={20}
                      sx={{
                        color: 'primary.main',
                        mr: 1
                      }}
                    />
                    Enrolling...
                  </Box>
                ) : 'Enroll Now'}
              </Button>
            </Box>
          )}
        </Box>
      </Card>

      {/* Course Content Section */}
      <Box sx={{ width: '100%', mt: 4 }}>
        {/* Content List - Full Width */}
        <Card
          elevation={3}
          sx={{
            p: { xs: 2, md: 3 },
            borderRadius: '12px',
            border: '1px solid',
            borderColor: 'divider',
            width: '100%',
            boxShadow: '0 3px 10px rgba(0,0,0,0.08)',
            bgcolor: 'white'
          }}
        >
            <Box sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 3
            }}>
              <Typography
                variant="h5"
                component="h2"
                fontWeight="600"
                color="primary.dark"
                sx={{
                  px: 1,
                  display: 'flex',
                  alignItems: 'center',
                  '&::before': {
                    content: '""',
                    width: '4px',
                    height: '24px',
                    backgroundColor: 'primary.main',
                    display: 'inline-block',
                    marginRight: '12px',
                    borderRadius: '4px'
                  }
                }}
              >
                Course Content
              </Typography>

              <Chip
                label={`${course?.components?.length || 0} Components`}
                color="primary"
                variant="outlined"
                size="medium"
                sx={{
                  fontWeight: 'medium',
                  borderRadius: '8px',
                }}
              />
            </Box>

            <Divider sx={{ mb: 4 }} />

            {course?.components?.length === 0 ? (
              <Box sx={{
                py: 4,
                textAlign: 'center',
                color: 'text.secondary',
                borderRadius: '8px',
                border: '1px dashed',
                borderColor: 'divider',
                bgcolor: 'background.paper'
              }}>
                <MenuBook sx={{ fontSize: 48, color: 'text.disabled', mb: 2, opacity: 0.5 }} />
                <Typography variant="h6" color="text.secondary">No content available for this course yet.</Typography>
                <Typography variant="body2" color="text.disabled" sx={{ mt: 1 }}>
                  Check back later for course materials and assessments.
                </Typography>
              </Box>
            ) : (
              <Box sx={{ width: '100%' }}>
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

                  // Check if this is the active component
                  const isActive = component.id === activeComponent;

                  // Determine component icon
                  const componentIcon = getComponentIcon(component.type);

                  // Determine status color
                  let statusColor = 'grey.300';
                  let statusBgColor = 'grey.50';
                  if (comp.status === 'COMPLETED') {
                    statusColor = 'success.main';
                    statusBgColor = 'success.50';
                  } else if (comp.status === 'IN_PROGRESS') {
                    statusColor = 'primary.main';
                    statusBgColor = 'primary.50';
                  } else if (comp.status === 'FAILED') {
                    statusColor = 'error.main';
                    statusBgColor = 'error.50';
                  }

                  return (
                    <Paper
                      key={component.id}
                      elevation={isActive ? 2 : 0}
                      sx={{
                        mb: 2.5,
                        borderRadius: '12px',
                        border: '1px solid',
                        borderColor: isActive
                          ? 'primary.main'
                          : isLocked
                            ? 'grey.200'
                            : comp.status === 'COMPLETED'
                              ? 'success.light'
                              : 'divider',
                        backgroundColor: 'white',
                        overflow: 'hidden',
                        position: 'relative',
                        opacity: isLocked ? 0.85 : 1,
                        transition: 'all 0.2s ease',
                        boxShadow: isActive
                          ? '0 4px 12px rgba(0,0,0,0.08)'
                          : isLocked
                            ? 'none'
                            : '0 2px 8px rgba(0,0,0,0.05)',
                        '&:hover': {
                          boxShadow: (isEnrolled && canStart && !justEnrolled)
                            ? '0 6px 16px rgba(0,0,0,0.1)'
                            : undefined,
                          transform: (isEnrolled && canStart && !justEnrolled)
                            ? 'translateY(-2px)'
                            : undefined
                        }
                      }}
                    >
                      {/* Left accent border based on status */}
                      <Box sx={{
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        bottom: 0,
                        width: '4px',
                        backgroundColor: isLocked ? 'grey.300' : statusColor,
                        borderTopLeftRadius: '12px',
                        borderBottomLeftRadius: '12px'
                      }} />

                      {/* Component Header */}
                      <Box
                        sx={{
                          p: 2.5,
                          borderBottom: '1px solid',
                          borderColor: 'divider',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          cursor: (isEnrolled && canStart && !justEnrolled) ? 'pointer' : 'default',
                          '&:hover': (isEnrolled && canStart && !justEnrolled) ? {
                            backgroundColor: 'grey.50'
                          } : {},
                          pl: 4 // Add left padding to account for accent border
                        }}
                        onClick={() => {
                          if (isEnrolled && canStart && !justEnrolled) {
                            handleStartComponent(component.id, component.type);
                          }
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar
                            sx={{
                              bgcolor: isLocked ? 'grey.100' : statusBgColor,
                              color: isLocked ? 'text.disabled' : statusColor,
                              width: 40,
                              height: 40,
                              boxShadow: '0 2px 6px rgba(0,0,0,0.08)'
                            }}
                          >
                            {componentIcon}
                          </Avatar>

                          <Box>
                            <Typography
                              variant="subtitle1"
                              component="h3"
                              fontWeight={600}
                              sx={{
                                color: isLocked ? 'text.disabled' : 'text.primary',
                                mb: 0.5
                              }}
                            >
                              {index + 1}. {comp.componentTitle}
                            </Typography>

                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 0.5
                              }}
                            >
                              {component.type === 'PRE_ASSESSMENT' && 'Pre-Assessment'}
                              {component.type === 'POST_ASSESSMENT' && 'Post-Assessment'}
                              {component.type === 'MATERIAL' && 'Learning Material'}
                            </Typography>
                          </Box>
                        </Box>

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          {isEnrolled && (
                            <Chip
                              icon={
                                comp.status === 'COMPLETED' ? <CheckCircle fontSize="small" /> :
                                comp.status === 'IN_PROGRESS' ? <PlayArrow fontSize="small" /> :
                                comp.status === 'FAILED' ? <Refresh fontSize="small" /> :
                                isLocked ? <Lock fontSize="small" /> : null
                              }
                              label={
                                comp.status === 'COMPLETED' ? 'Completed' :
                                comp.status === 'IN_PROGRESS' ? 'In Progress' :
                                comp.status === 'FAILED' ? 'Failed' :
                                isLocked ? 'Locked' : 'Not Started'
                              }
                              color={
                                comp.status === 'COMPLETED' ? 'success' :
                                comp.status === 'IN_PROGRESS' ? 'primary' :
                                comp.status === 'FAILED' ? 'error' :
                                'default'
                              }
                              size="medium"
                              variant={comp.status === 'NOT_STARTED' ? 'outlined' : 'filled'}
                              sx={{
                                fontWeight: '500',
                                borderRadius: '8px',
                                px: 1,
                                height: 32
                              }}
                            />
                          )}
                        </Box>
                      </Box>

                      {/* Component Details */}
                      <Box
                        sx={{
                          p: 2.5,
                          cursor: (isEnrolled && canStart && !justEnrolled) ? 'pointer' : 'default',
                          '&:hover': (isEnrolled && canStart && !justEnrolled) ? {
                            backgroundColor: 'grey.50'
                          } : {},
                          pl: 4, // Add left padding to account for accent border
                          bgcolor: isActive ? alpha(theme.palette.primary.main, 0.04) : 'white'
                        }}
                        onClick={() => {
                          if (isEnrolled && canStart && !justEnrolled) {
                            handleStartComponent(component.id, component.type);
                          }
                        }}
                      >
                        <Grid container spacing={2}>
                          <Grid item xs={12} md={8}>
                            {/* Component Stats */}
                            {isEnrolled && (
                              <Box
                                sx={{
                                  display: 'flex',
                                  flexWrap: 'wrap',
                                  gap: { xs: 1, sm: 3 },
                                  mb: 2
                                }}
                              >
                                {comp.score !== null && (
                                  <Box
                                    sx={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      bgcolor: 'grey.50',
                                      py: 0.75,
                                      px: 1.5,
                                      borderRadius: '8px'
                                    }}
                                  >
                                    <FlagIcon
                                      fontSize="small"
                                      sx={{
                                        color: comp.score >= 70 ? 'success.main' : 'error.main',
                                        mr: 0.75,
                                        fontSize: 18
                                      }}
                                    />
                                    <Typography variant="body2" color="text.secondary" fontWeight="medium" sx={{ mr: 0.5 }}>
                                      Score:
                                    </Typography>
                                    <Typography
                                      variant="body2"
                                      fontWeight="bold"
                                      color={comp.score >= 70 ? 'success.main' : 'error.main'}
                                    >
                                      {comp.score}%
                                    </Typography>
                                  </Box>
                                )}

                                {comp.attempts > 0 && (
                                  <Box
                                    sx={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      bgcolor: 'grey.50',
                                      py: 0.75,
                                      px: 1.5,
                                      borderRadius: '8px'
                                    }}
                                  >
                                    <Refresh
                                      fontSize="small"
                                      sx={{
                                        color: 'text.secondary',
                                        mr: 0.75,
                                        fontSize: 18
                                      }}
                                    />
                                    <Typography variant="body2" color="text.secondary" fontWeight="medium" sx={{ mr: 0.5 }}>
                                      Attempts:
                                    </Typography>
                                    <Typography variant="body2" fontWeight="bold" color="text.primary">
                                      {comp.attempts}
                                    </Typography>
                                  </Box>
                                )}

                                {comp.timeSpentSeconds > 0 && (
                                  <Box
                                    sx={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      bgcolor: 'grey.50',
                                      py: 0.75,
                                      px: 1.5,
                                      borderRadius: '8px'
                                    }}
                                  >
                                    <AccessTimeIcon
                                      fontSize="small"
                                      sx={{
                                        color: 'text.secondary',
                                        mr: 0.75,
                                        fontSize: 18
                                      }}
                                    />
                                    <Typography variant="body2" color="text.secondary" fontWeight="medium" sx={{ mr: 0.5 }}>
                                      Time:
                                    </Typography>
                                    <Typography variant="body2" fontWeight="bold" color="text.primary">
                                      {formatTime(comp.timeSpentSeconds)}
                                    </Typography>
                                  </Box>
                                )}
                              </Box>
                            )}

                            {/* Progress Bar */}
                            {comp.status === 'IN_PROGRESS' && comp.progressPercentage > 0 && (
                              <Box sx={{ mt: 2, mb: 1, maxWidth: '90%' }}>
                                <Box display="flex" justifyContent="space-between" mb={0.5}>
                                  <Typography variant="caption" color="text.secondary">
                                    Progress
                                  </Typography>
                                  <Typography variant="caption" fontWeight="bold" color="primary.main">
                                    {Math.round(comp.progressPercentage)}%
                                  </Typography>
                                </Box>
                                <LinearProgress
                                  variant="determinate"
                                  value={comp.progressPercentage}
                                  sx={{
                                    height: 8,
                                    borderRadius: 4,
                                    bgcolor: alpha(theme.palette.primary.main, 0.12)
                                  }}
                                />
                              </Box>
                            )}
                          </Grid>

                          <Grid item xs={12} md={4} sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                            {isEnrolled ? (
                              canStart ? (
                                <>
                                  {comp.status === 'COMPLETED' ? (
                                    <Button
                                      variant="outlined"
                                      color="success"
                                      startIcon={<ReviewIcon />}
                                      onClick={(e) => {
                                        e.stopPropagation(); // Prevent card click
                                        handleReviewComponent(component.id, component.type, comp);
                                      }}
                                      disabled={loadingReview}
                                      size="medium"
                                      sx={{
                                        minWidth: '120px',
                                        borderRadius: '8px',
                                        textTransform: 'none',
                                        fontWeight: 500,
                                        py: 1
                                      }}
                                    >
                                      {loadingReview ? 'Loading...' : 'Review'}
                                    </Button>
                                  ) : comp.status === 'FAILED' && (component.type === 'PRE_ASSESSMENT' || component.type === 'POST_ASSESSMENT') ? (
                                    comp.attempts >= 3 ? (
                                      <Tooltip title="Maximum attempts reached">
                                        <span>
                                          <Button
                                            variant="outlined"
                                            color="error"
                                            size="medium"
                                            disabled={true}
                                            sx={{
                                              minWidth: '140px',
                                              borderRadius: '8px',
                                              textTransform: 'none',
                                              fontWeight: 500,
                                              py: 1
                                            }}
                                          >
                                            No attempts left
                                          </Button>
                                        </span>
                                      </Tooltip>
                                    ) : (
                                      <Button
                                        variant="contained"
                                        color="primary"
                                        startIcon={<Refresh />}
                                        onClick={(e) => {
                                          e.stopPropagation(); // Prevent card click
                                          handleStartComponent(component.id, component.type);
                                        }}
                                        disabled={justEnrolled}
                                        size="medium"
                                        sx={{
                                          minWidth: '140px',
                                          borderRadius: '8px',
                                          textTransform: 'none',
                                          fontWeight: 500,
                                          py: 1,
                                          boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
                                        }}
                                      >
                                        Re-attempt ({3 - comp.attempts} left)
                                      </Button>
                                    )
                                  ) : (
                                    <Button
                                      variant="contained"
                                      startIcon={<PlayArrow />}
                                      onClick={(e) => {
                                        e.stopPropagation(); // Prevent card click
                                        handleStartComponent(component.id, component.type);
                                      }}
                                      disabled={justEnrolled}
                                      size="medium"
                                      color="primary"
                                      sx={{
                                        minWidth: '120px',
                                        borderRadius: '8px',
                                        textTransform: 'none',
                                        fontWeight: 500,
                                        py: 1,
                                        boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
                                      }}
                                    >
                                      {justEnrolled ? 'Loading...' :
                                       comp.status === 'IN_PROGRESS' ? 'Continue' : 'Start'}
                                    </Button>
                                  )}
                                </>
                              ) : (
                                <Tooltip title="Complete previous components first">
                                  <span>
                                    <Button
                                      variant="outlined"
                                      disabled
                                      size="medium"
                                      sx={{
                                        minWidth: '120px',
                                        borderRadius: '8px',
                                        textTransform: 'none',
                                        fontWeight: 500,
                                        py: 1
                                      }}
                                      startIcon={<Lock />}
                                    >
                                      Locked
                                    </Button>
                                  </span>
                                </Tooltip>
                              )
                            ) : (
                              <Tooltip title="Enroll in the course to access content">
                                <span>
                                  <Button
                                    variant="outlined"
                                    disabled
                                    size="medium"
                                    sx={{
                                      minWidth: '140px',
                                      borderRadius: '8px',
                                      textTransform: 'none',
                                      fontWeight: 500,
                                      py: 1
                                    }}
                                  >
                                    Enroll to access
                                  </Button>
                                </span>
                              </Tooltip>
                            )}
                          </Grid>
                        </Grid>
                      </Box>
                    </Paper>
                  );
                })}
              </Box>
            )}
          </Card>
      </Box>


      {/* Course Milestone Component at Bottom */}
      {isEnrolled && (
        <Card
          elevation={3}
          sx={{
            mt: 4,
            mb: 2,
            p: { xs: 2, md: 3 },
            borderRadius: '12px',
            border: '1px solid',
            borderColor: 'divider',
            boxShadow: '0 3px 10px rgba(0,0,0,0.08)',
            bgcolor: 'white',
            overflow: 'hidden'
          }}
        >
          <Box sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 3,
            pb: 2,
            borderBottom: '1px solid',
            borderColor: 'divider'
          }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5
              }}
            >
              <School
                color="primary"
                fontSize="small"
                sx={{ fontSize: 22 }}
              />
              <Typography
                variant="h6"
                fontWeight="600"
                color="primary.dark"
              >
                Your Learning Journey
              </Typography>
            </Box>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                bgcolor: alpha(theme.palette.primary.main, 0.08),
                py: 0.5,
                px: 1.5,
                borderRadius: '8px'
              }}
            >
              <Typography
                variant="body2"
                fontWeight="600"
                color="primary.main"
                sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
              >
                <CheckCircle fontSize="small" />
                {Math.round(courseProgress?.overallProgress || 0)}% Complete
              </Typography>
            </Box>
          </Box>

          <Box sx={{
            maxWidth: '100%',
            overflowX: 'auto',
            pb: 1 // Add some padding at the bottom for the scrollbar
          }}>
            <CourseHorizontalMilestone
              courseId={courseId}
              course={course}
              onComponentClick={handleMilestoneClick}
            />
          </Box>
        </Card>
      )}

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