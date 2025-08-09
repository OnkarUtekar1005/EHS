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
import { useAuth } from '../../contexts/AuthContext';

const UserReports = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  const { currentUser } = useAuth();

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
        const response = await reportsService.getUserReport();
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
          
          // Calculate learning streak based on account age
          const calculateLearningStreak = () => {
            if (!currentUser?.createdAt) {
              // Fallback if no creation date available
              return 1;
            }
            
            const accountCreationDate = new Date(currentUser.createdAt);
            const today = new Date();
            const daysDifference = Math.floor((today - accountCreationDate) / (1000 * 60 * 60 * 24));
            return Math.max(1, daysDifference); // At least 1 day
          };
          
          const learningStreak = response.data.summaryMetrics?.learningStreak || calculateLearningStreak();
          
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
        console.error('Error fetching user reports:', reportError);
        // Set empty data when API fails
        setReports({
          summaryMetrics: {
            totalCoursesEnrolled: 0,
            totalCoursesCompleted: 0,
            averageAssessmentScore: 0,
            totalTimeSpentSeconds: 0
          },
          courseProgressDetails: []
        });
        
        // Calculate streak from account creation date
        const calculateStreak = () => {
          if (!currentUser?.createdAt) return 1;
          const accountCreationDate = new Date(currentUser.createdAt);
          const today = new Date();
          const daysDifference = Math.floor((today - accountCreationDate) / (1000 * 60 * 60 * 24));
          return Math.max(1, daysDifference);
        };
        
        setStats({
          completedCourses: 0,
          totalAssessmentScore: 0,
          averageScore: 0,
          certificatesEarned: 0,
          totalTimeSpent: 0,
          improvementRate: 0,
          learningStreak: calculateStreak()
        });
      }
      
      setLoading(false);
    } catch (err) {
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

        {/* Stats Cards - Aligned like Dashboard */}
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
                <CheckCircle
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
                {stats.completedCourses}
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
          
          {/* Average Score Card */}
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
                  bgcolor: theme.palette.primary.light,
                  width: { xs: 40, sm: 56 },
                  height: { xs: 40, sm: 56 },
                  mb: { xs: 1, sm: 2 }
                }}
              >
                <StarIcon 
                  fontSize={isMobile ? "medium" : "large"} 
                  sx={{ color: theme.palette.primary.main }} 
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
                {Math.round(stats.averageScore)}%
              </Typography>
              <Typography 
                variant="body2" 
                color="textSecondary" 
                align="center"
                sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
              >
                Average Score
              </Typography>
            </Paper>
          </Box>
          
          {/* Learning Streak Card */}
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
                <TrophyIcon 
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
                {stats.learningStreak}
              </Typography>
              <Typography 
                variant="body2" 
                color="textSecondary" 
                align="center"
                sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
              >
                Day Streak
              </Typography>
            </Paper>
          </Box>
        </Box>

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
            <Box sx={{ p: { xs: 2, sm: 3 }, borderBottom: '1px solid', borderColor: 'divider' }}>
              <Tabs 
                value={activeTab} 
                onChange={handleTabChange}
                variant={isMobile ? "scrollable" : "standard"}
                scrollButtons={isMobile ? "auto" : false}
                allowScrollButtonsMobile
                sx={{ 
                  '& .MuiTab-root': {
                    textTransform: 'none',
                    fontWeight: 500,
                    fontSize: { xs: '0.75rem', sm: '1rem' },
                    minHeight: { xs: 44, sm: 56 },
                    px: { xs: 0.5, sm: 2 },
                    minWidth: { xs: 'auto', sm: 160 }
                  },
                  '& .MuiTabs-scrollButtons': {
                    '&.Mui-disabled': {
                      opacity: 0.3
                    }
                  }
                }}
              >
                <Tab 
                  icon={<CheckCircle fontSize={isMobile ? "small" : "medium"} />} 
                  label={isMobile ? "Done" : "Completed Courses"} 
                  iconPosition="start"
                  sx={{ mr: { xs: 0, sm: 1 } }}
                />
                <Tab 
                  icon={<AssessmentIcon fontSize={isMobile ? "small" : "medium"} />} 
                  label={isMobile ? "Score" : "Assessment Performance"} 
                  iconPosition="start"
                  sx={{ mr: { xs: 0, sm: 1 } }}
                />
                <Tab 
                  icon={<TrendingUpIcon fontSize={isMobile ? "small" : "medium"} />} 
                  label={isMobile ? "Growth" : "Skill Improvement"} 
                  iconPosition="start"
                />
              </Tabs>
            </Box>
            
            <Box sx={{ p: { xs: 2, sm: 3 } }}>
              {/* Completed Courses Tab */}
              {activeTab === 0 && (
                <Box>
                  {/* Search Bar */}
                  <TextField
                    fullWidth
                    variant="outlined"
                    placeholder={isMobile ? "Search courses..." : "Search completed courses..."}
                    value={searchTerm}
                    onChange={handleSearchChange}
                    size={isMobile ? "small" : "medium"}
                    sx={{ mb: { xs: 2, sm: 3 } }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Search fontSize={isMobile ? "small" : "medium"} />
                        </InputAdornment>
                      ),
                      sx: {
                        borderRadius: 2,
                        backgroundColor: theme.palette.background.default,
                        fontSize: { xs: '0.875rem', sm: '1rem' },
                        '&.Mui-focused': {
                          backgroundColor: '#fff'
                        }
                      }
                    }}
                  />

                  {/* List of completed courses */}
                  <Box sx={{ mt: { xs: 1, sm: 2 }, width: '100%' }}>
                    {getCurrentCourses().length > 0 ? (
                      getCurrentCourses().map((course, index) => (
                        <React.Fragment key={course.courseId}>
                          {index > 0 && <Divider sx={{ my: { xs: 1.5, sm: 2 } }} />}
                          <Box
                            sx={{
                              display: 'flex',
                              flexDirection: { xs: 'column', sm: 'row' },
                              alignItems: { xs: 'flex-start', sm: 'center' },
                              width: '100%',
                              gap: { xs: 1.5, sm: 0 }
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
                                  width: { xs: 36, sm: 40 }, 
                                  height: { xs: 36, sm: 40 },
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  mr: { xs: 1.5, sm: 2 },
                                  flexShrink: 0,
                                  mt: 0.5
                                }}
                              >
                                <School sx={{ 
                                  color: theme.palette.primary.main,
                                  fontSize: { xs: 18, sm: 24 }
                                }} />
                              </Box>
                              
                              <Box sx={{ minWidth: 0, flex: 1 }}>
                                <Typography 
                                  variant={isMobile ? "body1" : "subtitle1"} 
                                  fontWeight="medium"
                                  sx={{
                                    fontSize: { xs: '0.875rem', sm: '1rem' },
                                    lineHeight: 1.3
                                  }}
                                >
                                  {course.courseTitle}
                                </Typography>
                                
                                <Box sx={{ display: 'flex', alignItems: 'center', mt: { xs: 0.5, sm: 0.5 } }}>
                                  <DateRange 
                                    fontSize="small" 
                                    sx={{ 
                                      mr: 0.5, 
                                      color: 'text.secondary', 
                                      fontSize: { xs: 12, sm: 14 }
                                    }} 
                                  />
                                  <Typography 
                                    variant="body2" 
                                    color="textSecondary"
                                    sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                                  >
                                    {isMobile ? formatDate(course.lastAccessedDate) : `Completed: ${formatDate(course.lastAccessedDate)}`}
                                  </Typography>
                                </Box>
                                
                                {course.postAssessmentScore !== null && (
                                  <Box sx={{ 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    mt: { xs: 0.5, sm: 1 },
                                    flexWrap: { xs: 'wrap', sm: 'nowrap' }
                                  }}>
                                    <Typography 
                                      variant="body2" 
                                      sx={{ 
                                        mr: 1,
                                        fontSize: { xs: '0.75rem', sm: '0.875rem' }
                                      }}
                                    >
                                      Score:
                                    </Typography>
                                    <LinearProgress 
                                      variant="determinate" 
                                      value={course.postAssessmentScore} 
                                      sx={{ 
                                        width: { xs: '80px', sm: '100px' }, 
                                        height: { xs: 6, sm: 8 }, 
                                        borderRadius: 4,
                                        mr: 1
                                      }} 
                                    />
                                    <Typography 
                                      variant="body2" 
                                      fontWeight="medium"
                                      sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                                    >
                                      {course.postAssessmentScore}%
                                    </Typography>
                                  </Box>
                                )}
                                
                                {course.timeSpentSeconds && (
                                  <Typography 
                                    variant="body2" 
                                    color="textSecondary" 
                                    sx={{ 
                                      mt: 0.5,
                                      fontSize: { xs: '0.75rem', sm: '0.875rem' }
                                    }}
                                  >
                                    {isMobile ? formatTimeSpent(course.timeSpentSeconds) : `Time spent: ${formatTimeSpent(course.timeSpentSeconds)}`}
                                  </Typography>
                                )}
                              </Box>
                            </Box>
                            
                            <Box
                              sx={{
                                mt: { xs: 1, sm: 0 },
                                ml: { xs: 0, sm: 2 },
                                width: { xs: '100%', sm: '200px' },
                                flexShrink: 0
                              }}
                            >
                              <Button
                                variant="contained"
                                fullWidth
                                size={isMobile ? "small" : "medium"}
                                startIcon={<Download fontSize={isMobile ? "small" : "medium"} />}
                                onClick={() => course.certificateUrl ? 
                                  handleDownloadCertificate(course.certificateUrl) : 
                                  handleGenerateCertificate(course.courseId)
                                }
                                color={course.certificateUrl ? "primary" : "secondary"}
                                sx={{
                                  borderRadius: { xs: 2, sm: 6 },
                                  py: { xs: 0.75, sm: 1 },
                                  textTransform: 'none',
                                  fontWeight: 600,
                                  fontSize: { xs: '0.75rem', sm: '0.875rem' }
                                }}
                              >
                                {course.certificateUrl ? "Download" : "Generate"}
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
                    isMobile ? (
                      // Mobile: Card Layout
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {getAssessmentPerformance().map((course) => (
                          <Card key={course.courseId} sx={{ borderRadius: 2 }}>
                            <CardContent sx={{ p: 2 }}>
                              <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                                {course.courseTitle}
                              </Typography>
                              
                              <Grid container spacing={2} sx={{ mb: 2 }}>
                                <Grid item xs={6}>
                                  <Typography variant="caption" color="text.secondary">
                                    Completed
                                  </Typography>
                                  <Typography variant="body2" fontWeight={600}>
                                    {formatDate(course.lastAccessedDate)}
                                  </Typography>
                                </Grid>
                                <Grid item xs={6}>
                                  <Typography variant="caption" color="text.secondary">
                                    Score
                                  </Typography>
                                  <Typography variant="body2" fontWeight={600}>
                                    {course.postAssessmentScore}%
                                  </Typography>
                                </Grid>
                              </Grid>

                              <Box sx={{ mb: 2 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                  <Typography variant="body2" color="text.secondary">
                                    Performance
                                  </Typography>
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
                                <LinearProgress
                                  variant="determinate"
                                  value={course.postAssessmentScore}
                                  sx={{ height: 6, borderRadius: 3 }}
                                />
                              </Box>

                              <Button
                                variant={course.certificateUrl ? "contained" : "outlined"}
                                color={course.certificateUrl ? "primary" : "secondary"}
                                size="small"
                                fullWidth
                                startIcon={<Download />}
                                onClick={() => course.certificateUrl ? 
                                  handleDownloadCertificate(course.certificateUrl) : 
                                  handleGenerateCertificate(course.courseId)
                                }
                                sx={{ borderRadius: 2 }}
                              >
                                {course.certificateUrl ? "Download Certificate" : "Generate Certificate"}
                              </Button>
                            </CardContent>
                          </Card>
                        ))}
                      </Box>
                    ) : (
                      // Desktop: Table Layout
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
                    )
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
                    isMobile ? (
                      // Mobile: Card Layout
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {getImprovementMetrics().map((course) => (
                          <Card key={course.courseId} sx={{ borderRadius: 2 }}>
                            <CardContent sx={{ p: 2 }}>
                              <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                                {course.courseTitle}
                              </Typography>
                              
                              <Grid container spacing={2} sx={{ mb: 2 }}>
                                <Grid item xs={6}>
                                  <Typography variant="caption" color="text.secondary">
                                    Pre-Assessment
                                  </Typography>
                                  <Typography variant="h6" fontWeight={600}>
                                    {course.preAssessmentScore}%
                                  </Typography>
                                </Grid>
                                <Grid item xs={6}>
                                  <Typography variant="caption" color="text.secondary">
                                    Post-Assessment
                                  </Typography>
                                  <Typography variant="h6" fontWeight={600}>
                                    {course.postAssessmentScore}%
                                  </Typography>
                                </Grid>
                              </Grid>

                              <Box sx={{ mb: 2 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                                  <Typography variant="body2" color="text.secondary">
                                    Improvement
                                  </Typography>
                                  <Typography 
                                    variant="body2" 
                                    fontWeight="bold"
                                    sx={{ 
                                      color: course.improvement > 0 ? 'success.main' : 'error.main'
                                    }}
                                  >
                                    {course.improvement > 0 ? `+${course.improvement}%` : `${course.improvement}%`}
                                  </Typography>
                                </Box>
                                <LinearProgress
                                  variant="determinate"
                                  value={Math.min(100, Math.abs(course.improvement) * 2)}
                                  color={course.improvement > 0 ? "success" : "error"}
                                  sx={{ height: 6, borderRadius: 3 }}
                                />
                              </Box>

                              <Typography variant="body2" color="text.secondary">
                                Time invested: {formatTimeSpent(course.timeSpentSeconds)}
                              </Typography>
                            </CardContent>
                          </Card>
                        ))}
                      </Box>
                    ) : (
                      // Desktop: Table Layout
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
                    )
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
              Learning Activity
            </Typography>
          </Box>
          
          <Grid container spacing={3}>
            {/* Learning Streak */}
            <Grid item xs={12}>
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
                    Learning Progress
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                  {stats.learningStreak > 0 && (
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
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