// src/pages/admin/ModuleManagement.js
import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Paper,
  Button,
  TextField,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Pagination,
  CircularProgress,
  Alert,
  Chip
} from '@mui/material';
import {
  Edit as EditIcon,
  MoreVert as MoreVertIcon,
  Add as AddIcon,
  Search as SearchIcon,
  Publish as PublishIcon,
  Archive as ArchiveIcon,
  FileCopy as CloneIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { Link, useNavigate } from 'react-router-dom';
import { moduleService, domainService } from '../../../services/api';

const ModuleManagement = () => {
  const navigate = useNavigate();
  
  // State
  const [searchTerm, setSearchTerm] = useState('');
  const [domainFilter, setDomainFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [modules, setModules] = useState([]);
  const [domains, setDomains] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  
  // Load modules on component mount and when filters change
  useEffect(() => {
    fetchModules();
    fetchDomains();
  }, [page, statusFilter, domainFilter]);
  
  // Fetch modules from API
  const fetchModules = async () => {
    try {
      setLoading(true);
      
      // Prepare query parameters
      const params = {
        page: page - 1,  // API usually uses 0-indexed pages
        size: itemsPerPage
      };
      
      if (searchTerm) params.title = searchTerm;
      if (domainFilter) params.domainId = domainFilter;
      if (statusFilter) params.status = statusFilter;
      
      const response = await moduleService.getAll(params);
      
      // Check if headers are available for pagination info
      if (response.headers && response.headers['x-total-elements']) {
        setTotalItems(parseInt(response.headers['x-total-elements'], 10));
        setTotalPages(parseInt(response.headers['x-total-pages'], 10));
      }
      
      setModules(response.data);
    } catch (err) {
      console.error('Error fetching modules:', err);
      setError('Failed to load modules');
      
      // Use mock data if API fails (for development)
      setModules([
        { id: '1', title: 'Fire Safety', domain: {name: 'Safety'}, status: 'PUBLISHED' },
        { id: '2', title: 'OSHA Guide', domain: {name: 'Compliance'}, status: 'DRAFT' },
        { id: '3', title: 'First Aid', domain: {name: 'Medical'}, status: 'PUBLISHED' },
        { id: '4', title: 'PPE Usage', domain: {name: 'Safety'}, status: 'REVIEW' },
        { id: '5', title: 'Chemical Handling', domain: {name: 'HazMat'}, status: 'PUBLISHED' }
      ]);
      setTotalItems(5);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch domains for filter
  const fetchDomains = async () => {
    try {
      const response = await domainService.getAll();
      setDomains(response.data);
    } catch (err) {
      console.error('Error fetching domains:', err);
      // Set some mock domains if API fails
      setDomains([
        { id: '1', name: 'Safety' },
        { id: '2', name: 'Compliance' },
        { id: '3', name: 'Medical' },
        { id: '4', name: 'HazMat' }
      ]);
    }
  };
  
  // Handle search - This filters immediately rather than waiting for API
  const handleSearch = () => {
    // Reset to page 1 when search changes
    setPage(1);
    fetchModules();
  };
  
  // Handle filter changes
  const handleDomainChange = (e) => {
    setDomainFilter(e.target.value);
    setPage(1);
  };
  
  const handleStatusChange = (e) => {
    setStatusFilter(e.target.value);
    setPage(1);
  };
  
  // Handle pagination
  const handlePageChange = (event, value) => {
    setPage(value);
  };
  
  // Action handlers
  const handlePublish = async (moduleId) => {
    try {
      await moduleService.publish(moduleId);
      // Refresh the module list
      fetchModules();
    } catch (err) {
      console.error('Error publishing module:', err);
      setError('Failed to publish module');
    }
  };
  
  const handleArchive = async (moduleId) => {
    try {
      await moduleService.archive(moduleId);
      // Refresh the module list
      fetchModules();
    } catch (err) {
      console.error('Error archiving module:', err);
      setError('Failed to archive module');
    }
  };
  
  const handleClone = async (moduleId) => {
    try {
      const response = await moduleService.clone(moduleId);
      // Navigate to edit the cloned module
      navigate(`/admin/modules/edit/${response.data.id}`);
    } catch (err) {
      console.error('Error cloning module:', err);
      setError('Failed to clone module');
    }
  };
  
  const handleDelete = async (moduleId) => {
    if (window.confirm('Are you sure you want to delete this module? This action cannot be undone.')) {
      try {
        await moduleService.delete(moduleId);
        // Refresh the module list
        fetchModules();
      } catch (err) {
        console.error('Error deleting module:', err);
        setError('Failed to delete module');
      }
    }
  };
  
  // Helper function to get status chip color
  const getStatusColor = (status) => {
    switch (status) {
      case 'PUBLISHED':
        return 'success';
      case 'DRAFT':
        return 'default';
      case 'REVIEW':
        return 'warning';
      case 'ARCHIVED':
        return 'error';
      default:
        return 'default';
    }
  };
  
  // Create new module
  const handleCreateModule = () => {
    navigate('/admin/modules/create');
  };
  
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Modules</Typography>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />}
          onClick={handleCreateModule}
        >
          New Module
        </Button>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}
      
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box display="flex" flexWrap="wrap" gap={2} mb={2}>
          <TextField
            label="Search Modules"
            variant="outlined"
            size="small"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            InputProps={{
              endAdornment: (
                <IconButton size="small" onClick={handleSearch}>
                  <SearchIcon />
                </IconButton>
              )
            }}
            sx={{ flexGrow: 1, minWidth: '200px' }}
          />
          
          <FormControl size="small" sx={{ minWidth: '150px' }}>
            <InputLabel>Domain</InputLabel>
            <Select
              value={domainFilter}
              label="Domain"
              onChange={handleDomainChange}
            >
              <MenuItem value="">All Domains</MenuItem>
              {domains.map(domain => (
                <MenuItem key={domain.id} value={domain.id}>
                  {domain.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <FormControl size="small" sx={{ minWidth: '150px' }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={statusFilter}
              label="Status"
              onChange={handleStatusChange}
            >
              <MenuItem value="">All Status</MenuItem>
              <MenuItem value="PUBLISHED">Published</MenuItem>
              <MenuItem value="DRAFT">Draft</MenuItem>
              <MenuItem value="REVIEW">Review</MenuItem>
              <MenuItem value="ARCHIVED">Archived</MenuItem>
            </Select>
          </FormControl>
        </Box>
        
        {loading ? (
          <Box display="flex" justifyContent="center" my={4}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Title</TableCell>
                    <TableCell>Domain</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {modules.map((module) => (
                    <TableRow key={module.id}>
                      <TableCell>{module.title}</TableCell>
                      <TableCell>{module.domain?.name}</TableCell>
                      <TableCell>
                        <Chip 
                          label={module.status} 
                          color={getStatusColor(module.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="right">
                        <IconButton 
                          size="small" 
                          component={Link} 
                          to={`/admin/modules/edit/${module.id}`}
                          title="Edit Module"
                        >
                          <EditIcon />
                        </IconButton>
                        
                        {module.status === 'DRAFT' || module.status === 'REVIEW' ? (
                          <IconButton 
                            size="small" 
                            onClick={() => handlePublish(module.id)}
                            title="Publish Module"
                          >
                            <PublishIcon />
                          </IconButton>
                        ) : null}
                        
                        {module.status === 'PUBLISHED' ? (
                          <IconButton 
                            size="small" 
                            onClick={() => handleArchive(module.id)}
                            title="Archive Module"
                          >
                            <ArchiveIcon />
                          </IconButton>
                        ) : null}
                        
                        <IconButton 
                          size="small" 
                          onClick={() => handleClone(module.id)}
                          title="Clone Module"
                        >
                          <CloneIcon />
                        </IconButton>
                        
                        <IconButton 
                          size="small" 
                          onClick={() => handleDelete(module.id)}
                          title="Delete Module"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            
            <Box display="flex" justifyContent="space-between" alignItems="center" mt={2}>
              <Typography variant="body2">
                Showing {modules.length} of {totalItems} modules
              </Typography>
              <Pagination 
                count={totalPages} 
                page={page} 
                onChange={handlePageChange} 
                color="primary"
              />
            </Box>
          </>
        )}
      </Paper>
      
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>Module Actions</Typography>
        <Box display="flex" gap={2}>
          <Button 
            variant="outlined"
            startIcon={<CloneIcon />}
            disabled={true}  // Enable when we implement batch operations
          >
            Clone Module
          </Button>
          <Button 
            variant="outlined" 
            startIcon={<AddIcon />}
            onClick={handleCreateModule}
          >
            Create Module
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default ModuleManagement;