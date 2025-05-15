// src/components/learning/FileTypeTest.js
import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Button, Paper, Grid, Card, 
  CardContent, CircularProgress, Alert
} from '@mui/material';
import EnhancedMaterialViewer from './EnhancedMaterialViewer';

/**
 * Test component to verify different file types are handled correctly
 */
const FileTypeTest = () => {
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [testMaterials, setTestMaterials] = useState([]);
  const [error, setError] = useState(null);

  // Set up test files of different types
  useEffect(() => {
    // Create sample materials for each file type
    const samples = [
      {
        id: 'pdf-test',
        title: 'PDF Test Document',
        description: 'Test PDF file to verify PDF viewing works correctly',
        fileType: 'PDF',
        filePath: '8834e83d-3fcf-487b-a5d8-27eefaa1a730.pdf' // Use an existing PDF from uploads
      },
      {
        id: 'docx-test',
        title: 'Word Document Test',
        description: 'Test DOCX file to verify Word document viewing works correctly',
        fileType: 'DOCX',
        filePath: '420d6fb1-b951-47be-854b-ad65b61bf6e6.docx' // Use an existing DOCX from uploads
      },
      {
        id: 'image-test',
        title: 'Image Test',
        description: 'Test image file to verify image viewing works correctly',
        fileType: 'PNG',
        filePath: 'bb6abb45-9d6c-45ab-b74c-6872417e30c6.png' // Use an existing image from uploads
      },
      {
        id: 'video-test',
        title: 'Video Test',
        description: 'Test video file to verify video playback works correctly',
        fileType: 'MP4',
        filePath: 'f7ca1de9-adab-4895-9502-4d1d5c3bc725.mp4' // Use an existing video from uploads
      }
    ];

    setTestMaterials(samples);
  }, []);

  // Handle file type selection
  const handleSelectFile = (material) => {
    setLoading(true);
    setError(null);

    // Simulate API call to get file - in a real scenario this would be an actual API call
    setTimeout(() => {
      setSelectedFile({
        ...material,
        // Create a full URL to the file
        url: `${process.env.REACT_APP_API_URL || 'http://localhost:8080'}/api/materials/stream?filename=${material.filePath}&token=${encodeURIComponent(localStorage.getItem('token') || '')}`
      });
      setLoading(false);
    }, 500);
  };

  // Handle completion
  const handleComplete = (materialId, data) => {
    console.log(`Material ${materialId} marked as completed with data:`, data);
  };

  // Handle error
  const handleError = (error) => {
    setError(`Error loading file: ${error.message || 'Unknown error'}`);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>File Type Testing</Typography>
      <Typography variant="body1" paragraph>
        This component lets you test viewing different file types with the EnhancedMaterialViewer.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Select a file type to test:</Typography>
            
            {testMaterials.map(material => (
              <Card 
                key={material.id} 
                variant="outlined" 
                sx={{ mb: 2, cursor: 'pointer', '&:hover': { boxShadow: 3 } }}
                onClick={() => handleSelectFile(material)}
              >
                <CardContent>
                  <Typography variant="h6">{material.title}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {material.description}
                  </Typography>
                  <Typography variant="caption" color="primary">
                    File type: {material.fileType}
                  </Typography>
                </CardContent>
              </Card>
            ))}
          </Paper>
        </Grid>

        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2, minHeight: '600px' }}>
            <Typography variant="h6" gutterBottom>File Viewer:</Typography>
            
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '500px' }}>
                <CircularProgress />
              </Box>
            ) : selectedFile ? (
              <EnhancedMaterialViewer
                material={selectedFile}
                onComplete={handleComplete}
                onError={handleError}
              />
            ) : (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '500px' }}>
                <Typography variant="body1" color="text.secondary">
                  Select a file from the left to view it here
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default FileTypeTest;