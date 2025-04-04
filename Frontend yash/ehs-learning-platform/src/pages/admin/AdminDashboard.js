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
        
        {/* Module Completion Card */}
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Module Completion</Typography>
              <Typography variant="h3" component="div">
                78%
              </Typography>
              <Typography variant="body2" color="success.main">
                ▲ 5% this month
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Avg. Improvement Card */}
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Avg. Improvement</Typography>
              <Typography variant="h3" component="div">
                23.4%
              </Typography>
              <Typography variant="body2" color="error.main">
                ▼ 2% this month
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Pending Reviews Card */}
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Pending Reviews</Typography>
              <Typography variant="h3" component="div">
                7
              </Typography>
              <Typography variant="body2" component="a" href="/admin/modules" sx={{ textDecoration: 'none' }}>
                Review Now
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
                ▪ John Smith completed "Fire Safety" - 92%
              </Typography>
              <Typography sx={{ py: 1, borderBottom: '1px solid #eee' }}>
                ▪ New module "OSHA Guidelines" created
              </Typography>
              <Typography sx={{ py: 1, borderBottom: '1px solid #eee' }}>
                ▪ Sarah Lee failed "Chemical Safety" - 62%
              </Typography>
              <Typography sx={{ py: 1 }}>
                ▪ 12 users assigned to "Emergency Response"
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default AdminDashboard;