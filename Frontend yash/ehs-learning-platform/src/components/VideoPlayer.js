import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Alert,
  CircularProgress
} from '@mui/material';
import { OpenInNew as OpenInNewIcon } from '@mui/icons-material';

const VideoPlayer = ({ driveFileId, title, driveFileUrl }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const handleIframeLoad = () => {
    setLoading(false);
  };

  const handleIframeError = () => {
    setLoading(false);
    setError(true);
  };

  // Try different embed URLs for better compatibility
  const embedUrls = [
    `https://drive.google.com/file/d/${driveFileId}/preview?embedded=true`,
    `https://drive.google.com/file/d/${driveFileId}/preview`,
    driveFileUrl
  ];

  const [currentUrlIndex, setCurrentUrlIndex] = useState(0);

  const tryNextUrl = () => {
    if (currentUrlIndex < embedUrls.length - 1) {
      setError(false);
      setLoading(true);
      setCurrentUrlIndex(currentUrlIndex + 1);
    }
  };

  if (error && currentUrlIndex >= embedUrls.length - 1) {
    return (
      <Box sx={{ 
        textAlign: 'center', 
        py: { xs: 3, sm: 4 },
        px: { xs: 2, sm: 3 },
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <Alert 
          severity="warning" 
          sx={{ 
            mb: { xs: 2, sm: 3 },
            fontSize: { xs: '0.875rem', sm: '1rem' },
            width: '100%',
            maxWidth: '500px'
          }}
        >
          This video cannot be embedded due to browser security restrictions.
          Google Drive videos may require authentication or have embedding restrictions.
        </Alert>
        <Typography 
          variant="h6" 
          gutterBottom
          sx={{
            fontSize: { xs: '1.125rem', sm: '1.25rem' },
            wordBreak: 'break-word',
            textAlign: 'center',
            px: { xs: 1, sm: 0 }
          }}
        >
          {title}
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<OpenInNewIcon />}
          onClick={() => window.open(`https://drive.google.com/file/d/${driveFileId}/view`, '_blank')}
          sx={{ 
            mt: { xs: 1.5, sm: 2 },
            px: { xs: 3, sm: 4 },
            py: { xs: 1.5, sm: 1 },
            fontSize: { xs: '0.875rem', sm: '1rem' },
            width: { xs: '100%', sm: 'auto' },
            maxWidth: { xs: '300px', sm: 'none' }
          }}
        >
          Open Video in Google Drive
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      width: '100%', 
      height: '100%', 
      position: 'relative',
      borderRadius: { xs: 1, sm: 2 },
      overflow: 'hidden',
      bgcolor: 'black'
    }}>
      {loading && (
        <Box sx={{ 
          position: 'absolute', 
          top: '50%', 
          left: '50%', 
          transform: 'translate(-50%, -50%)',
          zIndex: 10,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 2
        }}>
          <CircularProgress sx={{ color: 'white' }} />
          <Typography 
            variant="body2" 
            sx={{ 
              color: 'white',
              fontSize: { xs: '0.75rem', sm: '0.875rem' }
            }}
          >
            Loading video...
          </Typography>
        </Box>
      )}
      
      <iframe
        key={currentUrlIndex}
        src={embedUrls[currentUrlIndex]}
        width="100%"
        height="100%"
        frameBorder="0"
        title={title}
        allow="autoplay; fullscreen; picture-in-picture"
        allowFullScreen
        onLoad={handleIframeLoad}
        onError={() => {
          handleIframeError();
          tryNextUrl();
        }}
        style={{ 
          display: loading ? 'none' : 'block',
          border: 'none',
          borderRadius: window.innerWidth < 600 ? '4px' : '8px'
        }}
      />
    </Box>
  );
};

export default VideoPlayer;