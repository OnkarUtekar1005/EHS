// src/pages/admin/AdminReports.js
import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Box,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Tab,
  Tabs,
  IconButton,
  Tooltip,
  useTheme,
  useMediaQuery,
  Divider,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction
} from '@mui/material';
import {
  Download as DownloadIcon,
  TrendingUp,
  TrendingDown,
  People,
  School,
  Assignment,
  CheckCircle,
  Warning,
  FilterList,
  DateRange,
  BarChart,
  PieChart,
  TableChart,
  Refresh,
  Share,
  Print,
  MoreVert,
  ArrowUpward,
  ArrowDownward
} from '@mui/icons-material';
import { alpha } from '@mui/material/styles';

// TabPanel component
function TabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`reports-tabpanel-${index}`}
      aria-labelledby={`reports-tab-${index}`}
      {...other}
    >
      {value === index && children}
    </div>
  );
}

const AdminReports = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  
  const [activeTab, setActiveTab] = useState(0);
  const [timeRange, setTimeRange] = useState('30days');
  const [selectedDomain, setSelectedDomain] = useState('all');
  const [loading, setLoading] = useState(false);

  // Mock data - replace with actual API calls
  const [overviewStats, setOverviewStats] = useState({
    totalUsers: 1247,
    totalCourses: 45,
    completionRate: 87.5,
    certificatesIssued: 892,
    trendsUsers: +12.5,
    trendsCourses: +3,
    trendsCompletion: +8.7,
    trendsCertificates: +15.2
  });

  const [userProgress, setUserProgress] = useState([
    { id: 1, name: 'John Doe', email: 'john@company.com', coursesCompleted: 8, totalCourses: 10, completionRate: 80, lastActivity: '2024-01-15' },
    { id: 2, name: 'Jane Smith', email: 'jane@company.com', coursesCompleted: 12, totalCourses: 12, completionRate: 100, lastActivity: '2024-01-14' },
    { id: 3, name: 'Mike Johnson', email: 'mike@company.com', coursesCompleted: 5, totalCourses: 10, completionRate: 50, lastActivity: '2024-01-13' },
    { id: 4, name: 'Sarah Wilson', email: 'sarah@company.com', coursesCompleted: 9, totalCourses: 10, completionRate: 90, lastActivity: '2024-01-12' },
    { id: 5, name: 'David Brown', email: 'david@company.com', coursesCompleted: 7, totalCourses: 10, completionRate: 70, lastActivity: '2024-01-11' }
  ]);

  const [courseStats, setCourseStats] = useState([
    { id: 1, title: 'Fire Safety Basics', enrollments: 245, completions: 198, completionRate: 80.8, avgScore: 88.5 },
    { id: 2, title: 'Chemical Handling', enrollments: 189, completions: 167, completionRate: 88.4, avgScore: 92.1 },
    { id: 3, title: 'Emergency Procedures', enrollments: 298, completions: 201, completionRate: 67.4, avgScore: 85.3 },
    { id: 4, title: 'PPE Training', enrollments: 156, completions: 142, completionRate: 91.0, avgScore: 89.7 },
    { id: 5, title: 'Workplace Safety', enrollments: 278, completions: 234, completionRate: 84.2, avgScore: 87.9 }
  ]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleExport = (format) => {
    setLoading(true);
    // Simulate export process
    setTimeout(() => {
      setLoading(false);
      alert(`Exporting report as ${format}...`);
    }, 1500);
  };

  const StatCard = ({ title, value, change, icon, color = 'primary' }) => (
    <Card sx={{ 
      height: '100%',
      background: `linear-gradient(135deg, ${theme.palette[color].light}10, ${theme.palette[color].main}05)`,
      border: `1px solid ${alpha(theme.palette[color].main, 0.1)}`
    }}>
      <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {title}
            </Typography>
            <Typography variant={isMobile ? "h5" : "h4"} fontWeight={700} color={`${color}.main`}>
              {value}
            </Typography>
            <Box display="flex" alignItems="center" mt={1}>
              {change > 0 ? (
                <ArrowUpward sx={{ fontSize: 16, color: 'success.main', mr: 0.5 }} />
              ) : (
                <ArrowDownward sx={{ fontSize: 16, color: 'error.main', mr: 0.5 }} />
              )}
              <Typography 
                variant="caption" 
                color={change > 0 ? 'success.main' : 'error.main'}
                fontWeight={600}
              >
                {Math.abs(change)}% vs last period
              </Typography>
            </Box>
          </Box>
          <Avatar sx={{ 
            bgcolor: `${color}.main`, 
            width: { xs: 48, sm: 56 }, 
            height: { xs: 48, sm: 56 } 
          }}>
            {icon}
          </Avatar>
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Container maxWidth="xl" sx={{ 
      mt: { xs: 1, sm: 2 }, 
      mb: { xs: 4, sm: 8 },
      px: { xs: 1, sm: 2, md: 3 }
    }}>
      {/* Header */}
      <Box sx={{ 
        display: 'flex', 
        flexDirection: { xs: 'column', sm: 'row' },
        justifyContent: 'space-between',
        alignItems: { xs: 'flex-start', sm: 'center' },
        mb: { xs: 3, sm: 4 },
        gap: { xs: 2, sm: 0 }
      }}>
        <Box>
          <Typography 
            variant="h4" 
            fontWeight={800}
            sx={{ 
              fontSize: { xs: '1.5rem', sm: '2rem', md: '2.25rem' },
              background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}
          >
            Reports & Analytics
          </Typography>
          <Typography variant="subtitle1" color="text.secondary" sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>
            Track performance and generate insights across your EHS training programs
          </Typography>
        </Box>

        {/* Action Buttons */}
        <Box sx={{ 
          display: 'flex', 
          gap: 1,
          flexDirection: { xs: 'row', sm: 'row' },
          width: { xs: '100%', sm: 'auto' }
        }}>
          <Button
            startIcon={<Refresh />}
            variant="outlined"
            size={isMobile ? "medium" : "large"}
            onClick={() => setLoading(true)}
            sx={{ flex: { xs: 1, sm: 'none' } }}
          >
            {isMobile ? 'Refresh' : 'Refresh Data'}
          </Button>
          <Button
            startIcon={<DownloadIcon />}
            variant="contained"
            size={isMobile ? "medium" : "large"}
            onClick={() => handleExport('PDF')}
            sx={{ flex: { xs: 1, sm: 'none' } }}
          >
            Export
          </Button>
        </Box>
      </Box>

      {/* Filter Controls */}
      <Paper sx={{ 
        p: { xs: 2, sm: 3 }, 
        mb: { xs: 3, sm: 4 },
        borderRadius: 3,
        boxShadow: '0 2px 12px rgba(0,0,0,0.04)'
      }}>
        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', sm: 'row' },
          gap: 2,
          alignItems: { xs: 'stretch', sm: 'center' }
        }}>
          <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 150 } }}>
            <InputLabel>Time Range</InputLabel>
            <Select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              label="Time Range"
            >
              <MenuItem value="7days">Last 7 days</MenuItem>
              <MenuItem value="30days">Last 30 days</MenuItem>
              <MenuItem value="90days">Last 90 days</MenuItem>
              <MenuItem value="1year">Last year</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 150 } }}>
            <InputLabel>Domain</InputLabel>
            <Select
              value={selectedDomain}
              onChange={(e) => setSelectedDomain(e.target.value)}
              label="Domain"
            >
              <MenuItem value="all">All Domains</MenuItem>
              <MenuItem value="fire">Fire Safety</MenuItem>
              <MenuItem value="chemical">Chemical Safety</MenuItem>
              <MenuItem value="emergency">Emergency Response</MenuItem>
            </Select>
          </FormControl>

          <Box sx={{ 
            display: 'flex', 
            gap: 1, 
            ml: { sm: 'auto' },
            width: { xs: '100%', sm: 'auto' }
          }}>
            <Tooltip title="Print Report">
              <IconButton size="small">
                <Print />
              </IconButton>
            </Tooltip>
            <Tooltip title="Share Report">
              <IconButton size="small">
                <Share />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      </Paper>

      {/* Overview Stats */}
      <Grid container spacing={{ xs: 2, sm: 3 }} sx={{ mb: { xs: 3, sm: 4 } }}>
        <Grid item xs={6} sm={3}>
          <StatCard
            title="Total Users"
            value={overviewStats.totalUsers.toLocaleString()}
            change={overviewStats.trendsUsers}
            icon={<People />}
            color="primary"
          />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatCard
            title="Active Courses"
            value={overviewStats.totalCourses}
            change={overviewStats.trendsCourses}
            icon={<School />}
            color="secondary"
          />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatCard
            title="Completion Rate"
            value={`${overviewStats.completionRate}%`}
            change={overviewStats.trendsCompletion}
            icon={<CheckCircle />}
            color="success"
          />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatCard
            title="Certificates"
            value={overviewStats.certificatesIssued.toLocaleString()}
            change={overviewStats.trendsCertificates}
            icon={<Assignment />}
            color="info"
          />
        </Grid>
      </Grid>

      {/* Tabs */}
      <Paper sx={{ 
        borderRadius: 3,
        overflow: 'hidden',
        boxShadow: '0 2px 12px rgba(0,0,0,0.04)'
      }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant={isMobile ? "scrollable" : "standard"}
          scrollButtons={isMobile ? "auto" : false}
          allowScrollButtonsMobile
          sx={{
            bgcolor: theme.palette.grey[50],
            borderBottom: `1px solid ${theme.palette.divider}`,
            '& .MuiTab-root': {
              minHeight: { xs: 48, sm: 56 },
              fontSize: { xs: '0.875rem', sm: '1rem' },
              fontWeight: 600,
              textTransform: 'none',
              px: { xs: 2, sm: 4 }
            }
          }}
        >
          <Tab 
            label={isMobile ? "Users" : "User Progress"} 
            icon={<People fontSize="small" />} 
            iconPosition="start"
          />
          <Tab 
            label={isMobile ? "Courses" : "Course Analytics"} 
            icon={<School fontSize="small" />} 
            iconPosition="start"
          />
          <Tab 
            label={isMobile ? "Compliance" : "Compliance Reports"} 
            icon={<Assignment fontSize="small" />} 
            iconPosition="start"
          />
        </Tabs>

        {/* User Progress Tab */}
        <TabPanel value={activeTab} index={0}>
          <Box sx={{ p: { xs: 2, sm: 3 } }}>
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              mb: 3 
            }}>
              <Typography variant="h6" fontWeight={600}>
                User Progress Overview
              </Typography>
              <Button
                size="small"
                startIcon={<DownloadIcon />}
                onClick={() => handleExport('CSV')}
              >
                Export CSV
              </Button>
            </Box>

            {isMobile ? (
              // Mobile: Card Layout
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {userProgress.map((user) => (
                  <Card key={user.id} sx={{ borderRadius: 2 }}>
                    <CardContent sx={{ p: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                          {user.name.charAt(0)}
                        </Avatar>
                        <Box sx={{ flexGrow: 1 }}>
                          <Typography variant="subtitle2" fontWeight={600}>
                            {user.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {user.email}
                          </Typography>
                        </Box>
                        <Chip
                          label={`${user.completionRate}%`}
                          color={user.completionRate >= 80 ? 'success' : user.completionRate >= 60 ? 'warning' : 'error'}
                          size="small"
                        />
                      </Box>
                      <Box sx={{ mb: 1 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                          <Typography variant="body2" color="text.secondary">
                            Progress
                          </Typography>
                          <Typography variant="body2" fontWeight={600}>
                            {user.coursesCompleted}/{user.totalCourses}
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={user.completionRate}
                          sx={{ height: 6, borderRadius: 3 }}
                        />
                      </Box>
                      <Typography variant="caption" color="text.secondary">
                        Last activity: {new Date(user.lastActivity).toLocaleDateString()}
                      </Typography>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            ) : (
              // Desktop: Table Layout
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>User</TableCell>
                      <TableCell align="center">Courses Completed</TableCell>
                      <TableCell align="center">Progress</TableCell>
                      <TableCell align="center">Last Activity</TableCell>
                      <TableCell align="center">Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {userProgress.map((user) => (
                      <TableRow key={user.id} hover>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                              {user.name.charAt(0)}
                            </Avatar>
                            <Box>
                              <Typography variant="subtitle2" fontWeight={600}>
                                {user.name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {user.email}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell align="center">
                          <Typography variant="body2" fontWeight={600}>
                            {user.coursesCompleted}/{user.totalCourses}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <LinearProgress
                              variant="determinate"
                              value={user.completionRate}
                              sx={{ width: 80, height: 6, borderRadius: 3 }}
                            />
                            <Typography variant="body2" fontWeight={600}>
                              {user.completionRate}%
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell align="center">
                          <Typography variant="body2">
                            {new Date(user.lastActivity).toLocaleDateString()}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={user.completionRate >= 80 ? 'On Track' : user.completionRate >= 60 ? 'Behind' : 'At Risk'}
                            color={user.completionRate >= 80 ? 'success' : user.completionRate >= 60 ? 'warning' : 'error'}
                            size="small"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Box>
        </TabPanel>

        {/* Course Analytics Tab */}
        <TabPanel value={activeTab} index={1}>
          <Box sx={{ p: { xs: 2, sm: 3 } }}>
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              mb: 3 
            }}>
              <Typography variant="h6" fontWeight={600}>
                Course Performance Analytics
              </Typography>
              <Button
                size="small"
                startIcon={<BarChart />}
                variant="outlined"
              >
                View Charts
              </Button>
            </Box>

            {isMobile ? (
              // Mobile: Card Layout
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {courseStats.map((course) => (
                  <Card key={course.id} sx={{ borderRadius: 2 }}>
                    <CardContent sx={{ p: 2 }}>
                      <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                        {course.title}
                      </Typography>
                      
                      <Grid container spacing={2} sx={{ mb: 2 }}>
                        <Grid item xs={6}>
                          <Typography variant="caption" color="text.secondary">
                            Enrollments
                          </Typography>
                          <Typography variant="h6" fontWeight={600}>
                            {course.enrollments}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="caption" color="text.secondary">
                            Completions
                          </Typography>
                          <Typography variant="h6" fontWeight={600}>
                            {course.completions}
                          </Typography>
                        </Grid>
                      </Grid>

                      <Box sx={{ mb: 1 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                          <Typography variant="body2" color="text.secondary">
                            Completion Rate
                          </Typography>
                          <Typography variant="body2" fontWeight={600}>
                            {course.completionRate}%
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={course.completionRate}
                          sx={{ height: 6, borderRadius: 3 }}
                        />
                      </Box>

                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="caption" color="text.secondary">
                          Average Score: {course.avgScore}%
                        </Typography>
                        <Chip
                          label={course.completionRate >= 80 ? 'High' : course.completionRate >= 60 ? 'Medium' : 'Low'}
                          color={course.completionRate >= 80 ? 'success' : course.completionRate >= 60 ? 'warning' : 'error'}
                          size="small"
                        />
                      </Box>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            ) : (
              // Desktop: Table Layout
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Course Title</TableCell>
                      <TableCell align="center">Enrollments</TableCell>
                      <TableCell align="center">Completions</TableCell>
                      <TableCell align="center">Completion Rate</TableCell>
                      <TableCell align="center">Avg Score</TableCell>
                      <TableCell align="center">Performance</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {courseStats.map((course) => (
                      <TableRow key={course.id} hover>
                        <TableCell>
                          <Typography variant="subtitle2" fontWeight={600}>
                            {course.title}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Typography variant="body2">
                            {course.enrollments}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Typography variant="body2">
                            {course.completions}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'center' }}>
                            <LinearProgress
                              variant="determinate"
                              value={course.completionRate}
                              sx={{ width: 60, height: 6, borderRadius: 3 }}
                            />
                            <Typography variant="body2" fontWeight={600}>
                              {course.completionRate}%
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell align="center">
                          <Typography variant="body2" fontWeight={600}>
                            {course.avgScore}%
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={course.completionRate >= 80 ? 'High' : course.completionRate >= 60 ? 'Medium' : 'Low'}
                            color={course.completionRate >= 80 ? 'success' : course.completionRate >= 60 ? 'warning' : 'error'}
                            size="small"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Box>
        </TabPanel>

        {/* Compliance Reports Tab */}
        <TabPanel value={activeTab} index={2}>
          <Box sx={{ p: { xs: 2, sm: 3 } }}>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Compliance & Certification Reports
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Track certification status and compliance across your organization
            </Typography>

            <Grid container spacing={{ xs: 2, sm: 3 }}>
              <Grid item xs={12} sm={6} md={4}>
                <Card sx={{ borderRadius: 2, border: `1px solid ${theme.palette.success.light}` }}>
                  <CardContent sx={{ textAlign: 'center', p: 3 }}>
                    <CheckCircle sx={{ fontSize: 48, color: 'success.main', mb: 2 }} />
                    <Typography variant="h4" fontWeight={700} color="success.main">
                      89%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Compliant Users
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <Card sx={{ borderRadius: 2, border: `1px solid ${theme.palette.warning.light}` }}>
                  <CardContent sx={{ textAlign: 'center', p: 3 }}>
                    <Warning sx={{ fontSize: 48, color: 'warning.main', mb: 2 }} />
                    <Typography variant="h4" fontWeight={700} color="warning.main">
                      8%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Expiring Soon
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <Card sx={{ borderRadius: 2, border: `1px solid ${theme.palette.error.light}` }}>
                  <CardContent sx={{ textAlign: 'center', p: 3 }}>
                    <Assignment sx={{ fontSize: 48, color: 'error.main', mb: 2 }} />
                    <Typography variant="h4" fontWeight={700} color="error.main">
                      3%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Non-Compliant
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            <Box sx={{ mt: 4, textAlign: 'center' }}>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                Generate detailed compliance reports
              </Typography>
              <Box sx={{ 
                display: 'flex', 
                gap: 2, 
                justifyContent: 'center',
                flexDirection: { xs: 'column', sm: 'row' }
              }}>
                <Button
                  variant="contained"
                  startIcon={<DownloadIcon />}
                  onClick={() => handleExport('compliance-report')}
                  size="large"
                >
                  Download Compliance Report
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<DateRange />}
                  size="large"
                >
                  Schedule Report
                </Button>
              </Box>
            </Box>
          </Box>
        </TabPanel>
      </Paper>

      {loading && (
        <Box sx={{ 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          width: '100%', 
          zIndex: 1000 
        }}>
          <LinearProgress />
        </Box>
      )}
    </Container>
  );
};

export default AdminReports;