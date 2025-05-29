import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  TextField,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  IconButton,
  Chip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  InputAdornment,
  Snackbar,
  Alert
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Publish as PublishIcon,
  CloudOff as TakeDownIcon,
  ContentCopy as CloneIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import api from '../../../services/api';
import CreateCourseModal from './CourseModal/CreateCourseModal';
import EditCourseModal from './CourseModal/EditCourseModal';

const CourseManagement = () => {
  const location = useLocation();
  const [courses, setCourses] = useState([]);
  const [domains, setDomains] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 5
  });
  const [filters, setFilters] = useState({
    search: '',
    domainId: '',
    status: ''
  });
  const [openCreateModal, setOpenCreateModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  // Fetch courses
  const fetchCourses = async () => {
    setLoading(true);
    try {
      // Use v2 endpoint which avoids the problematic query
      const params = {
        page: pagination.page,
        limit: pagination.itemsPerPage
      };
      
      const response = await api.get('/v2/admin/courses', { params });
      console.log('Course response:', response.data);
      setCourses(response.data.courses || []);
      setPagination(response.data.pagination || {
        page: 1,
        totalPages: 1,
        totalItems: 0,
        itemsPerPage: 5
      });
    } catch (error) {
      console.error('Error fetching courses:', error);
      setCourses([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch domains for filter
  const fetchDomains = async () => {
    try {
      const response = await api.get('/domains');
      setDomains(response.data);
    } catch (error) {
      console.error('Error fetching domains:', error);
    }
  };

  useEffect(() => {
    fetchCourses();
    fetchDomains();
  }, [pagination.page, filters]);

  // Check for quick action state to auto-open create modal
  useEffect(() => {
    if (location.state?.openCreateModal) {
      setOpenCreateModal(true);
      // Clear the state to prevent reopening on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  const handlePageChange = (event, newPage) => {
    setPagination(prev => ({ ...prev, page: newPage + 1 }));
  };

  const handleSearchChange = (event) => {
    setFilters(prev => ({ ...prev, search: event.target.value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleDomainChange = (event) => {
    setFilters(prev => ({ ...prev, domainId: event.target.value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleStatusChange = (event) => {
    setFilters(prev => ({ ...prev, status: event.target.value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handlePublish = async (courseId) => {
    try {
      await api.post(`/v2/admin/courses/${courseId}/publish`);
      fetchCourses();
    } catch (error) {
      console.error('Error publishing course:', error);
      console.error('Error response:', error.response?.data);
      alert(error.response?.data?.message || 'Error publishing course');
    }
  };

  const handleTakeDown = async (courseId) => {
    try {
      await api.post(`/v2/admin/courses/${courseId}/takedown`);
      fetchCourses();
    } catch (error) {
      console.error('Error taking down course:', error);
    }
  };

  const handleDelete = async (courseId) => {
    if (window.confirm('Are you sure you want to delete this course?')) {
      try {
        await api.delete(`/v2/admin/courses/${courseId}`);
        fetchCourses();
      } catch (error) {
        console.error('Error deleting course:', error);
      }
    }
  };

  const handleClone = async (courseId) => {
    try {
      await api.post(`/v2/admin/courses/${courseId}/clone`);
      fetchCourses();
    } catch (error) {
      console.error('Error cloning course:', error);
    }
  };

  const handleCreateSuccess = (newCourse) => {
    fetchCourses();
    setSnackbar({
      open: true,
      message: 'Course created successfully! Opening course editor to add components...',
      severity: 'success'
    });
    // Automatically open the edit modal to add components
    setTimeout(() => {
      setSelectedCourseId(newCourse.id);
      setOpenEditModal(true);
    }, 500);
  };

  const handleSnackbarClose = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  return (
    <Container>
      <Box sx={{ py: 4 }}>
        <Typography variant="h4" gutterBottom>
          Course Management
        </Typography>

        {/* Filters Section */}
        <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
          <TextField
            placeholder="Search courses..."
            value={filters.search}
            onChange={handleSearchChange}
            sx={{ flex: 1, minWidth: '300px' }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />

          <FormControl sx={{ minWidth: 150 }}>
            <InputLabel>Domain</InputLabel>
            <Select
              value={filters.domainId}
              onChange={handleDomainChange}
              label="Domain"
            >
              <MenuItem value="">All Domains</MenuItem>
              {domains.map(domain => (
                <MenuItem key={domain.id} value={domain.id}>
                  {domain.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl sx={{ minWidth: 150 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={filters.status}
              onChange={handleStatusChange}
              label="Status"
            >
              <MenuItem value="">All Status</MenuItem>
              <MenuItem value="DRAFT">Draft</MenuItem>
              <MenuItem value="PUBLISHED">Published</MenuItem>
            </Select>
          </FormControl>

          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpenCreateModal(true)}
          >
            New Course
          </Button>
        </Box>

        {/* Courses Table */}
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Title</TableCell>
                <TableCell>Domain</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Components</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {courses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    No courses found. Create your first course!
                  </TableCell>
                </TableRow>
              ) : (
                courses.map(course => (
                  <TableRow key={course.id}>
                  <TableCell>{course.title}</TableCell>
                  <TableCell>{course.domain.name}</TableCell>
                  <TableCell>
                    <Chip
                      label={course.status}
                      color={course.status === 'PUBLISHED' ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{course.componentCount}</TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      onClick={() => {
                        setSelectedCourseId(course.id);
                        setOpenEditModal(true);
                      }}
                      title="Edit"
                    >
                      <EditIcon />
                    </IconButton>
                    {course.status === 'DRAFT' ? (
                      <IconButton
                        size="small"
                        onClick={() => handlePublish(course.id)}
                        title="Publish"
                      >
                        <PublishIcon />
                      </IconButton>
                    ) : (
                      <IconButton
                        size="small"
                        onClick={() => handleTakeDown(course.id)}
                        title="Take Down"
                      >
                        <TakeDownIcon />
                      </IconButton>
                    )}
                    <IconButton
                      size="small"
                      onClick={() => handleDelete(course.id)}
                      title="Delete"
                      disabled={course.status === 'PUBLISHED'}
                    >
                      <DeleteIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleClone(course.id)}
                      title="Clone"
                    >
                      <CloneIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          <TablePagination
            component="div"
            count={pagination.totalItems}
            page={pagination.page - 1}
            onPageChange={handlePageChange}
            rowsPerPage={pagination.itemsPerPage}
            rowsPerPageOptions={[5]}
          />
        </TableContainer>
      </Box>

      {/* Create Course Modal */}
      <CreateCourseModal
        open={openCreateModal}
        onClose={() => setOpenCreateModal(false)}
        onSuccess={handleCreateSuccess}
      />

      {/* Edit Course Modal */}
      <EditCourseModal
        open={openEditModal}
        onClose={() => {
          setOpenEditModal(false);
          setSelectedCourseId(null);
        }}
        courseId={selectedCourseId}
        onSuccess={(updatedCourse) => {
          fetchCourses();
          setSnackbar({
            open: true,
            message: 'Course updated successfully!',
            severity: 'success'
          });
        }}
      />

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default CourseManagement;