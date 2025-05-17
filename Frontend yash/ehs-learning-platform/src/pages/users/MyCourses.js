import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Grid,
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Box,
  LinearProgress,
  Chip,
  CircularProgress,
  Alert,
  FormControlLabel,
  Switch,
  Tab,
  Tabs,
  Avatar
} from '@mui/material';
import {
  School,
  PlayArrow,
  CheckCircle,
  Schedule,
  Domain as DomainIcon,
  FilterList
} from '@mui/icons-material';
import { courseService, progressService, assessmentService } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import IncompleteAttemptWarning from '../../components/assessment/IncompleteAttemptWarning';

const MyCourses = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [courses, setCourses] = useState([]);
  const [userProgress, setUserProgress] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAllDomains, setShowAllDomains] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [switchLoading, setSwitchLoading] = useState(false);
  const [showIncompleteWarning, setShowIncompleteWarning] = useState(false);

  useEffect(() => {
    loadUserCourses();
    checkIncompleteAttempts();
  }, [showAllDomains]);
  
  const checkIncompleteAttempts = async () => {
    try {
      const response = await assessmentService.getIncompleteAttempts();
      if (response.data.hasIncomplete) {
        setShowIncompleteWarning(true);
      }
    } catch (error) {
      console.error('Error checking incomplete attempts:', error);
    }
  };

  const loadUserCourses = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get user courses with domain filter
      const params = { 
        showAll: showAllDomains,
        page: 1,
        limit: 20
      };
      const coursesResponse = await courseService.getUserCourses(params);
      setCourses(coursesResponse.data.courses || []);
      
      // Get user progress for all courses
      try {
        const progressResponse = await progressService.getUserCourseProgress();
        const progressMap = {};
        if (progressResponse.data.progresses && Array.isArray(progressResponse.data.progresses)) {
          progressResponse.data.progresses.forEach(p => {
            progressMap[p.courseId] = p;
          });
        }
        setUserProgress(progressMap);
      } catch (progressErr) {
        console.warn('Could not load progress:', progressErr);
        // Continue without progress data
        setUserProgress({});
      }
      
    } catch (err) {
      console.error('Error loading courses:', err);
      setError(err.response?.data?.message || 'Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  const handleStartCourse = (courseId) => {
    navigate(`/course/${courseId}`);
  };

  const getCourseStatus = (course) => {
    const progress = userProgress[course.id];
    if (!progress) return 'NOT_ENROLLED';
    if (progress.status === 'COMPLETED') return 'COMPLETED';
    if (progress.overallProgress > 0) return 'IN_PROGRESS';
    return 'ENROLLED';
  };

  const renderCourseCard = (course) => {
    if (!course || !course.id) {
      return null;
    }
    
    const progress = userProgress[course.id];
    const status = getCourseStatus(course);
    
    return (
      <Grid item xs={12} sm={6} md={4} key={course.id}>
        <Card 
          sx={{ 
            height: '100%', 
            display: 'flex', 
            flexDirection: 'column',
            position: 'relative',
            '&:hover': {
              boxShadow: 3
            }
          }}
        >
          {status === 'COMPLETED' && (
            <Box
              sx={{
                position: 'absolute',
                top: 10,
                right: 10,
                zIndex: 1
              }}
            >
              <CheckCircle color="success" />
            </Box>
          )}
          
          <CardContent sx={{ flexGrow: 1 }}>
            <Box display="flex" alignItems="center" mb={2}>
              <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                <School />
              </Avatar>
              <Box flexGrow={1}>
                <Typography variant="h6" component="h2" gutterBottom>
                  {course.title || 'Untitled Course'}
                </Typography>
                <Box display="flex" gap={1} flexWrap="wrap">
                  <Chip 
                    icon={<DomainIcon />}
                    label={course.domain?.name} 
                    size="small" 
                    color="primary" 
                    variant="outlined"
                  />
                  {course.componentCount && (
                    <Chip 
                      label={`${course.componentCount} components`} 
                      size="small" 
                      variant="outlined"
                    />
                  )}
                </Box>
              </Box>
            </Box>
            
            <Typography variant="body2" color="text.secondary" paragraph>
              {course.description}
            </Typography>
            
            {progress && (
              <Box mt={2}>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="caption" color="text.secondary">
                    Progress
                  </Typography>
                  <Typography variant="caption" fontWeight="bold">
                    {Math.round(progress.overallProgress || 0)}%
                  </Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={progress.overallProgress || 0}
                  sx={{ height: 6, borderRadius: 3 }}
                />
                {progress && progress.completedComponents > 0 && (
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                    {progress.completedComponents} of {course.componentCount} completed
                  </Typography>
                )}
              </Box>
            )}
          </CardContent>
          
          <CardActions sx={{ p: 2, pt: 0 }}>
            <Button
              variant="contained"
              startIcon={status === 'NOT_ENROLLED' ? <School /> : <PlayArrow />}
              onClick={() => handleStartCourse(course.id)}
              fullWidth
            >
              {status === 'NOT_ENROLLED' ? 'Enroll' :
               status === 'COMPLETED' ? 'Review' :
               status === 'IN_PROGRESS' ? 'Continue' : 'Start'}
            </Button>
          </CardActions>
        </Card>
      </Grid>
    );
  };

  const filteredCourses = () => {
    switch (activeTab) {
      case 1: // In Progress
        return courses.filter(course => {
          const status = getCourseStatus(course);
          return status === 'IN_PROGRESS' || status === 'ENROLLED';
        });
      case 2: // Completed
        return courses.filter(course => getCourseStatus(course) === 'COMPLETED');
      default: // All
        return courses;
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
      </Container>
    );
  }

  const displayCourses = filteredCourses();

  return (
    <>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box mb={4}>
        <Typography variant="h4" component="h1" gutterBottom>
          My Courses
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {currentUser?.domains && currentUser.domains.length > 0 
            ? `Courses for ${currentUser.domains.map(d => d.name).join(', ')}` 
            : 'Available Courses'}
        </Typography>
      </Box>

      {/* Filters and Tabs */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)}>
          <Tab label={`All (${courses.length})`} />
          <Tab 
            label={`In Progress (${courses.filter(c => {
              const status = getCourseStatus(c);
              return status === 'IN_PROGRESS' || status === 'ENROLLED';
            }).length})`} 
          />
          <Tab 
            label={`Completed (${courses.filter(c => getCourseStatus(c) === 'COMPLETED').length})`} 
          />
        </Tabs>
        
        <FormControlLabel
          control={
            <Switch 
              checked={showAllDomains} 
              onChange={(e) => setShowAllDomains(e.target.checked)}
              disabled={loading}
            />
          }
          label="Show all domains"
          sx={{ ml: 2 }}
        />
      </Box>

      {/* Course Grid */}
      {displayCourses.length > 0 ? (
        <Grid container spacing={3}>
          {displayCourses.map(course => renderCourseCard(course))}
        </Grid>
      ) : (
        <Box textAlign="center" py={8}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No courses found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {activeTab === 1 ? "You haven't started any courses yet." :
             activeTab === 2 ? "You haven't completed any courses yet." :
             "No courses are available at the moment."}
          </Typography>
        </Box>
      )}
      </Container>
      
      <IncompleteAttemptWarning 
        open={showIncompleteWarning} 
        onClose={() => setShowIncompleteWarning(false)}
      />
    </>
  );
};

export default MyCourses;