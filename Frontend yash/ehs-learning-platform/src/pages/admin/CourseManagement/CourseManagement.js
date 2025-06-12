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
  Alert,
  useTheme
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
  const theme = useTheme();
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
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
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
      // Use v2 endpoint with filters and pagination
      const params = {
        page: pagination.page,
        limit: pagination.itemsPerPage
      };
      
      // No server-side filtering needed - we'll filter client-side
      
      const response = await api.get('/v2/admin/courses', { params });
      setCourses(response.data.courses || []);
      setPagination(response.data.pagination || {
        page: 1,
        totalPages: 1,
        totalItems: 0,
        itemsPerPage: 5
      });
    } catch (error) {
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
    }
  };

  // Effect for pagination only - filters are client-side
  useEffect(() => {
    fetchCourses();
  }, [pagination.page]);

  // Fetch domains on mount
  useEffect(() => {
    fetchDomains();
  }, []);

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


  const handleDomainChange = (event) => {
    setFilters(prev => ({ ...prev, domainId: event.target.value }));
  };

  const handleStatusChange = (event) => {
    setFilters(prev => ({ ...prev, status: event.target.value }));
  };

  // Client-side filtering logic
  const filteredCourses = courses.filter(course => {
    const matchesSearch = !searchQuery || 
      course.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDomain = !filters.domainId || 
      course.domain.id === filters.domainId;
    const matchesStatus = !filters.status || 
      course.status === filters.status;
    
    return matchesSearch && matchesDomain && matchesStatus;
  });

  // Update pagination to work with filtered results
  const paginatedCourses = filteredCourses.slice(
    (pagination.page - 1) * pagination.itemsPerPage,
    pagination.page * pagination.itemsPerPage
  );

  const totalFilteredPages = Math.ceil(filteredCourses.length / pagination.itemsPerPage);

  const handlePublish = async (courseId) => {
    try {
      await api.post(`/v2/admin/courses/${courseId}/publish`);
      fetchCourses();
    } catch (error) {
    }
  };

  const handleTakeDown = async (courseId) => {
    try {
      await api.post(`/v2/admin/courses/${courseId}/takedown`);
      fetchCourses();
    } catch (error) {
    }
  };

  const handleDelete = async (courseId) => {
    if (window.confirm('Are you sure you want to delete this course?')) {
      try {
        await api.delete(`/v2/admin/courses/${courseId}`);
        fetchCourses();
      } catch (error) {
      }
    }
  };

  const handleClone = async (courseId) => {
    try {
      await api.post(`/v2/admin/courses/${courseId}/clone`);
      fetchCourses();
    } catch (error) {
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
    <Box
      sx={{
        backgroundColor: theme.palette.background.default,
        minHeight: '100vh',
        pt: { xs: 2, md: 4 },
        pb: 8,
        width: '100%'
      }}
    >
      <Container maxWidth={false} sx={{ px: { xs: 2, sm: 3, md: 4 } }}>
        {/* Header Section - Mobile Responsive */}
        <Box sx={{ 
          mb: 4, 
          textAlign: { xs: 'center', sm: 'left' }, 
          width: '100%' 
        }}>
          <Typography
            variant="h4"
            component="h1"
            sx={{
              fontWeight: 700,
              mb: 1,
              color: theme.palette.text.primary,
              fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' }
            }}
          >
            Course Management
          </Typography>
          <Typography
            variant="subtitle1"
            color="textSecondary"
            sx={{ 
              mb: 3,
              fontSize: { xs: '0.875rem', sm: '1rem' }
            }}
          >
            Create, edit, and manage courses across different domains
          </Typography>
        </Box>

        {/* Search Section */}
        <Box sx={{ 
          display: 'flex', 
          gap: { xs: 1, sm: 2 }, 
          mb: 3, 
          flexWrap: 'wrap',
          alignItems: 'center'
        }}>
          <TextField
            placeholder="Search courses by title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={{ 
              flex: 1, 
              minWidth: { xs: '100%', sm: '300px' }
            }}
            size={window.innerWidth < 600 ? "small" : "medium"}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
        </Box>

        {/* Filters Section */}
        <Box sx={{ 
          display: 'flex', 
          gap: { xs: 1.5, sm: 2 }, 
          mb: 3, 
          flexWrap: 'wrap',
          flexDirection: { xs: 'column', sm: 'row' }
        }}>

          <Box sx={{ 
            display: 'flex', 
            gap: { xs: 1.5, sm: 2 }, 
            width: { xs: '100%', sm: 'auto' },
            order: { xs: 2, sm: 2 }
          }}>
            <FormControl sx={{ 
              minWidth: { xs: 120, sm: 150 }, 
              flex: { xs: 1, sm: 'none' }
            }}>
              <InputLabel>Domain</InputLabel>
              <Select
                value={filters.domainId}
                onChange={handleDomainChange}
                label="Domain"
                size={window.innerWidth < 600 ? "small" : "medium"}
              >
                <MenuItem value="">All Domains</MenuItem>
                {domains.map(domain => (
                  <MenuItem key={domain.id} value={domain.id}>
                    {domain.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl sx={{ 
              minWidth: { xs: 100, sm: 150 }, 
              flex: { xs: 1, sm: 'none' }
            }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={filters.status}
                onChange={handleStatusChange}
                label="Status"
                size={window.innerWidth < 600 ? "small" : "medium"}
              >
                <MenuItem value="">All Status</MenuItem>
                <MenuItem value="DRAFT">Draft</MenuItem>
                <MenuItem value="PUBLISHED">Published</MenuItem>
              </Select>
            </FormControl>
          </Box>

          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpenCreateModal(true)}
            sx={{
              order: { xs: 3, sm: 3 },
              width: { xs: '100%', sm: 'auto' },
              minHeight: { xs: 48, sm: 36 }
            }}
            size={window.innerWidth < 600 ? "large" : "medium"}
          >
            New Course
          </Button>
        </Box>


        {/* Search Status */}
        {searchQuery && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Searching course titles for: <strong>"{searchQuery}"</strong>
              {filteredCourses.length > 0 && ` (${filteredCourses.length} found)`}
            </Typography>
          </Box>
        )}

        {/* Courses Display - Responsive */}
        {filteredCourses.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              {searchQuery || filters.domainId || filters.status 
                ? 'No courses match your search criteria' 
                : 'No courses found'}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {searchQuery || filters.domainId || filters.status 
                ? 'Try adjusting your search terms or filters.' 
                : 'Create your first course to get started!'}
            </Typography>
            {(!searchQuery && !filters.domainId && !filters.status) && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setOpenCreateModal(true)}
              >
                Create Course
              </Button>
            )}
          </Paper>
        ) : (
          <>
            {/* Mobile Card View */}
            <Box sx={{ display: { xs: 'block', md: 'none' }, mb: 3 }}>
              {paginatedCourses.map(course => (
                <Paper
                  key={course.id}
                  sx={{
                    p: 2,
                    mb: 2,
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 2,
                    '&:hover': {
                      borderColor: 'primary.light',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                    }
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box sx={{ flex: 1, mr: 2 }}>
                      <Typography 
                        variant="subtitle1" 
                        sx={{ 
                          fontWeight: 600,
                          fontSize: '1rem',
                          mb: 0.5
                        }}
                      >
                        {course.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem', mb: 1 }}>
                        <strong>Domain:</strong> {course.domain.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                        <strong>Components:</strong> {course.componentCount}
                      </Typography>
                    </Box>
                    <Chip
                      label={course.status}
                      color={course.status === 'PUBLISHED' ? 'success' : 'default'}
                      size="small"
                      sx={{ fontSize: '0.75rem' }}
                    />
                  </Box>
                  
                  {/* Mobile Actions */}
                  <Box sx={{ 
                    display: 'flex', 
                    gap: 1, 
                    flexWrap: 'wrap',
                    borderTop: '1px solid',
                    borderColor: 'divider',
                    pt: 2
                  }}>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<EditIcon />}
                      onClick={() => {
                        setSelectedCourseId(course.id);
                        setOpenEditModal(true);
                      }}
                      sx={{ flex: 1, minWidth: 0 }}
                    >
                      Edit
                    </Button>
                    {course.status === 'DRAFT' ? (
                      <Button
                        size="small"
                        variant="outlined"
                        color="success"
                        startIcon={<PublishIcon />}
                        onClick={() => handlePublish(course.id)}
                        sx={{ flex: 1, minWidth: 0 }}
                      >
                        Publish
                      </Button>
                    ) : (
                      <Button
                        size="small"
                        variant="outlined"
                        color="warning"
                        startIcon={<TakeDownIcon />}
                        onClick={() => handleTakeDown(course.id)}
                        sx={{ flex: 1, minWidth: 0 }}
                      >
                        Take Down
                      </Button>
                    )}
                    <IconButton
                      size="small"
                      onClick={() => handleClone(course.id)}
                      title="Clone"
                      sx={{ 
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 1
                      }}
                    >
                      <CloneIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDelete(course.id)}
                      title="Delete"
                      disabled={course.status === 'PUBLISHED'}
                      color="error"
                      sx={{ 
                        border: '1px solid',
                        borderColor: course.status === 'PUBLISHED' ? 'divider' : 'error.main',
                        borderRadius: 1
                      }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </Paper>
              ))}
            </Box>

            {/* Desktop Table View */}
            <TableContainer component={Paper} sx={{ display: { xs: 'none', md: 'block' } }}>
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
                  {paginatedCourses.map(course => (
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
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Pagination */}
            <Box sx={{ mt: 2 }}>
              <TablePagination
                component="div"
                count={filteredCourses.length}
                page={pagination.page - 1}
                onPageChange={handlePageChange}
                rowsPerPage={pagination.itemsPerPage}
                rowsPerPageOptions={[5]}
                sx={{
                  '.MuiTablePagination-toolbar': {
                    flexDirection: { xs: 'column', sm: 'row' },
                    gap: { xs: 1, sm: 0 }
                  },
                  '.MuiTablePagination-spacer': {
                    display: { xs: 'none', sm: 'flex' }
                  },
                  '.MuiTablePagination-selectLabel, .MuiTablePagination-displayedRows': {
                    fontSize: { xs: '0.75rem', sm: '0.875rem' }
                  }
                }}
              />
            </Box>
          </>
        )}

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
    </Box>
  );
};

export default CourseManagement;