// src/components/layout/MainLayout.js
import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { 
  Box, 
  CssBaseline, 
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Drawer,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  useMediaQuery,
  Avatar,
  Menu,
  MenuItem,
  Container
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

// Icons
import MenuIcon from '@mui/icons-material/Menu';
import DashboardIcon from '@mui/icons-material/Dashboard';
import AssessmentIcon from '@mui/icons-material/Assessment';
import logoImage from '../../assets/logo-image.jpg';
import KeyboardArrowLeftIcon from '@mui/icons-material/KeyboardArrowLeft';
import SchoolIcon from '@mui/icons-material/School';

// Drawer width
const drawerWidth = 240;

const MainLayout = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { logout, currentUser } = useAuth();
  
  const [open, setOpen] = useState(!isMobile);
  const [anchorEl, setAnchorEl] = useState(null);
  const isMenuOpen = Boolean(anchorEl);

  // Handle drawer open/close
  const handleDrawerToggle = () => {
    setOpen(!open);
  };
  
  // Handle profile menu
  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  // Handle logout - Updated to use AuthContext
  const handleLogout = () => {
    // Close the menu first
    handleMenuClose();
    
    // Use the AuthContext's logout function to clear state
    logout();
    
    // Then navigate to login
    navigate('/login', { replace: true });
  };

  // Handle profile navigation
  const handleProfile = () => {
    handleMenuClose();
    navigate('/profile');
  };

  // Drawer content - matches your design in Image 2
  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {isMobile && (
        <Box sx={{ display: 'flex', alignItems: 'center', p: 1 }}>
          <IconButton onClick={handleDrawerToggle}>
            <KeyboardArrowLeftIcon />
          </IconButton>
        </Box>
      )}
      
      <List sx={{ mt: 2 }}>
        {/* Main Navigation */}
        <ListItem disablePadding>
          <ListItemButton
            component={Link}
            to="/"
            selected={location.pathname === '/'}
            className="sidebar-list-item"
          >
            <ListItemIcon>
              <DashboardIcon />
            </ListItemIcon>
            <ListItemText primary="Dashboard" />
          </ListItemButton>
        </ListItem>
        
        <ListItem disablePadding>
          <ListItemButton
            component={Link}
            to="/my-courses"
            selected={location.pathname === '/my-courses'}
            className="sidebar-list-item"
          >
            <ListItemIcon>
              <SchoolIcon />
            </ListItemIcon>
            <ListItemText primary="My Courses" />
          </ListItemButton>
        </ListItem>
        
        <ListItem disablePadding>
          <ListItemButton
            component={Link}
            to="/reports"
            selected={location.pathname === '/reports'}
            className="sidebar-list-item"
          >
            <ListItemIcon>
              <AssessmentIcon />
            </ListItemIcon>
            <ListItemText primary="Reports" />
          </ListItemButton>
        </ListItem>
      </List>
      
      {/* Spacer to push user info to bottom */}
      <Box sx={{ flexGrow: 1 }} />
      
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
              {currentUser?.firstName && currentUser?.lastName ? 
                `${currentUser.firstName[0]}${currentUser.lastName[0]}`.toUpperCase() :
                currentUser?.username ? 
                  currentUser.username[0].toUpperCase() : 
                  'U'
              }
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
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <CssBaseline />
      
      {/* App Bar - Always spans the full width */}
      <AppBar 
        position="fixed" 
        sx={{ 
          zIndex: theme.zIndex.drawer + 1,
          boxShadow: 'none',
          borderBottom: '1px solid rgba(0, 0, 0, 0.12)'
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          <Typography 
            variant="h6" 
            noWrap 
            component="div" 
            sx={{ 
              flexGrow: 1,
              fontSize: { xs: '1rem', sm: '1.25rem' },
              display: { xs: 'none', sm: 'block' }
            }}
          >
            Protecther E-Learning Platform
          </Typography>
          
          {/* Mobile title - shorter version */}
          <Typography 
            variant="h6" 
            noWrap 
            component="div" 
            sx={{ 
              flexGrow: 1,
              fontSize: '1rem',
              display: { xs: 'block', sm: 'none' }
            }}
          >
            Protecther
          </Typography>
          <Box
            component="img"
            src={logoImage}
            alt="Company Logo"
            sx={{ 
              width: { xs: 80, sm: 120, md: 180 }, // Smaller on mobile
              height: { xs: 64, sm: 96, md: 144 },
              mr: { xs: 1, sm: 2 }, // Less margin on mobile
              cursor: 'pointer',
              objectFit: 'contain',
              maxHeight: { xs: '40px', sm: '56px', md: '80px' } // Much smaller on mobile
            }}
          />
          <IconButton
            size={isMobile ? "medium" : "large"}
            edge="end"
            aria-label="account"
            aria-controls="menu-appbar"
            aria-haspopup="true"
            onClick={handleProfileMenuOpen}
            color="inherit"
            sx={{
              p: { xs: 0.5, sm: 1 }
            }}
          >
            <Avatar sx={{ 
              width: { xs: 28, sm: 32 }, 
              height: { xs: 28, sm: 32 },
              bgcolor: 'primary.main',
              fontSize: { xs: '0.75rem', sm: '1rem' },
              fontWeight: 600
            }}>
              {currentUser?.firstName && currentUser?.lastName ? 
                `${currentUser.firstName[0]}${currentUser.lastName[0]}`.toUpperCase() :
                currentUser?.username ? 
                  currentUser.username[0].toUpperCase() : 
                  'U'
              }
            </Avatar>
          </IconButton>
        </Toolbar>
      </AppBar>
      
      {/* Account Menu */}
      <Menu
        id="menu-appbar"
        anchorEl={anchorEl}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        keepMounted
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        open={isMenuOpen}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleProfile}>Profile</MenuItem>
        <MenuItem onClick={handleLogout}>Logout</MenuItem>
      </Menu>
      
      {/* Sidebar Drawer - Either overlay or permanent */}
      <Drawer
        variant={isMobile ? "temporary" : "persistent"}
        open={open}
        onClose={isMobile ? handleDrawerToggle : undefined}
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: { 
            width: drawerWidth, 
            boxSizing: 'border-box',
            top: '64px', // Height of AppBar
            height: 'calc(100% - 64px)',
            backgroundColor: '#FFFFFF',
            borderRight: '1px solid rgba(0, 0, 0, 0.12)'
          },
        }}
      >
        {drawer}
      </Drawer>
      
      {/* Main content - Responsive container with dynamic maxWidth */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          pt: 3, // top padding
          px: { xs: 2, sm: 3 }, // horizontal padding - smaller on mobile
          width: '100%',
          mt: '64px', // Height of AppBar
          transition: theme.transitions.create(['padding', 'margin'], {
            easing: theme.transitions.easing.easeOut,
            duration: theme.transitions.duration.enteringScreen,
          }),
          display: 'flex',
          justifyContent: 'center', // Center content horizontally
        }}
      >
        {/* Responsive container - adjusts max-width based on sidebar state */}
        <Container 
          sx={{ 
            maxWidth: {
              xs: '100%',
              sm: open ? 'md' : 'lg', // Narrower when sidebar is open, wider when closed
              md: open ? 'lg' : 'xl',
            },
            px: 0, // Remove default horizontal padding from container
            transition: theme.transitions.create('max-width', {
              easing: theme.transitions.easing.easeOut,
              duration: theme.transitions.duration.enteringScreen,
            }),
          }}
        >
          <Outlet />
        </Container>
      </Box>
    </Box>
  );
};

export default MainLayout;