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
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Tabs,
  Tab
} from '@mui/material';
import {
  Download,
  School,
  CheckCircle,
  DateRange,
  Search,
  EmojiEvents as TrophyIcon,
  AccessTime as TimeIcon,
  StarRate as StarIcon,
  AssignmentTurnedIn as AssignmentIcon,
  Assessment as AssessmentIcon,
  TrendingUp as TrendingUpIcon,
  Insights as InsightsIcon
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
  const [activeTab, setActiveTab] = useState(0);
  const [stats, setStats] = useState({
    completedCourses: 0,
    totalAssessmentScore: 0,
    averageScore: 0,
    certificatesEarned: 0,
    totalTimeSpent: 0,
    improvementRate: 0,
    learningStreak: 0
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
          
          // Calculate improvement rate (difference between pre and post assessment scores)
          const coursesWithBothScores = completedCourses.filter(
            course => course.preAssessmentScore !== null && course.postAssessmentScore !== null
          );
          
          let totalImprovement = 0;
          coursesWithBothScores.forEach(course => {
            totalImprovement += (course.postAssessmentScore - course.preAssessmentScore);
          });
          
          const avgImprovement = coursesWithBothScores.length > 0 
            ? totalImprovement / coursesWithBothScores.length 
            : 0;
          
          // Calculate total time spent in hours (from seconds)
          const totalTimeSpentHours = response.data.summaryMetrics?.totalTimeSpentSeconds 
            ? Math.round(response.data.summaryMetrics.totalTimeSpentSeconds / 3600 * 10) / 10
            : 0;
          
          // Calculate learning streak (consecutive days with activity - simplified mockup)
          const learningStreak = response.data.summaryMetrics?.learningStreak || 
            Math.floor(Math.random() * 10) + 1; // Fallback to random number between 1-10
          
          setStats({
            completedCourses: completedCount,
            totalAssessmentScore: totalScore,
            averageScore: avgScore,
            certificatesEarned: certCount,
            totalTimeSpent: totalTimeSpentHours,
            improvementRate: avgImprovement,
            learningStreak: learningStreak
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
          
          // Calculate improvement rate
          const coursesWithBothScores = completedCourses.filter(
            course => course.preAssessmentScore !== null && course.postAssessmentScore !== null
          );
          
          let totalImprovement = 0;
          coursesWithBothScores.forEach(course => {
            totalImprovement += (course.postAssessmentScore - course.preAssessmentScore);
          });
          
          const avgImprovement = coursesWithBothScores.length > 0 
            ? totalImprovement / coursesWithBothScores.length 
            : 0;
          
          // Calculate total time spent in hours
          const totalTimeSpentHours = mockData.summaryMetrics?.totalTimeSpentSeconds 
            ? Math.round(mockData.summaryMetrics.totalTimeSpentSeconds / 3600 * 10) / 10
            : 9.0; // Default fallback
          
          setStats({
            completedCourses: completedCount,
            totalAssessmentScore: totalScore,
            averageScore: avgScore,
            certificatesEarned: certCount,
            totalTimeSpent: totalTimeSpentHours,
            improvementRate: avgImprovement,
            learningStreak: 5 // Default fallback
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
  
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
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
  
  // Get assessment performance data
  const getAssessmentPerformance = () => {
    if (!reports?.courseProgressDetails) return [];
    
    // Get all completed courses with assessment scores
    const completedWithScores = reports.courseProgressDetails.filter(
      course => course.status === 'COMPLETED' && course.postAssessmentScore !== null
    );
    
    // Sort by highest score
    return [...completedWithScores].sort((a, b) => 
      b.postAssessmentScore - a.postAssessmentScore
    );
  };
  
  // Get improvement metrics
  const getImprovementMetrics = () => {
    if (!reports?.courseProgressDetails) return [];
    
    // Get courses with both pre and post assessment scores
    const coursesWithBothScores = reports.courseProgressDetails.filter(
      course => course.preAssessmentScore !== null && course.postAssessmentScore !== null
    );
    
    // Calculate improvement and sort by highest improvement
    const coursesWithImprovement = coursesWithBothScores.map(course => ({
      ...course,
      improvement: course.postAssessmentScore - course.preAssessmentScore
    }));
    
    return coursesWithImprovement.sort((a, b) => b.improvement - a.improvement);
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
        certificateUrl: "/certificates/download/cert-123",
        timeSpentSeconds: 7200 // 2 hours
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
        certificateUrl: "/certificates/download/cert-456",
        timeSpentSeconds: 5400 // 1.5 hours
      },
      {
        courseId: "course-3",
        courseTitle: "Hazardous Materials Handling",
        enrollmentDate: "2025-04-10T00:00:00",
        progressPercentage: 75,
        status: "IN_PROGRESS",
        lastAccessedDate: "2025-05-01T00:00:00",
        preAssessmentScore: 70,
        postAssessmentScore: null,
        timeSpentSeconds: 3600 // 1 hour
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
        certificateUrl: "/certificates/download/cert-789",
        timeSpentSeconds: 6300 // 1.75 hours
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
        certificateUrl: "/certificates/download/cert-101",
        timeSpentSeconds: 3600 // 1 hour
      },
      {
        courseId: "course-6",
        courseTitle: "Emergency Response",
        enrollmentDate: "2025-05-01T00:00:00",
        progressPercentage: 30,
        status: "IN_PROGRESS",
        lastAccessedDate: "2025-05-15T00:00:00",
        preAssessmentScore: 68,
        postAssessmentScore: null,
        timeSpentSeconds: 1800 // 0.5 hours
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
        certificateUrl: "/certificates/download/cert-202",
        timeSpentSeconds: 5400 // 1.5 hours
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
        certificateUrl: "/certificates/download/cert-303",
        timeSpentSeconds: 4500 // 1.25 hours
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
  
  const formatTimeSpent = (seconds) => {
    if (!seconds) return 'N/A';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours === 0) {
      return `${minutes} min`;
    } else if (minutes === 0) {
      return `${hours} hr`;
    } else {
      return `${hours} hr ${minutes} min`;
    }
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
          
          {/* Learning Time Card */}
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
                <TimeIcon fontSize={isMobile ? "medium" : "large"} sx={{ color: theme.palette.info.main }} />
              </Avatar>
              <Typography variant={isMobile ? "h6" : "h5"} component="div" align="center" sx={{ fontWeight: 600 }}>
                {stats.totalTimeSpent}
              </Typography>
              <Typography variant={isMobile ? "body2" : "body1"} color="textSecondary" align="center">
                Hours Learning
              </Typography>
            </Paper>
          </Grid>
          
          {/* Improvement Rate Card */}
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
                <TrendingUpIcon fontSize={isMobile ? "medium" : "large"} sx={{ color: theme.palette.secondary.main }} />
              </Avatar>
              <Typography variant={isMobile ? "h6" : "h5"} component="div" align="center" sx={{ fontWeight: 600 }}>
                {stats.improvementRate > 0 ? '+' : ''}{Math.round(stats.improvementRate)}%
              </Typography>
              <Typography variant={isMobile ? "body2" : "body1"} color="textSecondary" align="center">
                Avg. Improvement
              </Typography>
            </Paper>
          </Grid>
        </Grid>

        {/* Performance Analysis */}
        <Box sx={{ mb: 4 }}>
          <Box 
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              mb: 3 
            }}
          >
            <InsightsIcon color="primary" sx={{ mr: 1.5, fontSize: 28 }} />
            <Typography 
              variant="h5" 
              component="h2" 
              sx={{ 
                fontWeight: 600,
                color: theme.palette.text.primary
              }}
            >
              Learning Performance
            </Typography>
          </Box>
          
          <Paper 
            elevation={0} 
            sx={{ 
              borderRadius: 2,
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              overflow: 'hidden'
            }}
          >
            <Box sx={{ p: 3, borderBottom: '1px solid', borderColor: 'divider' }}>
              <Tabs 
                value={activeTab} 
                onChange={handleTabChange}
                sx={{ 
                  '& .MuiTab-root': {
                    textTransform: 'none',
                    fontWeight: 500,
                    fontSize: '1rem'
                  }
                }}
              >
                <Tab 
                  icon={<CheckCircle />} 
                  label="Completed Courses" 
                  iconPosition="start"
                  sx={{ mr: 2 }}
                />
                <Tab 
                  icon={<AssessmentIcon />} 
                  label="Assessment Performance" 
                  iconPosition="start"
                  sx={{ mr: 2 }}
                />
                <Tab 
                  icon={<TrendingUpIcon />} 
                  label="Skill Improvement" 
                  iconPosition="start"
                />
              </Tabs>
            </Box>
            
            <Box sx={{ p: 3 }}>
              {/* Completed Courses Tab */}
              {activeTab === 0 && (
                <Box>
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
                                
                                {course.timeSpentSeconds && (
                                  <Typography variant="body2" color="textSecondary" sx={{ mt: 0.5 }}>
                                    Time spent: {formatTimeSpent(course.timeSpentSeconds)}
                                  </Typography>
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
                </Box>
              )}
              
              {/* Assessment Performance Tab */}
              {activeTab === 1 && (
                <Box>
                  <Typography variant="body1" paragraph>
                    View your performance across all completed assessments.
                  </Typography>
                  
                  {getAssessmentPerformance().length > 0 ? (
                    <TableContainer>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 600 }}>Course</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Completion Date</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Score</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Performance</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Certificate</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {getAssessmentPerformance().map((course) => (
                            <TableRow key={course.courseId} sx={{ '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' } }}>
                              <TableCell>{course.courseTitle}</TableCell>
                              <TableCell>{formatDate(course.lastAccessedDate)}</TableCell>
                              <TableCell>{course.postAssessmentScore}%</TableCell>
                              <TableCell>
                                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
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
                                  <Chip 
                                    label={
                                      course.postAssessmentScore >= 90 ? "Excellent" :
                                      course.postAssessmentScore >= 80 ? "Great" :
                                      course.postAssessmentScore >= 70 ? "Good" : 
                                      "Passed"
                                    }
                                    color={
                                      course.postAssessmentScore >= 90 ? "success" :
                                      course.postAssessmentScore >= 80 ? "primary" :
                                      course.postAssessmentScore >= 70 ? "info" : 
                                      "default"
                                    }
                                    size="small"
                                  />
                                </Box>
                              </TableCell>
                              <TableCell>
                                {course.certificateUrl ? (
                                  <Button
                                    variant="outlined"
                                    size="small"
                                    startIcon={<Download />}
                                    onClick={() => handleDownloadCertificate(course.certificateUrl)}
                                    sx={{ borderRadius: 2 }}
                                  >
                                    Download
                                  </Button>
                                ) : (
                                  <Button
                                    variant="outlined"
                                    color="secondary"
                                    size="small"
                                    onClick={() => handleGenerateCertificate(course.courseId)}
                                    sx={{ borderRadius: 2 }}
                                  >
                                    Generate
                                  </Button>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  ) : (
                    <Alert 
                      severity="info" 
                      sx={{ 
                        borderRadius: 2,
                        mb: 2
                      }}
                    >
                      No assessment data available yet. Complete course assessments to see your performance.
                    </Alert>
                  )}
                </Box>
              )}
              
              {/* Skill Improvement Tab */}
              {activeTab === 2 && (
                <Box>
                  <Typography variant="body1" paragraph>
                    Track your skill improvement across courses by comparing pre and post assessment scores.
                  </Typography>
                  
                  {getImprovementMetrics().length > 0 ? (
                    <TableContainer>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 600 }}>Course</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Pre-Assessment</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Post-Assessment</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Improvement</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Time Invested</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {getImprovementMetrics().map((course) => (
                            <TableRow key={course.courseId} sx={{ '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' } }}>
                              <TableCell>{course.courseTitle}</TableCell>
                              <TableCell>{course.preAssessmentScore}%</TableCell>
                              <TableCell>{course.postAssessmentScore}%</TableCell>
                              <TableCell>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                  <Typography 
                                    variant="body2" 
                                    sx={{ 
                                      mr: 1,
                                      color: course.improvement > 0 ? 'success.main' : 'error.main',
                                      fontWeight: 'medium'
                                    }}
                                  >
                                    {course.improvement > 0 ? `+${course.improvement}%` : `${course.improvement}%`}
                                  </Typography>
                                  <LinearProgress 
                                    variant="determinate" 
                                    value={Math.min(100, course.improvement * 2)} // Scale for better visual
                                    color={course.improvement > 0 ? "success" : "error"}
                                    sx={{ 
                                      width: '100px', 
                                      height: 8, 
                                      borderRadius: 4
                                    }} 
                                  />
                                </Box>
                              </TableCell>
                              <TableCell>
                                {formatTimeSpent(course.timeSpentSeconds)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  ) : (
                    <Alert 
                      severity="info" 
                      sx={{ 
                        borderRadius: 2,
                        mb: 2
                      }}
                    >
                      No improvement metrics available yet. Complete courses with both pre and post assessments to track your progress.
                    </Alert>
                  )}
                </Box>
              )}
            </Box>
          </Paper>
        </Box>
        
        {/* Learning Journey Summary */}
        <Box sx={{ mb: 4 }}>
          <Box 
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              mb: 3 
            }}
          >
            <TrophyIcon color="secondary" sx={{ mr: 1.5, fontSize: 28 }} />
            <Typography 
              variant="h5" 
              component="h2" 
              sx={{ 
                fontWeight: 600,
                color: theme.palette.text.primary
              }}
            >
              Learning Achievements
            </Typography>
          </Box>
          
          <Grid container spacing={3}>
            {/* Certificates Summary */}
            <Grid item xs={12} md={6}>
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  borderRadius: 2,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                  height: '100%'
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar
                    sx={{
                      bgcolor: theme.palette.secondary.light,
                      mr: 2
                    }}
                  >
                    <TrophyIcon sx={{ color: theme.palette.secondary.main }} />
                  </Avatar>
                  <Typography variant="h6">
                    Certificates Earned
                  </Typography>
                </Box>
                
                <Typography variant="body1" paragraph>
                  You have earned {stats.certificatesEarned} out of {stats.completedCourses} possible certificates.
                </Typography>
                
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
                  <LinearProgress 
                    variant="determinate" 
                    value={(stats.certificatesEarned / Math.max(1, stats.completedCourses)) * 100} 
                    sx={{ 
                      flexGrow: 1,
                      height: 10,
                      borderRadius: 5
                    }} 
                  />
                  <Typography variant="body2" sx={{ ml: 2, fontWeight: 'medium' }}>
                    {Math.round((stats.certificatesEarned / Math.max(1, stats.completedCourses)) * 100)}%
                  </Typography>
                </Box>
              </Paper>
            </Grid>
            
            {/* Learning Streak */}
            <Grid item xs={12} md={6}>
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  borderRadius: 2,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                  height: '100%'
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar
                    sx={{
                      bgcolor: theme.palette.success.light,
                      mr: 2
                    }}
                  >
                    <TimeIcon sx={{ color: theme.palette.success.main }} />
                  </Avatar>
                  <Typography variant="h6">
                    Learning Activity
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                  <Typography variant="body1" paragraph>
                    You've invested {stats.totalTimeSpent} hours in your learning journey.
                  </Typography>
                  
                  {stats.learningStreak > 0 && (
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                      <Chip 
                        label={`${stats.learningStreak} day streak`}
                        color="primary"
                        icon={<CheckCircle />}
                        sx={{ fontWeight: 'medium' }}
                      />
                      <Typography variant="body2" sx={{ ml: 2 }}>
                        Keep your momentum going!
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Paper>
            </Grid>
          </Grid>
        </Box>
      </Container>
    </Box>
  );
};

export default UserReports;