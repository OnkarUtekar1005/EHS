// src/pages/admin/AdminProfile.js
import React, { useState, useEffect, useCallback } from 'react';
import { 
  Container, 
  Typography, 
  Paper, 
  Grid, 
  Box, 
  Avatar, 
  TextField, 
  Button, 
  FormControlLabel, 
  Checkbox,
  Alert,
  Snackbar,
  CircularProgress,
  Tab,
  Tabs,
  Divider
} from '@mui/material';
import { 
  AdminPanelSettings as AdminIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { userService } from '../../services/api';

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

const AdminProfile = () => {
  const { currentUser, updateUserData } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  
  // Profile Information State
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    username: ''
  });
  const [permissions, setPermissions] = useState({
    moduleManagement: true,
    userManagement: true,
    domainConfiguration: true,
    reportGeneration: true,
    aiContentGeneration: true,
    systemConfiguration: true
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
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        email: userData.email || '',
        username: userData.username || ''
      });
      
      // Set permissions if available
      if (userData.permissions) {
        setPermissions(userData.permissions);
      }
      
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
        firstName: currentUser.firstName || '',
        lastName: currentUser.lastName || '',
        email: currentUser.email || '',
        username: currentUser.username || ''
      });
      
      // If user has permissions data, set it
      if (currentUser.permissions) {
        setPermissions(currentUser.permissions);
      }
    }
    
    // Always fetch the latest profile data from the API
    fetchUserProfile();
  }, [currentUser, fetchUserProfile]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfileData({
      ...profileData,
      [name]: value
    });
    
    // Clear field error if user is typing
    if (profileErrors[name]) {
      setProfileErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };
  
  const handlePermissionChange = (e) => {
    const { name, checked } = e.target;
    setPermissions({
      ...permissions,
      [name]: checked
    });
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
        firstName: currentUser.firstName || '',
        lastName: currentUser.lastName || '',
        email: currentUser.email || '',
        username: currentUser.username || ''
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
      
      // Only update if we have a user ID
      if (!currentUser?.id) {
        throw new Error('User ID not found');
      }
      
      // Prepare update data
      const updateData = {
        ...profileData,
        permissions
      };
      
      // Call API to update user
      const response = await userService.update(currentUser.id, updateData);
      
      // Update user in context
      updateUserData({
        ...currentUser,
        ...response.data
      });
      
      setIsEditingProfile(false);
      setProfileSuccess(true);
      
      // Refresh profile data
      setProfileFetched(false);
      fetchUserProfile();
    } catch (err) {
      setProfileError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setProfileLoading(false);
    }
  };
  
  const handleCloseSnackbar = () => {
    setProfileSuccess(false);
  };
  
  if (profileLoading && !profileData.firstName) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }
  
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>Admin Profile</Typography>
      
      <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="profile tabs">
            <Tab label="Profile Information" id="profile-tab-0" />
            <Tab label="Admin Permissions" id="profile-tab-1" />
          </Tabs>
        </Box>
        
        {/* Profile Information Tab */}
        <TabPanel value={tabValue} index={0}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <Avatar sx={{ width: 100, height: 100, mr: 3, bgcolor: 'primary.main' }}>
              <AdminIcon fontSize="large" />
            </Avatar>
            
            <Box>
              <Typography variant="h5">
                {profileData.firstName} {profileData.lastName || 'Administrator'}
              </Typography>
              <Typography variant="body1" color="textSecondary">
                Administrator
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Last Login: {currentUser?.lastLogin || 'March 30, 2025 09:45 AM'}
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
                value={profileData.firstName}
                onChange={handleInputChange}
                variant="outlined"
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
                value={profileData.lastName}
                onChange={handleInputChange}
                variant="outlined"
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
                value={profileData.username}
                onChange={handleInputChange}
                variant="outlined"
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
                value={profileData.email}
                onChange={handleInputChange}
                variant="outlined"
                disabled={!isEditingProfile || profileLoading}
                error={!!profileErrors.email}
                helperText={profileErrors.email}
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
                    {profileLoading ? <CircularProgress size={24} /> : 'Save Changes'}
                  </Button>
                </Box>
              </Grid>
            )}
          </Grid>
        </TabPanel>
        
        {/* Permissions Tab */}
        <TabPanel value={tabValue} index={1}>
          <Typography variant="h6" gutterBottom>Administrative Permissions</Typography>
          <Alert severity="info" sx={{ mb: 3 }}>
            These permissions control what actions this administrator can perform in the system.
          </Alert>
          
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <FormControlLabel 
                control={
                  <Checkbox 
                    checked={permissions.moduleManagement} 
                    onChange={handlePermissionChange}
                    name="moduleManagement"
                    disabled={!isEditingProfile || profileLoading}
                  />
                } 
                label="Module Management" 
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControlLabel 
                control={
                  <Checkbox 
                    checked={permissions.userManagement} 
                    onChange={handlePermissionChange}
                    name="userManagement"
                    disabled={!isEditingProfile || profileLoading}
                  />
                } 
                label="User Management" 
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControlLabel 
                control={
                  <Checkbox 
                    checked={permissions.domainConfiguration} 
                    onChange={handlePermissionChange}
                    name="domainConfiguration"
                    disabled={!isEditingProfile || profileLoading}
                  />
                } 
                label="Domain Configuration" 
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControlLabel 
                control={
                  <Checkbox 
                    checked={permissions.reportGeneration} 
                    onChange={handlePermissionChange}
                    name="reportGeneration"
                    disabled={!isEditingProfile || profileLoading}
                  />
                } 
                label="Report Generation" 
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControlLabel 
                control={
                  <Checkbox 
                    checked={permissions.aiContentGeneration} 
                    onChange={handlePermissionChange}
                    name="aiContentGeneration"
                    disabled={!isEditingProfile || profileLoading}
                  />
                } 
                label="AI Content Generation" 
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControlLabel 
                control={
                  <Checkbox 
                    checked={permissions.systemConfiguration} 
                    onChange={handlePermissionChange}
                    name="systemConfiguration"
                    disabled={!isEditingProfile || profileLoading}
                  />
                } 
                label="System Configuration" 
              />
            </Grid>
            
            {isEditingProfile && (
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
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
                    {profileLoading ? <CircularProgress size={24} /> : 'Save Changes'}
                  </Button>
                </Box>
              </Grid>
            )}
          </Grid>
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

export default AdminProfile;