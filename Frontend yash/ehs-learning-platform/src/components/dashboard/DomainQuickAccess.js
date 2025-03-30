// src/components/dashboard/DomainQuickAccess.js
import React, { useState, useEffect } from 'react';
import {
  Grid,
  Card,
  CardContent,
  CardActionArea,
  Typography,
  Avatar,
  Box,
  CircularProgress,
  Skeleton
} from '@mui/material';
import { 
  Security as SecurityIcon,
  LocalHospital as FirstAidIcon,
  Warning as WarningIcon,
  LocalFireDepartment as FireIcon,
  Construction as ConstructionIcon,
  Science as ChemicalIcon
} from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';
import { domainService } from '../../services/api';

const DomainQuickAccess = () => {
  const [domains, setDomains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDomains = async () => {
      try {
        setLoading(true);
        
        // In a production app, we would use the actual API
        // For now, we'll simulate the API call with mock data
        // const response = await domainService.getAll();
        // setDomains(response.data);
        
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Mock domain data
        setDomains([
          { id: 1, name: 'Fire Safety', icon: 'fire', color: '#f44336', moduleCount: 8 },
          { id: 2, name: 'OSHA Compliance', icon: 'security', color: '#2196f3', moduleCount: 12 },
          { id: 3, name: 'First Aid', icon: 'firstAid', color: '#4caf50', moduleCount: 6 },
          { id: 4, name: 'Hazard Communication', icon: 'warning', color: '#ff9800', moduleCount: 5 },
          { id: 5, name: 'Construction Safety', icon: 'construction', color: '#795548', moduleCount: 10 },
          { id: 6, name: 'Chemical Safety', icon: 'chemical', color: '#9c27b0', moduleCount: 7 }
        ]);
      } catch (err) {
        console.error('Error fetching domains:', err);
        setError('Failed to load domains');
      } finally {
        setLoading(false);
      }
    };

    fetchDomains();
  }, []);

  // Get icon based on domain type
  const getDomainIcon = (iconType) => {
    switch (iconType) {
      case 'fire':
        return <FireIcon />;
      case 'security':
        return <SecurityIcon />;
      case 'firstAid':
        return <FirstAidIcon />;
      case 'warning':
        return <WarningIcon />;
      case 'construction':
        return <ConstructionIcon />;
      case 'chemical':
        return <ChemicalIcon />;
      default:
        return <SecurityIcon />;
    }
  };

  // Loading skeleton
  if (loading) {
    return (
      <Grid container spacing={2}>
        {[1, 2, 3, 4, 5, 6].map((item) => (
          <Grid item xs={6} sm={4} md={2} key={item}>
            <Card>
              <CardContent>
                <Box display="flex" flexDirection="column" alignItems="center" gap={1}>
                  <Skeleton variant="circular" width={40} height={40} />
                  <Skeleton variant="text" width="80%" />
                  <Skeleton variant="text" width="40%" />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    );
  }

  // Error state
  if (error) {
    return (
      <Typography color="error" align="center">
        {error}
      </Typography>
    );
  }

  return (
    <Grid container spacing={2}>
      {domains.map((domain) => (
        <Grid item xs={6} sm={4} md={2} key={domain.id}>
          <Card>
            <CardActionArea 
              component={RouterLink} 
              to={`/domains/${domain.id}`}
              sx={{ height: '100%' }}
            >
              <CardContent>
                <Box display="flex" flexDirection="column" alignItems="center" textAlign="center" gap={1}>
                  <Avatar 
                    sx={{ 
                      bgcolor: domain.color,
                      width: 50,
                      height: 50,
                      mb: 1
                    }}
                  >
                    {getDomainIcon(domain.icon)}
                  </Avatar>
                  <Typography variant="subtitle1" noWrap>
                    {domain.name}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    {domain.moduleCount} modules
                  </Typography>
                </Box>
              </CardContent>
            </CardActionArea>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};

export default DomainQuickAccess;