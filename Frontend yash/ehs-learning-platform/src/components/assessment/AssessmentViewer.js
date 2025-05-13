// src/components/assessment/AssessmentViewer.js
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  Checkbox,
  TextField,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Card,
  CardContent,
  Alert,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress
} from '@mui/material';
import {
  NavigateNext as NextIcon,
  NavigateBefore as PrevIcon,
  Flag as FlagIcon,
  CheckCircle as CheckCircleIcon,
  Timer as TimerIcon,
  Help as HelpIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';
import axios from 'axios';

/**
 * AssessmentViewer Component
 * 
 * This component handles the display and interaction with pre and post assessments.
 * It fetches questions, allows users to answer them, and submits responses.
 */
const AssessmentViewer = ({ 
  componentId, 
  assessmentType, // "PRE_ASSESSMENT" or "POST_ASSESSMENT"
  onComplete,     // Callback when assessment is completed
  onError         // Callback for error handling
}) => {
  // State management
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState({});
  const [flaggedQuestions, setFlaggedQuestions] = useState([]);
  const [startTime, setStartTime] = useState(null);
  
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState(null);
  
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const [reviewMode, setReviewMode] = useState(false);

  // Timer state
  const [elapsedTime, setElapsedTime] = useState(0);
  const [timerActive, setTimerActive] = useState(false);

  // Fetch questions when component mounts
  useEffect(() => {
    fetchQuestions();
    setStartTime(new Date());
    setTimerActive(true);
  }, [componentId]);

  // Timer effect
  useEffect(() => {
    let interval = null;
    if (timerActive) {
      interval = setInterval(() => {
        setElapsedTime(prevTime => prevTime + 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [timerActive]);

  // Format time for display
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Fetch questions from API
  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/components/${componentId}/questions`);
      
      // Initialize answers object
      const initialAnswers = {};
      response.data.forEach(question => {
        initialAnswers[question.id] = '';
      });
      
      setQuestions(response.data);
      setUserAnswers(initialAnswers);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching questions:', error);
      setError('Failed to load assessment questions. Please try again later.');
      setLoading(false);
      if (onError) onError(error);
    }
  };

  // Handle user answer changes
  const handleAnswerChange = (questionId, value) => {
    setUserAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  // Toggle flagged status of current question
  const toggleFlagQuestion = (questionId) => {
    if (flaggedQuestions.includes(questionId)) {
      setFlaggedQuestions(flaggedQuestions.filter(id => id !== questionId));
    } else {
      setFlaggedQuestions([...flaggedQuestions, questionId]);
    }
  };

  // Navigation handlers
  const goToNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const goToPrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const goToQuestion = (index) => {
    if (index >= 0 && index < questions.length) {
      setCurrentQuestionIndex(index);
    }
  };

  // Start review mode
  const startReview = () => {
    setReviewMode(true);
    setCurrentQuestionIndex(0);
  };

  // Exit review mode
  const exitReview = () => {
    setReviewMode(false);
    setConfirmSubmit(true);
  };

  // Submit assessment
  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      setTimerActive(false);
      
      // Calculate time spent
      const timeSpent = Math.floor((new Date() - startTime) / 1000);
      
      // Prepare answers in the format expected by the API
      const answersArray = Object.keys(userAnswers).map(questionId => ({
        questionId: questionId,
        userAnswer: userAnswers[questionId]
      }));
      
      const submitData = {
        answers: answersArray,
        timeSpent: timeSpent
      };
      
      // Submit to API
      const response = await axios.post(`/api/components/${componentId}/submit`, submitData);
      
      setResults(response.data);
      setShowResults(true);
      setSubmitting(false);
      
      // Call the completion callback
      if (onComplete) {
        onComplete(response.data);
      }
      
    } catch (error) {
      console.error('Error submitting assessment:', error);
      setError('Failed to submit assessment. Please try again.');
      setSubmitting(false);
      if (onError) onError(error);
    }
  };

  // Cancel submission
  const cancelSubmit = () => {
    setConfirmSubmit(false);
  };

  // Render the current question
  const renderQuestion = (question, index) => {
    const isFlagged = flaggedQuestions.includes(question.id);
    const isCurrentQuestion = index === currentQuestionIndex;
    
    if (!isCurrentQuestion && !reviewMode) return null;
    
    // Parse options from JSON string
    let options = [];
    try {
      if (question.options) {
        if (typeof question.options === 'string') {
          options = JSON.parse(question.options);
        } else if (Array.isArray(question.options)) {
          options = question.options;
        }
      }
    } catch (err) {
      console.error('Error parsing options:', err);
    }
    
    // Ensure options is an array
    if (!Array.isArray(options)) {
      options = [];
    }
    
    return (
      <Paper 
        elevation={3} 
        sx={{ 
          p: 3, 
          mb: 3, 
          display: isCurrentQuestion || reviewMode ? 'block' : 'none',
          border: isFlagged ? '1px solid #f44336' : 'none'
        }}
      >
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="subtitle2" color="textSecondary">
            Question {index + 1} of {questions.length}
          </Typography>
          
          {!reviewMode && (
            <IconButton 
              onClick={() => toggleFlagQuestion(question.id)}
              color={isFlagged ? "error" : "default"}
            >
              <FlagIcon />
            </IconButton>
          )}
        </Box>
        
        <Typography variant="h6" gutterBottom>
          {question.text}
        </Typography>
        
        {renderAnswerInput(question, options)}
      </Paper>
    );
  };

  // Render the appropriate input based on question type
  const renderAnswerInput = (question, options) => {
    const questionId = question.id;
    const answer = userAnswers[questionId] || '';
    
    switch (question.type) {
      case 'MULTIPLE_CHOICE':
        return (
          <FormControl component="fieldset" fullWidth>
            <RadioGroup
              value={answer}
              onChange={(e) => handleAnswerChange(questionId, e.target.value)}
            >
              {options.map((option, idx) => (
                <FormControlLabel
                  key={idx}
                  value={option}
                  control={<Radio />}
                  label={option}
                  disabled={reviewMode || showResults}
                />
              ))}
            </RadioGroup>
          </FormControl>
        );
        
      case 'TRUE_FALSE':
        return (
          <FormControl component="fieldset" fullWidth>
            <RadioGroup
              value={answer}
              onChange={(e) => handleAnswerChange(questionId, e.target.value)}
            >
              <FormControlLabel
                value="true"
                control={<Radio />}
                label="True"
                disabled={reviewMode || showResults}
              />
              <FormControlLabel
                value="false"
                control={<Radio />}
                label="False"
                disabled={reviewMode || showResults}
              />
            </RadioGroup>
          </FormControl>
        );
        
      case 'SHORT_ANSWER':
        return (
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Your Answer"
            variant="outlined"
            value={answer}
            onChange={(e) => handleAnswerChange(questionId, e.target.value)}
            disabled={reviewMode || showResults}
            sx={{ mt: 2 }}
          />
        );
        
      default:
        return (
          <Typography color="error">
            Unsupported question type: {question.type}
          </Typography>
        );
    }
  };

  // Render assessment results
  const renderResults = () => {
    if (!results) return null;
    
    const { score, totalQuestions, correctAnswers, passed, questionResults } = results;
    
    return (
      <Box>
        <Typography variant="h4" align="center" gutterBottom>
          Assessment Results
        </Typography>
        
        <Card sx={{ mb: 3, bgcolor: passed ? '#e8f5e9' : '#ffebee' }}>
          <CardContent>
            <Box display="flex" alignItems="center" justifyContent="center" mb={2}>
              {passed ? (
                <CheckCircleIcon fontSize="large" color="success" sx={{ mr: 1 }} />
              ) : (
                <CancelIcon fontSize="large" color="error" sx={{ mr: 1 }} />
              )}
              <Typography variant="h5">
                {passed ? "Passed" : "Not Passed"}
              </Typography>
            </Box>
            
            <Typography variant="h6" align="center">
              Score: {score}%
            </Typography>
            
            <Typography variant="body1" align="center">
              {correctAnswers} correct out of {totalQuestions} questions
            </Typography>
          </CardContent>
        </Card>
        
        <Typography variant="h6" gutterBottom>
          Question Breakdown
        </Typography>
        
        {questionResults.map((result, index) => (
          <Card key={index} sx={{ mb: 2, bgcolor: result.isCorrect ? '#f1f8e9' : '#fce4ec' }}>
            <CardContent>
              <Typography variant="subtitle1" gutterBottom>
                {index + 1}. {result.text}
              </Typography>
              
              <Typography variant="body2" color="textSecondary">
                Your answer: {result.userAnswer}
              </Typography>
              
              <Typography variant="body2" color={result.isCorrect ? "success.main" : "error.main"}>
                Correct answer: {result.correctAnswer}
              </Typography>
              
              {result.explanation && (
                <Box mt={1} p={1} bgcolor="background.paper">
                  <Typography variant="body2">
                    <strong>Explanation:</strong> {result.explanation}
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        ))}
        
        <Box display="flex" justifyContent="center" mt={3}>
          <Button 
            variant="contained" 
            color="primary"
            onClick={() => {
              if (onComplete) onComplete(results);
            }}
          >
            Continue
          </Button>
        </Box>
      </Box>
    );
  };

  // Render question navigation
  const renderQuestionNav = () => {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          flexWrap: 'wrap', 
          justifyContent: 'center',
          gap: 1,
          mb: 2 
        }}
      >
        {questions.map((question, index) => (
          <Button
            key={index}
            variant={currentQuestionIndex === index ? "contained" : "outlined"}
            color={flaggedQuestions.includes(question.id) ? "error" : 
                  userAnswers[question.id] ? "primary" : "inherit"}
            size="small"
            onClick={() => goToQuestion(index)}
            sx={{ minWidth: '40px' }}
          >
            {index + 1}
          </Button>
        ))}
      </Box>
    );
  };

  // Handle loading state
  if (loading) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <CircularProgress />
        <Typography variant="body1" sx={{ mt: 2 }}>
          Loading assessment...
        </Typography>
      </Box>
    );
  }

  // Handle error state
  if (error) {
    return (
      <Alert severity="error" sx={{ m: 3 }}>
        {error}
      </Alert>
    );
  }

  // Render results if available
  if (showResults) {
    return renderResults();
  }

  // Main assessment view
  return (
    <Box sx={{ p: { xs: 1, sm: 3 } }}>
      {/* Assessment Header */}
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          mb: 3,
          flexWrap: 'wrap',
          gap: 1
        }}
      >
        <Typography variant="h5">
          {assessmentType === "PRE_ASSESSMENT" ? "Pre-Assessment" : "Post-Assessment"}
        </Typography>
        
        <Box display="flex" alignItems="center">
          <TimerIcon sx={{ mr: 1 }} />
          <Typography variant="body1">
            Time: {formatTime(elapsedTime)}
          </Typography>
        </Box>
      </Box>
      
      {/* Progress indicator */}
      <LinearProgress 
        variant="determinate" 
        value={(currentQuestionIndex / (questions.length - 1)) * 100} 
        sx={{ mb: 3, height: 8, borderRadius: 4 }}
      />
      
      {/* Question navigation */}
      {renderQuestionNav()}
      
      {/* Current Question */}
      {questions.map((question, index) => renderQuestion(question, index))}
      
      {/* Navigation buttons */}
      <Box display="flex" justifyContent="space-between" mt={3}>
        <Button
          variant="outlined"
          startIcon={<PrevIcon />}
          onClick={goToPrevQuestion}
          disabled={currentQuestionIndex === 0}
        >
          Previous
        </Button>
        
        {currentQuestionIndex < questions.length - 1 ? (
          <Button
            variant="contained"
            endIcon={<NextIcon />}
            onClick={goToNextQuestion}
          >
            Next
          </Button>
        ) : (
          <Button
            variant="contained"
            color="primary"
            onClick={() => setConfirmSubmit(true)}
            disabled={submitting}
          >
            {submitting ? <CircularProgress size={24} /> : "Submit"}
          </Button>
        )}
      </Box>
      
      {/* Submission confirmation dialog */}
      <Dialog open={confirmSubmit} onClose={cancelSubmit}>
        <DialogTitle>
          Submit Assessment
        </DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            Are you sure you want to submit your assessment?
          </Typography>
          
          <Typography variant="body2" color="textSecondary" gutterBottom>
            {Object.values(userAnswers).filter(a => a).length} of {questions.length} questions answered
          </Typography>
          
          {flaggedQuestions.length > 0 && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              You have {flaggedQuestions.length} flagged questions that you may want to review.
            </Alert>
          )}
          
          <Box display="flex" justifyContent="center" mt={2}>
            <Button
              variant="outlined"
              color="primary"
              onClick={startReview}
              sx={{ mr: 2 }}
            >
              Review Answers
            </Button>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={cancelSubmit}>
            Cancel
          </Button>
          <Button 
            variant="contained" 
            color="primary"
            onClick={handleSubmit}
            disabled={submitting}
          >
            Submit
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AssessmentViewer;