// src/pages/Profile.js
import React, { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Typography,
  Paper,
  Avatar,
  Grid,
  TextField,
  Button,
  Tab,
  Tabs,
  Divider,
  Alert,
  InputAdornment,
  IconButton,
  CircularProgress
} from '@mui/material';
import {
  AccountCircle as AccountCircleIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Visibility,
  VisibilityOff
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { userService, authService } from '../services/api';

// TabPanel component for tab content
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`profile-tabpanel-${index}`}
      aria-labelledby={`profile-tab-${index}`}
      {...other}
      style={{ padding: '24px 0' }}
    >
      {value === index && children}
    </div>
  );
}

const Profile = () => {
  const { currentUser, updateUserData } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  
  // Profile Information State
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    jobTitle: '',
    department: ''
  });
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileErrors, setProfileErrors] = useState({});

  // Password Change State
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordErrors, setPasswordErrors] = useState({});

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!currentUser) return;
      
      try {
        setProfileLoading(true);
        
        // Now using the real API to fetch user details
        const response = await userService.getById(currentUser.id);
        const userData = response.data;
        
        setProfileData(userData);
      } catch (error) {
        if (error.response) {
          const { status, data } = error.response;
          
          if (status === 403) {
            setProfileError('You do not have permission to access this profile.');
          } else if (status === 404) {
            setProfileError('User profile not found. Please contact an administrator.');
          } else if (data?.message) {
            setProfileError(data.message);
          } else {
            setProfileError('Failed to load profile data. Please try again later.');
          }
        } else if (error.request) {
          setProfileError('Cannot connect to the server. Please check your internet connection and try again.');
        } else {
          setProfileError('An unexpected error occurred while loading your profile.');
        }
      } finally {
        setProfileLoading(false);
      }
    };

    fetchUserProfile();
  }, [currentUser]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Profile Edit Handlers
  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear field error if user is typing
    if (profileErrors[name]) {
      setProfileErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateProfileForm = () => {
    const errors = {};
    
    if (!profileData.firstName.trim()) {
      errors.firstName = 'First name is required';
    }
    
    if (!profileData.lastName.trim()) {
      errors.lastName = 'Last name is required';
    }
    
    if (!profileData.email.trim()) {
      errors.email = 'Email is required';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(profileData.email)) {
        errors.email = 'Please enter a valid email address';
      }
      
      // EHS domain-specific validation
      // Check for corporate email
      const emailDomain = profileData.email.split('@')[1];
      const corporateEmailDomains = ['example.com', 'company.org', 'ehs-safety.net'];
      if (!corporateEmailDomains.some(domain => emailDomain?.includes(domain))) {
        errors.email = 'Please use your corporate email address';
      }
    }
    
    // Phone validation (required for emergency contact purposes in EHS)
    if (!profileData.phone) {
      errors.phone = 'Phone number is required for emergency contacts';
    } else if (!/^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/im.test(profileData.phone)) {
      errors.phone = 'Please enter a valid phone number';
    }
    
    // Department validation for EHS
    if (profileData.department) {
      const validDepartments = ['Operations', 'Safety', 'Management', 'Training', 'Field', 'Support'];
      if (!validDepartments.includes(profileData.department)) {
        errors.department = 'Please select a valid department';
      }
    }
    
    // Job Title validation for EHS access control
    if (profileData.jobTitle) {
      const restrictedTitles = ['Administrator', 'System Admin', 'Super User'];
      if (restrictedTitles.includes(profileData.jobTitle) && 
          !currentUser.roles?.includes('admin')) {
        errors.jobTitle = 'You cannot assign yourself this restricted job title';
      }
    }
    
    setProfileErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleStartEditing = () => {
    setIsEditingProfile(true);
    setProfileError('');
    setProfileSuccess('');
  };

  const handleCancelEditing = () => {
    // Reset to original data
    if (currentUser) {
      setProfileData({
        firstName: currentUser.firstName || 'John',
        lastName: currentUser.lastName || 'Doe',
        email: currentUser.email || 'john.doe@example.com',
        phone: currentUser.phone || '(555) 123-4567',
        jobTitle: currentUser.jobTitle || 'Safety Manager',
        department: currentUser.department || 'Operations'
      });
    }
    setIsEditingProfile(false);
    setProfileErrors({});
    setProfileError('');
    setProfileSuccess('');
  };

  const handleSaveProfile = async () => {
    if (!validateProfileForm()) return;
    
    try {
      setProfileLoading(true);
      setProfileError('');
      setProfileSuccess('');
      
      // Connect to the real API endpoint
      const response = await userService.update(currentUser.id, profileData);
      
      // Update context with new user data from API response
      updateUserData({
        ...currentUser,
        ...response.data
      });
      
      setIsEditingProfile(false);
      setProfileSuccess('Profile updated successfully');
    } catch (error) {
      if (error.response) {
        const { status, data } = error.response;
        
        if (status === 400) {
          // Handle validation errors from the server
          if (data.errors && typeof data.errors === 'object') {
            // Map server-side validation errors to form fields
            const serverErrors = {};
            Object.entries(data.errors).forEach(([key, value]) => {
              serverErrors[key] = Array.isArray(value) ? value[0] : value;
            });
            setProfileErrors(serverErrors);
          } else {
            setProfileError(data?.message || 'Invalid profile data. Please check your inputs and try again.');
          }
        } else if (status === 403) {
          setProfileError('You do not have permission to update this profile.');
        } else if (status === 409) {
          setProfileError('Email address is already in use by another account.');
        } else if (data?.message) {
          setProfileError(data.message);
        } else {
          setProfileError('Failed to update profile. Please try again.');
        }
      } else if (error.request) {
        setProfileError('Cannot connect to the server. Please check your internet connection and try again.');
      } else {
        setProfileError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setProfileLoading(false);
    }
  };

  // Password Change Handlers
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear field error if user is typing
    if (passwordErrors[name]) {
      setPasswordErrors(prev => ({
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

  const validatePasswordForm = () => {
    const errors = {};
    
    if (!passwordData.currentPassword) {
      errors.currentPassword = 'Current password is required';
    }
    
    // New password validation with EHS-specific requirements
    if (!passwordData.newPassword) {
      errors.newPassword = 'New password is required';
    } else {
      // Password length
      if (passwordData.newPassword.length < 8) {
        errors.newPassword = 'Password must be at least 8 characters';
      }
      
      // Check for uppercase, lowercase, number, and special character
      const hasUppercase = /[A-Z]/.test(passwordData.newPassword);
      const hasLowercase = /[a-z]/.test(passwordData.newPassword);
      const hasNumber = /[0-9]/.test(passwordData.newPassword);
      const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(passwordData.newPassword);
      
      if (!hasUppercase || !hasLowercase || !hasNumber || !hasSpecial) {
        errors.newPassword = 'Password must include uppercase, lowercase, number, and special character';
      }
      
      // EHS domain-specific validation
      // Prevent passwords that use common safety terms (could be guessed)
      const forbiddenTerms = ['safety', 'password', 'secure', 'ehs', 'osha'];
      if (forbiddenTerms.some(term => passwordData.newPassword.toLowerCase().includes(term))) {
        errors.newPassword = 'Password cannot contain common safety terms';
      }
      
      // Prevent reusing the current password
      if (passwordData.newPassword === passwordData.currentPassword) {
        errors.newPassword = 'New password must be different from current password';
      }
    }
    
    if (!passwordData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your new password';
    } else if (passwordData.newPassword !== passwordData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    
    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    
    if (!validatePasswordForm()) return;
    
    try {
      setPasswordLoading(true);
      setPasswordError('');
      setPasswordSuccess('');
      
      // Connect to the real API endpoint
      await authService.changePassword(passwordData);
      
      // Reset form
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      
      // Reset password visibility
      setShowPasswords({
        currentPassword: false,
        newPassword: false,
        confirmPassword: false
      });
      
      setPasswordSuccess('Password changed successfully');
    } catch (error) {
      if (error.response) {
        const { status, data } = error.response;
        
        if (status === 400) {
          // Handle validation errors from the server
          if (data.errors && typeof data.errors === 'object') {
            // Map server-side validation errors to form fields
            const serverErrors = {};
            Object.entries(data.errors).forEach(([key, value]) => {
              serverErrors[key] = Array.isArray(value) ? value[0] : value;
            });
            setPasswordErrors(serverErrors);
          } else if (data?.message) {
            setPasswordError(data.message);
          } else {
            setPasswordError('Invalid password data. Please check your inputs and try again.');
          }
        } else if (status === 401) {
          setPasswordError('Current password is incorrect.');
          // Clear only the currentPassword field
          setPasswordData(prev => ({
            ...prev,
            currentPassword: ''
          }));
        } else if (status === 403) {
          setPasswordError('You do not have permission to change this password.');
        } else if (status === 429) {
          setPasswordError('Too many password change attempts. Please try again later.');
        } else if (data?.message) {
          setPasswordError(data.message);
        } else {
          setPasswordError('Failed to change password. Please try again.');
        }
      } else if (error.request) {
        setPasswordError('Cannot connect to the server. Please check your internet connection and try again.');
      } else {
        setPasswordError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setPasswordLoading(false);
    }
  };

  if (profileLoading && !currentUser) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        My Profile
      </Typography>
      
      <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="profile tabs">
            <Tab label="Profile Information" id="profile-tab-0" />
            <Tab label="Change Password" id="profile-tab-1" />
          </Tabs>
        </Box>
        
        {/* Profile Information Tab */}
        <TabPanel value={tabValue} index={0}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <Avatar 
              sx={{ width: 100, height: 100, mr: 3, bgcolor: 'primary.main' }}
            >
              {profileData.firstName && profileData.lastName ? 
                `${profileData.firstName[0]}${profileData.lastName[0]}` : 
                <AccountCircleIcon fontSize="large" />
              }
            </Avatar>
            
            <Box>
              <Typography variant="h5">
                {`${profileData.firstName} ${profileData.lastName}`}
              </Typography>
              <Typography variant="body1" color="textSecondary">
                {profileData.jobTitle} • {profileData.department}
              </Typography>
            </Box>
            
            {!isEditingProfile && (
              <Button
                startIcon={<EditIcon />}
                sx={{ ml: 'auto' }}
                onClick={handleStartEditing}
              >
                Edit
              </Button>
            )}
          </Box>
          
          {profileError && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {profileError}
            </Alert>
          )}
          
          {profileSuccess && (
            <Alert severity="success" sx={{ mb: 3 }}>
              {profileSuccess}
            </Alert>
          )}
          
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="First Name"
                name="firstName"
                value={profileData.firstName || ''}
                onChange={handleProfileChange}
                disabled={!isEditingProfile || profileLoading}
                error={!!profileErrors.firstName}
                helperText={profileErrors.firstName}
                InputProps={{
                  readOnly: !isEditingProfile,
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Last Name"
                name="lastName"
                value={profileData.lastName || ''}
                onChange={handleProfileChange}
                disabled={!isEditingProfile || profileLoading}
                error={!!profileErrors.lastName}
                helperText={profileErrors.lastName}
                InputProps={{
                  readOnly: !isEditingProfile,
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Email"
                name="email"
                type="email"
                value={profileData.email || ''}
                onChange={handleProfileChange}
                disabled={!isEditingProfile || profileLoading}
                error={!!profileErrors.email}
                helperText={profileErrors.email}
                InputProps={{
                  readOnly: !isEditingProfile,
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Phone"
                name="phone"
                value={profileData.phone || ''}
                onChange={handleProfileChange}
                disabled={!isEditingProfile || profileLoading}
                error={!!profileErrors.phone}
                helperText={profileErrors.phone}
                InputProps={{
                  readOnly: !isEditingProfile,
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Job Title"
                name="jobTitle"
                value={profileData.jobTitle || ''}
                onChange={handleProfileChange}
                disabled={!isEditingProfile || profileLoading}
                InputProps={{
                  readOnly: !isEditingProfile,
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Department"
                name="department"
                value={profileData.department || ''}
                onChange={handleProfileChange}
                disabled={!isEditingProfile || profileLoading}
                InputProps={{
                  readOnly: !isEditingProfile,
                }}
              />
            </Grid>
            
            {isEditingProfile && (
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                  <Button
                    variant="outlined"
                    startIcon={<CancelIcon />}
                    onClick={handleCancelEditing}
                    disabled={profileLoading}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<SaveIcon />}
                    onClick={handleSaveProfile}
                    disabled={profileLoading}
                  >
                    {profileLoading ? 'Saving...' : 'Save Changes'}
                  </Button>
                </Box>
              </Grid>
            )}
          </Grid>
        </TabPanel>
        
        {/* Change Password Tab */}
        <TabPanel value={tabValue} index={1}>
          {passwordError && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {passwordError}
            </Alert>
          )}
          
          {passwordSuccess && (
            <Alert severity="success" sx={{ mb: 3 }}>
              {passwordSuccess}
            </Alert>
          )}
          
          <Box component="form" onSubmit={handleChangePassword}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  required
                  label="Current Password"
                  name="currentPassword"
                  type={showPasswords.currentPassword ? 'text' : 'password'}
                  value={passwordData.currentPassword}
                  onChange={handlePasswordChange}
                  disabled={passwordLoading}
                  error={!!passwordErrors.currentPassword}
                  helperText={passwordErrors.currentPassword}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="toggle password visibility"
                          onClick={() => togglePasswordVisibility('currentPassword')}
                          edge="end"
                        >
                          {showPasswords.currentPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  required
                  label="New Password"
                  name="newPassword"
                  type={showPasswords.newPassword ? 'text' : 'password'}
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                  disabled={passwordLoading}
                  error={!!passwordErrors.newPassword}
                  helperText={passwordErrors.newPassword}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="toggle password visibility"
                          onClick={() => togglePasswordVisibility('newPassword')}
                          edge="end"
                        >
                          {showPasswords.newPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  required
                  label="Confirm New Password"
                  name="confirmPassword"
                  type={showPasswords.confirmPassword ? 'text' : 'password'}
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordChange}
                  disabled={passwordLoading}
                  error={!!passwordErrors.confirmPassword}
                  helperText={passwordErrors.confirmPassword}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="toggle password visibility"
                          onClick={() => togglePasswordVisibility('confirmPassword')}
                          edge="end"
                        >
                          {showPasswords.confirmPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={passwordLoading}
                  >
                    {passwordLoading ? 'Changing Password...' : 'Change Password'}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Box>
        </TabPanel>
      </Paper>
    </Container>
  );
};

export default Profile;