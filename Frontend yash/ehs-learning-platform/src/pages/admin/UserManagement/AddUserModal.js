import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, Select, MenuItem, FormControl,
  InputLabel, Grid, Typography, List, ListItem,
  ListItemText, Checkbox, Box, IconButton
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import api from '../../../services/api';

function AddUserModal({ open, onClose, onUserAdded }) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('EMPLOYEE');
  const [domains, setDomains] = useState([]);
  const [availableDomains, setAvailableDomains] = useState([]);
  const [selectedDomains, setSelectedDomains] = useState([]);
  const [errors, setErrors] = useState({});

  // Fetch available domains
  useEffect(() => {
    if (open) {
      const fetchDomains = async () => {
        try {
          const response = await api.get('/api/domains');
          setAvailableDomains(response.data);
        } catch (error) {
          console.error('Error fetching domains:', error);
        }
      };

      fetchDomains();
    }
  }, [open]);
  
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
  
  // Handle username input with emoji filtering
  const handleUsernameChange = (e) => {
    let value = e.target.value;
    
    // Remove emojis and non-alphanumeric characters (allow underscore, hyphen, dot)
    value = value.replace(/[\u{1f300}-\u{1f5ff}\u{1f900}-\u{1f9ff}\u{1f600}-\u{1f64f}\u{1f680}-\u{1f6ff}\u{2600}-\u{26ff}\u{2700}-\u{27bf}\u{1f1e6}-\u{1f1ff}\u{1f191}-\u{1f251}\u{1f004}\u{1f0cf}\u{1f170}-\u{1f171}\u{1f17e}-\u{1f17f}\u{1f18e}\u{3030}\u{2b50}\u{2b55}\u{2934}-\u{2935}\u{2b05}-\u{2b07}\u{2b1b}-\u{2b1c}\u{3297}\u{3299}\u{303d}\u{00a9}\u{00ae}\u{2122}\u{23f3}\u{24c2}\u{23e9}-\u{23ef}\u{25b6}\u{23f8}-\u{23fa}]/gu, '');
    
    // Only allow alphanumeric characters, underscore, hyphen, and dot
    value = value.replace(/[^a-zA-Z0-9._-]/g, '');
    
    setUsername(value);
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    if (!username) {
      newErrors.username = 'Username is required';
    } else if (!/^[a-zA-Z0-9._-]+$/.test(username)) {
      newErrors.username = 'Username can only contain letters, numbers, underscore, hyphen, and dot';
    } else if (username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters long';
    } else if (username.length > 30) {
      newErrors.username = 'Username must be less than 30 characters';
    }

    if (!email) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Email is invalid';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submit
  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      const userData = {
        username,
        email,
        role,
        domainIds: selectedDomains
      };

      const response = await api.post('/api/users', userData);
      // Pass the backend-generated password to the parent component
      if (response.data && response.data.password) {
        onUserAdded(response.data.password);
      } else {
        onUserAdded();
      }
      handleClose();
      // Show success notification
    } catch (error) {
      console.error('Error creating user:', error);
      // Handle specific errors from backend
      if (error.response && error.response.data) {
        const backendErrors = {};
        if (error.response.data.message.includes('username')) {
          backendErrors.username = 'Username already exists';
        }
        if (error.response.data.message.includes('email')) {
          backendErrors.email = 'Email already exists';
        }
        setErrors({ ...errors, ...backendErrors });
      }
      // Show error notification
    }
  };
  
  // Reset form on close
  const handleClose = () => {
    setUsername('');
    setEmail('');
    setRole('EMPLOYEE');
    setSelectedDomains([]);
    setErrors({});
    onClose();
  };
  
  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        Add User
        <IconButton
          aria-label="close"
          onClick={handleClose}
          sx={{ position: 'absolute', right: 8, top: 8 }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent dividers>
        <Typography variant="h6" gutterBottom>
          User Information
        </Typography>
        
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Username"
              value={username}
              onChange={handleUsernameChange}
              error={!!errors.username}
              helperText={errors.username || 'Only letters, numbers, underscore, hyphen, and dot allowed'}
              required
              margin="normal"
            />
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
            <div style={{ padding: '16px 0', marginTop: '16px' }}>
              <Typography variant="body2" color="textSecondary">
                A secure password will be generated automatically when the user is created.
              </Typography>
            </div>
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
                    checked={selectedDomains.includes(domain.id)}
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
      </DialogContent>
      
      <DialogActions>
        <Button onClick={handleClose} color="inherit">
          Cancel
        </Button>
        <Button onClick={handleSubmit} variant="contained" color="primary">
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default AddUserModal;