import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Stack,
  Divider
} from '@mui/material';
import {
  Assessment as AssessmentIcon,
  LibraryBooks as MaterialsIcon,
  Timer as TimerIcon,
  Check as CheckIcon,
  School as SchoolIcon
} from '@mui/icons-material';

const ComponentPreviewCard = ({ component }) => {
  const isAssessment = component.type === 'PRE_ASSESSMENT' || component.type === 'POST_ASSESSMENT';
  
  // Determine component details based on type
  const getComponentDetails = () => {
    if (isAssessment) {
      return {
        icon: <AssessmentIcon fontSize="small" />,
        title: component.type === 'PRE_ASSESSMENT' ? 'Pre-Assessment' : 'Post-Assessment',
        color: component.type === 'PRE_ASSESSMENT' ? 'info' : 'success'
      };
    } else {
      return {
        icon: <MaterialsIcon fontSize="small" />,
        title: 'Learning Materials',
        color: 'primary'
      };
    }
  };
  
  const details = getComponentDetails();
  
  return (
    <Card variant="outlined" sx={{ mt: 1, mb: 1 }}>
      <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
        <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
          <Chip
            icon={details.icon}
            label={details.title}
            size="small"
            color={details.color}
          />
          {component.isRequired === false && (
            <Chip
              label="Optional"
              size="small"
              variant="outlined"
            />
          )}
        </Stack>
        
        {isAssessment && (
          <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', fontSize: '0.875rem' }}>
              <TimerIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
              <Typography variant="body2" color="text.secondary">
                Time Limit: {component.timeLimit || 30} minutes
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', fontSize: '0.875rem' }}>
              <CheckIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
              <Typography variant="body2" color="text.secondary">
                Passing Score: {component.passingScore || 70}%
              </Typography>
            </Box>
          </Stack>
        )}
        
        {!isAssessment && (
          <Box sx={{ display: 'flex', alignItems: 'center', fontSize: '0.875rem', mt: 1 }}>
            <SchoolIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
            <Typography variant="body2" color="text.secondary">
              {component.materials?.length || 0} Learning Materials
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default ComponentPreviewCard;