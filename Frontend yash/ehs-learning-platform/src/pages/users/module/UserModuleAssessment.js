// src/pages/users/module/UserModuleAssessment.js
import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Paper,
  Typography,
  Button,
  Divider,
  CircularProgress,
  Alert,
  Stepper,
  Step,
  StepLabel,
  Card,
  CardContent,
  IconButton
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import AssessmentViewer from '../../../components/assessment/AssessmentViewer';
import axios from 'axios';
import { AuthContext } from '../../../contexts/AuthContext';

/**
 * UserModuleAssessment Component
 * 
 * This component handles the user flow for completing module assessments.
 * It supports both pre-assessment and post-assessment stages.
 */
const UserModuleAssessment = () => {
  const { moduleId, componentId } = useParams();
  const { currentUser } = useContext(AuthContext);
  const navigate = useNavigate();
  
  // State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [component, setComponent] = useState(null);
  const [module, setModule] = useState(null);
  const [assessmentCompleted, setAssessmentCompleted] = useState(false);
  const [assessmentResults, setAssessmentResults] = useState(null);
  
  // Fetch component and module data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch component data
        const componentResponse = await axios.get(`/api/components/${componentId}`);
        setComponent(componentResponse.data);
        
        // Fetch module data
        const moduleResponse = await axios.get(`/api/modules/${moduleId}`);
        setModule(moduleResponse.data);
        
        // Check if assessment is already completed
        const progressResponse = await axios.get(`/api/users/${currentUser.id}/progress/component/${componentId}`);
        
        if (progressResponse.data && progressResponse.data.status === 'COMPLETED') {
          setAssessmentCompleted(true);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load assessment data. Please try again later.');
        setLoading(false);
      }
    };
    
    fetchData();
  }, [componentId, moduleId, currentUser.id]);
  
  // Handle assessment completion
  const handleAssessmentComplete = async (results) => {
    setAssessmentResults(results);
    setAssessmentCompleted(true);
    
    try {
      // Mark component as completed
      await axios.post(`/api/progress/component/${componentId}/complete`, {
        passed: results.passed,
        score: results.score
      });
      
      // Fetch next component in sequence
      const moduleResponse = await axios.get(`/api/modules/${moduleId}`);
      const components = moduleResponse.data.components;
      
      // Find current component index
      const currentIndex = components.findIndex(c => c.id === componentId);
      
      // If there's a next component
      if (currentIndex < components.length - 1) {
        // Redirect to next component after a short delay
        setTimeout(() => {
          navigate(`/modules/${moduleId}/component/${components[currentIndex + 1].id}`);
        }, 3000);
      } else {
        // If this was the last component, redirect to module completion
        setTimeout(() => {
          navigate(`/modules/${moduleId}/complete`);
        }, 3000);
      }
      
    } catch (err) {
      console.error('Error updating progress:', err);
      setError('Failed to update your progress. Your results have been recorded, but please contact support if you cannot proceed.');
    }
  };
  
  // Handle navigation back
  const handleBack = () => {
    navigate(`/modules/${moduleId}`);
  };
  
  // Render loading state
  if (loading) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4 }}>
          <CircularProgress size={60} />
          <Typography variant="h6" sx={{ mt: 2 }}>
            Loading assessment...
          </Typography>
        </Box>
      </Container>
    );
  }
  
  // Render error state
  if (error) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button 
          startIcon={<ArrowBackIcon />} 
          variant="outlined" 
          onClick={handleBack}
        >
          Return to Module
        </Button>
      </Container>
    );
  }
  
  // If component or module not found
  if (!component || !module) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          Assessment not found. The module or component may have been removed.
        </Alert>
        <Button 
          startIcon={<ArrowBackIcon />} 
          variant="outlined" 
          onClick={() => navigate('/my-courses')}
        >
          Return to My Courses
        </Button>
      </Container>
    );
  }
  
  // Determine assessment type
  const isPreAssessment = component.type === 'PRE_ASSESSMENT';
  const isPostAssessment = component.type === 'POST_ASSESSMENT';
  
  // If component is not an assessment
  if (!isPreAssessment && !isPostAssessment) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="warning" sx={{ mb: 2 }}>
          This component is not an assessment. Please return to the module.
        </Alert>
        <Button 
          startIcon={<ArrowBackIcon />} 
          variant="outlined" 
          onClick={handleBack}
        >
          Return to Module
        </Button>
      </Container>
    );
  }
  
  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={handleBack} sx={{ mr: 1 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4">
          {module.title}
        </Typography>
      </Box>
      
      {/* Assessment Container */}
      <Paper elevation={3} sx={{ p: { xs: 2, md: 3 }, mb: 4 }}>
        {/* Assessment Introduction */}
        {!assessmentCompleted && (
          <Box sx={{ mb: 4 }}>
            <Typography variant="h5" gutterBottom>
              {isPreAssessment ? 'Pre-Assessment' : 'Post-Assessment'}: {component.title}
            </Typography>
            
            <Typography variant="body1" paragraph>
              {component.description || (
                isPreAssessment 
                  ? 'This pre-assessment will help establish your current knowledge level. Do your best to answer all questions.'
                  : 'This post-assessment will evaluate your understanding of the course material. Please answer all questions to the best of your ability.'
              )}
            </Typography>
            
            <Card variant="outlined" sx={{ mb: 3, bgcolor: '#f5f5f5' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                  <InfoIcon sx={{ mr: 1, color: 'primary.main' }} />
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      Assessment Information:
                    </Typography>
                    <Typography variant="body2">
                      • Number of questions: {component.questionCount || 'Not specified'}
                    </Typography>
                    <Typography variant="body2">
                      • Passing score: {module.requiredCompletionScore || 70}%
                    </Typography>
                    <Typography variant="body2">
                      • Estimated time: {component.estimatedDuration || 'Not specified'} minutes
                    </Typography>
                    {isPreAssessment && (
                      <Typography variant="body2" sx={{ mt: 1, fontStyle: 'italic' }}>
                        Your score on this pre-assessment will not affect your ability to continue with the module.
                      </Typography>
                    )}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Box>
        )}
        
        {/* Assessment Viewer */}
        <AssessmentViewer 
          componentId={componentId}
          assessmentType={component.type}
          onComplete={handleAssessmentComplete}
          onError={(err) => setError('There was a problem with the assessment. Please try again.')}
        />
        
        {/* Assessment Completion */}
        {assessmentCompleted && assessmentResults && (
          <Box sx={{ mt: 4, textAlign: 'center' }}>
            <Alert 
              severity={assessmentResults.passed ? "success" : (isPreAssessment ? "info" : "warning")}
              sx={{ mb: 2 }}
            >
              {isPreAssessment ? (
                "Your pre-assessment has been completed. You can now proceed with the learning materials."
              ) : (
                assessmentResults.passed 
                  ? "Congratulations! You've passed the assessment."
                  : "You didn't reach the passing score for this assessment."
              )}
            </Alert>
            
            <Typography variant="body2" color="textSecondary">
              Redirecting you to the next section...
            </Typography>
            <CircularProgress size={24} sx={{ mt: 1 }} />
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default UserModuleAssessment;