// src/pages/admin/LearningMaterialManagement.js
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
  Chip,
  Card,
  CardContent,
  CardActions,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip
} from '@mui/material';
import {
  Edit as EditIcon,
  Add as AddIcon,
  Search as SearchIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  Link as LinkIcon,
  Upload as UploadIcon,
  Code as CodeIcon,
  PictureAsPdf as PdfIcon,
  Image as ImageIcon,
  VideoLibrary as VideoIcon,
  MoreVert as MoreVertIcon,
  Description as DocumentIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { materialLibraryService } from '../../services/api';
import MaterialEditor from './MaterialEditor';

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

const LearningMaterialManagement = () => {
  const navigate = useNavigate();
  
  // State
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [page, setPage] = useState(1);
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(12);
  const [totalPages, setTotalPages] = useState(1);
  
  // Material editor dialog state
  const [editorOpen, setEditorOpen] = useState(false);
  const [currentMaterial, setCurrentMaterial] = useState(null);
  const [editorMode, setEditorMode] = useState('create'); // 'create' or 'edit'
  
  // Preview dialog state
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewMaterial, setPreviewMaterial] = useState(null);
  
  // Component usage dialog state
  const [usageOpen, setUsageOpen] = useState(false);
  const [usageMaterial, setUsageMaterial] = useState(null);
  const [usageComponents, setUsageComponents] = useState([]);
  
  // Load materials on component mount and when filters change
  useEffect(() => {
    fetchMaterials();
  }, [page, typeFilter]);
  
  // Fetch materials from API
  const fetchMaterials = async () => {
    try {
      setLoading(true);
      
      // Prepare query parameters
      const params = {
        page: page - 1,  // API uses 0-indexed pages
        size: itemsPerPage
      };
      
      if (searchTerm) params.title = searchTerm;
      if (typeFilter) params.fileType = typeFilter;
      
      const response = await materialLibraryService.getAll(params);
      
      // Check if headers are available for pagination info
      if (response.headers && response.headers['x-total-count']) {
        setTotalItems(parseInt(response.headers['x-total-count'], 10));
        setTotalPages(parseInt(response.headers['x-total-pages'], 10));
      }
      
      setMaterials(response.data);
    } catch (err) {
      console.error('Error fetching materials:', err);
      setError('Failed to load materials. ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };
  
  // Handle search
  const handleSearch = () => {
    setPage(1);
    fetchMaterials();
  };
  
  // Handle filter changes
  const handleTypeChange = (e) => {
    setTypeFilter(e.target.value);
    setPage(1);
  };
  
  // Handle pagination
  const handlePageChange = (event, value) => {
    setPage(value);
  };
  
  // Open material editor for creation
  const handleCreateMaterial = () => {
    setCurrentMaterial(null);
    setEditorMode('create');
    setEditorOpen(true);
  };
  
  // Open material editor for editing
  const handleEditMaterial = (material) => {
    setCurrentMaterial(material);
    setEditorMode('edit');
    setEditorOpen(true);
  };
  
  // Handle material preview - using direct file access with cache busting
  const handlePreviewMaterial = (material) => {
    console.log("Previewing material:", material); // Debug logging
    
    // Make a clean copy for preview, add timestamp for cache busting
    const previewMaterialCopy = { 
      ...material,
      timestamp: new Date().getTime() // Add timestamp to prevent caching issues
    };
    
    setPreviewMaterial(previewMaterialCopy);
    setPreviewOpen(true);
    
    // If it's an external link, open in new tab
    if (material.fileType === MATERIAL_TYPES.EXTERNAL && material.externalUrl) {
      window.open(material.externalUrl, '_blank');
    }
  };
  
  // Close preview dialog
  const handleClosePreview = () => {
    setPreviewOpen(false);
  };
  
  // Show where a material is used
  const handleShowUsage = async (material) => {
    try {
      setLoading(true);
      const response = await materialLibraryService.getUsage(material.id);
      setUsageMaterial(material);
      setUsageComponents(response.data);
      setUsageOpen(true);
    } catch (err) {
      console.error('Error fetching material usage:', err);
      setError('Failed to load material usage information');
    } finally {
      setLoading(false);
    }
  };
  
  // Close usage dialog
  const handleCloseUsage = () => {
    setUsageOpen(false);
  };
  
  // Handle material deletion
  const handleDeleteMaterial = async (material) => {
    if (window.confirm(`Are you sure you want to delete "${material.title}"? This action cannot be undone.`)) {
      try {
        setLoading(true);
        await materialLibraryService.delete(material.id);
        setSuccess(`Material "${material.title}" deleted successfully`);
        fetchMaterials(); // Refresh the list
      } catch (err) {
        console.error('Error deleting material:', err);
        setError('Failed to delete material. ' + (err.response?.data?.message || err.message));
      } finally {
        setLoading(false);
      }
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
  
  // Handle save in material editor
  const handleSaveMaterial = async (materialData) => {
    try {
      setLoading(true);
      
      if (editorMode === 'create') {
        // Create new material
        if (materialData.file) {
          await materialLibraryService.uploadFile(materialData);
        } else if (materialData.externalUrl) {
          await materialLibraryService.createExternal(materialData);
        } else if (materialData.content) {
          await materialLibraryService.createContent(materialData);
        }
      } else {
        // Update existing material
        await materialLibraryService.update(currentMaterial.id, materialData);
      }
      
      setSuccess(editorMode === 'create' 
        ? 'Material created successfully' 
        : 'Material updated successfully');
        
      setEditorOpen(false);
      fetchMaterials(); // Refresh the list
    } catch (err) {
      console.error('Error saving material:', err);
      setError('Failed to save material. ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };
  
  // Function to get file preview URL with cache busting
  const getFileUrl = (filePath) => {
    if (!filePath) return null;
    
    // Extract just the filename from the path
    const filename = filePath.split('/').pop();
    
    // Add cache busting parameter
    return `/api/files/${filename}?t=${new Date().getTime()}`;
  };
  
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Learning Materials Library</Typography>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />}
          onClick={handleCreateMaterial}
        >
          New Material
        </Button>
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
      
      <Paper sx={{ p: 2, mb: 3 }}>
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
            sx={{ flexGrow: 1, minWidth: '200px' }}
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
        
        {loading && !materials.length ? (
          <Box display="flex" justifyContent="center" my={4}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {materials.length === 0 ? (
              <Box textAlign="center" py={4}>
                <Typography variant="h6" color="textSecondary">
                  No materials found
                </Typography>
                <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                  Try adjusting your search or create a new material
                </Typography>
                <Button 
                  variant="contained" 
                  startIcon={<AddIcon />} 
                  sx={{ mt: 2 }}
                  onClick={handleCreateMaterial}
                >
                  Create Material
                </Button>
              </Box>
            ) : (
              <Grid container spacing={3}>
                {materials.map((material) => (
                  <Grid item xs={12} sm={6} md={4} key={material.id}>
                    <Card>
                      <CardContent>
                        <Box display="flex" alignItems="center" mb={1}>
                          {getMaterialIcon(material.fileType)}
                          <Typography variant="h6" sx={{ ml: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {material.title}
                          </Typography>
                        </Box>
                        <Chip 
                          label={material.fileType} 
                          size="small" 
                          sx={{ mb: 1 }}
                        />
                        {material.description && (
                          <Typography 
                            variant="body2" 
                            color="textSecondary" 
                            sx={{ 
                              mb: 1, 
                              height: '40px', 
                              overflow: 'hidden', 
                              textOverflow: 'ellipsis',
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical'
                            }}
                          >
                            {material.description}
                          </Typography>
                        )}
                        <Typography variant="body2">
                          Duration: {material.estimatedDuration || 0} min
                        </Typography>
                      </CardContent>
                      <CardActions>
                        <Tooltip title="Preview">
                          <IconButton onClick={() => handlePreviewMaterial(material)}>
                            <VisibilityIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit">
                          <IconButton onClick={() => handleEditMaterial(material)}>
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Where Used">
                          <IconButton onClick={() => handleShowUsage(material)}>
                            <MoreVertIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton onClick={() => handleDeleteMaterial(material)}>
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </CardActions>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
            
            <Box display="flex" justifyContent="space-between" alignItems="center" mt={2}>
              <Typography variant="body2">
                Showing {materials.length} of {totalItems} materials
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
      
      {/* Material Editor Dialog */}
      <Dialog 
        open={editorOpen} 
        onClose={() => setEditorOpen(false)}
        fullWidth
        maxWidth="md"
      >
        <DialogContent sx={{ p: 0 }}>
          <MaterialEditor
            material={currentMaterial}
            mode={editorMode}
            onSave={handleSaveMaterial}
            onCancel={() => setEditorOpen(false)}
          />
        </DialogContent>
      </Dialog>
      
      {/* Material Preview Dialog - FIXED TO USE EXISTING FILE CONTROLLER */}
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
              
              {/* Image Preview - USING FILE CONTROLLER */}
              {previewMaterial.fileType === MATERIAL_TYPES.IMAGE && previewMaterial.filePath && (
                <Box sx={{ textAlign: 'center', mt: 2 }}>
                  <img 
                    src={getFileUrl(previewMaterial.filePath)}
                    alt={previewMaterial.title}
                    style={{ maxWidth: '100%', maxHeight: '400px' }}
                    onError={(e) => {
                      console.error('Image failed to load:', e);
                      e.target.src = 'https://via.placeholder.com/400x300?text=Image+Not+Available';
                    }}
                  />
                </Box>
              )}
              
              {/* PDF Preview - USING FILE CONTROLLER */}
              {previewMaterial.fileType === MATERIAL_TYPES.PDF && previewMaterial.filePath && (
                <Box sx={{ textAlign: 'center', mt: 2 }}>
                  <iframe
                    src={getFileUrl(previewMaterial.filePath)}
                    width="100%"
                    height="500px"
                    title={previewMaterial.title}
                    onError={(e) => {
                      console.error("Failed to load PDF:", e);
                    }}
                  />
                </Box>
              )}
              
              {/* Video Preview - USING FILE CONTROLLER */}
              {previewMaterial.fileType === MATERIAL_TYPES.VIDEO && (
                <Box sx={{ textAlign: 'center', mt: 2 }}>
                  {previewMaterial.externalUrl ? (
                    <iframe
                      src={previewMaterial.externalUrl}
                      width="100%"
                      height="400px"
                      frameBorder="0"
                      allowFullScreen
                      title={previewMaterial.title}
                    />
                  ) : previewMaterial.filePath ? (
                    <video 
                      src={getFileUrl(previewMaterial.filePath)}
                      controls
                      width="100%"
                      height="400px"
                      title={previewMaterial.title}
                      onError={(e) => {
                        console.error("Failed to load video:", e);
                      }}
                    >
                      Your browser does not support the video tag.
                    </video>
                  ) : (
                    <Typography>Video source not available</Typography>
                  )}
                </Box>
              )}
              
              {/* HTML Content Preview */}
              {previewMaterial.fileType === MATERIAL_TYPES.HTML && previewMaterial.content && (
                <Box sx={{ mt: 2, border: '1px solid #eee', p: 2, borderRadius: 1 }}>
                  <div dangerouslySetInnerHTML={{ __html: previewMaterial.content }} />
                </Box>
              )}
              
              {/* External Link Preview */}
              {previewMaterial.fileType === MATERIAL_TYPES.EXTERNAL && previewMaterial.externalUrl && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body1">
                    External Link: <a href={previewMaterial.externalUrl} target="_blank" rel="noopener noreferrer">
                      {previewMaterial.externalUrl}
                    </a>
                  </Typography>
                </Box>
              )}
              
              {/* Document Preview - USING FILE CONTROLLER */}
              {(previewMaterial.fileType === MATERIAL_TYPES.DOCUMENT || 
                previewMaterial.fileType === MATERIAL_TYPES.PRESENTATION) && 
                previewMaterial.filePath && (
                <Box sx={{ textAlign: 'center', mt: 2 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Document preview not available in browser. Click the button below to open the document.
                  </Typography>
                  <Button 
                    variant="contained" 
                    onClick={() => window.open(getFileUrl(previewMaterial.filePath), '_blank')}
                  >
                    Open Document
                  </Button>
                </Box>
              )}
              
              {/* Fallback if no content is available to preview */}
              {!previewMaterial.filePath && !previewMaterial.externalUrl && !previewMaterial.content && 
                previewMaterial.fileType !== MATERIAL_TYPES.EXTERNAL && previewMaterial.fileType !== MATERIAL_TYPES.HTML && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  No preview content available for this material.
                </Alert>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClosePreview}>Close</Button>
        </DialogActions>
      </Dialog>
      
      {/* Material Usage Dialog */}
      <Dialog
        open={usageOpen}
        onClose={handleCloseUsage}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          Where "{usageMaterial?.title}" is Used
        </DialogTitle>
        <DialogContent>
          {usageComponents.length === 0 ? (
            <Typography variant="body1">
              This material is not currently used in any modules.
            </Typography>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Module</TableCell>
                    <TableCell>Component</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {usageComponents.map((component, index) => (
                    <TableRow key={index}>
                      <TableCell>{component.moduleName}</TableCell>
                      <TableCell>{component.componentName}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseUsage}>Close</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default LearningMaterialManagement;