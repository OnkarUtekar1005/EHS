// src/pages/admin/AdminSettings.js
import React from 'react';
import { Container, Typography, Paper } from '@mui/material';

const AdminSettings = () => {
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>System Settings</Typography>
      <Paper sx={{ p: 3 }}>
        <Typography>System settings interface will be implemented here.</Typography>
      </Paper>
    </Container>
  );
};

export default AdminSettings;