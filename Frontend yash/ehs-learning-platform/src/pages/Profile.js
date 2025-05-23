// src/pages/Profile.js
import React, { useState, useEffect, useCallback } from 'react';
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
  Alert,
  InputAdornment,
  IconButton,
  CircularProgress,
  Chip,
  Snackbar
} from '@mui/material';
import {
  AccountCircle as AccountCircleIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Visibility,
  VisibilityOff,
  Domain as DomainIcon
} from '@mui/icons-material';
import { userService, authService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

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
  const [tabValue, setTabValue] = useState(0);
  const { currentUser, updateUserData } = useAuth();
  
  // Profile Information State
  const [profileData, setProfileData] = useState({
    username: '',
    email: '',
    role: '',
    domains: []
  });
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileErrors, setProfileErrors] = useState({});
  const [profileFetched, setProfileFetched] = useState(false);

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

  // Memoized function to fetch user profile
  const fetchUserProfile = useCallback(async () => {
    // Skip if we've already fetched the profile
    if (profileFetched) return;
    
    try {
      setProfileLoading(true);
      setProfileError('');
      
      // Get user ID - first try from currentUser, then from localStorage
      const userId = currentUser?.id || 
                     JSON.parse(localStorage.getItem('user') || '{}')?.id;
      
      if (!userId) {
        throw new Error('User ID not found');
      }
      
      console.log("Fetching user profile for ID:", userId);
      
      // Make the API call to get user details
      const response = await userService.getById(userId);
      const userData = response.data;
      
      console.log("User data received:", userData);
      
      // Update auth context only if the data is different
      if (JSON.stringify(currentUser) !== JSON.stringify(userData)) {
        updateUserData(userData);
      }
      
      // Update profile data with API response
      setProfileData({
        username: userData.username || '',
        email: userData.email || '',
        role: userData.role || '',
        domains: userData.domains || []
      });
      
      // Mark profile as fetched to prevent duplicate calls
      setProfileFetched(true);
    } catch (error) {
      console.error("API Error:", error);
      setProfileError(
        error.response?.data?.message || 
        `Failed to load profile data: ${error.message}`
      );
    } finally {
      setProfileLoading(false);
    }
  }, [currentUser, updateUserData, profileFetched]);

  // Initialize profile data from current user and fetch additional data if needed
  useEffect(() => {
    // If we have current user data, use it to initialize the form
    if (currentUser) {
      setProfileData({
        username: currentUser.username || '',
        email: currentUser.email || '',
        role: currentUser.role || '',
        domains: currentUser.domains || []
      });
    }
    
    // Always fetch the latest profile data from the API
    fetchUserProfile();
  }, [currentUser, fetchUserProfile]);

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
    
    // Username is required
    if (!profileData.username.trim()) {
      errors.username = 'Username is required';
    }
    
    // Email is required and must be valid
    if (!profileData.email.trim()) {
      errors.email = 'Email is required';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(profileData.email)) {
        errors.email = 'Please enter a valid email address';
      }
    }
    
    setProfileErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleStartEditing = () => {
    setIsEditingProfile(true);
    setProfileError('');
    setProfileSuccess(false);
  };

  const handleCancelEditing = () => {
    // Reset to original data
    if (currentUser) {
      setProfileData({
        username: currentUser.username || '',
        email: currentUser.email || '',
        role: currentUser.role || '',
        domains: currentUser.domains || []
      });
    }
    setIsEditingProfile(false);
    setProfileErrors({});
    setProfileError('');
    setProfileSuccess(false);
  };

  const handleSaveProfile = async () => {
    if (!validateProfileForm()) return;
    
    try {
      setProfileLoading(true);
      setProfileError('');
      
      if (!currentUser || !currentUser.id) {
        throw new Error('User information not available');
      }
      
      console.log("Saving profile for user ID:", currentUser.id);
      console.log("Profile data to save:", profileData);
      
      // Only include editable fields in the update request
      const updateData = {
        username: profileData.username,
        email: profileData.email
      };
      
      // Make the actual API call to update user profile
      const response = await userService.update(currentUser.id, updateData);
      const updatedUserData = response.data;
      
      console.log("Updated user data:", updatedUserData);
      
      // Update the auth context with the response from the API
      updateUserData({
        ...currentUser,
        ...updatedUserData
      });
      
      setIsEditingProfile(false);
      setProfileSuccess(true);
      
      // Refresh the profile data from the API to ensure we have the latest
      setProfileFetched(false);
      fetchUserProfile();
    } catch (error) {
      console.error("Profile update error:", error);
      setProfileError(
        error.response?.data?.message || 
        'Failed to update profile. Please try again.'
      );
    } finally {
      setProfileLoading(false);
    }
  };

  const handleCloseSnackbar = () => {
    setProfileSuccess(false);
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
    
    if (!passwordData.newPassword) {
      errors.newPassword = 'New password is required';
    } else if (passwordData.newPassword.length < 8) {
      errors.newPassword = 'Password must be at least 8 characters';
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
      
      // Make the actual API call to change password
      await authService.changePassword(passwordData);
      
      // Reset form on success
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      
      setPasswordSuccess('Password changed successfully');
    } catch (error) {
      console.error("Password change error:", error);
      setPasswordError(
        error.response?.data?.message || 
        'Failed to change password. Please ensure your current password is correct.'
      );
    } finally {
      setPasswordLoading(false);
    }
  };

  // Format the role for display
  const formatRole = (role) => {
    if (!role) return '';
    return role.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  if (profileLoading && !profileData.username) {
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
              {profileData.username ? 
                profileData.username[0].toUpperCase() : 
                <AccountCircleIcon fontSize="large" />
              }
            </Avatar>
            
            <Box>
              <Typography variant="h5">
                {profileData.username || 'User'}
              </Typography>
              <Typography variant="body1" color="textSecondary">
                {formatRole(profileData.role) || 'No role assigned'}
              </Typography>
            </Box>
            
            {!isEditingProfile && (
              <Button
                startIcon={<EditIcon />}
                sx={{ ml: 'auto' }}
                onClick={handleStartEditing}
                disabled={profileLoading}
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
          
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Username"
                name="username"
                value={profileData.username || ''}
                onChange={handleProfileChange}
                disabled={!isEditingProfile || profileLoading}
                error={!!profileErrors.username}
                helperText={profileErrors.username}
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
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                Role
              </Typography>
              <Typography variant="body1" color={profileData.role ? 'textPrimary' : 'textSecondary'}>
                {formatRole(profileData.role) || 'No role assigned'}
              </Typography>
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                Assigned Domains
              </Typography>
              {profileData.domains && profileData.domains.length > 0 ? (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {profileData.domains.map((domain) => (
                    <Chip 
                      key={domain.id} 
                      icon={<DomainIcon />} 
                      label={domain.name} 
                      variant="outlined" 
                    />
                  ))}
                </Box>
              ) : (
                <Typography variant="body1" color="textSecondary">
                  No domains assigned
                </Typography>
              )}
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
                    {profileLoading ? 
                      <><CircularProgress size={20} sx={{ mr: 1 }} /> Saving...</> : 
                      'Save Changes'}
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
                    {passwordLoading ? 
                      <><CircularProgress size={20} sx={{ mr: 1 }} /> Changing Password...</> : 
                      'Change Password'}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Box>
        </TabPanel>
      </Paper>
      
      <Snackbar
        open={profileSuccess}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        message="Profile updated successfully"
      />
    </Container>
  );
};

export default Profile;