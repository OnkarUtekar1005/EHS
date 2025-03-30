// src/pages/MyCourses.js
import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  CardMedia,
  CardActionArea,
  Tabs,
  Tab,
  Chip,
  CircularProgress,
  Alert,
  TextField,
  InputAdornment,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  LinearProgress
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import { moduleService } from '../services/api';

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

const MyCourses = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const statusFromUrl = queryParams.get('status');
  
  // State
  const [tabValue, setTabValue] = useState(statusFromUrl === 'completed' ? 2 : statusFromUrl === 'not-started' ? 0 : 1);
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDomain, setFilterDomain] = useState('');
  const [domains, setDomains] = useState([]);
  
  useEffect(() => {
    const fetchModules = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Get current tab status
        const status = tabValue === 0 ? 'NOT_STARTED' : 
                       tabValue === 1 ? 'IN_PROGRESS' : 'COMPLETED';
        
        // In a real app, we would fetch from API with filters
        // For now, we're simulating with mock data
        
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Mock data
        const mockModules = generateMockModules(status);
        
        // Apply client-side filtering for demo
        let filteredModules = [...mockModules];
        
        if (searchQuery) {
          filteredModules = filteredModules.filter(
            module => module.title.toLowerCase().includes(searchQuery.toLowerCase())
          );
        }
        
        if (filterDomain) {
          filteredModules = filteredModules.filter(
            module => module.domain === filterDomain
          );
        }
        
        setModules(filteredModules);
        
        // Extract unique domains for filter dropdown
        const uniqueDomains = [...new Set(mockModules.map(module => module.domain))];
        setDomains(uniqueDomains);
      } catch (err) {
        console.error('Error fetching modules:', err);
        setError('Failed to load modules. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchModules();
  }, [tabValue, searchQuery, filterDomain]);
  
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    
    // Update URL to reflect tab selection
    const status = newValue === 0 ? 'not-started' : 
                   newValue === 1 ? 'in-progress' : 'completed';
    navigate(`/my-courses?status=${status}`);
  };
  
  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
  };
  
  const handleDomainChange = (event) => {
    setFilterDomain(event.target.value);
  };
  
  // Generate mock modules for demo
  const generateMockModules = (status) => {
    const mockModules = [];
    const domains = ['Fire Safety', 'OSHA Compliance', 'First Aid', 'Hazard Communication', 'Construction Safety', 'Chemical Safety'];
    const difficulties = ['Beginner', 'Intermediate', 'Advanced'];
    
    // Domain-specific module titles
    const moduleTitles = {
      'Fire Safety': [
        'Fire Prevention Basics', 
        'Emergency Evacuation Procedures', 
        'Fire Extinguisher Training',
        'Fire Hazard Identification'
      ],
      'OSHA Compliance': [
        'OSHA Standards Overview',
        'Workplace Hazard Assessment',
        'Personal Protective Equipment',
        'Recordkeeping Requirements'
      ],
      'First Aid': [
        'Basic First Aid',
        'CPR Certification',
        'Emergency Response',
        'Wound Care'
      ],
      'Hazard Communication': [
        'GHS Labeling System',
        'Safety Data Sheets',
        'Chemical Storage Guidelines',
        'Hazard Communication Program'
      ],
      'Construction Safety': [
        'Fall Protection',
        'Scaffolding Safety',
        'Excavation Safety',
        'Power Tool Safety'
      ],
      'Chemical Safety': [
        'Chemical Handling Procedures',
        'Laboratory Safety',
        'PPE for Chemical Exposure',
        'Chemical Storage Requirements'
      ]
    };
    
    // Generate 10-15 modules with the requested status
    const count = Math.floor(Math.random() * 6) + 10; // 10-15
    
    for (let i = 0; i < count; i++) {
      const domain = domains[i % domains.length];
      const titles = moduleTitles[domain];
      const title = titles[i % titles.length];
      
      mockModules.push({
        id: `module-${i + 1}`,
        title: title,
        description: `Learn essential ${domain} principles and practices to ensure workplace safety and compliance.`,
        domain: domain,
        difficulty: difficulties[Math.floor(Math.random() * difficulties.length)],
        duration: Math.floor(Math.random() * 60) + 15, // 15-75 minutes
        status: status,
        progress: status === 'IN_PROGRESS' ? Math.floor(Math.random() * 90) + 10 : 0, // 10-99% for in-progress
        completedAt: status === 'COMPLETED' ? new Date(Date.now() - Math.floor(Math.random() * 30) * 86400000).toISOString() : null, // random date in last 30 days
        score: status === 'COMPLETED' ? Math.floor(Math.random() * 30) + 70 : null, // 70-99% score for completed
        image: getModuleImage(domain)
      });
    }
    
    return mockModules;
  };
  
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        My Courses
      </Typography>
      
      {/* Filters */}
      <Box sx={{ mb: 4, display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
        <TextField
          label="Search Courses"
          variant="outlined"
          fullWidth
          value={searchQuery}
          onChange={handleSearchChange}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
        
        <FormControl variant="outlined" sx={{ minWidth: { xs: '100%', sm: 200 } }}>
          <InputLabel id="domain-filter-label">Domain</InputLabel>
          <Select
            labelId="domain-filter-label"
            id="domain-filter"
            value={filterDomain}
            onChange={handleDomainChange}
            label="Domain"
          >
            <MenuItem value="">
              <em>All Domains</em>
            </MenuItem>
            {domains.map(domain => (
              <MenuItem key={domain} value={domain}>{domain}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>
      
      {/* Status Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange} 
          aria-label="module status tabs"
          variant="fullWidth"
        >
          <Tab label="Not Started" />
          <Tab label="In Progress" />
          <Tab label="Completed" />
        </Tabs>
      </Box>
      
      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {/* Loading Indicator */}
      {loading && (
        <Box sx={{ width: '100%', mb: 3 }}>
          <LinearProgress />
        </Box>
      )}
      
      {/* Module Grid */}
      {!loading && modules.length === 0 ? (
        <Box textAlign="center" py={5}>
          <Typography variant="h6" color="textSecondary">
            No courses found
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Try changing your filters or check back later for new courses
          </Typography>
        </Box>
      ) : (
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
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                      <Typography variant="h6" sx={{ maxWidth: '70%' }} noWrap>
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
                    
                    <Typography variant="body2" color="textSecondary" paragraph>
                      {module.domain}
                    </Typography>
                    
                    {module.status === 'IN_PROGRESS' && (
                      <Box sx={{ mb: 2 }}>
                        <Box display="flex" justifyContent="space-between">
                          <Typography variant="body2" color="textSecondary">
                            Progress
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            {module.progress}%
                          </Typography>
                        </Box>
                        <LinearProgress 
                          variant="determinate" 
                          value={module.progress} 
                          sx={{ height: 6, borderRadius: 3, mt: 0.5 }}
                        />
                      </Box>
                    )}
                    
                    {module.status === 'COMPLETED' && (
                      <Box display="flex" justifyContent="space-between" mb={1}>
                        <Typography variant="body2" color="textSecondary">
                          Completed {new Date(module.completedAt).toLocaleDateString()}
                        </Typography>
                        <Chip 
                          label={`${module.score}%`} 
                          size="small" 
                          color={module.score >= 90 ? "success" : module.score >= 70 ? "primary" : "default"}
                        />
                      </Box>
                    )}
                    
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography variant="body2">
                        {module.duration} minutes
                      </Typography>
                      {module.status === 'NOT_STARTED' && (
                        <Chip 
                          label="Start"
                          size="small"
                          color="primary"
                        />
                      )}
                    </Box>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
};

export default MyCourses;