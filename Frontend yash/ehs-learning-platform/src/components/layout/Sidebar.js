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
  Toolbar,
  Avatar,
  useMediaQuery,
  useTheme
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Person as ProfileIcon,
  School as CourseIcon,
  Assessment as ReportsIcon
} from '@mui/icons-material';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Sidebar = ({ isOpen, drawerWidth }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const location = useLocation();
  const { currentUser } = useAuth();
  const [selectedItem, setSelectedItem] = useState('/');

  useEffect(() => {
    setSelectedItem(location.pathname);
  }, [location]);

  // Generate avatar letters from user name
  const getAvatarLetters = () => {
    if (!currentUser) return 'U';
    
    console.log('Sidebar currentUser:', currentUser); // Debug log
    
    if (currentUser.firstName && currentUser.lastName) {
      return `${currentUser.firstName[0]}${currentUser.lastName[0]}`.toUpperCase();
    } else if (currentUser.username) {
      return currentUser.username[0].toUpperCase();
    }
    
    return 'U';
  };

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
          display: 'flex',
          flexDirection: 'column',
        },
      }}
    >
      <Box sx={{ 
        overflow: 'auto',
        display: 'flex',
        flexDirection: 'column',
        height: '100%'
      }}>
        <Box sx={{ padding: '16px' }}>
          <Typography variant="subtitle1" fontWeight="bold">
            Navigation
          </Typography>
        </Box>
        
        <List sx={{ flexGrow: 1 }}>
          {/* Dashboard */}
          <ListItem 
            button 
            component={Link} 
            to="/" 
            selected={selectedItem === '/'}
            onClick={() => setSelectedItem('/')}
            sx={{
              borderRadius: { xs: 1, sm: 0 },
              mx: { xs: 1, sm: 0 },
              mb: { xs: 0.5, sm: 0 },
              '&.Mui-selected': {
                backgroundColor: 'rgba(25, 118, 210, 0.15)',
                color: '#1565c0',
                borderLeft: { xs: 'none', sm: '4px solid' },
                borderLeftColor: { sm: '#1565c0' },
                borderRadius: { xs: 1, sm: '0 8px 8px 0' },
                '& .MuiListItemIcon-root': {
                  color: '#1565c0'
                },
                '& .MuiListItemText-primary': {
                  fontWeight: 600,
                  color: '#1565c0'
                }
              }
            }}
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
            sx={{
              borderRadius: { xs: 1, sm: 0 },
              mx: { xs: 1, sm: 0 },
              mb: { xs: 0.5, sm: 0 },
              '&.Mui-selected': {
                backgroundColor: 'rgba(25, 118, 210, 0.15)',
                color: '#1565c0',
                borderLeft: { xs: 'none', sm: '4px solid' },
                borderLeftColor: { sm: '#1565c0' },
                borderRadius: { xs: 1, sm: '0 8px 8px 0' },
                '& .MuiListItemIcon-root': {
                  color: '#1565c0'
                },
                '& .MuiListItemText-primary': {
                  fontWeight: 600,
                  color: '#1565c0'
                }
              }
            }}
          >
            <ListItemIcon>
              <CourseIcon />
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
            sx={{
              borderRadius: { xs: 1, sm: 0 },
              mx: { xs: 1, sm: 0 },
              mb: { xs: 0.5, sm: 0 },
              '&.Mui-selected': {
                backgroundColor: 'rgba(25, 118, 210, 0.15)',
                color: '#1565c0',
                borderLeft: { xs: 'none', sm: '4px solid' },
                borderLeftColor: { sm: '#1565c0' },
                borderRadius: { xs: 1, sm: '0 8px 8px 0' },
                '& .MuiListItemIcon-root': {
                  color: '#1565c0'
                },
                '& .MuiListItemText-primary': {
                  fontWeight: 600,
                  color: '#1565c0'
                }
              }
            }}
          >
            <ListItemIcon>
              <ReportsIcon />
            </ListItemIcon>
            <ListItemText primary="Reports" />
          </ListItem>

          {/* Profile */}
          <ListItem
            button
            component={Link}
            to="/profile"
            selected={selectedItem === '/profile'}
            onClick={() => setSelectedItem('/profile')}
            sx={{
              borderRadius: { xs: 1, sm: 0 },
              mx: { xs: 1, sm: 0 },
              mb: { xs: 0.5, sm: 0 },
              '&.Mui-selected': {
                backgroundColor: 'rgba(25, 118, 210, 0.15)',
                color: '#1565c0',
                borderLeft: { xs: 'none', sm: '4px solid' },
                borderLeftColor: { sm: '#1565c0' },
                borderRadius: { xs: 1, sm: '0 8px 8px 0' },
                '& .MuiListItemIcon-root': {
                  color: '#1565c0'
                },
                '& .MuiListItemText-primary': {
                  fontWeight: 600,
                  color: '#1565c0'
                }
              }
            }}
          >
            <ListItemIcon>
              <ProfileIcon />
            </ListItemIcon>
            <ListItemText primary="Profile" />
          </ListItem>
        </List>
        
        {/* User info at bottom - similar to admin sidebar */}
        {currentUser && (
          <Box sx={{ 
            mt: 'auto', 
            p: 2, 
            borderTop: '1px solid rgba(0, 0, 0, 0.12)',
            backgroundColor: 'grey.50'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar 
                sx={{ 
                  width: 36, 
                  height: 36,
                  bgcolor: 'primary.main',
                  fontSize: '0.875rem',
                  fontWeight: 600
                }}
              >
                {getAvatarLetters()}
              </Avatar>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
                  {currentUser?.firstName && currentUser?.lastName
                    ? `${currentUser.firstName} ${currentUser.lastName}`
                    : currentUser?.username || 'User'}
                </Typography>
                <Typography variant="caption" color="text.secondary" noWrap>
                  {currentUser?.email || 'No email'}
                </Typography>
                <Typography variant="caption" color="primary.main" sx={{ display: 'block', fontWeight: 500 }}>
                  User
                </Typography>
              </Box>
            </Box>
          </Box>
        )}
      </Box>
    </Drawer>
  );
};

export default Sidebar;