import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  LinearProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  CircularProgress,
  Divider,
  Avatar
} from '@mui/material';
import {
  Assessment as AssessmentIcon,
  Description as MaterialIcon,
  CheckCircle as CompletedIcon,
  CheckCircle,
  RadioButtonUnchecked as PendingIcon,
  HourglassEmpty as InProgressIcon,
  Cancel as FailedIcon,
  School,
  Timer,
  CalendarToday
} from '@mui/icons-material';
import { progressService } from '../../services/api';

const CourseProgressView = ({ courseId }) => {
  const [courseProgress, setCourseProgress] = useState(null);
  const [componentProgresses, setComponentProgresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadProgress();
  }, [courseId]);

  const loadProgress = async () => {
    try {
      setLoading(true);
      const response = await progressService.getCourseProgress(courseId);
      setCourseProgress(response.data.courseProgress);
      setComponentProgresses(response.data.componentProgresses);
      setLoading(false);
    } catch (error) {
      console.error('Error loading progress:', error);
      if (error.response?.status === 404) {
        // User not enrolled yet
        setCourseProgress(null);
        setComponentProgresses([]);
      } else {
        setError('Failed to load progress data');
      }
      setLoading(false);
    }
  };

  const getComponentIcon = (type) => {
    switch (type) {
      case 'PRE_ASSESSMENT':
      case 'POST_ASSESSMENT':
        return <AssessmentIcon />;
      case 'MATERIAL':
        return <MaterialIcon />;
      default:
        return <PendingIcon />;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'COMPLETED':
        return <CompletedIcon color="success" />;
      case 'IN_PROGRESS':
        return <InProgressIcon color="primary" />;
      case 'FAILED':
        return <FailedIcon color="error" />;
      default:
        return <PendingIcon color="disabled" />;
    }
  };

  const getStatusChip = (status) => {
    const statusConfig = {
      'NOT_STARTED': { label: 'Not Started', color: 'default' },
      'IN_PROGRESS': { label: 'In Progress', color: 'primary' },
      'COMPLETED': { label: 'Completed', color: 'success' },
      'FAILED': { label: 'Failed', color: 'error' }
    };
    
    const config = statusConfig[status] || statusConfig['NOT_STARTED'];
    return <Chip size="small" label={config.label} color={config.color} />;
  };

  const formatTime = (seconds) => {
    if (!seconds) return '0m';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="300px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent>
          <Typography color="error">{error}</Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card elevation={2}>
      <CardContent>
        {/* Overall Progress Section */}
        <Box mb={4}>
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
            <Box display="flex" alignItems="center">
              <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                <School />
              </Avatar>
              <Box>
                <Typography variant="h6">
                  Course Progress
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {courseProgress?.status || 'Not Started'}
                </Typography>
              </Box>
            </Box>
            <Box textAlign="right">
              <Typography variant="h4" color="primary.main" fontWeight="bold">
                {Math.round(courseProgress?.overallProgress || 0)}%
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Complete
              </Typography>
            </Box>
          </Box>
          
          <LinearProgress 
            variant="determinate" 
            value={courseProgress?.overallProgress || 0}
            sx={{ height: 12, borderRadius: 6 }}
          />
          
          {/* Course Stats */}
          <Box display="flex" gap={2} mt={2}>
            <Chip
              icon={<CalendarToday />}
              label={`Enrolled: ${formatDate(courseProgress?.enrollmentDate)}`}
              size="small"
              variant="outlined"
            />
            {courseProgress?.completedDate && (
              <Chip
                icon={<CheckCircle />}
                label={`Completed: ${formatDate(courseProgress.completedDate)}`}
                size="small"
                variant="outlined"
                color="success"
              />
            )}
          </Box>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Components Progress */}
        <Typography variant="subtitle1" gutterBottom fontWeight="medium">
          Components Progress
        </Typography>
        
        <List>
          {componentProgresses.map((cp) => (
            <ListItem 
              key={cp.id}
              sx={{ 
                borderRadius: 1,
                mb: 1,
                backgroundColor: cp.status === 'COMPLETED' ? 'success.lighter' : 'background.paper',
                '&:hover': {
                  backgroundColor: cp.status === 'COMPLETED' ? 'success.lighter' : 'action.hover'
                }
              }}
            >
              <ListItemIcon>
                {getStatusIcon(cp.status)}
              </ListItemIcon>
              <ListItemIcon>
                {getComponentIcon(cp.componentType)}
              </ListItemIcon>
              <Box sx={{ flexGrow: 1 }}>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Typography variant="body1">
                    {cp.componentTitle || cp.componentType}
                  </Typography>
                  {getStatusChip(cp.status)}
                </Box>
                <Typography variant="caption" color="text.secondary" component="div" mt={0.5}>
                  Progress: {Math.round(cp.progressPercentage || 0)}%
                  {' • '}
                  Time spent: {formatTime(cp.timeSpentSeconds)}
                  {cp.completedAt && (
                    <>
                      {' • '}
                      Completed: {formatDate(cp.completedAt)}
                    </>
                  )}
                </Typography>
              </Box>
            </ListItem>
          ))}
        </List>
        
        {componentProgresses.length === 0 && (
          <Box textAlign="center" py={3}>
            <Typography variant="body2" color="text.secondary">
              No components started yet
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default CourseProgressView;