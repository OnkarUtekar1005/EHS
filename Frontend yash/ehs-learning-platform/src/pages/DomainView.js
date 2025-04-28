// src/pages/DomainView.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  LinearProgress,
  Chip,
  Alert,
  CircularProgress,
  Paper,
  Divider
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  PlayArrow as PlayArrowIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { moduleService } from '../services/api';

const DomainView = () => {
  const { domainId } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [domain, setDomain] = useState(null);
  const [modules, setModules] = useState([]);
  
  useEffect(() => {
    const fetchDomainModules = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch domain details
        const domainResponse = await moduleService.getDomainById(domainId);
        const domainData = domainResponse.data;
        
        // Fetch modules for this domain
        const modulesResponse = await moduleService.getModulesByDomain(domainId);
        const modulesData = modulesResponse.data;
        
        setDomain(domainData);
        
        // Filter modules to show those with access
        const accessibleModules = modulesData.filter(moduleItem => moduleItem.hasAccess !== false);
        setModules(accessibleModules.map(moduleItem => moduleItem.module || moduleItem));
        
      } catch (err) {
        console.error('Error fetching domain data:', err);
        setError('Failed to load domain information. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchDomainModules();
  }, [domainId]);
  
  const handleModuleClick = (moduleId) => {
    navigate(`/modules/${moduleId}`);
  };
  
  const handleBackToDashboard = () => {
    navigate('/');
  };
  
  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
          <CircularProgress />
        </Box>
      </Container>
    );
  }
  
  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error">{error}</Alert>
        <Button 
          variant="outlined" 
          onClick={handleBackToDashboard}
          startIcon={<ArrowBackIcon />}
          sx={{ mt: 2 }}
        >
          Back to Dashboard
        </Button>
      </Container>
    );
  }
  
  if (!domain) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="info">Domain not found or not accessible.</Alert>
        <Button 
          variant="outlined" 
          onClick={handleBackToDashboard}
          startIcon={<ArrowBackIcon />}
          sx={{ mt: 2 }}
        >
          Back to Dashboard
        </Button>
      </Container>
    );
  }
  
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Back button and title */}
      <Box display="flex" alignItems="center" mb={3}>
        <Button 
          variant="text"
          onClick={handleBackToDashboard}
          startIcon={<ArrowBackIcon />}
        >
          Back to Dashboard
        </Button>
        <Typography variant="h4" sx={{ ml: 2 }}>
          {domain.name}
        </Typography>
      </Box>
      
      {/* Domain description */}
      {domain.description && (
        <Paper sx={{ p: 3, mb: 4 }}>
          <Typography variant="body1">
            {domain.description}
          </Typography>
        </Paper>
      )}
      
      {/* Module list */}
      <Typography variant="h5" gutterBottom>
        Available Modules
      </Typography>
      
      {modules.length > 0 ? (
        <Grid container spacing={3}>
          {modules.map((module) => (
            <Grid item xs={12} md={6} key={module.id}>
              <Card 
                sx={{ 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column',
                  cursor: 'pointer',
                  '&:hover': {
                    boxShadow: 3
                  }
                }}
                onClick={() => handleModuleClick(module.id)}
              >
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                    <Typography variant="h6" component="div">
                      {module.title}
                    </Typography>
                    {module.status && (
                      <Chip 
                        label={module.status} 
                        size="small" 
                        color={module.status === 'PUBLISHED' ? 'success' : 'default'} 
                        variant="outlined" 
                      />
                    )}
                  </Box>
                  
                  <Typography variant="body2" color="text.secondary" paragraph>
                    {module.description}
                  </Typography>
                  
                  <Box display="flex" alignItems="center" mb={1}>
                    <ScheduleIcon fontSize="small" color="action" />
                    <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                      {module.estimatedDuration 
                        ? `${module.estimatedDuration} min` 
                        : 'Duration not specified'}
                    </Typography>
                  </Box>
                  
                  {/* Progress indicator (if available) */}
                  {module.progress !== undefined && (
                    <>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Progress:
                      </Typography>
                      <LinearProgress 
                        variant="determinate" 
                        value={module.progress} 
                        sx={{ height: 8, borderRadius: 5, mb: 1 }} 
                      />
                      <Typography variant="body2" align="right" color="text.secondary">
                        {module.progress}%
                      </Typography>
                    </>
                  )}
                  
                  {/* Completion status */}
                  {module.completed && (
                    <Box display="flex" alignItems="center" mt={1}>
                      <CheckCircleIcon fontSize="small" color="success" />
                      <Typography variant="body2" color="success.main" sx={{ ml: 1 }}>
                        Completed
                      </Typography>
                    </Box>
                  )}
                </CardContent>
                
                <Divider />
                
                <CardActions>
                  {module.progress > 0 && !module.completed ? (
                    <Button 
                      size="small" 
                      startIcon={<PlayArrowIcon />}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleModuleClick(module.id);
                      }}
                    >
                      Continue
                    </Button>
                  ) : module.completed ? (
                    <Button 
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleModuleClick(module.id);
                      }}
                    >
                      Review
                    </Button>
                  ) : (
                    <Button 
                      size="small"
                      startIcon={<PlayArrowIcon />}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleModuleClick(module.id);
                      }}
                    >
                      Start
                    </Button>
                  )}
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Box display="flex" flexDirection="column" alignItems="center" p={3}>
            <InfoIcon color="info" fontSize="large" sx={{ mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              No modules available
            </Typography>
            <Typography variant="body2" color="text.secondary">
              There are no training modules available in this domain yet.
            </Typography>
          </Box>
        </Paper>
      )}
      
    </Container>
  );
};

export default DomainView;