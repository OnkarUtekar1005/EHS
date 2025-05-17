import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Radio,
  RadioGroup,
  FormControlLabel,
  LinearProgress,
  Chip,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  Timer,
  NavigateBefore,
  NavigateNext,
  Send,
  CheckCircle
} from '@mui/icons-material';
import { assessmentService } from '../../services/api';

const UserAssessment = ({ componentId, onComplete }) => {
  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [attemptId, setAttemptId] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadAssessment();
  }, [componentId]);

  useEffect(() => {
    // Timer countdown
    if (timeRemaining !== null && timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            handleSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [timeRemaining]);

  const loadAssessment = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Start assessment attempt
      const attemptResponse = await assessmentService.startAttempt(componentId);
      setAttemptId(attemptResponse.data.attemptId);
      
      // Get questions
      const questionsResponse = await assessmentService.getQuestions(componentId);
      setQuestions(questionsResponse.data.questions);
      
      // Set time limit (convert minutes to seconds)
      const timeLimit = questionsResponse.data.timeLimit;
      if (timeLimit) {
        setTimeRemaining(timeLimit * 60);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error loading assessment:', error);
      
      // Extract error message from response
      let errorMessage = 'Failed to load assessment. Please try again.';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data) {
        errorMessage = error.response.data;
      }
      
      setError(errorMessage);
      setLoading(false);
    }
  };

  const handleAnswerChange = (questionId, answer) => {
    setAnswers({
      ...answers,
      [questionId]: answer
    });
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      
      // Create userAnswers object from answers state
      const userAnswers = {
        answers: answers
      };
      
      const result = await assessmentService.submitAttempt(attemptId, userAnswers);
      onComplete?.(result.data);
    } catch (error) {
      console.error('Error submitting assessment:', error);
      
      // Extract error message from response
      let errorMessage = 'Failed to submit assessment. Please try again.';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data) {
        errorMessage = error.response.data;
      }
      
      setError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const isAllQuestionsAnswered = () => {
    return questions.every(q => answers[q.id]);
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
      <Alert severity="error" sx={{ mt: 2 }}>
        {error}
      </Alert>
    );
  }

  if (questions.length === 0) {
    return (
      <Alert severity="warning" sx={{ mt: 2 }}>
        No questions available for this assessment.
      </Alert>
    );
  }

  const question = questions[currentQuestion];
  const progress = ((currentQuestion + 1) / questions.length) * 100;

  return (
    <Card>
      <CardContent>
        {/* Header with progress and timer */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Box flex={1} mr={2}>
            <Box display="flex" alignItems="center" mb={1}>
              <Typography variant="caption" color="text.secondary">
                Question {currentQuestion + 1} of {questions.length}
              </Typography>
              <Box ml={2}>
                <Chip
                  size="small"
                  label={`${Object.keys(answers).length} answered`}
                  color={isAllQuestionsAnswered() ? 'success' : 'default'}
                />
              </Box>
            </Box>
            <LinearProgress 
              variant="determinate" 
              value={progress}
              sx={{ height: 8, borderRadius: 4 }}
            />
          </Box>
          {timeRemaining !== null && (
            <Chip
              icon={<Timer />}
              label={formatTime(timeRemaining)}
              color={timeRemaining < 300 ? 'error' : 'primary'}
              variant="outlined"
            />
          )}
        </Box>

        {/* Question Content */}
        <Box mb={4}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 500 }}>
            {question.question}
          </Typography>

          {question.type === 'MCQ' && (
            <RadioGroup
              value={answers[question.id] || ''}
              onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            >
              {question.options.map((option) => (
                <FormControlLabel
                  key={option.value}
                  value={option.value}
                  control={<Radio />}
                  label={option.text}
                  sx={{ py: 0.5 }}
                />
              ))}
            </RadioGroup>
          )}

          {question.type === 'TRUE_FALSE' && (
            <RadioGroup
              value={String(answers[question.id] || '')}
              onChange={(e) => handleAnswerChange(question.id, e.target.value === 'true')}
            >
              <FormControlLabel 
                value="true" 
                control={<Radio />} 
                label="True"
                sx={{ py: 0.5 }}
              />
              <FormControlLabel 
                value="false" 
                control={<Radio />} 
                label="False"
                sx={{ py: 0.5 }}
              />
            </RadioGroup>
          )}
        </Box>

        {/* Navigation and Submit */}
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Button
            variant="outlined"
            startIcon={<NavigateBefore />}
            onClick={handlePrevious}
            disabled={currentQuestion === 0}
          >
            Previous
          </Button>

          <Typography variant="body2" color="text.secondary">
            {currentQuestion + 1} / {questions.length}
          </Typography>

          {currentQuestion === questions.length - 1 ? (
            <Button
              variant="contained"
              color="primary"
              startIcon={submitting ? <CircularProgress size={20} color="inherit" /> : <Send />}
              onClick={handleSubmit}
              disabled={submitting || !isAllQuestionsAnswered()}
            >
              {submitting ? 'Submitting...' : 'Submit Assessment'}
            </Button>
          ) : (
            <Button
              variant="contained"
              endIcon={<NavigateNext />}
              onClick={handleNext}
            >
              Next
            </Button>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default UserAssessment;