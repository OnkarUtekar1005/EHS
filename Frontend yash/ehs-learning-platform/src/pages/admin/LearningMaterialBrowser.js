// src/pages/admin/LearningMaterialBrowser.js
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  List,
  ListItem,
  Paper,
  CircularProgress,
  Alert,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Pagination
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  ArrowUpward as ArrowUpIcon,
  ArrowDownward as ArrowDownIcon,
  Search as SearchIcon,
  CheckCircle as CheckCircleIcon,
  PictureAsPdf as PdfIcon,
  Image as ImageIcon,
  VideoLibrary as VideoIcon,
  Link as LinkIcon,
  Description as DocumentIcon,
  Code as CodeIcon,
  Visibility as VisibilityIcon
} from '@mui/icons-material';
import { materialLibraryService } from '../../services/api';

// Material type constants
const MATERIAL_TYPES = {
  PDF: "PDF",
  VIDEO: "VIDEO",
  PRESENTATION: "PRESENTATION",
  DOCUMENT: "DOCUMENT",
  HTML: "HTML",
  IMAGE: "IMAGE",
  EXTERNAL: "EXTERNAL"
};

const LearningMaterialBrowser = ({ componentId, initialMaterials = [], onSave, onCancel }) => {
  // State variables
  const [selectedMaterials, setSelectedMaterials] = useState(initialMaterials || []);
  const [libraryMaterials, setLibraryMaterials] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Search and filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Preview dialog state
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewMaterial, setPreviewMaterial] = useState(null);
  
  // Check if componentId is temporary
  const isTemporaryComponent = () => {
    return componentId && String(componentId).startsWith('comp-');
  };
  
  // Fetch materials from library
  useEffect(() => {
    fetchLibraryMaterials();
  }, [page, typeFilter]);
  
  // Fetch materials from API
  const fetchLibraryMaterials = async () => {
    try {
      setLoading(true);
      
      // Prepare query parameters
      const params = {
        page: page - 1,
        size: 12
      };
      
      if (searchTerm) params.title = searchTerm;
      if (typeFilter) params.fileType = typeFilter;
      
      const response = await materialLibraryService.getAll(params);
      
      // Check if headers are available for pagination info
      if (response.headers && response.headers['x-total-pages']) {
        setTotalPages(parseInt(response.headers['x-total-pages'], 10));
      }
      
      // Filter out materials that are already selected
      const selectedIds = selectedMaterials.map(m => m.id);
      const filteredMaterials = response.data.filter(m => !selectedIds.includes(m.id));
      
      setLibraryMaterials(filteredMaterials);
    } catch (err) {
      console.error('Error fetching materials:', err);
      setError('Failed to load materials library. ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };
  
  // Handle search button click
  const handleSearch = () => {
    setPage(1); // Reset to page 1 when search changes
    fetchLibraryMaterials();
  };
  
  // Handle type filter change
  const handleTypeChange = (e) => {
    setTypeFilter(e.target.value);
    setPage(1); // Reset to page 1 when filter changes
  };
  
  // Handle pagination change
  const handlePageChange = (event, value) => {
    setPage(value);
  };
  
  // Select a material from the library
  const handleSelectMaterial = (material) => {
    const updatedMaterials = [...selectedMaterials, material];
    setSelectedMaterials(updatedMaterials);
    
    // Remove from library materials list
    setLibraryMaterials(libraryMaterials.filter(m => m.id !== material.id));
  };
  
  // Remove a material from selected list
  const handleRemoveMaterial = (material) => {
    setSelectedMaterials(selectedMaterials.filter(m => m.id !== material.id));
    
    // Add back to library materials if it's not from initial selection
    // Only if it matches the current filter criteria
    if (!initialMaterials.some(m => m.id === material.id)) {
      if (!typeFilter || material.fileType === typeFilter) {
        setLibraryMaterials([...libraryMaterials, material]);
      }
    }
  };
  
  // Move material up in the list
  const handleMoveUp = (index) => {
    if (index === 0) return;
    
    const newMaterials = [...selectedMaterials];
    const temp = newMaterials[index];
    newMaterials[index] = newMaterials[index - 1];
    newMaterials[index - 1] = temp;
    
    setSelectedMaterials(newMaterials);
  };
  
  // Move material down in the list
  const handleMoveDown = (index) => {
    if (index === selectedMaterials.length - 1) return;
    
    const newMaterials = [...selectedMaterials];
    const temp = newMaterials[index];
    newMaterials[index] = newMaterials[index + 1];
    newMaterials[index + 1] = temp;
    
    setSelectedMaterials(newMaterials);
  };
  
  // Preview material
  const handlePreviewMaterial = (material) => {
    setPreviewMaterial(material);
    setPreviewOpen(true);
  };
  
  // Close preview dialog
  const handleClosePreview = () => {
    setPreviewOpen(false);
  };
  
  // Save selected materials
  const handleSaveSelection = async () => {
    try {
      setLoading(true);
      setError('');
      
      if (selectedMaterials.length === 0) {
        setError('Please select at least one learning material');
        setLoading(false);
        return;
      }
      
      // If not a temporary component, associate the materials with the component
      if (!isTemporaryComponent()) {
        const materialIds = selectedMaterials.map(m => m.id);
        
        try {
          // Update the component's associated materials
          await materialLibraryService.associateMaterialsWithComponent(componentId, materialIds);
        } catch (associationError) {
          console.error('Error associating materials with component:', associationError);
          setError('Failed to associate materials with component');
          setLoading(false);
          return;
        }
      }
      
      setSuccess('Materials saved successfully');
      
      // Pass the materials back to parent component
      if (onSave) {
        onSave(selectedMaterials);
      }
    } catch (err) {
      console.error('Error saving materials:', err);
      setError('Failed to save materials: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };
  
  // Get icon for material type
  const getMaterialIcon = (type) => {
    switch (type) {
      case MATERIAL_TYPES.PDF:
        return <PdfIcon />;
      case MATERIAL_TYPES.VIDEO:
        return <VideoIcon />;
      case MATERIAL_TYPES.PRESENTATION:
        return <DocumentIcon />;
      case MATERIAL_TYPES.DOCUMENT:
        return <DocumentIcon />;
      case MATERIAL_TYPES.HTML:
        return <CodeIcon />;
      case MATERIAL_TYPES.EXTERNAL:
        return <LinkIcon />;
      case MATERIAL_TYPES.IMAGE:
        return <ImageIcon />;
      default:
        return <DocumentIcon />;
    }
  };
  
  return (
    <Box sx={{ p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5">Learning Materials</Typography>
        <Box>
          <Button 
            variant="contained" 
            color="primary" 
            startIcon={<CheckCircleIcon />}
            onClick={handleSaveSelection}
            disabled={loading}
            sx={{ mr: 1 }}
          >
            {loading ? <CircularProgress size={24} /> : 'Save Selection'}
          </Button>
          <Button 
            variant="outlined"
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </Button>
        </Box>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}
      
      {isTemporaryComponent() && (
        <Alert severity="info" sx={{ mb: 3 }}>
          You are selecting materials for an unsaved component. Materials will be associated when the module is saved.
        </Alert>
      )}
      
      <Grid container spacing={3}>
        {/* Selected Materials */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom>Selected Materials</Typography>
            
            {selectedMaterials.length === 0 ? (
              <Box textAlign="center" py={4}>
                <Typography variant="body1" color="textSecondary">
                  No materials selected
                </Typography>
                <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                  Select materials from the library on the right
                </Typography>
              </Box>
            ) : (
              <List>
                {selectedMaterials.map((material, index) => (
                  <ListItem key={index} divider={index < selectedMaterials.length - 1}>
                    <Card variant="outlined" sx={{ width: '100%' }}>
                      <CardContent>
                        <Grid container spacing={2}>
                          <Grid item xs={1}>
                            <Box display="flex" alignItems="center" justifyContent="center" height="100%">
                              <Typography variant="body2" fontWeight="bold">
                                {index + 1}
                              </Typography>
                            </Box>
                          </Grid>
                          <Grid item xs={7}>
                            <Box display="flex" alignItems="center">
                              {getMaterialIcon(material.fileType)}
                              <Box ml={2}>
                                <Typography variant="subtitle1" component="div">
                                  {material.title || "Untitled Material"}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  Type: {material.fileType || "Unknown"} • Duration: {material.estimatedDuration || 0} min
                                </Typography>
                                {material.description && (
                                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1, overflow: 'hidden', textOverflow: 'ellipsis', maxHeight: '40px' }}>
                                    {material.description}
                                  </Typography>
                                )}
                              </Box>
                            </Box>
                          </Grid>
                          <Grid item xs={4}>
                            <Box display="flex" justifyContent="flex-end">
                              <Tooltip title="Move Up">
                                <span>
                                  <IconButton 
                                    disabled={index === 0}
                                    onClick={() => handleMoveUp(index)}
                                  >
                                    <ArrowUpIcon />
                                  </IconButton>
                                </span>
                              </Tooltip>
                              <Tooltip title="Move Down">
                                <span>
                                  <IconButton 
                                    disabled={index === selectedMaterials.length - 1}
                                    onClick={() => handleMoveDown(index)}
                                  >
                                    <ArrowDownIcon />
                                  </IconButton>
                                </span>
                              </Tooltip>
                              <Tooltip title="Preview">
                                <IconButton onClick={() => handlePreviewMaterial(material)}>
                                  <VisibilityIcon />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Remove">
                                <IconButton onClick={() => handleRemoveMaterial(material)}>
                                  <DeleteIcon />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>
                  </ListItem>
                ))}
              </List>
            )}
          </Paper>
        </Grid>
        
        {/* Material Library */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Material Library</Typography>
            
            <Box display="flex" flexWrap="wrap" gap={2} mb={2}>
              <TextField
                label="Search Materials"
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
                sx={{ flexGrow: 1 }}
              />
              
              <FormControl size="small" sx={{ minWidth: '150px' }}>
                <InputLabel>Type</InputLabel>
                <Select
                  value={typeFilter}
                  label="Type"
                  onChange={handleTypeChange}
                >
                  <MenuItem value="">All Types</MenuItem>
                  <MenuItem value={MATERIAL_TYPES.PDF}>PDF</MenuItem>
                  <MenuItem value={MATERIAL_TYPES.VIDEO}>Video</MenuItem>
                  <MenuItem value={MATERIAL_TYPES.PRESENTATION}>Presentation</MenuItem>
                  <MenuItem value={MATERIAL_TYPES.DOCUMENT}>Document</MenuItem>
                  <MenuItem value={MATERIAL_TYPES.HTML}>HTML Content</MenuItem>
                  <MenuItem value={MATERIAL_TYPES.IMAGE}>Image</MenuItem>
                  <MenuItem value={MATERIAL_TYPES.EXTERNAL}>External Link</MenuItem>
                </Select>
              </FormControl>
            </Box>
            
            <Divider sx={{ mb: 2 }} />
            
            {loading && !libraryMaterials.length ? (
              <Box display="flex" justifyContent="center" my={4}>
                <CircularProgress />
              </Box>
            ) : (
              <>
                {libraryMaterials.length === 0 ? (
                  <Box textAlign="center" py={4}>
                    <Typography variant="body1" color="textSecondary">
                      No materials found
                    </Typography>
                    <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                      Try adjusting your search filters or create new materials in the Material Library
                    </Typography>
                  </Box>
                ) : (
                  <Grid container spacing={2}>
                    {libraryMaterials.map((material) => (
                      <Grid item xs={12} sm={6} key={material.id}>
                        <Card variant="outlined">
                          <CardContent sx={{ pb: 1 }}>
                            <Box display="flex" alignItems="center" mb={1}>
                              {getMaterialIcon(material.fileType)}
                              <Typography variant="subtitle1" sx={{ ml: 1, maxWidth: '190px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {material.title}
                              </Typography>
                            </Box>
                            <Chip 
                              label={material.fileType} 
                              size="small" 
                              sx={{ mb: 1 }}
                            />
                            {material.description && (
                              <Typography variant="body2" color="textSecondary" sx={{ mb: 1, height: '20px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {material.description}
                              </Typography>
                            )}
                            <Typography variant="body2">
                              Duration: {material.estimatedDuration || 0} min
                            </Typography>
                          </CardContent>
                          <CardActions>
                            <Button 
                              size="small" 
                              color="primary" 
                              onClick={() => handleSelectMaterial(material)}
                              startIcon={<AddIcon />}
                            >
                              Select
                            </Button>
                            <Button 
                              size="small" 
                              onClick={() => handlePreviewMaterial(material)}
                              startIcon={<VisibilityIcon />}
                            >
                              Preview
                            </Button>
                          </CardActions>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                )}
                
                <Box display="flex" justifyContent="center" mt={2}>
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
        </Grid>
      </Grid>
      
      {/* Material Preview Dialog */}
      <Dialog
        open={previewOpen}
        onClose={handleClosePreview}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>
          {previewMaterial?.title}
        </DialogTitle>
        <DialogContent>
          {previewMaterial && (
            <Box>
              <Typography variant="subtitle1" gutterBottom>
                {previewMaterial.fileType} • {previewMaterial.estimatedDuration || 0} min
              </Typography>
              
              {previewMaterial.description && (
                <Typography variant="body1" paragraph>
                  {previewMaterial.description}
                </Typography>
              )}
              
              {previewMaterial.fileType === MATERIAL_TYPES.IMAGE && previewMaterial.filePath && (
                <Box sx={{ textAlign: 'center', mt: 2 }}>
                  <img 
                    src={`/api/files/${previewMaterial.filePath}`}
                    alt={previewMaterial.title}
                    style={{ maxWidth: '100%', maxHeight: '400px' }}
                  />
                </Box>
              )}
              
              {previewMaterial.fileType === MATERIAL_TYPES.PDF && previewMaterial.filePath && (
                <Box sx={{ textAlign: 'center', mt: 2 }}>
                  <iframe
                    src={`/api/files/${previewMaterial.filePath}`}
                    width="100%"
                    height="500px"
                    title={previewMaterial.title}
                  />
                </Box>
              )}
              
              {previewMaterial.fileType === MATERIAL_TYPES.VIDEO && previewMaterial.externalUrl && (
                <Box sx={{ textAlign: 'center', mt: 2 }}>
                  <iframe
                    src={previewMaterial.externalUrl}
                    width="100%"
                    height="400px"
                    frameBorder="0"
                    allowFullScreen
                    title={previewMaterial.title}
                  />
                </Box>
              )}
              
              {previewMaterial.fileType === MATERIAL_TYPES.HTML && previewMaterial.content && (
                <Box sx={{ mt: 2, border: '1px solid #eee', p: 2, borderRadius: 1 }}>
                  <div dangerouslySetInnerHTML={{ __html: previewMaterial.content }} />
                </Box>
              )}
              
              {previewMaterial.fileType === MATERIAL_TYPES.EXTERNAL && previewMaterial.externalUrl && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body1">
                    External Link: <a href={previewMaterial.externalUrl} target="_blank" rel="noopener noreferrer">
                      {previewMaterial.externalUrl}
                    </a>
                  </Typography>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClosePreview}>Close</Button>
          {!selectedMaterials.some(m => m.id === previewMaterial?.id) && (
            <Button 
              onClick={() => {
                handleSelectMaterial(previewMaterial);
                handleClosePreview();
              }}
              variant="contained"
              color="primary"
            >
              Select Material
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default LearningMaterialBrowser;