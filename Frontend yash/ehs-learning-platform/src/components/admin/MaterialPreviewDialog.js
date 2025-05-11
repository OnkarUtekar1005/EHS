// src/components/admin/MaterialPreviewDialog.js
import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Box,
  Typography,
  CircularProgress,
  Button,
  Alert
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';

/**
 * Material Preview Dialog - Displays learning materials in a modal dialog
 * Uses direct iframe embedding with no blob URLs or complex state management
 */
const MaterialPreviewDialog = ({ open, material, onClose }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Get the direct URL path for the material
  const getDirectUrl = (id) => {
    return `/api/materials/${id}/stream?preview=true`;
  };
  
  // Get Google Docs viewer URL for PDFs and documents
  const getGoogleViewerUrl = (id) => {
    const fileUrl = window.location.origin + getDirectUrl(id);
    return `https://docs.google.com/viewer?url=${encodeURIComponent(fileUrl)}&embedded=true`;
  };
  
  // Handle iframe load events
  const handleIframeLoad = () => {
    setIsLoading(false);
  };
  
  // Handle iframe error events
  const handleIframeError = () => {
    setError("Failed to load preview. Try opening in a new tab.");
    setIsLoading(false);
  };
  
  // Render content based on material type
  const renderContent = () => {
    if (!material || !material.id) {
      return <Typography align="center">No preview available</Typography>;
    }
    
    const fileType = material.fileType ? material.fileType.toUpperCase() : '';
    const directUrl = getDirectUrl(material.id);
    
    // Show HTML content directly
    if (material.content) {
      return (
        <Box sx={{ height: '600px', overflow: 'auto', p: 2 }}>
          <div dangerouslySetInnerHTML={{ __html: material.content }} />
        </Box>
      );
    }
    
    // Show external URL in iframe
    if (material.externalUrl) {
      return (
        <Box sx={{ height: '600px', position: 'relative' }}>
          {isLoading && (
            <Box position="absolute" top="50%" left="50%" sx={{ transform: 'translate(-50%, -50%)' }}>
              <CircularProgress />
            </Box>
          )}
          <iframe
            src={material.externalUrl}
            width="100%"
            height="100%"
            title={material.title || 'External content'}
            onLoad={handleIframeLoad}
            onError={handleIframeError}
            style={{ border: 'none' }}
          />
          <Button 
            sx={{ position: 'absolute', top: 10, right: 10 }}
            variant="contained"
            color="primary"
            size="small"
            href={material.externalUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            Open in New Tab
          </Button>
        </Box>
      );
    }
    
    // PDF preview
    if (fileType.includes('PDF')) {
      return (
        <Box sx={{ height: '600px', position: 'relative' }}>
          {isLoading && (
            <Box position="absolute" top="50%" left="50%" sx={{ transform: 'translate(-50%, -50%)' }}>
              <CircularProgress />
            </Box>
          )}
          
          <iframe
            src={directUrl}
            width="100%"
            height="100%"
            title={material.title || 'PDF Preview'}
            onLoad={handleIframeLoad}
            onError={handleIframeError}
            style={{ border: 'none' }}
          />
          
          <Box sx={{ position: 'absolute', bottom: 10, right: 10, display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              color="primary"
              size="small"
              href={directUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              Open PDF
            </Button>
            <Button
              variant="outlined"
              size="small"
              href={getGoogleViewerUrl(material.id)}
              target="_blank"
              rel="noopener noreferrer"
            >
              Google Viewer
            </Button>
          </Box>
        </Box>
      );
    }
    
    // Video preview
    if (fileType.includes('VIDEO')) {
      return (
        <Box sx={{ height: '600px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
          {isLoading && <CircularProgress />}
          <video
            controls
            autoPlay={false}
            style={{ maxWidth: '100%', maxHeight: '500px' }}
            onLoadedData={() => setIsLoading(false)}
            onError={() => {
              setError("Unable to load video preview");
              setIsLoading(false);
            }}
          >
            <source src={directUrl} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
          <Button
            variant="contained"
            color="primary"
            sx={{ mt: 2 }}
            href={directUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            Open Video
          </Button>
        </Box>
      );
    }
    
    // Image preview
    if (fileType.includes('IMAGE')) {
      return (
        <Box sx={{ height: '600px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', p: 2 }}>
          {isLoading && <CircularProgress />}
          <img
            src={directUrl}
            alt={material.title || 'Image preview'}
            style={{ 
              maxWidth: '100%', 
              maxHeight: '500px', 
              objectFit: 'contain',
              boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
              display: isLoading ? 'none' : 'block'
            }}
            onLoad={() => setIsLoading(false)}
            onError={() => {
              setError("Unable to load image preview");
              setIsLoading(false);
            }}
          />
          <Button
            variant="contained"
            color="primary"
            sx={{ mt: 2 }}
            href={directUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            Open Image
          </Button>
        </Box>
      );
    }
    
    // For other file types, show download option
    return (
      <Box sx={{ height: '600px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', p: 4 }}>
        <Typography variant="h6" gutterBottom>
          {material.title || 'Document Preview'}
        </Typography>
        <Typography variant="body1" color="textSecondary" align="center" paragraph>
          This file type ({fileType}) cannot be previewed directly in the browser.
        </Typography>
        <Button
          variant="contained"
          color="primary"
          href={directUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          Open in New Tab
        </Button>
      </Box>
    );
  };
  
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
    >
      <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">
          {material ? material.title || 'Material Preview' : 'Material Preview'}
        </Typography>
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{ color: theme => theme.palette.grey[500] }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent dividers>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        {renderContent()}
      </DialogContent>
    </Dialog>
  );
};

export default MaterialPreviewDialog;