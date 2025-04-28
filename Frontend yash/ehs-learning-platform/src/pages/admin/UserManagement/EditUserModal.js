import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, Select, MenuItem, FormControl,
  InputLabel, Grid, Typography, List, ListItem,
  ListItemText, Checkbox, Box, IconButton
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import api from '../../../services/api';

function EditUserModal({ open, onClose, userId, onUserUpdated }) {
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');
  const [availableDomains, setAvailableDomains] = useState([]);
  const [selectedDomains, setSelectedDomains] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  
  // Fetch user data when modal opens
  useEffect(() => {
    if (open && userId) {
      fetchUserData();
      fetchDomains();
    }
  }, [open, userId]);
  
  // Fetch user data
  const fetchUserData = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/api/users/${userId}`);
      const userData = response.data;
      
      setUser(userData);
      setEmail(userData.email);
      setRole(userData.role);
      setSelectedDomains(userData.domains.map(domain => domain.id));
    } catch (error) {
      console.error('Error fetching user data:', error);
      // Show error notification
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch available domains
  const fetchDomains = async () => {
    try {
      const response = await api.get('/api/domains');
      setAvailableDomains(response.data);
    } catch (error) {
      console.error('Error fetching domains:', error);
    }
  };
  
  // Handle domain selection
  const handleDomainToggle = (domainId) => {
    const currentIndex = selectedDomains.indexOf(domainId);
    const newSelectedDomains = [...selectedDomains];
    
    if (currentIndex === -1) {
      newSelectedDomains.push(domainId);
    } else {
      newSelectedDomains.splice(currentIndex, 1);
    }
    
    setSelectedDomains(newSelectedDomains);
  };
  
  // Show reset password modal
  const handleResetPassword = () => {
    // Implementation will be covered in the ResetPasswordModal component
  };
  
  // Validate form
  const validateForm = () => {
    const newErrors = {};
    
    if (!email) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Email is invalid';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Handle form submit
  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    setLoading(true);
    try {
      const userData = {
        email,
        role
      };
      
      // Update user details
      await api.put(`/api/users/${userId}`, userData);
      
      // Update user domains
      await api.put(`/api/users/${userId}/domains`, {
        domainIds: selectedDomains
      });
      
      onUserUpdated();
      onClose();
      // Show success notification
    } catch (error) {
      console.error('Error updating user:', error);
      // Handle specific errors from backend
      if (error.response && error.response.data) {
        const backendErrors = {};
        if (error.response.data.message.includes('email')) {
          backendErrors.email = 'Email already exists';
        }
        setErrors({ ...errors, ...backendErrors });
      }
      // Show error notification
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {user ? `Edit User: ${user.username}` : 'Edit User'}
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{ position: 'absolute', right: 8, top: 8 }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent dividers>
        {loading && !user ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : user && (
          <>
            <Typography variant="h6" gutterBottom>
              User Information
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography variant="body1">
                  <strong>Username:</strong> {user.username} (cannot be changed)
                </Typography>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  error={!!errors.email}
                  helperText={errors.email}
                  required
                  margin="normal"
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <FormControl fullWidth margin="normal">
                  <InputLabel>Role</InputLabel>
                  <Select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    label="Role"
                  >
                    <MenuItem value="EMPLOYEE">Employee</MenuItem>
                    <MenuItem value="ADMIN">Admin</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12}>
                <Button 
                  variant="outlined" 
                  color="primary"
                  onClick={handleResetPassword}
                >
                  Reset Password
                </Button>
              </Grid>
            </Grid>
            
            <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
              Domain Assignment
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2">Available Domains:</Typography>
                <List dense sx={{ bgcolor: 'background.paper', maxHeight: 200, overflow: 'auto' }}>
                  {availableDomains.filter(domain => !selectedDomains.includes(domain.id)).map((domain) => (
                    <ListItem key={domain.id} button onClick={() => handleDomainToggle(domain.id)}>
                      <Checkbox
                        edge="start"
                        checked={false}
                        tabIndex={-1}
                        disableRipple
                      />
                      <ListItemText primary={domain.name} />
                    </ListItem>
                  ))}
                </List>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2">Selected Domains:</Typography>
                <List dense sx={{ bgcolor: 'background.paper', maxHeight: 200, overflow: 'auto' }}>
                  {availableDomains.filter(domain => selectedDomains.includes(domain.id)).map((domain) => (
                    <ListItem key={domain.id} button onClick={() => handleDomainToggle(domain.id)}>
                      <Checkbox
                        edge="start"
                        checked={true}
                        tabIndex={-1}
                        disableRipple
                      />
                      <ListItemText primary={domain.name} />
                    </ListItem>
                  ))}
                  {selectedDomains.length === 0 && (
                    <ListItem>
                      <ListItemText primary="No domains selected" />
                    </ListItem>
                  )}
                </List>
              </Grid>
            </Grid>
            
            <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
              User Activity
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="body1">
                  <strong>Modules Assigned:</strong> {user.modulesAssigned || 0}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body1">
                  <strong>Modules Completed:</strong> {user.modulesCompleted || 0}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Button variant="outlined" sx={{ mr: 2 }}>
                  View Training Progress
                </Button>
                <Button variant="outlined">
                  View Reports
                </Button>
              </Grid>
            </Grid>
          </>
        )}
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose} color="inherit">
          Cancel
        </Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          color="primary"
          disabled={loading}
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default EditUserModal;