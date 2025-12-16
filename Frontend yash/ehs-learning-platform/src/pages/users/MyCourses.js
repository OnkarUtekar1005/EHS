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
  IconButton,
  useTheme,
  useMediaQuery,
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
  Search,
  Warning,
  Schedule,
  LocalFireDepartment,
  VerifiedUser,
  Engineering,
  Visibility,
  SearchRounded,
  KeyboardArrowDown,
  Lock as LockIcon,
  People as PeopleIcon,
  Explore as ExploreIcon
} from '@mui/icons-material';
import { courseService, progressService, assessmentService } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import IncompleteAttemptWarning from '../../components/assessment/IncompleteAttemptWarning';
import MarqueeText from '../../components/common/MarqueeText';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import './MyCourses.css';

const MyCourses = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  const { currentUser } = useAuth();
  const [courses, setCourses] = useState([]);
  const [allCourses, setAllCourses] = useState([]);
  const [exploreCourses, setExploreCourses] = useState([]); // All published courses for Explore tab
  const [userProgress, setUserProgress] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAllDomains, setShowAllDomains] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [switchLoading, setSwitchLoading] = useState(false);
  const [showIncompleteWarning, setShowIncompleteWarning] = useState(false);
  // Removed viewMode - only grid view is available now
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDomain, setSelectedDomain] = useState('');
  const [sortBy, setSortBy] = useState('');
  const [availableDomains, setAvailableDomains] = useState([]);
  // Locked course dialog state
  const [lockedDialogOpen, setLockedDialogOpen] = useState(false);
  const [selectedLockedCourse, setSelectedLockedCourse] = useState(null);

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

      // Get user courses with domain filter (user's domain courses)
      const params = {
        showAll: showAllDomains,
        page: 1,
        limit: 20
      };
      const coursesResponse = await courseService.getUserCourses(params);
      const coursesData = coursesResponse.data.courses || [];
      setAllCourses(coursesData);
      setCourses(coursesData);

      // Fetch all courses for Explore tab (with showAll=true)
      try {
        const exploreResponse = await courseService.browseAllCourses({
          page: 1,
          limit: 100,
          sortBy: 'popular'
        });
        const exploreData = exploreResponse.data.courses || [];
        setExploreCourses(exploreData);

        // Extract unique domains from ALL courses (explore courses)
        const domains = [...new Set(exploreData
          .filter(course => course.domain?.name)
          .map(course => course.domain.name)
        )];
        setAvailableDomains(domains);
      } catch (exploreErr) {
        // Fallback to domain courses for domains list
        const domains = [...new Set(coursesData
          .filter(course => course.domain?.name)
          .map(course => course.domain.name)
        )];
        setAvailableDomains(domains);
        setExploreCourses([]);
      }

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

    // Grid View - Card Layout (only view available)
    return (
      <Card
        key={course.id}
        className="course-card"
          sx={{
            height: { xs: 'auto', sm: '420px !important', md: '420px !important' }, // Fixed height with !important
            minHeight: { sm: '420px', md: '420px' },
            maxHeight: { sm: '420px', md: '420px' },
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

          </Box>

          {/* Content */}
          <CardContent 
            className="course-card-content"
            sx={{ 
            pt: { xs: 4, sm: 6 }, 
            flexGrow: 1, 
            px: { xs: 2, sm: 3 },
            pb: { xs: 1, sm: 2 },
            display: 'flex',
            flexDirection: 'column',
            height: { xs: 'auto', sm: 'calc(100% - 120px - 72px)' }, // Account for header and button
            overflow: 'hidden'
          }}>
            {/* Title Section - Fixed height */}
            <Box 
              textAlign="center" 
              sx={{ 
                mb: 2,
                height: { xs: 'auto', sm: 100 }, // Fixed height for title area
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-start',
                alignItems: 'center'
              }}
            >
              <MarqueeText
                text={course.title || 'Untitled Course'}
                variant={isMobile ? "subtitle1" : "h6"}
                sx={{
                  fontWeight: 600,
                  fontSize: { xs: '1rem', sm: '1.25rem' },
                  lineHeight: { xs: 1.3, sm: 1.4 },
                  mb: 1,
                  maxWidth: '100%',
                  container: {
                    maxHeight: { xs: 'auto', sm: '3.6em' },
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }
                }}
              />

              {course.domain?.name && (
                <Typography 
                  variant="body2" 
                  color="text.secondary" 
                  sx={{ 
                    fontSize: { xs: '0.8rem', sm: '0.875rem' },
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    maxWidth: '90%'
                  }}
                >
                  {course.domain.name}
                </Typography>
              )}
            </Box>

            {/* Progress Section - Fixed position at bottom */}
            <Box sx={{ 
              mt: 'auto',
              pt: 2
            }}>
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
          <CardActions 
            className="course-card-actions"
            sx={{ 
              p: { xs: 2, sm: 3 }, 
              pt: 0,
              mt: 'auto'
            }}>
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
    );
  };

  // Handle locked course click - show contact admin dialog
  const handleLockedCourseClick = (course) => {
    setSelectedLockedCourse(course);
    setLockedDialogOpen(true);
  };

  // Render course card for Explore tab (shows locked/unlocked status)
  const renderExploreCourseCard = (course) => {
    if (!course || !course.id) {
      return null;
    }

    const progress = userProgress[course.id];
    const status = getCourseStatus(course);
    const isLocked = course.isLocked === true;
    const canEnroll = course.canEnroll === true;
    const enrolledUsers = course.enrolledUsers || 0;

    return (
      <Card
        key={course.id}
        className="course-card"
        sx={{
          height: { xs: 'auto', sm: '420px !important', md: '420px !important' },
          minHeight: { sm: '420px', md: '420px' },
          maxHeight: { sm: '420px', md: '420px' },
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          borderRadius: { xs: 2, sm: 3 },
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          transition: 'all 0.25s ease-in-out',
          position: 'relative',
          cursor: 'pointer',
          opacity: isLocked ? 0.85 : 1,
          '&:hover': {
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
            transform: isMobile ? 'none' : 'translateY(-4px)'
          }
        }}
        onClick={() => isLocked ? handleLockedCourseClick(course) : handleStartCourse(course.id)}
      >
        {/* Header with Icon */}
        <Box
          sx={{
            height: { xs: 100, sm: 120 },
            position: 'relative',
            background: isLocked
              ? `linear-gradient(135deg, ${theme.palette.grey[300]}40, ${theme.palette.grey[400]}20)`
              : `linear-gradient(135deg, ${theme.palette.primary.light}20, ${theme.palette.primary.main}10)`,
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
              color: isLocked ? theme.palette.grey[500] : theme.palette.primary.main,
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              position: 'absolute',
              bottom: { xs: -30, sm: -40 },
              border: { xs: '3px solid white', sm: '4px solid white' }
            }}
          >
            {isLocked ? <LockIcon /> : getCourseIcon(course)}
          </Avatar>

          {/* Lock Badge for locked courses */}
          {isLocked && (
            <Box
              sx={{
                position: 'absolute',
                top: { xs: 8, sm: 16 },
                right: { xs: 8, sm: 16 },
                bgcolor: theme.palette.grey[600],
                color: 'white',
                borderRadius: '50%',
                width: { xs: 24, sm: 32 },
                height: { xs: 24, sm: 32 },
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <LockIcon fontSize={isMobile ? 'small' : 'medium'} />
            </Box>
          )}

          {/* Completed Badge for unlocked completed courses */}
          {!isLocked && status === 'COMPLETED' && (
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

          {/* Enrollment count badge */}
          {enrolledUsers > 0 && (
            <Chip
              icon={<PeopleIcon sx={{ fontSize: 14 }} />}
              label={`${enrolledUsers} enrolled`}
              size="small"
              sx={{
                position: 'absolute',
                top: { xs: 8, sm: 16 },
                left: { xs: 8, sm: 16 },
                bgcolor: 'rgba(255,255,255,0.95)',
                fontSize: '0.7rem',
                height: 24,
                '& .MuiChip-icon': {
                  color: theme.palette.primary.main
                }
              }}
            />
          )}
        </Box>

        {/* Content */}
        <CardContent
          className="course-card-content"
          sx={{
            pt: { xs: 4, sm: 6 },
            flexGrow: 1,
            px: { xs: 2, sm: 3 },
            pb: { xs: 1, sm: 2 },
            display: 'flex',
            flexDirection: 'column',
            height: { xs: 'auto', sm: 'calc(100% - 120px - 72px)' },
            overflow: 'hidden'
          }}
        >
          {/* Title Section */}
          <Box
            textAlign="center"
            sx={{
              mb: 2,
              height: { xs: 'auto', sm: 100 },
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-start',
              alignItems: 'center'
            }}
          >
            <MarqueeText
              text={course.title || 'Untitled Course'}
              variant={isMobile ? "subtitle1" : "h6"}
              sx={{
                fontWeight: 600,
                fontSize: { xs: '1rem', sm: '1.25rem' },
                lineHeight: { xs: 1.3, sm: 1.4 },
                mb: 1,
                maxWidth: '100%',
                color: isLocked ? theme.palette.grey[700] : 'inherit',
                container: {
                  maxHeight: { xs: 'auto', sm: '3.6em' },
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }
              }}
            />

            {course.domain?.name && (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  fontSize: { xs: '0.8rem', sm: '0.875rem' },
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  maxWidth: '90%'
                }}
              >
                {course.domain.name}
              </Typography>
            )}

            {/* Locked status indicator */}
            {isLocked && (
              <Chip
                label="Contact Admin for Access"
                size="small"
                sx={{
                  mt: 1,
                  bgcolor: alpha(theme.palette.warning.main, 0.1),
                  color: theme.palette.warning.dark,
                  fontSize: '0.7rem',
                  height: 22
                }}
              />
            )}
          </Box>

          {/* Progress Section (only for unlocked courses with progress) */}
          <Box sx={{ mt: 'auto', pt: 2 }}>
            {!isLocked && progress && (
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
              </Box>
            )}
          </Box>
        </CardContent>

        {/* Action Button */}
        <CardActions
          className="course-card-actions"
          sx={{
            p: { xs: 2, sm: 3 },
            pt: 0,
            mt: 'auto'
          }}
        >
          <Button
            variant={isLocked ? "outlined" : "contained"}
            startIcon={isLocked ? <LockIcon /> : (status === 'COMPLETED' ? <CheckCircle /> : <PlayArrow />)}
            fullWidth
            size={isMobile ? "medium" : "large"}
            sx={{
              borderRadius: { xs: 2, sm: 6 },
              py: { xs: 1, sm: 1.5 },
              fontSize: { xs: '0.875rem', sm: '1rem' },
              bgcolor: isLocked ? 'transparent' : (status === 'COMPLETED' ? theme.palette.success.main : theme.palette.primary.main),
              borderColor: isLocked ? theme.palette.grey[400] : undefined,
              color: isLocked ? theme.palette.grey[600] : 'white',
              '&:hover': {
                bgcolor: isLocked ? alpha(theme.palette.grey[400], 0.1) : (status === 'COMPLETED' ? theme.palette.success.dark : theme.palette.primary.dark)
              }
            }}
          >
            {isLocked ? 'Request Access' :
              status === 'NOT_ENROLLED' ? 'Enroll' :
                status === 'COMPLETED' ? 'Review' :
                  status === 'IN_PROGRESS' ? 'Continue' : 'Start'}
          </Button>
        </CardActions>
      </Card>
    );
  };

  const filterCourses = () => {
    // Use explore courses for Explore tab, otherwise use user's domain courses
    let filtered = activeTab === 3 ? [...exploreCourses] : [...allCourses];

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
      case 3: // Explore - show only courses user hasn't enrolled in
        filtered = filtered.filter(course => {
          const status = getCourseStatus(course);
          // Exclude courses the user has already enrolled in (any progress exists)
          return status === 'NOT_ENROLLED';
        });
        break;
      default: // All (tab 0)
        break;
    }

    // Apply sorting
    if (sortBy === 'recent') {
      filtered = filtered.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    } else if (sortBy === 'alphabetical') {
      filtered = filtered.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    } else if (sortBy === 'domain') {
      filtered = filtered.sort((a, b) => (a.domain?.name || '').localeCompare(b.domain?.name || ''));
    } else if (sortBy === 'popular' && activeTab === 3) {
      // Sort by enrollment count for Explore tab
      filtered = filtered.sort((a, b) => (b.enrolledUsers || 0) - (a.enrolledUsers || 0));
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
                variant="scrollable"
                scrollButtons="auto"
                sx={{
                  bgcolor: theme.palette.grey[50],
                  borderRadius: 2,
                  '& .MuiTab-root': {
                    minHeight: 44,
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    textTransform: 'none',
                    borderRadius: 2,
                    mx: 0.25,
                    px: 1.5,
                    minWidth: 'auto',
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
                <Tab
                  icon={<ExploreIcon sx={{ fontSize: 16, mr: 0.5 }} />}
                  iconPosition="start"
                  label={`Explore (${exploreCourses.filter(c => getCourseStatus(c) === 'NOT_ENROLLED').length})`}
                  sx={{
                    '&.Mui-selected': {
                      bgcolor: alpha(theme.palette.info.main, 0.1),
                      color: theme.palette.info.main
                    }
                  }}
                />
              </Tabs>

              {/* Filters Row */}
              <Box sx={{ display: 'flex', gap: 2 }}>
                <FormControl size="small" sx={{ flex: 1 }}>
                  <InputLabel>Books</InputLabel>
                  <Select
                    value={selectedDomain}
                    onChange={(e) => setSelectedDomain(e.target.value)}
                    label="Books"
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
                    {activeTab === 3 && <MenuItem value="popular">Most Popular</MenuItem>}
                  </Select>
                </FormControl>
              </Box>
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
                <Tab
                  icon={<ExploreIcon sx={{ fontSize: 18, mr: 0.5 }} />}
                  iconPosition="start"
                  label={`Explore (${exploreCourses.filter(c => getCourseStatus(c) === 'NOT_ENROLLED').length})`}
                  sx={{
                    '&.Mui-selected': {
                      color: theme.palette.info.main
                    }
                  }}
                />
              </Tabs>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <FormControl size="small" sx={{ minWidth: 140 }}>
                  <InputLabel>Books</InputLabel>
                  <Select
                    value={selectedDomain}
                    onChange={(e) => setSelectedDomain(e.target.value)}
                    label="Domain"
                    sx={{ borderRadius: 2 }}
                  >
                    <MenuItem value=""><em>All Books</em></MenuItem>
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
                    <MenuItem value="domain">By Books</MenuItem>
                    {activeTab === 3 && <MenuItem value="popular">Most Popular</MenuItem>}
                  </Select>
                </FormControl>

              </Box>
            </Box>
          )}
        </Paper>

        {/* Course Grid - Always grid view */}
        {displayCourses.length > 0 ? (
          <Box sx={{ width: '100%' }}>
            <Box className="course-grid-container">
              {displayCourses.map(course => activeTab === 3 ? renderExploreCourseCard(course) : renderCourseCard(course))}
            </Box>
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
               activeTab === 3 ? "No courses are currently available to explore." :
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

      {/* Locked Course Dialog - Contact Admin */}
      <Dialog
        open={lockedDialogOpen}
        onClose={() => setLockedDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            p: 1
          }
        }}
      >
        <DialogTitle sx={{ textAlign: 'center', pt: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <Avatar
              sx={{
                width: 64,
                height: 64,
                bgcolor: alpha(theme.palette.warning.main, 0.1),
                color: theme.palette.warning.main
              }}
            >
              <LockIcon sx={{ fontSize: 32 }} />
            </Avatar>
            <Typography variant="h6" fontWeight={700}>
              Course Access Required
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ textAlign: 'center', pb: 2 }}>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
            You don't have access to the domain required for this course:
          </Typography>
          {selectedLockedCourse && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" fontWeight={600} sx={{ mb: 1 }}>
                {selectedLockedCourse.title}
              </Typography>
              <Chip
                icon={<DomainIcon />}
                label={selectedLockedCourse.domain?.name || 'Unknown Domain'}
                sx={{
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  color: theme.palette.primary.main,
                  fontWeight: 500
                }}
              />
            </Box>
          )}
          <Alert severity="info" sx={{ textAlign: 'left', borderRadius: 2 }}>
            <Typography variant="body2">
              Please contact your administrator to request access to the{' '}
              <strong>{selectedLockedCourse?.domain?.name}</strong> domain.
              Once approved, you'll be able to enroll in this course.
            </Typography>
          </Alert>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 3, gap: 2 }}>
          <Button
            variant="outlined"
            onClick={() => setLockedDialogOpen(false)}
            sx={{ borderRadius: 2, px: 3 }}
          >
            Close
          </Button>
          <Button
            variant="contained"
            onClick={() => {
              setLockedDialogOpen(false);
              // Could add email or contact functionality here
            }}
            sx={{ borderRadius: 2, px: 3 }}
          >
            I Understand
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default MyCourses;