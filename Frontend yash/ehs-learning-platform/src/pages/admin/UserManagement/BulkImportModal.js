import React, { useState, useRef } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Typography, FormControlLabel, Checkbox,
  Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Paper, Grid, Select, MenuItem, FormControl,
  InputLabel, Chip, Alert, Box, CircularProgress
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import CloseIcon from '@mui/icons-material/Close';
import api from '../../../services/api';

function BulkImportModal({ open, onClose, onImportComplete }) {
  const [file, setFile] = useState(null);
  const [defaultRole, setDefaultRole] = useState('EMPLOYEE');
  const [defaultDomains, setDefaultDomains] = useState([]);
  const [generatePasswords, setGeneratePasswords] = useState(true);
  const [sendEmails, setSendEmails] = useState(true);
  const [skipExisting, setSkipExisting] = useState(false);
  const [updateExisting, setUpdateExisting] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [availableDomains, setAvailableDomains] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);
  
  // Fetch available domains when modal opens
  React.useEffect(() => {
    if (open) {
      const fetchDomains = async () => {
        try {
          const response = await api.get('/api/domains');
          setAvailableDomains(response.data);
        } catch (error) {
          console.error('Error fetching domains:', error);
          setError('Failed to load domains. Please try again.');
        }
      };
      
      fetchDomains();
    }
  }, [open]);
  
  // Handle file selection
  const handleFileChange = async (event) => {
    const selectedFile = event.target.files[0];
    if (!selectedFile) return;
    
    const allowedTypes = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv'
    ];
    
    if (!allowedTypes.includes(selectedFile.type)) {
      setError('Invalid file type. Please upload a CSV or Excel file.');
      return;
    }
    
    setFile(selectedFile);
    setError(null);
    
    // Generate preview
    await generatePreview(selectedFile);
  };
  
  // Generate preview of the uploaded file
  const generatePreview = async (selectedFile) => {
    setLoading(true);
    
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      
      const response = await api.post('/api/users/validate', formData);
      setPreviewData(response.data);
    } catch (error) {
      console.error('Error generating preview:', error);
      setError('Failed to parse the file. Please check the format and try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle domain selection
  const handleDomainChange = (event) => {
    setDefaultDomains(event.target.value);
  };
  
  // Download template
  const downloadTemplate = () => {
    // Create a simple CSV template
    const template = 'username,email\njohndoe,john.doe@example.com\njanedoe,jane.doe@example.com';
    const blob = new Blob([template], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'user_import_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  // Process import
  const handleImport = async () => {
    if (!file || !previewData) return;
    
    setLoading(true);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('defaultRole', defaultRole);
      formData.append('defaultDomainIds', JSON.stringify(defaultDomains));
      formData.append('generatePasswords', generatePasswords);
      formData.append('sendEmails', sendEmails);
      formData.append('skipExisting', skipExisting);
      formData.append('updateExisting', updateExisting);
      
      const response = await api.post('/api/users/bulk', formData);
      
      onImportComplete(response.data);
      handleClose();
      // Show success notification
    } catch (error) {
      console.error('Error importing users:', error);
      setError('Failed to import users. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle dialog close
  const handleClose = () => {
    setFile(null);
    setPreviewData(null);
    setDefaultRole('EMPLOYEE');
    setDefaultDomains([]);
    setGeneratePasswords(true);
    setSendEmails(true);
    setSkipExisting(false);
    setUpdateExisting(false);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onClose();
  };
  
  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        Bulk Import Users
        <IconButton
          aria-label="close"
          onClick={handleClose}
          sx={{ position: 'absolute', right: 8, top: 8 }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent dividers>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        <Typography variant="h6" gutterBottom>
          Upload File
        </Typography>
        
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={8}>
            <Box
              sx={{
                border: '1px dashed grey',
                p: 2,
                textAlign: 'center',
                cursor: 'pointer',
                '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' }
              }}
              onClick={() => fileInputRef.current.click()}
            >
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                hidden
                ref={fileInputRef}
                onChange={handleFileChange}
              />
              <CloudUploadIcon sx={{ fontSize: 40, color: 'primary.main' }} />
              <Typography variant="body1">
                {file ? file.name : 'Click to select a file or drag and drop'}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Supported formats: .csv, .xlsx, .xls
              </Typography>
            </Box>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Button
              variant="outlined"
              startIcon={<FileDownloadIcon />}
              onClick={downloadTemplate}
              fullWidth
            >
              Download Template
            </Button>
          </Grid>
        </Grid>
        
        <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
          Import Settings
        </Typography>
        
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth margin="normal">
              <InputLabel>Default Role</InputLabel>
              <Select
                value={defaultRole}
                onChange={(e) => setDefaultRole(e.target.value)}
                label="Default Role"
              >
                <MenuItem value="EMPLOYEE">Employee</MenuItem>
                <MenuItem value="ADMIN">Admin</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <FormControl fullWidth margin="normal">
              <InputLabel>Default Domains</InputLabel>
              <Select
                multiple
                value={defaultDomains}
                onChange={handleDomainChange}
                label="Default Domains"
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((domainId) => {
                      const domain = availableDomains.find(d => d.id === domainId);
                      return (
                        <Chip key={domainId} label={domain ? domain.name : domainId} size="small" />
                      );
                    })}
                  </Box>
                )}
              >
                {availableDomains.map((domain) => (
                  <MenuItem key={domain.id} value={domain.id}>
                    {domain.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
        
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12} md={6}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={generatePasswords}
                  onChange={(e) => setGeneratePasswords(e.target.checked)}
                />
              }
              label="Generate random passwords"
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={sendEmails}
                  onChange={(e) => setSendEmails(e.target.checked)}
                />
              }
              label="Send email with login credentials to new users"
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={skipExisting}
                  onChange={(e) => {
                    setSkipExisting(e.target.checked);
                    if (e.target.checked) setUpdateExisting(false);
                  }}
                />
              }
              label="Skip existing users (based on email)"
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={updateExisting}
                  onChange={(e) => {
                    setUpdateExisting(e.target.checked);
                    if (e.target.checked) setSkipExisting(false);
                  }}
                />
              }
              label="Update existing users (based on email)"
            />
          </Grid>
        </Grid>
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
            <CircularProgress />
          </Box>
        ) : previewData && (
          <>
            <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
              Preview
            </Typography>
            
            <TableContainer component={Paper} sx={{ maxHeight: 300 }}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Status</TableCell>
                    <TableCell>Username</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Issues</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {previewData.records.slice(0, 5).map((record, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        {record.valid ? (
                          <Chip label="Valid" color="success" size="small" />
                        ) : record.warning ? (
                          <Chip label="Warning" color="warning" size="small" />
                        ) : (
                          <Chip label="Error" color="error" size="small" />
                        )}
                      </TableCell>
                      <TableCell>{record.username}</TableCell>
                      <TableCell>{record.email}</TableCell>
                      <TableCell>{record.issues.join(', ')}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            
            <Typography variant="body2" sx={{ mt: 1 }}>
              Summary: {previewData.summary.valid} valid, {previewData.summary.warnings} warnings, {previewData.summary.errors} errors
            </Typography>
          </>
        )}
      </DialogContent>
      
      <DialogActions>
        <Button onClick={handleClose} color="inherit">
          Cancel
        </Button>
        {previewData && (
          <Button
            variant="contained"
            color="primary"
            onClick={handleImport}
            disabled={loading || previewData.summary.valid === 0}
          >
            {loading ? 'Importing...' : `Import ${previewData.summary.valid} Users`}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}

export default BulkImportModal;