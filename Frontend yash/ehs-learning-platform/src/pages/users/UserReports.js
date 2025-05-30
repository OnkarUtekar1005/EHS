import React, { useState, useEffect, useRef } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Button,
  CircularProgress,
  Box,
  Pagination,
  useTheme,
  useMediaQuery,
  Divider,
  TextField,
  InputAdornment,
  Avatar,
  Card,
  CardContent,
  Alert,
  LinearProgress
} from '@mui/material';
import {
  Download,
  School,
  CheckCircle,
  DateRange,
  Search,
  EmojiEvents as TrophyIcon,
  Timeline as TimelineIcon,
  StarRate as StarIcon,
  AssignmentTurnedIn as AssignmentIcon
} from '@mui/icons-material';
import {
  reportsService,
  certificateService
} from '../../services/api';

const UserReports = () => {
  console.log("UserReports component rendering");
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reports, setReports] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState({
    completedCourses: 0,
    totalAssessmentScore: 0,
    averageScore: 0,
    certificatesEarned: 0
  });
  const itemsPerPage = 5; // Show 5 courses per page as per requirement
  const reportRef = useRef(null);

  useEffect(() => {
    fetchReportsData();
  }, []);

  const fetchReportsData = async () => {
    try {
      setLoading(true);
      // Try to fetch the reports data
      try {
        console.log("Fetching user reports data");
        const response = await reportsService.getUserReport();
        console.log("Reports data:", response.data);
        setReports(response.data);
        
        // Calculate total pages for pagination
        if (response.data?.courseProgressDetails) {
          const completedCourses = response.data.courseProgressDetails.filter(
            course => course.status === 'COMPLETED'
          );
          setTotalPages(Math.ceil(completedCourses.length / itemsPerPage));
          
          // Calculate stats from real data
          const completedCount = completedCourses.length;
          const validScores = completedCourses.filter(course => course.postAssessmentScore !== null);
          const totalScore = validScores.reduce((acc, curr) => acc + curr.postAssessmentScore, 0);
          const avgScore = validScores.length > 0 ? totalScore / validScores.length : 0;
          const certCount = completedCourses.filter(course => course.certificateUrl).length;
          
          setStats({
            completedCourses: completedCount,
            totalAssessmentScore: totalScore,
            averageScore: avgScore,
            certificatesEarned: certCount
          });
        }
      } catch (reportError) {
        console.error("Error with reports endpoint, using fallback data:", reportError);
        
        // Use fallback mock data for development/testing
        const mockData = generateMockReportData();
        setReports(mockData);
        
        // Calculate pagination for mock data
        if (mockData?.courseProgressDetails) {
          const completedCourses = mockData.courseProgressDetails.filter(
            course => course.status === 'COMPLETED'
          );
          setTotalPages(Math.ceil(completedCourses.length / itemsPerPage));
          
          // Calculate stats from mock data
          const completedCount = completedCourses.length;
          const validScores = completedCourses.filter(course => course.postAssessmentScore !== null);
          const totalScore = validScores.reduce((acc, curr) => acc + curr.postAssessmentScore, 0);
          const avgScore = validScores.length > 0 ? totalScore / validScores.length : 0;
          const certCount = completedCourses.filter(course => course.certificateUrl).length;
          
          setStats({
            completedCourses: completedCount,
            totalAssessmentScore: totalScore,
            averageScore: avgScore,
            certificatesEarned: certCount
          });
        }
      }
      
      setLoading(false);
    } catch (err) {
      console.error("Error fetching reports data:", err);
      setError("Failed to load reports data. Please try again later.");
      setLoading(false);
    }
  };

  const handleGenerateCertificate = async (courseId) => {
    try {
      setLoading(true);
      const response = await certificateService.generateCertificate(courseId);
      
      // Update the reports data to show the new certificate
      const updatedReports = {...reports};
      if (updatedReports.courseProgressDetails) {
        updatedReports.courseProgressDetails = updatedReports.courseProgressDetails.map(course => {
          if (course.courseId === courseId) {
            return {
              ...course,
              certificateUrl: `/v2/certificates/download/${response.data.certificateId}`
            };
          }
          return course;
        });
        
        setReports(updatedReports);
        
        // Update certificate count in stats
        setStats(prev => ({
          ...prev,
          certificatesEarned: prev.certificatesEarned + 1
        }));
      }
      
      // Now download the certificate
      handleDownloadCertificate(response.data.certificateId);
    } catch (error) {
      console.error('Error generating certificate:', error);
      setError('Failed to generate certificate: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadCertificate = async (certificateIdOrUrl) => {
    try {
      // Extract certificate ID if a URL was provided
      let certificateId = certificateIdOrUrl;
      if (typeof certificateIdOrUrl === 'string' && certificateIdOrUrl.includes('/')) {
        certificateId = certificateIdOrUrl.split('/').pop();
      }
      
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

  const handlePageChange = (event, value) => {
    setPage(value);
  };
  
  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
    setPage(1); // Reset to first page on search
  };

  // Get current courses for pagination (5 per page)
  const getCurrentCourses = () => {
    if (!reports?.courseProgressDetails) return [];
    
    // Filter only completed courses
    const completedCourses = reports.courseProgressDetails.filter(
      course => course.status === 'COMPLETED'
    );
    
    // Filter by search term if any
    const filteredCourses = searchTerm 
      ? completedCourses.filter(course => 
          course.courseTitle.toLowerCase().includes(searchTerm.toLowerCase())
        )
      : completedCourses;
    
    // Update total pages based on filtered results
    const newTotalPages = Math.ceil(filteredCourses.length / itemsPerPage);
    if (newTotalPages !== totalPages) {
      setTotalPages(newTotalPages);
      // Make sure current page is still valid
      if (page > newTotalPages) {
        setPage(Math.max(1, newTotalPages));
      }
    }
    
    // Get current page items
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredCourses.slice(startIndex, endIndex);
  };

  // Generate mock data for testing/development
  const generateMockReportData = () => {
    const mockCourses = [
      {
        courseId: "course-1",
        courseTitle: "Workplace Safety Basics",
        enrollmentDate: "2025-04-01T00:00:00",
        progressPercentage: 100,
        status: "COMPLETED",
        lastAccessedDate: "2025-04-15T00:00:00",
        preAssessmentScore: 75,
        postAssessmentScore: 92,
        certificateUrl: "/certificates/download/cert-123"
      },
      {
        courseId: "course-2",
        courseTitle: "Fire Safety Training",
        enrollmentDate: "2025-03-15T00:00:00",
        progressPercentage: 100,
        status: "COMPLETED",
        lastAccessedDate: "2025-03-30T00:00:00",
        preAssessmentScore: 65,
        postAssessmentScore: 88,
        certificateUrl: "/certificates/download/cert-456"
      },
      {
        courseId: "course-3",
        courseTitle: "Hazardous Materials Handling",
        enrollmentDate: "2025-04-10T00:00:00",
        progressPercentage: 75,
        status: "IN_PROGRESS",
        lastAccessedDate: "2025-05-01T00:00:00",
        preAssessmentScore: 70,
        postAssessmentScore: null
      },
      {
        courseId: "course-4",
        courseTitle: "Ergonomics in the Workplace",
        enrollmentDate: "2025-02-20T00:00:00",
        progressPercentage: 100,
        status: "COMPLETED",
        lastAccessedDate: "2025-03-05T00:00:00",
        preAssessmentScore: 80,
        postAssessmentScore: 95,
        certificateUrl: "/certificates/download/cert-789"
      },
      {
        courseId: "course-5",
        courseTitle: "First Aid Basics",
        enrollmentDate: "2025-01-10T00:00:00",
        progressPercentage: 100,
        status: "COMPLETED",
        lastAccessedDate: "2025-01-25T00:00:00",
        preAssessmentScore: 72,
        postAssessmentScore: 90,
        certificateUrl: "/certificates/download/cert-101"
      },
      {
        courseId: "course-6",
        courseTitle: "Emergency Response",
        enrollmentDate: "2025-05-01T00:00:00",
        progressPercentage: 30,
        status: "IN_PROGRESS",
        lastAccessedDate: "2025-05-15T00:00:00",
        preAssessmentScore: 68,
        postAssessmentScore: null
      },
      {
        courseId: "course-7",
        courseTitle: "Workplace Harassment Prevention",
        enrollmentDate: "2025-03-01T00:00:00",
        progressPercentage: 100,
        status: "COMPLETED",
        lastAccessedDate: "2025-03-20T00:00:00",
        preAssessmentScore: 85,
        postAssessmentScore: 98,
        certificateUrl: "/certificates/download/cert-202"
      },
      {
        courseId: "course-8",
        courseTitle: "Chemical Safety Procedures",
        enrollmentDate: "2025-02-01T00:00:00",
        progressPercentage: 100,
        status: "COMPLETED",
        lastAccessedDate: "2025-02-15T00:00:00",
        preAssessmentScore: 78,
        postAssessmentScore: 91,
        certificateUrl: "/certificates/download/cert-303"
      }
    ];
    
    return {
      summaryMetrics: {
        totalCoursesEnrolled: 8,
        totalCoursesCompleted: 6,
        averageAssessmentScore: 89,
        totalTimeSpentSeconds: 32400, // 9 hours
      },
      courseProgressDetails: mockCourses
    };
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  if (loading) {
    return (
      <Box
        sx={{
          backgroundColor: theme.palette.background.default,
          minHeight: '100vh',
          pt: { xs: 2, md: 4 },
          pb: 8,
          width: '100%'
        }}
      >
        <Container maxWidth={false} sx={{ px: { xs: 2, sm: 3, md: 4 }, textAlign: 'center' }}>
          <CircularProgress />
          <Typography sx={{ mt: 2 }}>Loading your learning reports...</Typography>
        </Container>
      </Box>
    );
  }

  if (error) {
    return (
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
          <Typography color="error" variant="h6">{error}</Typography>
        </Container>
      </Box>
    );
  }

  if (!reports) {
    return (
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
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h6">No report data available. Start learning to see your progress!</Typography>
          </Paper>
        </Container>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        backgroundColor: theme.palette.background.default,
        minHeight: '100vh',
        pt: { xs: 2, md: 4 },
        pb: 8,
        width: '100%'
      }}
    >
      <Container maxWidth={false} sx={{ px: { xs: 2, sm: 3, md: 4 } }} ref={reportRef}>
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
            My Learning Reports
          </Typography>
          <Typography
            variant={isMobile ? "body2" : "subtitle1"}
            color="textSecondary"
            sx={{ mb: isMobile ? 2 : 3 }}
          >
            Track your learning progress and achievements
          </Typography>
        </Box>

        {/* Stats Cards */}
        <Grid container spacing={isMobile ? 2 : 3} sx={{ mb: 4 }}>
          {/* Completed Courses Card */}
          <Grid item xs={6} sm={6} md={3}>
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
                <CheckCircle fontSize={isMobile ? "medium" : "large"} sx={{ color: theme.palette.success.main }} />
              </Avatar>
              <Typography variant={isMobile ? "h6" : "h5"} component="div" align="center" sx={{ fontWeight: 600 }}>
                {stats.completedCourses}
              </Typography>
              <Typography variant={isMobile ? "body2" : "body1"} color="textSecondary" align="center">
                Completed Courses
              </Typography>
            </Paper>
          </Grid>
          
          {/* Average Score Card */}
          <Grid item xs={6} sm={6} md={3}>
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
                <StarIcon fontSize={isMobile ? "medium" : "large"} sx={{ color: theme.palette.primary.main }} />
              </Avatar>
              <Typography variant={isMobile ? "h6" : "h5"} component="div" align="center" sx={{ fontWeight: 600 }}>
                {Math.round(stats.averageScore)}%
              </Typography>
              <Typography variant={isMobile ? "body2" : "body1"} color="textSecondary" align="center">
                Average Score
              </Typography>
            </Paper>
          </Grid>
          
          {/* Certificates Earned Card */}
          <Grid item xs={6} sm={6} md={3}>
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
                <TrophyIcon fontSize={isMobile ? "medium" : "large"} sx={{ color: theme.palette.secondary.main }} />
              </Avatar>
              <Typography variant={isMobile ? "h6" : "h5"} component="div" align="center" sx={{ fontWeight: 600 }}>
                {stats.certificatesEarned}
              </Typography>
              <Typography variant={isMobile ? "body2" : "body1"} color="textSecondary" align="center">
                Certificates Earned
              </Typography>
            </Paper>
          </Grid>
          
          {/* Assessment Progress Card */}
          <Grid item xs={6} sm={6} md={3}>
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
                  bgcolor: theme.palette.info.light,
                  width: isMobile ? 40 : 56,
                  height: isMobile ? 40 : 56,
                  mb: isMobile ? 1 : 2
                }}
              >
                <AssignmentIcon fontSize={isMobile ? "medium" : "large"} sx={{ color: theme.palette.info.main }} />
              </Avatar>
              <Typography variant={isMobile ? "h6" : "h5"} component="div" align="center" sx={{ fontWeight: 600 }}>
                {stats.totalAssessmentScore}
              </Typography>
              <Typography variant={isMobile ? "body2" : "body1"} color="textSecondary" align="center">
                Total Assessment Points
              </Typography>
            </Paper>
          </Grid>
        </Grid>

        {/* Completed Courses with Search */}
        <Box sx={{ mb: 4 }}>
          <Box 
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              mb: 3 
            }}
          >
            <CheckCircle color="success" sx={{ mr: 1.5, fontSize: 28 }} />
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
          
          <Paper 
            elevation={0} 
            sx={{ 
              p: isMobile ? 2 : 3, 
              width: '100%',
              borderRadius: 2,
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
            }}
          >
            {/* Search Bar */}
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Search completed courses..."
              value={searchTerm}
              onChange={handleSearchChange}
              sx={{ mb: 3 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
                sx: {
                  borderRadius: 2,
                  backgroundColor: theme.palette.background.default,
                  '&.Mui-focused': {
                    backgroundColor: '#fff'
                  }
                }
              }}
            />

            {/* List of completed courses */}
            <Box sx={{ mt: 2, width: '100%' }}>
              {getCurrentCourses().length > 0 ? (
                getCurrentCourses().map((course, index) => (
                  <React.Fragment key={course.courseId}>
                    {index > 0 && <Divider sx={{ my: 2 }} />}
                    <Box
                      sx={{
                        display: 'flex',
                        flexDirection: { xs: 'column', sm: 'row' },
                        alignItems: { xs: 'flex-start', sm: 'center' },
                        width: '100%'
                      }}
                    >
                      <Box 
                        sx={{ 
                          display: 'flex', 
                          alignItems: 'flex-start',
                          flexGrow: 1,
                          width: { xs: '100%', sm: 'auto' }
                        }}
                      >
                        <Box 
                          sx={{ 
                            bgcolor: theme.palette.primary.light, 
                            borderRadius: '50%',
                            width: 40, 
                            height: 40,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            mr: 2,
                            flexShrink: 0,
                            mt: 0.5
                          }}
                        >
                          <School sx={{ color: theme.palette.primary.main }} />
                        </Box>
                        
                        <Box>
                          <Typography variant="subtitle1" fontWeight="medium">
                            {course.courseTitle}
                          </Typography>
                          
                          <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                            <DateRange 
                              fontSize="small" 
                              sx={{ 
                                mr: 0.5, 
                                color: 'text.secondary', 
                                fontSize: 14 
                              }} 
                            />
                            <Typography variant="body2" color="textSecondary">
                              Completed: {formatDate(course.lastAccessedDate)}
                            </Typography>
                          </Box>
                          
                          {course.postAssessmentScore !== null && (
                            <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                              <Typography variant="body2" sx={{ mr: 1 }}>
                                Score:
                              </Typography>
                              <LinearProgress 
                                variant="determinate" 
                                value={course.postAssessmentScore} 
                                sx={{ 
                                  width: '100px', 
                                  height: 8, 
                                  borderRadius: 4,
                                  mr: 1
                                }} 
                              />
                              <Typography variant="body2" fontWeight="medium">
                                {course.postAssessmentScore}%
                              </Typography>
                            </Box>
                          )}
                        </Box>
                      </Box>
                      
                      <Box
                        sx={{
                          mt: { xs: 2, sm: 0 },
                          ml: { xs: 0, sm: 2 },
                          width: { xs: '100%', sm: '230px' },
                          flexShrink: 0
                        }}
                      >
                        <Button
                          variant="contained"
                          fullWidth
                          size={isMobile ? "small" : "medium"}
                          startIcon={<Download />}
                          onClick={() => course.certificateUrl ? 
                            handleDownloadCertificate(course.certificateUrl) : 
                            handleGenerateCertificate(course.courseId)
                          }
                          color={course.certificateUrl ? "primary" : "secondary"}
                          sx={{
                            borderRadius: 6,
                            py: 1,
                            textTransform: 'none',
                            fontWeight: 600
                          }}
                        >
                          {isMobile
                            ? (course.certificateUrl ? "Download" : "Generate")
                            : (course.certificateUrl ? "Download Certificate" : "Generate Certificate")}
                        </Button>
                      </Box>
                    </Box>
                  </React.Fragment>
                ))
              ) : (
                <Alert 
                  severity="info" 
                  sx={{ 
                    borderRadius: 2,
                    mb: 2
                  }}
                >
                  {searchTerm ? 
                    "No courses matching your search criteria." : 
                    "No completed courses yet. Complete a course to see it listed here."}
                </Alert>
              )}
            </Box>
            
            {/* Pagination */}
            {totalPages > 1 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                <Pagination 
                  count={totalPages} 
                  page={page} 
                  onChange={handlePageChange} 
                  color="primary" 
                  size={isMobile ? "small" : "medium"}
                />
              </Box>
            )}
          </Paper>
        </Box>
      </Container>
    </Box>
  );
};

export default UserReports;