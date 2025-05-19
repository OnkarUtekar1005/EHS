import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Button,
  IconButton,
  Slider,
  Tooltip
} from '@mui/material';
import {
  PlayArrow,
  Pause,
  VolumeUp,
  VolumeOff,
  Fullscreen,
  FullscreenExit
} from '@mui/icons-material';
import { materialService } from '../services/api';

const CourseMaterialViewer = ({ materialData, materialId, onProgressUpdate, initialProgress = 0 }) => {
  const [material, setMaterial] = useState(materialData);
  const [loading, setLoading] = useState(!materialData);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(initialProgress);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const progressIntervalRef = useRef(null);
  const lastUpdateRef = useRef(initialProgress);

  useEffect(() => {
    if (!materialData && materialId) {
      loadMaterial();
    }
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, [materialId, materialData]);

  const loadMaterial = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (materialId) {
        // Load material details from API
        const response = await materialService.getMaterialById(materialId);
        console.log('Material response:', response.data);
        setMaterial(response.data);
      } else {
        setError('No material ID provided');
      }
    } catch (err) {
      console.error('Error loading material:', err);
      setError('Failed to load material');
    } finally {
      setLoading(false);
    }
  };

  const updateProgress = (newProgress) => {
    const rounded = Math.round(newProgress);
    setProgress(rounded);
    
    // Update parent component every 10% progress
    if (Math.floor(rounded / 10) > Math.floor(lastUpdateRef.current / 10)) {
      onProgressUpdate?.(rounded);
      lastUpdateRef.current = rounded;
    }
  };

  const handleVideoTimeUpdate = () => {
    if (videoRef.current && videoRef.current.duration) {
      const currentProgress = (videoRef.current.currentTime / videoRef.current.duration) * 100;
      updateProgress(currentProgress);
    }
  };

  const handleDocumentScroll = (event) => {
    const element = event.target;
    const scrollProgress = (element.scrollTop / (element.scrollHeight - element.clientHeight)) * 100;
    updateProgress(Math.min(scrollProgress, 100));
  };

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleVolumeChange = (event, newValue) => {
    if (videoRef.current) {
      videoRef.current.volume = newValue;
      setVolume(newValue);
      setIsMuted(newValue === 0);
    }
  };

  const handleMuteToggle = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleFullscreen = () => {
    if (!isFullscreen) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
    setIsFullscreen(!isFullscreen);
  };

  const renderPdfViewer = () => {
    const driveId = material.driveFileId;
    const driveUrl = material.googleDriveUrl || material.filePath || material.driveFileUrl;
    
    // First try driveFileId
    let fileId = driveId;
    
    // If no driveFileId, try to extract from URL
    if (!fileId && driveUrl) {
      if (driveUrl.includes('drive.google.com')) {
        const fileIdMatch = driveUrl.match(/(?:drive\.google\.com\/file\/d\/|drive\.google\.com\/open\?id=)([a-zA-Z0-9_-]+)/);
        fileId = fileIdMatch ? fileIdMatch[1] : null;
      } else {
        fileId = driveUrl; // Assume it's just a file ID
      }
    }
    
    if (!fileId) {
      return (
        <Alert severity="error">No PDF file available</Alert>
      );
    }
    
    // Use the preview URL for PDFs
    const embedUrl = `https://drive.google.com/file/d/${fileId}/preview`;
    
    return (
      <Box sx={{ width: '100%', height: '600px', position: 'relative' }}>
        <iframe
          src={embedUrl}
          width="100%"
          height="100%"
          frameBorder="0"
          title={material.title}
          onLoad={() => updateProgress(100)}
          allow="autoplay"
        />
      </Box>
    );
  };

  const renderVideoPlayer = () => {
    const driveId = material.driveFileId;
    const driveUrl = material.googleDriveUrl || material.filePath || material.driveFileUrl;
    
    // First try driveFileId
    let fileId = driveId;
    
    // If no driveFileId, try to extract from URL
    if (!fileId && driveUrl) {
      if (driveUrl.includes('drive.google.com')) {
        const fileIdMatch = driveUrl.match(/(?:drive\.google\.com\/file\/d\/|drive\.google\.com\/open\?id=)([a-zA-Z0-9_-]+)/);
        fileId = fileIdMatch ? fileIdMatch[1] : null;
      } else {
        fileId = driveUrl; // Assume it's just a file ID
      }
    }
    
    if (!fileId) {
      return (
        <Alert severity="error">No video file available</Alert>
      );
    }
    
    // Use the preview URL for videos
    const embedUrl = `https://drive.google.com/file/d/${fileId}/preview`;
    
    return (
      <Box sx={{ position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden' }}>
        <iframe
          src={embedUrl}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            border: 0
          }}
          allowFullScreen
          title={material.title}
          onLoad={() => updateProgress(100)}
        />
      </Box>
    );
  };

  const renderDocumentViewer = () => {
    const driveId = material.driveFileId;
    const driveUrl = material.googleDriveUrl || material.filePath || material.driveFileUrl;
    
    // First try driveFileId
    let fileId = driveId;
    
    // If no driveFileId, try to extract from URL
    if (!fileId && driveUrl) {
      if (driveUrl.includes('drive.google.com')) {
        const fileIdMatch = driveUrl.match(/(?:drive\.google\.com\/file\/d\/|drive\.google\.com\/open\?id=)([a-zA-Z0-9_-]+)/);
        fileId = fileIdMatch ? fileIdMatch[1] : null;
      } else {
        fileId = driveUrl; // Assume it's just a file ID
      }
    }
    
    if (!fileId) {
      return (
        <Alert severity="error">No document file available</Alert>
      );
    }
    
    // Use the preview URL for documents
    const embedUrl = `https://drive.google.com/file/d/${fileId}/preview`;
    
    return (
      <Box sx={{ width: '100%', height: '600px' }}>
        <iframe
          src={embedUrl}
          width="100%"
          height="100%"
          frameBorder="0"
          title={material.title}
          onLoad={() => updateProgress(100)}
          allow="autoplay"
        />
      </Box>
    );
  };

  const renderContent = () => {
    if (!material) return null;

    switch (material.type) {
      case 'PDF':
        return renderPdfViewer();
      case 'VIDEO':
      case 'MP4':
        return renderVideoPlayer();
      case 'PPT':
      case 'PPTX':
      case 'DOC':
      case 'DOCX':
        return renderDocumentViewer();
      default:
        const driveId = material.driveFileId;
        const driveUrl = material.googleDriveUrl || material.filePath || material.driveFileUrl;
        
        // Try to create a Google Drive URL
        let viewUrl = driveUrl;
        if (driveId && !driveUrl) {
          viewUrl = `https://drive.google.com/file/d/${driveId}/view`;
        }
        
        return (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h6" gutterBottom>
              {material.title}
            </Typography>
            {viewUrl && (
              <Button
                variant="contained"
                onClick={() => window.open(viewUrl, '_blank')}
              >
                Open in Google Drive
              </Button>
            )}
          </Box>
        );
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error">{error}</Alert>
    );
  }

  return (
    <Box ref={containerRef} sx={{ width: '100%' }}>
      {renderContent()}
    </Box>
  );
};

export default CourseMaterialViewer;