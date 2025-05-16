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
  MenuBook as MaterialIcon,
  Quiz as QuizIcon,
  Assignment as AssignmentIcon,
  AssignmentTurnedIn as PostAssessmentIcon
} from '@mui/icons-material';

const getComponentIcon = (type) => {
  switch (type) {
    case 'PRE_ASSESSMENT':
      return <AssignmentIcon />;
    case 'POST_ASSESSMENT':
      return <PostAssessmentIcon />;
    case 'MATERIAL':
      return <MaterialIcon />;
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
      return component.data?.title || 'Learning Material';
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
      return `${questions.length} question${questions.length !== 1 ? 's' : ''}`;
    case 'MATERIAL':
      return data.type || 'File';
    default:
      return '';
  }
};

const ComponentCard = ({ component, index, totalComponents, onEdit, onDelete, onMoveUp, onMoveDown }) => {
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
          {getComponentIcon(component.type)}
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
          >
            <DeleteIcon />
          </IconButton>
        </Box>
      </CardContent>
    </Card>
  );
};

const ComponentList = ({ components = [], onEdit, onDelete, onMoveUp, onMoveDown }) => {
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
        />
      ))}
    </Box>
  );
};

export default ComponentList;