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
  Avatar,
  Paper,
  ButtonGroup,
  IconButton,
  useTheme,
  useMediaQuery,
  Tooltip,
  Divider
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
  School,
  PlayArrow,
  CheckCircle,
  Domain as DomainIcon,
  FilterList,
  ViewModule,
  ViewList,
  Search,
  Warning,
  Schedule,
  StarBorder,
  Star,
  LocalFireDepartment,
  VerifiedUser,
  Engineering,
  Visibility
} from '@mui/icons-material';
import { courseService, progressService, assessmentService } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import IncompleteAttemptWarning from '../../components/assessment/IncompleteAttemptWarning';

const MyCourses = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { currentUser } = useAuth();
  const [courses, setCourses] = useState([]);
  const [userProgress, setUserProgress] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAllDomains, setShowAllDomains] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [switchLoading, setSwitchLoading] = useState(false);
  const [showIncompleteWarning, setShowIncompleteWarning] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'

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

  // Get appropriate icon based on course domain
  const getCourseIcon = (course) => {
    if (!course.domain?.name && !course.title) return <School color="primary" />;

    const text = (course.domain?.name || course.title).toLowerCase();

    if (text.includes('fire') || text.includes('emergency'))
      return <LocalFireDepartment sx={{ color: theme.palette.error.main }} />;
    if (text.includes('safety') || text.includes('security'))
      return <VerifiedUser sx={{ color: theme.palette.success.main }} />;
    if (text.includes('health') || text.includes('medical'))
      return <Engineering sx={{ color: theme.palette.info.main }} />;

    return <School sx={{ color: theme.palette.primary.main }} />;
  };


  const renderCourseCard = (course) => {
    if (!course || !course.id) {
      return null;
    }

    const progress = userProgress[course.id];
    const status = getCourseStatus(course);

    // Grid view
    if (viewMode === 'grid') {
      return (
        <Grid item xs={12} sm={4} key={course.id} sx={{
          p: 1,
          // Fixed width to ensure exactly 3 per row
          flexBasis: '33.33%',
          maxWidth: '33.33%'
        }}>
          <Card
            sx={{
              height: '100%',
              width: 'calc(100% - 16px)', // Add slight spacing between cards
              m: 1, // Add margin for spacing
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              borderRadius: 2,
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              transition: 'all 0.25s ease-in-out',
              position: 'relative',
              '&:hover': {
                boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                transform: 'translateY(-4px)'
              }
            }}
          >
            <Box
              sx={{
                height: 120,
                position: 'relative',
                backgroundColor: 'white',
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'center',
                p: 2
              }}
            >
              <Avatar
                sx={{
                  width: 80,
                  height: 80,
                  bgcolor: 'white',
                  color: theme.palette.primary.main,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  position: 'absolute',
                  bottom: -40,
                  border: '4px solid white'
                }}
              >
                {getCourseIcon(course)}
              </Avatar>

              {status === 'COMPLETED' && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: 16,
                    right: 16,
                    bgcolor: theme.palette.success.main,
                    color: 'white',
                    borderRadius: '50%',
                    width: 32,
                    height: 32,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <CheckCircle />
                </Box>
              )}

              <Tooltip title="Add to favorites">
                <IconButton
                  size="small"
                  sx={{
                    position: 'absolute',
                    top: 16,
                    left: 16,
                    color: 'white',
                    bgcolor: 'rgba(0,0,0,0.2)',
                    '&:hover': { bgcolor: 'rgba(0,0,0,0.4)' }
                  }}
                >
                  <StarBorder />
                </IconButton>
              </Tooltip>
            </Box>

            <CardContent sx={{ pt: 6, flexGrow: 1, px: 3 }}>
              <Box textAlign="center" mb={2}>
                <Typography variant="h6" fontWeight={600} gutterBottom sx={{
                  // Ensure title doesn't affect card width with proper overflow handling
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical'
                }}>
                  {course.title || 'Untitled Course'}
                </Typography>

                {course.domain?.name && (
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {course.domain.name}
                  </Typography>
                )}
              </Box>


              {progress && (
                <Box mt={3}>
                  <Box display="flex" justifyContent="space-between" mb={1} alignItems="center">
                    <Typography variant="body2" color="text.secondary">
                      Progress
                    </Typography>
                    <Typography variant="body2" fontWeight="bold" color="primary.main">
                      {Math.round(progress.overallProgress || 0)}%
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={progress.overallProgress || 0}
                    sx={{
                      height: 6,
                      borderRadius: 3,
                      bgcolor: alpha(theme.palette.primary.main, 0.1)
                    }}
                  />
                  {progress.completedComponents > 0 && (
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block', textAlign: 'right' }}>
                      {progress.completedComponents} of {course.componentCount} completed
                    </Typography>
                  )}
                </Box>
              )}
            </CardContent>

            <CardActions sx={{ p: 3, pt: 0 }}>
              <Button
                variant="contained"
                startIcon={status === 'COMPLETED' ? <CheckCircle /> : <PlayArrow />}
                onClick={() => handleStartCourse(course.id)}
                fullWidth
                sx={{
                  borderRadius: 6,
                  py: 1,
                  bgcolor: status === 'COMPLETED' ? theme.palette.success.main : theme.palette.primary.main,
                  '&:hover': {
                    bgcolor: status === 'COMPLETED' ? theme.palette.success.dark : theme.palette.primary.dark
                  }
                }}
              >
                {status === 'NOT_ENROLLED' ? 'Enroll' :
                 status === 'COMPLETED' ? 'Review' :
                 status === 'IN_PROGRESS' ? 'Continue' : 'Start'}
              </Button>
            </CardActions>
          </Card>
        </Grid>
      );
    }

    // List view
    return (
      <Grid item key={course.id}>
        <Card
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            borderRadius: 2,
            overflow: 'hidden',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            transition: 'all 0.25s ease-in-out',
            width: '100%',
            mb: 1,
            '&:hover': {
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              transform: 'translateY(-2px)'
            }
          }}
        >
          <Box
            sx={{
              width: { xs: '100%', sm: 200 },
              height: { xs: 100, sm: 'auto' },
              backgroundColor: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative'
            }}
          >
            <Avatar
              sx={{
                width: 70,
                height: 70,
                bgcolor: 'white',
                color: theme.palette.primary.main,
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
              }}
            >
              {getCourseIcon(course)}
            </Avatar>

            {status === 'COMPLETED' && (
              <Box
                sx={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  bgcolor: theme.palette.success.main,
                  color: 'white',
                  borderRadius: '50%',
                  width: 24,
                  height: 24,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <CheckCircle fontSize="small" />
              </Box>
            )}
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
            <CardContent sx={{ flexGrow: 1 }}>
              <Box>
                <Typography variant="h6" fontWeight={600} gutterBottom sx={{
                  // Ensure title doesn't affect card width with proper overflow handling
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  maxWidth: '100%'
                }}>
                  {course.title || 'Untitled Course'}
                </Typography>
                {course.domain?.name && (
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {course.domain.name}
                  </Typography>
                )}
              </Box>


              {progress && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{ flexGrow: 1 }}>
                    <Box display="flex" justifyContent="space-between" mb={0.5}>
                      <Typography variant="body2" color="text.secondary">
                        Progress
                      </Typography>
                      <Typography variant="body2" fontWeight="bold" color="primary.main">
                        {Math.round(progress.overallProgress || 0)}%
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={progress.overallProgress || 0}
                      sx={{
                        height: 6,
                        borderRadius: 3,
                        bgcolor: alpha(theme.palette.primary.main, 0.1)
                      }}
                    />
                  </Box>

                  <Button
                    variant="contained"
                    startIcon={status === 'COMPLETED' ? <CheckCircle /> : <PlayArrow />}
                    onClick={() => handleStartCourse(course.id)}
                    sx={{
                      borderRadius: 6,
                      whiteSpace: 'nowrap',
                      bgcolor: status === 'COMPLETED' ? theme.palette.success.main : theme.palette.primary.main,
                      '&:hover': {
                        bgcolor: status === 'COMPLETED' ? theme.palette.success.dark : theme.palette.primary.dark
                      }
                    }}
                  >
                    {status === 'NOT_ENROLLED' ? 'Enroll' :
                     status === 'COMPLETED' ? 'Review' :
                     status === 'IN_PROGRESS' ? 'Continue' : 'Start'}
                  </Button>
                </Box>
              )}
            </CardContent>
          </Box>
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
      <Container maxWidth="lg" sx={{ mt: 5, mb: 8 }}>
        {/* Header with view toggle */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: 'space-between',
            alignItems: { xs: 'flex-start', sm: 'center' },
            mb: 4
          }}
        >
          <Box>
            <Typography
              variant="h4"
              component="h1"
              gutterBottom
              sx={{ fontWeight: 700 }}
            >
              My Safety Training
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              Complete your required EHS courses to stay compliant and safe
            </Typography>
          </Box>

          <Box
            sx={{
              display: 'flex',
              gap: 2,
              alignItems: 'center',
              mt: { xs: 2, sm: 0 }
            }}
          >
            <ButtonGroup variant="outlined" size="small">
              <Button
                variant={viewMode === 'grid' ? 'contained' : 'outlined'}
                onClick={() => setViewMode('grid')}
                startIcon={<ViewModule />}
              >
                Grid
              </Button>
              <Button
                variant={viewMode === 'list' ? 'contained' : 'outlined'}
                onClick={() => setViewMode('list')}
                startIcon={<ViewList />}
              >
                List
              </Button>
            </ButtonGroup>
          </Box>
        </Box>

        {/* Filters and Tabs in nice Paper container */}
        <Paper
          elevation={0}
          sx={{
            p: 2,
            mb: 4,
            borderRadius: 2,
            bgcolor: theme.palette.grey[50],
            border: `1px solid ${theme.palette.grey[200]}`
          }}
        >
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', md: 'row' },
              justifyContent: 'space-between',
              alignItems: { xs: 'stretch', md: 'center' },
              gap: 2
            }}
          >
            <Tabs
              value={activeTab}
              onChange={(e, v) => setActiveTab(v)}
              sx={{
                minHeight: 42,
                '.MuiTab-root': {
                  minHeight: 42,
                  px: 3
                }
              }}
            >
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

            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                flexWrap: 'wrap'
              }}
            >
              <FormControlLabel
                control={
                  <Switch
                    checked={showAllDomains}
                    onChange={(e) => setShowAllDomains(e.target.checked)}
                    color="primary"
                    size="small"
                  />
                }
                label={
                  <Typography variant="body2">
                    Show all domains
                  </Typography>
                }
              />

              <Button
                variant="outlined"
                startIcon={<FilterList />}
                size="small"
                sx={{ borderRadius: 6 }}
              >
                Filters
              </Button>
            </Box>
          </Box>
        </Paper>

        {/* Course Grid/List */}
        {displayCourses.length > 0 ? (
          <Box sx={{ width: '100%' }}>
            {/* Using direct flexbox layout for exactly 3 cards per row */}
            <Grid container spacing={0} sx={{
              width: '100%',
              m: 0,
              display: 'flex',
              flexWrap: 'wrap'
            }}>
              {viewMode === 'grid' ? (
                displayCourses.map(course => renderCourseCard(course))
              ) : (
                // For list view, make sure each item takes full width
                <Grid item xs={12} sx={{ p: 0 }}>
                  <Grid container direction="column" spacing={2} sx={{ width: '100%' }}>
                    {displayCourses.map(course => renderCourseCard(course))}
                  </Grid>
                </Grid>
              )}
            </Grid>
          </Box>
        ) : (
          <Paper
            sx={{
              py: 8,
              px: 4,
              textAlign: 'center',
              borderRadius: 2,
              bgcolor: theme.palette.grey[50],
              border: `1px solid ${theme.palette.grey[200]}`
            }}
          >
            <Warning sx={{ fontSize: 48, color: theme.palette.grey[400], mb: 2 }} />
            <Typography variant="h5" gutterBottom fontWeight={500}>
              No courses found
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto' }}>
              {activeTab === 1 ? "You haven't started any courses yet." :
               activeTab === 2 ? "You haven't completed any courses yet." :
               "No courses are available at the moment."}
            </Typography>

            <Button
              variant="outlined"
              sx={{ mt: 3, borderRadius: 6 }}
              startIcon={<Search />}
            >
              Browse all courses
            </Button>
          </Paper>
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