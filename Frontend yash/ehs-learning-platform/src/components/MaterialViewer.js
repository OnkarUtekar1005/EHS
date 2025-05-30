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
        // Use iframe for PDFs with Google Drive preview - Mobile Responsive
        return (
          <Box sx={{ 
            width: '100%', 
            height: { xs: '400px', sm: '500px', md: '600px' },
            position: 'relative'
          }}>
            <iframe
              src={driveFileUrl}
              width="100%"
              height="100%"
              frameBorder="0"
              title={title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              style={{
                border: 'none',
                borderRadius: '8px'
              }}
            />
          </Box>
        );

      case 'VIDEO':
        // Use custom VideoPlayer component to handle video embedding - Mobile Responsive
        return (
          <Box sx={{ 
            width: '100%', 
            height: { xs: '300px', sm: '400px', md: '500px', lg: '600px' },
            position: 'relative'
          }}>
            <VideoPlayer 
              driveFileId={driveFileId}
              title={title}
              driveFileUrl={driveFileUrl}
            />
          </Box>
        );

      case 'PPT':
        // For PowerPoint files, use Google Drive preview iframe - Mobile Responsive
        return (
          <Box sx={{ 
            width: '100%', 
            height: { xs: '400px', sm: '500px', md: '600px' },
            position: 'relative'
          }}>
            <iframe
              src={`https://drive.google.com/file/d/${driveFileId}/preview`}
              width="100%"
              height="100%"
              frameBorder="0"
              title={title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              style={{
                border: 'none',
                borderRadius: '8px'
              }}
            />
          </Box>
        );

      default:
        return (
          <Box sx={{ 
            textAlign: 'center', 
            py: { xs: 3, sm: 4 },
            px: { xs: 2, sm: 3 }
          }}>
            <Typography 
              variant="h6" 
              gutterBottom
              sx={{
                fontSize: { xs: '1.125rem', sm: '1.25rem' },
                wordBreak: 'break-word'
              }}
            >
              {title}
            </Typography>
            <Button
              variant="contained"
              color="primary"
              onClick={() => window.open(driveFileUrl, '_blank')}
              sx={{
                mt: 2,
                px: { xs: 3, sm: 4 },
                py: { xs: 1.5, sm: 1 },
                fontSize: { xs: '0.875rem', sm: '1rem' }
              }}
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
      maxWidth={window.innerWidth < 600 ? false : "xl"}
      fullWidth={window.innerWidth >= 600}
      fullScreen={window.innerWidth < 600}
      sx={{
        '& .MuiDialog-paper': {
          height: { xs: '100vh', sm: '90vh' },
          maxHeight: { xs: '100vh', sm: '90vh' },
          margin: { xs: 0, sm: 2 },
          borderRadius: { xs: 0, sm: 1 }
        }
      }}
    >
      <DialogTitle sx={{ pb: { xs: 1, sm: 2 } }}>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          flexDirection: { xs: 'column', sm: 'row' },
          gap: { xs: 1, sm: 0 }
        }}>
          <Typography 
            variant="h6"
            sx={{
              fontSize: { xs: '1.125rem', sm: '1.25rem' },
              wordBreak: 'break-word',
              textAlign: { xs: 'center', sm: 'left' },
              flex: 1
            }}
          >
            {material?.title}
          </Typography>
          <Button 
            onClick={onClose} 
            color="primary"
            sx={{
              minWidth: { xs: '100%', sm: 'auto' },
              mt: { xs: 1, sm: 0 }
            }}
          >
            <CloseIcon />
          </Button>
        </Box>
      </DialogTitle>
      <DialogContent sx={{ 
        p: { xs: 1, sm: 0 }, 
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {renderContent()}
      </DialogContent>
      <DialogActions sx={{ 
        flexDirection: { xs: 'column', sm: 'row' },
        gap: { xs: 1, sm: 0 },
        p: { xs: 2, sm: 1 }
      }}>
        <Button 
          onClick={onClose}
          sx={{
            width: { xs: '100%', sm: 'auto' },
            order: { xs: 2, sm: 1 }
          }}
        >
          Close
        </Button>
        <Button
          variant="outlined"
          onClick={() => window.open(material?.driveFileUrl, '_blank')}
          sx={{
            width: { xs: '100%', sm: 'auto' },
            order: { xs: 1, sm: 2 }
          }}
        >
          Open in New Tab
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default MaterialViewer;