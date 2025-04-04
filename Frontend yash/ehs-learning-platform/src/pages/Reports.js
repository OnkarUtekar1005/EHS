// src/pages/Reports.js
import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  CardHeader,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tabs,
  Tab,
  CircularProgress,
  Alert
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import { useAuth } from '../contexts/AuthContext';
import { Bar, Line } from 'react-chartjs-2';
import { progressService } from '../services/api';

const Reports = () => {
  const { currentUser } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [reportTimeframe, setReportTimeframe] = useState('month');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reportData, setReportData] = useState({
    progress: [],
    assessments: [],
    performance: {
      labels: [],
      preScores: [],
      postScores: []
    }
  });
  
  // Fetch report data
  useEffect(() => {
    const fetchReportData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch user's report data
        const response = await progressService.getDashboard();
        const data = response.data;
        
        // Process data for reports
        const processedData = {
          progress: data.moduleProgress || [],
          assessments: data.assessmentResults || [],
          performance: processPerformanceData(data)
        };
        
        setReportData(processedData);
      } catch (err) {
        console.error('Error fetching report data:', err);
        setError('Failed to load report data. Please try again.');
        
        // Set mock data for demo
        setReportData({
          progress: [
            { module: 'Fire Safety Basics', percentComplete: 75, status: 'IN_PROGRESS', lastAccessed: '2025-03-28' },
            { module: 'OSHA Compliance', percentComplete: 100, status: 'COMPLETED', lastAccessed: '2025-03-20' },
            { module: 'First Aid', percentComplete: 45, status: 'IN_PROGRESS', lastAccessed: '2025-03-25' },
            { module: 'Hazard Communication', percentComplete: 100, status: 'COMPLETED', lastAccessed: '2025-03-15' },
            { module: 'Emergency Procedures', percentComplete: 85, status: 'IN_PROGRESS', lastAccessed: '2025-03-27' }
          ],
          assessments: [
            { module: 'Fire Safety Basics', assessmentType: 'PRE', score: 68, completedDate: '2025-03-15' },
            { module: 'Fire Safety Basics', assessmentType: 'POST', score: 92, completedDate: '2025-03-28' },
            { module: 'OSHA Compliance', assessmentType: 'PRE', score: 72, completedDate: '2025-03-18' },
            { module: 'OSHA Compliance', assessmentType: 'POST', score: 88, completedDate: '2025-03-20' },
            { module: 'Hazard Communication', assessmentType: 'PRE', score: 65, completedDate: '2025-03-10' },
            { module: 'Hazard Communication', assessmentType: 'POST', score: 90, completedDate: '2025-03-15' }
          ],
          performance: {
            labels: ['Fire Safety Basics', 'OSHA Compliance', 'Hazard Communication', 'First Aid', 'Emergency Procedures'],
            preScores: [68, 72, 65, 60, 70],
            postScores: [92, 88, 90, 85, 95]
          }
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchReportData();
  }, [reportTimeframe]);
  
  // Process performance data for charts
  const processPerformanceData = (data) => {
    const result = {
      labels: [],
      preScores: [],
      postScores: []
    };
    
    // Check if we have assessment data
    if (data.assessmentResults && data.assessmentResults.length > 0) {
      // Get unique modules
      const modules = [...new Set(data.assessmentResults.map(a => a.module))];
      
      result.labels = modules;
      
      // Get pre and post scores for each module
      modules.forEach(module => {
        const preAssessment = data.assessmentResults.find(a => a.module === module && a.assessmentType === 'PRE');
        const postAssessment = data.assessmentResults.find(a => a.module === module && a.assessmentType === 'POST');
        
        result.preScores.push(preAssessment ? preAssessment.score : 0);
        result.postScores.push(postAssessment ? postAssessment.score : 0);
      });
    }
    
    return result;
  };
  
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };
  
  const handleTimeframeChange = (event) => {
    setReportTimeframe(event.target.value);
  };
  
  // Download report
  const handleDownload = () => {
    alert('Download functionality will be implemented in a future update.');
  };
  
  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return dateString;
    }
  };
  
  // Chart configuration
  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Pre vs Post Assessment Scores',
      },
    },
    scales: {
      y: {
        min: 0,
        max: 100,
        ticks: {
          callback: function(value) {
            return value + '%';
          }
        }
      }
    }
  };
  
  const chartData = {
    labels: reportData.performance.labels,
    datasets: [
      {
        label: 'Pre-Assessment',
        data: reportData.performance.preScores,
        backgroundColor: 'rgba(53, 162, 235, 0.5)',
      },
      {
        label: 'Post-Assessment',
        data: reportData.performance.postScores,
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
      },
    ],
  };
  
  // Loading state
  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
          <CircularProgress />
        </Box>
      </Container>
    );
  }
  
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        My Training Reports
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {/* Report Controls */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4, flexWrap: 'wrap', gap: 2 }}>
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel id="timeframe-select-label">Timeframe</InputLabel>
          <Select
            labelId="timeframe-select-label"
            id="timeframe-select"
            value={reportTimeframe}
            label="Timeframe"
            onChange={handleTimeframeChange}
          >
            <MenuItem value="week">Last Week</MenuItem>
            <MenuItem value="month">Last Month</MenuItem>
            <MenuItem value="quarter">Last Quarter</MenuItem>
            <MenuItem value="year">Last Year</MenuItem>
            <MenuItem value="all">All Time</MenuItem>
          </Select>
        </FormControl>
        
        <Button 
          variant="outlined" 
          startIcon={<FileDownloadIcon />}
          onClick={handleDownload}
        >
          Download Report
        </Button>
      </Box>
      
      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange} 
          aria-label="report tabs"
        >
          <Tab label="My Progress" />
          <Tab label="Assessment Results" />
          <Tab label="Performance Summary" />
        </Tabs>
      </Box>
      
      {/* My Progress Tab */}
      {tabValue === 0 && (
        <Card>
          <CardHeader title="My Module Progress" />
          <CardContent>
            <TableContainer component={Paper}>
              <Table sx={{ minWidth: 650 }} aria-label="module progress table">
                <TableHead>
                  <TableRow>
                    <TableCell>Module</TableCell>
                    <TableCell align="right">Completion</TableCell>
                    <TableCell align="right">Status</TableCell>
                    <TableCell align="right">Last Accessed</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {reportData.progress.map((row, index) => (
                    <TableRow
                      key={index}
                      sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                    >
                      <TableCell component="th" scope="row">
                        {row.module}
                      </TableCell>
                      <TableCell align="right">{row.percentComplete}%</TableCell>
                      <TableCell align="right">
                        {row.status === 'COMPLETED' ? 'Completed' : 'In Progress'}
                      </TableCell>
                      <TableCell align="right">{formatDate(row.lastAccessed)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}
      
      {/* Assessment Results Tab */}
      {tabValue === 1 && (
        <Card>
          <CardHeader title="My Assessment Results" />
          <CardContent>
            <TableContainer component={Paper}>
              <Table sx={{ minWidth: 650 }} aria-label="assessment results table">
                <TableHead>
                  <TableRow>
                    <TableCell>Module</TableCell>
                    <TableCell align="right">Assessment Type</TableCell>
                    <TableCell align="right">Score</TableCell>
                    <TableCell align="right">Completed Date</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {reportData.assessments.map((row, index) => (
                    <TableRow
                      key={index}
                      sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                    >
                      <TableCell component="th" scope="row">
                        {row.module}
                      </TableCell>
                      <TableCell align="right">
                        {row.assessmentType === 'PRE' ? 'Pre-Assessment' : 'Post-Assessment'}
                      </TableCell>
                      <TableCell align="right">{row.score}%</TableCell>
                      <TableCell align="right">{formatDate(row.completedDate)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}
      
      {/* Performance Summary Tab */}
      {tabValue === 2 && (
        <Card>
          <CardHeader title="Performance Summary" />
          <CardContent>
            <Box sx={{ height: 400, position: 'relative' }}>
              <Bar options={chartOptions} data={chartData} />
            </Box>
            <Typography variant="body2" color="textSecondary" sx={{ mt: 2, textAlign: 'center' }}>
              This chart shows your pre-assessment and post-assessment scores for each completed module,
              demonstrating your knowledge improvement after training.
            </Typography>
          </CardContent>
        </Card>
      )}
    </Container>
  );
};

export default Reports;