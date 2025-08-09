import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  IconButton,
  Alert,
  CircularProgress,
  Fab,
  Stack,
  Card,
  CardContent,
  Grid,
  Switch,
  FormControlLabel,
  Avatar,
  useTheme
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  ToggleOff as ToggleOffIcon,
  ToggleOn as ToggleOnIcon,
  Campaign as CampaignIcon,
  Search as SearchIcon,
  NotificationsActive as ActiveIcon,
  PriorityHigh as UrgentIcon,
  Warning as HighIcon,
  Info as MediumIcon,
  CheckCircle as LowIcon
} from '@mui/icons-material';
import api from '../../services/api';
import { format } from 'date-fns';

const AdminAnnouncementView = () => {
  const theme = useTheme();
  const [announcements, setAnnouncements] = useState([]);
  const [filteredAnnouncements, setFilteredAnnouncements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [createDialog, setCreateDialog] = useState(false);
  const [editDialog, setEditDialog] = useState(false);
  const [viewDialog, setViewDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    authorName: '',
    priority: 'MEDIUM',
    expiresAt: '',
    isActive: true
  });
  const [alert, setAlert] = useState({ show: false, type: '', message: '' });
  const [stats, setStats] = useState({});

  const priorities = [
    { value: 'LOW', label: 'Low', color: 'success' },
    { value: 'MEDIUM', label: 'Medium', color: 'info' },
    { value: 'HIGH', label: 'High', color: 'warning' },
    { value: 'URGENT', label: 'Urgent', color: 'error' }
  ];

  useEffect(() => {
    fetchAnnouncements();
    fetchStats();
  }, []);

  useEffect(() => {
    filterAnnouncements();
  }, [announcements, searchTerm]);

  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const response = await api.get('/announcements/admin/all');
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

  const fetchStats = async () => {
    try {
      const response = await api.get('/announcements/admin/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const filterAnnouncements = () => {
    let filtered = [...announcements];

    if (searchTerm) {
      filtered = filtered.filter(announcement =>
        announcement.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        announcement.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        announcement.authorName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredAnnouncements(filtered);
  };

  const handleCreate = async () => {
    try {
      await api.post('/announcements/admin/create', {
        ...formData,
        expiresAt: formData.expiresAt || null
      });

      setAlert({
        show: true,
        type: 'success',
        message: 'Announcement created successfully'
      });

      setCreateDialog(false);
      resetForm();
      fetchAnnouncements();
      fetchStats();
    } catch (error) {
      setAlert({
        show: true,
        type: 'error',
        message: 'Failed to create announcement'
      });
    }
  };

  const handleEdit = async () => {
    try {
      await api.put(`/announcements/admin/${selectedAnnouncement.id}`, {
        ...formData,
        expiresAt: formData.expiresAt || null
      });

      setAlert({
        show: true,
        type: 'success',
        message: 'Announcement updated successfully'
      });

      setEditDialog(false);
      resetForm();
      fetchAnnouncements();
    } catch (error) {
      setAlert({
        show: true,
        type: 'error',
        message: 'Failed to update announcement'
      });
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/announcements/admin/${selectedAnnouncement.id}`);

      setAlert({
        show: true,
        type: 'success',
        message: 'Announcement deleted successfully'
      });

      setDeleteDialog(false);
      fetchAnnouncements();
      fetchStats();
    } catch (error) {
      setAlert({
        show: true,
        type: 'error',
        message: 'Failed to delete announcement'
      });
    }
  };

  const handleToggleStatus = async (id) => {
    try {
      await api.put(`/announcements/admin/${id}/toggle`);
      fetchAnnouncements();
      fetchStats();
    } catch (error) {
      setAlert({
        show: true,
        type: 'error',
        message: 'Failed to update announcement status'
      });
    }
  };

  const openCreateDialog = () => {
    resetForm();
    setCreateDialog(true);
  };

  const openEditDialog = (announcement) => {
    setSelectedAnnouncement(announcement);
    setFormData({
      title: announcement.title,
      content: announcement.content,
      authorName: announcement.authorName,
      priority: announcement.priority,
      expiresAt: announcement.expiresAt ? format(new Date(announcement.expiresAt), "yyyy-MM-dd'T'HH:mm") : '',
      isActive: announcement.isActive
    });
    setEditDialog(true);
  };

  const openViewDialog = (announcement) => {
    setSelectedAnnouncement(announcement);
    setViewDialog(true);
  };

  const openDeleteDialog = (announcement) => {
    setSelectedAnnouncement(announcement);
    setDeleteDialog(true);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      authorName: '',
      priority: 'MEDIUM',
      expiresAt: '',
      isActive: true
    });
    setSelectedAnnouncement(null);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const getPriorityColor = (priority) => {
    const priorityObj = priorities.find(p => p.value === priority);
    return priorityObj ? priorityObj.color : 'default';
  };

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: { xs: 'flex-start', sm: 'center' }, 
        mb: 3,
        flexDirection: { xs: 'column', sm: 'row' },
        gap: { xs: 2, sm: 0 }
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <CampaignIcon sx={{ 
            fontSize: { xs: 28, sm: 32 }, 
            mr: 2, 
            color: 'primary.main' 
          }} />
          <Typography variant="h5" sx={{ fontSize: { xs: '1.5rem', sm: '2.125rem' } }}>
            Announcement Management
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={openCreateDialog}
          sx={{ 
            width: { xs: '100%', sm: 'auto' },
            py: { xs: 1, sm: 1.25 },
            fontSize: { xs: '0.875rem', sm: '1rem' }
          }}
        >
          New Announcement
        </Button>
      </Box>

      {/* Statistics Cards - AdminDashboard Style */}
      <Box
        sx={{
          mb: 4,
          display: 'grid',
          gridTemplateColumns: {
            xs: 'repeat(3, 1fr)', // 3 columns on mobile
            sm: 'repeat(5, 1fr)',  // 5 columns on desktop
          },
          gridTemplateRows: {
            xs: 'repeat(2, 1fr)', // 2 rows on mobile
            sm: '1fr',             // 1 row on desktop
          },
          gap: { xs: 1.5, sm: 2, md: 3 }
        }}
      >
        {/* Total Active Card */}
        <Box sx={{ gridColumn: { xs: '1', sm: '1' }, gridRow: { xs: '1', sm: '1' } }}>
          <Paper
            elevation={0}
            sx={{
              p: { xs: 2, sm: 3 },
              borderRadius: 2,
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: { xs: 120, sm: 140 },
              transition: 'all 0.25s ease-in-out',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 8px 16px rgba(0,0,0,0.12)'
              }
            }}
          >
            <Avatar
              sx={{
                bgcolor: theme.palette.primary.light,
                width: { xs: 40, sm: 56 },
                height: { xs: 40, sm: 56 },
                mb: { xs: 1, sm: 2 }
              }}
            >
              <ActiveIcon 
                fontSize={window.innerWidth < 600 ? "medium" : "large"} 
                sx={{ color: theme.palette.primary.main }} 
              />
            </Avatar>
            <Typography 
              variant="h5" 
              component="div" 
              align="center" 
              sx={{ 
                fontWeight: 600,
                fontSize: { xs: '1.25rem', sm: '1.5rem' }
              }}
            >
              {stats.totalActive || 0}
            </Typography>
            <Typography 
              variant="body2" 
              color="textSecondary" 
              align="center"
              sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
            >
              Total Active
            </Typography>
          </Paper>
        </Box>
        
        {/* Urgent Card */}
        <Box sx={{ gridColumn: { xs: '2', sm: '2' }, gridRow: { xs: '1', sm: '1' } }}>
          <Paper
            elevation={0}
            sx={{
              p: { xs: 2, sm: 3 },
              borderRadius: 2,
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: { xs: 120, sm: 140 },
              transition: 'all 0.25s ease-in-out',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 8px 16px rgba(0,0,0,0.12)'
              }
            }}
          >
            <Avatar
              sx={{
                bgcolor: theme.palette.error.light,
                width: { xs: 40, sm: 56 },
                height: { xs: 40, sm: 56 },
                mb: { xs: 1, sm: 2 }
              }}
            >
              <UrgentIcon 
                fontSize={window.innerWidth < 600 ? "medium" : "large"} 
                sx={{ color: theme.palette.error.main }} 
              />
            </Avatar>
            <Typography 
              variant="h5" 
              component="div" 
              align="center" 
              sx={{ 
                fontWeight: 600,
                fontSize: { xs: '1.25rem', sm: '1.5rem' },
                color: theme.palette.error.main
              }}
            >
              {stats.urgentCount || 0}
            </Typography>
            <Typography 
              variant="body2" 
              color="textSecondary" 
              align="center"
              sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
            >
              Urgent
            </Typography>
          </Paper>
        </Box>
        
        {/* High Priority Card */}
        <Box sx={{ gridColumn: { xs: '3', sm: '3' }, gridRow: { xs: '1', sm: '1' } }}>
          <Paper
            elevation={0}
            sx={{
              p: { xs: 2, sm: 3 },
              borderRadius: 2,
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: { xs: 120, sm: 140 },
              transition: 'all 0.25s ease-in-out',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 8px 16px rgba(0,0,0,0.12)'
              }
            }}
          >
            <Avatar
              sx={{
                bgcolor: theme.palette.warning.light,
                width: { xs: 40, sm: 56 },
                height: { xs: 40, sm: 56 },
                mb: { xs: 1, sm: 2 }
              }}
            >
              <HighIcon 
                fontSize={window.innerWidth < 600 ? "medium" : "large"} 
                sx={{ color: theme.palette.warning.main }} 
              />
            </Avatar>
            <Typography 
              variant="h5" 
              component="div" 
              align="center" 
              sx={{ 
                fontWeight: 600,
                fontSize: { xs: '1.25rem', sm: '1.5rem' },
                color: theme.palette.warning.main
              }}
            >
              {stats.highCount || 0}
            </Typography>
            <Typography 
              variant="body2" 
              color="textSecondary" 
              align="center"
              sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
            >
              High Priority
            </Typography>
          </Paper>
        </Box>
        
        {/* Medium Priority Card */}
        <Box sx={{ gridColumn: { xs: '1 / 3', sm: '4' }, gridRow: { xs: '2', sm: '1' } }}>
          <Paper
            elevation={0}
            sx={{
              p: { xs: 2, sm: 3 },
              borderRadius: 2,
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: { xs: 120, sm: 140 },
              transition: 'all 0.25s ease-in-out',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 8px 16px rgba(0,0,0,0.12)'
              }
            }}
          >
            <Avatar
              sx={{
                bgcolor: theme.palette.info.light,
                width: { xs: 40, sm: 56 },
                height: { xs: 40, sm: 56 },
                mb: { xs: 1, sm: 2 }
              }}
            >
              <MediumIcon 
                fontSize={window.innerWidth < 600 ? "medium" : "large"} 
                sx={{ color: theme.palette.info.main }} 
              />
            </Avatar>
            <Typography 
              variant="h5" 
              component="div" 
              align="center" 
              sx={{ 
                fontWeight: 600,
                fontSize: { xs: '1.25rem', sm: '1.5rem' },
                color: theme.palette.info.main
              }}
            >
              {stats.mediumCount || 0}
            </Typography>
            <Typography 
              variant="body2" 
              color="textSecondary" 
              align="center"
              sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
            >
              Medium
            </Typography>
          </Paper>
        </Box>
        
        {/* Low Priority Card */}
        <Box sx={{ gridColumn: { xs: '3', sm: '5' }, gridRow: { xs: '2', sm: '1' } }}>
          <Paper
            elevation={0}
            sx={{
              p: { xs: 2, sm: 3 },
              borderRadius: 2,
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: { xs: 120, sm: 140 },
              transition: 'all 0.25s ease-in-out',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 8px 16px rgba(0,0,0,0.12)'
              }
            }}
          >
            <Avatar
              sx={{
                bgcolor: theme.palette.success.light,
                width: { xs: 40, sm: 56 },
                height: { xs: 40, sm: 56 },
                mb: { xs: 1, sm: 2 }
              }}
            >
              <LowIcon 
                fontSize={window.innerWidth < 600 ? "medium" : "large"} 
                sx={{ color: theme.palette.success.main }} 
              />
            </Avatar>
            <Typography 
              variant="h5" 
              component="div" 
              align="center" 
              sx={{ 
                fontWeight: 600,
                fontSize: { xs: '1.25rem', sm: '1.5rem' },
                color: theme.palette.success.main
              }}
            >
              {stats.lowCount || 0}
            </Typography>
            <Typography 
              variant="body2" 
              color="textSecondary" 
              align="center"
              sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
            >
              Low Priority
            </Typography>
          </Paper>
        </Box>
      </Box>

      {/* Search */}
      <Paper sx={{ p: { xs: 1.5, sm: 2 }, mb: 3 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search announcements..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          size="small"
          InputProps={{
            startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
          }}
        />
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
      ) : (
        <>
          {/* Desktop Table View */}
          <Box sx={{ display: { xs: 'none', md: 'block' } }}>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Title</TableCell>
                    <TableCell>Author</TableCell>
                    <TableCell>Priority</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Created</TableCell>
                    <TableCell>Expires</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredAnnouncements.map((announcement) => (
                    <TableRow key={announcement.id}>
                      <TableCell sx={{ maxWidth: 300 }}>
                        <Typography variant="body2" noWrap>
                          {announcement.title}
                        </Typography>
                      </TableCell>
                      <TableCell>{announcement.authorName}</TableCell>
                      <TableCell>
                        <Chip
                          label={announcement.priority}
                          size="small"
                          color={getPriorityColor(announcement.priority)}
                          variant="filled"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={announcement.isActive ? 'Active' : 'Inactive'}
                          size="small"
                          color={announcement.isActive ? 'success' : 'default'}
                        />
                      </TableCell>
                      <TableCell>
                        {format(new Date(announcement.createdAt), 'yyyy-MM-dd')}
                      </TableCell>
                      <TableCell>
                        {announcement.expiresAt 
                          ? format(new Date(announcement.expiresAt), 'yyyy-MM-dd')
                          : 'Never'
                        }
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1}>
                          <IconButton
                            size="small"
                            onClick={() => openViewDialog(announcement)}
                          >
                            <ViewIcon />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => openEditDialog(announcement)}
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleToggleStatus(announcement.id)}
                            color={announcement.isActive ? 'warning' : 'success'}
                          >
                            {announcement.isActive ? <ToggleOffIcon /> : <ToggleOnIcon />}
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => openDeleteDialog(announcement)}
                            color="error"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>

          {/* Mobile Card View */}
          <Box sx={{ display: { xs: 'block', md: 'none' } }}>
            {filteredAnnouncements.map((announcement) => (
              <Card key={announcement.id} sx={{ mb: 2, p: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, flex: 1, mr: 1 }}>
                    {announcement.title}
                  </Typography>
                  <Chip
                    label={announcement.isActive ? 'Active' : 'Inactive'}
                    size="small"
                    color={announcement.isActive ? 'success' : 'default'}
                  />
                </Box>
                
                <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                  <Chip
                    label={announcement.priority}
                    size="small"
                    color={getPriorityColor(announcement.priority)}
                    variant="filled"
                  />
                  <Chip
                    label={announcement.authorName}
                    size="small"
                    variant="outlined"
                  />
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Created: {format(new Date(announcement.createdAt), 'MMM dd, yyyy')}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Expires: {announcement.expiresAt 
                        ? format(new Date(announcement.expiresAt), 'MMM dd, yyyy')
                        : 'Never'
                      }
                    </Typography>
                  </Box>
                </Box>
                
                <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                  <IconButton
                    size="small"
                    onClick={() => openViewDialog(announcement)}
                    sx={{ border: 1, borderColor: 'divider' }}
                  >
                    <ViewIcon />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => openEditDialog(announcement)}
                    color="primary"
                    sx={{ border: 1, borderColor: 'divider' }}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => handleToggleStatus(announcement.id)}
                    color={announcement.isActive ? 'warning' : 'success'}
                    sx={{ border: 1, borderColor: 'divider' }}
                  >
                    {announcement.isActive ? <ToggleOffIcon /> : <ToggleOnIcon />}
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => openDeleteDialog(announcement)}
                    color="error"
                    sx={{ border: 1, borderColor: 'divider' }}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
              </Card>
            ))}
          </Box>
        </>
      )}

      {/* Create/Edit Dialog */}
      <Dialog 
        open={createDialog || editDialog} 
        onClose={() => {
          setCreateDialog(false);
          setEditDialog(false);
          resetForm();
        }} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle>
          {createDialog ? 'Create New Announcement' : 'Edit Announcement'}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              required
            />
            
            <TextField
              fullWidth
              label="Author Name"
              name="authorName"
              value={formData.authorName}
              onChange={handleInputChange}
              required
              helperText="Name of the person making this announcement"
            />
            
            <TextField
              fullWidth
              multiline
              rows={4}
              label="Content"
              name="content"
              value={formData.content}
              onChange={handleInputChange}
              required
            />
            
            <TextField
              select
              fullWidth
              label="Priority"
              name="priority"
              value={formData.priority}
              onChange={handleInputChange}
            >
              {priorities.map((priority) => (
                <MenuItem key={priority.value} value={priority.value}>
                  {priority.label}
                </MenuItem>
              ))}
            </TextField>
            
            <TextField
              fullWidth
              label="Expires At (Optional)"
              name="expiresAt"
              type="datetime-local"
              value={formData.expiresAt}
              onChange={handleInputChange}
              InputLabelProps={{ shrink: true }}
              helperText="Leave empty for no expiration"
            />
            
            <FormControlLabel
              control={
                <Switch
                  checked={formData.isActive}
                  onChange={handleInputChange}
                  name="isActive"
                />
              }
              label="Active"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setCreateDialog(false);
            setEditDialog(false);
            resetForm();
          }}>
            Cancel
          </Button>
          <Button 
            variant="contained" 
            onClick={createDialog ? handleCreate : handleEdit}
          >
            {createDialog ? 'Create' : 'Update'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={viewDialog} onClose={() => setViewDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Announcement Details</DialogTitle>
        <DialogContent>
          {selectedAnnouncement && (
            <Stack spacing={2} sx={{ mt: 2 }}>
              <Typography variant="h6">{selectedAnnouncement.title}</Typography>
              
              <Box>
                <Typography variant="subtitle2" color="text.secondary">Priority</Typography>
                <Chip
                  label={selectedAnnouncement.priority}
                  size="small"
                  color={getPriorityColor(selectedAnnouncement.priority)}
                  variant="filled"
                />
              </Box>
              
              <Box>
                <Typography variant="subtitle2" color="text.secondary">Author</Typography>
                <Typography variant="body1">{selectedAnnouncement.authorName}</Typography>
              </Box>
              
              <Box>
                <Typography variant="subtitle2" color="text.secondary">Content</Typography>
                <Typography variant="body1">{selectedAnnouncement.content}</Typography>
              </Box>
              
              <Box>
                <Typography variant="subtitle2" color="text.secondary">Created</Typography>
                <Typography variant="body1">
                  {format(new Date(selectedAnnouncement.createdAt), 'PPpp')}
                </Typography>
              </Box>
              
              {selectedAnnouncement.expiresAt && (
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">Expires</Typography>
                  <Typography variant="body1">
                    {format(new Date(selectedAnnouncement.expiresAt), 'PPpp')}
                  </Typography>
                </Box>
              )}
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)}>
        <DialogTitle>Delete Announcement</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this announcement? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(false)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDelete}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Floating Action Button */}
      <Fab
        color="primary"
        aria-label="add announcement"
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
        onClick={openCreateDialog}
      >
        <AddIcon />
      </Fab>
    </Box>
  );
};

export default AdminAnnouncementView;