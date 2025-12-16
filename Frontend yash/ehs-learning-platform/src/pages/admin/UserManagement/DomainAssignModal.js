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

function DomainAssignModal({ open, onClose, selectedUsers, selectedUserObjects = [], onAssigned }) {
  const [domains, setDomains] = useState([]);
  const [selectedDomains, setSelectedDomains] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchingDomains, setFetchingDomains] = useState(false);
  const [error, setError] = useState(null);
  const [adminCount, setAdminCount] = useState(0);
  const [nonAdminCount, setNonAdminCount] = useState(0);
  
  // Fetch available domains and pre-populate existing assignments when modal opens
  useEffect(() => {
    if (open) {
      const fetchDomainsAndAssignments = async () => {
        try {
          setFetchingDomains(true);
          setError(null);

          // Fetch all available domains
          const domainsResponse = await domainService.getAll();
          setDomains(domainsResponse.data || []);

          // Collect all unique domain IDs from selected users
          const existingDomainIds = new Set();

          if (selectedUserObjects.length > 0) {
            selectedUserObjects.forEach(user => {
              if (user.domains && Array.isArray(user.domains)) {
                user.domains.forEach(domain => {
                  // Handle both object format {id, name} and string format
                  const domainId = typeof domain === 'object' ? domain.id : domain;
                  existingDomainIds.add(domainId);
                });
              }
            });
          }

          // Pre-select existing domains
          setSelectedDomains(Array.from(existingDomainIds));
        } catch (error) {
          console.error('Error fetching domains:', error);
          setError('Failed to load domains. Please try again.');
        } finally {
          setFetchingDomains(false);
        }
      };

      fetchDomainsAndAssignments();
    }
  }, [open, selectedUserObjects]);

  // Calculate admin vs non-admin user counts
  useEffect(() => {
    if (open && selectedUserObjects.length > 0) {
      const admins = selectedUserObjects.filter(user => user.role === 'ADMIN');
      const nonAdmins = selectedUserObjects.filter(user => user.role !== 'ADMIN');
      setAdminCount(admins.length);
      setNonAdminCount(nonAdmins.length);
    } else {
      setAdminCount(0);
      setNonAdminCount(selectedUsers.length);
    }
  }, [open, selectedUsers, selectedUserObjects]);
  
  // Handle domain selection change
  const handleDomainChange = (event) => {
    const { value } = event.target;
    setSelectedDomains(typeof value === 'string' ? value.split(',') : value);
  };
  
  // Handle assign domains
  const handleAssignDomains = async () => {
    // Note: Allow empty selection to remove all domains from users

    // Filter out admin users if we have user objects
    let targetUserIds = selectedUsers;
    if (selectedUserObjects.length > 0) {
      const nonAdminUsers = selectedUserObjects.filter(user => user.role !== 'ADMIN');
      targetUserIds = nonAdminUsers.map(user => user.id);

      if (targetUserIds.length === 0) {
        setError('No eligible users selected. Domain assignment only applies to non-admin users.');
        return;
      }
    }

    setLoading(true);
    setError(null);

    try {
      // For bulk assignment
      if (targetUserIds.length > 1) {
        await userService.assignBulkDomains({
          userIds: targetUserIds,
          domainIds: selectedDomains
        });
      }
      // For single user
      else if (targetUserIds.length === 1) {
        await userService.assignDomains(targetUserIds[0], selectedDomains);
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
          Manage domain assignments for {selectedUsers.length} selected user{selectedUsers.length !== 1 ? 's' : ''}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Already assigned domains are pre-checked. You can add new domains or uncheck to remove existing ones.
        </Typography>
        
        {error && (
          <Typography color="error" variant="body2" sx={{ mb: 2 }}>
            {error}
          </Typography>
        )}

        {adminCount > 0 && (
          <Box
            sx={{
              p: 1.5,
              mb: 2,
              backgroundColor: 'rgba(255, 152, 0, 0.1)',
              borderRadius: 1,
              border: '1px solid rgba(255, 152, 0, 0.3)'
            }}
          >
            <Typography variant="body2" sx={{ color: 'warning.dark', fontWeight: 500 }}>
              ⚠️ <strong>Warning:</strong> {adminCount} admin user{adminCount !== 1 ? 's' : ''} will be skipped.
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.5 }}>
              Admin users have global access and don't need domain assignments.
              Only {nonAdminCount} user{nonAdminCount !== 1 ? 's' : ''} will receive domain assignments.
            </Typography>
          </Box>
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
          disabled={loading}
        >
          {loading ? 'Updating...' : 'Update Domains'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default DomainAssignModal;