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
  ArrowBack
} from '@mui/icons-material';
import { courseService, progressService } from '../../services/api';
import CourseProgressView from '../../components/progress/CourseProgressView';

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
                                    <Button
                                      variant={comp.status === 'COMPLETED' ? 'outlined' : 'contained'}
                                      startIcon={comp.status === 'COMPLETED' ? <Refresh /> : <PlayArrow />}
                                      onClick={() => handleStartComponent(component.id, component.type)}
                                      fullWidth
                                      disabled={justEnrolled}
                                    >
                                      {justEnrolled ? 'Loading...' :
                                       comp.status === 'COMPLETED' ? 'Review' : 
                                       comp.status === 'IN_PROGRESS' ? 'Continue' : 'Start'}
                                    </Button>
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
    </Container>
  );
};

export default CourseView;