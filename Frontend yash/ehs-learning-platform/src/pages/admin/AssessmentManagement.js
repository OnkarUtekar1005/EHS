import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Container,
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tooltip,
  Alert,
  Snackbar,
  Pagination
} from '@mui/material';
import {
  Refresh as ResetIcon,
  CheckCircle as PassIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import api, { assessmentService, courseService, domainService } from '../../services/api';

const AssessmentManagement = () => {
  // State variables
  const [attempts, setAttempts] = useState([]);
  const [summary, setSummary] = useState(null);
  const [domains, setDomains] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pageInfo, setPageInfo] = useState({
    totalItems: 0,
    totalPages: 0,
    currentPage: 0
  });
  
  // Filter states
  const [filters, setFilters] = useState({
    status: '',
    domainId: '',
    courseId: '',
    userId: '',
    search: '',
    page: 0,
    size: 10
  });
  
  // Modal states
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [passModalOpen, setPassModalOpen] = useState(false);
  const [selectedAttempt, setSelectedAttempt] = useState(null);
  const [manualScore, setManualScore] = useState(70);
  
  // Snackbar state
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  
  // Fetch initial data
  useEffect(() => {
    fetchData();
    fetchDomains();
    fetchCourses();
  }, []);
  
  // Fetch data when filters change
  useEffect(() => {
    fetchData();
  }, [filters.page, filters.size]);
  
  const fetchData = async () => {
    setLoading(true);
    try {
      // Create filter params, removing empty values
      const params = {};
      Object.keys(filters).forEach(key => {
        if (filters[key] !== '' && key !== 'search') {
          params[key] = filters[key];
        }
      });
      
      // Search applied to username, email, or component title
      if (filters.search) {
        // Handle search on frontend since backend doesn't have this feature yet
      }
      
      try {
        // Try to get the real data if backend is available
        const [attemptsResponse, summaryResponse] = await Promise.all([
          assessmentService.admin.getAttempts(params),
          assessmentService.admin.getSummary()
        ]);
        
        setAttempts(attemptsResponse.data.attempts);
        setPageInfo({
          totalItems: attemptsResponse.data.totalItems,
          totalPages: attemptsResponse.data.totalPages,
          currentPage: attemptsResponse.data.currentPage
        });
        setSummary(summaryResponse.data);
      } catch (apiError) {
        console.warn('Backend API not available yet, using mock data');
        
        // Use mock data while backend is being set up
        setAttempts([]);
        setPageInfo({
          totalItems: 0,
          totalPages: 1,
          currentPage: 0
        });
        setSummary({
          totalAttempts: 0,
          passedAttempts: 0,
          failedAttempts: 0,
          topFailingComponents: []
        });
      }
      
      setError(null);
    } catch (err) {
      console.error('Error fetching assessment data:', err);
      setError('Failed to load assessment data. The backend endpoints for assessment management may not be deployed yet.');
    } finally {
      setLoading(false);
    }
  };
  
  const fetchDomains = async () => {
    try {
      const response = await domainService.getAll();
      // Make sure response.data is an array
      if (Array.isArray(response.data)) {
        setDomains(response.data);
      } else if (response.data && Array.isArray(response.data.content)) {
        // Handle pagination response format
        setDomains(response.data.content);
      } else {
        // Default to empty array if no valid data
        console.warn('Domains data is not in expected format:', response.data);
        setDomains([]);
      }
    } catch (err) {
      console.error('Error fetching domains:', err);
      setDomains([]);
    }
  };
  
  const fetchCourses = async () => {
    try {
      const response = await courseService.getAllCourses();
      // Make sure response.data is an array
      if (Array.isArray(response.data)) {
        setCourses(response.data);
      } else if (response.data && Array.isArray(response.data.content)) {
        // Handle pagination response format
        setCourses(response.data.content);
      } else {
        // Default to empty array if no valid data
        console.warn('Courses data is not in expected format:', response.data);
        setCourses([]);
      }
    } catch (err) {
      console.error('Error fetching courses:', err);
      setCourses([]);
    }
  };
  
  // Handle filter changes
  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters({
      ...filters,
      [name]: value,
      page: 0 // Reset to first page on filter change
    });
  };
  
  // Apply filters
  const applyFilters = () => {
    fetchData();
  };
  
  // Reset filters
  const resetFilters = () => {
    setFilters({
      status: '',
      domainId: '',
      courseId: '',
      userId: '',
      search: '',
      page: 0,
      size: 10
    });
  };
  
  // Handle page change
  const handlePageChange = (event, newPage) => {
    setFilters({
      ...filters,
      page: newPage - 1 // Adjust for 0-based indexing
    });
  };
  
  // Open reset modal
  const openResetModal = (attempt) => {
    setSelectedAttempt(attempt);
    setResetModalOpen(true);
  };
  
  // Open pass modal
  const openPassModal = (attempt) => {
    setSelectedAttempt(attempt);
    setManualScore(70); // Default score
    setPassModalOpen(true);
  };
  
  // Handle reset attempts
  const handleResetAttempts = async () => {
    try {
      try {
        await assessmentService.admin.resetAttempts(
          selectedAttempt.componentId,
          selectedAttempt.userId
        );
        
        setSnackbar({
          open: true,
          message: 'Assessment attempts have been reset successfully',
          severity: 'success'
        });
      } catch (apiErr) {
        // If the endpoint is not available yet
        console.warn('Backend API not available yet:', apiErr);
        setSnackbar({
          open: true,
          message: 'This feature is not available yet. The backend endpoints need to be deployed first.',
          severity: 'warning'
        });
      }
      
      // Close modal and refresh data
      setResetModalOpen(false);
      fetchData();
    } catch (err) {
      console.error('Error resetting attempts:', err);
      
      setSnackbar({
        open: true,
        message: 'Failed to reset attempts: ' + (err.response?.data?.message || err.message),
        severity: 'error'
      });
    }
  };
  
  // Handle mark as passed
  const handleMarkAsPassed = async () => {
    try {
      try {
        await assessmentService.admin.markAsPassed(
          selectedAttempt.componentId,
          selectedAttempt.userId,
          manualScore
        );
        
        setSnackbar({
          open: true,
          message: 'Assessment has been marked as passed successfully',
          severity: 'success'
        });
      } catch (apiErr) {
        // If the endpoint is not available yet
        console.warn('Backend API not available yet:', apiErr);
        setSnackbar({
          open: true,
          message: 'This feature is not available yet. The backend endpoints need to be deployed first.',
          severity: 'warning'
        });
      }
      
      // Close modal and refresh data
      setPassModalOpen(false);
      fetchData();
    } catch (err) {
      console.error('Error marking as passed:', err);
      
      setSnackbar({
        open: true,
        message: 'Failed to mark as passed: ' + (err.response?.data?.message || err.message),
        severity: 'error'
      });
    }
  };
  
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Assessment Management
      </Typography>
      
      <Alert severity="info" sx={{ mb: 3 }}>
        This feature is under development. Some functionality may be limited until the backend endpoints are fully deployed.
      </Alert>
      
      {/* Summary Cards */}
      {summary && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Total Attempts</Typography>
                <Typography variant="h3" color="primary">
                  {summary.totalAttempts}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Passed</Typography>
                <Typography variant="h3" color="success.main">
                  {summary.passedAttempts}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {summary.totalAttempts > 0 
                    ? `${Math.round((summary.passedAttempts / summary.totalAttempts) * 100)}%`
                    : '0%'
                  }
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Failed (Max Attempts)
                </Typography>
                <Typography variant="h3" color="error.main">
                  {summary.failedAttempts}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {summary.totalAttempts > 0 
                    ? `${Math.round((summary.failedAttempts / summary.totalAttempts) * 100)}%`
                    : '0%'
                  }
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
      
      {/* Filters */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Filters
        </Typography>
        
        <Grid container spacing={2}>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                name="status"
                value={filters.status}
                onChange={handleFilterChange}
                label="Status"
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="PASSED">Passed</MenuItem>
                <MenuItem value="FAILED">
                  <Tooltip title="Users who have exhausted all 3 attempts without passing" arrow>
                    <span>Failed (Max Attempts)</span>
                  </Tooltip>
                </MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Domain</InputLabel>
              <Select
                name="domainId"
                value={filters.domainId}
                onChange={handleFilterChange}
                label="Domain"
              >
                <MenuItem value="">All</MenuItem>
                {Array.isArray(domains) && domains.map((domain) => (
                  <MenuItem key={domain.id} value={domain.id}>
                    {domain.name || 'Untitled Domain'}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Course</InputLabel>
              <Select
                name="courseId"
                value={filters.courseId}
                onChange={handleFilterChange}
                label="Course"
              >
                <MenuItem value="">All</MenuItem>
                {Array.isArray(courses) && courses.map((course) => (
                  <MenuItem key={course.id} value={course.id}>
                    {course.title || 'Untitled Course'}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              label="Search"
              name="search"
              value={filters.search}
              onChange={handleFilterChange}
              placeholder="User or component name"
              InputProps={{
                endAdornment: <SearchIcon color="action" />
              }}
            />
          </Grid>
          
          <Grid item xs={12}>
            <Box display="flex" justifyContent="flex-end" gap={2}>
              <Button
                variant="outlined"
                onClick={resetFilters}
              >
                Reset Filters
              </Button>
              <Button
                variant="contained"
                onClick={applyFilters}
              >
                Apply Filters
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>
      
      {/* Assessment Attempts Table */}
      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <TableContainer sx={{ maxHeight: 440 }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>User</TableCell>
                <TableCell>Component</TableCell>
                <TableCell>Course</TableCell>
                <TableCell>Domain</TableCell>
                <TableCell>Attempt</TableCell>
                <TableCell>Score</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} align="center">
                    <CircularProgress size={30} />
                  </TableCell>
                </TableRow>
              ) : attempts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center">
                    No assessment attempts found
                  </TableCell>
                </TableRow>
              ) : (
                attempts.map((attempt) => (
                  <TableRow 
                    key={attempt.id}
                    sx={{
                      backgroundColor: attempt.passed ? 'rgba(76, 175, 80, 0.08)' : 
                                      (attempt.score !== null && !attempt.passed) ? 'rgba(244, 67, 54, 0.08)' : 
                                      attempt.progressStatus === 'COMPLETED' ? 'rgba(76, 175, 80, 0.08)' :
                                      attempt.progressStatus === 'FAILED' ? 'rgba(244, 67, 54, 0.08)' :
                                      'transparent'
                    }}
                  >
                    <TableCell>
                      <Typography variant="body2">{attempt.username}</Typography>
                      <Typography variant="caption" color="text.secondary">{attempt.email}</Typography>
                    </TableCell>
                    <TableCell>{attempt.componentTitle || 'N/A'}</TableCell>
                    <TableCell>{attempt.courseTitle || 'N/A'}</TableCell>
                    <TableCell>{attempt.domainName || 'N/A'}</TableCell>
                    <TableCell>
                      {attempt.passed ? (
                        <Typography variant="body2" color="success.main">
                          Passed ({attempt.attemptNumber}/3)
                        </Typography>
                      ) : attempt.remainingAttempts === 0 ? (
                        <Typography variant="body2" color="error.main">
                          Exhausted (3/3)
                        </Typography>
                      ) : (
                        <Typography variant="body2">
                          {attempt.attemptNumber}/3 ({attempt.remainingAttempts} left)
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      {attempt.score !== null ? `${attempt.score}%` : 
                       attempt.progressScore !== null ? `${attempt.progressScore}%` :
                       'Incomplete'}
                    </TableCell>
                    <TableCell>
                      {attempt.submittedAt ? (
                        attempt.passed ? (
                          <Chip label="Passed" color="success" size="small" />
                        ) : (
                          <Chip label="Failed" color="error" size="small" />
                        )
                      ) : attempt.progressStatus === 'COMPLETED' ? (
                        <Chip label="Completed" color="success" size="small" />
                      ) : attempt.progressStatus === 'FAILED' ? (
                        <Chip label="Failed" color="error" size="small" />
                      ) : attempt.progressStatus === 'IN_PROGRESS' ? (
                        <Chip label="In Progress" color="warning" size="small" />
                      ) : (
                        <Chip label="Not Started" color="default" size="small" />
                      )}
                    </TableCell>
                    <TableCell>
                      {attempt.submittedAt ? 
                        new Date(attempt.submittedAt).toLocaleString() : 
                        new Date(attempt.startedAt).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Box display="flex" gap={1}>
                        {attempt.canAdminIntervene ? (
                          <>
                            <Tooltip title="Reset Attempts">
                              <IconButton 
                                size="small" 
                                color="warning"
                                onClick={() => openResetModal(attempt)}
                              >
                                <ResetIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Mark as Passed">
                              <IconButton 
                                size="small" 
                                color="success"
                                onClick={() => openPassModal(attempt)}
                              >
                                <PassIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </>
                        ) : (
                          <Typography variant="caption" color="text.secondary">
                            {attempt.passed ? 'Passed' : 
                             attempt.remainingAttempts > 0 ? `${attempt.remainingAttempts} attempts left` : 
                             'No actions available'}
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        
        {/* Pagination */}
        <Box display="flex" justifyContent="center" p={2}>
          <Pagination
            count={pageInfo.totalPages}
            page={pageInfo.currentPage + 1}
            onChange={handlePageChange}
            color="primary"
          />
        </Box>
      </Paper>
      
      {/* Reset Attempts Modal */}
      <Dialog open={resetModalOpen} onClose={() => setResetModalOpen(false)}>
        <DialogTitle>Reset Assessment Attempts</DialogTitle>
        <DialogContent>
          <Typography paragraph>
            Are you sure you want to reset all attempts for:
          </Typography>
          {selectedAttempt && (
            <>
              <Typography><strong>User:</strong> {selectedAttempt.username}</Typography>
              <Typography><strong>Component:</strong> {selectedAttempt.componentTitle}</Typography>
              <Typography><strong>Course:</strong> {selectedAttempt.courseTitle}</Typography>
            </>
          )}
          <Typography paragraph color="warning.main" sx={{ mt: 2 }}>
            This action will delete all existing attempts and reset the progress status.
            It cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResetModalOpen(false)}>Cancel</Button>
          <Button 
            variant="contained" 
            color="warning"
            onClick={handleResetAttempts}
          >
            Reset Attempts
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Mark as Passed Modal */}
      <Dialog open={passModalOpen} onClose={() => setPassModalOpen(false)}>
        <DialogTitle>Mark Assessment as Passed</DialogTitle>
        <DialogContent>
          <Typography paragraph>
            You are about to manually mark this assessment as passed:
          </Typography>
          {selectedAttempt && (
            <>
              <Typography><strong>User:</strong> {selectedAttempt.username}</Typography>
              <Typography><strong>Component:</strong> {selectedAttempt.componentTitle}</Typography>
              <Typography><strong>Course:</strong> {selectedAttempt.courseTitle}</Typography>
            </>
          )}
          <Box mt={3}>
            <TextField
              label="Score (%)"
              type="number"
              fullWidth
              value={manualScore}
              onChange={(e) => setManualScore(parseInt(e.target.value, 10))}
              inputProps={{ min: 0, max: 100 }}
              helperText="Enter a score between 0 and 100"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPassModalOpen(false)}>Cancel</Button>
          <Button 
            variant="contained" 
            color="success"
            onClick={handleMarkAsPassed}
          >
            Mark as Passed
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default AssessmentManagement;