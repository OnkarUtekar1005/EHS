import React from 'react';
import {
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  CircularProgress,
  Alert
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';

const MaterialViewer = ({ open, onClose, material }) => {
  if (!material) return null;

  const renderContent = () => {
    const { type, driveFileUrl, driveFileId, title } = material;

    switch (type) {
      case 'PDF':
        // Use iframe for PDFs with Google Drive preview
        return (
          <Box sx={{ width: '100%', height: '600px' }}>
            <iframe
              src={driveFileUrl}
              width="100%"
              height="100%"
              frameBorder="0"
              title={title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </Box>
        );

      case 'VIDEO':
        // For videos, provide multiple options
        return (
          <Box sx={{ width: '100%' }}>
            <Typography variant="h6" gutterBottom>
              {title}
            </Typography>
            <Typography variant="body2" color="textSecondary" paragraph>
              Video preview may not load in embedded view. Choose an option below:
            </Typography>
            
            {/* Try direct video embed first */}
            <Box sx={{ mb: 3 }}>
              <video 
                controls 
                width="100%" 
                height="400px"
                style={{ backgroundColor: '#000' }}
              >
                <source 
                  src={`https://drive.google.com/uc?export=download&id=${driveFileId}`} 
                  type="video/mp4" 
                />
                Your browser does not support the video tag.
              </video>
            </Box>

            {/* Provide alternative options */}
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                color="primary"
                onClick={() => window.open(driveFileUrl, '_blank')}
              >
                Open in Google Drive
              </Button>
              <Button
                variant="outlined"
                color="primary"
                onClick={() => window.open(`https://drive.google.com/uc?export=download&id=${driveFileId}`, '_blank')}
              >
                Download Video
              </Button>
            </Box>
          </Box>
        );

      case 'PPT':
        // For PowerPoint files, provide an option to open in new tab
        return (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h6" gutterBottom>
              {title}
            </Typography>
            <Typography variant="body2" color="textSecondary" paragraph>
              PowerPoint presentations can be viewed in Google Drive
            </Typography>
            <Button
              variant="contained"
              color="primary"
              onClick={() => window.open(driveFileUrl, '_blank')}
            >
              Open in Google Drive
            </Button>
          </Box>
        );

      default:
        return (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h6" gutterBottom>
              {title}
            </Typography>
            <Button
              variant="contained"
              color="primary"
              onClick={() => window.open(driveFileUrl, '_blank')}
            >
              Open in Google Drive
            </Button>
          </Box>
        );
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">{material?.title}</Typography>
          <Button onClick={onClose} color="primary">
            <CloseIcon />
          </Button>
        </Box>
      </DialogTitle>
      <DialogContent>
        {renderContent()}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
        <Button
          variant="outlined"
          onClick={() => window.open(material?.driveFileUrl, '_blank')}
        >
          Open in New Tab
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default MaterialViewer;