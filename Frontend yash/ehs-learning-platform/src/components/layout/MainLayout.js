// src/components/layout/MainLayout.js
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button
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
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import CampaignIcon from '@mui/icons-material/Campaign';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';

const DRAWER_WIDTH = 240;

const MainLayout = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  // Match admin layout: use 'md' breakpoint so tablet sizes behave correctly
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { logout, currentUser } = useAuth();

  const [open, setOpen] = useState(!isMobile);
  const [anchorEl, setAnchorEl] = useState(null);
  const [helpDialog, setHelpDialog] = useState(false);
  const isMenuOpen = Boolean(anchorEl);

  // Keep open state in sync when viewport size changes
  useEffect(() => {
    setOpen(!isMobile);
  }, [isMobile]);

  const handleDrawerToggle = useCallback(() => {
    setOpen(prev => !prev);
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
    navigate('/profile');
  }, [handleMenuClose, navigate]);

  const handleHelpClick = useCallback(() => {
    setHelpDialog(true);
  }, []);

  const handleHelpClose = useCallback(() => {
    setHelpDialog(false);
  }, []);

  const navigationItems = useMemo(() => [
    { path: '/dashboard', icon: <DashboardIcon />, label: 'Dashboard' },
    { path: '/my-courses', icon: <SchoolIcon />, label: 'My Courses' },
    { path: '/reports', icon: <AssessmentIcon />, label: 'Reports' },
    { path: '/announcements', icon: <CampaignIcon />, label: 'Announcements' },
    { path: '/think', icon: <LightbulbIcon />, label: 'Think' },
  ], []);

  const drawer = useMemo(() => (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
      {isMobile && (
        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: 2,
          borderBottom: '1px solid rgba(0, 0, 0, 0.12)'
        }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>Menu</Typography>
          <IconButton onClick={handleDrawerToggle} size="small">
            <KeyboardArrowLeftIcon />
          </IconButton>
        </Box>
      )}

      <List sx={{ mt: isMobile ? 1 : 2, px: { xs: 1, sm: 0 } }}>
        {navigationItems.map(item => (
          <ListItem key={item.path} disablePadding>
            <ListItemButton
              component={Link}
              to={item.path}
              selected={
                item.path === '/dashboard'
                  ? location.pathname === '/dashboard'
                  : location.pathname.startsWith(item.path)
              }
              onClick={isMobile ? handleDrawerToggle : undefined}
              sx={{
                borderRadius: { xs: 1, sm: 0 },
                mx: { xs: 1, sm: 0 },
                mb: { xs: 0.5, sm: 0 },
                minHeight: { xs: 48, sm: 40 },
                transition: 'all 0.2s ease-in-out',
                '&.Mui-selected': {
                  backgroundColor: 'rgba(25, 118, 210, 0.15)',
                  color: '#1565c0',
                  borderLeft: { xs: 'none', sm: '4px solid' },
                  borderLeftColor: { sm: '#1565c0' },
                  borderRadius: { xs: 1, sm: '0 8px 8px 0' },
                  fontWeight: 600,
                  '& .MuiListItemIcon-root': { color: '#1565c0', transform: 'scale(1.1)' },
                  '& .MuiListItemText-primary': { fontWeight: 600, color: '#1565c0' },
                  '&:hover': { backgroundColor: 'rgba(25, 118, 210, 0.2)' },
                },
                '&:hover:not(.Mui-selected)': {
                  backgroundColor: 'rgba(0, 0, 0, 0.04)',
                  borderRadius: { xs: 1, sm: 0 }
                }
              }}
              className="sidebar-list-item"
            >
              <ListItemIcon sx={{ minWidth: { xs: 40, sm: 56 } }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={item.label}
                primaryTypographyProps={{
                  fontSize: { xs: '0.875rem', sm: '1rem' },
                  fontWeight: { xs: 500, sm: 400 }
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}

        {/* Help — opens dialog, not a route */}
        <ListItem disablePadding>
          <ListItemButton
            onClick={handleHelpClick}
            sx={{
              borderRadius: { xs: 1, sm: 0 },
              mx: { xs: 1, sm: 0 },
              mb: { xs: 0.5, sm: 0 },
              minHeight: { xs: 48, sm: 40 },
              transition: 'all 0.2s ease-in-out',
              '&:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.04)',
                borderRadius: { xs: 1, sm: 0 }
              }
            }}
            className="sidebar-list-item"
          >
            <ListItemIcon sx={{ minWidth: { xs: 40, sm: 56 } }}>
              <HelpOutlineIcon />
            </ListItemIcon>
            <ListItemText
              primary="Help"
              primaryTypographyProps={{
                fontSize: { xs: '0.875rem', sm: '1rem' },
                fontWeight: { xs: 500, sm: 400 }
              }}
            />
          </ListItemButton>
        </ListItem>
      </List>

      <Box sx={{ flexGrow: 1 }} />

      {/* User info at bottom */}
      {currentUser && (
        <Box sx={{
          p: 2,
          borderTop: '1px solid rgba(0, 0, 0, 0.12)',
          backgroundColor: 'grey.50'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{
              width: 36,
              height: 36,
              bgcolor: 'primary.main',
              fontSize: '0.875rem',
              fontWeight: 600
            }}>
              {currentUser?.firstName && currentUser?.lastName
                ? `${currentUser.firstName[0]}${currentUser.lastName[0]}`.toUpperCase()
                : currentUser?.username
                  ? currentUser.username[0].toUpperCase()
                  : 'U'}
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
  ), [navigationItems, isMobile, handleDrawerToggle, handleHelpClick, location.pathname, currentUser]);

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
            aria-label={open ? 'close drawer' : 'open drawer'}
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          <Box
            component="img"
            src={logoImage}
            alt="Company Logo"
            sx={{
              width: { xs: 80, sm: 120 },
              height: { xs: 64, sm: 96 },
              mr: { xs: 1, sm: 2 },
              cursor: 'pointer',
              objectFit: 'contain',
              maxHeight: { xs: '40px', sm: '56px' }
            }}
          />
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
          <IconButton
            size="large"
            edge="end"
            aria-label="account"
            aria-controls="menu-appbar"
            aria-haspopup="true"
            onClick={handleProfileMenuOpen}
            color="inherit"
            sx={{ p: { xs: 0.5, sm: 1 } }}
          >
            <Avatar sx={{
              width: { xs: 28, sm: 32 },
              height: { xs: 28, sm: 32 },
              bgcolor: 'primary.main',
              fontSize: { xs: '0.75rem', sm: '1rem' },
              fontWeight: 600
            }}>
              {currentUser?.firstName && currentUser?.lastName
                ? `${currentUser.firstName[0]}${currentUser.lastName[0]}`.toUpperCase()
                : currentUser?.username
                  ? currentUser.username[0].toUpperCase()
                  : 'U'}
            </Avatar>
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* Account Menu */}
      <Menu
        id="menu-appbar"
        anchorEl={anchorEl}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        keepMounted
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        open={isMenuOpen}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleProfile}>Profile</MenuItem>
        <MenuItem onClick={handleLogout}>Logout</MenuItem>
      </Menu>

      {/* Sidebar Drawer */}
      <Drawer
        variant={isMobile ? 'temporary' : 'persistent'}
        open={open}
        onClose={isMobile ? handleDrawerToggle : undefined}
        sx={{
          // Drawer width drives the flex offset — 0 when closed so no blank gap
          width: open ? DRAWER_WIDTH : 0,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: {
            width: DRAWER_WIDTH,
            boxSizing: 'border-box',
            // Mobile (temporary): full-height overlay from top
            // Desktop (persistent): sits below the AppBar
            top: { xs: 0, md: '64px' },
            height: { xs: '100%', md: 'calc(100% - 64px)' },
            backgroundColor: '#FFFFFF',
            borderRight: '1px solid rgba(0, 0, 0, 0.12)',
            zIndex: { xs: theme.zIndex.drawer + 2, md: theme.zIndex.drawer }
          },
          transition: theme.transitions.create(['width'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
        }}
        ModalProps={{ keepMounted: true }}
      >
        {drawer}
      </Drawer>

      {/* Main content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          pt: { xs: 2, sm: 3 },
          // Width shrinks to make room for the persistent drawer; full width when closed
          width: {
            xs: '100%',
            md: open ? `calc(100% - ${DRAWER_WIDTH}px)` : '100%'
          },
          mt: { xs: '56px', sm: '64px' },
          transition: theme.transitions.create(['width', 'margin'], {
            easing: theme.transitions.easing.easeOut,
            duration: theme.transitions.duration.enteringScreen,
          }),
          minHeight: { xs: 'calc(100vh - 56px)', sm: 'calc(100vh - 64px)' },
          overflow: 'auto'
        }}
      >
        <Container
          sx={{
            maxWidth: { xs: '100%', sm: 'md', md: 'lg', lg: 'xl' },
            px: { xs: 1, sm: 2, md: 3 },
            pb: { xs: 2, sm: 3 }
          }}
        >
          <Outlet />
        </Container>
      </Box>

      {/* Help Dialog */}
      <Dialog open={helpDialog} onClose={handleHelpClose} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ textAlign: 'center', pb: 1 }}>
          <HelpOutlineIcon sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
          <Typography variant="h5" component="div">Need Help?</Typography>
        </DialogTitle>
        <DialogContent sx={{ textAlign: 'center', py: 3 }}>
          <Typography variant="body1" paragraph>
            For any assistance or technical support, please contact the administrator.
          </Typography>
          <Box sx={{
            bgcolor: 'primary.50',
            borderRadius: 2,
            p: 3,
            mt: 2,
            border: '1px solid',
            borderColor: 'primary.200'
          }}>
            <Typography variant="h6" color="primary" gutterBottom>
              Administrator Contact
            </Typography>
            <Typography variant="h4" component="div" sx={{
              fontWeight: 'bold',
              color: 'primary.main',
              letterSpacing: '0.1em'
            }}>
              📞 +91 88300 24093
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              India Standard Time (IST)
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 3 }}>
            Our administrator will be happy to assist you with any questions or issues you may have.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 3 }}>
          <Button onClick={handleHelpClose} variant="contained" size="large" sx={{ minWidth: 120 }}>
            Got it
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default React.memo(MainLayout);
