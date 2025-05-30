// src/components/layout/Header.js
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  IconButton, 
  Avatar, 
  Menu, 
  MenuItem, 
  Box,
  CircularProgress,
  Divider
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import logoImage from '../../assets/logo-image.jpg';

const Header = ({ toggleSidebar, sidebarOpen, drawerWidth }) => {
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  
  const [anchorEl, setAnchorEl] = useState(null);
  const [loggingOut, setLoggingOut] = useState(false);
  const isMenuOpen = Boolean(anchorEl);

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    try {
      setLoggingOut(true);
      await logout();
      handleMenuClose();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setLoggingOut(false);
    }
  };

  const handleProfile = () => {
    handleMenuClose();
    navigate('/profile');
  };

  // Generate avatar letters from user name
  const getAvatarLetters = () => {
    if (!currentUser) return '';
    
    if (currentUser.firstName && currentUser.lastName) {
      return `${currentUser.firstName[0]}${currentUser.lastName[0]}`;
    } else if (currentUser.username) {
      return currentUser.username[0].toUpperCase();
    }
    
    return '';
  };

  return (
    <AppBar 
      position="fixed" 
      sx={{ 
        zIndex: theme => theme.zIndex.drawer + 1,
        boxShadow: 'none',
        borderBottom: '1px solid rgba(0, 0, 0, 0.12)'
      }}
    >
      <Toolbar>
        <IconButton
          color="inherit"
          aria-label="open drawer"
          edge="start"
          onClick={toggleSidebar}
          sx={{ mr: 2 }}
        >
          <MenuIcon />
        </IconButton>
        
        <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
          Protecther E-Learning Platform
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Box
            component="img"
            src={logoImage}
            alt="Company Logo"
            sx={{ 
              width: 228, // 90% bigger: 120 * 1.9 = 228
              height: 182, // 90% bigger: 96 * 1.9 = 182
              mr: 3,
              cursor: 'pointer',
              objectFit: 'contain',
              maxHeight: '106px', // 90% bigger: 56 * 1.9 = 106
              transition: 'transform 0.2s ease-in-out',
              '&:hover': {
                transform: 'scale(1.05)',
              }
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
            sx={{
              ml: 1,
              p: 0.5,
              transition: 'all 0.2s ease-in-out',
              '&:hover': {
                bgcolor: 'rgba(255, 255, 255, 0.1)',
                transform: 'scale(1.05)',
              }
            }}
          >
            <Avatar 
              sx={{ 
                width: 44, // Bigger avatar: 32 -> 44
                height: 44, 
                bgcolor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
                border: '2px solid rgba(255, 255, 255, 0.2)',
                fontWeight: 600,
                fontSize: '1.1rem',
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  boxShadow: '0 6px 12px rgba(0,0,0,0.3)',
                  transform: 'translateY(-1px)',
                }
              }}
            >
              {getAvatarLetters()}
            </Avatar>
          </IconButton>
        </Box>

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
          {currentUser && (
            <Box sx={{ px: 2, py: 1, minWidth: 180 }}>
              <Typography variant="subtitle1">
                {currentUser.firstName && currentUser.lastName
                  ? `${currentUser.firstName} ${currentUser.lastName}`
                  : currentUser.username}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {currentUser.email}
              </Typography>
            </Box>
          )}
          <Divider />
          <MenuItem onClick={handleProfile}>Profile</MenuItem>
          <MenuItem onClick={handleLogout} disabled={loggingOut}>
            {loggingOut ? (
              <>
                <CircularProgress size={16} sx={{ mr: 1 }} />
                Logging out...
              </>
            ) : 'Logout'}
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
};

export default Header;