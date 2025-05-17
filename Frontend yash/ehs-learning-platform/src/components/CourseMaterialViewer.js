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
      // This assumes we have an endpoint to get material details
      // For now, we'll use the material data passed as prop
      if (materialId) {
        // Mock material data structure based on the ID
        const mockMaterial = {
          id: materialId,
          title: 'Material',
          type: 'PDF',
          driveFileId: materialId,
          driveFileUrl: `https://drive.google.com/file/d/${materialId}/view`
        };
        setMaterial(mockMaterial);
      } else {
        setError('No material ID provided');
      }
    } catch (err) {
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
    return (
      <Box sx={{ width: '100%', height: '600px', position: 'relative' }}>
        <iframe
          src={`https://drive.google.com/file/d/${material.driveFileId}/preview`}
          width="100%"
          height="100%"
          frameBorder="0"
          title={material.title}
          onLoad={() => updateProgress(100)}
        />
      </Box>
    );
  };

  const renderVideoPlayer = () => {
    return (
      <Box sx={{ width: '100%', position: 'relative' }}>
        <video
          ref={videoRef}
          width="100%"
          controls={false}
          onTimeUpdate={handleVideoTimeUpdate}
          onEnded={() => updateProgress(100)}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
        >
          <source src={material.driveFileUrl} type={`video/${material.type.toLowerCase()}`} />
          Your browser does not support the video tag.
        </video>
        
        {/* Custom video controls */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 2, 
          p: 2, 
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          color: 'white'
        }}>
          <IconButton onClick={handlePlayPause} color="inherit">
            {isPlaying ? <Pause /> : <PlayArrow />}
          </IconButton>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 200 }}>
            <IconButton onClick={handleMuteToggle} color="inherit">
              {isMuted ? <VolumeOff /> : <VolumeUp />}
            </IconButton>
            <Slider
              value={volume}
              onChange={handleVolumeChange}
              min={0}
              max={1}
              step={0.1}
              sx={{ color: 'white' }}
            />
          </Box>
          
          <Box sx={{ flexGrow: 1 }} />
          
          <IconButton onClick={handleFullscreen} color="inherit">
            {isFullscreen ? <FullscreenExit /> : <Fullscreen />}
          </IconButton>
        </Box>
      </Box>
    );
  };

  const renderDocumentViewer = () => {
    return (
      <Box 
        sx={{ 
          width: '100%', 
          height: '600px', 
          overflow: 'auto' 
        }}
        onScroll={handleDocumentScroll}
      >
        <iframe
          src={`https://drive.google.com/file/d/${material.driveFileId}/preview`}
          width="100%"
          height="100%"
          frameBorder="0"
          title={material.title}
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
        return (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h6" gutterBottom>
              {material.title}
            </Typography>
            <Button
              variant="contained"
              onClick={() => window.open(material.driveFileUrl, '_blank')}
            >
              Open in Google Drive
            </Button>
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