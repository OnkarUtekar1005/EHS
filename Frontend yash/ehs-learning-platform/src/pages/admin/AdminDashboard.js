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

        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {/* Active Users Card */}
          <Grid item xs={12} sm={6} md={4} lg={2.4}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: 2,
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.25s ease-in-out',
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
                  width: 56,
                  height: 56,
                  mb: 2
                }}
              >
                <GroupIcon fontSize="large" sx={{ color: theme.palette.primary.main }} />
              </Avatar>
              <Typography variant="h5" component="div" align="center" sx={{ fontWeight: 600 }}>
                {stats?.activeUsers || 0}
              </Typography>
              <Typography variant="body1" color="textSecondary" align="center">
                Active Users
              </Typography>
            </Paper>
          </Grid>
          
          {/* Total Domains Card */}
          <Grid item xs={12} sm={6} md={4} lg={2.4}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: 2,
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.25s ease-in-out',
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
                  width: 56,
                  height: 56,
                  mb: 2
                }}
              >
                <DomainIcon fontSize="large" sx={{ color: theme.palette.info.main }} />
              </Avatar>
              <Typography variant="h5" component="div" align="center" sx={{ fontWeight: 600 }}>
                {stats?.totalDomains || 0}
              </Typography>
              <Typography variant="body1" color="textSecondary" align="center">
                Total Domains
              </Typography>
            </Paper>
          </Grid>
          
          {/* User Assignments Card */}
          <Grid item xs={12} sm={6} md={4} lg={2.4}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
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
                  width: 56,
                  height: 56,
                  mb: 2
                }}
              >
                <AssignmentIcon fontSize="large" sx={{ color: theme.palette.success.main }} />
              </Avatar>
              <Typography variant="h5" component="div" align="center" sx={{ fontWeight: 600 }}>
                {stats?.totalAssignments || 0}
              </Typography>
              <Typography variant="body1" color="textSecondary" align="center">
                User Assignments
              </Typography>
            </Paper>
          </Grid>
          
          {/* Pending Actions Card */}
          <Grid item xs={12} sm={6} md={4} lg={2.4}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: 2,
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: stats?.pendingActions > 0 ? 'pointer' : 'default',
                transition: 'all 0.25s ease-in-out',
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
                  width: 56,
                  height: 56,
                  mb: 2
                }}
              >
                <WarningIcon fontSize="large" sx={{ 
                  color: stats?.pendingActions > 0 ? theme.palette.warning.main : theme.palette.grey[500] 
                }} />
              </Avatar>
              <Typography variant="h5" component="div" align="center" sx={{ fontWeight: 600 }}>
                {stats?.pendingActions || 0}
              </Typography>
              <Typography variant="body1" color="textSecondary" align="center">
                Pending Actions
              </Typography>
              {stats?.pendingActions > 0 && (
                <Typography variant="body2" color="primary" align="center" sx={{ mt: 1 }}>
                  View Now
                </Typography>
              )}
            </Paper>
          </Grid>
          
          {/* Total Courses Card */}
          <Grid item xs={12} sm={6} md={4} lg={2.4}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: 2,
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.25s ease-in-out',
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
                  width: 56,
                  height: 56,
                  mb: 2
                }}
              >
                <SchoolIcon fontSize="large" sx={{ color: theme.palette.secondary.main }} />
              </Avatar>
              <Typography variant="h5" component="div" align="center" sx={{ fontWeight: 600 }}>
                {stats?.totalCourses || 0}
              </Typography>
              <Typography variant="body1" color="textSecondary" align="center">
                Total Courses
              </Typography>
              <Typography variant="body2" color="primary" align="center" sx={{ mt: 1 }}>
                Manage Courses
              </Typography>
            </Paper>
          </Grid>
        </Grid>

        {/* Activity Tracking Section */}
        <Box sx={{ mb: 4 }}>
          <Box 
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              mb: 3 
            }}
          >
            <TrendingUpIcon color="primary" sx={{ mr: 1.5, fontSize: 28 }} />
            <Typography 
              variant="h5" 
              component="h2" 
              sx={{ 
                fontWeight: 600,
                color: theme.palette.text.primary
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
                  icon={<PersonIcon />} 
                  label="User Progress" 
                  iconPosition="start"
                  sx={{ mr: 2 }}
                />
                <Tab 
                  icon={<BookIcon />} 
                  label="Recent Courses" 
                  iconPosition="start"
                  sx={{ mr: 2 }}
                />
                <Tab 
                  icon={<TrophyIcon />} 
                  label="Top Performers" 
                  iconPosition="start"
                />
              </Tabs>
            </Box>
            
            <Box sx={{ p: 3 }}>
            
            {/* User Progress Tab */}
            {activeTab === 0 && (
              <Box>
                {userProgress.length > 0 ? (
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>User</TableCell>
                          <TableCell>Course</TableCell>
                          <TableCell>Progress</TableCell>
                          <TableCell>Last Updated</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {userProgress.map((progress, index) => (
                          <TableRow key={index}>
                            <TableCell>{progress.username}</TableCell>
                            <TableCell>{progress.courseName}</TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <LinearProgress 
                                  variant="determinate" 
                                  value={parseFloat(progress.progress) || 0} 
                                  sx={{ width: '100px' }}
                                />
                                <Typography variant="body2">
                                  {parseFloat(progress.progress).toFixed(0)}%
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell>
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
                  <Box sx={{ textAlign: 'center', py: 6 }}>
                    <PersonIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                      No recent user progress
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      User progress data will appear here as users complete courses
                    </Typography>
                  </Box>
                )}
              </Box>
            )}
            
            {/* Recent Courses Tab */}
            {activeTab === 1 && (
              <Box>
                {recentCourses.length > 0 ? (
                  <TableContainer>
                    <Table>
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
                ) : (
                  <Box sx={{ textAlign: 'center', py: 6 }}>
                    <BookIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                      No recent courses
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Recently created courses will appear here
                    </Typography>
                  </Box>
                )}
              </Box>
            )}
            
            {/* Top Performers Tab */}
            {activeTab === 2 && (
              <Box>
                {topPerformers.length > 0 ? (
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 600 }}>User</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>Completed Courses</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>Completion Rate</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {topPerformers.map((performer, index) => (
                          <TableRow key={index} sx={{ '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' } }}>
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
                ) : (
                  <Box sx={{ textAlign: 'center', py: 6 }}>
                    <TrophyIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                      No top performers yet
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
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