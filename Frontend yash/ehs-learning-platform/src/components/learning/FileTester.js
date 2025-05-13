// src/components/learning/FileTester.js
import React, { useState } from 'react';
import { 
  Box, Button, TextField, Typography, Paper, Divider,
  MenuItem, Select, FormControl, InputLabel, CircularProgress, Alert
} from '@mui/material';

/**
 * A component for testing file viewing/streaming
 * This is a developer tool to help debug issues with file streaming
 */
const FileTester = () => {
  const [materialId, setMaterialId] = useState('');
  const [viewType, setViewType] = useState('iframe');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:8080';
  const fileUrl = materialId ? `${baseUrl}/api/materials/${materialId}/stream` : '';

  const handleTest = () => {
    if (!materialId) {
      setError('Please enter a material ID');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (viewType === 'new-tab') {
        window.open(fileUrl, '_blank');
      }
      
      // Other view types are rendered in the UI
      setLoading(false);
    } catch (err) {
      console.error('Error testing file:', err);
      setError('An error occurred while testing the file');
      setLoading(false);
    }
  };

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Typography variant="h5" gutterBottom>File Viewer Tester</Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        This tool helps test file streaming directly from the API. Enter a material ID and select a view type.
      </Typography>

      <Box sx={{ my: 2 }}>
        <TextField
          fullWidth
          label="Material ID"
          value={materialId}
          onChange={(e) => setMaterialId(e.target.value)}
          sx={{ mb: 2 }}
          placeholder="e.g. 123e4567-e89b-12d3-a456-426614174000"
        />

        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel id="view-type-label">View Type</InputLabel>
          <Select
            labelId="view-type-label"
            value={viewType}
            label="View Type"
            onChange={(e) => setViewType(e.target.value)}
          >
            <MenuItem value="iframe">Iframe Embed</MenuItem>
            <MenuItem value="img">Image</MenuItem>
            <MenuItem value="video">Video</MenuItem>
            <MenuItem value="new-tab">Open in New Tab</MenuItem>
          </Select>
        </FormControl>

        <Button 
          variant="contained" 
          onClick={handleTest} 
          disabled={!materialId || loading}
          fullWidth
        >
          {loading ? <CircularProgress size={24} /> : 'Test File Viewer'}
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ my: 2 }}>{error}</Alert>
      )}

      {materialId && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle1">Generated URL:</Typography>
          <Typography 
            variant="body2" 
            sx={{ 
              backgroundColor: '#f5f5f5', 
              p: 1, 
              borderRadius: 1,
              wordBreak: 'break-all'
            }}
          >
            {fileUrl}
          </Typography>
        </Box>
      )}

      <Divider sx={{ my: 3 }} />

      {materialId && viewType === 'iframe' && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle1" gutterBottom>Iframe Preview:</Typography>
          <Box sx={{ border: '1px solid #ddd', borderRadius: 1, height: '400px' }}>
            <iframe 
              src={fileUrl}
              style={{ width: '100%', height: '100%', border: 'none' }}
              title="File Preview"
            />
          </Box>
        </Box>
      )}

      {materialId && viewType === 'img' && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle1" gutterBottom>Image Preview:</Typography>
          <Box sx={{ textAlign: 'center' }}>
            <img 
              src={fileUrl}
              alt="File Preview"
              style={{ maxWidth: '100%', maxHeight: '400px' }}
              onError={(e) => {
                console.error('Image load error:', e);
                setError('Failed to load image. Check if the material ID is valid and is an image file.');
              }}
            />
          </Box>
        </Box>
      )}

      {materialId && viewType === 'video' && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle1" gutterBottom>Video Preview:</Typography>
          <Box sx={{ textAlign: 'center' }}>
            <video
              controls
              style={{ maxWidth: '100%', maxHeight: '400px' }}
              onError={(e) => {
                console.error('Video load error:', e);
                setError('Failed to load video. Check if the material ID is valid and is a video file.');
              }}
            >
              <source src={fileUrl} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </Box>
        </Box>
      )}
    </Paper>
  );
};

export default FileTester;