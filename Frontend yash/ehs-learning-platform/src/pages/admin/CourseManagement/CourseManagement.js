import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Grid,
  IconButton,
  InputAdornment,
  MenuItem,
  Pagination,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  CircularProgress
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Publish as PublishIcon,
  Unpublished as UnpublishedIcon,
  FileCopy as CloneIcon
} from '@mui/icons-material';
import AdminLayout from '../../../components/layout/AdminLayout';
import { domainService } from '../../../services/api';
import { moduleService } from '../../../services/moduleService';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';

const CourseManagement = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [domains, setDomains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Pagination state
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const rowsPerPage = 5;
  
  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDomain, setSelectedDomain] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  useEffect(() => {
    // Load domains for filter
    const fetchDomains = async () => {
      try {
        const response = await domainService.getAll();
        setDomains(response.data);
      } catch (err) {
        console.error('Error fetching domains:', err);
      }
    };

    fetchDomains();
  }, []);

  useEffect(() => {
    // Load courses with pagination and filters
    const fetchCourses = async () => {
      setLoading(true);
      try {
        const response = await moduleService.getAllModules(
          page - 1,
          rowsPerPage,
          searchQuery,
          selectedDomain,
          selectedStatus
        );
        
        setCourses(response.data.modules);
        setTotalPages(response.data.totalPages);
        setTotalItems(response.data.totalItems);
        setError(null);
      } catch (err) {
        console.error('Error fetching courses:', err);
        setError('Failed to load courses. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, [page, searchQuery, selectedDomain, selectedStatus]);

  const handlePageChange = (event, value) => {
    setPage(value);
  };

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
    setPage(1); // Reset to first page on new search
  };

  const handleDomainChange = (event) => {
    setSelectedDomain(event.target.value);
    setPage(1); // Reset to first page on filter change
  };

  const handleStatusChange = (event) => {
    setSelectedStatus(event.target.value);
    setPage(1); // Reset to first page on filter change
  };

  const handleCreateCourse = () => {
    navigate('/admin/courses/create');
  };
  
  const handleEditCourse = (courseId) => {
    navigate(`/admin/courses/edit/${courseId}`);
  };
  
  const handlePublishCourse = async (courseId, isPublished) => {
    try {
      if (isPublished) {
        await moduleService.archiveModule(courseId);
      } else {
        await moduleService.publishModule(courseId);
      }
      
      // Reload current page
      const updatedPage = await moduleService.getAllModules(page - 1, rowsPerPage);
      setCourses(updatedPage.data.modules);
    } catch (err) {
      console.error('Error updating course status:', err);
      setError(err.response?.data?.message || 'Failed to update course status');
    }
  };
  
  const handleDeleteCourse = async (courseId) => {
    if (window.confirm('Are you sure you want to delete this course?')) {
      try {
        await moduleService.deleteModule(courseId);
        
        // Reload current page
        const updatedPage = await moduleService.getAllModules(page - 1, rowsPerPage);
        setCourses(updatedPage.data.modules);
        
        // If deleting the last item on a page, go to previous page
        if (courses.length === 1 && page > 1) {
          setPage(page - 1);
        }
      } catch (err) {
        console.error('Error deleting course:', err);
        setError(err.response?.data?.message || 'Failed to delete course');
      }
    }
  };
  
  const handleCloneCourse = async (courseId) => {
    try {
      await moduleService.cloneModule(courseId);
      
      // Reload current page
      const updatedPage = await moduleService.getAllModules(page - 1, rowsPerPage);
      setCourses(updatedPage.data.modules);
    } catch (err) {
      console.error('Error cloning course:', err);
      setError(err.response?.data?.message || 'Failed to clone course');
    }
  };

  return (
    <AdminLayout>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
              <Typography variant="h4" component="h1" gutterBottom>
                Course Management
              </Typography>
              <Button 
                variant="contained" 
                color="primary" 
                startIcon={<AddIcon />}
                onClick={handleCreateCourse}
              >
                Create Course
              </Button>
            </Box>
          </Grid>
          
          {/* Filters */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="Search Courses"
                      value={searchQuery}
                      onChange={handleSearchChange}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <SearchIcon />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <TextField
                      select
                      fullWidth
                      label="Domain"
                      value={selectedDomain}
                      onChange={handleDomainChange}
                    >
                      <MenuItem value="">All Domains</MenuItem>
                      {domains.map((domain) => (
                        <MenuItem key={domain.id} value={domain.id}>
                          {domain.name}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <TextField
                      select
                      fullWidth
                      label="Status"
                      value={selectedStatus}
                      onChange={handleStatusChange}
                    >
                      <MenuItem value="">All Statuses</MenuItem>
                      <MenuItem value="DRAFT">Draft</MenuItem>
                      <MenuItem value="PUBLISHED">Published</MenuItem>
                      <MenuItem value="ARCHIVED">Archived</MenuItem>
                    </TextField>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
          
          {/* Courses Table */}
          <Grid item xs={12}>
            <Paper sx={{ width: '100%', overflow: 'hidden' }}>
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                  <CircularProgress />
                </Box>
              ) : error ? (
                <Box sx={{ p: 3, color: 'error.main' }}>
                  <Typography>{error}</Typography>
                </Box>
              ) : courses.length === 0 ? (
                <Box sx={{ p: 3 }}>
                  <Typography>No courses found</Typography>
                </Box>
              ) : (
                <TableContainer>
                  <Table stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell>Title</TableCell>
                        <TableCell>Domain</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Created</TableCell>
                        <TableCell align="right">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {courses.map((course) => (
                        <TableRow key={course.id} hover>
                          <TableCell>{course.title}</TableCell>
                          <TableCell>{course.domain?.name}</TableCell>
                          <TableCell>
                            {course.status === 'PUBLISHED' ? (
                              <Box sx={{ color: 'success.main', display: 'flex', alignItems: 'center' }}>
                                <PublishIcon fontSize="small" sx={{ mr: 1 }} />
                                Published
                              </Box>
                            ) : course.status === 'DRAFT' ? (
                              <Box sx={{ color: 'text.secondary', display: 'flex', alignItems: 'center' }}>
                                <UnpublishedIcon fontSize="small" sx={{ mr: 1 }} />
                                Draft
                              </Box>
                            ) : (
                              <Box sx={{ color: 'warning.main', display: 'flex', alignItems: 'center' }}>
                                <UnpublishedIcon fontSize="small" sx={{ mr: 1 }} />
                                Archived
                              </Box>
                            )}
                          </TableCell>
                          <TableCell>
                            {course.createdAt ? formatDistanceToNow(new Date(course.createdAt), { addSuffix: true }) : 'Unknown'}
                          </TableCell>
                          <TableCell align="right">
                            <IconButton 
                              color="primary" 
                              onClick={() => handleEditCourse(course.id)}
                              title="Edit course"
                              disabled={course.status === 'PUBLISHED'}
                            >
                              <EditIcon />
                            </IconButton>
                            
                            <IconButton 
                              color={course.status === 'PUBLISHED' ? 'warning' : 'success'} 
                              onClick={() => handlePublishCourse(course.id, course.status === 'PUBLISHED')}
                              title={course.status === 'PUBLISHED' ? 'Unpublish course' : 'Publish course'}
                            >
                              {course.status === 'PUBLISHED' ? <UnpublishedIcon /> : <PublishIcon />}
                            </IconButton>
                            
                            <IconButton 
                              color="info" 
                              onClick={() => handleCloneCourse(course.id)}
                              title="Clone course"
                            >
                              <CloneIcon />
                            </IconButton>
                            
                            <IconButton 
                              color="error" 
                              onClick={() => handleDeleteCourse(course.id)}
                              title="Delete course"
                              disabled={course.status === 'PUBLISHED'}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  p: 2,
                }}
              >
                <Pagination
                  count={totalPages}
                  page={page}
                  onChange={handlePageChange}
                  color="primary"
                />
              </Box>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  p: 2,
                  borderTop: '1px solid rgba(0, 0, 0, 0.12)',
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  Total {totalItems} courses
                </Typography>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </AdminLayout>
  );
};

export default CourseManagement;