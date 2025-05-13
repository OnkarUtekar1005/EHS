// src/pages/ForgotPassword.js
import React, { useState } from 'react';
import { 
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Alert,
  CircularProgress,
  IconButton
} from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';
import { authService } from '../services/api';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailError, setEmailError] = useState('');

  const handleChange = (e) => {
    setEmail(e.target.value);
    
    // Clear errors when typing
    if (emailError) setEmailError('');
    if (error) setError('');
  };

  const validateForm = () => {
    let isValid = true;
    
    // Email validation
    if (!email) {
      setEmailError('Email is required');
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError('Please enter a valid email address');
      isValid = false;
    }
    
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    setError('');
    
    try {
      await authService.requestPasswordReset({ email });
      setSuccess(true);
    } catch (error) {
      console.error('Password reset request error:', error);
      
      // For security reasons, we don't want to reveal if an email exists or not
      // So we still show a success message even if there's an error
      // unless it's a server or network error
      if (error.response) {
        if (error.response.status >= 500) {
          setError('Server error. Please try again later.');
        } else {
          // For any client errors (400s), show generic message for security
          setSuccess(true);
        }
      } else if (error.request) {
        setError('Cannot connect to the server. Please check your internet connection and try again.');
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '70vh',
        }}
      >
        <Paper 
          elevation={3} 
          sx={{ 
            p: 4, 
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <IconButton 
            component={RouterLink} 
            to="/login" 
            sx={{ alignSelf: 'flex-start', mb: 2 }}
            disabled={isSubmitting}
          >
            <ArrowBack />
          </IconButton>
          
          <Typography component="h1" variant="h5" gutterBottom>
            Forgot Password
          </Typography>
          
          {!success && (
            <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
              Enter your email address below and we'll send you a link to reset your password.
            </Typography>
          )}
          
          {error && (
            <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
              {error}
            </Alert>
          )}
          
          {success ? (
            <Box sx={{ width: '100%', textAlign: 'center' }}>
              <Alert severity="success" sx={{ mb: 3 }}>
                If your email exists in our system, we've sent a password reset link. Please check your inbox.
              </Alert>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Don't see the email? Check your spam folder or try again.
              </Typography>
              <Button
                component={RouterLink}
                to="/login"
                variant="contained"
                sx={{ mt: 2 }}
              >
                Return to Login
              </Button>
            </Box>
          ) : (
            <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
              <TextField
                margin="normal"
                required
                fullWidth
                id="email"
                label="Email Address"
                name="email"
                autoComplete="email"
                autoFocus
                value={email}
                onChange={handleChange}
                error={!!emailError}
                helperText={emailError}
                disabled={isSubmitting}
              />
              
              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2 }}
                disabled={isSubmitting}
              >
                {isSubmitting ? <CircularProgress size={24} /> : 'Send Reset Link'}
              </Button>
              
              <Box sx={{ mt: 2, textAlign: 'center' }}>
                <Button
                  component={RouterLink}
                  to="/login"
                  variant="text"
                  size="small"
                  disabled={isSubmitting}
                >
                  Back to Login
                </Button>
              </Box>
            </Box>
          )}
        </Paper>
      </Box>
    </Container>
  );
};

export default ForgotPassword;