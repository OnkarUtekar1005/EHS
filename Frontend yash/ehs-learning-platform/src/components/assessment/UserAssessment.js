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
      
      // Get questions first (this doesn't create any database entries)
      const questionsResponse = await assessmentService.getQuestions(componentId);
      setQuestions(questionsResponse.data.questions);
      
      // Set time limit (convert minutes to seconds)
      const timeLimit = questionsResponse.data.timeLimit;
      if (timeLimit) {
        setTimeRemaining(timeLimit * 60);
      }
      
      // Now start the assessment attempt after a small delay to ensure enrollment is complete
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Start assessment attempt
      const attemptResponse = await assessmentService.startAttempt(componentId);
      setAttemptId(attemptResponse.data.attemptId);
      
      setLoading(false);
    } catch (error) {
      
      // Extract error message from response
      let errorMessage = 'Failed to load assessment. Please try again.';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data) {
        errorMessage = error.response.data;
      }
      
      // If it's a duplicate key error, retry after a delay
      if (errorMessage.includes('duplicate key')) {
        setTimeout(() => {
          loadAssessment();
        }, 1000);
        setError('Loading assessment... Please wait.');
      } else {
        setError(errorMessage);
      }
      
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
      
      
      const result = await assessmentService.submitAttempt(attemptId, answers);
      onComplete?.(result.data);
    } catch (error) {
      
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
      <Box 
        display="flex" 
        flexDirection="column"
        justifyContent="center" 
        alignItems="center" 
        minHeight={{ xs: '300px', sm: '400px' }}
        sx={{ p: { xs: 2, sm: 3 } }}
      >
        <CircularProgress sx={{ mb: 2 }} />
        <Typography 
          variant="body2" 
          color="text.secondary"
          sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
        >
          Loading assessment...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert 
        severity="error" 
        sx={{ 
          mt: 2,
          mx: { xs: 1, sm: 0 },
          fontSize: { xs: '0.875rem', sm: '1rem' }
        }}
      >
        {error}
      </Alert>
    );
  }

  if (questions.length === 0) {
    return (
      <Alert 
        severity="warning" 
        sx={{ 
          mt: 2,
          mx: { xs: 1, sm: 0 },
          fontSize: { xs: '0.875rem', sm: '1rem' }
        }}
      >
        No questions available for this assessment.
      </Alert>
    );
  }

  const question = questions[currentQuestion];
  const progress = ((currentQuestion + 1) / questions.length) * 100;

  return (
    <Card sx={{ 
      mx: { xs: 1, sm: 0 },
      borderRadius: { xs: 2, sm: 1 }
    }}>
      <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
        {/* Header with progress and timer - Mobile Responsive */}
        <Box 
          display="flex" 
          justifyContent="space-between" 
          alignItems={{ xs: 'flex-start', sm: 'center' }}
          flexDirection={{ xs: 'column', sm: 'row' }}
          mb={3}
          gap={{ xs: 2, sm: 0 }}
        >
          <Box flex={1} mr={{ xs: 0, sm: 2 }} width={{ xs: '100%', sm: 'auto' }}>
            <Box 
              display="flex" 
              alignItems="center" 
              mb={1}
              flexDirection={{ xs: 'column', sm: 'row' }}
              gap={{ xs: 1, sm: 0 }}
            >
              <Typography 
                variant="caption" 
                color="text.secondary"
                sx={{ 
                  fontSize: { xs: '0.75rem', sm: '0.75rem' },
                  textAlign: { xs: 'center', sm: 'left' }
                }}
              >
                Question {currentQuestion + 1} of {questions.length}
              </Typography>
              <Box ml={{ xs: 0, sm: 2 }}>
                <Chip
                  size="small"
                  label={`${Object.keys(answers).length} answered`}
                  color={isAllQuestionsAnswered() ? 'success' : 'default'}
                  sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
                />
              </Box>
            </Box>
            <LinearProgress 
              variant="determinate" 
              value={progress}
              sx={{ 
                height: { xs: 6, sm: 8 }, 
                borderRadius: 4,
                width: '100%'
              }}
            />
          </Box>
          {timeRemaining !== null && (
            <Chip
              icon={<Timer />}
              label={formatTime(timeRemaining)}
              color={timeRemaining < 300 ? 'error' : 'primary'}
              variant="outlined"
              sx={{
                fontSize: { xs: '0.75rem', sm: '0.875rem' },
                height: { xs: 28, sm: 32 },
                mt: { xs: 0, sm: 0 }
              }}
            />
          )}
        </Box>

        {/* Question Content - Mobile Responsive */}
        <Box mb={{ xs: 3, sm: 4 }}>
          <Typography 
            variant="h6" 
            gutterBottom 
            sx={{ 
              fontWeight: 500,
              fontSize: { xs: '1.125rem', sm: '1.25rem' },
              lineHeight: { xs: 1.4, sm: 1.6 },
              wordBreak: 'break-word'
            }}
          >
            {question.question}
          </Typography>

          {question.type === 'MCQ' && (
            <RadioGroup
              value={answers[question.id] || ''}
              onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            >
              {question.options.map((option, index) => {
                // Handle both object and string formats
                const optionText = typeof option === 'object' ? option.text : option;
                const optionValue = typeof option === 'object' ? option.text : option;
                
                return (
                  <FormControlLabel
                    key={index}
                    value={optionValue}
                    control={<Radio />}
                    label={optionText}
                    sx={{ 
                      py: { xs: 0.75, sm: 0.5 },
                      mx: 0,
                      width: '100%',
                      '& .MuiFormControlLabel-label': {
                        fontSize: { xs: '0.875rem', sm: '1rem' },
                        lineHeight: 1.5,
                        wordBreak: 'break-word'
                      }
                    }}
                  />
                );
              })}
            </RadioGroup>
          )}

          {question.type === 'TRUE_FALSE' && (
            <RadioGroup
              value={answers[question.id] || ''}
              onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            >
              <FormControlLabel 
                value="true" 
                control={<Radio />} 
                label="True"
                sx={{ 
                  py: { xs: 0.75, sm: 0.5 },
                  mx: 0,
                  width: '100%',
                  '& .MuiFormControlLabel-label': {
                    fontSize: { xs: '0.875rem', sm: '1rem' }
                  }
                }}
              />
              <FormControlLabel 
                value="false" 
                control={<Radio />} 
                label="False"
                sx={{ 
                  py: { xs: 0.75, sm: 0.5 },
                  mx: 0,
                  width: '100%',
                  '& .MuiFormControlLabel-label': {
                    fontSize: { xs: '0.875rem', sm: '1rem' }
                  }
                }}
              />
            </RadioGroup>
          )}
        </Box>

        {/* Navigation and Submit - Mobile Responsive */}
        <Box 
          display="flex" 
          justifyContent="space-between" 
          alignItems="center"
          flexDirection={{ xs: 'column', sm: 'row' }}
          gap={{ xs: 2, sm: 0 }}
        >
          <Button
            variant="outlined"
            startIcon={<NavigateBefore />}
            onClick={handlePrevious}
            disabled={currentQuestion === 0}
            sx={{
              width: { xs: '100%', sm: 'auto' },
              order: { xs: 2, sm: 1 },
              minHeight: { xs: 44, sm: 36 }
            }}
            size={window.innerWidth < 600 ? "large" : "medium"}
          >
            Previous
          </Button>

          <Typography 
            variant="body2" 
            color="text.secondary"
            sx={{
              order: { xs: 3, sm: 2 },
              fontSize: { xs: '0.875rem', sm: '0.875rem' },
              textAlign: 'center'
            }}
          >
            {currentQuestion + 1} / {questions.length}
          </Typography>

          {currentQuestion === questions.length - 1 ? (
            <Button
              variant="contained"
              color="primary"
              startIcon={submitting ? <CircularProgress size={20} color="inherit" /> : <Send />}
              onClick={handleSubmit}
              disabled={submitting || !isAllQuestionsAnswered()}
              sx={{
                width: { xs: '100%', sm: 'auto' },
                order: { xs: 1, sm: 3 },
                minHeight: { xs: 44, sm: 36 }
              }}
              size={window.innerWidth < 600 ? "large" : "medium"}
            >
              {submitting ? 'Submitting...' : 'Submit Assessment'}
            </Button>
          ) : (
            <Button
              variant="contained"
              endIcon={<NavigateNext />}
              onClick={handleNext}
              sx={{
                width: { xs: '100%', sm: 'auto' },
                order: { xs: 1, sm: 3 },
                minHeight: { xs: 44, sm: 36 }
              }}
              size={window.innerWidth < 600 ? "large" : "medium"}
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