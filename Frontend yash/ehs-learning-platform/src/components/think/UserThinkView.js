import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Fab
} from '@mui/material';
import {
  Add as AddIcon,
  Visibility as ViewIcon
} from '@mui/icons-material';
import api from '../../services/api';
import { format } from 'date-fns';
import ThinkForm from './ThinkForm';

const UserThinkView = () => {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [viewDialog, setViewDialog] = useState(false);
  const [formDialog, setFormDialog] = useState(false);
  const [alert, setAlert] = useState({ show: false, type: '', message: '' });

  useEffect(() => {
    fetchUserSubmissions();
  }, []);

  const fetchUserSubmissions = async () => {
    setLoading(true);
    try {
      const response = await api.get('/think/user/submissions');
      setSubmissions(response.data);
    } catch (error) {
      setAlert({
        show: true,
        type: 'error',
        message: 'Failed to fetch your submissions'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewSubmission = (submission) => {
    setSelectedSubmission(submission);
    setViewDialog(true);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'OPEN':
        return 'error';
      case 'IN_PROGRESS':
        return 'warning';
      case 'RESOLVED':
        return 'success';
      default:
        return 'default';
    }
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case 'QUERY':
        return 'Query';
      case 'COMPLAINT':
        return 'Complaint';
      case 'NEW_IDEA':
        return 'New Idea';
      default:
        return type;
    }
  };

  const handleFormClose = () => {
    setFormDialog(false);
    fetchUserSubmissions();
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          Think - Your Submissions
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => setFormDialog(true)}
        >
          New Submission
        </Button>
      </Box>

      {alert.show && (
        <Alert
          severity={alert.type}
          onClose={() => setAlert({ show: false, type: '', message: '' })}
          sx={{ mb: 2 }}
        >
          {alert.message}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      ) : submissions.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No submissions yet
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Share your thoughts, suggestions, or concerns with us.
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => setFormDialog(true)}
          >
            Make Your First Submission
          </Button>
        </Paper>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Subject</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Response</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {submissions.map((submission) => (
                <TableRow key={submission.id}>
                  <TableCell>
                    <Typography variant="body2">
                      {submission.subject}
                    </Typography>
                    {submission.isAnonymous && (
                      <Chip
                        label="Anonymous"
                        size="small"
                        variant="outlined"
                        sx={{ mt: 0.5 }}
                      />
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={getTypeLabel(submission.type)}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    {format(new Date(submission.createdAt), 'yyyy-MM-dd')}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={submission.status}
                      size="small"
                      color={getStatusColor(submission.status)}
                    />
                  </TableCell>
                  <TableCell>
                    {submission.adminResponse ? (
                      <Chip label="Responded" size="small" color="info" />
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        Pending
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button
                      size="small"
                      startIcon={<ViewIcon />}
                      onClick={() => handleViewSubmission(submission)}
                    >
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* View Dialog */}
      <Dialog open={viewDialog} onClose={() => setViewDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Submission Details</DialogTitle>
        <DialogContent>
          {selectedSubmission && (
            <Box sx={{ pt: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">Type</Typography>
              <Typography variant="body1" gutterBottom>
                {getTypeLabel(selectedSubmission.type)}
              </Typography>

              <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 2 }}>
                Subject
              </Typography>
              <Typography variant="body1" gutterBottom>
                {selectedSubmission.subject}
              </Typography>

              <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 2 }}>
                Description
              </Typography>
              <Typography variant="body1" gutterBottom>
                {selectedSubmission.description}
              </Typography>

              <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 2 }}>
                Submitted On
              </Typography>
              <Typography variant="body1" gutterBottom>
                {format(new Date(selectedSubmission.createdAt), 'PPpp')}
              </Typography>

              <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 2 }}>
                Status
              </Typography>
              <Chip
                label={selectedSubmission.status}
                size="small"
                color={getStatusColor(selectedSubmission.status)}
                sx={{ mt: 1 }}
              />

              {selectedSubmission.adminResponse && (
                <Paper sx={{ p: 2, mt: 3, bgcolor: 'primary.50' }}>
                  <Typography variant="subtitle2" color="primary" gutterBottom>
                    Admin Response
                  </Typography>
                  <Typography variant="body2">
                    {selectedSubmission.adminResponse}
                  </Typography>
                  {selectedSubmission.respondedAt && (
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                      Responded on: {format(new Date(selectedSubmission.respondedAt), 'PPpp')}
                    </Typography>
                  )}
                </Paper>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Form Dialog */}
      <Dialog open={formDialog} onClose={handleFormClose} maxWidth="md" fullWidth>
        <DialogTitle>New Submission</DialogTitle>
        <DialogContent>
          <ThinkForm isAuthenticated={true} isPublic={false} />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleFormClose}>Cancel</Button>
        </DialogActions>
      </Dialog>

      <Fab
        color="primary"
        aria-label="add"
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 16,
        }}
        onClick={() => setFormDialog(true)}
      >
        <AddIcon />
      </Fab>
    </Box>
  );
};

export default UserThinkView;