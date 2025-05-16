import React, { useState } from 'react';
import { Button, CircularProgress } from '@mui/material';
import { Refresh as RefreshIcon } from '@mui/icons-material';
import api from '../services/api';

const FixPermissionsButton = ({ materialId, onSuccess }) => {
  const [loading, setLoading] = useState(false);

  const handleFixPermissions = async () => {
    setLoading(true);
    try {
      await api.post(`/admin/materials/${materialId}/fix-permissions`);
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Error fixing permissions:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      size="small"
      startIcon={loading ? <CircularProgress size={16} /> : <RefreshIcon />}
      onClick={handleFixPermissions}
      disabled={loading}
    >
      Fix Permissions
    </Button>
  );
};

export default FixPermissionsButton;