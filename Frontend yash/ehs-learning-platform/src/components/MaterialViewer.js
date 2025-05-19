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
import VideoPlayer from './VideoPlayer';

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
        // Use custom VideoPlayer component to handle video embedding
        return (
          <Box sx={{ width: '100%', height: '600px' }}>
            <VideoPlayer 
              driveFileId={driveFileId}
              title={title}
              driveFileUrl={driveFileUrl}
            />
          </Box>
        );

      case 'PPT':
        // For PowerPoint files, use Google Drive preview iframe
        return (
          <Box sx={{ width: '100%', height: '600px' }}>
            <iframe
              src={`https://drive.google.com/file/d/${driveFileId}/preview`}
              width="100%"
              height="100%"
              frameBorder="0"
              title={title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
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
      maxWidth="xl"
      fullWidth
      sx={{
        '& .MuiDialog-paper': {
          height: '90vh',
          maxHeight: '90vh'
        }
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">{material?.title}</Typography>
          <Button onClick={onClose} color="primary">
            <CloseIcon />
          </Button>
        </Box>
      </DialogTitle>
      <DialogContent sx={{ p: 0, overflow: 'hidden' }}>
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