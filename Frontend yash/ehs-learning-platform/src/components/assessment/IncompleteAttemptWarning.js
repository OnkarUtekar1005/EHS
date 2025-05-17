import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemText,
  Typography,
  Alert,
  CircularProgress,
  Box
} from '@mui/material';
import { Warning } from '@mui/icons-material';
import { assessmentService } from '../../services/api';

const IncompleteAttemptWarning = ({ open, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [incompleteAttempts, setIncompleteAttempts] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (open) {
      checkIncompleteAttempts();
    }
  }, [open]);

  const checkIncompleteAttempts = async () => {
    try {
      setLoading(true);
      const response = await assessmentService.getIncompleteAttempts();
      setIncompleteAttempts(response.data.incompleteAttempts);
    } catch (err) {
      console.error('Error checking incomplete attempts:', err);
      setError('Failed to check incomplete attempts');
    } finally {
      setLoading(false);
    }
  };

  const handleAutoSubmit = async (attemptId) => {
    try {
      setSubmitting(true);
      await assessmentService.autoSubmitAttempt(attemptId);
      // Remove the submitted attempt from the list
      setIncompleteAttempts(prev => prev.filter(a => a.attemptId !== attemptId));
      
      if (incompleteAttempts.length === 1) {
        onClose();
      }
    } catch (err) {
      console.error('Error auto-submitting attempt:', err);
      setError('Failed to submit attempt');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAutoSubmitAll = async () => {
    try {
      setSubmitting(true);
      // Submit all attempts one by one
      for (const attempt of incompleteAttempts) {
        await assessmentService.autoSubmitAttempt(attempt.attemptId);
      }
      setIncompleteAttempts([]);
      onClose();
    } catch (err) {
      console.error('Error auto-submitting attempts:', err);
      setError('Failed to submit some attempts');
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <Dialog 
      open={open} 
      onClose={() => {}} 
      maxWidth="md" 
      fullWidth
      disableEscapeKeyDown
      disableBackdropClick
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <Warning color="warning" />
          <Typography variant="h6">Incomplete Assessment Attempts</Typography>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        {loading ? (
          <Box display="flex" justifyContent="center" py={3}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : incompleteAttempts.length === 0 ? (
          <Typography>No incomplete attempts found.</Typography>
        ) : (
          <>
            <Alert severity="warning" sx={{ mb: 2 }}>
              You have incomplete assessment attempts. These will be automatically submitted with current progress if you proceed. 
              Any unanswered questions will be marked as incorrect.
            </Alert>
            
            <List>
              {incompleteAttempts.map((attempt) => (
                <ListItem key={attempt.attemptId}>
                  <ListItemText
                    primary={`${attempt.courseTitle} - ${attempt.componentTitle}`}
                    secondary={`Started ${attempt.elapsedMinutes} minutes ago • Attempt ${attempt.attemptNumber}`}
                  />
                  <Button
                    variant="outlined"
                    size="small"
                    disabled={submitting}
                    onClick={() => handleAutoSubmit(attempt.attemptId)}
                  >
                    Submit Now
                  </Button>
                </ListItem>
              ))}
            </List>
          </>
        )}
      </DialogContent>
      
      <DialogActions>
        <Button 
          onClick={handleAutoSubmitAll} 
          color="primary" 
          variant="contained"
          disabled={loading || submitting || incompleteAttempts.length === 0}
        >
          Submit All and Continue
        </Button>
        {incompleteAttempts.length === 0 && (
          <Button onClick={onClose} variant="outlined">
            Continue
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default IncompleteAttemptWarning;