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
  Button
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import DomainQuickAccess from '../components/dashboard/DomainQuickAccess';
import PerformanceCharts from '../components/dashboard/PerformanceCharts';
import dashboardService from '../services/dashboardService';

const Dashboard = () => {
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
    return Math.random() * 100; // Placeholder
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
      <Grid container spacing={3}>
        {/* Summary Cards */}
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>In Progress</Typography>
              <Typography variant="h3" component="div" color="primary">
                {dashboardData.summary.inProgressCount}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Active modules
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Completed</Typography>
              <Typography variant="h3" component="div" color="success.main">
                {dashboardData.summary.completedCount}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Finished modules
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Avg. Score</Typography>
              <Typography variant="h3" component="div">
                {dashboardData.summary.averageScore.toFixed(1)}%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Post-assessment average
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Improvement</Typography>
              <Typography variant="h3" component="div" color="info.main">
                +{dashboardData.summary.improvementRate.toFixed(1)}%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Average score increase
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Domain Quick Access */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Training Domains</Typography>
            <DomainQuickAccess />
          </Paper>
        </Grid>

        {/* Performance Charts */}
        <Grid item xs={12} md={8}>
          <PerformanceCharts 
            data={dashboardData.performanceData} 
            loading={false} 
            error={null} 
          />
        </Grid>

        {/* Recent Activity */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Recent Activity</Typography>
              
              {dashboardData.recentActivity.length === 0 ? (
                <Typography color="textSecondary">No recent activity</Typography>
              ) : (
                <Box>
                  {dashboardData.recentActivity.map((activity, index) => (
                    <Box 
                      key={index} 
                      sx={{ 
                        mb: 2, 
                        pb: 1, 
                        borderBottom: index < dashboardData.recentActivity.length - 1 ? '1px solid #eee' : 'none' 
                      }}
                    >
                      <Typography variant="subtitle2" component={RouterLink} to={`/domains/${activity.moduleId}`} sx={{ textDecoration: 'none' }}>
                        {activity.title}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        {activity.state === 'COMPLETED' 
                          ? 'Completed' 
                          : `${activity.percentComplete || 0}% complete`}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {activity.lastAccessedAt || 'Recently'}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* In Progress Modules */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>In Progress</Typography>
              
              {dashboardData.inProgressModules.length === 0 ? (
                <Typography color="textSecondary">No modules in progress</Typography>
              ) : (
                <Box>
                  {dashboardData.inProgressModules.slice(0, 3).map((module, index) => (
                    <Box 
                      key={module.id} 
                      sx={{ 
                        mb: 2, 
                        pb: 1, 
                        borderBottom: index < 2 ? '1px solid #eee' : 'none' 
                      }}
                    >
                      <Typography variant="subtitle2" component={RouterLink} to={`/modules/${module.id}`} sx={{ textDecoration: 'none' }}>
                        {module.title}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        {module.domain} • {Math.round(module.progress || 0)}% complete
                      </Typography>
                    </Box>
                  ))}
                  
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
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Completed Modules */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Completed</Typography>
              
              {dashboardData.completedModules.length === 0 ? (
                <Typography color="textSecondary">No completed modules</Typography>
              ) : (
                <Box>
                  {dashboardData.completedModules.slice(0, 3).map((module, index) => (
                    <Box 
                      key={module.id} 
                      sx={{ 
                        mb: 2, 
                        pb: 1, 
                        borderBottom: index < 2 ? '1px solid #eee' : 'none' 
                      }}
                    >
                      <Typography variant="subtitle2" component={RouterLink} to={`/modules/${module.id}`} sx={{ textDecoration: 'none' }}>
                        {module.title}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        {module.domain} • Score: {module.score}%
                      </Typography>
                    </Box>
                  ))}
                  
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
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Dashboard;