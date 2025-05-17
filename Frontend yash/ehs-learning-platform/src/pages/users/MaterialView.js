import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Button,
  Box,
  LinearProgress,
  Alert,
  CircularProgress,
  IconButton,
  Chip
} from '@mui/material';
import {
  ArrowBack,
  CheckCircle,
  Timer,
  NavigateBefore,
  NavigateNext
} from '@mui/icons-material';
import { courseService, progressService } from '../../services/api';
import CourseMaterialViewer from '../../components/CourseMaterialViewer';

const MaterialView = () => {
  const { courseId, componentId } = useParams();
  const navigate = useNavigate();
  const [component, setComponent] = useState(null);
  const [progress, setProgress] = useState(null);
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeSpent, setTimeSpent] = useState(0);
  const [viewProgress, setViewProgress] = useState(0);
  const startTimeRef = useRef(null);
  const updateIntervalRef = useRef(null);

  useEffect(() => {
    loadMaterialData();
    startTimeTracking();

    return () => {
      stopTimeTracking();
    };
  }, [componentId]);

  const loadMaterialData = async () => {
    try {
      setLoading(true);
      
      // Get course and component details
      const courseResponse = await courseService.getUserCourseById(courseId);
      setCourse(courseResponse.data);
      
      // Find the specific component
      const componentData = courseResponse.data.components.find(c => c.id === componentId);
      if (!componentData) {
        throw new Error('Component not found');
      }
      setComponent(componentData);
      
      // Get progress data
      const progressResponse = await progressService.getCourseProgress(courseId);
      const componentProgress = progressResponse.data.componentProgresses.find(
        cp => cp.componentId === componentId
      );
      setProgress(componentProgress);
      
      // Start the component if not started
      if (componentProgress?.status === 'NOT_STARTED') {
        await progressService.startComponent(componentId);
      }
      
      setTimeSpent(componentProgress?.timeSpentSeconds || 0);
      setViewProgress(componentProgress?.progressPercentage || 0);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load material');
    } finally {
      setLoading(false);
    }
  };

  const startTimeTracking = () => {
    startTimeRef.current = Date.now();
    
    // Update time spent every 30 seconds
    updateIntervalRef.current = setInterval(async () => {
      const additionalSeconds = Math.floor((Date.now() - startTimeRef.current) / 1000);
      if (additionalSeconds > 0) {
        try {
          await progressService.updateTimeSpent(componentId, additionalSeconds);
          setTimeSpent(prev => prev + additionalSeconds);
          startTimeRef.current = Date.now();
        } catch (err) {
          console.error('Failed to update time spent:', err);
        }
      }
    }, 30000); // 30 seconds
  };

  const stopTimeTracking = async () => {
    if (updateIntervalRef.current) {
      clearInterval(updateIntervalRef.current);
    }
    
    // Update remaining time
    if (startTimeRef.current) {
      const additionalSeconds = Math.floor((Date.now() - startTimeRef.current) / 1000);
      if (additionalSeconds > 0) {
        try {
          await progressService.updateTimeSpent(componentId, additionalSeconds);
        } catch (err) {
          console.error('Failed to update final time spent:', err);
        }
      }
    }
  };

  const handleProgressUpdate = async (newProgress) => {
    try {
      await progressService.updateComponentProgress(componentId, newProgress);
      setViewProgress(newProgress);
      
      // If material is completed
      if (newProgress >= 100 && progress?.status !== 'COMPLETED') {
        await progressService.completeComponent(componentId);
        setProgress(prev => ({ ...prev, status: 'COMPLETED' }));
      }
    } catch (err) {
      console.error('Failed to update progress:', err);
    }
  };

  const handleComplete = async () => {
    try {
      await progressService.completeComponent(componentId);
      navigate(`/course/${courseId}`);
    } catch (err) {
      setError('Failed to complete material');
    }
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
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
        <Button variant="contained" onClick={() => navigate(`/course/${courseId}`)} sx={{ mt: 2 }}>
          Back to Course
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box display="flex" alignItems="center" mb={3}>
        <IconButton onClick={() => navigate(`/course/${courseId}`)} sx={{ mr: 2 }}>
          <ArrowBack />
        </IconButton>
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h5" component="h1">
            {component?.data?.title || 'Training Material'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {course?.title}
          </Typography>
        </Box>
        <Box display="flex" gap={2} alignItems="center">
          <Chip
            icon={<Timer />}
            label={formatTime(timeSpent)}
            variant="outlined"
          />
          {progress?.status === 'COMPLETED' && (
            <Chip
              icon={<CheckCircle />}
              label="Completed"
              color="success"
            />
          )}
        </Box>
      </Box>

      {/* Progress Bar */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
          <Typography variant="body2">Progress</Typography>
          <Typography variant="body2">{Math.round(viewProgress)}%</Typography>
        </Box>
        <LinearProgress
          variant="determinate"
          value={viewProgress}
          sx={{ height: 8, borderRadius: 4 }}
        />
      </Paper>

      {/* Material Viewer */}
      <Paper sx={{ p: 3, mb: 3 }}>
        {component?.data?.materialFileId ? (
          <CourseMaterialViewer
            materialId={component.data.materialFileId}
            onProgressUpdate={handleProgressUpdate}
            initialProgress={viewProgress}
          />
        ) : component?.data?.fileId ? (
          <CourseMaterialViewer
            materialId={component.data.fileId}
            onProgressUpdate={handleProgressUpdate}
            initialProgress={viewProgress}
          />
        ) : (
          <Alert severity="warning">No material content available</Alert>
        )}
      </Paper>

      {/* Navigation */}
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Button
          variant="outlined"
          startIcon={<NavigateBefore />}
          onClick={() => navigate(`/course/${courseId}`)}
        >
          Back to Course
        </Button>
        {viewProgress >= 100 && (
          <Button
            variant="contained"
            endIcon={<CheckCircle />}
            onClick={handleComplete}
          >
            Complete & Continue
          </Button>
        )}
      </Box>
    </Container>
  );
};

export default MaterialView;