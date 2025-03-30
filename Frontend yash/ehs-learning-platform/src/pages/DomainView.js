// src/pages/DomainView.js
import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Grid, 
  Card, 
  CardContent, 
  CardMedia, 
  CardActionArea, 
  Box, 
  Chip, 
  CircularProgress, 
  Alert,
  Breadcrumbs,
  Link
} from '@mui/material';
import { useParams, Link as RouterLink } from 'react-router-dom';
import { domainService, moduleService } from '../services/api';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';

const getModuleImage = (domainName) => {
  // In a real app, we would have unique images for each module
  // For demo purposes, we're using a consistent pattern based on domain
  
  const domainColors = {
    'Fire Safety': '#f44336',
    'OSHA Compliance': '#2196f3',
    'First Aid': '#4caf50',
    'Hazard Communication': '#ff9800',
    'Construction Safety': '#795548',
    'Chemical Safety': '#9c27b0'
  };
  
  const color = domainColors[domainName] || '#607d8b'; // default grey if domain not found
  
  return `https://via.placeholder.com/400x200/${color.substring(1)}/FFFFFF?text=${encodeURIComponent(domainName)}`;
};

const DomainView = () => {
  const { domainId } = useParams();
  const [domain, setDomain] = useState(null);
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchDomainData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // In a real app, we would use actual API calls
        // For now, we're simulating with mock data
        
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Mock domain data
        const domainData = {
          id: domainId,
          name: getDomainName(domainId),
          description: `Comprehensive training modules for ${getDomainName(domainId)} to ensure workplace compliance and employee safety.`,
          moduleCount: Math.floor(Math.random() * 10) + 5 // Random number between 5-15
        };
        
        setDomain(domainData);
        
        // Mock modules data
        const modulesData = generateMockModules(domainData.name, domainData.moduleCount);
        setModules(modulesData);
      } catch (err) {
        console.error('Error fetching domain data:', err);
        setError('Failed to load domain data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchDomainData();
  }, [domainId]);
  
  // Helper to get domain name from ID for mock data
  const getDomainName = (id) => {
    const domainNames = {
      '1': 'Fire Safety',
      '2': 'OSHA Compliance',
      '3': 'First Aid',
      '4': 'Hazard Communication',
      '5': 'Construction Safety',
      '6': 'Chemical Safety'
    };
    
    return domainNames[id] || 'Unknown Domain';
  };
  
  // Generate mock modules for demo
  const generateMockModules = (domainName, count) => {
    const modules = [];
    const difficulties = ['Beginner', 'Intermediate', 'Advanced'];
    const statuses = ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED'];
    
    // Domain-specific module titles
    const moduleTitles = {
      'Fire Safety': [
        'Fire Prevention Basics', 
        'Emergency Evacuation Procedures', 
        'Fire Extinguisher Training',
        'Fire Hazard Identification',
        'Fire Safety Leadership',
        'Building Fire Codes',
        'Electrical Fire Safety',
        'Workplace Fire Drills'
      ],
      'OSHA Compliance': [
        'OSHA Standards Overview',
        'Workplace Hazard Assessment',
        'Personal Protective Equipment',
        'Recordkeeping Requirements',
        'OSHA Inspection Preparation',
        'Employee Rights Under OSHA',
        'Safety Committee Formation',
        'Job Hazard Analysis'
      ],
      'First Aid': [
        'Basic First Aid',
        'CPR Certification',
        'Emergency Response',
        'Wound Care',
        'Handling Medical Emergencies',
        'AED Training',
        'Bloodborne Pathogens',
        'Heat Stroke Prevention'
      ],
      'Hazard Communication': [
        'GHS Labeling System',
        'Safety Data Sheets',
        'Chemical Storage Guidelines',
        'Hazard Communication Program',
        'Employee Right to Know',
        'Workplace Labeling',
        'Hazardous Material Transport',
        'Chemical Spill Response'
      ],
      'Construction Safety': [
        'Fall Protection',
        'Scaffolding Safety',
        'Excavation Safety',
        'Power Tool Safety',
        'Confined Space Entry',
        'Crane Operation Safety',
        'PPE for Construction',
        'Heavy Equipment Safety'
      ],
      'Chemical Safety': [
        'Chemical Handling Procedures',
        'Laboratory Safety',
        'PPE for Chemical Exposure',
        'Chemical Storage Requirements',
        'Chemical Compatibility',
        'Emergency Chemical Spill Response',
        'Toxicology Basics',
        'Chemical Risk Assessment'
      ]
    };
    
    const titles = moduleTitles[domainName] || [
      'Basic Training', 
      'Advanced Concepts', 
      'Certification Preparation', 
      'Safety Protocols',
      'Emergency Procedures',
      'Compliance Overview',
      'Risk Management',
      'Best Practices'
    ];
    
    for (let i = 0; i < count; i++) {
      const titleIndex = i % titles.length;
      modules.push({
        id: `${domainId}-${i + 1}`,
        title: titles[titleIndex],
        description: `Learn essential ${domainName} principles and practices to ensure workplace safety and compliance.`,
        duration: Math.floor(Math.random() * 60) + 15, // 15-75 minutes
        difficulty: difficulties[Math.floor(Math.random() * difficulties.length)],
        status: statuses[Math.floor(Math.random() * statuses.length)],
        progress: Math.floor(Math.random() * 100),
        image: getModuleImage(domainName)
      });
    }
    
    return modules;
  };
  
  if (loading && !domain) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <CircularProgress />
        </Box>
      </Container>
    );
  }
  
  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }
  
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Breadcrumbs */}
      <Breadcrumbs 
        separator={<NavigateNextIcon fontSize="small" />} 
        aria-label="breadcrumb"
        sx={{ mb: 3 }}
      >
        <Link component={RouterLink} to="/" color="inherit">
          Dashboard
        </Link>
        <Link component={RouterLink} to="/my-courses" color="inherit">
          Courses
        </Link>
        <Typography color="text.primary">{domain?.name}</Typography>
      </Breadcrumbs>
      
      {/* Domain Header */}
      <Box mb={4}>
        <Typography variant="h4" gutterBottom>
          {domain?.name}
        </Typography>
        <Typography variant="body1" color="textSecondary" paragraph>
          {domain?.description}
        </Typography>
        <Chip 
          label={`${domain?.moduleCount} modules`} 
          color="primary" 
          variant="outlined" 
        />
      </Box>
      
      {/* Modules Grid */}
      <Typography variant="h5" gutterBottom>
        Available Modules
      </Typography>
      
      <Grid container spacing={3}>
        {modules.map((module) => (
          <Grid item xs={12} sm={6} md={4} key={module.id}>
            <Card elevation={2}>
              <CardActionArea component={RouterLink} to={`/modules/${module.id}`}>
                <CardMedia
                  component="img"
                  height="140"
                  image={module.image}
                  alt={module.title}
                />
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography variant="h6" noWrap>
                      {module.title}
                    </Typography>
                    <Chip 
                      label={module.difficulty} 
                      size="small"
                      color={
                        module.difficulty === 'Beginner' ? 'success' :
                        module.difficulty === 'Intermediate' ? 'primary' : 'error'
                      }
                    />
                  </Box>
                  
                  <Typography variant="body2" color="textSecondary" paragraph noWrap>
                    {module.description}
                  </Typography>
                  
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="body2">
                      {module.duration} minutes
                    </Typography>
                    <Chip 
                      label={
                        module.status === 'NOT_STARTED' ? 'Not Started' :
                        module.status === 'IN_PROGRESS' ? `${module.progress}% Complete` : 'Completed'
                      }
                      size="small"
                      color={
                        module.status === 'COMPLETED' ? 'success' :
                        module.status === 'IN_PROGRESS' ? 'primary' : 'default'
                      }
                    />
                  </Box>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
};

export default DomainView;