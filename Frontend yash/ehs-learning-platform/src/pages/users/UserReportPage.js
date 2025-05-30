import React, { useState, useEffect, useRef } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  CircularProgress,
  Box,
  Card,
  CardContent,
  LinearProgress
} from '@mui/material';
import {
  Assessment,
  School,
  CheckCircle,
  AccessTime,
  GetApp
} from '@mui/icons-material';
import MainLayout from '../../components/layout/MainLayout';
import { userReportService } from '../../services/api';

const UserReportPage = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [report, setReport] = useState(null);
  const reportRef = useRef(null);

  useEffect(() => {
    fetchReportData();
  }, []);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      const response = await userReportService.getUserReport();
      setReport(response.data);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching report data:", err);
      setError("Failed to load learning report. Please try again later.");
      setLoading(false);
    }
  };

  const handleExportPDF = () => {
    alert('PDF export functionality is not implemented yet.');
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  if (loading) {
    return (
      <MainLayout>
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
          <Box display="flex" justifyContent="center" alignItems="center" flexDirection="column" minHeight="50vh">
            <CircularProgress />
            <Typography variant="body1" sx={{ mt: 2 }}>Loading your learning report...</Typography>
          </Box>
        </Container>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout>
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
            <Typography color="error" variant="h6">{error}</Typography>
          </Paper>
        </Container>
      </MainLayout>
    );
  }

  if (!report) {
    return (
      <MainLayout>
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h6">No report data available. Start learning to see your progress!</Typography>
          </Paper>
        </Container>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }} ref={reportRef}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h4" component="h1" gutterBottom>
                Learning Report
              </Typography>
              <Button 
                variant="contained" 
                color="primary" 
                startIcon={<GetApp />}
                onClick={handleExportPDF}
              >
                Export as PDF
              </Button>
            </Box>
          </Grid>

          {/* Summary Cards */}
          <Grid item xs={12} md={3}>
            <Card elevation={2}>
              <CardContent>
                <Box display="flex" flexDirection="column" alignItems="center">
                  <School color="primary" fontSize="large" />
                  <Typography color="textSecondary" gutterBottom>
                    Courses Enrolled
                  </Typography>
                  <Typography variant="h4" component="h2">
                    {report.summary.coursesEnrolled}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card elevation={2}>
              <CardContent>
                <Box display="flex" flexDirection="column" alignItems="center">
                  <CheckCircle color="success" fontSize="large" />
                  <Typography color="textSecondary" gutterBottom>
                    Courses Completed
                  </Typography>
                  <Typography variant="h4" component="h2">
                    {report.summary.coursesCompleted}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card elevation={2}>
              <CardContent>
                <Box display="flex" flexDirection="column" alignItems="center">
                  <Assessment color="info" fontSize="large" />
                  <Typography color="textSecondary" gutterBottom>
                    Average Score
                  </Typography>
                  <Typography variant="h4" component="h2">
                    {report.summary.averageScore}%
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card elevation={2}>
              <CardContent>
                <Box display="flex" flexDirection="column" alignItems="center">
                  <AccessTime color="warning" fontSize="large" />
                  <Typography color="textSecondary" gutterBottom>
                    Total Time Spent
                  </Typography>
                  <Typography variant="h4" component="h2">
                    {report.summary.totalTimeSpent}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Course Progress Table */}
          <Grid item xs={12}>
            <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
              <Typography variant="h6" gutterBottom component="div">
                Course Progress
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Course Name</TableCell>
                      <TableCell>Enrolled Date</TableCell>
                      <TableCell>Progress</TableCell>
                      <TableCell>Last Accessed</TableCell>
                      <TableCell>Pre/Post Scores</TableCell>
                      <TableCell>Certificate</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {report.courses.map((course, index) => (
                      <TableRow key={index}>
                        <TableCell>{course.courseName}</TableCell>
                        <TableCell>{formatDate(course.enrolledDate)}</TableCell>
                        <TableCell>
                          <Box display="flex" alignItems="center">
                            <Box width="100%" mr={1}>
                              <LinearProgress 
                                variant="determinate" 
                                value={course.progress} 
                                sx={{ height: 10, borderRadius: 5 }}
                              />
                            </Box>
                            <Box minWidth={35}>
                              <Typography variant="body2" color="textSecondary">
                                {`${Math.round(course.progress)}%`}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>{formatDate(course.lastAccessed)}</TableCell>
                        <TableCell>
                          {course.preAssessmentScore && (
                            <Typography variant="body2">Pre: {course.preAssessmentScore}%</Typography>
                          )}
                          {course.postAssessmentScore && (
                            <Typography variant="body2">Post: {course.postAssessmentScore}%</Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          {course.certificateUrl ? (
                            <Button
                              variant="outlined"
                              size="small"
                              href={course.certificateUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              Download
                            </Button>
                          ) : (
                            <Typography variant="body2" color="textSecondary">
                              Not Available
                            </Typography>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>

          {/* Charts Section - Placeholder */}
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 240 }}>
              <Typography variant="h6" gutterBottom>
                Course Status Distribution
              </Typography>
              <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" flexGrow={1}>
                <Typography variant="body2" color="textSecondary">
                  Chart visualization would appear here
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {JSON.stringify(report.charts.completionPie)}
                </Typography>
              </Box>
            </Paper>
          </Grid>
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 240 }}>
              <Typography variant="h6" gutterBottom>
                Pre vs Post Assessment Scores
              </Typography>
              <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" flexGrow={1}>
                <Typography variant="body2" color="textSecondary">
                  Chart visualization would appear here
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {JSON.stringify(report.charts.prePostBar)}
                </Typography>
              </Box>
            </Paper>
          </Grid>

          {/* Assessment Performance Table */}
          <Grid item xs={12}>
            <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
              <Typography variant="h6" gutterBottom component="div">
                Assessment Performance
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Assessment Name</TableCell>
                      <TableCell>Score</TableCell>
                      <TableCell>Date Taken</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {report.assessments.map((assessment, index) => (
                      <TableRow key={index}>
                        <TableCell>{assessment.assessmentTitle}</TableCell>
                        <TableCell>{assessment.score}%</TableCell>
                        <TableCell>{formatDate(assessment.dateTaken)}</TableCell>
                        <TableCell>
                          {assessment.status === "Passed" ? (
                            <Chip label="Passed" color="success" size="small" />
                          ) : (
                            <Chip label="Failed" color="error" size="small" />
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </MainLayout>
  );
};

export default UserReportPage;