import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  Alert,
  Button,
  CircularProgress,
  Chip,
  Divider
} from '@mui/material';
import {
  CheckCircle,
  Cancel,
  ArrowBack,
  School,
  Assessment as AssessmentIcon
} from '@mui/icons-material';
import { courseService, progressService } from '../../services/api';
import UserAssessment from '../../components/assessment/UserAssessment';

const AssessmentView = () => {
  const { courseId, componentId } = useParams();
  const navigate = useNavigate();
  const [component, setComponent] = useState(null);
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [assessmentCompleted, setAssessmentCompleted] = useState(false);
  const [assessmentResult, setAssessmentResult] = useState(null);

  useEffect(() => {
    loadAssessmentData();
  }, [componentId]);

  const loadAssessmentData = async () => {
    try {
      setLoading(true);
      
      // Get course and component details
      const courseResponse = await courseService.getUserCourseById(courseId);
      setCourse(courseResponse.data);
      
      // Find the specific component
      const componentData = courseResponse.data.components.find(c => c.id === componentId);
      if (!componentData) {
        throw new Error('Component not found');
      }
      setComponent(componentData);
      
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load assessment');
    } finally {
      setLoading(false);
    }
  };

  const handleAssessmentComplete = (result) => {
    setAssessmentResult(result);
    setAssessmentCompleted(true);
  };

  const handleContinue = () => {
    navigate(`/course/${courseId}`);
  };

  const handleRetry = () => {
    setAssessmentCompleted(false);
    setAssessmentResult(null);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
        <Button 
          variant="contained" 
          onClick={() => navigate(`/course/${courseId}`)} 
          sx={{ mt: 2 }}
          startIcon={<ArrowBack />}
        >
          Back to Course
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box mb={3}>
        <Box display="flex" alignItems="center" mb={2}>
          <AssessmentIcon sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="h5" component="h1">
            {component?.data?.title || 'Assessment'}
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary">
          {course?.title}
        </Typography>
        {component?.data?.description && (
          <Typography variant="body1" sx={{ mt: 2 }}>
            {component.data.description}
          </Typography>
        )}
      </Box>

      {/* Assessment Content */}
      {!assessmentCompleted ? (
        <>
          {/* Instructions */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Instructions
            </Typography>
            <Typography variant="body2" paragraph>
              • This assessment contains {component?.data?.questions?.length || 0} questions
            </Typography>
            {component?.data?.timeLimit && (
              <Typography variant="body2" paragraph>
                • Time limit: {component.data.timeLimit} minutes
              </Typography>
            )}
            <Typography variant="body2" paragraph>
              • Passing score: {component?.data?.passingScore || 70}%
            </Typography>
            <Typography variant="body2" paragraph>
              • Maximum attempts: {component?.data?.maxAttempts || 'Unlimited'}
            </Typography>
            <Typography variant="body2">
              • Make sure to answer all questions before submitting
            </Typography>
          </Paper>

          {/* Assessment Component */}
          <Paper sx={{ p: 3 }}>
            <UserAssessment
              componentId={componentId}
              onComplete={handleAssessmentComplete}
            />
          </Paper>
        </>
      ) : (
        /* Results */
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Box display="flex" justifyContent="center" mb={3}>
            {assessmentResult?.passed ? (
              <CheckCircle sx={{ fontSize: 64, color: 'success.main' }} />
            ) : (
              <Cancel sx={{ fontSize: 64, color: 'error.main' }} />
            )}
          </Box>
          
          <Typography variant="h5" gutterBottom>
            Assessment {assessmentResult?.passed ? 'Passed' : 'Failed'}
          </Typography>
          
          <Typography variant="h3" gutterBottom sx={{ my: 3 }}>
            {assessmentResult?.score}%
          </Typography>
          
          <Divider sx={{ my: 3 }} />
          
          <Box>
            <Typography variant="body1" gutterBottom>
              Correct Answers: {assessmentResult?.correctAnswers} / {assessmentResult?.totalQuestions}
            </Typography>
            <Typography variant="body1" gutterBottom>
              Passing Score: {component?.data?.passingScore || 70}%
            </Typography>
          </Box>
          
          <Box display="flex" gap={2} justifyContent="center" mt={4}>
            {!assessmentResult?.passed && (
              <Button
                variant="outlined"
                onClick={handleRetry}
                startIcon={<AssessmentIcon />}
              >
                Retry Assessment
              </Button>
            )}
            <Button
              variant="contained"
              onClick={handleContinue}
              startIcon={assessmentResult?.passed ? <School /> : <ArrowBack />}
            >
              {assessmentResult?.passed ? 'Continue to Next' : 'Back to Course'}
            </Button>
          </Box>
        </Paper>
      )}
    </Container>
  );
};

export default AssessmentView;