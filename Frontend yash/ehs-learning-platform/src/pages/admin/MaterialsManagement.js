import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Paper,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Chip,
  TextField,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  LinearProgress,
  Alert,
  Tooltip,
  useTheme
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Description as FileIcon,
  PictureAsPdf as PdfIcon,
  VideoLibrary as VideoIcon,
  Slideshow as PptIcon
} from '@mui/icons-material';
import api from '../../services/api';
import MaterialViewer from '../../components/MaterialViewer';

const MaterialsManagement = () => {
  const theme = useTheme();
  const location = useLocation();
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openUploadDialog, setOpenUploadDialog] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [uploadError, setUploadError] = useState('');
  const [previewMaterial, setPreviewMaterial] = useState(null);
  const [openPreview, setOpenPreview] = useState(false);
  
  const [uploadData, setUploadData] = useState({
    title: '',
    description: '',
    file: null,
    type: ''
  });

  useEffect(() => {
    fetchMaterials();
  }, []);

  // Check for quick action state to auto-open upload dialog
  useEffect(() => {
    if (location.state?.openUploadModal) {
      setOpenUploadDialog(true);
      // Clear the state to prevent reopening on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  const fetchMaterials = async () => {
    setLoading(true);
    try {
      const response = await api.get('/v2/materials');
      setMaterials(response.data || []);
    } catch (error) {
      console.error('Error fetching materials:', error);
      setMaterials([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenUploadDialog = (material = null) => {
    if (material) {
      setSelectedMaterial(material);
      setUploadData({
        title: material.title,
        description: material.description || '',
        file: null,
        type: material.type
      });
    } else {
      setSelectedMaterial(null);
      setUploadData({
        title: '',
        description: '',
        file: null,
        type: ''
      });
    }
    setOpenUploadDialog(true);
    setUploadError('');
  };

  const handleCloseUploadDialog = () => {
    setOpenUploadDialog(false);
    setSelectedMaterial(null);
    setUploadData({
      title: '',
      description: '',
      file: null,
      type: ''
    });
    setUploadError('');
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Determine file type
    const extension = file.name.toLowerCase();
    let type = '';
    
    if (extension.endsWith('.pdf')) {
      type = 'PDF';
    } else if (extension.match(/\.(mp4|webm|ogg)$/)) {
      type = 'VIDEO';
    } else if (extension.match(/\.(ppt|pptx)$/)) {
      type = 'PPT';
    } else {
      setUploadError('Invalid file type. Only PDF, videos (MP4, WebM, OGG), and PowerPoint files are allowed.');
      return;
    }

    setUploadData(prev => ({
      ...prev,
      file: file,
      type: type,
      title: prev.title || file.name.replace(/\.[^/.]+$/, '') // Set title from filename if empty
    }));
    setUploadError('');
  };

  const handleUpload = async () => {
    console.log('=== MATERIAL UPLOAD STARTED ===');
    console.log('Upload data:', uploadData);
    
    if (!uploadData.file || !uploadData.title) {
      console.error('Missing required fields');
      setUploadError('Please select a file and provide a title');
      return;
    }

    console.log('File details:', {
      name: uploadData.file.name,
      size: uploadData.file.size,
      type: uploadData.file.type
    });

    setUploading(true);
    setUploadError('');

    try {
      const formData = new FormData();
      formData.append('file', uploadData.file);
      formData.append('title', uploadData.title);
      formData.append('description', uploadData.description);
      formData.append('type', uploadData.type);

      // Log FormData contents
      console.log('FormData entries:');
      for (let [key, value] of formData.entries()) {
        console.log(`${key}:`, value);
      }

      console.log('Sending request to server...');
      const response = await api.post('/v2/materials/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      console.log('Upload response:', response.data);
      
      await fetchMaterials();
      handleCloseUploadDialog();
      console.log('=== MATERIAL UPLOAD COMPLETED ===');
    } catch (error) {
      console.error('=== MATERIAL UPLOAD ERROR ===');
      console.error('Full error:', error);
      console.error('Response data:', error.response?.data);
      console.error('Response status:', error.response?.status);
      console.error('Response headers:', error.response?.headers);
      
      const errorMessage = error.response?.data?.message || 'Failed to upload file. Please try again.';
      console.error('Error message to display:', errorMessage);
      setUploadError(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (materialId) => {
    if (!window.confirm('Are you sure you want to delete this material?')) {
      return;
    }

    try {
      await api.delete(`/v2/materials/${materialId}`);
      await fetchMaterials();
    } catch (error) {
      console.error('Error deleting material:', error);
      console.error('Failed to delete material');
    }
  };

  const getFileIcon = (type) => {
    switch (type) {
      case 'PDF':
        return <PdfIcon />;
      case 'VIDEO':
        return <VideoIcon />;
      case 'PPT':
        return <PptIcon />;
      default:
        return <FileIcon />;
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handlePageChange = (event, newPage) => {
    setPage(newPage);
  };

  const handleRowsPerPageChange = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const filteredMaterials = materials.filter(material =>
    material.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    material.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
        <Box sx={{ mb: 4, textAlign: { xs: 'center', sm: 'left' }, width: '100%' }}>
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
            Materials Management
          </Typography>
          <Typography
            variant="subtitle1"
            color="textSecondary"
            sx={{ 
              mb: 3,
              fontSize: { xs: '0.875rem', sm: '1rem' }
            }}
          >
            Upload and manage learning materials for courses
          </Typography>
        </Box>

        {/* Search and Actions - Mobile Responsive */}
        <Box sx={{ 
          display: 'flex', 
          gap: { xs: 1.5, sm: 2 }, 
          mb: 3, 
          flexWrap: 'wrap',
          flexDirection: { xs: 'column', sm: 'row' }
        }}>
          <TextField
            placeholder="Search materials..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={{ 
              flex: 1, 
              minWidth: { xs: '100%', sm: '300px' },
              order: { xs: 1, sm: 1 }
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

          <Button
            variant="contained"
            startIcon={<UploadIcon />}
            onClick={() => handleOpenUploadDialog()}
            sx={{
              order: { xs: 2, sm: 2 },
              width: { xs: '100%', sm: 'auto' },
              minHeight: { xs: 48, sm: 36 }
            }}
            size={window.innerWidth < 600 ? "large" : "medium"}
          >
            Upload Material
          </Button>
        </Box>

        {loading ? (
          <LinearProgress />
        ) : filteredMaterials.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="body1" color="textSecondary">
              No materials found. Upload your first material to get started.
            </Typography>
          </Paper>
        ) : (
          <>
            {/* Mobile Card View */}
            <Box sx={{ display: { xs: 'block', md: 'none' }, mb: 3 }}>
              {filteredMaterials
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((material) => (
                <Paper
                  key={material.id}
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
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                    <Box sx={{ mr: 2 }}>
                      {getFileIcon(material.type)}
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography 
                        variant="subtitle1" 
                        sx={{ 
                          fontWeight: 600,
                          fontSize: '1rem',
                          mb: 0.5,
                          wordBreak: 'break-word'
                        }}
                      >
                        {material.title}
                      </Typography>
                      {material.description && (
                        <Typography 
                          variant="body2" 
                          color="text.secondary" 
                          sx={{ 
                            fontSize: '0.875rem', 
                            mb: 1,
                            wordBreak: 'break-word'
                          }}
                        >
                          {material.description}
                        </Typography>
                      )}
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
                        <Chip label={material.type} size="small" sx={{ fontSize: '0.75rem' }} />
                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                          {formatFileSize(material.fileSize)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                          {new Date(material.createdAt).toLocaleDateString()}
                        </Typography>
                      </Box>
                    </Box>
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
                      startIcon={<ViewIcon />}
                      onClick={() => {
                        setPreviewMaterial(material);
                        setOpenPreview(true);
                      }}
                      sx={{ flex: 1, minWidth: 0 }}
                    >
                      View
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<EditIcon />}
                      onClick={() => handleOpenUploadDialog(material)}
                      sx={{ flex: 1, minWidth: 0 }}
                    >
                      Edit
                    </Button>
                    <IconButton
                      size="small"
                      onClick={() => handleDelete(material.id)}
                      color="error"
                      sx={{ 
                        border: '1px solid',
                        borderColor: 'error.main',
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
                    <TableCell>Type</TableCell>
                    <TableCell>Size</TableCell>
                    <TableCell>Uploaded</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredMaterials
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((material) => (
                      <TableRow key={material.id}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {getFileIcon(material.type)}
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                {material.title}
                              </Typography>
                              {material.description && (
                                <Typography variant="caption" color="textSecondary">
                                  {material.description}
                                </Typography>
                              )}
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip label={material.type} size="small" />
                        </TableCell>
                        <TableCell>{formatFileSize(material.fileSize)}</TableCell>
                        <TableCell>
                          {new Date(material.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Tooltip title="View">
                            <IconButton
                              size="small"
                              onClick={() => {
                                setPreviewMaterial(material);
                                setOpenPreview(true);
                              }}
                            >
                              <ViewIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Edit">
                            <IconButton
                              size="small"
                              onClick={() => handleOpenUploadDialog(material)}
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton
                              size="small"
                              onClick={() => handleDelete(material.id)}
                              color="error"
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </TableContainer>
            
            {/* Pagination - Mobile Responsive */}
            <Box sx={{ mt: 2 }}>
              <TablePagination
                component="div"
                count={filteredMaterials.length}
                page={page}
                onPageChange={handlePageChange}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={handleRowsPerPageChange}
                rowsPerPageOptions={[5, 10, 25]}
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

        {/* Upload/Edit Dialog */}
      <Dialog 
        open={openUploadDialog} 
        onClose={handleCloseUploadDialog} 
        maxWidth="sm" 
        fullWidth
        sx={{
          '& .MuiDialog-paper': {
            margin: { xs: 1, sm: 2 },
            width: { xs: 'calc(100% - 16px)', sm: 'auto' }
          }
        }}
      >
        <DialogTitle>
          {selectedMaterial ? 'Edit Material' : 'Upload New Material'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="Title"
              value={uploadData.title}
              onChange={(e) => setUploadData(prev => ({ ...prev, title: e.target.value }))}
              sx={{ mb: 2 }}
              required
            />

            <TextField
              fullWidth
              label="Description"
              value={uploadData.description}
              onChange={(e) => setUploadData(prev => ({ ...prev, description: e.target.value }))}
              multiline
              rows={3}
              sx={{ mb: 2 }}
            />

            {!selectedMaterial && (
              <Box sx={{ mb: 2 }}>
                <input
                  type="file"
                  id="file-upload"
                  style={{ display: 'none' }}
                  onChange={handleFileSelect}
                  accept=".pdf,.mp4,.webm,.ogg,.ppt,.pptx"
                />
                <label htmlFor="file-upload">
                  <Button
                    component="span"
                    variant="outlined"
                    startIcon={<UploadIcon />}
                    fullWidth
                  >
                    Select File
                  </Button>
                </label>

                {uploadData.file && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2" gutterBottom>
                      Selected: {uploadData.file.name}
                    </Typography>
                    <Typography variant="body2" gutterBottom>
                      Type: {uploadData.type}
                    </Typography>
                    <Typography variant="body2">
                      Size: {formatFileSize(uploadData.file.size)}
                    </Typography>
                  </Box>
                )}
              </Box>
            )}

            {uploadError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {uploadError}
              </Alert>
            )}

            {uploading && <LinearProgress sx={{ mb: 2 }} />}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseUploadDialog} disabled={uploading}>
            Cancel
          </Button>
          <Button
            onClick={handleUpload}
            variant="contained"
            disabled={uploading || !uploadData.title || (!selectedMaterial && !uploadData.file)}
          >
            {uploading ? 'Uploading...' : selectedMaterial ? 'Update' : 'Upload'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Material Preview */}
      <MaterialViewer
        open={openPreview}
        onClose={() => {
          setOpenPreview(false);
          setPreviewMaterial(null);
        }}
        material={previewMaterial}
      />
      </Container>
    </Box>
  );
};

export default MaterialsManagement;