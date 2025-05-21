import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  Tooltip,
  Chip,
  Paper,
  useTheme,
  alpha
} from '@mui/material';
import {
  CheckCircle,
  RadioButtonUnchecked,
  PlayArrow,
  Lock,
  MenuBook,
  Assignment,
  Flag,
  EmojiEvents
} from '@mui/icons-material';
import { progressService } from '../../services/api';

const CourseMilestoneView = ({ courseId, course }) => {
  const theme = useTheme();
  const [courseProgress, setCourseProgress] = useState(null);
  const [componentProgresses, setComponentProgresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (courseId) {
      loadProgress();
    }
  }, [courseId]);

  const loadProgress = async () => {
    try {
      setLoading(true);
      const response = await progressService.getCourseProgress(courseId);
      setCourseProgress(response.data.courseProgress);
      
      // Sort components by their order
      const sortedComponents = [...response.data.componentProgresses].sort(
        (a, b) => a.order - b.order
      );
      
      setComponentProgresses(sortedComponents);
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
        return <Assignment fontSize="small" />;
      case 'MATERIAL':
        return <MenuBook fontSize="small" />;
      default:
        return <RadioButtonUnchecked fontSize="small" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'COMPLETED':
        return theme.palette.success.main;
      case 'IN_PROGRESS':
        return theme.palette.primary.main;
      case 'FAILED':
        return theme.palette.error.main;
      default:
        return theme.palette.grey[400];
    }
  };

  // Find the current active component (first non-completed component)
  const findActivePosition = () => {
    if (!componentProgresses.length) return 0;
    
    const inProgressIndex = componentProgresses.findIndex(cp => cp.status === 'IN_PROGRESS');
    if (inProgressIndex !== -1) return inProgressIndex;
    
    // If no component is in progress, find the first non-completed component
    const notCompletedIndex = componentProgresses.findIndex(cp => cp.status !== 'COMPLETED');
    return notCompletedIndex === -1 ? componentProgresses.length - 1 : notCompletedIndex;
  };

  // Format time for display
  const formatTime = (seconds) => {
    if (!seconds) return '0m';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };
  
  // Calculate how many components are locked
  const getLockedComponents = () => {
    if (!componentProgresses.length) return 0;
    
    let lockedCount = 0;
    let prevCompleted = true; // First component is always unlocked
    
    for (const comp of componentProgresses) {
      if (!prevCompleted && comp.status === 'NOT_STARTED') {
        lockedCount++;
      }
      prevCompleted = comp.status === 'COMPLETED';
    }
    
    return lockedCount;
  };

  // Check if a component is locked (requires previous component to be completed)
  const isComponentLocked = (index) => {
    if (index === 0) return false; // First component is never locked
    if (componentProgresses[index].status !== 'NOT_STARTED') return false; // Started components are not locked
    
    // Check if previous component is completed
    return index > 0 && componentProgresses[index-1]?.status !== 'COMPLETED';
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="200px">
        <CircularProgress size={40} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  const activePosition = findActivePosition();

  return (
    <Box sx={{ width: '100%' }}>
      {/* Overall Progress Stats */}
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Box sx={{ position: 'relative', display: 'inline-block', mb: 2 }}>
          <CircularProgress
            variant="determinate"
            value={courseProgress?.overallProgress || 0}
            size={100}
            thickness={5}
            sx={{ color: 'primary.main' }}
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
            <Typography variant="h4" component="div" fontWeight="bold">
              {Math.round(courseProgress?.overallProgress || 0)}%
            </Typography>
            <Typography variant="caption" color="text.secondary">
              COMPLETE
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 3, mb: 3 }}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h6" fontWeight="bold">
              {componentProgresses.filter(cp => cp.status === 'COMPLETED').length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              COMPLETED
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h6" fontWeight="bold">
              {componentProgresses.filter(cp => cp.status === 'IN_PROGRESS').length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              IN PROGRESS
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h6" fontWeight="bold">
              {getLockedComponents()}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              LOCKED
            </Typography>
          </Box>
        </Box>

        {courseProgress?.status === 'COMPLETED' && (
          <Chip
            icon={<EmojiEvents />}
            label="Course Completed!"
            color="success"
            sx={{ 
              fontWeight: 'bold',
              mb: 2,
              px: 2,
              py: 1,
              '& .MuiChip-label': { px: 1 }
            }}
          />
        )}
      </Box>

      {/* Milestone Timeline */}
      <Paper 
        elevation={0} 
        sx={{ 
          p: 3, 
          borderRadius: 2, 
          bgcolor: alpha(theme.palette.primary.main, 0.05),
          border: '1px solid',
          borderColor: 'divider'
        }}
      >
        <Typography variant="h6" fontWeight="bold" sx={{ mb: 3 }}>
          Your Learning Journey
        </Typography>

        {componentProgresses.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body2" color="text.secondary">
              Enroll in this course to begin your learning journey.
            </Typography>
          </Box>
        ) : (
          <Box sx={{ position: 'relative', px: 2, py: 1 }}>
            {/* Timeline Track */}
            <Box
              sx={{
                position: 'absolute',
                top: '50%',
                left: 0,
                right: 0,
                height: 6,
                backgroundColor: alpha(theme.palette.grey[400], 0.3),
                borderRadius: 3,
                zIndex: 0
              }}
            />
            
            {/* Completed Progress Track */}
            <Box
              sx={{
                position: 'absolute',
                top: '50%',
                left: 0,
                width: `${Math.min(100, courseProgress?.overallProgress || 0)}%`,
                height: 6,
                backgroundColor: theme.palette.success.main,
                borderRadius: 3,
                zIndex: 1,
                transition: 'width 1s ease-in-out'
              }}
            />

            {/* Milestone Points */}
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                position: 'relative',
                zIndex: 2,
                minHeight: 180
              }}
            >
              {componentProgresses.map((component, index) => {
                const isLocked = isComponentLocked(index);
                const isActive = index === activePosition && component.status !== 'COMPLETED';
                const statusColor = getStatusColor(component.status);
                
                return (
                  <Tooltip
                    key={component.id}
                    title={
                      <Box sx={{ p: 1 }}>
                        <Typography variant="subtitle2">{component.componentTitle}</Typography>
                        <Typography variant="caption" display="block">
                          Type: {component.componentType.replace('_', ' ')}
                        </Typography>
                        <Typography variant="caption" display="block">
                          Status: {component.status.replace('_', ' ')}
                        </Typography>
                        {component.timeSpentSeconds > 0 && (
                          <Typography variant="caption" display="block">
                            Time spent: {formatTime(component.timeSpentSeconds)}
                          </Typography>
                        )}
                        {isLocked && (
                          <Typography variant="caption" color="error.light" display="block">
                            Complete previous component to unlock
                          </Typography>
                        )}
                      </Box>
                    }
                    arrow
                    placement={index % 2 === 0 ? "top" : "bottom"}
                  >
                    <Box
                      sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: index % 2 === 0 ? 'flex-end' : 'flex-start',
                        paddingBottom: index % 2 === 0 ? 0 : '60px',
                        paddingTop: index % 2 === 0 ? '60px' : 0,
                        width: `${100 / componentProgresses.length}%`,
                        position: 'relative'
                      }}
                    >
                      {/* Milestone Node */}
                      <Box
                        sx={{
                          width: isActive ? 42 : 36,
                          height: isActive ? 42 : 36,
                          borderRadius: '50%',
                          backgroundColor: isLocked 
                            ? alpha(theme.palette.grey[500], 0.2) 
                            : alpha(statusColor, 0.1),
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: '2px solid',
                          borderColor: isLocked ? 'grey.300' : statusColor,
                          boxShadow: isActive ? `0 0 0 4px ${alpha(theme.palette.primary.main, 0.2)}` : 'none',
                          zIndex: 3,
                          marginBottom: index % 2 === 0 ? 2 : 0,
                          marginTop: index % 2 === 0 ? 0 : 2,
                          transition: 'all 0.3s ease'
                        }}
                      >
                        {component.status === 'COMPLETED' ? (
                          <CheckCircle sx={{ color: theme.palette.success.main }} />
                        ) : isLocked ? (
                          <Lock sx={{ color: theme.palette.grey[500] }} />
                        ) : component.status === 'IN_PROGRESS' ? (
                          <PlayArrow sx={{ color: theme.palette.primary.main }} />
                        ) : (
                          getComponentIcon(component.componentType)
                        )}
                      </Box>

                      {/* Node Label */}
                      <Box
                        sx={{
                          position: 'absolute',
                          top: index % 2 === 0 ? 0 : 'auto', 
                          bottom: index % 2 === 0 ? 'auto' : 0,
                          left: '50%',
                          transform: 'translateX(-50%)',
                          width: 'max-content',
                          maxWidth: '120px',
                          textAlign: 'center',
                          mt: index % 2 === 0 ? 0 : 2,
                          mb: index % 2 === 0 ? 2 : 0
                        }}
                      >
                        <Typography
                          variant="caption"
                          sx={{
                            display: 'block',
                            fontWeight: isActive ? 'bold' : 'normal',
                            color: isLocked ? 'text.disabled' : 'text.primary',
                            mb: 0.5,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {component.componentTitle}
                        </Typography>
                        
                        <Chip
                          label={component.componentType.split('_')[0]}
                          size="small"
                          sx={{
                            height: 20,
                            '& .MuiChip-label': { 
                              px: 1, 
                              fontSize: '0.65rem',
                              opacity: isLocked ? 0.6 : 1 
                            }
                          }}
                          variant={isLocked ? "outlined" : "filled"}
                          color={
                            isLocked ? "default" :
                            component.status === 'COMPLETED' ? "success" :
                            component.status === 'IN_PROGRESS' ? "primary" :
                            component.status === 'FAILED' ? "error" : "default"
                          }
                        />
                      </Box>
                    </Box>
                  </Tooltip>
                );
              })}
            </Box>

            {/* Finish Flag */}
            <Box
              sx={{
                position: 'absolute',
                right: -10,
                top: '50%',
                transform: 'translateY(-50%)',
                zIndex: 5,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Flag 
                sx={{ 
                  color: courseProgress?.status === 'COMPLETED' 
                    ? theme.palette.success.main 
                    : theme.palette.grey[400],
                  fontSize: 28 
                }} 
              />
            </Box>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default CourseMilestoneView;