// src/components/learning/EnhancedMaterialViewer.js
import React, { useState, useEffect, useRef } from 'react';
import { 
  Box, Typography, CircularProgress, Alert, Paper, 
  Button, IconButton, Divider, Snackbar, Tab, Tabs,
  Switch, FormControlLabel, useTheme, useMediaQuery
} from '@mui/material';
import { 
  ZoomIn, ZoomOut, FullscreenExit, Fullscreen, Description,
  FileDownload, Image, PictureAsPdf, VideoLibrary, InsertDriveFile,
  OpenInNew, Refresh, ArrowBack, ArrowForward, CheckCircle
} from '@mui/icons-material';
import { learningMaterialService } from '../../services/api';

/**
 * Enhanced Material Viewer Component
 * A universal viewer for various file types with advanced features:
 * - Support for multiple document viewers with fallbacks
 * - Improved handling of different file types
 * - Support for byte-range requests for video streaming
 * - Better error handling and user experience
 */
const EnhancedMaterialViewer = ({ material, onComplete, onError }) => {
  // State management
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fileUrl, setFileUrl] = useState(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [fileType, setFileType] = useState(null);
  const [viewerType, setViewerType] = useState(0); // 0: Default, 1: Alternate, 2: Native
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [zoomLevel, setZoomLevel] = useState(100);
  const [viewerError, setViewerError] = useState(false);
  const iframeRef = useRef(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Generate the file URL with authentication 
  useEffect(() => {
    if (!material || !material.id) {
      setError("No material provided");
      setLoading(false);
      return;
    }

    // Set the file type
    if (material.fileType) {
      setFileType(material.fileType.toUpperCase());
    }
    
    // Automatically select the appropriate viewer type based on file type
    if (material.fileType) {
      const type = material.fileType.toUpperCase();
      if (['DOC', 'DOCX', 'DOCUMENT'].includes(type)) {
        setViewerType(0); // Microsoft Office viewer by default for docs
      } else if (type === 'PDF') {
        setViewerType(0); // PDF.js embedded viewer for PDFs
      } else {
        setViewerType(0); // Default viewer for others
      }
    }

    // Get the direct URL with proper token handling
    const token = localStorage.getItem('token');
    const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:8080';
    
    // Add cache-busting parameter for fresh content
    const cacheBuster = new Date().getTime();
    const directUrl = `${baseUrl}/api/materials/${material.id}/stream?cacheBuster=${cacheBuster}&token=${encodeURIComponent(token || '')}`;
    
    console.log("Generated file URL:", directUrl);
    setFileUrl(directUrl);
    setLoading(false);
    
    // Mark material as started immediately
    if (onComplete && typeof onComplete === 'function') {
      try {
        onComplete(material.id, { progress: 50 });
      } catch (err) {
        console.warn("Could not update initial progress:", err);
      }
    }

    // Cleanup function
    return () => {
      if (iframeRef.current) {
        iframeRef.current.src = "about:blank";
      }
    };
  }, [material, onComplete]);

  // Toggle fullscreen mode
  const toggleFullscreen = () => {
    setFullscreen(!fullscreen);
  };

  // Mark as completed
  const handleMarkComplete = () => {
    if (onComplete && typeof onComplete === 'function') {
      onComplete(material.id, { progress: 100 });
      
      // Show completion notification
      setSnackbarMessage('Material marked as completed!');
      setSnackbarOpen(true);
    }
  };

  // Handle zoom controls
  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 10, 200));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 10, 50));
  };

  // Handle viewer type change
  const handleViewerTypeChange = (event, newValue) => {
    setViewerType(newValue);
    setViewerError(false); // Reset error state when changing viewers
    
    // Show notification
    const viewerNames = ['Primary', 'Alternative', 'Native Browser'];
    setSnackbarMessage(`Switched to ${viewerNames[newValue]} viewer`);
    setSnackbarOpen(true);
  };

  // Handle viewer errors - cascade to fallback viewers
  const handleViewerError = () => {
    console.error(`Viewer type ${viewerType} failed to load content`);
    setViewerError(true);
    
    // Automatically try next viewer type
    if (viewerType < 2) {
      setSnackbarMessage('Viewer failed to load content. Trying alternative viewer...');
      setSnackbarOpen(true);
      setViewerType(viewerType + 1);
    } else {
      setError('All viewers failed to load this content. Try downloading the file directly.');
    }
  };

  // Styles for container in fullscreen and regular modes
  const containerStyle = fullscreen 
    ? { 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        right: 0, 
        bottom: 0, 
        zIndex: 9999, 
        backgroundColor: 'white', 
        padding: 3, 
        overflow: 'auto' 
      }
    : {};

  // Get file type icon
  const getFileIcon = () => {
    if (!fileType) return <InsertDriveFile />;
    
    if (fileType === 'PDF') return <PictureAsPdf />;
    if (['VIDEO', 'MP4'].includes(fileType)) return <VideoLibrary />;
    if (['IMAGE', 'JPG', 'JPEG', 'PNG', 'GIF'].includes(fileType)) return <Image />;
    if (['DOC', 'DOCX', 'DOCUMENT'].includes(fileType)) return <Description />;
    
    return <InsertDriveFile />;
  };

  // Determine file type label
  const getFileTypeLabel = () => {
    if (!fileType) return "Document";
    
    if (fileType === 'PDF') return "PDF Document";
    if (['VIDEO', 'MP4'].includes(fileType)) return "Video";
    if (['IMAGE', 'JPG', 'JPEG', 'PNG', 'GIF'].includes(fileType)) return "Image";
    if (['DOC', 'DOCX', 'DOCUMENT'].includes(fileType)) return "Word Document";
    if (['PPT', 'PPTX', 'PRESENTATION'].includes(fileType)) return "Presentation";
    
    return "Document";
  };

  // Refresh the current viewer
  const handleRefresh = () => {
    if (iframeRef.current) {
      const currentSrc = iframeRef.current.src;
      iframeRef.current.src = "about:blank";
      setTimeout(() => {
        if (iframeRef.current) {
          iframeRef.current.src = currentSrc;
        }
      }, 100);
    }
    
    setSnackbarMessage('Refreshing viewer...');
    setSnackbarOpen(true);
  };

  // Loading state
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
        <CircularProgress />
      </Box>
    );
  }

  // Error state
  if (error) {
    return (
      <Box>
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
        <Button 
          variant="contained" 
          color="primary"
          startIcon={<FileDownload />}
          onClick={() => window.open(fileUrl, '_blank')}
        >
          Download File
        </Button>
      </Box>
    );
  }

  if (!material) {
    return <Alert severity="info">No material selected</Alert>;
  }

  // File type detection
  const isImage = fileType && ['IMAGE', 'JPG', 'JPEG', 'PNG', 'GIF'].includes(fileType);
  const isVideo = fileType && ['VIDEO', 'MP4'].includes(fileType);
  const isWordDoc = fileType && ['DOC', 'DOCX', 'DOCUMENT'].includes(fileType);
  const isPdf = fileType && fileType === 'PDF';
  const isPresentation = fileType && ['PPT', 'PPTX', 'PRESENTATION'].includes(fileType);
  const isExternalUrl = material.externalUrl && material.externalUrl.trim() !== '';
  
  // Content viewer logic based on file type and viewer type
  const renderContent = () => {
    // If material has external URL, prioritize it
    if (isExternalUrl) {
      return (
        <iframe
          ref={iframeRef}
          src={material.externalUrl}
          title={material.title || "External Content"}
          width="100%"
          height="100%"
          style={{ border: 'none' }}
          sandbox="allow-scripts allow-same-origin"
          onLoad={() => {
            console.log('External content iframe loaded successfully');
            if (onComplete) onComplete(material.id, { progress: 75 });
          }}
          onError={handleViewerError}
        />
      );
    }
    
    // If material has direct HTML content
    if (material.content && material.fileType === 'HTML') {
      return (
        <Box 
          sx={{ 
            height: '100%', 
            overflow: 'auto', 
            p: 3,
            '& img': { maxWidth: '100%' },
            '& iframe': { maxWidth: '100%' },
            transform: `scale(${zoomLevel/100})`,
            transformOrigin: 'top left',
            transition: 'transform 0.2s ease'
          }}
          dangerouslySetInnerHTML={{ __html: material.content }}
        />
      );
    }
    
    // Image viewer
    if (isImage) {
      return (
        <Box sx={{ 
          height: '100%', 
          display: 'flex', 
          justifyContent: 'center',
          alignItems: 'center',
          p: 2,
          overflow: 'auto'
        }}>
          <img 
            src={fileUrl}
            alt={material.title || "Image"}
            style={{ 
              maxWidth: `${zoomLevel}%`, 
              maxHeight: `${zoomLevel}%`,
              objectFit: 'contain',
              transition: 'max-width 0.2s ease, max-height 0.2s ease'
            }}
            onLoad={() => {
              if (onComplete) onComplete(material.id, { progress: 75 });
            }}
            onError={handleViewerError}
          />
        </Box>
      );
    }
    
    // Video viewer with controls
    if (isVideo) {
      return (
        <Box sx={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column' }}>
          <video 
            src={fileUrl}
            controls
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            controlsList="nodownload" // Prevent download from video controls
            onLoadedData={() => {
              if (onComplete) onComplete(material.id, { progress: 75 });
            }}
            onError={handleViewerError}
            onEnded={() => {
              if (onComplete) onComplete(material.id, { progress: 100 });
            }}
          />
        </Box>
      );
    }
    
    // Office documents (Word, PowerPoint)
    if ((isWordDoc || isPresentation) && viewerType === 0) {
      // Microsoft Office viewer - primary choice for Office documents
      return (
        <iframe
          ref={iframeRef}
          src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(fileUrl)}`}
          width="100%"
          height="100%"
          frameBorder="0"
          title={`${material.title || "Document"} - Office Viewer`}
          onLoad={() => {
            console.log('Microsoft Office viewer loaded');
            if (onComplete) onComplete(material.id, { progress: 75 });
          }}
          onError={handleViewerError}
        />
      );
    }
    
    if ((isWordDoc || isPresentation) && viewerType === 1) {
      // Google Docs viewer - fallback for Office documents
      return (
        <iframe
          ref={iframeRef}
          src={`https://docs.google.com/viewer?url=${encodeURIComponent(fileUrl)}&embedded=true`}
          width="100%"
          height="100%"
          frameBorder="0"
          title={`${material.title || "Document"} - Google Docs Viewer`}
          onLoad={() => {
            console.log('Google Docs viewer loaded');
            if (onComplete) onComplete(material.id, { progress: 75 });
          }}
          onError={handleViewerError}
        />
      );
    }
    
    // PDF viewer
    if (isPdf && viewerType === 0) {
      // PDF.js viewer (embedded) - primary choice for PDFs
      return (
        <iframe
          ref={iframeRef}
          src={`${process.env.PUBLIC_URL}/pdfjs/web/viewer.html?file=${encodeURIComponent(fileUrl)}`}
          width="100%"
          height="100%"
          frameBorder="0"
          title={`${material.title || "PDF"} - PDF.js Viewer`}
          onLoad={() => {
            console.log('PDF.js viewer loaded');
            if (onComplete) onComplete(material.id, { progress: 75 });
          }}
          onError={handleViewerError}
        />
      );
    }
    
    // Default viewer - last resort for any file type
    return (
      <iframe
        ref={iframeRef}
        src={fileUrl}
        title={material.title || "Content Viewer"}
        width="100%"
        height="100%"
        style={{ border: 'none' }}
        sandbox="allow-scripts allow-same-origin"
        onLoad={() => {
          console.log('Default iframe viewer loaded');
          if (onComplete) onComplete(material.id, { progress: 75 });
        }}
        onError={handleViewerError}
      />
    );
  };

  // Determine if we should show viewer tabs
  const shouldShowViewerTabs = (isPdf || isWordDoc || isPresentation) && !isImage && !isVideo;
  
  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="h6" gutterBottom>
        {material.completed && 
          <CheckCircle color="success" sx={{ verticalAlign: 'middle', mr: 1 }} />
        }
        {material.title}
      </Typography>
      
      {material.description && (
        <Typography variant="body2" color="text.secondary" gutterBottom>
          {material.description}
        </Typography>
      )}
      
      <Box sx={containerStyle}>
        {fullscreen && (
          <Button 
            variant="outlined" 
            onClick={toggleFullscreen}
            startIcon={<FullscreenExit />}
            sx={{ position: 'absolute', top: 10, right: 10, zIndex: 10 }}
          >
            Exit Fullscreen
          </Button>
        )}
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, alignItems: 'center' }}>
          <Typography variant="subtitle1" sx={{ display: 'flex', alignItems: 'center' }}>
            {getFileIcon()} 
            <span style={{ marginLeft: '8px' }}>{getFileTypeLabel()}</span>
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {/* Zoom controls - only show for appropriate content */}
            {(isImage || material.content) && (
              <>
                <IconButton onClick={handleZoomOut} disabled={zoomLevel <= 50}>
                  <ZoomOut />
                </IconButton>
                <Typography variant="body2" sx={{ mx: 1 }}>
                  {zoomLevel}%
                </Typography>
                <IconButton onClick={handleZoomIn} disabled={zoomLevel >= 200}>
                  <ZoomIn />
                </IconButton>
              </>
            )}
            
            {/* Refresh button */}
            <IconButton onClick={handleRefresh} sx={{ ml: 1 }}>
              <Refresh />
            </IconButton>
            
            {/* Fullscreen toggle */}
            <IconButton onClick={toggleFullscreen} sx={{ ml: 1 }}>
              {fullscreen ? <FullscreenExit /> : <Fullscreen />}
            </IconButton>
          </Box>
        </Box>
        
        {/* Viewer tabs for documents */}
        {shouldShowViewerTabs && (
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
            <Tabs 
              value={viewerType} 
              onChange={handleViewerTypeChange}
              variant={isMobile ? "fullWidth" : "standard"}
            >
              <Tab label="Primary Viewer" />
              <Tab label="Alternative Viewer" />
              <Tab label="Native Browser" />
            </Tabs>
          </Box>
        )}
        
        {/* Main content viewer */}
        <Paper elevation={3} sx={{ 
          height: fullscreen ? 'calc(100vh - 200px)' : '600px', 
          width: '100%',
          overflow: 'hidden',
          position: 'relative'
        }}>
          {/* Error overlay */}
          {viewerError && (
            <Box 
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0,0,0,0.7)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                zIndex: 5,
                p: 3,
                color: 'white'
              }}
            >
              <Typography variant="h6" gutterBottom>
                Viewer failed to load content
              </Typography>
              <Typography variant="body2" gutterBottom sx={{ mb: 3 }}>
                The current viewer couldn't display this content properly.
                Try a different viewer or download the file directly.
              </Typography>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button 
                  variant="contained" 
                  color="primary"
                  onClick={() => setViewerError(false)}
                >
                  Retry
                </Button>
                <Button 
                  variant="outlined"
                  color="inherit"
                  onClick={() => window.open(fileUrl, '_blank')}
                >
                  Download / Open in New Tab
                </Button>
              </Box>
            </Box>
          )}
          
          {/* Content renderer based on file type */}
          {renderContent()}
        </Paper>
        
        <Divider sx={{ my: 2 }} />
        
        {/* Bottom controls */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
          <Button 
            variant="outlined"
            color="secondary"
            onClick={() => window.open(fileUrl, '_blank')}
            startIcon={<OpenInNew />}
          >
            Open in New Tab
          </Button>
          
          <Button 
            variant="contained" 
            onClick={handleMarkComplete}
            color="primary"
            startIcon={<CheckCircle />}
            disabled={material.completed}
          >
            {material.completed ? 'Already Completed' : 'Mark as Completed'}
          </Button>
        </Box>
      </Box>
      
      {/* Notification snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
      />
    </Box>
  );
};

export default EnhancedMaterialViewer;