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
import { materialLibraryService } from '../../../services/api';
import MaterialEditor from './MaterialEditor';
//import MaterialPreviewDialog from '../../../components/admin/MaterialPreviewDialog';

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

  // Preview state removed
  
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
  
  // Preview handlers removed

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
  
  // File URL function removed
  
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
                        {/* Preview button removed */}
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
      
      {/* Material Preview Dialog removed */}
      
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