// src/components/learning/LearningMaterialGrid.js
// src/components/learning/LearningMaterialGrid.js
import React, { useState } from 'react';
import {
  Grid,
  Typography,
  Box,
  CircularProgress,
  Alert,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Pagination
} from '@mui/material';
import { Search as SearchIcon, FilterList as FilterIcon } from '@mui/icons-material';
import LearningMaterialCard from './LearningMaterialCard';

const LearningMaterialGrid = ({ 
  materials, 
  loading, 
  error, 
  onViewMaterial,
  itemsPerPage = 6,
  showFilters = true
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  
  // Handle search change
  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
    setCurrentPage(1); // Reset to first page on search change
  };
  
  // Handle filter change
  const handleFilterChange = (event) => {
    setTypeFilter(event.target.value);
    setCurrentPage(1); // Reset to first page on filter change
  };
  
  // Handle page change
  const handlePageChange = (event, value) => {
    setCurrentPage(value);
  };
  
  // Filter materials based on search and type
  const filteredMaterials = materials.filter(material => {
    const matchesSearch = !searchTerm || 
      material.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (material.description && material.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesType = !typeFilter || material.fileType === typeFilter;
    
    return matchesSearch && matchesType;
  });
  
  // Paginate materials
  const paginatedMaterials = filteredMaterials.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  
  // Calculate total pages
  const totalPages = Math.ceil(filteredMaterials.length / itemsPerPage);
  
  // If loading
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }
  
  // If error
  if (error) {
    return (
      <Alert severity="error">
        {error}
      </Alert>
    );
  }
  
  // If no materials
  if (!materials || materials.length === 0) {
    return (
      <Alert severity="info">
        No learning materials available.
      </Alert>
    );
  }
  
  return (
    <Box>
      {/* Filters Section */}
      {showFilters && (
        <Box mb={3} display="flex" flexWrap="wrap" gap={2}>
          <TextField
            size="small"
            label="Search Materials"
            variant="outlined"
            value={searchTerm}
            onChange={handleSearchChange}
            sx={{ flexGrow: 1, minWidth: '200px' }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              )
            }}
          />
          
          <FormControl size="small" sx={{ minWidth: '150px' }}>
            <InputLabel id="type-filter-label">Material Type</InputLabel>
            <Select
              labelId="type-filter-label"
              value={typeFilter}
              onChange={handleFilterChange}
              label="Material Type"
              startAdornment={
                <InputAdornment position="start">
                  <FilterIcon fontSize="small" />
                </InputAdornment>
              }
            >
              <MenuItem value="">All Types</MenuItem>
              <MenuItem value="PDF">PDF</MenuItem>
              <MenuItem value="VIDEO">Video</MenuItem>
              <MenuItem value="PRESENTATION">Presentation</MenuItem>
              <MenuItem value="DOCUMENT">Document</MenuItem>
              <MenuItem value="HTML">Web Content</MenuItem>
              <MenuItem value="IMAGE">Image</MenuItem>
              <MenuItem value="EXTERNAL">External Link</MenuItem>
            </Select>
          </FormControl>
        </Box>
      )}
      
      {/* Results Summary */}
      <Box mb={2} display="flex" justifyContent="space-between" alignItems="center">
        <Typography variant="body2" color="text.secondary">
          {filteredMaterials.length} materials found
        </Typography>
      </Box>
      
      {/* Materials Grid */}
      <Grid container spacing={3} mb={3}>
        {paginatedMaterials.map((material) => (
          <Grid item xs={12} sm={6} md={4} key={material.id}>
            <LearningMaterialCard
              material={material}
              onView={() => onViewMaterial(material)}
            />
          </Grid>
        ))}
      </Grid>
      
      {/* Pagination */}
      {totalPages > 1 && (
        <Box display="flex" justifyContent="center" mt={3}>
          <Pagination
            count={totalPages}
            page={currentPage}
            onChange={handlePageChange}
            color="primary"
          />
        </Box>
      )}
    </Box>
  );
};

export default LearningMaterialGrid;