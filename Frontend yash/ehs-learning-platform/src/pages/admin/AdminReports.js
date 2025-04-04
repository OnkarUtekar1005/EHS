// src/pages/admin/AdminReports.js
import React from 'react';
import { Container, Typography, Paper } from '@mui/material';

const AdminReports = () => {
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>Reports</Typography>
      <Paper sx={{ p: 3 }}>
        <Typography>Admin reporting interface will be implemented here.</Typography>
      </Paper>
    </Container>
  );
};

export default AdminReports;