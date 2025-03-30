// src/components/dashboard/PerformanceCharts.js
import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Box,
  CircularProgress,
  Typography,
  ToggleButtonGroup,
  ToggleButton,
  useTheme
} from '@mui/material';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';

const PerformanceCharts = ({ data, loading, error }) => {
  const theme = useTheme();
  const [chartType, setChartType] = useState('bar');

  const handleChartTypeChange = (event, newType) => {
    if (newType !== null) {
      setChartType(newType);
    }
  };

  // Define colors for charts
  const barColors = [theme.palette.primary.light, theme.palette.primary.dark];
  const lineColors = [theme.palette.primary.main, theme.palette.secondary.main];
  const pieColors = [
    theme.palette.primary.main,
    theme.palette.secondary.main,
    theme.palette.success.main,
    theme.palette.error.main,
    theme.palette.warning.main,
    theme.palette.info.main
  ];

  // Calculate averages for pie chart
  const pieData = [
    { name: 'Pre-Assessment', value: data?.reduce((acc, item) => acc + item.preAssessment, 0) / (data?.length || 1) },
    { name: 'Post-Assessment', value: data?.reduce((acc, item) => acc + item.postAssessment, 0) / (data?.length || 1) }
  ];

  // Prepare data for radar chart
  const radarData = data?.map(item => ({
    subject: item.month,
    'Pre-Assessment': item.preAssessment,
    'Post-Assessment': item.postAssessment
  }));

  // Display loading state
  if (loading) {
    return (
      <Card elevation={2}>
        <CardHeader title="Performance Metrics" />
        <CardContent>
          <Box display="flex" justifyContent="center" alignItems="center" minHeight={300}>
            <CircularProgress />
          </Box>
        </CardContent>
      </Card>
    );
  }

  // Display error state
  if (error) {
    return (
      <Card elevation={2}>
        <CardHeader title="Performance Metrics" />
        <CardContent>
          <Box display="flex" justifyContent="center" alignItems="center" minHeight={300}>
            <Typography color="error">{error}</Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  // Display no data state
  if (!data || data.length === 0) {
    return (
      <Card elevation={2}>
        <CardHeader title="Performance Metrics" />
        <CardContent>
          <Box display="flex" justifyContent="center" alignItems="center" minHeight={300}>
            <Typography color="textSecondary">No performance data available</Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card elevation={2}>
      <CardHeader 
        title="Performance Metrics" 
        action={
          <ToggleButtonGroup
            value={chartType}
            exclusive
            onChange={handleChartTypeChange}
            aria-label="chart type"
            size="small"
          >
            <ToggleButton value="bar" aria-label="bar chart">
              Bar
            </ToggleButton>
            <ToggleButton value="line" aria-label="line chart">
              Line
            </ToggleButton>
            <ToggleButton value="pie" aria-label="pie chart">
              Pie
            </ToggleButton>
            <ToggleButton value="radar" aria-label="radar chart">
              Radar
            </ToggleButton>
          </ToggleButtonGroup>
        }
      />
      <CardContent>
        <Box height={350}>
          {chartType === 'bar' && (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip 
                  formatter={(value) => [`${value}%`, '']}
                  labelFormatter={(label) => `Month: ${label}`}
                />
                <Legend />
                <Bar name="Pre-Assessment" dataKey="preAssessment" fill={barColors[0]} />
                <Bar name="Post-Assessment" dataKey="postAssessment" fill={barColors[1]} />
              </BarChart>
            </ResponsiveContainer>
          )}
          
          {chartType === 'line' && (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={data}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip 
                  formatter={(value) => [`${value}%`, '']}
                  labelFormatter={(label) => `Month: ${label}`}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  name="Pre-Assessment" 
                  dataKey="preAssessment" 
                  stroke={lineColors[0]} 
                  activeDot={{ r: 8 }} 
                />
                <Line 
                  type="monotone" 
                  name="Post-Assessment" 
                  dataKey="postAssessment" 
                  stroke={lineColors[1]} 
                />
              </LineChart>
            </ResponsiveContainer>
          )}
          
          {chartType === 'pie' && (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  outerRadius={120}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value.toFixed(1)}%`}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value.toFixed(1)}%`, 'Average Score']} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
          
          {chartType === 'radar' && (
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="subject" />
                <PolarRadiusAxis angle={30} domain={[0, 100]} />
                <Radar 
                  name="Pre-Assessment" 
                  dataKey="Pre-Assessment" 
                  stroke={theme.palette.primary.main} 
                  fill={theme.palette.primary.main} 
                  fillOpacity={0.6} 
                />
                <Radar 
                  name="Post-Assessment" 
                  dataKey="Post-Assessment" 
                  stroke={theme.palette.secondary.main} 
                  fill={theme.palette.secondary.main} 
                  fillOpacity={0.6} 
                />
                <Legend />
                <Tooltip formatter={(value) => [`${value}%`, '']} />
              </RadarChart>
            </ResponsiveContainer>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default PerformanceCharts;