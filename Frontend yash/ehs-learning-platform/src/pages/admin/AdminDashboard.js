// src/pages/admin/AdminDashboard.js
import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Grid, 
  Paper, 
  Typography, 
  Box, 
  Card, 
  CardContent,
  CircularProgress,
  Link,
  Tabs,
  Tab,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  useTheme,
  Avatar,
  Button
} from '@mui/material';
import {
  Person as PersonIcon,
  Book as BookIcon,
  EmojiEvents as TrophyIcon,
  Group as GroupIcon,
  Domain as DomainIcon,
  Assignment as AssignmentIcon,
  Warning as WarningIcon,
  School as SchoolIcon,
  TrendingUp as TrendingUpIcon,
  ArrowForward as ArrowForwardIcon
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';

const AdminDashboard = () => {
  const theme = useTheme();
  const { currentUser } = useAuth();
  const [stats, setStats] = useState(null);
  const [userProgress, setUserProgress] = useState([]);
  const [recentCourses, setRecentCourses] = useState([]);
  const [topPerformers, setTopPerformers] = useState([]);
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        // Use Batch to fetch all data in parallel
        const [
          statsResponse,
          progressResponse,
          coursesResponse,
          performersResponse
        ] = await Promise.all([
          api.get('/v2/admin/dashboard/stats'),
          api.get('/v2/admin/dashboard/recent-progress'),
          api.get('/v2/admin/dashboard/recent-courses'),
          api.get('/v2/admin/dashboard/top-performers')
        ]);
        
        setStats(statsResponse.data);
        setUserProgress(progressResponse.data);
        setRecentCourses(coursesResponse.data);
        setTopPerformers(performersResponse.data);
        
        setError(null);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
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
          <Typography sx={{ mt: 2 }}>Loading dashboard data...</Typography>
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
        {/* Welcome Section */}
        <Box
          sx={{
            mb: 4,
            textAlign: 'left',
            width: '100%'
          }}
        >
          <Typography
            variant="h4"
            component="h1"
            sx={{
              fontWeight: 700,
              mb: 1,
              color: theme.palette.text.primary
            }}
          >
            Welcome back, {currentUser?.firstName || currentUser?.email?.split('@')[0] || 'Admin'}
          </Typography>
          <Typography
            variant="subtitle1"
            color="textSecondary"
            sx={{ mb: 3 }}
          >
            Monitor platform activity and manage your learning system
          </Typography>
        </Box>

        {/* Stats Cards - Enhanced mobile layout */}
        <Grid container spacing={{ xs: 2, sm: 3 }} sx={{ mb: 4 }}>
          {/* Active Users Card */}
          <Grid item xs={6} sm={6} md={4} lg={2.4}>
            <Paper
              elevation={0}
              sx={{
                p: { xs: 2, sm: 3 }, // Less padding on mobile
                borderRadius: 2,
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.25s ease-in-out',
                minHeight: { xs: 120, sm: 140 }, // Consistent height
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 8px 16px rgba(0,0,0,0.12)'
                }
              }}
              onClick={() => window.location.href = '/admin/users'}
            >
              <Avatar
                sx={{
                  bgcolor: theme.palette.primary.light,
                  width: { xs: 40, sm: 56 }, // Smaller on mobile
                  height: { xs: 40, sm: 56 },
                  mb: { xs: 1, sm: 2 }
                }}
              >
                <GroupIcon 
                  fontSize={window.innerWidth < 600 ? "medium" : "large"} 
                  sx={{ color: theme.palette.primary.main }} 
                />
              </Avatar>
              <Typography 
                variant="h5" 
                component="div" 
                align="center" 
                sx={{ 
                  fontWeight: 600,
                  fontSize: { xs: '1.25rem', sm: '1.5rem' } // Smaller on mobile
                }}
              >
                {stats?.activeUsers || 0}
              </Typography>
              <Typography 
                variant="body2" 
                color="textSecondary" 
                align="center"
                sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
              >
                Active Users
              </Typography>
            </Paper>
          </Grid>
          
          {/* Total Domains Card */}
          <Grid item xs={6} sm={6} md={4} lg={2.4}>
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
                cursor: 'pointer',
                transition: 'all 0.25s ease-in-out',
                minHeight: { xs: 120, sm: 140 },
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 8px 16px rgba(0,0,0,0.12)'
                }
              }}
              onClick={() => window.location.href = '/admin/domains'}
            >
              <Avatar
                sx={{
                  bgcolor: theme.palette.info.light,
                  width: { xs: 40, sm: 56 },
                  height: { xs: 40, sm: 56 },
                  mb: { xs: 1, sm: 2 }
                }}
              >
                <DomainIcon 
                  fontSize={window.innerWidth < 600 ? "medium" : "large"} 
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
                {stats?.totalDomains || 0}
              </Typography>
              <Typography 
                variant="body2" 
                color="textSecondary" 
                align="center"
                sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
              >
                Total Domains
              </Typography>
            </Paper>
          </Grid>
          
          {/* User Assignments Card */}
          <Grid item xs={6} sm={6} md={4} lg={2.4}>
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
                minHeight: { xs: 120, sm: 140 }
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
                <AssignmentIcon 
                  fontSize={window.innerWidth < 600 ? "medium" : "large"} 
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
                {stats?.totalAssignments || 0}
              </Typography>
              <Typography 
                variant="body2" 
                color="textSecondary" 
                align="center"
                sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
              >
                User Assignments
              </Typography>
            </Paper>
          </Grid>
          
          {/* Pending Actions Card */}
          <Grid item xs={6} sm={6} md={4} lg={2.4}>
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
                cursor: stats?.pendingActions > 0 ? 'pointer' : 'default',
                transition: 'all 0.25s ease-in-out',
                minHeight: { xs: 120, sm: 140 },
                '&:hover': stats?.pendingActions > 0 ? {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 8px 16px rgba(0,0,0,0.12)'
                } : {}
              }}
              onClick={() => stats?.pendingActions > 0 && (window.location.href = '/admin/users')}
            >
              <Avatar
                sx={{
                  bgcolor: stats?.pendingActions > 0 ? theme.palette.warning.light : theme.palette.grey[200],
                  width: { xs: 40, sm: 56 },
                  height: { xs: 40, sm: 56 },
                  mb: { xs: 1, sm: 2 }
                }}
              >
                <WarningIcon 
                  fontSize={window.innerWidth < 600 ? "medium" : "large"} 
                  sx={{ 
                    color: stats?.pendingActions > 0 ? theme.palette.warning.main : theme.palette.grey[500] 
                  }} 
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
                {stats?.pendingActions || 0}
              </Typography>
              <Typography 
                variant="body2" 
                color="textSecondary" 
                align="center"
                sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
              >
                Pending Actions
              </Typography>
              {stats?.pendingActions > 0 && (
                <Typography 
                  variant="body2" 
                  color="primary" 
                  align="center" 
                  sx={{ 
                    mt: { xs: 0.5, sm: 1 },
                    fontSize: { xs: '0.7rem', sm: '0.8rem' }
                  }}
                >
                  View Now
                </Typography>
              )}
            </Paper>
          </Grid>
          
          {/* Total Courses Card */}
          <Grid item xs={6} sm={6} md={4} lg={2.4}>
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
                cursor: 'pointer',
                transition: 'all 0.25s ease-in-out',
                minHeight: { xs: 120, sm: 140 },
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 8px 16px rgba(0,0,0,0.12)'
                }
              }}
              onClick={() => window.location.href = '/admin/courses'}
            >
              <Avatar
                sx={{
                  bgcolor: theme.palette.secondary.light,
                  width: { xs: 40, sm: 56 },
                  height: { xs: 40, sm: 56 },
                  mb: { xs: 1, sm: 2 }
                }}
              >
                <SchoolIcon 
                  fontSize={window.innerWidth < 600 ? "medium" : "large"} 
                  sx={{ color: theme.palette.secondary.main }} 
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
                {stats?.totalCourses || 0}
              </Typography>
              <Typography 
                variant="body2" 
                color="textSecondary" 
                align="center"
                sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
              >
                Total Courses
              </Typography>
              <Typography 
                variant="body2" 
                color="primary" 
                align="center" 
                sx={{ 
                  mt: { xs: 0.5, sm: 1 },
                  fontSize: { xs: '0.7rem', sm: '0.8rem' }
                }}
              >
                Manage Courses
              </Typography>
            </Paper>
          </Grid>
        </Grid>

        {/* Activity Tracking Section - Mobile Enhanced */}
        <Box sx={{ mb: 4 }}>
          <Box 
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              mb: 3,
              flexDirection: { xs: 'column', sm: 'row' },
              textAlign: { xs: 'center', sm: 'left' }
            }}
          >
            <TrendingUpIcon 
              color="primary" 
              sx={{ 
                mr: { xs: 0, sm: 1.5 }, 
                mb: { xs: 1, sm: 0 },
                fontSize: { xs: 24, sm: 28 } 
              }} 
            />
            <Typography 
              variant="h5" 
              component="h2" 
              sx={{ 
                fontWeight: 600,
                color: theme.palette.text.primary,
                fontSize: { xs: '1.25rem', sm: '1.5rem' }
              }}
            >
              Activity Tracking
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
            <Box sx={{ 
              p: { xs: 2, sm: 3 }, 
              borderBottom: '1px solid', 
              borderColor: 'divider' 
            }}>
              <Tabs 
                value={activeTab} 
                onChange={handleTabChange}
                variant="scrollable"
                scrollButtons="auto"
                allowScrollButtonsMobile
                sx={{ 
                  '& .MuiTab-root': {
                    textTransform: 'none',
                    fontWeight: 500,
                    fontSize: { xs: '0.875rem', sm: '1rem' },
                    minWidth: { xs: 100, sm: 160 },
                    padding: { xs: '8px 8px', sm: '12px 16px' }
                  },
                  '& .MuiTabs-scrollButtons': {
                    display: { xs: 'flex', md: 'none' }
                  }
                }}
              >
                <Tab 
                  icon={<PersonIcon sx={{ fontSize: { xs: 18, sm: 24 } }} />} 
                  label="User Progress" 
                  iconPosition="start"
                  sx={{ mr: { xs: 1, sm: 2 } }}
                />
                <Tab 
                  icon={<BookIcon sx={{ fontSize: { xs: 18, sm: 24 } }} />} 
                  label="Recent Courses" 
                  iconPosition="start"
                  sx={{ mr: { xs: 1, sm: 2 } }}
                />
                <Tab 
                  icon={<TrophyIcon sx={{ fontSize: { xs: 18, sm: 24 } }} />} 
                  label="Top Performers" 
                  iconPosition="start"
                />
              </Tabs>
            </Box>
            
            <Box sx={{ p: { xs: 2, sm: 3 } }}>
            
            {/* User Progress Tab */}
            {activeTab === 0 && (
              <Box>
                {userProgress.length > 0 ? (
                  <TableContainer sx={{ overflowX: 'auto' }}>
                    <Table sx={{ minWidth: { xs: 300, sm: 650 } }}>
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                            User
                          </TableCell>
                          <TableCell sx={{ 
                            fontSize: { xs: '0.75rem', sm: '0.875rem' },
                            display: { xs: 'none', sm: 'table-cell' }
                          }}>
                            Course
                          </TableCell>
                          <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                            Progress
                          </TableCell>
                          <TableCell sx={{ 
                            fontSize: { xs: '0.75rem', sm: '0.875rem' },
                            display: { xs: 'none', md: 'table-cell' }
                          }}>
                            Last Updated
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {userProgress.map((progress, index) => (
                          <TableRow key={index}>
                            <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                              <Box>
                                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                  {progress.username}
                                </Typography>
                                {/* Show course name on mobile */}
                                <Typography 
                                  variant="caption" 
                                  color="text.secondary"
                                  sx={{ display: { xs: 'block', sm: 'none' } }}
                                >
                                  {progress.courseName}
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell sx={{ 
                              fontSize: { xs: '0.75rem', sm: '0.875rem' },
                              display: { xs: 'none', sm: 'table-cell' }
                            }}>
                              {progress.courseName}
                            </TableCell>
                            <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                              <Box sx={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: 1,
                                flexDirection: { xs: 'column', sm: 'row' }
                              }}>
                                <LinearProgress 
                                  variant="determinate" 
                                  value={parseFloat(progress.progress) || 0} 
                                  sx={{ 
                                    width: { xs: '60px', sm: '100px' },
                                    height: { xs: 6, sm: 4 }
                                  }}
                                />
                                <Typography variant="body2" sx={{ fontSize: { xs: '0.7rem', sm: '0.875rem' } }}>
                                  {parseFloat(progress.progress).toFixed(0)}%
                                </Typography>
                              </Box>
                              {/* Show last updated on mobile */}
                              <Typography 
                                variant="caption" 
                                color="text.secondary"
                                sx={{ 
                                  display: { xs: 'block', md: 'none' },
                                  mt: 0.5,
                                  fontSize: '0.7rem'
                                }}
                              >
                                {progress.timestamp ? 
                                  new Date(progress.timestamp).toLocaleDateString() : 
                                  'N/A'}
                              </Typography>
                            </TableCell>
                            <TableCell sx={{ 
                              fontSize: { xs: '0.75rem', sm: '0.875rem' },
                              display: { xs: 'none', md: 'table-cell' }
                            }}>
                              {progress.timestamp ? 
                                new Date(progress.timestamp).toLocaleString() : 
                                'N/A'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Box sx={{ textAlign: 'center', py: { xs: 4, sm: 6 } }}>
                    <PersonIcon sx={{ 
                      fontSize: { xs: 36, sm: 48 }, 
                      color: 'text.secondary', 
                      mb: 2 
                    }} />
                    <Typography 
                      variant="h6" 
                      color="text.secondary" 
                      gutterBottom
                      sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}
                    >
                      No recent user progress
                    </Typography>
                    <Typography 
                      variant="body2" 
                      color="text.secondary"
                      sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                    >
                      User progress data will appear here as users complete courses
                    </Typography>
                  </Box>
                )}
              </Box>
            )}
            
            {/* Recent Courses Tab - Mobile Optimized */}
            {activeTab === 1 && (
              <Box>
                {recentCourses.length > 0 ? (
                  <>
                    {/* Mobile Card View */}
                    <Box sx={{ display: { xs: 'block', md: 'none' } }}>
                      {recentCourses.map((course, index) => (
                        <Box
                          key={index}
                          sx={{
                            p: 2,
                            mb: 2,
                            border: '1px solid',
                            borderColor: 'divider',
                            borderRadius: 2,
                            backgroundColor: 'background.paper',
                            '&:hover': {
                              backgroundColor: 'rgba(0, 0, 0, 0.02)',
                              borderColor: 'primary.light'
                            }
                          }}
                        >
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                            <Typography 
                              variant="subtitle2" 
                              sx={{ 
                                fontWeight: 600,
                                fontSize: '0.875rem',
                                flex: 1,
                                mr: 1
                              }}
                            >
                              {course.title}
                            </Typography>
                            <Chip 
                              label={course.status} 
                              color={course.status === 'PUBLISHED' ? 'success' : 'default'}
                              size="small"
                              sx={{ fontSize: '0.7rem', height: 24 }}
                            />
                          </Box>
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                              <strong>Domain:</strong> {course.domain}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                              <strong>Created:</strong> {course.createdAt ? 
                                new Date(course.createdAt).toLocaleDateString() : 
                                'N/A'}
                            </Typography>
                          </Box>
                        </Box>
                      ))}
                    </Box>

                    {/* Desktop Table View */}
                    <TableContainer sx={{ display: { xs: 'none', md: 'block' }, overflowX: 'auto' }}>
                      <Table sx={{ minWidth: 650 }}>
                        <TableHead>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 600 }}>Course Title</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Domain</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Created Date</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {recentCourses.map((course, index) => (
                            <TableRow key={index} sx={{ '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' } }}>
                              <TableCell>{course.title}</TableCell>
                              <TableCell>{course.domain}</TableCell>
                              <TableCell>
                                <Chip 
                                  label={course.status} 
                                  color={course.status === 'PUBLISHED' ? 'success' : 'default'}
                                  size="small"
                                />
                              </TableCell>
                              <TableCell>
                                {course.createdAt ? 
                                  new Date(course.createdAt).toLocaleString() : 
                                  'N/A'}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </>
                ) : (
                  <Box sx={{ textAlign: 'center', py: { xs: 4, sm: 6 } }}>
                    <BookIcon sx={{ 
                      fontSize: { xs: 36, sm: 48 }, 
                      color: 'text.secondary', 
                      mb: 2 
                    }} />
                    <Typography 
                      variant="h6" 
                      color="text.secondary" 
                      gutterBottom
                      sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}
                    >
                      No recent courses
                    </Typography>
                    <Typography 
                      variant="body2" 
                      color="text.secondary"
                      sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                    >
                      Recently created courses will appear here
                    </Typography>
                  </Box>
                )}
              </Box>
            )}
            
            {/* Top Performers Tab - Mobile Optimized */}
            {activeTab === 2 && (
              <Box>
                {topPerformers.length > 0 ? (
                  <>
                    {/* Mobile Card View */}
                    <Box sx={{ display: { xs: 'block', md: 'none' } }}>
                      {topPerformers.map((performer, index) => (
                        <Box
                          key={index}
                          sx={{
                            p: 2,
                            mb: 2,
                            border: '1px solid',
                            borderColor: 'divider',
                            borderRadius: 2,
                            backgroundColor: 'background.paper',
                            position: 'relative',
                            '&:hover': {
                              backgroundColor: 'rgba(0, 0, 0, 0.02)',
                              borderColor: 'success.light'
                            }
                          }}
                        >
                          {/* Rank Badge */}
                          <Box
                            sx={{
                              position: 'absolute',
                              top: -8,
                              right: 8,
                              width: 24,
                              height: 24,
                              borderRadius: '50%',
                              backgroundColor: index === 0 ? 'warning.main' : index === 1 ? 'grey.400' : 'warning.light',
                              color: 'white',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '0.75rem',
                              fontWeight: 600
                            }}
                          >
                            {index + 1}
                          </Box>

                          <Box sx={{ mb: 2 }}>
                            <Typography 
                              variant="subtitle2" 
                              sx={{ 
                                fontWeight: 600,
                                fontSize: '0.875rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1
                              }}
                            >
                              {index < 3 && (
                                <TrophyIcon 
                                  sx={{ 
                                    fontSize: 16,
                                    color: index === 0 ? 'warning.main' : index === 1 ? 'grey.500' : 'warning.light'
                                  }} 
                                />
                              )}
                              {performer.username}
                            </Typography>
                          </Box>

                          <Box sx={{ mb: 2 }}>
                            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem', mb: 1 }}>
                              <strong>Courses:</strong> {performer.completedCourses} of {performer.totalCourses} completed
                            </Typography>
                            
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem', minWidth: '80px' }}>
                                <strong>Progress:</strong>
                              </Typography>
                              <LinearProgress 
                                variant="determinate" 
                                value={(performer.completedCourses / performer.totalCourses) * 100} 
                                color="success"
                                sx={{ 
                                  flex: 1,
                                  height: 8,
                                  borderRadius: 1,
                                  backgroundColor: 'grey.200'
                                }}
                              />
                              <Typography 
                                variant="body2" 
                                sx={{ 
                                  fontSize: '0.75rem', 
                                  fontWeight: 600,
                                  color: 'success.main',
                                  minWidth: '40px'
                                }}
                              >
                                {Math.round((performer.completedCourses / performer.totalCourses) * 100)}%
                              </Typography>
                            </Box>
                          </Box>
                        </Box>
                      ))}
                    </Box>

                    {/* Desktop Table View */}
                    <TableContainer sx={{ display: { xs: 'none', md: 'block' }, overflowX: 'auto' }}>
                      <Table sx={{ minWidth: 650 }}>
                        <TableHead>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 600 }}>Rank</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>User</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Completed Courses</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Completion Rate</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {topPerformers.map((performer, index) => (
                            <TableRow key={index} sx={{ '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' } }}>
                              <TableCell>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  {index < 3 && (
                                    <TrophyIcon 
                                      sx={{ 
                                        fontSize: 20,
                                        color: index === 0 ? 'warning.main' : index === 1 ? 'grey.500' : 'warning.light'
                                      }} 
                                    />
                                  )}
                                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                    #{index + 1}
                                  </Typography>
                                </Box>
                              </TableCell>
                              <TableCell>{performer.username}</TableCell>
                              <TableCell>
                                {performer.completedCourses} of {performer.totalCourses}
                              </TableCell>
                              <TableCell>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <LinearProgress 
                                    variant="determinate" 
                                    value={(performer.completedCourses / performer.totalCourses) * 100} 
                                    color="success"
                                    sx={{ width: '100px', borderRadius: 1 }}
                                  />
                                  <Typography variant="body2">
                                    {Math.round((performer.completedCourses / performer.totalCourses) * 100)}%
                                  </Typography>
                                </Box>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </>
                ) : (
                  <Box sx={{ textAlign: 'center', py: { xs: 4, sm: 6 } }}>
                    <TrophyIcon sx={{ 
                      fontSize: { xs: 36, sm: 48 }, 
                      color: 'text.secondary', 
                      mb: 2 
                    }} />
                    <Typography 
                      variant="h6" 
                      color="text.secondary" 
                      gutterBottom
                      sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}
                    >
                      No top performers yet
                    </Typography>
                    <Typography 
                      variant="body2" 
                      color="text.secondary"
                      sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                    >
                      Top performing users will be highlighted here
                    </Typography>
                  </Box>
                )}
              </Box>
            )}
            </Box>
          </Paper>
        </Box>
      </Container>
    </Box>
  );
};

export default AdminDashboard;