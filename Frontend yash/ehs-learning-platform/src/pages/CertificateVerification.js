import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableRow,
  Chip,
  Divider
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import api from '../services/api';

const CertificateVerification = () => {
  const { certificateNumber } = useParams();
  const [loading, setLoading] = useState(true);
  const [certificate, setCertificate] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (certificateNumber) {
      verifyCertificate();
    }
  }, [certificateNumber]);

  const verifyCertificate = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await api.get(`/v2/certificates/verify/${certificateNumber}`);
      setCertificate(response.data);
    } catch (err) {
      console.error('Error verifying certificate:', err);
      if (err.response?.status === 404) {
        setError('Certificate not found. Please check the certificate number.');
      } else {
        setError(err.response?.data?.message || 'Failed to verify certificate');
      }
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = () => {
    if (!certificate) return null;
    
    if (certificate.valid && certificate.status === 'ACTIVE') {
      return <CheckCircleIcon sx={{ fontSize: 60, color: 'success.main' }} />;
    } else if (certificate.status === 'EXPIRED') {
      return <WarningIcon sx={{ fontSize: 60, color: 'warning.main' }} />;
    } else {
      return <CancelIcon sx={{ fontSize: 60, color: 'error.main' }} />;
    }
  };

  const getStatusColor = () => {
    if (!certificate) return 'default';
    
    if (certificate.valid && certificate.status === 'ACTIVE') {
      return 'success';
    } else if (certificate.status === 'EXPIRED') {
      return 'warning';
    } else {
      return 'error';
    }
  };

  const getStatusText = () => {
    if (!certificate) return '';
    
    if (certificate.valid && certificate.status === 'ACTIVE') {
      return 'Valid Certificate';
    } else if (certificate.status === 'EXPIRED') {
      return 'Expired Certificate';
    } else {
      return 'Invalid Certificate';
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" align="center" gutterBottom>
          Certificate Verification
        </Typography>
        
        <Divider sx={{ my: 3 }} />
        
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight={300}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>
        ) : certificate ? (
          <Box>
            <Box display="flex" flexDirection="column" alignItems="center" mb={4}>
              {getStatusIcon()}
              <Chip
                label={getStatusText()}
                color={getStatusColor()}
                size="large"
                sx={{ mt: 2, fontSize: '1.1rem', px: 3, py: 3 }}
              />
            </Box>
            
            <Paper variant="outlined" sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Certificate Details
              </Typography>
              
              <Table>
                <TableBody>
                  <TableRow>
                    <TableCell component="th" scope="row" sx={{ fontWeight: 'bold' }}>
                      Certificate Number
                    </TableCell>
                    <TableCell>{certificate.certificateNumber}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell component="th" scope="row" sx={{ fontWeight: 'bold' }}>
                      Recipient Name
                    </TableCell>
                    <TableCell>{certificate.userName}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell component="th" scope="row" sx={{ fontWeight: 'bold' }}>
                      Course Name
                    </TableCell>
                    <TableCell>{certificate.courseName}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell component="th" scope="row" sx={{ fontWeight: 'bold' }}>
                      Issue Date
                    </TableCell>
                    <TableCell>
                      {new Date(certificate.issuedDate).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell component="th" scope="row" sx={{ fontWeight: 'bold' }}>
                      Expiry Date
                    </TableCell>
                    <TableCell>
                      {new Date(certificate.expiryDate).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell component="th" scope="row" sx={{ fontWeight: 'bold' }}>
                      Status
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={certificate.status}
                        color={getStatusColor()}
                        size="small"
                      />
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </Paper>
            
            <Box mt={3} p={2} bgcolor="grey.100" borderRadius={1}>
              <Typography variant="body2" color="text.secondary" align="center">
                This certificate was issued by the Environment Health Safety E-Learning Platform.
                For any queries, please contact the administrator.
              </Typography>
            </Box>
          </Box>
        ) : null}
      </Paper>
    </Container>
  );
};

export default CertificateVerification;