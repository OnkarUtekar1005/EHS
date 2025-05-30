import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Divider,
  Paper,
  Grid,
  Chip
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Close as CloseIcon,
} from '@mui/icons-material';

/**
 * Assessment Review component
 * Displays the detailed results of an assessment with all questions and answers
 */
const AssessmentReview = ({ open, onClose, assessmentResult, component }) => {
  console.log('AssessmentReview component rendering with:', {
    open,
    assessmentResult,
    component
  });

  // Don't render anything if the dialog shouldn't be open
  if (!open) {
    return null;
  }
  
  // Show loading state if data is missing
  if (!assessmentResult) {
    return (
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="md"
        fullWidth
        sx={{
          '& .MuiDialog-paper': {
            margin: { xs: 1, sm: 2 },
            width: { xs: 'calc(100% - 16px)', sm: 'auto' }
          }
        }}
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">Assessment Review</Typography>
            <Button onClick={onClose} color="inherit" size="small">
              Close
            </Button>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          <Box display="flex" justifyContent="center" alignItems="center" py={4}>
            <Typography variant="body1">Loading assessment results...</Typography>
          </Box>
        </DialogContent>
      </Dialog>
    );
  }
  
  // Show error state if there's an error
  if (assessmentResult.error) {
    return (
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="md"
        fullWidth
        sx={{
          '& .MuiDialog-paper': {
            margin: { xs: 1, sm: 2 },
            width: { xs: 'calc(100% - 16px)', sm: 'auto' }
          }
        }}
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">Assessment Review</Typography>
            <Button onClick={onClose} color="inherit" size="small">
              Close
            </Button>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          <Box display="flex" justifyContent="center" alignItems="center" py={4}>
            <Typography variant="body1" color="error">
              {assessmentResult.errorMessage || 'Error loading assessment data'}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} variant="contained">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    );
  }
  
  // Show simplified view if detailed results are missing
  if (!assessmentResult.detailedResults || assessmentResult.detailedResults.length === 0) {
    return (
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="md"
        fullWidth
        sx={{
          '& .MuiDialog-paper': {
            margin: { xs: 1, sm: 2 },
            width: { xs: 'calc(100% - 16px)', sm: 'auto' }
          }
        }}
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">Assessment Summary</Typography>
            <Button onClick={onClose} color="inherit" size="small">
              Close
            </Button>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          <Box textAlign="center" py={4}>
            <Typography variant="h5" gutterBottom>
              Assessment Score
            </Typography>
            <Typography variant="h2" color="primary" gutterBottom>
              {assessmentResult.score || '100'}%
            </Typography>
            <Box mt={3}>
              <Typography variant="body1">
                Congratulations! You've completed this assessment successfully.
              </Typography>
              <Typography variant="body2" color="text.secondary" mt={2}>
                Detailed results are not available for this assessment attempt.
              </Typography>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} variant="contained">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    );
  }

  const { correctAnswers, totalQuestions, score, detailedResults } = assessmentResult;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={window.innerWidth < 600 ? false : "md"}
      fullWidth={window.innerWidth >= 600}
      fullScreen={window.innerWidth < 600}
      scroll="paper"
      aria-labelledby="assessment-review-title"
      sx={{
        '& .MuiDialog-paper': {
          height: { xs: '100vh', sm: 'auto' },
          maxHeight: { xs: '100vh', sm: '90vh' },
          margin: { xs: 0, sm: 2 },
          borderRadius: { xs: 0, sm: 1 }
        }
      }}
    >
      <DialogTitle id="assessment-review-title">
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">Assessment Review</Typography>
          <Button 
            onClick={onClose} 
            color="inherit" 
            size="small"
            startIcon={<CloseIcon />}
          >
            Close
          </Button>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        {/* Summary section */}
        <Paper 
          elevation={0} 
          sx={{ 
            p: 3, 
            mb: 3, 
            bgcolor: 'primary.light', 
            color: 'primary.contrastText',
            borderRadius: 2
          }}
        >
          <Grid container spacing={2} alignItems="center" justifyContent="center">
            <Grid item xs={12} md={4} sx={{ textAlign: 'center' }}>
              <Typography variant="h4" gutterBottom fontWeight="bold">
                {score}%
              </Typography>
              <Typography variant="body2">Score</Typography>
            </Grid>
            <Grid item xs={12} md={4} sx={{ textAlign: 'center' }}>
              <Typography variant="h4" gutterBottom fontWeight="bold">
                {correctAnswers}/{totalQuestions}
              </Typography>
              <Typography variant="body2">Correct Answers</Typography>
            </Grid>
            <Grid item xs={12} md={4} sx={{ textAlign: 'center' }}>
              <Chip 
                label="Perfect Score!" 
                color="success" 
                icon={<CheckCircleIcon />} 
                sx={{ fontWeight: 'bold' }}
              />
            </Grid>
          </Grid>
        </Paper>

        {/* Questions and answers section */}
        <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
          Question Details
        </Typography>

        {detailedResults.map((result, index) => {
          // Get the question text from the component data if available
          const questionObj = component?.data?.questions || [];
          const questionText = Array.isArray(questionObj) && questionObj[index]?.question
            ? questionObj[index].question
            : `Question ${index + 1}`;
            
          return (
            <Paper key={index} sx={{ p: 2, mb: 2, bgcolor: 'background.paper' }}>
              <Typography variant="body1" fontWeight="medium" gutterBottom>
                <Box component="span" sx={{ mr: 1 }}>
                  {index + 1}.
                </Box>
                {questionText}
              </Typography>
              
              <Box sx={{ mt: 2, ml: 4 }}>
                <Box display="flex" alignItems="center" sx={{ mb: 1 }}>
                  <Typography variant="body2" fontWeight="bold" sx={{ mr: 1 }}>
                    Your Answer:
                  </Typography>
                  <Typography variant="body2">
                    {result.userAnswer || 'Not answered'}
                  </Typography>
                  <CheckCircleIcon color="success" fontSize="small" sx={{ ml: 1 }} />
                </Box>
                
                <Box display="flex" alignItems="center">
                  <Typography variant="body2" fontWeight="bold" sx={{ mr: 1 }}>
                    Correct Answer:
                  </Typography>
                  <Typography variant="body2" color="success.main" fontWeight="medium">
                    {result.correctAnswer || 'Unknown'}
                  </Typography>
                </Box>
              </Box>
              
              {/* If options are available, display them */}
              {Array.isArray(questionObj) && 
               questionObj[index]?.options && 
               questionObj[index].options.length > 0 && (
                <Box sx={{ mt: 2, ml: 4 }}>
                  <Typography variant="body2" fontWeight="bold" gutterBottom>
                    Available Options:
                  </Typography>
                  {questionObj[index].options.map((option, optIndex) => {
                    const optionText = typeof option === 'object' ? option.text : option;
                    const isCorrect = typeof option === 'object' && option.isCorrect;
                    
                    return (
                      <Box 
                        key={optIndex} 
                        display="flex" 
                        alignItems="center" 
                        sx={{ mb: 0.5 }}
                      >
                        <Typography variant="body2" sx={{ 
                          color: isCorrect ? 'success.main' : 'text.primary',
                          fontWeight: isCorrect ? 'bold' : 'regular'
                        }}>
                          {optionText}
                        </Typography>
                        {isCorrect && <CheckCircleIcon color="success" fontSize="small" sx={{ ml: 1 }} />}
                      </Box>
                    );
                  })}
                </Box>
              )}
            </Paper>
          );
        })}
      </DialogContent>

      <DialogActions sx={{ p: { xs: 2, sm: 1 } }}>
        <Button 
          onClick={onClose} 
          variant="contained"
          sx={{
            width: { xs: '100%', sm: 'auto' },
            minHeight: { xs: 44, sm: 36 }
          }}
          size={window.innerWidth < 600 ? "large" : "medium"}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AssessmentReview;