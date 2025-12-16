// src/components/common/ProfileCompletionModal.js
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Avatar,
  useTheme,
  alpha,
  Fade
} from '@mui/material';
import {
  Person as PersonIcon,
  ArrowForward as ArrowForwardIcon,
  Close as CloseIcon,
  Badge as BadgeIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const ProfileCompletionModal = ({ open, onClose, currentUser }) => {
  const navigate = useNavigate();
  const theme = useTheme();

  const handleGoToProfile = () => {
    navigate('/profile');
    if (onClose) {
      onClose();
    }
  };

  const handleRemindLater = () => {
    if (onClose) {
      onClose();
    }
  };

  // Check if profile is incomplete
  const isProfileIncomplete = !currentUser?.firstName || !currentUser?.lastName;

  // Only show the modal if profile is incomplete
  if (!isProfileIncomplete) {
    return null;
  }

  const missingFields = [];
  if (!currentUser?.firstName) missingFields.push('First Name');
  if (!currentUser?.lastName) missingFields.push('Last Name');

  return (
    <Dialog
      open={open}
      onClose={handleRemindLater}
      maxWidth="xs"
      fullWidth
      TransitionComponent={Fade}
      transitionDuration={300}
      PaperProps={{
        sx: {
          borderRadius: 4,
          boxShadow: '0 24px 48px rgba(0,0,0,0.2)',
          overflow: 'visible',
          position: 'relative'
        }
      }}
    >
      {/* Top Avatar - Overlapping */}
      <Box
        sx={{
          position: 'absolute',
          top: -40,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1
        }}
      >
        <Avatar
          sx={{
            width: 80,
            height: 80,
            bgcolor: theme.palette.primary.main,
            boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.4)}`,
            border: `4px solid white`
          }}
        >
          <BadgeIcon sx={{ fontSize: 40 }} />
        </Avatar>
      </Box>

      <DialogContent sx={{ pt: 7, pb: 2, px: 3, textAlign: 'center' }}>
        {/* Title */}
        <Typography
          variant="h5"
          sx={{
            fontWeight: 700,
            mb: 1,
            color: theme.palette.text.primary
          }}
        >
          Complete Your Profile
        </Typography>

        {/* Subtitle */}
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mb: 3, lineHeight: 1.6 }}
        >
          Add your name to receive personalized certificates when you complete courses.
        </Typography>

        {/* Missing Fields Cards */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 3 }}>
          {missingFields.map((field, index) => (
            <Box
              key={index}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                p: 2,
                borderRadius: 2,
                bgcolor: alpha(theme.palette.warning.main, 0.08),
                border: `1px solid ${alpha(theme.palette.warning.main, 0.2)}`
              }}
            >
              <Avatar
                sx={{
                  width: 36,
                  height: 36,
                  bgcolor: alpha(theme.palette.warning.main, 0.15),
                  color: theme.palette.warning.dark
                }}
              >
                <PersonIcon sx={{ fontSize: 20 }} />
              </Avatar>
              <Box sx={{ textAlign: 'left', flex: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: theme.palette.warning.dark }}>
                  {field} Required
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  This field is needed for your certificate
                </Typography>
              </Box>
            </Box>
          ))}
        </Box>

        {/* Info text */}
        <Box
          sx={{
            p: 2,
            borderRadius: 2,
            bgcolor: alpha(theme.palette.info.main, 0.08),
            border: `1px dashed ${alpha(theme.palette.info.main, 0.3)}`
          }}
        >
          <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.5 }}>
            Your name will appear on all certificates you earn. This helps verify your achievements.
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3, pt: 1, flexDirection: 'column', gap: 1.5 }}>
        <Button
          variant="contained"
          size="large"
          fullWidth
          endIcon={<ArrowForwardIcon />}
          onClick={handleGoToProfile}
          sx={{
            py: 1.5,
            textTransform: 'none',
            fontWeight: 600,
            borderRadius: 3,
            fontSize: '1rem',
            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
            boxShadow: `0 4px 14px ${alpha(theme.palette.primary.main, 0.4)}`,
            '&:hover': {
              boxShadow: `0 6px 20px ${alpha(theme.palette.primary.main, 0.5)}`,
              transform: 'translateY(-1px)'
            },
            transition: 'all 0.2s ease-in-out'
          }}
        >
          Complete Profile Now
        </Button>

        <Button
          variant="text"
          size="small"
          onClick={handleRemindLater}
          startIcon={<CloseIcon sx={{ fontSize: 16 }} />}
          sx={{
            textTransform: 'none',
            color: 'text.secondary',
            fontWeight: 500,
            '&:hover': {
              bgcolor: 'transparent',
              color: 'text.primary'
            }
          }}
        >
          Remind me later
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ProfileCompletionModal;
