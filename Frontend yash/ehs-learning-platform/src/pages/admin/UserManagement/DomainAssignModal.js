// src/components/admin/DomainAssignModal.js
import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, FormControl, InputLabel, Select,
  MenuItem, Checkbox, ListItemText, OutlinedInput,
  Typography, Box, IconButton, Chip, CircularProgress
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { userService, domainService } from '../../../services/api';

function DomainAssignModal({ open, onClose, selectedUsers, onAssigned }) {
  const [domains, setDomains] = useState([]);
  const [selectedDomains, setSelectedDomains] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchingDomains, setFetchingDomains] = useState(false);
  const [error, setError] = useState(null);
  
  // Fetch available domains when modal opens
  useEffect(() => {
    if (open) {
      const fetchDomains = async () => {
        try {
          setFetchingDomains(true);
          setError(null);
          
          const response = await domainService.getAll();
          setDomains(response.data || []);
        } catch (error) {
          console.error('Error fetching domains:', error);
          setError('Failed to load domains. Please try again.');
        } finally {
          setFetchingDomains(false);
        }
      };
      
      fetchDomains();
      setSelectedDomains([]); // Reset selection when reopening
    }
  }, [open]);
  
  // Handle domain selection change
  const handleDomainChange = (event) => {
    const { value } = event.target;
    setSelectedDomains(typeof value === 'string' ? value.split(',') : value);
  };
  
  // Handle assign domains
  const handleAssignDomains = async () => {
    if (selectedDomains.length === 0) {
      setError('Please select at least one domain');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // For bulk assignment
      if (selectedUsers.length > 1) {
        await userService.assignBulkDomains({
          userIds: selectedUsers,
          domainIds: selectedDomains
        });
      } 
      // For single user
      else if (selectedUsers.length === 1) {
        await userService.assignDomains(selectedUsers[0], selectedDomains);
      }
      
      if (onAssigned) {
        onAssigned(selectedDomains);
      }
      
      onClose();
    } catch (error) {
      console.error('Error assigning domains:', error);
      setError('Failed to assign domains. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        Assign Domains
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{ position: 'absolute', right: 8, top: 8 }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent dividers>
        <Typography variant="body1" paragraph>
          Select domains to assign to {selectedUsers.length} selected user{selectedUsers.length !== 1 ? 's' : ''}
        </Typography>
        
        {error && (
          <Typography color="error" variant="body2" sx={{ mb: 2 }}>
            {error}
          </Typography>
        )}
        
        {fetchingDomains ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
            <CircularProgress size={24} />
          </Box>
        ) : (
          <FormControl fullWidth margin="normal">
            <InputLabel id="domains-select-label">Domains</InputLabel>
            <Select
              labelId="domains-select-label"
              id="domains-select"
              multiple
              value={selectedDomains}
              onChange={handleDomainChange}
              input={<OutlinedInput label="Domains" />}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selected.map((domainId) => {
                    const domain = domains.find(d => d.id === domainId);
                    return (
                      <Chip 
                        key={domainId} 
                        label={domain ? domain.name : domainId} 
                      />
                    );
                  })}
                </Box>
              )}
            >
              {domains.map((domain) => (
                <MenuItem key={domain.id} value={domain.id}>
                  <Checkbox checked={selectedDomains.indexOf(domain.id) > -1} />
                  <ListItemText primary={domain.name} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
        
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          Users will only see modules from their assigned domains. If no domains are assigned, users will see all available domains.
        </Typography>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose} color="inherit">
          Cancel
        </Button>
        <Button 
          onClick={handleAssignDomains} 
          variant="contained" 
          color="primary"
          disabled={loading || selectedDomains.length === 0}
        >
          {loading ? 'Assigning...' : 'Assign Domains'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default DomainAssignModal;