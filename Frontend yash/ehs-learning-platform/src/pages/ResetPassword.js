// src/pages/ResetPassword.js
import React, { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Alert,
  InputAdornment,
  IconButton,
  CircularProgress
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  ArrowBack
} from '@mui/icons-material';
import { useNavigate, useLocation, Link as RouterLink } from 'react-router-dom';
import { authService } from '../services/api';

const ResetPassword = () => {
  const [passwords, setPasswords] = useState({
    password: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    password: false,
    confirmPassword: false
  });
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isValidatingToken, setIsValidatingToken] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const token = new URLSearchParams(location.search).get('token');

  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setTokenValid(false);
        setIsValidatingToken(false);
        return;
      }

      try {
        console.log(`Validating token: ${token}`);
        // Connect to the real API endpoint to validate token
        await authService.validateResetToken(token);
        setTokenValid(true);
        console.log("Token validation successful");
      } catch (error) {
        console.error('Token validation error:', error);
        if (error.response) {
          console.error('Token validation response:', error.response.data);
          console.error('Status code:', error.response.status);
        } else if (error.request) {
          console.error('No response received:', error.request);
        } else {
          console.error('Error message:', error.message);
        }
        setTokenValid(false);
      } finally {
        setIsValidatingToken(false);
      }
    };

    validateToken();
  }, [token]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setPasswords(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear field-specific error when user types
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    
    // Password validation with EHS-specific requirements
    if (!passwords.password) {
      newErrors.password = 'Password is required';
    } else {
      // Password length
      if (passwords.password.length < 8) {
        newErrors.password = 'Password must be at least 8 characters';
      }
      
      // Check for uppercase, lowercase, number, and special character
      const hasUppercase = /[A-Z]/.test(passwords.password);
      const hasLowercase = /[a-z]/.test(passwords.password);
      const hasNumber = /[0-9]/.test(passwords.password);
      const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(passwords.password);
      
      if (!hasUppercase || !hasLowercase || !hasNumber || !hasSpecial) {
        newErrors.password = 'Password must include uppercase, lowercase, number, and special character';
      }
      
      // EHS domain-specific validation
      // Prevent passwords that use common safety terms (could be guessed)
      const forbiddenTerms = ['safety', 'password', 'secure', 'ehs', 'osha'];
      if (forbiddenTerms.some(term => passwords.password.toLowerCase().includes(term))) {
        newErrors.password = 'Password cannot contain common safety terms';
      }
    }
    
    if (!passwords.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (passwords.password !== passwords.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    setSubmitError('');
    
    try {
      // Connect to the real API endpoint
      await authService.resetPassword({
        token,
        password: passwords.password  // Changed from 'newPassword' to 'password' to match backend expectation
      });
      
      setSuccess(true);
      
      // Redirect to login page after 3 seconds
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (error) {
      console.error('Password reset error:', error);

      if (error.response) {
        const { status, data } = error.response;
        console.error('Error response:', { status, data });

        if (status === 400) {
          setSubmitError(data?.message || 'Invalid request. Please check your password and try again.');
        } else if (status === 401 || status === 403) {
          setSubmitError('Your password reset link has expired. Please request a new one.');

          // Redirect to forgot password page after 2 seconds
          setTimeout(() => {
            navigate('/forgot-password');
          }, 2000);
        } else if (data?.message) {
          setSubmitError(data.message);
        } else {
          setSubmitError('Failed to reset password. Please try again.');
        }
      } else if (error.request) {
        console.error('No response received:', error.request);
        setSubmitError('Cannot connect to the server. Please check your internet connection and try again.');
      } else {
        console.error('Error message:', error.message);
        setSubmitError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isValidatingToken) {
    return (
      <Container component="main" maxWidth="xs">
        <Box
          sx={{
            marginTop: 8,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <CircularProgress />
          <Typography variant="body1" sx={{ mt: 2 }}>
            Validating your request...
          </Typography>
        </Box>
      </Container>
    );
  }

  if (!tokenValid) {
    return (
      <Container component="main" maxWidth="xs">
        <Box
          sx={{
            marginTop: 8,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
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
            <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
              Invalid or expired password reset link. Please request a new one.
            </Alert>
            
            <Button
              component={RouterLink}
              to="/forgot-password"
              variant="contained"
              fullWidth
              sx={{ mt: 2 }}
            >
              Request New Reset Link
            </Button>
            
            <Button
              component={RouterLink}
              to="/login"
              fullWidth
              sx={{ mt: 2 }}
            >
              Back to Sign In
            </Button>
          </Paper>
        </Box>
      </Container>
    );
  }

  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
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
            disabled={isSubmitting || success}
          >
            <ArrowBack />
          </IconButton>
          
          <Typography component="h1" variant="h5" gutterBottom>
            Create New Password
          </Typography>
          
          <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
            Enter your new password below.
          </Typography>
          
          {submitError && (
            <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
              {submitError}
            </Alert>
          )}
          
          {success && (
            <Alert severity="success" sx={{ width: '100%', mb: 2 }}>
              Password has been successfully reset! Redirecting to login page...
            </Alert>
          )}
          
          <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="New Password"
              id="password"
              type={showPasswords.password ? 'text' : 'password'}
              value={passwords.password}
              onChange={handleChange}
              error={!!errors.password}
              helperText={errors.password}
              disabled={isSubmitting || success}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={() => togglePasswordVisibility('password')}
                      edge="end"
                      disabled={isSubmitting || success}
                    >
                      {showPasswords.password ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            
            <TextField
              margin="normal"
              required
              fullWidth
              name="confirmPassword"
              label="Confirm Password"
              id="confirmPassword"
              type={showPasswords.confirmPassword ? 'text' : 'password'}
              value={passwords.confirmPassword}
              onChange={handleChange}
              error={!!errors.confirmPassword}
              helperText={errors.confirmPassword}
              disabled={isSubmitting || success}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={() => togglePasswordVisibility('confirmPassword')}
                      edge="end"
                      disabled={isSubmitting || success}
                    >
                      {showPasswords.confirmPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={isSubmitting || success}
            >
              {isSubmitting ? 'Resetting Password...' : 'Reset Password'}
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default ResetPassword;