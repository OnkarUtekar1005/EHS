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
import SecurityIcon from '@mui/icons-material/Security';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import DomainIcon from '@mui/icons-material/Domain';
import logoImage from '../../assets/logo-image.jpg';
import KeyboardArrowLeftIcon from '@mui/icons-material/KeyboardArrowLeft';
import SchoolIcon from '@mui/icons-material/School';

// Drawer width
const drawerWidth = 240;

// Domain mock data - replace with API data in production
const DOMAINS = [
  { id: 1, name: 'Fire Safety', icon: <SecurityIcon /> },
  { id: 2, name: 'OSHA', icon: <DomainIcon /> },
  { id: 3, name: 'First Aid', icon: <LocalHospitalIcon /> },
];

const MainLayout = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { logout } = useAuth();
  
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
      
      <Divider sx={{ my: 2 }} />
      
      <Box className="domain-header">
        <Typography
          variant="subtitle2"
          color="text.secondary"
          sx={{ fontSize: '0.75rem', fontWeight: 500, letterSpacing: '0.08em' }}
        >
          DOMAINS
        </Typography>
      </Box>
      
      <List>
        {DOMAINS.map((domain) => (
          <ListItem key={domain.id} disablePadding>
            <ListItemButton
              component={Link}
              to={`/domains/${domain.id}`}
              selected={location.pathname === `/domains/${domain.id}`}
              className="sidebar-list-item"
            >
              <ListItemIcon>
                {domain.icon}
              </ListItemIcon>
              <ListItemText primary={domain.name} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
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
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            Protecther E-Learning Platform
          </Typography>
          <Box
            component="img"
            src={logoImage}
            alt="Company Logo"
            sx={{ 
              width: 120, 
              height: 96, 
              mr: 2,
              cursor: 'pointer',
              objectFit: 'contain',
              maxHeight: '56px'
            }}
          />
          <IconButton
            size="large"
            edge="end"
            aria-label="account"
            aria-controls="menu-appbar"
            aria-haspopup="true"
            onClick={handleProfileMenuOpen}
            color="inherit"
          >
            <Avatar sx={{ width: 32, height: 32 }} />
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