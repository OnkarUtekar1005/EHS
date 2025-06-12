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
  Divider,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem
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
  Visibility,
  SearchRounded,
  KeyboardArrowDown
} from '@mui/icons-material';
import { courseService, progressService, assessmentService } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import IncompleteAttemptWarning from '../../components/assessment/IncompleteAttemptWarning';

const MyCourses = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  const { currentUser } = useAuth();
  const [courses, setCourses] = useState([]);
  const [allCourses, setAllCourses] = useState([]);
  const [userProgress, setUserProgress] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAllDomains, setShowAllDomains] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [switchLoading, setSwitchLoading] = useState(false);
  const [showIncompleteWarning, setShowIncompleteWarning] = useState(false);
  const [viewMode, setViewMode] = useState(isMobile ? 'list' : 'grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDomain, setSelectedDomain] = useState('');
  const [sortBy, setSortBy] = useState('');
  const [availableDomains, setAvailableDomains] = useState([]);

  useEffect(() => {
    loadUserCourses();
    checkIncompleteAttempts();
  }, [showAllDomains]);

  useEffect(() => {
    filterCourses();
  }, [searchQuery, selectedDomain, sortBy, allCourses, activeTab]);

  const checkIncompleteAttempts = async () => {
    try {
      const response = await assessmentService.getIncompleteAttempts();
      if (response.data.hasIncomplete) {
        setShowIncompleteWarning(true);
      }
    } catch (error) {
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
      const coursesData = coursesResponse.data.courses || [];
      setAllCourses(coursesData);
      setCourses(coursesData);
      
      // Extract unique domains from courses
      const domains = [...new Set(coursesData
        .filter(course => course.domain?.name)
        .map(course => course.domain.name)
      )];
      setAvailableDomains(domains);

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
        // Continue without progress data
        setUserProgress({});
      }

    } catch (err) {
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

    // Grid View - Card Layout
    if (viewMode === 'grid') {
      return (
        <Grid item xs={12} sm={6} md={4} key={course.id}>
          <Card
            sx={{
              height: { xs: 'auto', sm: 380, md: 380 }, // Fixed height for consistent cards
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              borderRadius: { xs: 2, sm: 3 },
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              transition: 'all 0.25s ease-in-out',
              position: 'relative',
              cursor: 'pointer',
              '&:hover': {
                boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                transform: isMobile ? 'none' : 'translateY(-4px)'
              }
            }}
            onClick={() => handleStartCourse(course.id)}
          >
            {/* Header with Icon */}
            <Box
              sx={{
                height: { xs: 100, sm: 120 },
                position: 'relative',
                background: `linear-gradient(135deg, ${theme.palette.primary.light}20, ${theme.palette.primary.main}10)`,
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'center',
                p: { xs: 1.5, sm: 2 }
              }}
            >
              <Avatar
                sx={{
                  width: { xs: 60, sm: 80 },
                  height: { xs: 60, sm: 80 },
                  bgcolor: 'white',
                  color: theme.palette.primary.main,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  position: 'absolute',
                  bottom: { xs: -30, sm: -40 },
                  border: { xs: '3px solid white', sm: '4px solid white' }
                }}
              >
                {getCourseIcon(course)}
              </Avatar>

              {/* Status Badge */}
              {status === 'COMPLETED' && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: { xs: 8, sm: 16 },
                    right: { xs: 8, sm: 16 },
                    bgcolor: theme.palette.success.main,
                    color: 'white',
                    borderRadius: '50%',
                    width: { xs: 24, sm: 32 },
                    height: { xs: 24, sm: 32 },
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <CheckCircle fontSize={isMobile ? 'small' : 'medium'} />
                </Box>
              )}

              {!isMobile && (
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
              )}
            </Box>

            {/* Content */}
            <CardContent sx={{ 
              pt: { xs: 4, sm: 6 }, 
              flexGrow: 1, 
              px: { xs: 2, sm: 3 },
              pb: { xs: 1, sm: 2 },
              display: 'flex',
              flexDirection: 'column',
              height: { xs: 'auto', sm: 'calc(100% - 120px - 72px)' } // Account for header and button
            }}>
              {/* Title Section - Fixed height */}
              <Box 
                textAlign="center" 
                sx={{ 
                  mb: 2,
                  minHeight: { xs: 'auto', sm: 80 }, // Fixed space for title area
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'flex-start'
                }}
              >
                <Typography 
                  variant={isMobile ? "subtitle1" : "h6"} 
                  fontWeight={600} 
                  gutterBottom 
                  sx={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    fontSize: { xs: '1rem', sm: '1.25rem' },
                    lineHeight: { xs: 1.3, sm: 1.4 },
                    minHeight: { xs: 'auto', sm: '2.8em' } // Ensure space for 2 lines
                  }}
                >
                  {course.title || 'Untitled Course'}
                </Typography>

                {course.domain?.name && (
                  <Typography 
                    variant="body2" 
                    color="text.secondary" 
                    sx={{ 
                      fontSize: { xs: '0.8rem', sm: '0.875rem' },
                      minHeight: { xs: 'auto', sm: '1.2em' }
                    }}
                  >
                    {course.domain.name}
                  </Typography>
                )}
              </Box>

              {/* Progress Section - Flexible */}
              <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                {progress && (
                  <Box>
                    <Box display="flex" justifyContent="space-between" mb={1} alignItems="center">
                      <Typography 
                        variant="body2" 
                        color="text.secondary"
                        sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}
                      >
                        Progress
                      </Typography>
                      <Typography 
                        variant="body2" 
                        fontWeight="bold" 
                        color="primary.main"
                        sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}
                      >
                        {Math.round(progress.overallProgress || 0)}%
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={progress.overallProgress || 0}
                      sx={{
                        height: { xs: 4, sm: 6 },
                        borderRadius: 3,
                        bgcolor: alpha(theme.palette.primary.main, 0.1)
                      }}
                    />
                    {progress.completedComponents > 0 && (
                      <Typography 
                        variant="caption" 
                        color="text.secondary" 
                        sx={{ 
                          mt: 0.5, 
                          display: 'block', 
                          textAlign: 'right',
                          fontSize: { xs: '0.7rem', sm: '0.75rem' }
                        }}
                      >
                        {progress.completedComponents} of {course.componentCount} completed
                      </Typography>
                    )}
                  </Box>
                )}
              </Box>
            </CardContent>

            {/* Action Button */}
            <CardActions sx={{ p: { xs: 2, sm: 3 }, pt: 0 }}>
              <Button
                variant="contained"
                startIcon={status === 'COMPLETED' ? <CheckCircle /> : <PlayArrow />}
                fullWidth
                size={isMobile ? "medium" : "large"}
                sx={{
                  borderRadius: { xs: 2, sm: 6 },
                  py: { xs: 1, sm: 1.5 },
                  fontSize: { xs: '0.875rem', sm: '1rem' },
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

    // List View - Horizontal Layout
    return (
      <Grid item key={course.id} xs={12}>
        <Card
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            borderRadius: { xs: 2, sm: 3 },
            overflow: 'hidden',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            transition: 'all 0.25s ease-in-out',
            width: '100%',
            height: { xs: 'auto', sm: 150 }, // Fixed height for consistent list items
            cursor: 'pointer',
            '&:hover': {
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              transform: isMobile ? 'none' : 'translateY(-2px)'
            }
          }}
          onClick={() => handleStartCourse(course.id)}
        >
          {/* Icon Section */}
          <Box
            sx={{
              width: { xs: '100%', sm: 180 },
              height: { xs: 80, sm: 150 }, // Match card height
              background: `linear-gradient(135deg, ${theme.palette.primary.light}20, ${theme.palette.primary.main}10)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              flexShrink: 0
            }}
          >
            <Avatar
              sx={{
                width: { xs: 50, sm: 70 },
                height: { xs: 50, sm: 70 },
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
                  top: { xs: 4, sm: 8 },
                  right: { xs: 4, sm: 8 },
                  bgcolor: theme.palette.success.main,
                  color: 'white',
                  borderRadius: '50%',
                  width: { xs: 20, sm: 24 },
                  height: { xs: 20, sm: 24 },
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <CheckCircle fontSize="small" />
              </Box>
            )}
          </Box>

          {/* Content Section */}
          <Box sx={{ 
            display: 'flex', 
            flexDirection: { xs: 'column', sm: 'row' }, 
            flexGrow: 1,
            width: { xs: '100%', sm: 'auto' },
            alignItems: { sm: 'center' }
          }}>
            {/* Title and Info */}
            <Box sx={{ 
              flexGrow: 1,
              p: { xs: 2, sm: 3 },
              minWidth: 0,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              height: { sm: '100%' }
            }}>
              <Typography 
                variant={isMobile ? "subtitle1" : "h6"} 
                fontWeight={600} 
                gutterBottom 
                sx={{
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: '-webkit-box',
                  WebkitLineClamp: { xs: 2, sm: 1 }, // Single line on desktop for consistency
                  WebkitBoxOrient: 'vertical',
                  fontSize: { xs: '1rem', sm: '1.25rem' },
                  lineHeight: { xs: 1.3, sm: 1.4 },
                  mb: 1
                }}
              >
                {course.title || 'Untitled Course'}
              </Typography>
              
              {course.domain?.name && (
                <Typography 
                  variant="body2" 
                  color="text.secondary" 
                  sx={{ 
                    fontSize: { xs: '0.8rem', sm: '0.875rem' },
                    mb: { xs: 1, sm: 0 },
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {course.domain.name}
                </Typography>
              )}

              {/* Progress - Mobile only shows here */}
              {progress && isMobile && (
                <Box sx={{ mt: 2 }}>
                  <Box display="flex" justifyContent="space-between" mb={0.5}>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                      Progress
                    </Typography>
                    <Typography variant="body2" fontWeight="bold" color="primary.main" sx={{ fontSize: '0.8rem' }}>
                      {Math.round(progress.overallProgress || 0)}%
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={progress.overallProgress || 0}
                    sx={{
                      height: 4,
                      borderRadius: 3,
                      bgcolor: alpha(theme.palette.primary.main, 0.1)
                    }}
                  />
                </Box>
              )}
            </Box>

            {/* Progress and Button - Desktop */}
            {!isMobile && (
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center',
                gap: 3,
                pr: 3,
                minWidth: 300
              }}>
                {/* Progress */}
                {progress && (
                  <Box sx={{ flexGrow: 1, minWidth: 150 }}>
                    <Box display="flex" justifyContent="space-between" mb={0.5}>
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                        Progress
                      </Typography>
                      <Typography variant="body2" fontWeight="bold" color="primary.main" sx={{ fontSize: '0.875rem' }}>
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
                )}

                {/* Action Button */}
                <Button
                  variant="contained"
                  startIcon={status === 'COMPLETED' ? <CheckCircle /> : <PlayArrow />}
                  size="large"
                  sx={{
                    borderRadius: 6,
                    whiteSpace: 'nowrap',
                    minWidth: 120,
                    fontSize: '1rem',
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

            {/* Mobile Action Button */}
            {isMobile && (
              <Box sx={{ p: 2, pt: 0 }}>
                <Button
                  variant="contained"
                  startIcon={status === 'COMPLETED' ? <CheckCircle /> : <PlayArrow />}
                  fullWidth
                  size="medium"
                  sx={{
                    borderRadius: 2,
                    py: 1,
                    fontSize: '0.875rem',
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
          </Box>
        </Card>
      </Grid>
    );
  };

  const filterCourses = () => {
    let filtered = [...allCourses];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(course => 
        course.title?.toLowerCase().includes(query) ||
        course.domain?.name?.toLowerCase().includes(query) ||
        course.description?.toLowerCase().includes(query)
      );
    }

    // Apply domain filter
    if (selectedDomain) {
      filtered = filtered.filter(course => course.domain?.name === selectedDomain);
    }

    // Apply tab filter
    switch (activeTab) {
      case 1: // In Progress
        filtered = filtered.filter(course => {
          const status = getCourseStatus(course);
          return status === 'IN_PROGRESS' || status === 'ENROLLED';
        });
        break;
      case 2: // Completed
        filtered = filtered.filter(course => getCourseStatus(course) === 'COMPLETED');
        break;
      default: // All
        break;
    }

    // Apply sorting
    if (sortBy === 'recent') {
      filtered = filtered.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    } else if (sortBy === 'alphabetical') {
      filtered = filtered.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    } else if (sortBy === 'domain') {
      filtered = filtered.sort((a, b) => (a.domain?.name || '').localeCompare(b.domain?.name || ''));
    }

    setCourses(filtered);
  };

  const filteredCourses = () => {
    return courses;
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ 
        mt: { xs: 2, sm: 4 }, 
        px: { xs: 2, sm: 3 }
      }}>
        <Box 
          display="flex" 
          flexDirection="column"
          justifyContent="center" 
          alignItems="center" 
          minHeight={{ xs: "300px", sm: "400px" }}
          gap={2}
        >
          <CircularProgress size={isMobile ? 32 : 40} />
          <Typography 
            variant="body2" 
            color="text.secondary"
            sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
          >
            Loading your courses...
          </Typography>
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ 
        mt: { xs: 2, sm: 4 },
        px: { xs: 2, sm: 3 }
      }}>
        <Alert 
          severity="error"
          sx={{
            fontSize: { xs: '0.875rem', sm: '1rem' },
            '& .MuiAlert-icon': {
              fontSize: { xs: '1.2rem', sm: '1.5rem' }
            }
          }}
        >
          {error}
        </Alert>
      </Container>
    );
  }

  const displayCourses = filteredCourses();

  return (
    <>
      <Container 
        maxWidth="xl" 
        sx={{ 
          mt: { xs: 1, sm: 2 }, 
          mb: { xs: 4, sm: 8 },
          px: { xs: 1, sm: 2, md: 3 }
        }}
      >
        {/* Header - Mobile Optimized */}
        <Box sx={{ mb: { xs: 3, sm: 4 } }}>
          <Typography
            variant="h4"
            component="h1"
            sx={{ 
              fontWeight: 800,
              fontSize: { xs: '1.5rem', sm: '2rem', md: '2.25rem' },
              lineHeight: 1.2,
              mb: 1,
              background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textAlign: { xs: 'center', sm: 'left' }
            }}
          >
            My Safety Training
          </Typography>
          <Typography 
            variant="subtitle1" 
            color="text.secondary"
            sx={{ 
              fontSize: { xs: '0.875rem', sm: '1rem' },
              lineHeight: 1.5,
              textAlign: { xs: 'center', sm: 'left' },
              maxWidth: { xs: '100%', sm: '600px' }
            }}
          >
            Complete your required EHS courses to stay compliant and safe
          </Typography>
        </Box>

        {/* Search and Filters */}
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2, sm: 3 },
            mb: { xs: 3, sm: 4 },
            borderRadius: 3,
            bgcolor: 'white',
            border: `1px solid ${theme.palette.grey[200]}`,
            boxShadow: '0 2px 12px rgba(0,0,0,0.04)'
          }}
        >
          {/* Search Bar */}
          <Box sx={{ mb: { xs: 2, sm: 3 } }}>
            <TextField
              fullWidth
              placeholder="Search courses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchRounded sx={{ color: theme.palette.grey[500] }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 3,
                  backgroundColor: theme.palette.grey[50],
                  fontSize: { xs: '1rem', sm: '1rem' },
                  '&:hover': {
                    backgroundColor: theme.palette.grey[100]
                  },
                  '&.Mui-focused': {
                    backgroundColor: 'white'
                  }
                }
              }}
            />
          </Box>

          {/* Mobile Layout - Stacked */}
          {isMobile ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {/* Tabs */}
              <Tabs
                value={activeTab}
                onChange={(e, v) => setActiveTab(v)}
                variant="fullWidth"
                sx={{
                  bgcolor: theme.palette.grey[50],
                  borderRadius: 2,
                  '& .MuiTab-root': {
                    minHeight: 44,
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    textTransform: 'none',
                    borderRadius: 2,
                    mx: 0.5,
                    '&.Mui-selected': {
                      bgcolor: 'white',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                    }
                  },
                  '& .MuiTabs-indicator': {
                    display: 'none'
                  }
                }}
              >
                <Tab label={`All (${allCourses.length})`} />
                <Tab label={`Progress (${allCourses.filter(c => {
                  const status = getCourseStatus(c);
                  return status === 'IN_PROGRESS' || status === 'ENROLLED';
                }).length})`} />
                <Tab label={`Done (${allCourses.filter(c => getCourseStatus(c) === 'COMPLETED').length})`} />
              </Tabs>

              {/* Filters Row */}
              <Box sx={{ display: 'flex', gap: 2 }}>
                <FormControl size="small" sx={{ flex: 1 }}>
                  <InputLabel>Domain</InputLabel>
                  <Select
                    value={selectedDomain}
                    onChange={(e) => setSelectedDomain(e.target.value)}
                    label="Domain"
                    sx={{ borderRadius: 2, bgcolor: theme.palette.grey[50] }}
                  >
                    <MenuItem value=""><em>All</em></MenuItem>
                    {availableDomains.map((domain) => (
                      <MenuItem key={domain} value={domain}>{domain}</MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl size="small" sx={{ flex: 1 }}>
                  <InputLabel>Sort</InputLabel>
                  <Select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    label="Sort"
                    sx={{ borderRadius: 2, bgcolor: theme.palette.grey[50] }}
                  >
                    <MenuItem value=""><em>Default</em></MenuItem>
                    <MenuItem value="recent">Recent</MenuItem>
                    <MenuItem value="alphabetical">A-Z</MenuItem>
                    <MenuItem value="domain">Domain</MenuItem>
                  </Select>
                </FormControl>
              </Box>

              {/* View Mode Toggle */}
              <ButtonGroup variant="outlined" size="small" fullWidth>
                <Button
                  variant={viewMode === 'grid' ? 'contained' : 'outlined'}
                  onClick={() => setViewMode('grid')}
                  startIcon={<ViewModule />}
                  sx={{ borderRadius: '8px 0 0 8px', py: 1.5 }}
                >
                  Grid View
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'contained' : 'outlined'}
                  onClick={() => setViewMode('list')}
                  startIcon={<ViewList />}
                  sx={{ borderRadius: '0 8px 8px 0', py: 1.5 }}
                >
                  List View
                </Button>
              </ButtonGroup>
            </Box>
          ) : (
            /* Desktop Layout - Row */
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 3
              }}
            >
              <Tabs
                value={activeTab}
                onChange={(e, v) => setActiveTab(v)}
                sx={{
                  '& .MuiTab-root': {
                    minHeight: 42,
                    px: 3,
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    textTransform: 'none'
                  }
                }}
              >
                <Tab label={`All (${allCourses.length})`} />
                <Tab label={`In Progress (${allCourses.filter(c => {
                  const status = getCourseStatus(c);
                  return status === 'IN_PROGRESS' || status === 'ENROLLED';
                }).length})`} />
                <Tab label={`Completed (${allCourses.filter(c => getCourseStatus(c) === 'COMPLETED').length})`} />
              </Tabs>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <FormControl size="small" sx={{ minWidth: 140 }}>
                  <InputLabel>Domain</InputLabel>
                  <Select
                    value={selectedDomain}
                    onChange={(e) => setSelectedDomain(e.target.value)}
                    label="Domain"
                    sx={{ borderRadius: 2 }}
                  >
                    <MenuItem value=""><em>All Domains</em></MenuItem>
                    {availableDomains.map((domain) => (
                      <MenuItem key={domain} value={domain}>{domain}</MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl size="small" sx={{ minWidth: 140 }}>
                  <InputLabel>Sort By</InputLabel>
                  <Select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    label="Sort By"
                    sx={{ borderRadius: 2 }}
                  >
                    <MenuItem value=""><em>Default</em></MenuItem>
                    <MenuItem value="recent">Recently Published</MenuItem>
                    <MenuItem value="alphabetical">Alphabetical</MenuItem>
                    <MenuItem value="domain">By Domain</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            </Box>
          )}
        </Paper>

        {/* Course Grid/List - Mobile Optimized */}
        {displayCourses.length > 0 ? (
          <Box sx={{ width: '100%' }}>
            <Grid 
              container 
              spacing={{ xs: 2, sm: 2, md: 3 }} 
              sx={{
                width: '100%',
                m: 0,
                '& .MuiGrid-item': {
                  pl: { xs: 2, sm: 2, md: 3 },
                  pt: { xs: 2, sm: 2, md: 3 }
                }
              }}
            >
              {displayCourses.map(course => renderCourseCard(course))}
            </Grid>
          </Box>
        ) : (
          <Paper
            sx={{
              py: { xs: 8, sm: 10 },
              px: { xs: 3, sm: 4 },
              textAlign: 'center',
              borderRadius: 3,
              bgcolor: 'white',
              border: `1px solid ${theme.palette.grey[200]}`,
              boxShadow: '0 2px 12px rgba(0,0,0,0.04)'
            }}
          >
            <Box
              sx={{
                width: { xs: 80, sm: 100 },
                height: { xs: 80, sm: 100 },
                borderRadius: '50%',
                bgcolor: theme.palette.grey[100],
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 3
              }}
            >
              <Search sx={{ 
                fontSize: { xs: 32, sm: 40 }, 
                color: theme.palette.grey[400]
              }} />
            </Box>
            
            <Typography 
              variant="h5" 
              gutterBottom 
              fontWeight={700}
              sx={{
                fontSize: { xs: '1.25rem', sm: '1.5rem' },
                lineHeight: 1.3,
                mb: 2
              }}
            >
              {searchQuery ? "No matches found" : "No courses available"}
            </Typography>
            
            <Typography 
              variant="body1" 
              color="text.secondary" 
              sx={{ 
                maxWidth: 500, 
                mx: 'auto',
                fontSize: { xs: '0.875rem', sm: '1rem' },
                lineHeight: 1.6,
                mb: 4
              }}
            >
              {searchQuery ? "Try adjusting your search terms or filters to find what you're looking for." :
               activeTab === 1 ? "Start exploring courses to begin your safety training journey." :
               activeTab === 2 ? "Complete some courses to see them here." :
               "New courses will appear here when they become available."}
            </Typography>

            {searchQuery ? (
              <Button
                variant="contained"
                size="large"
                sx={{ 
                  borderRadius: 3,
                  px: 4,
                  py: 1.5,
                  fontSize: '1rem',
                  fontWeight: 600,
                  textTransform: 'none'
                }}
                onClick={() => {
                  setSearchQuery('');
                  setSelectedDomain('');
                  setSortBy('');
                }}
              >
                Clear All Filters
              </Button>
            ) : (
              <Button
                variant="outlined"
                size="large"
                startIcon={<Search />}
                sx={{ 
                  borderRadius: 3,
                  px: 4,
                  py: 1.5,
                  fontSize: '1rem',
                  fontWeight: 600,
                  textTransform: 'none'
                }}
              >
                Explore Courses
              </Button>
            )}
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