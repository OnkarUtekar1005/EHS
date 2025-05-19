import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  IconButton,
  Chip,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  ArrowUpward as ArrowUpIcon,
  ArrowDownward as ArrowDownIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Quiz as QuizIcon,
  Assignment as AssignmentIcon,
  AssignmentTurnedIn as PostAssessmentIcon,
  AttachFile as MaterialIcon,
  PictureAsPdf as PdfIcon,
  VideoLibrary as VideoIcon,
  Slideshow as PptIcon,
  Description as DocIcon
} from '@mui/icons-material';

const getComponentIcon = (component) => {
  switch (component.type) {
    case 'PRE_ASSESSMENT':
      return <AssignmentIcon />;
    case 'POST_ASSESSMENT':
      return <PostAssessmentIcon />;
    case 'MATERIAL':
      const materialType = component.data?.type;
      switch (materialType) {
        case 'PDF':
          return <PdfIcon color="error" />;
        case 'VIDEO':
          return <VideoIcon color="primary" />;
        case 'PPT':
          return <PptIcon color="warning" />;
        default:
          return <MaterialIcon />;
      }
    default:
      return <QuizIcon />;
  }
};

const getComponentTitle = (component) => {
  switch (component.type) {
    case 'PRE_ASSESSMENT':
      return 'Pre-Assessment';
    case 'POST_ASSESSMENT':
      return 'Post-Assessment';
    case 'MATERIAL':
      return 'Material';
    default:
      return 'Component';
  }
};

const getComponentDetails = (component) => {
  const data = component.data || {};
  
  switch (component.type) {
    case 'PRE_ASSESSMENT':
    case 'POST_ASSESSMENT':
      const questions = data.questions || [];
      const title = data.title || 'Assessment';
      return `${title} - ${questions.length} question${questions.length !== 1 ? 's' : ''}`;
    case 'MATERIAL':
      const materialTitle = data.title || 'Unnamed Material';
      const materialType = data.type || 'File';
      return `${materialTitle} - ${materialType}`;
    default:
      return '';
  }
};

const ComponentCard = ({ component, index, totalComponents, onEdit, onDelete, onMoveUp, onMoveDown, disableDelete }) => {
  const isFirst = index === 0;
  const isLast = index === totalComponents - 1;

  return (
    <Card sx={{ mb: 2 }}>
      <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          <IconButton
            size="small"
            onClick={() => onMoveUp(component.id)}
            disabled={isFirst}
            title="Move up"
          >
            <ArrowUpIcon />
          </IconButton>
          <IconButton
            size="small"
            onClick={() => onMoveDown(component.id)}
            disabled={isLast}
            title="Move down"
          >
            <ArrowDownIcon />
          </IconButton>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
          {getComponentIcon(component)}
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
              {getComponentTitle(component)}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              {getComponentDetails(component)}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 1 }}>
          {component.required && (
            <Chip
              label="Required"
              size="small"
              color="primary"
              variant="outlined"
            />
          )}
          
          <IconButton
            size="small"
            onClick={() => onEdit(component)}
            title="Edit component"
          >
            <EditIcon />
          </IconButton>
          
          <IconButton
            size="small"
            onClick={() => onDelete(component.id)}
            title="Delete component"
            color="error"
            disabled={disableDelete}
          >
            <DeleteIcon />
          </IconButton>
        </Box>
      </CardContent>
    </Card>
  );
};

const ComponentList = ({ components = [], onEdit, onDelete, onMoveUp, onMoveDown, disableDelete = false }) => {
  // Filter out any components without valid IDs
  const validComponents = components.filter(component => component && component.id);
  
  return (
    <Box>
      {validComponents.map((component, index) => (
        <ComponentCard
          key={component.id}
          component={component}
          index={index}
          totalComponents={validComponents.length}
          onEdit={onEdit}
          onDelete={onDelete}
          onMoveUp={onMoveUp}
          onMoveDown={onMoveDown}
          disableDelete={disableDelete}
        />
      ))}
    </Box>
  );
};

export default ComponentList;