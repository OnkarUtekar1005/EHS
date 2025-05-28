import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  CircularProgress,
  Paper,
  IconButton,
  Alert
} from '@mui/material';
import {
  Download as DownloadIcon,
  Close as CloseIcon,
  CheckCircle as CheckCircleIcon,
  Visibility as VisibilityIcon
} from '@mui/icons-material';
import api from '../../services/api';

const CertificateViewer = ({ open, onClose, courseId, courseName }) => {
  const [loading, setLoading] = useState(true);
  const [certificate, setCertificate] = useState(null);
  const [error, setError] = useState('');
  const [pdfUrl, setPdfUrl] = useState('');
  const [autoDownloaded, setAutoDownloaded] = useState(false);

  useEffect(() => {
    if (open && courseId) {
      fetchCertificate();
    }
    
    // Cleanup function to revoke object URL
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [open, courseId]);

  const fetchCertificate = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Check if certificate exists
      const response = await api.get(`/v2/certificates/user/${courseId}`);
      
      if (response.data.exists) {
        setCertificate(response.data);
        
        // Fetch PDF blob for preview
        const pdfResponse = await api.get(`/v2/certificates/view/${response.data.certificateId}`, {
          responseType: 'blob'
        });
        const pdfBlob = new Blob([pdfResponse.data], { type: 'application/pdf' });
        const pdfUrl = URL.createObjectURL(pdfBlob);
        setPdfUrl(pdfUrl);
        
        // Auto-download certificate after showing it
        if (!autoDownloaded) {
          setTimeout(() => {
            handleDownload();
            setAutoDownloaded(true);
          }, 2000); // Wait 2 seconds before auto-download
        }
      } else {
        // Generate certificate if it doesn't exist
        const genResponse = await api.post(`/v2/certificates/generate/${courseId}`);
        setCertificate(genResponse.data);
        
        // Fetch PDF blob for preview
        const pdfResponse = await api.get(`/v2/certificates/view/${genResponse.data.certificateId}`, {
          responseType: 'blob'
        });
        const pdfBlob = new Blob([pdfResponse.data], { type: 'application/pdf' });
        const pdfUrl = URL.createObjectURL(pdfBlob);
        setPdfUrl(pdfUrl);
        
        // Auto-download after generation
        setTimeout(() => {
          handleDownload();
          setAutoDownloaded(true);
        }, 2000);
      }
    } catch (err) {
      console.error('Error fetching certificate:', err);
      setError(err.response?.data?.message || 'Failed to fetch certificate');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!certificate?.certificateId) return;
    
    try {
      const response = await api.get(`/v2/certificates/download/${certificate.certificateId}`, {
        responseType: 'blob'
      });
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `certificate-${certificate.certificateNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error downloading certificate:', err);
      setError('Failed to download certificate');
    }
  };

  const handleView = () => {
    if (certificate?.certificateId) {
      window.open(`${api.defaults.baseURL}/v2/certificates/view/${certificate.certificateId}`, '_blank');
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="lg" 
      fullWidth
      PaperProps={{
        sx: { height: '90vh' }
      }}
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center" gap={1}>
            <CheckCircleIcon color="success" />
            <Typography variant="h6">Course Completion Certificate</Typography>
          </Box>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" height="100%">
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
        ) : certificate ? (
          <Box height="100%">
            <Paper elevation={3} sx={{ p: 2, mb: 2 }}>
              <Typography variant="h5" gutterBottom align="center">
                Congratulations!
              </Typography>
              <Typography variant="body1" align="center" color="text.secondary" gutterBottom>
                You have successfully completed the course: <strong>{courseName}</strong>
              </Typography>
              
              <Box display="flex" justifyContent="center" gap={4} mt={2}>
                <Box textAlign="center">
                  <Typography variant="caption" color="text.secondary">
                    Certificate Number
                  </Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {certificate.certificateNumber}
                  </Typography>
                </Box>
                <Box textAlign="center">
                  <Typography variant="caption" color="text.secondary">
                    Issued Date
                  </Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {new Date(certificate.issuedDate).toLocaleDateString()}
                  </Typography>
                </Box>
                <Box textAlign="center">
                  <Typography variant="caption" color="text.secondary">
                    Valid Until
                  </Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {new Date(certificate.expiryDate).toLocaleDateString()}
                  </Typography>
                </Box>
              </Box>
              
              {autoDownloaded && (
                <Alert severity="success" sx={{ mt: 2 }}>
                  Certificate has been automatically downloaded to your device!
                </Alert>
              )}
            </Paper>
            
            {/* PDF Viewer */}
            <Box height="calc(100% - 250px)" width="100%" sx={{ minHeight: '400px' }}>
              {pdfUrl ? (
                <iframe
                  src={pdfUrl}
                  width="100%"
                  height="100%"
                  style={{ 
                    border: '1px solid #ddd', 
                    borderRadius: '4px',
                    minHeight: '400px'
                  }}
                  title="Certificate Preview"
                />
              ) : (
                <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                  <CircularProgress />
                </Box>
              )}
            </Box>
          </Box>
        ) : null}
      </DialogContent>
      
      <DialogActions>
        <Button
          startIcon={<VisibilityIcon />}
          onClick={handleView}
          disabled={!certificate}
        >
          Open in New Tab
        </Button>
        <Button
          variant="contained"
          startIcon={<DownloadIcon />}
          onClick={handleDownload}
          disabled={!certificate}
        >
          Download Certificate
        </Button>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default CertificateViewer;