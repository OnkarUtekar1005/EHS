import React, { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, FormControlLabel, Checkbox,
  Typography, Radio, RadioGroup, Box, IconButton
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import api from '../../../services/api';

function ResetPasswordModal({ open, onClose, userId, username }) {
  const [passwordType, setPasswordType] = useState('random');
  const [specificPassword, setSpecificPassword] = useState('');
  const [randomPassword, setRandomPassword] = useState('');
  const [sendEmail, setSendEmail] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Generate random password when modal opens
  React.useEffect(() => {
    if (open) {
      generateRandomPassword();
    }
  }, [open]);
  
  // Generate random password
  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()';
    let newPassword = '';
    
    // Ensure password has at least one of each required character type
    newPassword += chars.substring(0, 26).charAt(Math.floor(Math.random() * 26)); // Uppercase
    newPassword += chars.substring(26, 52).charAt(Math.floor(Math.random() * 26)); // Lowercase
    newPassword += chars.substring(52, 62).charAt(Math.floor(Math.random() * 10)); // Number
    newPassword += chars.substring(62).charAt(Math.floor(Math.random() * (chars.length - 62))); // Special char
    
    // Add remaining characters
    for (let i = 4; i < 10; i++) {
      newPassword += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    // Shuffle the password
    newPassword = newPassword.split('').sort(() => 0.5 - Math.random()).join('');
    
    setRandomPassword(newPassword);
  };
  
  // Reset user password
  const handleResetPassword = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const password = passwordType === 'specific' ? specificPassword : randomPassword;
      
      await api.put(`/api/users/${userId}/password`, {
        password,
        sendEmail
      });
      
      onClose();
      // Show success notification
    } catch (error) {
      console.error('Error resetting password:', error);
      setError('Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Validate password
  const isPasswordValid = () => {
    if (passwordType === 'random') return true;
    
    const password = specificPassword;
    // Check if password is at least 8 characters long and contains uppercase, lowercase, number, and special character
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password);
    const isLongEnough = password.length >= 8;
    
    return hasUppercase && hasLowercase && hasNumber && hasSpecial && isLongEnough;
  };
  
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        Reset Password for User: {username}
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{ position: 'absolute', right: 8, top: 8 }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent dividers>
        {error && (
          <Box sx={{ mb: 2 }}>
            <Alert severity="error">{error}</Alert>
          </Box>
        )}
        
        <Typography variant="h6" gutterBottom>
          Reset Password Options
        </Typography>
        
        <RadioGroup
          value={passwordType}
          onChange={(e) => setPasswordType(e.target.value)}
        >
          <FormControlLabel
            value="specific"
            control={<Radio />}
            label="Set specific password:"
          />
          
          <Box sx={{ ml: 4, mb: 2 }}>
            <TextField
              fullWidth
              type="text"
              value={specificPassword}
              onChange={(e) => setSpecificPassword(e.target.value)}
              disabled={passwordType !== 'specific'}
              error={passwordType === 'specific' && !isPasswordValid()}
              helperText={
                passwordType === 'specific' && !isPasswordValid() ?
                'Password must contain at least 8 characters including uppercase, lowercase, number, and special character' :
                ''
              }
            />
          </Box>
          
          <FormControlLabel
            value="random"
            control={<Radio />}
            label="Generate random password:"
          />
          
          <Box sx={{ ml: 4, mb: 2, display: 'flex', alignItems: 'center' }}>
            <TextField
              value={randomPassword}
              disabled
              sx={{ flexGrow: 1 }}
            />
            <Button 
              onClick={generateRandomPassword}
              sx={{ ml: 1 }}
              disabled={passwordType !== 'random'}
            >
              Regenerate
            </Button>
          </Box>
        </RadioGroup>
        
        <FormControlLabel
          control={
            <Checkbox
              checked={sendEmail}
              onChange={(e) => setSendEmail(e.target.checked)}
            />
          }
          label="Send password reset email to user"
        />
        
        <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
          Password must contain at least 8 characters including uppercase, lowercase, number, and special character.
        </Typography>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose} color="inherit">
          Cancel
        </Button>
        <Button 
          onClick={handleResetPassword} 
          variant="contained" 
          color="primary"
          disabled={loading || (passwordType === 'specific' && !isPasswordValid())}
        >
          Reset Password
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default ResetPasswordModal;