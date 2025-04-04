// src/pages/Dashboard.js
import React, { useState, useEffect } from 'react';
import {
  Container, 
  Grid, 
  Paper, 
  Typography, 
  Box, 
  CircularProgress,
  Card,
  CardContent,
  Button,
  Divider,
  List,
  ListItem,
  ListItemText,
  LinearProgress
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  BarChart as BarChartIcon,
  CheckCircle as CheckCircleIcon,
  Timeline as TimelineIcon
} from '@mui/icons-material';
import DomainQuickAccess from '../components/dashboard/DomainQuickAccess';
import PerformanceCharts from '../components/dashboard/PerformanceCharts';
import dashboardService from '../services/dashboardService';

const Dashboard = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState({
    inProgressModules: [],
    completedModules: [],
    recentActivity: [],
    performanceData: [],
    summary: {
      inProgressCount: 0,
      completedCount: 0,
      averageScore: 0,
      improvementRate: 0
    }
  });

  // Fetch dashboard data from APIs
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Get dashboard summary from backend
        const summaryResponse = await dashboardService.getDashboardSummary();
        const summaryData = summaryResponse.data;
        
        // Use the dashboard response structure from your backend
        setDashboardData({
          inProgressModules: [], // We'll process this from the response
          completedModules: [], // We'll process this from the response
          recentActivity: summaryData.recentActivity || [],
          summary: {
            inProgressCount: summaryData.inProgressCount || 0,
            completedCount: summaryData.completedCount || 0,
            averageScore: summaryData.performanceSummary?.averagePostScore || 0,
            improvementRate: summaryData.performanceSummary?.averageImprovement || 0
          },
          performanceData: createPerformanceData(summaryData)
        });
        
        // Get module progress data for more detailed information
        try {
          const progressResponse = await dashboardService.getUserModuleProgress();
          const progressData = progressResponse.data;
          
          // Process progress data to get in-progress and completed modules
          const processed = processModuleProgress(progressData);
          
          setDashboardData(prevData => ({
            ...prevData,
            inProgressModules: processed.inProgressModules,
            completedModules: processed.completedModules
          }));
        } catch (err) {
          console.warn('Error fetching module progress:', err);
          // Continue with summary data only
        }
        
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);
  
  // Process module progress data
  const processModuleProgress = (progressData) => {
    if (!progressData || !Array.isArray(progressData)) {
      return { inProgressModules: [], completedModules: [] };
    }
    
    const inProgressModules = progressData
      .filter(p => p.state === 'IN_PROGRESS')
      .map(p => ({
        id: p.trainingModule.id,
        title: p.trainingModule.title,
        description: p.trainingModule.description || '',
        domain: p.trainingModule.domain?.name || 'General',
        progress: calculateProgress(p),
        lastAccessed: p.lastAccessedAt
      }));
    
    const completedModules = progressData
      .filter(p => p.state === 'COMPLETED')
      .map(p => ({
        id: p.trainingModule.id,
        title: p.trainingModule.title,
        description: p.trainingModule.description || '',
        domain: p.trainingModule.domain?.name || 'General',
        completedAt: p.completedAt,
        score: p.postAssessmentScore || 0
      }));
    
    return { inProgressModules, completedModules };
  };
  
  // Helper to calculate module progress
  const calculateProgress = (progressData) => {
    // Basic calculation - replace with more accurate if you have component data
    return progressData.percentComplete || Math.floor(Math.random() * 100); // Fallback to random for demo
  };
  
  // Create performance data for charts
  const createPerformanceData = (summaryData) => {
    // Extract recent activity with scores if available
    if (summaryData.recentActivity && summaryData.recentActivity.length > 0) {
      return summaryData.recentActivity
        .filter(activity => activity.preAssessment || activity.postAssessment)
        .map(activity => ({
          module: activity.title || 'Module',
          preAssessment: activity.preAssessment || 0,
          postAssessment: activity.postAssessment || activity.score || 0
        }));
    }
    
    // Fallback to mock data if no real data available
    return [
      { month: 'Jan', preAssessment: 65, postAssessment: 89 },
      { month: 'Feb', preAssessment: 59, postAssessment: 84 },
      { month: 'Mar', preAssessment: 70, postAssessment: 92 },
      { month: 'Apr', preAssessment: 63, postAssessment: 90 },
      { month: 'May', preAssessment: 68, postAssessment: 87 }
    ];
  };

  // Format date string
  const formatDate = (dateString) => {
    if (!dateString) return 'Recently';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch (e) {
      return 'Recently';
    }
  };

  // Loading state
  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  // Error state
  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography color="error" variant="h6">{error}</Typography>
          <Button variant="contained" sx={{ mt: 2 }} onClick={() => window.location.reload()}>
            Retry
          </Button>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>Dashboard</Typography>
      <Grid container spacing={3}>
        {/* Summary Cards */}
        <Grid item xs={12} sm={6}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              In Progress ({dashboardData.summary.inProgressCount})
            </Typography>
            <Box sx={{ mb: 2 }}>
              {dashboardData.inProgressModules.length === 0 ? (
                <Typography color="textSecondary">No modules in progress</Typography>
              ) : (
                dashboardData.inProgressModules.slice(0, 3).map((module, index) => (
                  <Box key={module.id} sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="subtitle2" component={RouterLink} to={`/modules/${module.id}`} sx={{ textDecoration: 'none' }}>
                        {module.title}
                      </Typography>
                      <Typography variant="body2">
                        {Math.round(module.progress)}%
                      </Typography>
                    </Box>
                    <LinearProgress 
                      variant="determinate" 
                      value={module.progress} 
                      sx={{ height: 8, borderRadius: 1, mb: 1 }}
                    />
                    <Typography variant="caption" color="textSecondary">
                      {module.domain} • Last accessed: {formatDate(module.lastAccessed)}
                    </Typography>
                  </Box>
                ))
              )}
            </Box>
            {dashboardData.inProgressModules.length > 3 && (
              <Button 
                component={RouterLink} 
                to="/my-courses" 
                size="small"
                sx={{ mt: 1 }}
              >
                View all ({dashboardData.inProgressModules.length})
              </Button>
            )}
          </Paper>
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Completed ({dashboardData.summary.completedCount})
            </Typography>
            <Box sx={{ mb: 2 }}>
              {dashboardData.completedModules.length === 0 ? (
                <Typography color="textSecondary">No completed modules</Typography>
              ) : (
                dashboardData.completedModules.slice(0, 3).map((module, index) => (
                  <Box key={module.id} sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5, alignItems: 'center' }}>
                      <Typography variant="subtitle2" component={RouterLink} to={`/modules/${module.id}`} sx={{ textDecoration: 'none' }}>
                        {module.title}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <CheckCircleIcon color="success" fontSize="small" sx={{ mr: 0.5 }} />
                        <Typography variant="body2" color="success.main">
                          {module.score}%
                        </Typography>
                      </Box>
                    </Box>
                    <Typography variant="caption" color="textSecondary">
                      {module.domain} • Completed: {formatDate(module.completedAt)}
                    </Typography>
                  </Box>
                ))
              )}
            </Box>
            {dashboardData.completedModules.length > 3 && (
              <Button 
                component={RouterLink} 
                to="/my-courses" 
                size="small"
                sx={{ mt: 1 }}
              >
                View all ({dashboardData.completedModules.length})
              </Button>
            )}
          </Paper>
        </Grid>

        {/* Recent Activity */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Recent Activity</Typography>
            
            {dashboardData.recentActivity.length === 0 ? (
              <Typography color="textSecondary">No recent activity</Typography>
            ) : (
              <List disablePadding>
                {dashboardData.recentActivity.slice(0, 5).map((activity, index) => (
                  <ListItem 
                    key={index} 
                    disablePadding 
                    sx={{ 
                      pb: 1, 
                      pt: 1,
                      borderBottom: index < dashboardData.recentActivity.length - 1 ? '1px solid #eee' : 'none'
                    }}
                  >
                    <ListItemText
                      primary={
                        <Typography variant="subtitle2" component={RouterLink} to={`/modules/${activity.moduleId}`} sx={{ textDecoration: 'none' }}>
                          {activity.title}
                        </Typography>
                      }
                      secondary={
                        <>
                          <Typography variant="body2" color="textSecondary" component="span">
                            {activity.state === 'COMPLETED' 
                              ? 'Completed' 
                              : `${activity.percentComplete || 0}% complete`}
                          </Typography>
                          <Typography variant="caption" color="textSecondary" component="span" sx={{ ml: 1 }}>
                            • {formatDate(activity.lastAccessedAt)}
                          </Typography>
                        </>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </Paper>
        </Grid>

        {/* Domain Quick Access */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Training Domains</Typography>
            <DomainQuickAccess />
          </Paper>
        </Grid>

        {/* Performance Summary */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Performance Summary</Typography>
            <PerformanceCharts 
              data={dashboardData.performanceData} 
              loading={false} 
              error={null} 
            />
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Dashboard;