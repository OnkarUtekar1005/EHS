// src/pages/MyCourses.js
import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Grid, 
  Paper, 
  Typography, 
  Card, 
  CardContent, 
  CardActions,
  Box, 
  Button,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
  Divider,
  Chip,
  LinearProgress,
  TextField,
  InputAdornment,
  IconButton
} from '@mui/material';
import { 
  Search as SearchIcon,
  PlayArrow as PlayArrowIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Timer as TimerIcon,
  FilterList as FilterListIcon,
  Domain as DomainIcon
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { moduleService, progressService, authService } from '../services/api';

const MyCourses = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const tabParam = queryParams.get('tab');
  
  const [activeTab, setActiveTab] = useState(tabParam === 'completed' ? 1 : 0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [availableModules, setAvailableModules] = useState([]);
  const [inProgressModules, setInProgressModules] = useState([]);
  const [completedModules, setCompletedModules] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [userDomains, setUserDomains] = useState([]);
  
  useEffect(() => {
    const fetchModules = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // 1. Get available modules - use getAll with published status
        const availableResponse = await moduleService.getAll({ status: 'PUBLISHED' });
        
        // 2. Get user progress - use explicit endpoint that doesn't require a userId
        const progressResponse = await progressService.getDashboard();
        const progressData = progressResponse.data;
        
        // 3. Get user profile - use auth service instead
        const userResponse = await authService.getCurrentUser();
        const userData = userResponse.data;
        
        // Update state with fetched data
        setAvailableModules(availableResponse.data);
        
        if (progressData.inProgressModules) {
          setInProgressModules(progressData.inProgressModules);
        }
        
        if (progressData.completedModules) {
          setCompletedModules(progressData.completedModules);
        }
        
        if (userData.assignedDomains) {
          setUserDomains(userData.assignedDomains);
        }
        
      } catch (err) {
        console.error('Error fetching modules:', err);
        setError('Failed to load modules. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchModules();
  }, []);
  
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    // Update URL to reflect current tab
    if (newValue === 1) {
      navigate('/my-courses?tab=completed');
    } else {
      navigate('/my-courses');
    }
  };
  
  const handleModuleClick = (moduleId) => {
    navigate(`/modules/${moduleId}`);
  };
  
  const handleSearch = (event) => {
    setSearchQuery(event.target.value);
  };
  
  // Filter modules based on user's assigned domains and search query
  const filterModules = (modules) => {
    // First filter by user domains
    let filteredByDomain = modules;
    
    // Only apply domain filtering if userDomains has items
    if (userDomains && userDomains.length > 0) {
      filteredByDomain = modules.filter(module => {
        // If module has no domain, don't show it
        if (!module.domain) return false;
        
        // Handle both domain object and domain ID formats
        const moduleDomainId = typeof module.domain === 'object' ? 
          module.domain.id : module.domain;
        
        // Check if any of user's domains match the module domain
        return userDomains.some(userDomain => {
          const userDomainId = typeof userDomain === 'object' ? 
            userDomain.id : userDomain;
          return userDomainId === moduleDomainId;
        });
      });
    }
    
    // Then apply search filtering if there's a search query
    if (!searchQuery) return filteredByDomain;
    
    return filteredByDomain.filter(module => 
      module.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
      module.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      module.domain?.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };
  
  // Get modules to display based on active tab
  const getDisplayModules = () => {
    switch(activeTab) {
      case 0: // Available & In Progress
        return filterModules([...inProgressModules, ...availableModules.filter(m => 
          !inProgressModules.some(ip => ip.id === m.id) && 
          !completedModules.some(c => c.id === m.id)
        )]);
      case 1: // Completed
        return filterModules(completedModules);
      default:
        return [];
    }
  };
  
  const displayModules = getDisplayModules();
  
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
      </Container>
    );
  }
  
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        My Courses
      </Typography>
      
      {/* Search and Filter */}
      <Box sx={{ display: 'flex', mb: 3 }}>
        <TextField
          placeholder="Search courses..."
          variant="outlined"
          fullWidth
          value={searchQuery}
          onChange={handleSearch}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ maxWidth: 400 }}
        />
        
        <IconButton sx={{ ml: 1 }}>
          <FilterListIcon />
        </IconButton>
      </Box>
      
      {/* User Domains Indicator */}
      {userDomains && userDomains.length > 0 && (
        <Box sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
          <Typography variant="body2" sx={{ mr: 1 }}>
            Your domains:
          </Typography>
          {userDomains.map(domain => (
            <Chip 
              key={typeof domain === 'object' ? domain.id : domain}
              label={typeof domain === 'object' ? domain.name : domain} 
              size="small" 
              color="primary" 
              variant="outlined" 
              sx={{ mr: 0.5 }}
            />
          ))}
        </Box>
      )}
      
      {/* Tabs */}
      <Paper sx={{ width: '100%', mb: 3 }}>
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label={`Available (${inProgressModules.length + availableModules.filter(m => 
            !inProgressModules.some(ip => ip.id === m.id) && 
            !completedModules.some(c => c.id === m.id)
          ).length})`} />
          <Tab label={`Completed (${completedModules.length})`} />
        </Tabs>
      </Paper>
      
      {/* Module List */}
      {displayModules.length > 0 ? (
        <Grid container spacing={3}>
          {displayModules.map((module) => {
            const isInProgress = inProgressModules.some(m => m.id === module.id);
            const isCompleted = completedModules.some(m => m.id === module.id);
            
            return (
              <Grid item xs={12} md={6} key={module.id}>
                <Card 
                  sx={{ 
                    height: '100%', 
                    display: 'flex', 
                    flexDirection: 'column',
                    cursor: 'pointer',
                    position: 'relative',
                    ...(isCompleted && {
                      border: '1px solid #4caf50',
                    }),
                    '&:hover': {
                      boxShadow: 3
                    }
                  }}
                  onClick={() => handleModuleClick(module.id)}
                >
                  {isCompleted && (
                    <Box 
                      sx={{ 
                        position: 'absolute', 
                        top: 12, 
                        right: 12, 
                        bgcolor: 'success.main',
                        color: 'white',
                        borderRadius: '50%',
                        width: 24,
                        height: 24,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <CheckCircleIcon fontSize="small" />
                    </Box>
                  )}
                  
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                      <Typography variant="h6" component="div">
                        {module.title}
                      </Typography>
                      <Chip 
                        label={module.domain?.name || module.domain || 'General'} 
                        size="small" 
                        color="primary" 
                        variant="outlined" 
                        sx={{ ml: 1 }}
                      />
                    </Box>
                    
                    <Typography variant="body2" color="text.secondary" paragraph>
                      {module.description}
                    </Typography>
                    
                    <Box display="flex" alignItems="center" mb={1}>
                      <TimerIcon fontSize="small" color="action" />
                      <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                        {module.estimatedDuration 
                          ? `${module.estimatedDuration} min` 
                          : 'Duration not specified'}
                      </Typography>
                    </Box>
                    
                    {isInProgress && (
                      <>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Progress:
                        </Typography>
                        <LinearProgress 
                          variant="determinate" 
                          value={module.progress || 0} 
                          sx={{ height: 8, borderRadius: 5, mb: 1 }} 
                        />
                        <Typography variant="body2" align="right" color="text.secondary">
                          {module.progress || 0}%
                        </Typography>
                      </>
                    )}
                    
                    {isCompleted && module.completionDate && (
                      <Typography variant="body2" color="text.secondary">
                        Completed on: {new Date(module.completionDate).toLocaleDateString()}
                      </Typography>
                    )}
                    
                    {isCompleted && module.score && (
                      <Typography variant="body2" color="success.main">
                        Score: {module.score}%
                      </Typography>
                    )}
                  </CardContent>
                  
                  <Divider />
                  
                  <CardActions>
                    {isInProgress ? (
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
                    ) : isCompleted ? (
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
                        onClick={(e) => {
                          e.stopPropagation();
                          handleModuleClick(module.id);
                        }}
                      >
                        Start
                      </Button>
                    )}
                    
                    {/* Access indicator */}
                    {module.hasAccess === false && (
                      <Chip 
                        size="small"
                        label="Requires domain access" 
                        color="warning"
                        sx={{ ml: 'auto' }}
                      />
                    )}
                  </CardActions>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      ) : (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary">
            {activeTab === 0 
              ? "No available modules found for your domains. Contact your administrator for access." 
              : "You haven't completed any modules yet."}
          </Typography>
        </Paper>
      )}
    </Container>
  );
};

export default MyCourses;
