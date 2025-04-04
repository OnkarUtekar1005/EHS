// src/pages/admin/UserManagement.js
import React from 'react';
import { Container, Typography, Paper } from '@mui/material';

const UserManagement = () => {
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>User Management</Typography>
      <Paper sx={{ p: 3 }}>
        <Typography>User management interface will be implemented here.</Typography>
      </Paper>
    </Container>
  );
};

export default UserManagement;