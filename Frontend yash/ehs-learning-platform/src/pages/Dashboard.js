// src/pages/Dashboard.js
import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Button,
  Divider,
  CircularProgress,
  Alert,
  Chip,
  Card,
  CardContent,
  CardActions,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  useTheme,
  useMediaQuery,
  Avatar
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
  Download as DownloadIcon,
  School as SchoolIcon,
  CheckCircle as CheckCircleIcon,
  DateRange as DateRangeIcon,
  Timer as TimerIcon,
  Assessment as AssessmentIcon,
  Domain as DomainIcon,
  Lock as LockIcon,
  People as PeopleIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import IncompleteAttemptWarning from '../components/assessment/IncompleteAttemptWarning';
import CertificateViewer from '../components/certificate/CertificateViewer';
import ProfileCompletionModal from '../components/common/ProfileCompletionModal';
import { assessmentService, certificateService, courseService, progressService, userService } from '../services/api';
import MarqueeText from '../components/common/MarqueeText';

const Dashboard = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  const { currentUser } = useAuth();
  const [showIncompleteWarning, setShowIncompleteWarning] = useState(false);
  const [completedCourses, setCompletedCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewCertificate, setViewCertificate] = useState(null);
  const [showProfileCompletion, setShowProfileCompletion] = useState(false);
  const [fullUserData, setFullUserData] = useState(null); // Full user data from /users/{id} API
  const [stats, setStats] = useState({
    completedCount: 0,
    inProgressCount: 0,
    certificatesCount: 0
  });
  const [availableCourses, setAvailableCourses] = useState([]);
  const [displayCount, setDisplayCount] = useState(6);
  const [lockedDialogOpen, setLockedDialogOpen] = useState(false);
  const [selectedLockedCourse, setSelectedLockedCourse] = useState(null);

  useEffect(() => {
    checkIncompleteAttempts();
    loadCourses();
  }, []);

  // Check if profile is incomplete by querying the /users/{id} API
  // This API returns the full user data including firstName and lastName
  useEffect(() => {
    const checkProfileCompletion = async () => {
      if (currentUser && currentUser.id) {
        try {
          // Query the user API to get full user data including firstName/lastName
          const response = await userService.getById(currentUser.id);
          const userData = response.data;
          setFullUserData(userData);

          // Check if firstName or lastName is missing/null/empty
          const isProfileIncomplete = !userData.firstName || !userData.lastName;
          setShowProfileCompletion(isProfileIncomplete);
        } catch (error) {
          console.error('Failed to fetch user data for profile check:', error);
          // Don't show modal if we can't fetch user data
          setShowProfileCompletion(false);
        }
      } else {
        setShowProfileCompletion(false);
      }
    };

    checkProfileCompletion();
  }, [currentUser]); // Re-run when currentUser changes
  
  const checkIncompleteAttempts = async () => {
    try {
      const response = await assessmentService.getIncompleteAttempts();
      if (response.data.hasIncomplete) {
        setShowIncompleteWarning(true);
      }
    } catch (error) {
    }
  };

  // Load courses using the same logic as MyCourses
  const loadCourses = async () => {
    try {
      setLoading(true);

      // showAll:true + sortBy:popular returns all published courses ordered by enrollment.
      // isLocked=true marks courses outside the user's assigned domains.
      const [coursesResponse, progressResponse] = await Promise.all([
        courseService.getUserCourses({ showAll: true, limit: 200, sortBy: 'popular' }),
        progressService.getUserCourseProgress().catch(() => ({ data: { progresses: [] } }))
      ]);

      const publishedCourses = coursesResponse.data.courses || [];
      
      // Build progress map like MyCourses does
      const progressMap = {};
      if (progressResponse.data.progresses && Array.isArray(progressResponse.data.progresses)) {
        progressResponse.data.progresses.forEach(p => {
          progressMap[p.courseId] = p;
        });
      }

      // Helper function to get course status (same as MyCourses)
      const getCourseStatus = (course) => {
        const progress = progressMap[course.id];
        if (!progress) return 'NOT_ENROLLED';
        if (progress.status === 'COMPLETED') return 'COMPLETED';
        if (progress.overallProgress > 0) return 'IN_PROGRESS';
        return 'ENROLLED';
      };

      // Find completed courses using the same logic as MyCourses
      const completedCourses = publishedCourses.filter(course => 
        getCourseStatus(course) === 'COMPLETED'
      );

      console.log('Completed courses found:', completedCourses);

      // Get certificate info for completed courses
      const coursesWithCertificates = await Promise.all(
        completedCourses.map(async (course) => {
          try {
            const certResponse = await certificateService.getUserCourseCertificate(course.id);
            const progress = progressMap[course.id];

            return {
              courseId: course.id,
              courseName: course.title,
              hasCertificate: certResponse.data.exists,
              certificateId: certResponse.data.exists ? certResponse.data.certificateId : null,
              completedAt: certResponse.data.issuedDate || progress?.completedAt,
              domain: course.domain?.name || 'EHS Training',
              progress: progress
            };
          } catch (error) {
            console.warn(`Certificate check failed for course ${course.title}:`, error);
            const progress = progressMap[course.id];
            return {
              courseId: course.id,
              courseName: course.title,
              hasCertificate: false,
              certificateId: null,
              completedAt: progress?.completedAt,
              domain: course.domain?.name || 'EHS Training',
              progress: progress
            };
          }
        })
      );

      setCompletedCourses(coursesWithCertificates);

      // isLocked=true = user's domains don't include this course.
      // Already sorted by popularity from backend; cap at 50.
      const unassigned = publishedCourses
        .filter(c => c.isLocked === true)
        .sort((a, b) => (b.enrolledUsers || 0) - (a.enrolledUsers || 0))
        .slice(0, 50);
      setAvailableCourses(unassigned);
      setDisplayCount(6); // reset pagination when data reloads

      // Calculate stats
      const inProgressCourses = publishedCourses.filter(course => {
        const status = getCourseStatus(course);
        return status === 'IN_PROGRESS' || status === 'ENROLLED';
      });

      setStats({
        completedCount: completedCourses.length,
        inProgressCount: inProgressCourses.length,
        certificatesCount: coursesWithCertificates.filter(course => course.hasCertificate).length
      });

    } catch (error) {
      console.error('Failed to load courses:', error);
      setError('Failed to load your completed courses');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateCertificate = async (courseId) => {
    try {
      setLoading(true);
      const response = await certificateService.generateCertificate(courseId);
      
      // Find the course in the array and update it
      const updatedCourses = completedCourses.map(course => {
        if (course.courseId === courseId) {
          return {
            ...course,
            hasCertificate: true,
            certificateId: response.data.certificateId
          };
        }
        return course;
      });
      
      setCompletedCourses(updatedCourses);
      
      // Update certificate count in stats
      setStats(prev => ({
        ...prev,
        certificatesCount: prev.certificatesCount + 1
      }));
      
      // Now download the certificate
      handleDownloadCertificate(response.data.certificateId);
    } catch (error) {
      setError('Failed to generate certificate: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadCertificate = async (certificateId) => {
    try {
      const response = await certificateService.downloadCertificate(certificateId);
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `certificate.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      setError('Failed to download certificate: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleViewCertificate = (course) => {
    setViewCertificate({
      courseId: course.courseId,
      courseName: course.courseName
    });
  };

  const handleOpenLockedDialog = (course) => {
    setSelectedLockedCourse(course);
    setLockedDialogOpen(true);
  };

  return (
    <>
      <Box
        sx={{
          backgroundColor: theme.palette.background.default,
          minHeight: '100vh',
          pt: { xs: 2, md: 4 },
          pb: 8,
          width: '100%'
        }}
      >
        <Container maxWidth={false} sx={{ px: { xs: 2, sm: 3, md: 4 } }}>
          {/* Welcome Section */}
          <Box
            sx={{
              mb: 4,
              textAlign: 'left',
              width: '100%'
            }}
          >
            <Typography
              variant={isMobile ? "h5" : "h4"}
              component="h1"
              sx={{
                fontWeight: 700,
                mb: 1,
                color: theme.palette.text.primary
              }}
            >
              Welcome, {currentUser?.firstName || currentUser?.email?.split('@')[0] || 'User'}
            </Typography>
            <Typography
              variant={isMobile ? "body2" : "subtitle1"}
              color="textSecondary"
              sx={{ mb: isMobile ? 2 : 3 }}
            >
              Track your completed courses and certificates
            </Typography>
          </Box>

          {/* Stats Cards - Aligned like Admin Dashboard */}
          <Box
            sx={{
              mb: 4,
              display: { xs: 'flex', sm: 'flex', md: 'flex' },
              flexDirection: { xs: 'column', sm: 'row' },
              flexWrap: { xs: 'nowrap', sm: 'wrap', md: 'nowrap' },
              gap: { xs: 2, sm: 2, md: 3 }
            }}
          >
            {/* Completed Courses Card */}
            <Box sx={{ flex: { xs: 'none', sm: '1 1 45%', md: '1' }, minWidth: { xs: '100%', sm: '200px', md: '0' } }}>
              <Paper
                elevation={0}
                sx={{
                  p: { xs: 2, sm: 3 },
                  borderRadius: 2,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: { xs: 120, sm: 140 },
                  transition: 'all 0.25s ease-in-out',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 8px 16px rgba(0,0,0,0.12)'
                  }
                }}
              >
                <Avatar
                  sx={{
                    bgcolor: theme.palette.success.light,
                    width: { xs: 40, sm: 56 },
                    height: { xs: 40, sm: 56 },
                    mb: { xs: 1, sm: 2 }
                  }}
                >
                  <CheckCircleIcon 
                    fontSize={isMobile ? "medium" : "large"} 
                    sx={{ color: theme.palette.success.main }} 
                  />
                </Avatar>
                <Typography 
                  variant="h5" 
                  component="div" 
                  align="center" 
                  sx={{ 
                    fontWeight: 600,
                    fontSize: { xs: '1.25rem', sm: '1.5rem' }
                  }}
                >
                  {stats.completedCount}
                </Typography>
                <Typography 
                  variant="body2" 
                  color="textSecondary" 
                  align="center"
                  sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                >
                  Completed Courses
                </Typography>
              </Paper>
            </Box>
            
            {/* In Progress Courses Card */}
            <Box sx={{ flex: { xs: 'none', sm: '1 1 45%', md: '1' }, minWidth: { xs: '100%', sm: '200px', md: '0' } }}>
              <Paper
                elevation={0}
                sx={{
                  p: { xs: 2, sm: 3 },
                  borderRadius: 2,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: { xs: 120, sm: 140 },
                  transition: 'all 0.25s ease-in-out',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 8px 16px rgba(0,0,0,0.12)'
                  }
                }}
              >
                <Avatar
                  sx={{
                    bgcolor: theme.palette.info.light,
                    width: { xs: 40, sm: 56 },
                    height: { xs: 40, sm: 56 },
                    mb: { xs: 1, sm: 2 }
                  }}
                >
                  <TimerIcon 
                    fontSize={isMobile ? "medium" : "large"} 
                    sx={{ color: theme.palette.info.main }} 
                  />
                </Avatar>
                <Typography 
                  variant="h5" 
                  component="div" 
                  align="center" 
                  sx={{ 
                    fontWeight: 600,
                    fontSize: { xs: '1.25rem', sm: '1.5rem' }
                  }}
                >
                  {stats.inProgressCount}
                </Typography>
                <Typography 
                  variant="body2" 
                  color="textSecondary" 
                  align="center"
                  sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                >
                  In Progress
                </Typography>
              </Paper>
            </Box>
            
            {/* Certificates Earned Card */}
            <Box sx={{ flex: { xs: 'none', sm: '1 1 45%', md: '1' }, minWidth: { xs: '100%', sm: '200px', md: '0' } }}>
              <Paper
                elevation={0}
                sx={{
                  p: { xs: 2, sm: 3 },
                  borderRadius: 2,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: { xs: 120, sm: 140 },
                  transition: 'all 0.25s ease-in-out',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 8px 16px rgba(0,0,0,0.12)'
                  }
                }}
              >
                <Avatar
                  sx={{
                    bgcolor: theme.palette.warning.light,
                    width: { xs: 40, sm: 56 },
                    height: { xs: 40, sm: 56 },
                    mb: { xs: 1, sm: 2 }
                  }}
                >
                  <AssessmentIcon 
                    fontSize={isMobile ? "medium" : "large"} 
                    sx={{ color: theme.palette.warning.main }} 
                  />
                </Avatar>
                <Typography 
                  variant="h5" 
                  component="div" 
                  align="center" 
                  sx={{ 
                    fontWeight: 600,
                    fontSize: { xs: '1.25rem', sm: '1.5rem' }
                  }}
                >
                  {stats.certificatesCount}
                </Typography>
                <Typography 
                  variant="body2" 
                  color="textSecondary" 
                  align="center"
                  sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                >
                  Certificates Earned
                </Typography>
              </Paper>
            </Box>
          </Box>

          {/* Available / Unassigned Courses */}
          {availableCourses.length > 0 && (
            <Box sx={{ mb: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <LockIcon sx={{ mr: 1.5, fontSize: 28, color: 'text.secondary' }} />
                <Box>
                  <Typography
                    variant="h5"
                    component="h2"
                    sx={{ fontWeight: 600, color: theme.palette.text.primary, lineHeight: 1.2 }}
                  >
                    More Courses Available
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    {availableCourses.length} course{availableCourses.length !== 1 ? 's' : ''} you haven't been assigned to yet — sorted by most enrolled. Request access from the administrator.
                  </Typography>
                </Box>
              </Box>

              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: {
                    xs: '1fr',
                    sm: 'repeat(2, 1fr)',
                    md: 'repeat(3, 1fr)'
                  },
                  gap: { xs: 2, sm: 2, md: 3 },
                  width: '100%'
                }}
              >
                {availableCourses.slice(0, displayCount).map((course) => (
                  <Card
                    key={course.id}
                    elevation={0}
                    sx={{
                      height: { xs: 300, sm: 340 },
                      display: 'flex',
                      flexDirection: 'column',
                      borderRadius: 3,
                      overflow: 'hidden',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                      border: '1px dashed rgba(0,0,0,0.15)',
                      opacity: 0.9,
                      transition: 'all 0.3s ease-in-out',
                      '&:hover': {
                        opacity: 1,
                        boxShadow: '0 6px 20px rgba(0,0,0,0.1)',
                        transform: 'translateY(-4px)'
                      }
                    }}
                  >
                    {/* Header */}
                    <Box
                      sx={{
                        height: 110,
                        position: 'relative',
                        background: `linear-gradient(135deg, ${theme.palette.grey[100]}, ${theme.palette.grey[200]})`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderBottom: '1px solid rgba(0,0,0,0.08)'
                      }}
                    >
                      <Avatar
                        sx={{
                          width: 64,
                          height: 64,
                          bgcolor: 'white',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                          border: '2px solid rgba(0,0,0,0.08)'
                        }}
                      >
                        <SchoolIcon sx={{ fontSize: 36, color: theme.palette.grey[500] }} />
                      </Avatar>
                      <Box
                        sx={{
                          position: 'absolute',
                          top: 10,
                          right: 10,
                          bgcolor: 'rgba(0,0,0,0.5)',
                          color: 'white',
                          borderRadius: '10px',
                          px: 1.5,
                          py: 0.5,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 0.5,
                          fontSize: '0.7rem',
                          fontWeight: 600
                        }}
                      >
                        <LockIcon sx={{ fontSize: 12 }} />
                        Not Assigned
                      </Box>

                      {(course.enrolledUsers > 0) && (
                        <Chip
                          icon={<PeopleIcon sx={{ fontSize: 13 }} />}
                          label={`${course.enrolledUsers} enrolled`}
                          size="small"
                          sx={{
                            position: 'absolute',
                            top: 10,
                            left: 10,
                            bgcolor: 'rgba(255,255,255,0.92)',
                            fontSize: '0.68rem',
                            height: 22,
                            '& .MuiChip-icon': { color: theme.palette.primary.main }
                          }}
                        />
                      )}
                    </Box>

                    {/* Content */}
                    <CardContent sx={{ flexGrow: 1, p: 2.5, display: 'flex', flexDirection: 'column' }}>
                      <Typography
                        variant="subtitle1"
                        component="h3"
                        sx={{
                          fontWeight: 700,
                          mb: 1,
                          color: theme.palette.text.primary,
                          overflow: 'hidden',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical'
                        }}
                      >
                        {course.title}
                      </Typography>

                      {course.domain?.name && (
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ mb: 1.5, display: 'flex', alignItems: 'center', gap: 0.5 }}
                        >
                          <DomainIcon fontSize="small" />
                          {course.domain.name}
                        </Typography>
                      )}

                      <Box sx={{ flexGrow: 1 }} />

                      <Button
                        variant="outlined"
                        fullWidth
                        size="medium"
                        startIcon={<LockIcon />}
                        onClick={() => handleOpenLockedDialog(course)}
                        sx={{
                          borderRadius: 2,
                          textTransform: 'none',
                          fontWeight: 600,
                          mt: 1,
                          borderColor: theme.palette.grey[400],
                          color: theme.palette.grey[600],
                          '&:hover': {
                            bgcolor: alpha(theme.palette.grey[400], 0.1)
                          }
                        }}
                      >
                        Request Access
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </Box>

              {/* Show More / Show Less controls */}
              {availableCourses.length > 6 && (
                <Box sx={{ mt: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                  <Typography variant="caption" color="text.secondary">
                    Showing {Math.min(displayCount, availableCourses.length)} of {availableCourses.length} courses
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    {displayCount < availableCourses.length && (
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => setDisplayCount(c => Math.min(c + 6, availableCourses.length))}
                        sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600, px: 3 }}
                      >
                        Show More
                      </Button>
                    )}
                    {displayCount > 6 && (
                      <Button
                        variant="text"
                        size="small"
                        onClick={() => setDisplayCount(6)}
                        sx={{ borderRadius: 2, textTransform: 'none', color: 'text.secondary', px: 3 }}
                      >
                        Show Less
                      </Button>
                    )}
                  </Box>
                </Box>
              )}
            </Box>
          )}

          {/* Completed Courses */}
          <Box sx={{ mb: 4 }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                mb: 3
              }}
            >
              <CheckCircleIcon color="success" sx={{ mr: 1.5, fontSize: 28 }} />
              <Typography
                variant="h5" 
                component="h2" 
                sx={{ 
                  fontWeight: 600,
                  color: theme.palette.text.primary
                }}
              >
                Your Completed Courses
              </Typography>
            </Box>
            
            {loading ? (
              <Box display="flex" justifyContent="center" py={8}>
                <CircularProgress />
              </Box>
            ) : error ? (
              <Alert severity="error" sx={{ mb: 4 }}>
                {error}
              </Alert>
            ) : completedCourses.length === 0 ? (
              <Alert 
                severity="info" 
                sx={{ 
                  p: 3, 
                  borderRadius: 2,
                  mb: 4
                }}
              >
                <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                  No completed courses yet
                </Typography>
                <Typography variant="body2">
                  When you complete a course, it will appear here with a certificate option.
                </Typography>
              </Alert>
            ) : (
              <Box 
                sx={{ 
                  display: 'grid',
                  gridTemplateColumns: {
                    xs: '1fr', // Mobile: 1 column
                    sm: 'repeat(2, 1fr)', // Tablet: 2 columns  
                    md: 'repeat(3, 1fr)' // Desktop: 3 columns max
                  },
                  gap: { xs: 2, sm: 2, md: 3 }, // Match stats cards gap
                  width: '100%' // Remove center alignment, align with stats cards
                }}
              >
                {completedCourses.slice(0, 6).map((course) => ( // Limit to 6 courses max
                  <Card
                    key={course.courseId}
                    elevation={0}
                    sx={{
                      height: { xs: 320, sm: 360, md: 380 }, // Fixed consistent height
                      display: 'flex',
                      flexDirection: 'column',
                      borderRadius: 3,
                      overflow: 'hidden',
                      boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                      transition: 'all 0.3s ease-in-out',
                      cursor: 'pointer',
                      '&:hover': {
                        transform: 'translateY(-6px)',
                        boxShadow: '0 12px 32px rgba(0,0,0,0.15)'
                      }
                    }}
                  >
                    {/* Header Section with Icon and Badge */}
                    <Box
                      sx={{
                        height: 120,
                        position: 'relative',
                        background: `linear-gradient(135deg, ${theme.palette.primary.light}40, ${theme.palette.primary.main}20)`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderBottom: `2px solid ${theme.palette.primary.main}20`
                      }}
                    >
                      <Avatar
                        sx={{
                          width: 70,
                          height: 70,
                          bgcolor: 'white',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                          border: `3px solid ${theme.palette.primary.main}30`
                        }}
                      >
                        <SchoolIcon sx={{ fontSize: 40, color: theme.palette.primary.main }} />
                      </Avatar>
                      
                      {/* Certificate Badge */}
                      {course.hasCertificate && (
                        <Box
                          sx={{
                            position: 'absolute',
                            top: 12,
                            right: 12,
                            bgcolor: theme.palette.success.main,
                            color: 'white',
                            borderRadius: '12px',
                            px: 1.5,
                            py: 0.5,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.5,
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                          }}
                        >
                          <CheckCircleIcon fontSize="small" />
                          Certified
                        </Box>
                      )}

                      {/* Status Badge */}
                      <Chip
                        label="Completed"
                        size="small"
                        sx={{
                          position: 'absolute',
                          bottom: -12,
                          bgcolor: theme.palette.success.main,
                          color: 'white',
                          fontWeight: 600,
                          fontSize: '0.75rem',
                          height: 24
                        }}
                      />
                    </Box>

                    {/* Content Section */}
                    <CardContent sx={{ flexGrow: 1, p: 3, display: 'flex', flexDirection: 'column' }}>
                      <Box sx={{ flexGrow: 1 }}>
                        <MarqueeText
                          text={course.courseName || 'Completed Course'}
                          variant="h6"
                          component="h3"
                          sx={{
                            mb: 1.5,
                            fontWeight: 700,
                            lineHeight: 1.3,
                            color: theme.palette.text.primary,
                            container: {
                              maxHeight: '3em'
                            }
                          }}
                        />

                        <Typography
                          variant="body2"
                          color="textSecondary"
                          sx={{ 
                            mb: 2,
                            fontWeight: 500,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1
                          }}
                        >
                          <DomainIcon fontSize="small" />
                          {course.domain}
                        </Typography>

                        {course.completedAt && (
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              mb: 2
                            }}
                          >
                            <DateRangeIcon
                              fontSize="small"
                              sx={{ mr: 1, color: 'text.secondary' }}
                            />
                            <Typography variant="caption" color="textSecondary">
                              Completed: {new Date(course.completedAt).toLocaleDateString()}
                            </Typography>
                          </Box>
                        )}
                      </Box>

                      {/* Action Button */}
                      <Button
                        variant="contained"
                        fullWidth
                        size="large"
                        startIcon={<DownloadIcon />}
                        onClick={() => course.hasCertificate ?
                          handleDownloadCertificate(course.certificateId) :
                          handleGenerateCertificate(course.courseId)
                        }
                        sx={{
                          borderRadius: 3,
                          py: 1.5,
                          textTransform: 'none',
                          fontWeight: 700,
                          fontSize: '0.9rem',
                          background: course.hasCertificate ? 
                            'linear-gradient(135deg, #2196f3 0%, #1976d2 100%)' :
                            'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)',
                          '&:hover': {
                            background: course.hasCertificate ?
                              'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)' :
                              'linear-gradient(135deg, #f57c00 0%, #ef6c00 100%)',
                          }
                        }}
                      >
                        {course.hasCertificate ? "Download Certificate" : "Generate Certificate"}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            )}
          </Box>

        </Container>
      </Box>
      
      {viewCertificate && (
        <CertificateViewer
          open={Boolean(viewCertificate)}
          onClose={() => setViewCertificate(null)}
          courseId={viewCertificate.courseId}
          courseName={viewCertificate.courseName}
        />
      )}

      <IncompleteAttemptWarning
        open={showIncompleteWarning}
        onClose={() => setShowIncompleteWarning(false)}
      />

      <ProfileCompletionModal
        open={showProfileCompletion}
        onClose={() => setShowProfileCompletion(false)}
        currentUser={fullUserData}
      />

      {/* Locked Course Dialog — same as My Courses page */}
      <Dialog
        open={lockedDialogOpen}
        onClose={() => setLockedDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, p: 1 } }}
      >
        <DialogTitle sx={{ textAlign: 'center', pt: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{
              width: 64,
              height: 64,
              bgcolor: alpha(theme.palette.warning.main, 0.1),
              color: theme.palette.warning.main
            }}>
              <LockIcon sx={{ fontSize: 32 }} />
            </Avatar>
            <Typography variant="h6" fontWeight={700}>Course Access Required</Typography>
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
            onClick={() => setLockedDialogOpen(false)}
            sx={{ borderRadius: 2, px: 3 }}
          >
            I Understand
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default Dashboard;