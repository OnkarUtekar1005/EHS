// src/components/layout/AdminLayout.js
import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Outlet } from 'react-router-dom';
import { 
  Box, 
  CssBaseline, 
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  useMediaQuery,
  Avatar,
  Menu,
  MenuItem,
  Container,
  Divider,
  Badge,
  Tooltip
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

// Icons
import MenuIcon from '@mui/icons-material/Menu';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import CategoryIcon from '@mui/icons-material/Category';
import BookIcon from '@mui/icons-material/Book';
import SettingsIcon from '@mui/icons-material/Settings';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import NotificationsIcon from '@mui/icons-material/Notifications';
import KeyboardArrowLeftIcon from '@mui/icons-material/KeyboardArrowLeft';
import AddBoxIcon from '@mui/icons-material/AddBox';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import AssessmentIcon from '@mui/icons-material/Assessment';

// Constants
const DRAWER_WIDTH = 240;

const AdminLayout = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { logout, currentUser } = useAuth();
  
  // Initialize drawer state based on screen size
  const [open, setOpen] = useState(!isMobile);
  const [anchorEl, setAnchorEl] = useState(null);
  const isMenuOpen = Boolean(anchorEl);
  const [notificationCount, setNotificationCount] = useState(3); // Example notification count

  // Update drawer state when screen size changes
  useEffect(() => {
    setOpen(!isMobile);
  }, [isMobile]);

  // Memoize navigation items to prevent unnecessary re-renders
  const navigationItems = useMemo(() => [
    { path: '/admin', icon: <DashboardIcon />, label: 'Dashboard' },
    { path: '/admin/users', icon: <PeopleIcon />, label: 'Users' },
    { path: '/admin/domains', icon: <CategoryIcon />, label: 'Domains' },
    { path: '/admin/courses', icon: <BookIcon />, label: 'Courses' },
    { path: '/admin/materials', icon: <CloudUploadIcon />, label: 'Materials' },
    { path: '/admin/assessments', icon: <AssessmentIcon />, label: 'Assessments' },
    { path: '/admin/settings', icon: <SettingsIcon />, label: 'Settings' }
  ], []);

  const quickActions = useMemo(() => [
    { path: '/admin/users/new', icon: <PersonAddIcon />, label: 'New User' }
  ], []);

  // Use callbacks for event handlers to prevent unnecessary re-renders
  const handleDrawerToggle = useCallback(() => {
    setOpen(prevOpen => !prevOpen);
  }, []);
  
  const handleProfileMenuOpen = useCallback((event) => {
    setAnchorEl(event.currentTarget);
  }, []);

  const handleMenuClose = useCallback(() => {
    setAnchorEl(null);
  }, []);

  const handleLogout = useCallback(() => {
    handleMenuClose();
    logout();
    navigate('/login', { replace: true });
  }, [handleMenuClose, logout, navigate]);

  const handleProfile = useCallback(() => {
    handleMenuClose();
    navigate('/admin/profile');
  }, [handleMenuClose, navigate]);

  // Memoize drawer content to prevent unnecessary re-renders
  const drawer = useMemo(() => (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {isMobile && (
        <Box sx={{ display: 'flex', alignItems: 'center', p: 1 }}>
          <IconButton onClick={handleDrawerToggle} aria-label="Close menu">
            <KeyboardArrowLeftIcon />
          </IconButton>
        </Box>
      )}
      
      <List component="nav" aria-label="Main navigation" sx={{ mt: 2 }}>
        {navigationItems.map(item => (
          <ListItem key={item.path} disablePadding>
            <ListItemButton
              component={Link}
              to={item.path}
              selected={
                item.path === '/admin' 
                  ? location.pathname === '/admin'
                  : location.pathname.startsWith(item.path)
              }
              className="sidebar-list-item"
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      
      <Divider sx={{ my: 2 }} />
      
      <Box sx={{ px: 2 }}>
        <Typography
          variant="subtitle2"
          color="text.secondary"
          sx={{ fontSize: '0.75rem', fontWeight: 500, letterSpacing: '0.08em' }}
        >
          QUICK ACTIONS
        </Typography>
      </Box>
      
      <List component="nav" aria-label="Quick actions">
        {quickActions.map(action => (
          <ListItem key={action.path} disablePadding>
            <ListItemButton
              component={Link}
              to={action.path}
              className="sidebar-list-item"
            >
              <ListItemIcon>{action.icon}</ListItemIcon>
              <ListItemText primary={action.label} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  ), [navigationItems, quickActions, isMobile, handleDrawerToggle, location.pathname]);

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <CssBaseline />
      
      {/* App Bar */}
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
            aria-label={open ? "close drawer" : "open drawer"}
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            EHS E-Learning Platform - Admin Dashboard
          </Typography>
          
          <Tooltip title="Notifications">
            <IconButton
              size="large"
              aria-label={`show ${notificationCount} notifications`}
              color="inherit"
            >
              <Badge badgeContent={notificationCount} color="error">
                <NotificationsIcon />
              </Badge>
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Account">
            <IconButton
              size="large"
              edge="end"
              aria-label="account"
              aria-controls="menu-appbar"
              aria-haspopup="true"
              onClick={handleProfileMenuOpen}
              color="inherit"
            >
              <Avatar 
                sx={{ width: 32, height: 32 }} 
                alt={currentUser?.name || 'User'}
                src={currentUser?.profileImage}
              >
                {!currentUser?.profileImage && currentUser?.name?.charAt(0)}
              </Avatar>
            </IconButton>
          </Tooltip>
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
      
      {/* Sidebar Drawer */}
      <Drawer
        variant={isMobile ? "temporary" : "persistent"}
        open={open}
        onClose={isMobile ? handleDrawerToggle : undefined}
        sx={{
          width: open ? DRAWER_WIDTH : 0,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: { 
            width: DRAWER_WIDTH, 
            boxSizing: 'border-box',
            top: '64px',
            height: 'calc(100% - 64px)',
            backgroundColor: '#FFFFFF',
            borderRight: '1px solid rgba(0, 0, 0, 0.12)'
          },
          transition: theme.transitions.create(['width'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
        }}
        ModalProps={{
          keepMounted: true, // Better mobile performance
        }}
      >
        {drawer}
      </Drawer>
      
      {/* Main content - FIXED ALIGNMENT ISSUE */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          pt: 3,
          width: { 
            xs: '100%',
            md: open ? `calc(100% - ${DRAWER_WIDTH}px)` : '100%'
          },
          mt: '64px',
          transition: theme.transitions.create(['width', 'margin'], {
            easing: theme.transitions.easing.easeOut,
            duration: theme.transitions.duration.enteringScreen,
          }),
        }}
      >
        <Container 
          sx={{ 
            maxWidth: {
              xs: '100%',
              md: 'lg',
              lg: 'xl'
            },
            px: { xs: 2, sm: 3 },
          }}
        >
          <Outlet />
        </Container>
      </Box>
    </Box>
  );
};

export default React.memo(AdminLayout);