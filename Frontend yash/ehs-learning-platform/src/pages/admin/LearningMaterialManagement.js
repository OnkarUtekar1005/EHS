
// src/pages/admin/LearningMaterialManagement.js
import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  TextField,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CloudUpload as UploadIcon,
  FilterList as FilterIcon,
  Search as SearchIcon,
  VideoLibrary as VideoIcon,
  PictureAsPdf as PdfIcon,
  Slideshow as PresentationIcon,
  Description as DocumentIcon,
  Code as HtmlIcon,
  Link as LinkIcon,
  Image as ImageIcon
} from '@mui/icons-material';
import { learningMaterialService, componentService } from '../../services/api';
import LearningMaterialCreator from './LearningMaterialCreator';

const LearningMaterialManagement = () => {
  // State
  const [loading, setLoading] = useState(false);
  const [components, setComponents] = useState([]);
  const [selectedComponent, setSelectedComponent] = useState(null);
  const [materials, setMaterials] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Dialog state
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogType, setDialogType] = useState('');
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  
  // Initial load of components with learning materials
  useEffect(() => {
    fetchComponents();
  }, []);
  
  // Load materials when a component is selected
  useEffect(() => {
    if (selectedComponent) {
      fetchMaterials(selectedComponent.id);
    }
  }, [selectedComponent]);
  
  // Fetch all module components that can have learning materials
  const fetchComponents = async () => {
    try {
      setLoading(true);
      // This would be a real API call in production
      // Mock data for demonstration
      setComponents([
        { id: '1', title: 'Fire Safety Basics', moduleTitle: 'Fire Safety', type: 'LEARNING_MATERIALS' },
        { id: '2', title: 'Chemical Safety Materials', moduleTitle: 'Chemical Handling', type: 'LEARNING_MATERIALS' },
        { id: '3', title: 'First Aid Resources', moduleTitle: 'First Aid', type: 'LEARNING_MATERIALS' }
      ]);
    } catch (err) {
      console.error('Error fetching components:', err);
      setError('Failed to load components');
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch materials for a component
  const fetchMaterials = async (componentId) => {
    try {
      setLoading(true);
      // This would be a real API call in production
      // const response = await learningMaterialService.getMaterialsByComponent(componentId);
      // setMaterials(response.data);
      
      // Mock data for demonstration
      setMaterials([
        { 
          id: 'm1', 
          title: 'Fire Safety PDF Guide', 
          description: 'Comprehensive guide for fire safety procedures', 
          fileType: 'PDF',
          estimatedDuration: 15,
          sequenceOrder: 1
        },
        { 
          id: 'm2', 
          title: 'Fire Extinguisher Usage Video', 
          description: 'Video showing proper fire extinguisher usage', 
          fileType: 'VIDEO',
          estimatedDuration: 8,
          sequenceOrder: 2
        },
        { 
          id: 'm3', 
          title: 'Emergency Exit Procedures', 
          description: 'HTML content with emergency exit instructions', 
          fileType: 'HTML',
          estimatedDuration: 5,
          sequenceOrder: 3
        }
      ]);
    } catch (err) {
      console.error('Error fetching materials:', err);
      setError('Failed to load learning materials');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle component selection
  const handleComponentChange = (event) => {
    const componentId = event.target.value;
    const component = components.find(comp => comp.id === componentId);
    setSelectedComponent(component);
  };
  
  // Handle search input change
  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };
  
  // Handle filter change
  const handleFilterChange = (event) => {
    setTypeFilter(event.target.value);
  };
  
  // Open dialog to add new material
  const handleAddMaterial = () => {
    setDialogType('add');
    setSelectedMaterial(null);
    setOpenDialog(true);
  };
  
  // Open dialog to edit material
  const handleEditMaterial = (material) => {
    setDialogType('edit');
    setSelectedMaterial(material);
    setOpenDialog(true);
  };
  
  // Delete material
   // Delete material
   const handleDeleteMaterial = async (materialId) => {
    // Use Dialog instead of confirm
    if (window.confirm('Are you sure you want to delete this material? This action cannot be undone.')) {
      try {
        setLoading(true);
        // await learningMaterialService.deleteMaterial(materialId);
        
        // Update local state (mock implementation)
        setMaterials(materials.filter(m => m.id !== materialId));
        setSuccess('Learning material deleted successfully');
      } catch (err) {
        console.error('Error deleting material:', err);
        setError('Failed to delete learning material');
      } finally {
        setLoading(false);
      }
    }
  };
  
  // Close dialog
  const handleCloseDialog = () => {
    setOpenDialog(false);
  };
  
  // Save material from dialog
  const handleSaveMaterial = (updatedMaterials) => {
    setMaterials(updatedMaterials);
    setOpenDialog(false);
    setSuccess('Learning materials saved successfully');
  };
  
  // Get icon for material type
  const getMaterialIcon = (type) => {
    switch (type) {
      case 'PDF':
        return <PdfIcon />;
      case 'VIDEO':
        return <VideoIcon />;
      case 'PRESENTATION':
        return <PresentationIcon />;
      case 'DOCUMENT':
        return <DocumentIcon />;
      case 'HTML':
        return <HtmlIcon />;
      case 'IMAGE':
        return <ImageIcon />;
      case 'EXTERNAL':
        return <LinkIcon />;
      default:
        return <DocumentIcon />;
    }
  };
  
  // Filter materials based on search and type filter
  const filteredMaterials = materials.filter(material => {
    const matchesSearch = !searchTerm || 
      material.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (material.description && material.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesType = !typeFilter || material.fileType === typeFilter;
    
    return matchesSearch && matchesType;
  });
  
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Learning Materials Management</Typography>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />}
          onClick={handleAddMaterial}
          disabled={!selectedComponent}
        >
          Add Material
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
        <Box mb={3}>
          <Typography variant="h6" gutterBottom>
            Select Component
          </Typography>
          
          <FormControl fullWidth>
            <InputLabel id="component-select-label">Learning Materials Component</InputLabel>
            <Select
              labelId="component-select-label"
              value={selectedComponent ? selectedComponent.id : ''}
              onChange={handleComponentChange}
              label="Learning Materials Component"
            >
              <MenuItem value="">
                <em>Select a component</em>
              </MenuItem>
              {components.map((component) => (
                <MenuItem key={component.id} value={component.id}>
                  {component.moduleTitle} - {component.title}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
        
        {selectedComponent && (
          <>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">
                Materials for: {selectedComponent.title}
              </Typography>
              
              <Box display="flex" gap={2}>
                <TextField
                  size="small"
                  label="Search Materials"
                  variant="outlined"
                  value={searchTerm}
                  onChange={handleSearchChange}
                  InputProps={{
                    startAdornment: <SearchIcon fontSize="small" sx={{ mr: 1 }} />
                  }}
                />
                
                <FormControl size="small" sx={{ minWidth: 150 }}>
                  <InputLabel id="type-filter-label">Filter by Type</InputLabel>
                  <Select
                    labelId="type-filter-label"
                    value={typeFilter}
                    onChange={handleFilterChange}
                    label="Filter by Type"
                  >
                    <MenuItem value="">All Types</MenuItem>
                    <MenuItem value="PDF">PDF</MenuItem>
                    <MenuItem value="VIDEO">Video</MenuItem>
                    <MenuItem value="PRESENTATION">Presentation</MenuItem>
                    <MenuItem value="DOCUMENT">Document</MenuItem>
                    <MenuItem value="HTML">HTML Content</MenuItem>
                    <MenuItem value="IMAGE">Image</MenuItem>
                    <MenuItem value="EXTERNAL">External Link</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            </Box>
            
            {loading ? (
              <Box display="flex" justifyContent="center" my={4}>
                <CircularProgress />
              </Box>
            ) : filteredMaterials.length === 0 ? (
              <Box p={3} textAlign="center" border="1px dashed #ccc" borderRadius={1}>
                <Typography color="textSecondary" paragraph>
                  No learning materials found. Add your first material.
                </Typography>
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={handleAddMaterial}
                >
                  Add Learning Material
                </Button>
              </Box>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Seq</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Title</TableCell>
                      <TableCell>Description</TableCell>
                      <TableCell>Duration</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredMaterials.map((material) => (
                      <TableRow key={material.id}>
                        <TableCell>{material.sequenceOrder}</TableCell>
                        <TableCell>
                          <Box display="flex" alignItems="center">
                            {getMaterialIcon(material.fileType)}
                            <Typography variant="body2" sx={{ ml: 1 }}>
                              {material.fileType}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>{material.title}</TableCell>
                        <TableCell>{material.description}</TableCell>
                        <TableCell>{material.estimatedDuration} min</TableCell>
                        <TableCell align="right">
                          <IconButton 
                            size="small" 
                            onClick={() => handleEditMaterial(material)}
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton 
                            size="small" 
                            onClick={() => handleDeleteMaterial(material.id)}
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
          </>
        )}
      </Paper>
      
      {/* Material Dialog */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        fullWidth
        maxWidth="lg"
      >
        <DialogContent sx={{ p: 0 }}>
          <LearningMaterialCreator
            componentId={selectedComponent ? selectedComponent.id : null}
            initialMaterials={materials}
            onSave={handleSaveMaterial}
            onCancel={handleCloseDialog}
          />
        </DialogContent>
      </Dialog>
    </Container>
  );
};

export default LearningMaterialManagement;