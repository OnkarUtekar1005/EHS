import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Alert,
  CircularProgress
} from '@mui/material';
import api from '../../services/api';

const ThinkForm = ({ isAuthenticated = false, isPublic = false }) => {
  const [formData, setFormData] = useState({
    type: '',
    subject: '',
    description: '',
    isAnonymous: isPublic ? true : false
  });
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ show: false, type: '', message: '' });

  const thinkTypes = [
    { value: 'QUERY', label: 'Query' },
    { value: 'COMPLAINT', label: 'Complaint' },
    { value: 'NEW_IDEA', label: 'New Idea' }
  ];

  const handleChange = (e) => {
    const { name, value, checked, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setAlert({ show: false, type: '', message: '' });

    try {
      const endpoint = isPublic 
        ? '/think/public/submit' 
        : '/think/submit';

      const response = await api.post(endpoint, formData);

      setAlert({
        show: true,
        type: 'success',
        message: response.data.message || 'Your submission has been received successfully.'
      });

      setFormData({
        type: '',
        subject: '',
        description: '',
        isAnonymous: isPublic ? true : false
      });
    } catch (error) {
      setAlert({
        show: true,
        type: 'error',
        message: error.response?.data?.message || 'An error occurred while submitting your feedback.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 4, maxWidth: 800, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        {isPublic ? 'Share Your Thoughts' : 'Think'}
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        We value your feedback and are committed to improving your experience on our platform. 
        Please use the form below to share your thoughts, suggestions, or concerns. 
        Your input helps us enhance our services and better meet your needs.
      </Typography>

      {alert.show && (
        <Alert 
          severity={alert.type} 
          onClose={() => setAlert({ show: false, type: '', message: '' })}
          sx={{ mb: 2 }}
        >
          {alert.message}
        </Alert>
      )}

      <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
        <TextField
          select
          fullWidth
          required
          name="type"
          label="Select feedback type"
          value={formData.type}
          onChange={handleChange}
          sx={{ mb: 3 }}
        >
          <MenuItem value="">
            <em>Select type</em>
          </MenuItem>
          {thinkTypes.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          fullWidth
          required
          name="subject"
          label="Subject"
          placeholder="Enter the subject of your feedback"
          value={formData.subject}
          onChange={handleChange}
          sx={{ mb: 3 }}
        />

        <TextField
          fullWidth
          required
          multiline
          rows={6}
          name="description"
          label="Describe your feedback"
          placeholder="Please provide detailed information about your query, complaint, or idea..."
          value={formData.description}
          onChange={handleChange}
          sx={{ mb: 3 }}
        />

        {isAuthenticated && !isPublic && (
          <FormControlLabel
            control={
              <Checkbox
                checked={formData.isAnonymous}
                onChange={handleChange}
                name="isAnonymous"
                color="primary"
              />
            }
            label="Submit anonymously"
            sx={{ mb: 3 }}
          />
        )}

        {isPublic && (
          <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
            Note: All public submissions are anonymous.
          </Typography>
        )}

        <Button
          type="submit"
          variant="contained"
          color="primary"
          size="large"
          fullWidth
          disabled={loading}
          sx={{ mt: 2 }}
        >
          {loading ? <CircularProgress size={24} /> : 'Submit'}
        </Button>
      </Box>
    </Paper>
  );
};

export default ThinkForm;