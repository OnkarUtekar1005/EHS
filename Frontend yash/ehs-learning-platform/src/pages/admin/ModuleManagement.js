// src/pages/admin/ModuleManagement.js
import React, { useState } from 'react';
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
  Pagination
} from '@mui/material';
import {
  Edit as EditIcon,
  MoreVert as MoreVertIcon,
  Add as AddIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import { Link } from 'react-router-dom';

// Mock data for demonstration
const mockModules = [
  { id: 1, title: 'Fire Safety', domain: 'Safety', status: 'Active' },
  { id: 2, title: 'OSHA Guide', domain: 'Compliance', status: 'Draft' },
  { id: 3, title: 'First Aid', domain: 'Medical', status: 'Active' },
  { id: 4, title: 'PPE Usage', domain: 'Safety', status: 'Review' },
  { id: 5, title: 'Chemical Handling', domain: 'HazMat', status: 'Active' }
];

const ModuleManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [domainFilter, setDomainFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };
  
  const handleDomainChange = (e) => {
    setDomainFilter(e.target.value);
  };
  
  const handleStatusChange = (e) => {
    setStatusFilter(e.target.value);
  };
  
  const handlePageChange = (event, value) => {
    setPage(value);
  };
  
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Modules</Typography>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />}
          component={Link}
          to="/admin/modules/create"  // FIXED: Updated to correct route
        >
          New Module
        </Button>
      </Box>
      
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box display="flex" flexWrap="wrap" gap={2} mb={2}>
          <TextField
            label="Search Modules"
            variant="outlined"
            size="small"
            value={searchTerm}
            onChange={handleSearch}
            InputProps={{
              endAdornment: <SearchIcon color="action" />
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
              <MenuItem value="Safety">Safety</MenuItem>
              <MenuItem value="Compliance">Compliance</MenuItem>
              <MenuItem value="Medical">Medical</MenuItem>
              <MenuItem value="HazMat">HazMat</MenuItem>
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
              <MenuItem value="Active">Active</MenuItem>
              <MenuItem value="Draft">Draft</MenuItem>
              <MenuItem value="Review">Review</MenuItem>
              <MenuItem value="Archived">Archived</MenuItem>
            </Select>
          </FormControl>
        </Box>
        
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
              {mockModules.map((module) => (
                <TableRow key={module.id}>
                  <TableCell>{module.title}</TableCell>
                  <TableCell>{module.domain}</TableCell>
                  <TableCell>{module.status}</TableCell>
                  <TableCell align="right">
                    <IconButton size="small">
                      <MoreVertIcon />
                    </IconButton>
                    <IconButton size="small" component={Link} to={`/admin/modules/edit/${module.id}`}>
                      <EditIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        
        <Box display="flex" justifyContent="space-between" alignItems="center" mt={2}>
          <Typography variant="body2">
            Showing {mockModules.length} of 23 modules
          </Typography>
          <Pagination count={5} page={page} onChange={handlePageChange} />
        </Box>
      </Paper>
      
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>Module Actions</Typography>
        <Box display="flex" gap={2}>
          <Button variant="outlined">Clone Module</Button>
          <Button variant="outlined">AI Generate</Button>
          <Button variant="outlined">Import/Export</Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default ModuleManagement;