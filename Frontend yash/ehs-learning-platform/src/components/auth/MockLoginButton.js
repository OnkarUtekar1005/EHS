// src/components/auth/MockLoginButton.js
import React from 'react';
import { Button, Box, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { storeTokenProperly } from '../../utils/jwt-debugger';

const MockLoginButton = () => {
  const navigate = useNavigate();

  const handleMockLogin = () => {
    // Create a mock token and user for development testing
    const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IlRlc3QgVXNlciIsImlhdCI6MTUxNjIzOTAyMn0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
    const mockUser = {
      id: '123',
      username: 'testuser',
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      roles: ['ROLE_USER']
    };

    // Store token with proper Bearer prefix
    storeTokenProperly(mockToken);
    
    // Store user data
    localStorage.setItem('user', JSON.stringify(mockUser));

    // Navigate to dashboard
    navigate('/');
  };

  return (
    <Box mt={2} textAlign="center">
      <Typography variant="caption" color="textSecondary" gutterBottom>
        For development only:
      </Typography>
      <Button 
        variant="outlined" 
        color="warning" 
        onClick={handleMockLogin}
        size="small"
      >
        Mock Login (with Bearer Token)
      </Button>
    </Box>
  );
};

export default MockLoginButton;