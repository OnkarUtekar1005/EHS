// src/components/learning/LearningMaterialCard.js
import React from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Box,
  Button,
  Chip,
  LinearProgress,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  OpenInNew as OpenInNewIcon,
  PlayArrow as PlayArrowIcon,
  PictureAsPdf as PdfIcon,
  VideoLibrary as VideoIcon,
  Slideshow as PresentationIcon,
  Description as DocumentIcon,
  Code as HtmlIcon,
  Image as ImageIcon,
  Link as LinkIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';

const LearningMaterialCard = ({ 
  material, 
  onView, 
  showProgress = true 
}) => {
  // Get icon based on material type
  const getMaterialIcon = () => {
    switch (material.fileType) {
      case 'PDF':
        return <PdfIcon fontSize="large" color="primary" />;
      case 'VIDEO':
        return <VideoIcon fontSize="large" color="error" />;
      case 'PRESENTATION':
        return <PresentationIcon fontSize="large" color="secondary" />;
      case 'DOCUMENT':
        return <DocumentIcon fontSize="large" color="info" />;
      case 'HTML':
        return <HtmlIcon fontSize="large" color="primary" />;
      case 'IMAGE':
        return <ImageIcon fontSize="large" color="success" />;
      case 'EXTERNAL':
        return <LinkIcon fontSize="large" color="warning" />;
      default:
        return <DocumentIcon fontSize="large" color="action" />;
    }
  };
  
  // Get type label
  const getTypeLabel = () => {
    switch (material.fileType) {
      case 'PDF':
        return 'PDF Document';
      case 'VIDEO':
        return 'Video';
      case 'PRESENTATION':
        return 'Presentation';
      case 'DOCUMENT':
        return 'Document';
      case 'HTML':
        return 'Web Content';
      case 'IMAGE':
        return 'Image';
      case 'EXTERNAL':
        return 'External Link';
      default:
        return material.fileType;
    }
  };
  
  return (
    <Card variant="outlined" sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flexGrow: 1 }}>
        <Box display="flex" alignItems="center" mb={2}>
          {getMaterialIcon()}
          <Box ml={2}>
            <Typography variant="h6" component="div" noWrap>
              {material.title}
            </Typography>
            <Chip 
              label={getTypeLabel()}
              size="small"
              sx={{ mt: 0.5 }}
            />
          </Box>
        </Box>
        
        {material.description && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              mb: 2
            }}
          >
            {material.description}
          </Typography>
        )}
        
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="body2" color="text.secondary">
            Duration: {material.estimatedDuration || 5} min
          </Typography>
          
          {material.completed && (
            <Tooltip title="Completed">
              <CheckCircleIcon color="success" />
            </Tooltip>
          )}
        </Box>
        
        {showProgress && (
          <Box mt={2}>
            <Box display="flex" justifyContent="space-between" mb={0.5}>
              <Typography variant="body2" color="text.secondary">
                Progress
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {material.progress || 0}%
              </Typography>
            </Box>
            <LinearProgress 
              variant="determinate" 
              value={material.progress || 0}
              color={material.completed ? "success" : "primary"}
              sx={{ height: 6, borderRadius: 3 }}
            />
          </Box>
        )}
      </CardContent>
      
      <CardActions>
        <Button
          variant="outlined"
          size="small"
          fullWidth
          startIcon={material.fileType === 'VIDEO' ? <PlayArrowIcon /> : <OpenInNewIcon />}
          onClick={() => onView(material)}
        >
          {material.fileType === 'VIDEO' ? 'Watch' : 'View'}
        </Button>
      </CardActions>
    </Card>
  );
};

export default LearningMaterialCard;