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
  Alert,
  CircularProgress,
  Chip,
  Snackbar
} from '@mui/material';
import {
  AccountCircle as AccountCircleIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Domain as DomainIcon
} from '@mui/icons-material';
import { userService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const Profile = () => {
  const { currentUser, updateUserData } = useAuth();
  
  // Profile Information State
  const [profileData, setProfileData] = useState({
    username: '',
    email: '',
    firstName: '',
    lastName: '',
    role: '',
    domains: []
  });
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileErrors, setProfileErrors] = useState({});
  const [profileFetched, setProfileFetched] = useState(false);

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
      
      
      // Make the API call to get user details
      const response = await userService.getById(userId);
      const userData = response.data;
      
      
      // Update auth context only if the data is different
      if (JSON.stringify(currentUser) !== JSON.stringify(userData)) {
        updateUserData(userData);
      }
      
      // Update profile data with API response
      setProfileData({
        username: userData.username || '',
        email: userData.email || '',
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        role: userData.role || '',
        domains: userData.domains || []
      });
      
      // Mark profile as fetched to prevent duplicate calls
      setProfileFetched(true);
    } catch (error) {
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
        firstName: currentUser.firstName || '',
        lastName: currentUser.lastName || '',
        role: currentUser.role || '',
        domains: currentUser.domains || []
      });
    }
    
    // Always fetch the latest profile data from the API
    fetchUserProfile();
  }, [currentUser, fetchUserProfile]);

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
    
    // First name validation (optional but if provided, should be valid)
    if (profileData.firstName && profileData.firstName.trim().length > 50) {
      errors.firstName = 'First name must be less than 50 characters';
    }
    
    // Last name validation (optional but if provided, should be valid)
    if (profileData.lastName && profileData.lastName.trim().length > 50) {
      errors.lastName = 'Last name must be less than 50 characters';
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
        firstName: currentUser.firstName || '',
        lastName: currentUser.lastName || '',
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
      
      
      // Only include editable fields in the update request
      const updateData = {
        username: profileData.username,
        email: profileData.email,
        firstName: profileData.firstName,
        lastName: profileData.lastName
      };
      
      // Make the actual API call to update user profile
      const response = await userService.update(currentUser.id, updateData);
      const updatedUserData = response.data;
      
      
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
        <Typography variant="h6" gutterBottom>
          Profile Information
        </Typography>
        
        <Box sx={{ mt: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <Avatar 
              sx={{ width: 100, height: 100, mr: 3, bgcolor: 'primary.main' }}
            >
              {profileData.firstName && profileData.lastName ? 
                `${profileData.firstName[0]}${profileData.lastName[0]}`.toUpperCase() :
                profileData.firstName ? 
                  profileData.firstName[0].toUpperCase() :
                  profileData.username ? 
                    profileData.username[0].toUpperCase() : 
                    <AccountCircleIcon fontSize="large" />
              }
            </Avatar>
            
            <Box>
              <Typography variant="h5">
                {profileData.firstName || profileData.lastName ? 
                  `${profileData.firstName || ''} ${profileData.lastName || ''}`.trim() :
                  profileData.username || 'User'}
              </Typography>
              <Typography variant="body1" color="textSecondary">
                {profileData.username}
              </Typography>
              <Typography variant="body2" color="textSecondary">
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
        </Box>
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