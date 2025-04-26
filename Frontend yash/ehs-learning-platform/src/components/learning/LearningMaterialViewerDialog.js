// src/components/learning/LearningMaterialViewerDialog.js
import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Box,
  Typography,
  DialogActions,
  Button
} from '@mui/material';
import {
  Close as CloseIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import LearningMaterialViewer from './LearningMaterialViewer';

const LearningMaterialViewerDialog = ({
  open,
  onClose,
  material,
  onComplete
}) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="lg"
    >
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">{material ? material.title : 'Learning Material'}</Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent dividers>
        {material && (
          <LearningMaterialViewer
            initialMaterials={[material]}
            onComplete={onComplete}
            onBack={onClose}
          />
        )}
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
        {material && !material.completed && (
          <Button 
            variant="contained" 
            color="primary" 
            startIcon={<CheckCircleIcon />}
            onClick={onComplete}
          >
            Mark as Completed
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default LearningMaterialViewerDialog;