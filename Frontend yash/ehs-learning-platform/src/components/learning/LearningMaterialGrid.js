// src/components/learning/LearningMaterialGrid.js
import React, { useState } from 'react';
import { 
  Grid, 
  Card, 
  CardContent, 
  CardActions, 
  Typography, 
  Button,
  Box,
  Chip,
  LinearProgress,
  CircularProgress,
  Alert,
  TextField,
  InputAdornment,
  IconButton,
  Paper,
  Divider
} from '@mui/material';
import {
  Search as SearchIcon,
  OndemandVideo as VideoIcon,
  Description as DocumentIcon,
  Link as LinkIcon,
  Image as ImageIcon,
  Article as ArticleIcon,
  Slideshow as PresentationIcon,
  CheckCircle as CheckCircleIcon,
  FilterList as FilterListIcon,
  Timer as TimerIcon
} from '@mui/icons-material';

/**
 * Grid display for learning materials with search and filtering capabilities
 * 
 * @param {Object[]} materials - Array of learning material objects
 * @param {Function} onViewMaterial - Function to call when "View" button is clicked
 * @param {boolean} loading - Whether materials are being loaded
 * @param {string} error - Error message if loading failed
 * @param {string} emptyMessage - Message to display when no materials are available
 */
const LearningMaterialGrid = ({ 
  materials = [], 
  onViewMaterial, 
  loading = false,
  error = null,
  emptyMessage = "No learning materials available." 
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  
  // Get appropriate icon for material type
  const getMaterialIcon = (fileType) => {
    if (!fileType) return <DocumentIcon />;
    
    switch(fileType.toUpperCase()) {
      case 'PDF':
        return <DocumentIcon />;
      case 'VIDEO':
        return <VideoIcon />;
      case 'PRESENTATION':
        return <PresentationIcon />;
      case 'HTML':
        return <ArticleIcon />;
      case 'IMAGE':
        return <ImageIcon />;
      case 'DOCUMENT':
        return <DocumentIcon />;
      case 'EXTERNAL':
        return <LinkIcon />;
      default:
        return <DocumentIcon />;
    }
  };
  
  // Filter materials based on search query and type filter
  const filteredMaterials = materials.filter(material => {
    const matchesSearch = searchQuery === '' || 
      (material.title && material.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (material.description && material.description.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesType = filterType === 'all' || 
      (material.fileType && material.fileType.toLowerCase() === filterType.toLowerCase());
    
    return matchesSearch && matchesType;
  });
  
  // Get unique material types for filter
  const materialTypes = ['all', ...new Set(materials
    .filter(m => m.fileType)
    .map(m => m.fileType.toLowerCase())
  )];
  
  // Handle search input change
  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
  };
  
  // Handle filter change
  const handleFilterChange = (type) => {
    setFilterType(type);
  };
  
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
        <CircularProgress />
      </Box>
    );
  }
  
  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }
  
  if (materials.length === 0) {
    return <Alert severity="info">{emptyMessage}</Alert>;
  }
  
  return (
    <Box>
      {/* Search and filter */}
      <Box sx={{ display: 'flex', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <TextField
          placeholder="Search materials..."
          variant="outlined"
          size="small"
          value={searchQuery}
          onChange={handleSearchChange}
          sx={{ flexGrow: 1, minWidth: '200px' }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
        
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {materialTypes.map((type) => (
            <Chip
              key={type}
              label={type.charAt(0).toUpperCase() + type.slice(1)}
              onClick={() => handleFilterChange(type)}
              color={filterType === type ? 'primary' : 'default'}
              variant={filterType === type ? 'filled' : 'outlined'}
              size="small"
            />
          ))}
        </Box>
      </Box>
      
      {filteredMaterials.length === 0 ? (
        <Alert severity="info">No materials match your search criteria.</Alert>
      ) : (
        <Grid container spacing={3}>
          {filteredMaterials.map((material) => (
            <Grid item xs={12} sm={6} md={4} key={material.id}>
              <Card 
                sx={{ 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column',
                  cursor: 'pointer',
                  '&:hover': {
                    boxShadow: 3
                  },
                  position: 'relative'
                }}
              >
                {material.completed && (
                  <Box 
                    sx={{ 
                      position: 'absolute', 
                      top: 10, 
                      right: 10, 
                      zIndex: 1,
                      bgcolor: 'success.main',
                      color: 'white',
                      borderRadius: '50%',
                      width: 28,
                      height: 28,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <CheckCircleIcon fontSize="small" />
                  </Box>
                )}
                
                <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                  <Box display="flex" alignItems="flex-start" mb={1}>
                    <Box sx={{ mr: 1, mt: 0.5 }}>
                      {getMaterialIcon(material.fileType)}
                    </Box>
                    <Typography variant="h6" component="div" gutterBottom noWrap>
                      {material.title}
                    </Typography>
                  </Box>
                  
                  <Typography 
                    variant="body2" 
                    color="text.secondary" 
                    sx={{ 
                      mb: 2, 
                      flexGrow: 1,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                    }}
                  >
                    {material.description || 'No description available'}
                  </Typography>
                  
                  {material.estimatedDuration && (
                    <Box display="flex" alignItems="center" mb={1}>
                      <TimerIcon fontSize="small" color="action" sx={{ mr: 0.5 }} />
                      <Typography variant="body2" color="text.secondary">
                        {material.estimatedDuration} min
                      </Typography>
                    </Box>
                  )}
                  
                  {/* Progress indicator */}
                  {typeof material.progress === 'number' && (
                    <>
                      <Typography variant="body2" color="text.secondary" mt={1}>
                        Progress:
                      </Typography>
                      <LinearProgress 
                        variant="determinate" 
                        value={material.progress} 
                        sx={{ height: 6, borderRadius: 3, mb: 0.5 }} 
                      />
                      <Typography variant="body2" align="right" color="text.secondary" fontSize="0.75rem">
                        {material.progress}%
                      </Typography>
                    </>
                  )}
                </CardContent>
                
                <Divider />
                
                <CardActions>
                  <Button 
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onViewMaterial) onViewMaterial(material);
                    }}
                    variant="contained"
                    fullWidth
                  >
                    {material.completed ? 'Review' : 'View Material'}
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default LearningMaterialGrid;