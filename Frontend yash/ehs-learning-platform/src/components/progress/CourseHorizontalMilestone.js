import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  Tooltip,
  Paper,
  useTheme,
  alpha,
  IconButton
} from '@mui/material';
import {
  CheckCircle,
  PlayArrow,
  Lock,
  MenuBook,
  Assignment,
  School
} from '@mui/icons-material';
import { progressService } from '../../services/api';

const CourseHorizontalMilestone = ({ courseId, course, onComponentClick }) => {
  const theme = useTheme();
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
        return <School fontSize="small" />;
    }
  };

  // Find the current active component (first non-completed component)
  const findActivePosition = () => {
    if (!componentProgresses.length) return -1;

    const inProgressIndex = componentProgresses.findIndex(cp => cp.status === 'IN_PROGRESS');
    if (inProgressIndex !== -1) return inProgressIndex;

    // If no component is in progress, find the first non-completed component
    const notCompletedIndex = componentProgresses.findIndex(cp => cp.status !== 'COMPLETED');
    return notCompletedIndex === -1 ? componentProgresses.length - 1 : notCompletedIndex;
  };

  // Check if a component is locked (requires previous component to be completed)
  const isComponentLocked = (index) => {
    if (index === 0) return false; // First component is never locked
    if (componentProgresses[index].status !== 'NOT_STARTED') return false; // Started components are not locked

    // Check if previous component is completed
    return index > 0 && componentProgresses[index-1]?.status !== 'COMPLETED';
  };

  // Handle click on a component
  const handleComponentClick = (component, isLocked) => {
    if (onComponentClick && !isLocked) {
      onComponentClick(component);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="80px">
        <CircularProgress size={24} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box py={1}>
        <Typography color="error" variant="caption">{error}</Typography>
      </Box>
    );
  }

  const activePosition = findActivePosition();

  return (
    <Box sx={{ width: '100%', position: 'relative' }}>
      {/* Milestone Timeline */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          pt: 4,
          pb: 5,
          borderRadius: 2,
          bgcolor: alpha(theme.palette.primary.main, 0.03),
          border: '1px solid',
          borderColor: 'divider',
          overflow: 'hidden',
          position: 'relative'
        }}
      >
        {componentProgresses.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Enroll to start your learning journey
            </Typography>
          </Box>
        ) : (
          <Box sx={{ position: 'relative' }}>
            {/* Main Timeline Track */}
            <Box
              sx={{
                position: 'absolute',
                top: 35,
                left: 10,
                right: 10,
                height: 8,
                backgroundColor: alpha(theme.palette.grey[300], 0.4),
                borderRadius: 4,
                zIndex: 1
              }}
            />

            {/* Completed Progress Track */}
            <Box
              sx={{
                position: 'absolute',
                top: 35,
                left: 10,
                width: componentProgresses.length > 1
                  ? `calc(${(Math.max(0, activePosition) / (componentProgresses.length - 1)) * 100}% - 10px)`
                  : '0%',
                height: 8,
                borderRadius: 4,
                background: `linear-gradient(90deg,
                  ${theme.palette.primary.main} 0%,
                  ${alpha(theme.palette.primary.light, 0.8)} 100%)`,
                boxShadow: `0 2px 6px ${alpha(theme.palette.primary.main, 0.4)}`,
                zIndex: 2,
                transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
            />

            {/* Milestone Nodes */}
            <Box sx={{
              display: 'flex',
              justifyContent: 'space-between',
              position: 'relative',
              minHeight: 110,
              px: 2
            }}>
              {componentProgresses.map((component, index) => {
                const isLocked = isComponentLocked(index);
                const isActive = index === activePosition;
                const isCompleted = component.status === 'COMPLETED';

                return (
                  <Tooltip
                    key={component.id}
                    title={component.componentTitle}
                    placement="top"
                  >
                    <Box
                      sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        width: `${100 / componentProgresses.length}%`,
                        position: 'relative',
                        zIndex: 5,
                        cursor: isLocked ? 'not-allowed' : 'pointer'
                      }}
                      onClick={() => handleComponentClick(component, isLocked)}
                    >
                      {/* Milestone Node */}
                      <Box
                        sx={{
                          width: 50,
                          height: 50,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          zIndex: 10
                        }}
                      >
                        <IconButton
                          disabled={isLocked}
                          sx={{
                            width: isActive ? 48 : 40,
                            height: isActive ? 48 : 40,
                            backgroundColor: isCompleted
                              ? theme.palette.success.main
                              : isActive
                                ? theme.palette.primary.main
                                : 'white',
                            border: '2px solid',
                            borderColor: isLocked
                              ? theme.palette.grey[300]
                              : isCompleted
                                ? theme.palette.success.main
                                : isActive
                                  ? theme.palette.primary.main
                                  : theme.palette.grey[300],
                            boxShadow: isActive
                              ? `0 0 0 4px ${alpha(theme.palette.primary.main, 0.2)}`
                              : isCompleted
                                ? `0 3px 10px ${alpha(theme.palette.success.main, 0.3)}`
                                : `0 2px 6px ${alpha(theme.palette.grey[500], 0.2)}`,
                            color: isLocked
                              ? theme.palette.grey[400]
                              : isCompleted || isActive
                                ? 'white'
                                : theme.palette.grey[700],
                            transform: isActive ? 'scale(1.1)' : 'scale(1)',
                            transition: 'all 0.3s ease',
                            '&:hover': {
                              backgroundColor: isLocked
                                ? 'white'
                                : isCompleted
                                  ? theme.palette.success.main
                                  : isActive
                                    ? theme.palette.primary.main
                                    : alpha(theme.palette.grey[100], 0.9),
                              transform: isLocked ? 'scale(1)' : 'scale(1.08)'
                            }
                          }}
                        >
                          {isCompleted ? (
                            <CheckCircle />
                          ) : isLocked ? (
                            <Lock />
                          ) : isActive ? (
                            <PlayArrow />
                          ) : (
                            getComponentIcon(component.componentType)
                          )}
                        </IconButton>
                      </Box>

                      {/* Component Type Label - Small text beneath node */}
                      <Typography
                        variant="caption"
                        sx={{
                          color: isLocked
                            ? theme.palette.text.disabled
                            : isActive
                              ? theme.palette.primary.main
                              : isCompleted
                                ? theme.palette.success.main
                                : theme.palette.text.secondary,
                          fontSize: '0.7rem',
                          fontWeight: isActive ? 'bold' : 'medium',
                          mt: 1.5,
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px'
                        }}
                      >
                        {index + 1}. {component.componentType === 'MATERIAL' ? 'Material' :
                         component.componentType === 'PRE_ASSESSMENT' ? 'Pre-Assess' :
                         component.componentType === 'POST_ASSESSMENT' ? 'Post-Assess' :
                         'Step'}
                      </Typography>
                    </Box>
                  </Tooltip>
                );
              })}
            </Box>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default CourseHorizontalMilestone;