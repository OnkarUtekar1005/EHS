// src/components/CourseEnquiryModal.js
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  TextField,
  Button,
  IconButton,
  Typography,
  Box,
  Grid,
  CircularProgress,
  Alert,
  Select,
  MenuItem,
  FormControl
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { publicService } from '../services/api';

const CourseEnquiryModal = ({ open, onClose, selectedCourse, courses = [] }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    subject: 'Course Enquiry',
    courseName: selectedCourse?.title || '',
    message: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // Subject options
  const subjectOptions = [
    'Course Enquiry',
    'Pricing Information',
    'Schedule & Timing',
    'Certification Details',
    'Corporate Training',
    'Other'
  ];

  // Update course name when selectedCourse changes
  React.useEffect(() => {
    if (selectedCourse?.title) {
      setFormData(prev => ({
        ...prev,
        courseName: selectedCourse.title
      }));
    }
  }, [selectedCourse]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await publicService.submitCourseEnquiry(formData);
      setSuccess(true);
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        subject: 'Course Enquiry',
        courseName: selectedCourse?.title || '',
        message: ''
      });
      setTimeout(() => {
        onClose();
        setSuccess(false);
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit enquiry. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
      setError('');
      setSuccess(false);
    }
  };

  // Common input style
  const inputStyle = {
    '& .MuiOutlinedInput-root': {
      borderRadius: '8px',
      backgroundColor: '#fff',
      '& fieldset': {
        borderColor: '#e0e0e0',
      },
      '&:hover fieldset': {
        borderColor: '#007BFF',
      },
      '&.Mui-focused fieldset': {
        borderColor: '#007BFF',
      },
    },
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '12px',
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
        }
      }}
    >
      {/* Close Button */}
      <IconButton
        onClick={handleClose}
        disabled={loading}
        sx={{
          position: 'absolute',
          right: 16,
          top: 16,
          color: '#6F6F6F',
          zIndex: 1,
          '&:hover': {
            backgroundColor: 'rgba(0,0,0,0.04)'
          }
        }}
      >
        <CloseIcon />
      </IconButton>

      <DialogContent sx={{ p: { xs: 3, sm: 5 }, pt: { xs: 4, sm: 5 } }}>
        {/* Header Section */}
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography
            sx={{
              color: '#007BFF',
              fontSize: '14px',
              fontWeight: 500,
              mb: 1
            }}
          >
            Get In Touch
          </Typography>
          <Typography
            variant="h4"
            sx={{
              color: '#1a365d',
              fontWeight: 700,
              fontSize: { xs: '24px', sm: '32px' },
              mb: 1.5
            }}
          >
            Send Us a Message
          </Typography>
          <Typography
            sx={{
              color: '#6F6F6F',
              fontSize: '15px',
              lineHeight: 1.6
            }}
          >
            Have questions? Fill out the form below and we'll get back to you within 24 hours.
          </Typography>
        </Box>

        {/* Alerts */}
        {error && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: '8px' }}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mb: 3, borderRadius: '8px' }}>
            Your enquiry has been submitted successfully! We'll get back to you soon.
          </Alert>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <Grid container spacing={2.5}>
            {/* Row 1: First Name + Last Name */}
            <Grid item xs={12} sm={6}>
              <Typography component="label" sx={{ fontSize: '14px', fontWeight: 500, color: '#333', mb: 0.5, display: 'block' }}>
                First Name <span style={{ color: '#e53e3e' }}>*</span>
              </Typography>
              <TextField
                fullWidth
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                required
                disabled={loading}
                placeholder="Enter your first name"
                size="small"
                sx={inputStyle}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography component="label" sx={{ fontSize: '14px', fontWeight: 500, color: '#333', mb: 0.5, display: 'block' }}>
                Last Name <span style={{ color: '#e53e3e' }}>*</span>
              </Typography>
              <TextField
                fullWidth
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                required
                disabled={loading}
                placeholder="Enter your last name"
                size="small"
                sx={inputStyle}
              />
            </Grid>

            {/* Row 2: Email + Phone */}
            <Grid item xs={12} sm={6}>
              <Typography component="label" sx={{ fontSize: '14px', fontWeight: 500, color: '#333', mb: 0.5, display: 'block' }}>
                Email Address <span style={{ color: '#e53e3e' }}>*</span>
              </Typography>
              <TextField
                fullWidth
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
                disabled={loading}
                placeholder="Enter your email"
                size="small"
                sx={inputStyle}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography component="label" sx={{ fontSize: '14px', fontWeight: 500, color: '#333', mb: 0.5, display: 'block' }}>
                Phone Number <span style={{ color: '#e53e3e' }}>*</span>
              </Typography>
              <TextField
                fullWidth
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
                disabled={loading}
                placeholder="Enter your phone number"
                size="small"
                sx={inputStyle}
              />
            </Grid>
            {/* Row 4: Interested Course */}
            <Grid item xs={12}>
              <Typography component="label" sx={{ fontSize: '14px', fontWeight: 500, color: '#333', mb: 0.5, display: 'block' }}>
                Interested Course <span style={{ color: '#6F6F6F', fontWeight: 400 }}>(Optional)</span>
              </Typography>
              <TextField
                fullWidth
                name="courseName"
                value={formData.courseName}
                onChange={handleChange}
                disabled={loading}
                placeholder="Select or type a course name"
                size="small"
                sx={{
                  ...inputStyle,
                  '& .MuiOutlinedInput-root': {
                    ...inputStyle['& .MuiOutlinedInput-root'],
                    backgroundColor: formData.courseName ? '#f0f7ff' : '#fff',
                  },
                }}
              />
            </Grid>

          </Grid>
          {/* Row 5: Message (full width, new line) */}
            <Grid item xs={12} sx={{mt:2}}>
              <Typography component="label" sx={{ fontSize: '14px', fontWeight: 500, color: '#333', mb: 0.5, display: 'block' }}>
                Message <span style={{ color: '#e53e3e' }}>*</span>
              </Typography>
              <TextField
                fullWidth
                name="message"
                value={formData.message}
                onChange={handleChange}
                multiline
                
                required
                disabled={loading}
                placeholder="Write your message here..."
                sx={inputStyle}
              />
            </Grid>
            {/* Row 6: Submit Button */}
             <Grid item xs={12} sx={{ mt:2, display: 'flex', justifyContent: 'center' }}>
              <Button
                type="submit"
                variant="contained"
                disabled={loading}
                sx={{
                  px: 6,
                  py: 1.5,
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: 600,
                  textTransform: 'none',
                  backgroundColor: '#007BFF',
                  boxShadow: 'none',
                  '&:hover': {
                    backgroundColor: '#0056b3',
                    boxShadow: '0 4px 12px rgba(0,123,255,0.3)'
                  },
                  '&:disabled': {
                    backgroundColor: '#ccc'
                  }
                }}
              >
                {loading ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  'Submit Enquiry'
                )}
              </Button>
            </Grid>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CourseEnquiryModal;
