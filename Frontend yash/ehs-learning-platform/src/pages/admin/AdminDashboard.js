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
  Chip
} from '@mui/material';
import {
  Person as PersonIcon,
  Book as BookIcon,
  EmojiEvents as TrophyIcon
} from '@mui/icons-material';
import api from '../../services/api';

const AdminDashboard = () => {
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
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>Loading dashboard data...</Typography>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Typography color="error" variant="h6">{error}</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Dashboard Overview
      </Typography>
      
      <Grid container spacing={3}>
        {/* Active Users Card */}
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Active Users</Typography>
              <Typography variant="h3" component="div" color="primary">
                {stats?.activeUsers || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Total Domains Card */}
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Total Domains</Typography>
              <Typography variant="h3" component="div">
                {stats?.totalDomains || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        {/* User Assignments Card */}
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>User Assignments</Typography>
              <Typography variant="h3" component="div">
                {stats?.totalAssignments || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Pending Actions Card */}
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Pending Actions</Typography>
              <Typography variant="h3" component="div">
                {stats?.pendingActions || 0}
              </Typography>
              {stats?.pendingActions > 0 && (
                <Link href="/admin/users" underline="hover" sx={{ textDecoration: 'none' }}>
                  <Typography variant="body2" color="primary">
                    View Now
                  </Typography>
                </Link>
              )}
            </CardContent>
          </Card>
        </Grid>
        
        {/* Total Courses Card */}
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Total Courses</Typography>
              <Typography variant="h3" component="div" color="secondary">
                {stats?.totalCourses || 0}
              </Typography>
              <Link href="/admin/courses" underline="hover" sx={{ textDecoration: 'none' }}>
                <Typography variant="body2" color="primary">
                  Manage Courses
                </Typography>
              </Link>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Activity Tabs Section */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Activity Tracking</Typography>
            
            <Tabs 
              value={activeTab} 
              onChange={handleTabChange}
              sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}
            >
              <Tab icon={<PersonIcon />} label="User Progress" />
              <Tab icon={<BookIcon />} label="Recent Courses" />
              <Tab icon={<TrophyIcon />} label="Top Performers" />
            </Tabs>
            
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
                  <Typography color="text.secondary">
                    No recent user progress to display
                  </Typography>
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
                          <TableCell>Course Title</TableCell>
                          <TableCell>Domain</TableCell>
                          <TableCell>Status</TableCell>
                          <TableCell>Created Date</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {recentCourses.map((course, index) => (
                          <TableRow key={index}>
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
                  <Typography color="text.secondary">
                    No recent courses to display
                  </Typography>
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
                          <TableCell>User</TableCell>
                          <TableCell>Completed Courses</TableCell>
                          <TableCell>Completion Rate</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {topPerformers.map((performer, index) => (
                          <TableRow key={index}>
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
                                  sx={{ width: '100px' }}
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
                  <Typography color="text.secondary">
                    No top performers data available
                  </Typography>
                )}
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default AdminDashboard;