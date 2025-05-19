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
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Alert severity="warning" sx={{ mb: 3 }}>
          This video cannot be embedded due to browser security restrictions.
          Google Drive videos may require authentication or have embedding restrictions.
        </Alert>
        <Typography variant="h6" gutterBottom>
          {title}
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<OpenInNewIcon />}
          onClick={() => window.open(`https://drive.google.com/file/d/${driveFileId}/view`, '_blank')}
          sx={{ mt: 2 }}
        >
          Open Video in Google Drive
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', height: '100%', position: 'relative' }}>
      {loading && (
        <Box sx={{ 
          position: 'absolute', 
          top: '50%', 
          left: '50%', 
          transform: 'translate(-50%, -50%)',
          zIndex: 10
        }}>
          <CircularProgress />
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
          border: 'none'
        }}
      />
    </Box>
  );
};

export default VideoPlayer;