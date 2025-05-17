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
  Person as ProfileIcon,
  School as CourseIcon
} from '@mui/icons-material';
import { Link, useLocation } from 'react-router-dom';

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
              <CourseIcon />
            </ListItemIcon>
            <ListItemText primary="My Courses" />
          </ListItem>
          
          {/* Profile */}
          <ListItem 
            button 
            component={Link} 
            to="/profile" 
            selected={selectedItem === '/profile'}
            onClick={() => setSelectedItem('/profile')}
          >
            <ListItemIcon>
              <ProfileIcon />
            </ListItemIcon>
            <ListItemText primary="Profile" />
          </ListItem>
        </List>
      </Box>
    </Drawer>
  );
};

export default Sidebar;