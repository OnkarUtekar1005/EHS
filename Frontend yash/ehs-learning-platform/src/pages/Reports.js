// src/pages/Reports.js
import React, { useState } from 'react';
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
  Tab
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';

// Mock data
const mockReportData = {
  userProgress: [
    { id: 1, user: 'John Doe', modulesCompleted: 12, averageScore: 87, lastActivity: '2025-03-28' },
    { id: 2, user: 'Jane Smith', modulesCompleted: 8, averageScore: 92, lastActivity: '2025-03-29' },
    { id: 3, user: 'Mike Johnson', modulesCompleted: 15, averageScore: 78, lastActivity: '2025-03-27' },
    { id: 4, user: 'Sara Wilson', modulesCompleted: 10, averageScore: 85, lastActivity: '2025-03-30' },
    { id: 5, user: 'Tom Brown', modulesCompleted: 6, averageScore: 90, lastActivity: '2025-03-26' }
  ],
  moduleEffectiveness: [
    { id: 1, module: 'Fire Safety Basics', enrollments: 45, completionRate: 78, averageScore: 82 },
    { id: 2, module: 'OSHA Compliance', enrollments: 38, completionRate: 65, averageScore: 79 },
    { id: 3, module: 'First Aid', enrollments: 42, completionRate: 85, averageScore: 88 },
    { id: 4, module: 'Hazard Communication', enrollments: 30, completionRate: 70, averageScore: 75 },
    { id: 5, module: 'Emergency Procedures', enrollments: 52, completionRate: 92, averageScore: 94 }
  ]
};

const Reports = () => {
  const [tabValue, setTabValue] = useState(0);
  const [reportTimeframe, setReportTimeframe] = useState('month');
  
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };
  
  const handleTimeframeChange = (event) => {
    setReportTimeframe(event.target.value);
  };
  
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Reports
      </Typography>
      
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
          </Select>
        </FormControl>
        
        <Button 
          variant="outlined" 
          startIcon={<DownloadIcon />}
        >
          Export Report
        </Button>
      </Box>
      
      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange} 
          aria-label="report tabs"
        >
          <Tab label="User Progress" />
          <Tab label="Module Effectiveness" />
          <Tab label="Domain Performance" />
          <Tab label="Assessment Results" />
        </Tabs>
      </Box>
      
      {/* User Progress Tab */}
      {tabValue === 0 && (
        <Card>
          <CardHeader title="User Progress Report" />
          <CardContent>
            <TableContainer component={Paper}>
              <Table sx={{ minWidth: 650 }} aria-label="user progress table">
                <TableHead>
                  <TableRow>
                    <TableCell>User</TableCell>
                    <TableCell align="right">Modules Completed</TableCell>
                    <TableCell align="right">Average Score</TableCell>
                    <TableCell align="right">Last Activity</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {mockReportData.userProgress.map((row) => (
                    <TableRow
                      key={row.id}
                      sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                    >
                      <TableCell component="th" scope="row">
                        {row.user}
                      </TableCell>
                      <TableCell align="right">{row.modulesCompleted}</TableCell>
                      <TableCell align="right">{row.averageScore}%</TableCell>
                      <TableCell align="right">{new Date(row.lastActivity).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}
      
      {/* Module Effectiveness Tab */}
      {tabValue === 1 && (
        <Card>
          <CardHeader title="Module Effectiveness Report" />
          <CardContent>
            <TableContainer component={Paper}>
              <Table sx={{ minWidth: 650 }} aria-label="module effectiveness table">
                <TableHead>
                  <TableRow>
                    <TableCell>Module</TableCell>
                    <TableCell align="right">Enrollments</TableCell>
                    <TableCell align="right">Completion Rate</TableCell>
                    <TableCell align="right">Average Score</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {mockReportData.moduleEffectiveness.map((row) => (
                    <TableRow
                      key={row.id}
                      sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                    >
                      <TableCell component="th" scope="row">
                        {row.module}
                      </TableCell>
                      <TableCell align="right">{row.enrollments}</TableCell>
                      <TableCell align="right">{row.completionRate}%</TableCell>
                      <TableCell align="right">{row.averageScore}%</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}
      
      {/* Domain Performance Tab */}
      {tabValue === 2 && (
        <Box display="flex" justifyContent="center" alignItems="center" height="400px">
          <Typography variant="h6" color="textSecondary">
            Domain Performance Reports Coming Soon
          </Typography>
        </Box>
      )}
      
      {/* Assessment Results Tab */}
      {tabValue === 3 && (
        <Box display="flex" justifyContent="center" alignItems="center" height="400px">
          <Typography variant="h6" color="textSecondary">
            Assessment Results Reports Coming Soon
          </Typography>
        </Box>
      )}
    </Container>
  );
};

export default Reports;