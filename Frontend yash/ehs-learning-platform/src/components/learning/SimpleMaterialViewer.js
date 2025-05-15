import React, { useState, useEffect } from 'react';
import {
  Box, Typography, CircularProgress, Alert, Button,
  Paper, Divider, IconButton, Tooltip
} from '@mui/material';
import {
  OpenInNew, Download, CheckCircle, PictureAsPdf,
  VideoLibrary, Description, Article, InsertDriveFile
} from '@mui/icons-material';

/**
 * Simple Material Viewer Component
 * A minimalist viewer that leverages browser's native capabilities to display files
 * with a fallback to direct download for unsupported types.
 */
const SimpleMaterialViewer = ({ material, onComplete }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fileUrl, setFileUrl] = useState(null);

  useEffect(() => {
    if (!material || !material.id) {
      setError("No material provided");
      setLoading(false);
      return;
    }

    // Check if this is an external URL or HTML content
    if (material.externalUrl && material.externalUrl.trim() !== '') {
      setFileUrl(material.externalUrl);
      setLoading(false);
      
      // Mark as viewed
      if (onComplete) {
        onComplete(material.id, { progress: 75 });
      }
      return;
    }

    if (material.content && material.fileType === 'HTML') {
      // For HTML content, we don't need a file URL
      setLoading(false);
      
      // Mark as viewed
      if (onComplete) {
        onComplete(material.id, { progress: 75 });
      }
      return;
    }

    // For file-based materials, get the URL
    const token = localStorage.getItem('token');
    const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:8080';
    const url = `${baseUrl}/api/materials/${material.id}/stream?token=${encodeURIComponent(token || '')}`;
    
    setFileUrl(url);
    setLoading(false);
    
    // Mark material as started
    if (onComplete) {
      onComplete(material.id, { progress: 50 });
    }
  }, [material, onComplete]);

  // Handle marking as complete
  const handleMarkComplete = () => {
    if (onComplete) {
      onComplete(material.id, { progress: 100 });
    }
  };

  // Get file icon based on type
  const getFileIcon = () => {
    if (!material || !material.fileType) return <InsertDriveFile />;
    
    const type = material.fileType.toUpperCase();
    if (type === 'PDF') return <PictureAsPdf />;
    if (type === 'VIDEO' || type === 'MP4') return <VideoLibrary />;
    if (type === 'DOCUMENT' || type === 'DOC' || type === 'DOCX') return <Description />;
    if (type === 'HTML') return <Article />;
    
    return <InsertDriveFile />;
  };

  // Render HTML content
  const renderHtmlContent = () => {
    if (!material.content) return null;
    
    return (
      <Box 
        sx={{ 
          height: '100%', 
          overflow: 'auto', 
          p: 3,
          '& img': { maxWidth: '100%' },
          '& iframe': { maxWidth: '100%' } 
        }}
        dangerouslySetInnerHTML={{ __html: material.content }}
      />
    );
  };

  // Render file viewer
  const renderFileViewer = () => {
    if (!fileUrl) return null;
    
    // Check if this is an external URL
    if (material.externalUrl) {
      return (
        <iframe
          src={fileUrl}
          title={material.title || "External Content"}
          width="100%"
          height="100%"
          style={{ border: 'none' }}
        />
      );
    }
    
    // For file-based materials, use simple iframe
    return (
      <iframe
        src={fileUrl}
        title={material.title || "Content"}
        width="100%"
        height="100%"
        style={{ border: 'none' }}
      />
    );
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box sx={{ width: '100%' }}>
      {/* Header with title and icons */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {getFileIcon()}
          <Typography variant="h6" sx={{ ml: 1 }}>
            {material.title}
          </Typography>
        </Box>
        
        <Box>
          {/* Actions */}
          <Tooltip title="Open in New Tab">
            <IconButton onClick={() => window.open(fileUrl, '_blank')}>
              <OpenInNew />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Download">
            <IconButton 
              onClick={() => {
                // For direct download, we add download parameter
                const downloadUrl = `${fileUrl}&download=true`;
                window.open(downloadUrl, '_blank');
              }}
            >
              <Download />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
      
      {/* Description if available */}
      {material.description && (
        <Typography variant="body2" color="text.secondary" gutterBottom>
          {material.description}
        </Typography>
      )}
      
      {/* Content viewer */}
      <Paper 
        elevation={3} 
        sx={{ 
          height: '600px', 
          width: '100%',
          overflow: 'hidden',
          mb: 2
        }}
      >
        {material.content && material.fileType === 'HTML' 
          ? renderHtmlContent() 
          : renderFileViewer()
        }
      </Paper>
      
      <Divider sx={{ my: 2 }} />
      
      {/* Bottom actions */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          color="primary"
          startIcon={<CheckCircle />}
          onClick={handleMarkComplete}
          disabled={material.completed}
        >
          {material.completed ? "Already Completed" : "Mark as Completed"}
        </Button>
      </Box>
    </Box>
  );
};

export default SimpleMaterialViewer;