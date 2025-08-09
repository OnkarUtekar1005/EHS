import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Card,
  CardContent,
  Chip,
  Alert,
  CircularProgress,
  Divider,
  Avatar,
  Stack,
  TextField,
  InputAdornment,
  IconButton
} from '@mui/material';
import {
  Campaign as CampaignIcon,
  Person as PersonIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  Schedule as ScheduleIcon
} from '@mui/icons-material';
import api from '../../services/api';
import { format } from 'date-fns';

const UserAnnouncementView = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [filteredAnnouncements, setFilteredAnnouncements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('ALL');
  const [alert, setAlert] = useState({ show: false, type: '', message: '' });

  const priorities = ['ALL', 'URGENT', 'HIGH', 'MEDIUM', 'LOW'];

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  useEffect(() => {
    filterAnnouncements();
  }, [announcements, searchTerm, selectedPriority]);

  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const response = await api.get('/announcements/active');
      setAnnouncements(response.data);
    } catch (error) {
      setAlert({
        show: true,
        type: 'error',
        message: 'Failed to fetch announcements'
      });
    } finally {
      setLoading(false);
    }
  };

  const filterAnnouncements = () => {
    let filtered = [...announcements];

    if (selectedPriority !== 'ALL') {
      filtered = filtered.filter(announcement => announcement.priority === selectedPriority);
    }

    if (searchTerm) {
      filtered = filtered.filter(announcement =>
        announcement.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        announcement.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        announcement.authorName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredAnnouncements(filtered);
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'URGENT':
        return 'error';
      case 'HIGH':
        return 'warning';
      case 'MEDIUM':
        return 'info';
      case 'LOW':
        return 'success';
      default:
        return 'default';
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'URGENT':
      case 'HIGH':
        return '🔥';
      case 'MEDIUM':
        return '📢';
      case 'LOW':
        return '💬';
      default:
        return '📋';
    }
  };

  const clearSearch = () => {
    setSearchTerm('');
  };

  const isExpiringSoon = (expiresAt) => {
    if (!expiresAt) return false;
    const expiryDate = new Date(expiresAt);
    const now = new Date();
    const timeDiff = expiryDate - now;
    const daysDiff = timeDiff / (1000 * 3600 * 24);
    return daysDiff <= 3 && daysDiff > 0; // Expiring within 3 days
  };

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        mb: 3,
        flexDirection: { xs: 'column', sm: 'row' },
        textAlign: { xs: 'center', sm: 'left' },
        gap: { xs: 1, sm: 0 }
      }}>
        <CampaignIcon sx={{ 
          fontSize: { xs: 28, sm: 32 }, 
          mr: { xs: 0, sm: 2 }, 
          color: 'primary.main' 
        }} />
        <Typography variant="h5" sx={{ fontSize: { xs: '1.5rem', sm: '2.125rem' } }}>
          Announcements
        </Typography>
      </Box>

      {/* Search and Filter Controls */}
      <Paper sx={{ p: { xs: 1.5, sm: 2 }, mb: 3 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center">
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Search announcements..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            size="small"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
              endAdornment: searchTerm && (
                <InputAdornment position="end">
                  <IconButton onClick={clearSearch} size="small">
                    <ClearIcon />
                  </IconButton>
                </InputAdornment>
              )
            }}
          />
          
          <Stack 
            direction={{ xs: 'row', sm: 'row' }} 
            spacing={1}
            sx={{ 
              flexWrap: 'wrap',
              justifyContent: { xs: 'center', md: 'flex-start' },
              '& .MuiChip-root': {
                minWidth: { xs: 'auto', sm: 'auto' }
              }
            }}
          >
            {priorities.map((priority) => (
              <Chip
                key={priority}
                label={priority === 'ALL' ? 'All' : priority}
                onClick={() => setSelectedPriority(priority)}
                color={selectedPriority === priority ? 'primary' : 'default'}
                variant={selectedPriority === priority ? 'filled' : 'outlined'}
                size="small"
              />
            ))}
          </Stack>
        </Stack>
      </Paper>

      {alert.show && (
        <Alert
          severity={alert.type}
          onClose={() => setAlert({ show: false, type: '', message: '' })}
          sx={{ mb: 2 }}
        >
          {alert.message}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      ) : filteredAnnouncements.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <CampaignIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No announcements found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {searchTerm || selectedPriority !== 'ALL' 
              ? 'Try adjusting your search or filter criteria.' 
              : 'There are no active announcements at the moment.'}
          </Typography>
        </Paper>
      ) : (
        <Stack spacing={3}>
          {filteredAnnouncements.map((announcement) => (
            <Card 
              key={announcement.id}
              elevation={3}
              sx={{
                border: announcement.priority === 'URGENT' ? '2px solid' : '1px solid',
                borderColor: announcement.priority === 'URGENT' ? 'error.main' : 'grey.200',
                '&:hover': {
                  boxShadow: 6,
                  transform: 'translateY(-2px)',
                  transition: 'all 0.2s ease-in-out'
                }
              }}
            >
              <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                {/* Header */}
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'flex-start', 
                  mb: 2,
                  flexDirection: { xs: 'column', sm: 'row' },
                  gap: { xs: 1, sm: 0 }
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                    <Typography 
                      variant="subtitle1"
                      component="h3" 
                      sx={{ 
                        fontWeight: 600,
                        fontSize: { xs: '1.1rem', sm: '1.25rem' }
                      }}
                    >
                      {getPriorityIcon(announcement.priority)} {announcement.title}
                    </Typography>
                  </Box>
                  <Box sx={{ 
                    display: 'flex', 
                    gap: 1, 
                    flexShrink: 0, 
                    ml: { xs: 0, sm: 2 },
                    flexWrap: 'wrap'
                  }}>
                    <Chip
                      label={announcement.priority}
                      color={getPriorityColor(announcement.priority)}
                      size="small"
                      variant="filled"
                    />
                    {isExpiringSoon(announcement.expiresAt) && (
                      <Chip
                        label="Expiring Soon"
                        color="warning"
                        size="small"
                        icon={<ScheduleIcon />}
                      />
                    )}
                  </Box>
                </Box>

                {/* Content */}
                <Typography 
                  variant="body1" 
                  paragraph 
                  sx={{ 
                    color: 'text.primary', 
                    lineHeight: 1.6,
                    fontSize: { xs: '0.875rem', sm: '1rem' }
                  }}
                >
                  {announcement.content}
                </Typography>

                <Divider sx={{ my: 2 }} />

                {/* Footer */}
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: { xs: 'flex-start', sm: 'center' },
                  flexDirection: { xs: 'column', sm: 'row' },
                  gap: { xs: 2, sm: 0 }
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Avatar sx={{ 
                      width: { xs: 20, sm: 24 }, 
                      height: { xs: 20, sm: 24 }, 
                      bgcolor: 'primary.main' 
                    }}>
                      <PersonIcon sx={{ fontSize: { xs: 14, sm: 16 } }} />
                    </Avatar>
                    <Typography 
                      variant="body2" 
                      color="text.secondary"
                      sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                    >
                      By {announcement.authorName}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ textAlign: { xs: 'left', sm: 'right' } }}>
                    <Typography 
                      variant="body2" 
                      color="text.secondary"
                      sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                    >
                      {format(new Date(announcement.createdAt), 'MMM dd, yyyy')}
                    </Typography>
                    {announcement.expiresAt && (
                      <Typography 
                        variant="caption" 
                        color="text.secondary" 
                        sx={{ 
                          display: 'block',
                          fontSize: { xs: '0.7rem', sm: '0.75rem' }
                        }}
                      >
                        Expires: {format(new Date(announcement.expiresAt), 'PP')}
                      </Typography>
                    )}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}
    </Box>
  );
};

export default UserAnnouncementView;