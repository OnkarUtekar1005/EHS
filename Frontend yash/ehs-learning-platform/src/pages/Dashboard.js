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
  useTheme,
  useMediaQuery,
  Avatar
} from '@mui/material';
import { 
  Download as DownloadIcon, 
  School as SchoolIcon, 
  CheckCircle as CheckCircleIcon,
  DateRange as DateRangeIcon,
  Timer as TimerIcon,
  Assessment as AssessmentIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import IncompleteAttemptWarning from '../components/assessment/IncompleteAttemptWarning';
import CertificateViewer from '../components/certificate/CertificateViewer';
import { assessmentService, certificateService, courseService } from '../services/api';

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
  const [stats, setStats] = useState({
    completedCount: 0,
    inProgressCount: 0,
    certificatesCount: 0
  });
  
  useEffect(() => {
    checkIncompleteAttempts();
    loadCourses();
  }, []);
  
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

  // Load courses in the same way MyCourses does - only published courses will be included
  const loadCourses = async () => {
    try {
      setLoading(true);

      // Use the same endpoint as MyCourses to get ONLY published courses
      const coursesResponse = await courseService.getUserCourses({
        showAll: true,
        limit: 3 // Only get 3 courses for the dashboard as per requirement
      });

      const publishedCourses = coursesResponse.data.courses || [];
      console.log('Published courses (limited to 3):', publishedCourses);

      // Find which of these published courses have been completed by the user and have certificates
      const coursesWithCertificates = await Promise.all(
        publishedCourses.map(async (course) => {
          try {
            // Check if the course has a certificate
            const certResponse = await certificateService.getUserCourseCertificate(course.id);

            // Only include courses that have been completed and have a certificate or can have one generated
            if (certResponse.data.exists || course.status === 'COMPLETED') {
              return {
                courseId: course.id,
                courseName: course.title,
                hasCertificate: certResponse.data.exists,
                certificateId: certResponse.data.exists ? certResponse.data.certificateId : null,
                completedAt: certResponse.data.issuedDate || course.completedAt, // Use certificate issue date or course completion date
                domain: course.domain?.name || 'EHS Training'
              };
            }
            return null;
          } catch (error) {
            console.error(`Error fetching certificate for course ${course.id}:`, error);
            return null;
          }
        })
      );

      // Filter out null values (courses without certificates or not completed)
      const validCourses = coursesWithCertificates.filter(course => course !== null);
      console.log('Courses with certificates (limited to 3):', validCourses);

      setCompletedCourses(validCourses);

      // Update statistics
      setStats({
        completedCount: validCourses.length,
        inProgressCount: publishedCourses.filter(course => course.status === 'IN_PROGRESS').length,
        certificatesCount: validCourses.filter(course => course.hasCertificate).length
      });
    } catch (error) {
      console.error('Error loading courses:', error);
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
      console.error('Error generating certificate:', error);
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
      console.error('Error downloading certificate:', error);
      setError('Failed to download certificate: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleViewCertificate = (course) => {
    setViewCertificate({
      courseId: course.courseId,
      courseName: course.courseName
    });
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

          {/* Stats Cards */}
          <Grid container spacing={isMobile ? 2 : 3} sx={{ mb: 4 }}>
            <Grid item xs={6} sm={6} md={4}>
              <Paper
                elevation={0}
                sx={{
                  p: isMobile ? 2 : 3,
                  borderRadius: 2,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Avatar
                  sx={{
                    bgcolor: theme.palette.success.light,
                    width: isMobile ? 40 : 56,
                    height: isMobile ? 40 : 56,
                    mb: isMobile ? 1 : 2
                  }}
                >
                  <CheckCircleIcon fontSize={isMobile ? "medium" : "large"} sx={{ color: theme.palette.success.main }} />
                </Avatar>
                <Typography variant={isMobile ? "h6" : "h5"} component="div" align="center" sx={{ fontWeight: 600 }}>
                  {stats.completedCount}
                </Typography>
                <Typography variant={isMobile ? "body2" : "body1"} color="textSecondary" align="center">
                  Completed
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={6} sm={6} md={4}>
              <Paper
                elevation={0}
                sx={{
                  p: isMobile ? 2 : 3,
                  borderRadius: 2,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Avatar
                  sx={{
                    bgcolor: theme.palette.primary.light,
                    width: isMobile ? 40 : 56,
                    height: isMobile ? 40 : 56,
                    mb: isMobile ? 1 : 2
                  }}
                >
                  <TimerIcon fontSize={isMobile ? "medium" : "large"} sx={{ color: theme.palette.primary.main }} />
                </Avatar>
                <Typography variant={isMobile ? "h6" : "h5"} component="div" align="center" sx={{ fontWeight: 600 }}>
                  {stats.inProgressCount}
                </Typography>
                <Typography variant={isMobile ? "body2" : "body1"} color="textSecondary" align="center">
                  In Progress
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Paper
                elevation={0}
                sx={{
                  p: isMobile ? 2 : 3,
                  borderRadius: 2,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Avatar
                  sx={{
                    bgcolor: theme.palette.secondary.light,
                    width: isMobile ? 40 : 56,
                    height: isMobile ? 40 : 56,
                    mb: isMobile ? 1 : 2
                  }}
                >
                  <AssessmentIcon fontSize={isMobile ? "medium" : "large"} sx={{ color: theme.palette.secondary.main }} />
                </Avatar>
                <Typography variant={isMobile ? "h6" : "h5"} component="div" align="center" sx={{ fontWeight: 600 }}>
                  {stats.certificatesCount}
                </Typography>
                <Typography variant={isMobile ? "body2" : "body1"} color="textSecondary" align="center">
                  Certificates
                </Typography>
              </Paper>
            </Grid>
          </Grid>

          {/* Main Content */}
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
              <Grid container spacing={3}>
                {completedCourses.map((course) => (
                  <Grid
                    item
                    xs={12}
                    sm={isMobile ? 12 : isTablet ? 6 : 4}
                    key={course.courseId}
                  >
                    <Card
                      elevation={0}
                      sx={{
                        height: '100%',
                        display: 'flex',
                        flexDirection: isMobile ? 'row' : 'column',
                        borderRadius: 2,
                        overflow: 'hidden',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                        transition: 'all 0.25s ease-in-out',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: '0 8px 16px rgba(0,0,0,0.12)'
                        }
                      }}
                    >
                      <Box
                        sx={{
                          p: 0,
                          position: 'relative',
                          width: isMobile ? '120px' : '100%',
                          height: isMobile ? 'auto' : 140,
                          backgroundColor: theme.palette.primary.light,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}
                      >
                        <SchoolIcon sx={{ fontSize: isMobile ? 40 : 60, color: theme.palette.primary.main }} />
                        {course.hasCertificate && (
                          <Box
                            sx={{
                              position: 'absolute',
                              top: 16,
                              right: 16,
                              bgcolor: theme.palette.success.main,
                              color: 'white',
                              borderRadius: '50%',
                              width: isMobile ? 24 : 32,
                              height: isMobile ? 24 : 32,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            <CheckCircleIcon fontSize={isMobile ? "small" : "medium"} />
                          </Box>
                        )}
                      </Box>

                      <Box sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                        <CardContent sx={{ flexGrow: 1, p: isMobile ? 2 : 3 }}>
                          <Typography
                            variant={isMobile ? "subtitle1" : "h6"}
                            component="h3"
                            sx={{
                              mb: 1,
                              fontWeight: 600,
                              lineHeight: 1.3
                            }}
                          >
                            {course.courseName || 'Completed Course'}
                          </Typography>

                          <Typography
                            variant="body2"
                            color="textSecondary"
                            sx={{ mb: isMobile ? 1 : 2 }}
                          >
                            {course.domain}
                          </Typography>

                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              mb: 1
                            }}
                          >
                            <CheckCircleIcon
                              color="success"
                              fontSize="small"
                              sx={{ mr: 1 }}
                            />
                            <Typography variant="body2">
                              Completed
                            </Typography>
                          </Box>

                          {course.completedAt && !isMobile && (
                            <Box
                              sx={{
                                display: 'flex',
                                alignItems: 'center'
                              }}
                            >
                              <DateRangeIcon
                                fontSize="small"
                                sx={{
                                  mr: 1,
                                  color: 'text.secondary',
                                  fontSize: 16
                                }}
                              />
                              <Typography
                                variant="body2"
                                color="textSecondary"
                              >
                                Completed on: {new Date(course.completedAt).toLocaleDateString()}
                              </Typography>
                            </Box>
                          )}
                        </CardContent>

                        <CardActions sx={{ p: isMobile ? 2 : 3, pt: 0 }}>
                          <Button
                            variant="contained"
                            fullWidth
                            size={isMobile ? "small" : "medium"}
                            startIcon={<DownloadIcon />}
                            onClick={() => course.hasCertificate ?
                              handleDownloadCertificate(course.certificateId) :
                              handleGenerateCertificate(course.courseId)
                            }
                            color={course.hasCertificate ? "primary" : "secondary"}
                            sx={{
                              borderRadius: 6,
                              py: isMobile ? 0.8 : 1.2,
                              textTransform: 'none',
                              fontWeight: 600
                            }}
                          >
                            {course.hasCertificate ? (isMobile ? "Download" : "Download Certificate") : (isMobile ? "Generate" : "Generate Certificate")}
                          </Button>
                        </CardActions>
                      </Box>
                    </Card>
                  </Grid>
                ))}
              </Grid>
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
    </>
  );
};

export default Dashboard;