// src/pages/admin/AdminDashboard.js
import React from 'react';
import { 
  Container, 
  Grid, 
  Paper, 
  Typography, 
  Box, 
  Card, 
  CardContent
} from '@mui/material';

const AdminDashboard = () => {
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
                152
              </Typography>
              <Typography variant="body2" color="success.main">
                ▲ 12% this month
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
                5
              </Typography>
              <Typography variant="body2" color="success.main">
                ▲ 1 new domain
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
                134
              </Typography>
              <Typography variant="body2" color="error.main">
                ▼ 3 this month
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
                4
              </Typography>
              <Typography variant="body2" component="a" href="/admin/users" sx={{ textDecoration: 'none' }}>
                View Now
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Recent Activity */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Recent Activity</Typography>
            <Box>
              <Typography sx={{ py: 1, borderBottom: '1px solid #eee' }}>
                ▪ John Smith was assigned to Fire Safety domain
              </Typography>
              <Typography sx={{ py: 1, borderBottom: '1px solid #eee' }}>
                ▪ New domain "OSHA Guidelines" was created
              </Typography>
              <Typography sx={{ py: 1, borderBottom: '1px solid #eee' }}>
                ▪ Sarah Lee was removed from Chemical Safety domain
              </Typography>
              <Typography sx={{ py: 1 }}>
                ▪ 12 users were assigned to Emergency Response domain
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default AdminDashboard;