// src/pages/Dashboard.js
import React from 'react';
import {
  Container, 
  Grid, 
  Paper, 
  Typography, 
  Box,
  Card,
  CardContent,
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';

const Dashboard = () => {
  const { currentUser } = useAuth();

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>Dashboard</Typography>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Welcome, {currentUser?.name || 'User'}!</Typography>
            <Typography variant="body1">
              Welcome to the EHS E-Learning Platform. This is your dashboard where you'll be able to track your progress 
              and access training materials.
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>System Notification</Typography>
            <Typography variant="body1">
              The training module system is currently undergoing maintenance and upgrades. 
              New features will be released soon. Please check back later.
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Dashboard;