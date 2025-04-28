import React from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Typography, Box, IconButton, List, ListItem, ListItemText
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import WarningIcon from '@mui/icons-material/Warning';

function DeleteConfirmModal({ open, onClose, selectedUsers, onConfirm }) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        Confirm Delete
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{ position: 'absolute', right: 8, top: 8 }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent dividers>
        <Typography variant="h6" gutterBottom>
          Are you sure you want to delete the following users?
        </Typography>
        
        <List dense>
          {selectedUsers.map(user => (
            <ListItem key={user.id}>
              <ListItemText primary={`${user.username} (${user.email})`} />
            </ListItem>
          ))}
        </List>
        
        <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', color: 'error.main' }}>
          <WarningIcon sx={{ mr: 1 }} />
          <Typography variant="body1" color="error">
            Warning: This action cannot be undone. All user data,
            including training progress and assessment results,
            will be permanently deleted.
          </Typography>
        </Box>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose} color="inherit">
          Cancel
        </Button>
        <Button onClick={onConfirm} variant="contained" color="error">
          Delete Users
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default DeleteConfirmModal;