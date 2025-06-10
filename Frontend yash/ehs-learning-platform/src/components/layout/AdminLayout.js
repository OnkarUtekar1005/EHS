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
import logoImage from '../../assets/logo-image.jpg';
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
    { path: '/admin/domains', icon: <CategoryIcon />, label: 'Books' },
    { path: '/admin/courses', icon: <BookIcon />, label: 'Chapter/Modules' },
    { path: '/admin/materials', icon: <CloudUploadIcon />, label: 'Materials' },
    { path: '/admin/assessments', icon: <AssessmentIcon />, label: 'Assessments' }
  ], []);

  const quickActions = useMemo(() => [
    { path: '/admin/users', state: { openAddUserModal: true }, icon: <PersonAddIcon />, label: 'New User' },
    { path: '/admin/materials', state: { openUploadModal: true }, icon: <CloudUploadIcon />, label: 'Upload Material' },
    { path: '/admin/courses', state: { openCreateModal: true }, icon: <AddBoxIcon />, label: 'Add New Course' }
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
    <Box sx={{ 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      overflow: 'auto' // Allow scrolling on mobile if needed
    }}>
      {isMobile && (
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          p: 2,
          borderBottom: '1px solid rgba(0, 0, 0, 0.12)'
        }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Menu
          </Typography>
          <IconButton 
            onClick={handleDrawerToggle} 
            aria-label="Close menu"
            size="small"
          >
            <KeyboardArrowLeftIcon />
          </IconButton>
        </Box>
      )}
      
      <List 
        component="nav" 
        aria-label="Main navigation" 
        sx={{ 
          mt: isMobile ? 1 : 2,
          px: { xs: 1, sm: 0 } // Add padding on mobile
        }}
      >
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
              onClick={isMobile ? handleDrawerToggle : undefined} // Close on mobile after click
              sx={{
                borderRadius: { xs: 1, sm: 0 }, // Rounded on mobile
                mx: { xs: 1, sm: 0 },
                mb: { xs: 0.5, sm: 0 },
                minHeight: { xs: 48, sm: 40 }, // Larger touch targets on mobile
                position: 'relative',
                transition: 'all 0.2s ease-in-out',
                '&.Mui-selected': {
                  backgroundColor: 'rgba(25, 118, 210, 0.15)', // Slightly stronger blue background
                  color: '#1565c0', // Darker blue for better contrast
                  borderLeft: { xs: 'none', sm: '4px solid' },
                  borderLeftColor: { sm: '#1565c0' },
                  borderRadius: { xs: 1, sm: '0 8px 8px 0' },
                  fontWeight: 600,
                  position: 'relative',
                  '& .MuiListItemIcon-root': {
                    color: '#1565c0',
                    transform: 'scale(1.1)', // Slightly larger icon
                  },
                  '& .MuiListItemText-primary': {
                    fontWeight: 600,
                    color: '#1565c0',
                  },
                  '&:hover': {
                    backgroundColor: 'rgba(25, 118, 210, 0.2)',
                  },
                  // Add subtle shadow and border for better visibility
                  boxShadow: { 
                    xs: '0 2px 8px rgba(25, 118, 210, 0.2)', 
                    sm: 'inset 0 1px 0 rgba(255, 255, 255, 0.1)' 
                  },
                  // Add subtle gradient for premium feel
                  background: { 
                    xs: 'linear-gradient(135deg, rgba(25, 118, 210, 0.15) 0%, rgba(25, 118, 210, 0.12) 100%)',
                    sm: 'rgba(25, 118, 210, 0.15)'
                  }
                },
                '&:hover:not(.Mui-selected)': {
                  backgroundColor: 'rgba(0, 0, 0, 0.04)',
                  borderRadius: { xs: 1, sm: 0 }
                }
              }}
              className="sidebar-list-item"
            >
              <ListItemIcon 
                sx={{ 
                  minWidth: { xs: 40, sm: 56 } // Smaller icon spacing on mobile
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText 
                primary={item.label}
                primaryTypographyProps={{
                  fontSize: { xs: '0.875rem', sm: '1rem' },
                  fontWeight: { xs: 500, sm: 400 }
                }}
                sx={{
                  '& .MuiTypography-root': {
                    transition: 'font-weight 0.2s ease-in-out'
                  }
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      
      <Divider sx={{ my: 2, mx: { xs: 2, sm: 0 } }} />
      
      <Box sx={{ px: { xs: 3, sm: 2 } }}>
        <Typography
          variant="subtitle2"
          color="text.secondary"
          sx={{ 
            fontSize: { xs: '0.75rem', sm: '0.75rem' }, 
            fontWeight: 600, 
            letterSpacing: '0.08em',
            mb: 1
          }}
        >
          QUICK ACTIONS
        </Typography>
      </Box>
      
      <List 
        component="nav" 
        aria-label="Quick actions"
        sx={{ px: { xs: 1, sm: 0 } }}
      >
        {quickActions.map(action => (
          <ListItem key={action.path} disablePadding>
            <ListItemButton
              component={Link}
              to={action.path}
              state={action.state}
              onClick={isMobile ? handleDrawerToggle : undefined} // Close on mobile after click
              sx={{
                borderRadius: { xs: 1, sm: 0 },
                mx: { xs: 1, sm: 0 },
                mb: { xs: 0.5, sm: 0 },
                minHeight: { xs: 48, sm: 40 },
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  backgroundColor: 'rgba(25, 118, 210, 0.08)',
                  borderRadius: { xs: 1, sm: 0 },
                  color: 'primary.main',
                  '& .MuiListItemIcon-root': {
                    color: 'primary.main',
                  }
                }
              }}
              className="sidebar-list-item"
            >
              <ListItemIcon
                sx={{ 
                  minWidth: { xs: 40, sm: 56 }
                }}
              >
                {action.icon}
              </ListItemIcon>
              <ListItemText 
                primary={action.label}
                primaryTypographyProps={{
                  fontSize: { xs: '0.875rem', sm: '1rem' },
                  fontWeight: { xs: 500, sm: 400 }
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      
      {/* Mobile user info at bottom */}
      {isMobile && currentUser && (
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
                bgcolor: 'primary.main'
              }}
              src={currentUser?.profileImage}
            >
              {!currentUser?.profileImage && (currentUser?.firstName?.[0] || currentUser?.name?.charAt(0) || 'A')}
            </Avatar>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
                {currentUser?.firstName && currentUser?.lastName
                  ? `${currentUser.firstName} ${currentUser.lastName}`
                  : currentUser?.name || 'Admin User'}
              </Typography>
              <Typography variant="caption" color="text.secondary" noWrap>
                {currentUser?.email}
              </Typography>
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  ), [navigationItems, quickActions, isMobile, handleDrawerToggle, location.pathname, currentUser]);

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
            Protecther E-Learning Platform - Admin Dashboard
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
            Admin Dashboard
          </Typography>
          
          <Box
            component="img"
            src={logoImage}
            alt="Company Logo"
            sx={{ 
              width: { xs: 80, sm: 120 }, // Smaller on mobile
              height: { xs: 64, sm: 96 }, 
              mr: { xs: 1, sm: 2 },
              cursor: 'pointer',
              objectFit: 'contain',
              maxHeight: { xs: '40px', sm: '56px' } // Smaller on mobile
            }}
          />
          
          <Tooltip title="Account">
            <IconButton
              size="large"
              edge="end"
              aria-label="account"
              aria-controls="menu-appbar"
              aria-haspopup="true"
              onClick={handleProfileMenuOpen}
              color="inherit"
              sx={{
                p: { xs: 0.5, sm: 1 } // Smaller padding on mobile
              }}
            >
              <Avatar 
                sx={{ 
                  width: { xs: 28, sm: 32 }, // Smaller on mobile
                  height: { xs: 28, sm: 32 },
                  bgcolor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                  fontSize: { xs: '0.875rem', sm: '1rem' }
                }} 
                alt={currentUser?.name || 'User'}
                src={currentUser?.profileImage}
              >
                {!currentUser?.profileImage && (currentUser?.firstName?.[0] || currentUser?.name?.charAt(0) || 'A')}
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
            top: { xs: 0, md: '64px' }, // Full height on mobile
            height: { xs: '100%', md: 'calc(100% - 64px)' },
            backgroundColor: '#FFFFFF',
            borderRight: '1px solid rgba(0, 0, 0, 0.12)',
            zIndex: { xs: theme.zIndex.drawer + 2, md: theme.zIndex.drawer } // Higher z-index on mobile
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
      
      {/* Main content - Enhanced mobile responsiveness */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          pt: { xs: 2, sm: 3 }, // Less padding on mobile
          width: { 
            xs: '100%',
            md: open ? `calc(100% - ${DRAWER_WIDTH}px)` : '100%'
          },
          mt: { xs: '56px', sm: '64px' }, // Smaller header on mobile
          transition: theme.transitions.create(['width', 'margin'], {
            easing: theme.transitions.easing.easeOut,
            duration: theme.transitions.duration.enteringScreen,
          }),
          minHeight: { xs: 'calc(100vh - 56px)', sm: 'calc(100vh - 64px)' },
          overflow: 'auto' // Allow scrolling
        }}
      >
        <Container 
          sx={{ 
            maxWidth: {
              xs: '100%',
              sm: 'md',
              md: 'lg',
              lg: 'xl'
            },
            px: { xs: 1, sm: 2, md: 3 }, // Progressive padding
            pb: { xs: 2, sm: 3 } // Bottom padding for mobile
          }}
        >
          <Outlet />
        </Container>
      </Box>
    </Box>
  );
};

export default React.memo(AdminLayout);