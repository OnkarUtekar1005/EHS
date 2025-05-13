// src/components/module/AssessmentViewer.js
import React, { useState, useEffect } from 'react';
import {
  Typography, Box, Card, CardContent, Button, 
  FormControl, FormLabel, RadioGroup, FormControlLabel, Radio,
  CircularProgress, Alert, Divider, Chip
} from '@mui/material';
import { CheckCircle, Assignment } from '@mui/icons-material';
import { assessmentService } from '../../services/api';

const AssessmentViewer = ({ componentId, isCompleted, onComplete }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [assessment, setAssessment] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  
  // Fetch assessment data
  useEffect(() => {
    const fetchAssessment = async () => {
      try {
        setLoading(true);
        
        // Get assessment questions
        const response = await assessmentService.getQuestions(componentId);
        
        // Format questions with proper error handling for options
        const formattedQuestions = response.data.map(q => {
          let parsedOptions = [];
          
          try {
            // If options is a string, try to parse it as JSON
            if (typeof q.options === 'string') {
              parsedOptions = JSON.parse(q.options);
            } else if (Array.isArray(q.options)) {
              // If already an array, use it directly
              parsedOptions = q.options;
            }
          } catch (err) {
            console.error('Error parsing options for question:', q.id, err);
            // Fall back to empty array on parsing error (already initialized)
          }
          
          return {
            ...q,
            options: parsedOptions
          };
        });
        
        setQuestions(formattedQuestions);
        
        // If already completed, try to get previous result
        if (isCompleted) {
          try {
            // You might need to implement this API endpoint
            const resultResponse = await assessmentService.getResult(componentId);
            setResult(resultResponse.data);
          } catch (resultErr) {
            console.warn('Could not load previous result:', resultErr);
          }
        }
      } catch (err) {
        console.error('Error loading assessment:', err);
        setError('Failed to load assessment questions.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchAssessment();
  }, [componentId, isCompleted]);
  
  // Handle answer selection
  const handleAnswerChange = (questionId, value) => {
    setAnswers({
      ...answers,
      [questionId]: value
    });
  };
  
  // Submit assessment
  const handleSubmit = async () => {
    try {
      setLoading(true);
      
      // Check if all questions are answered
      const allAnswered = questions.every(q => answers[q.id]);
      if (!allAnswered) {
        setError('Please answer all questions before submitting.');
        setLoading(false);
        return;
      }
      
      // Format answers for submission
      const formattedAnswers = Object.entries(answers).map(([questionId, userAnswer]) => ({
        questionId,
        userAnswer
      }));
      
      // Submit answers
      const response = await assessmentService.submitAnswers(componentId, {
        answers: formattedAnswers
      });
      
      // Set result
      setResult(response.data);
      
      // Call completion handler with score
      onComplete(componentId, {
        scoreValue: response.data.overallScore
      });
    } catch (err) {
      console.error('Error submitting assessment:', err);
      setError('Failed to submit assessment. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" my={4}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }
  
  // If completed, show result
  if (isCompleted || result) {
    return (
      <Box>
        <Typography variant="h5" gutterBottom>Assessment Result</Typography>
        
        {result ? (
          <>
            <Alert 
              severity={result.passed ? "success" : "warning"}
              icon={result.passed ? <CheckCircle /> : <Assignment />}
              sx={{ mb: 3 }}
            >
              <Typography variant="h6">
                Your Score: {result.overallScore}%
              </Typography>
              <Typography>
                {result.passed ? 
                  "Congratulations! You have passed this assessment." : 
                  "You did not meet the passing score for this assessment."}
              </Typography>
            </Alert>
            
            {result.questionResults && (
              <Box mt={3}>
                <Typography variant="h6" gutterBottom>Question Review</Typography>
                
                {result.questionResults.map((question, index) => (
                  <Card key={index} variant="outlined" sx={{ mb: 2 }}>
                    <CardContent>
                      <Typography variant="subtitle1" gutterBottom>
                        <strong>{index + 1}.</strong> {question.text}
                      </Typography>
                      
                      <Typography color={question.isCorrect ? "success.main" : "error.main"}>
                        Your answer: {question.userAnswer}
                      </Typography>
                      
                      {!question.isCorrect && (
                        <Typography color="success.main">
                          Correct answer: {question.correctAnswer}
                        </Typography>
                      )}
                      
                      {question.explanation && (
                        <Typography variant="body2" sx={{ mt: 1, fontStyle: 'italic' }}>
                          {question.explanation}
                        </Typography>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </Box>
            )}
          </>
        ) : (
          <Typography>
            You have completed this assessment.
          </Typography>
        )}
      </Box>
    );
  }
  
  // Show assessment questions
  return (
    <Box>
      <Typography variant="h5" gutterBottom>Assessment</Typography>
      
      {questions.length === 0 ? (
        <Alert severity="info">No questions found for this assessment.</Alert>
      ) : (
        <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
          {questions.map((question, index) => (
            <Card key={question.id} variant="outlined" sx={{ mb: 3 }}>
              <CardContent>
                <FormControl component="fieldset" fullWidth>
                  <FormLabel id={`question-${question.id}-label`}>
                    <Typography variant="subtitle1">
                      <strong>{index + 1}.</strong> {question.text}
                    </Typography>
                  </FormLabel>
                  
                  <RadioGroup
                    aria-labelledby={`question-${question.id}-label`}
                    name={`question-${question.id}`}
                    value={answers[question.id] || ''}
                    onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                  >
                    {Array.isArray(question.options) && question.options.length > 0 ? (
                      question.options.map(option => (
                        <FormControlLabel
                          key={option.id || option.value || option}
                          value={option.id || option.value || option}
                          control={<Radio />}
                          label={option.text || option.label || option}
                        />
                      ))
                    ) : (
                      <Typography color="error">Options not available</Typography>
                    )}
                  </RadioGroup>
                </FormControl>
              </CardContent>
            </Card>
          ))}
          
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
            <Button 
              type="submit" 
              variant="contained" 
              size="large"
              disabled={loading || Object.keys(answers).length !== questions.length}
            >
              {loading ? <CircularProgress size={24} /> : 'Submit Assessment'}
            </Button>
          </Box>
        </form>
      )}
    </Box>
  );
};

export default AssessmentViewer;