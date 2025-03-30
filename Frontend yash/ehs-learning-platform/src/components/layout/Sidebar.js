// src/components/layout/Sidebar.js
import React, { useState, useEffect } from 'react';
import { 
  Drawer, 
  List, 
  ListItem, 
  ListItemIcon, 
  ListItemText, 
  Divider, 
  Typography,
  Box,
  Toolbar
} from '@mui/material';
import { 
  Dashboard as DashboardIcon,
  School as SchoolIcon,
  Assessment as AssessmentIcon,
  Domain as DomainIcon,
  Security as SecurityIcon,
  LocalHospital as FirstAidIcon
} from '@mui/icons-material';
import { Link, useLocation } from 'react-router-dom';

// Mock data for domains - would come from API in real implementation
const DOMAINS = [
  { id: 1, name: 'Fire Safety', icon: <SecurityIcon /> },
  { id: 2, name: 'OSHA', icon: <DomainIcon /> },
  { id: 3, name: 'First Aid', icon: <FirstAidIcon /> },
];

const Sidebar = ({ isOpen, drawerWidth }) => {
  const location = useLocation();
  const [selectedItem, setSelectedItem] = useState('/');

  useEffect(() => {
    setSelectedItem(location.pathname);
  }, [location]);

  return (
    <Drawer
      variant="persistent"
      open={isOpen}
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
          borderRight: '1px solid rgba(0, 0, 0, 0.12)',
          marginTop: '64px', // To account for the app bar height
          height: 'calc(100% - 64px)',
        },
      }}
    >
      <Box sx={{ overflow: 'auto' }}>
        <Box sx={{ padding: '16px' }}>
          <Typography variant="subtitle1" fontWeight="bold">
            Navigation
          </Typography>
        </Box>
        
        <List>
          {/* Dashboard */}
          <ListItem 
            button 
            component={Link} 
            to="/" 
            selected={selectedItem === '/'}
            onClick={() => setSelectedItem('/')}
          >
            <ListItemIcon>
              <DashboardIcon />
            </ListItemIcon>
            <ListItemText primary="Dashboard" />
          </ListItem>
          
          {/* My Courses */}
          <ListItem 
            button 
            component={Link} 
            to="/my-courses" 
            selected={selectedItem === '/my-courses'}
            onClick={() => setSelectedItem('/my-courses')}
          >
            <ListItemIcon>
              <SchoolIcon />
            </ListItemIcon>
            <ListItemText primary="My Courses" />
          </ListItem>
          
          {/* Reports */}
          <ListItem 
            button 
            component={Link} 
            to="/reports" 
            selected={selectedItem === '/reports'}
            onClick={() => setSelectedItem('/reports')}
          >
            <ListItemIcon>
              <AssessmentIcon />
            </ListItemIcon>
            <ListItemText primary="Reports" />
          </ListItem>
        </List>
        
        <Divider />
        
        {/* Domains Section */}
        <Box sx={{ padding: '16px 16px 0' }}>
          <Typography variant="subtitle1" fontWeight="bold">
            Domains
          </Typography>
        </Box>
        
        <List>
          {DOMAINS.map((domain) => (
            <ListItem 
              key={domain.id}
              button 
              component={Link} 
              to={`/domains/${domain.id}`}
              selected={selectedItem === `/domains/${domain.id}`}
              onClick={() => setSelectedItem(`/domains/${domain.id}`)}
            >
              <ListItemIcon>
                {domain.icon}
              </ListItemIcon>
              <ListItemText primary={domain.name} />
            </ListItem>
          ))}
        </List>
      </Box>
    </Drawer>
  );
};

export default Sidebar;