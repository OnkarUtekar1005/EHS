// src/pages/admin/DomainManagement.js
import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Paper,
  Box,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  CircularProgress,
  Alert,
  InputAdornment
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import { domainService } from '../../services/api';

const DomainManagement = () => {
  const [domains, setDomains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Domain form data
  const [formData, setFormData] = useState({
    id: null,
    name: '',
    description: ''
  });
  
  // Dialog states
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogType, setDialogType] = useState('add'); // 'add', 'edit', 'delete'
  const [dialogLoading, setDialogLoading] = useState(false);
  const [dialogError, setDialogError] = useState('');
  
  // Fetch all domains on component mount
  useEffect(() => {
    fetchDomains();
  }, []);
  
  // Fetch domains from API
  const fetchDomains = async (query = '') => {
    try {
      setLoading(true);
      setError('');
      
      let response;
      if (query) {
        response = await domainService.search(query);
      } else {
        response = await domainService.getAll();
      }
      
      setDomains(response.data);
    } catch (err) {
      console.error('Failed to fetch domains:', err);
      setError('Failed to load domains. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Search domains handler
  const handleSearch = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    // Debounce search to avoid too many API calls
    const timeoutId = setTimeout(() => {
      fetchDomains(query);
    }, 500);
    
    return () => clearTimeout(timeoutId);
  };
  
  // Open add domain dialog
  const handleOpenAddDialog = () => {
    setFormData({ id: null, name: '', description: '' });
    setDialogType('add');
    setDialogError('');
    setOpenDialog(true);
  };
  
  // Open edit domain dialog
  const handleOpenEditDialog = (domain) => {
    setFormData({
      id: domain.id,
      name: domain.name,
      description: domain.description || ''
    });
    setDialogType('edit');
    setDialogError('');
    setOpenDialog(true);
  };
  
  // Open delete domain dialog
  const handleOpenDeleteDialog = (domain) => {
    setFormData({
      id: domain.id,
      name: domain.name,
      description: domain.description || ''
    });
    setDialogType('delete');
    setDialogError('');
    setOpenDialog(true);
  };
  
  // Close dialog
  const handleCloseDialog = () => {
    setOpenDialog(false);
  };
  
  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  // Save domain (add or edit)
  const handleSaveDomain = async () => {
    try {
      setDialogLoading(true);
      setDialogError('');
      
      if (!formData.name.trim()) {
        setDialogError('Domain name is required');
        return;
      }
      
      let response;
      if (dialogType === 'add') {
        response = await domainService.create(formData);
      } else {
        response = await domainService.update(formData.id, formData);
      }
      
      // Close dialog and refresh domains
      setOpenDialog(false);
      fetchDomains(searchQuery);
      
    } catch (err) {
      console.error('Failed to save domain:', err);
      setDialogError(err.response?.data?.message || 'Failed to save domain');
    } finally {
      setDialogLoading(false);
    }
  };
  
  // Delete domain
  const handleDeleteDomain = async () => {
    try {
      setDialogLoading(true);
      setDialogError('');
      
      await domainService.delete(formData.id);
      
      // Close dialog and refresh domains
      setOpenDialog(false);
      fetchDomains(searchQuery);
      
    } catch (err) {
      console.error('Failed to delete domain:', err);
      setDialogError(err.response?.data?.message || 'Failed to delete domain');
    } finally {
      setDialogLoading(false);
    }
  };
  
  // Dialog title based on type
  const getDialogTitle = () => {
    switch (dialogType) {
      case 'add':
        return 'Add New Domain';
      case 'edit':
        return 'Edit Domain';
      case 'delete':
        return 'Delete Domain';
      default:
        return '';
    }
  };
  
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Domain Management</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenAddDialog}
        >
          Add Domain
        </Button>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      <Paper sx={{ p: 2, mb: 4 }}>
        <Box mb={3}>
          <TextField
            fullWidth
            label="Search Domains"
            variant="outlined"
            value={searchQuery}
            onChange={handleSearch}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
        </Box>
        
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Description</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={3} align="center">
                    <CircularProgress size={40} sx={{ my: 2 }} />
                  </TableCell>
                </TableRow>
              ) : domains.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} align="center">
                    No domains found
                  </TableCell>
                </TableRow>
              ) : (
                domains.map((domain) => (
                  <TableRow key={domain.id}>
                    <TableCell>{domain.name}</TableCell>
                    <TableCell>{domain.description}</TableCell>
                    <TableCell align="right">
                      <IconButton
                        color="primary"
                        onClick={() => handleOpenEditDialog(domain)}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        color="error"
                        onClick={() => handleOpenDeleteDialog(domain)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
      
      {/* Domain Dialog (Add/Edit/Delete) */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{getDialogTitle()}</DialogTitle>
        <DialogContent>
          {dialogError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {dialogError}
            </Alert>
          )}
          
          {dialogType === 'delete' ? (
            <DialogContentText>
              Are you sure you want to delete the domain "{formData.name}"? This action cannot be undone.
            </DialogContentText>
          ) : (
            <>
              <TextField
                margin="dense"
                name="name"
                label="Domain Name"
                fullWidth
                variant="outlined"
                value={formData.name}
                onChange={handleInputChange}
                required
                autoFocus
                disabled={dialogLoading}
              />
              <TextField
                margin="dense"
                name="description"
                label="Description"
                fullWidth
                variant="outlined"
                value={formData.description}
                onChange={handleInputChange}
                multiline
                rows={3}
                disabled={dialogLoading}
              />
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={dialogLoading}>
            Cancel
          </Button>
          {dialogType === 'delete' ? (
            <Button 
              onClick={handleDeleteDomain} 
              color="error" 
              disabled={dialogLoading}
            >
              {dialogLoading ? <CircularProgress size={24} /> : 'Delete'}
            </Button>
          ) : (
            <Button 
              onClick={handleSaveDomain}
              variant="contained"
              disabled={dialogLoading}
            >
              {dialogLoading ? <CircularProgress size={24} /> : 'Save'}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default DomainManagement;