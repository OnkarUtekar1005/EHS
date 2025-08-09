import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  IconButton,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Reply as ReplyIcon,
  Visibility as ViewIcon
} from '@mui/icons-material';
import api from '../../services/api';
import { format } from 'date-fns';

const AdminThinkView = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [submissions, setSubmissions] = useState([]);
  const [filteredSubmissions, setFilteredSubmissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [responseDialog, setResponseDialog] = useState(false);
  const [viewDialog, setViewDialog] = useState(false);
  const [responseData, setResponseData] = useState({
    response: '',
    status: ''
  });
  const [alert, setAlert] = useState({ show: false, type: '', message: '' });

  const tabTypes = ['ALL', 'QUERY', 'COMPLAINT', 'NEW_IDEA'];

  useEffect(() => {
    fetchSubmissions();
  }, []);

  useEffect(() => {
    filterSubmissions();
  }, [activeTab, submissions, searchTerm]);

  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      const response = await api.get('/think/admin/all');
      setSubmissions(response.data);
    } catch (error) {
      setAlert({
        show: true,
        type: 'error',
        message: 'Failed to fetch submissions'
      });
    } finally {
      setLoading(false);
    }
  };

  const filterSubmissions = () => {
    let filtered = [...submissions];

    if (activeTab !== 0) {
      const type = tabTypes[activeTab];
      filtered = filtered.filter(sub => sub.type === type);
    }

    if (searchTerm) {
      filtered = filtered.filter(sub =>
        sub.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sub.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (sub.userName && sub.userName.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    setFilteredSubmissions(filtered);
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleViewSubmission = (submission) => {
    setSelectedSubmission(submission);
    setViewDialog(true);
  };

  const handleOpenResponse = (submission) => {
    setSelectedSubmission(submission);
    setResponseData({
      response: submission.adminResponse || '',
      status: submission.status || 'OPEN'
    });
    setResponseDialog(true);
  };

  const handleSubmitResponse = async () => {
    try {
      await api.post(
        `/think/admin/${selectedSubmission.id}/respond`,
        responseData
      );

      setAlert({
        show: true,
        type: 'success',
        message: 'Response submitted successfully'
      });

      setResponseDialog(false);
      fetchSubmissions();
    } catch (error) {
      setAlert({
        show: true,
        type: 'error',
        message: 'Failed to submit response'
      });
    }
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

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Think
      </Typography>

      <Paper sx={{ mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange} variant="fullWidth">
          <Tab label="All" />
          <Tab label="Queries" />
          <Tab label="Complaints" />
          <Tab label="New Ideas" />
        </Tabs>
      </Paper>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Search submissions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
            }}
          />
          <IconButton>
            <FilterIcon />
          </IconButton>
        </Box>
      </Paper>

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
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>User</TableCell>
                <TableCell>Query</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredSubmissions.map((submission) => (
                <TableRow key={submission.id}>
                  <TableCell>{submission.userName || 'Anonymous'}</TableCell>
                  <TableCell sx={{ maxWidth: 300 }}>
                    <Typography variant="body2" noWrap>
                      {submission.subject}
                    </Typography>
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
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <IconButton
                        size="small"
                        onClick={() => handleViewSubmission(submission)}
                      >
                        <ViewIcon />
                      </IconButton>
                      <Button
                        variant="contained"
                        size="small"
                        startIcon={<ReplyIcon />}
                        onClick={() => handleOpenResponse(submission)}
                      >
                        Respond
                      </Button>
                    </Box>
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
                Submitted By
              </Typography>
              <Typography variant="body1" gutterBottom>
                {selectedSubmission.userName || 'Anonymous'}
              </Typography>

              <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 2 }}>
                Date
              </Typography>
              <Typography variant="body1" gutterBottom>
                {format(new Date(selectedSubmission.createdAt), 'PPpp')}
              </Typography>

              {selectedSubmission.adminResponse && (
                <>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 2 }}>
                    Admin Response
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {selectedSubmission.adminResponse}
                  </Typography>
                </>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Response Dialog */}
      <Dialog open={responseDialog} onClose={() => setResponseDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Respond to Submission</DialogTitle>
        <DialogContent>
          {selectedSubmission && (
            <Box sx={{ pt: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Original Query
              </Typography>
              <Paper sx={{ p: 2, mb: 3, bgcolor: 'grey.50' }}>
                <Typography variant="body2">{selectedSubmission.description}</Typography>
              </Paper>

              <TextField
                fullWidth
                multiline
                rows={4}
                label="Your Response"
                value={responseData.response}
                onChange={(e) => setResponseData({ ...responseData, response: e.target.value })}
                sx={{ mb: 3 }}
              />

              <TextField
                select
                fullWidth
                label="Update Status"
                value={responseData.status}
                onChange={(e) => setResponseData({ ...responseData, status: e.target.value })}
              >
                <MenuItem value="OPEN">Open</MenuItem>
                <MenuItem value="IN_PROGRESS">In Progress</MenuItem>
                <MenuItem value="RESOLVED">Resolved</MenuItem>
              </TextField>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResponseDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmitResponse}>
            Submit Response
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminThinkView;