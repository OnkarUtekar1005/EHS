// src/pages/admin/AssessmentCreator.js
import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  TextField,
  Grid,
  Button,
  IconButton,
  List,
  ListItem,
  Divider,
  Card,
  CardContent,
  FormControl,
  FormControlLabel,
  Checkbox,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
  Tooltip,
  Radio,
  RadioGroup,
  FormLabel
} from '@mui/material';
import {
  Add as AddIcon,
  ArrowBack as ArrowBackIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  SmartToy as AIIcon
} from '@mui/icons-material';

const AssessmentCreator = ({ assessment = {}, moduleTitle = '', assessmentType = 'PRE_ASSESSMENT', onSave, onCancel }) => {
  // Default title based on type
  const getDefaultTitle = () => {
    return assessmentType === 'PRE_ASSESSMENT' ? 
      `${moduleTitle} Pre-Assessment` : 
      `${moduleTitle} Post-Assessment`;
  };
  
  // Assessment Settings State
  const [assessmentData, setAssessmentData] = useState({
    title: assessment.title || getDefaultTitle(),
    description: assessment.description || `${assessmentType === 'PRE_ASSESSMENT' ? 'Initial' : 'Final'} knowledge assessment for ${moduleTitle}`,
    timeLimit: assessment.timeLimit || 15,
    passingScore: assessment.passingScore || 70,
    randomizeQuestions: assessment.randomizeQuestions || true,
    showCorrectAnswers: assessment.showCorrectAnswers || false,
    requiredToAdvance: assessment.requiredToAdvance || true
  });
  
  // Questions State
  const [questions, setQuestions] = useState(assessment.questions || []);
  
  // UI State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Question Dialog State
  const [openQuestionDialog, setOpenQuestionDialog] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [editingQuestionIndex, setEditingQuestionIndex] = useState(-1);
  
  // Handle assessment settings change
  const handleSettingChange = (e) => {
    const { name, value, checked, type } = e.target;
    setAssessmentData({
      ...assessmentData,
      [name]: type === 'checkbox' ? checked : value
    });
  };
  
  // Handle save assessment
  const handleSave = () => {
    // Validate
    if (!assessmentData.title) {
      setError('Assessment title is required');
      return;
    }
    
    // Create data to save
    const dataToSave = {
      ...assessmentData,
      questions
    };
    
    // Call parent save function
    onSave(dataToSave);
  };
  
  // Open question editor
  const handleAddQuestion = () => {
    setCurrentQuestion({
      text: '',
      type: 'MULTIPLE_CHOICE',
      options: [
        { text: 'Option 1', correct: true },
        { text: 'Option 2', correct: false },
        { text: 'Option 3', correct: false },
        { text: 'Option 4', correct: false }
      ],
      points: 1
    });
    setEditingQuestionIndex(-1);
    setOpenQuestionDialog(true);
  };
  
  // Edit existing question
  const handleEditQuestion = (index) => {
    setCurrentQuestion(questions[index]);
    setEditingQuestionIndex(index);
    setOpenQuestionDialog(true);
  };
  
  // Delete question
  const handleDeleteQuestion = (index) => {
    const newQuestions = [...questions];
    newQuestions.splice(index, 1);
    setQuestions(newQuestions);
  };
  
  // Close question dialog
  const handleCloseQuestionDialog = () => {
    setOpenQuestionDialog(false);
  };
  
  // Save question
  const handleSaveQuestion = () => {
    if (!currentQuestion.text) {
      alert('Question text is required');
      return;
    }
    
    const newQuestions = [...questions];
    
    if (editingQuestionIndex >= 0) {
      // Edit existing question
      newQuestions[editingQuestionIndex] = currentQuestion;
    } else {
      // Add new question
      newQuestions.push(currentQuestion);
    }
    
    setQuestions(newQuestions);
    setOpenQuestionDialog(false);
  };
  
  // Update question field
  const handleQuestionChange = (e) => {
    const { name, value } = e.target;
    setCurrentQuestion({
      ...currentQuestion,
      [name]: value
    });
  };
  
  // Update option
  const handleOptionChange = (index, e) => {
    const { name, value } = e.target;
    const newOptions = [...currentQuestion.options];
    newOptions[index] = {
      ...newOptions[index],
      [name]: value
    };
    
    setCurrentQuestion({
      ...currentQuestion,
      options: newOptions
    });
  };
  
  // Set correct option
  const handleSetCorrect = (index) => {
    const newOptions = currentQuestion.options.map((option, i) => ({
      ...option,
      correct: i === index
    }));
    
    setCurrentQuestion({
      ...currentQuestion,
      options: newOptions
    });
  };
  
  // Add option
  const handleAddOption = () => {
    const newOptions = [...currentQuestion.options];
    newOptions.push({ text: `Option ${newOptions.length + 1}`, correct: false });
    
    setCurrentQuestion({
      ...currentQuestion,
      options: newOptions
    });
  };
  
  // Delete option
  const handleDeleteOption = (index) => {
    if (currentQuestion.options.length <= 2) {
      alert('A question must have at least 2 options');
      return;
    }
    
    const newOptions = [...currentQuestion.options];
    newOptions.splice(index, 1);
    
    // If we deleted the correct option, set the first one as correct
    if (currentQuestion.options[index].correct) {
      newOptions[0].correct = true;
    }
    
    setCurrentQuestion({
      ...currentQuestion,
      options: newOptions
    });
  };
  
  // AI Generate questions
  const handleAIGenerate = () => {
    // Placeholder for AI generation
    alert('AI question generation is not implemented yet');
  };
  
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper elevation={2} sx={{ p: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4">
            Configure {assessmentType === 'PRE_ASSESSMENT' ? 'Pre' : 'Post'}-Assessment: {moduleTitle}
          </Typography>
          <Box>
            <Button 
              variant="contained" 
              color="primary" 
              startIcon={<SaveIcon />}
              onClick={handleSave}
              disabled={loading}
              sx={{ mr: 1 }}
            >
              {loading ? <CircularProgress size={24} /> : 'Save'}
            </Button>
            <Button 
              variant="outlined"
              startIcon={<CancelIcon />}
              onClick={onCancel}
              disabled={loading}
            >
              Cancel
            </Button>
          </Box>
        </Box>
        
        <Button
          variant="text"
          startIcon={<ArrowBackIcon />}
          onClick={onCancel}
          sx={{ mb: 3 }}
        >
          Back to Module
        </Button>
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert severity="success" sx={{ mb: 3 }}>
            {success}
          </Alert>
        )}
        
        {/* Assessment Settings */}
        <Box mb={4}>
          <Typography variant="h6" gutterBottom>Assessment Settings</Typography>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Title"
                name="title"
                value={assessmentData.title}
                onChange={handleSettingChange}
                required
                disabled={loading}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                name="description"
                value={assessmentData.description}
                onChange={handleSettingChange}
                multiline
                rows={2}
                disabled={loading}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Time Limit"
                name="timeLimit"
                type="number"
                value={assessmentData.timeLimit}
                onChange={handleSettingChange}
                InputProps={{
                  endAdornment: <InputAdornment position="end">minutes</InputAdornment>,
                }}
                disabled={loading}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Passing Score"
                name="passingScore"
                type="number"
                value={assessmentData.passingScore}
                onChange={handleSettingChange}
                InputProps={{
                  endAdornment: <InputAdornment position="end">%</InputAdornment>,
                }}
                disabled={loading}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={assessmentData.randomizeQuestions}
                    onChange={handleSettingChange}
                    name="randomizeQuestions"
                    disabled={loading}
                  />
                }
                label="Randomize Questions"
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={assessmentData.showCorrectAnswers}
                    onChange={handleSettingChange}
                    name="showCorrectAnswers"
                    disabled={loading}
                  />
                }
                label="Show Correct Answers"
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={assessmentData.requiredToAdvance}
                    onChange={handleSettingChange}
                    name="requiredToAdvance"
                    disabled={loading}
                  />
                }
                label="Required to Advance"
              />
            </Grid>
          </Grid>
        </Box>
        
        {/* Questions Section */}
        <Box>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">Questions</Typography>
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={handleAddQuestion}
            >
              Add Question
            </Button>
          </Box>
          
          {questions.length === 0 ? (
            <Box p={3} textAlign="center" border="1px dashed #ccc" borderRadius={1}>
              <Typography color="textSecondary" paragraph>
                No questions yet. Add your first question or use AI to generate questions automatically.
              </Typography>
              <Button
                variant="outlined"
                startIcon={<AIIcon />}
                onClick={handleAIGenerate}
              >
                AI Generate Questions
              </Button>
            </Box>
          ) : (
            <List>
              {questions.map((question, index) => (
                <ListItem key={index} divider={index < questions.length - 1} sx={{ px: 0 }}>
                  <Card variant="outlined" sx={{ width: '100%' }}>
                    <CardContent>
                      <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                        <Box>
                          <Typography variant="subtitle1" fontWeight="bold">
                            {index + 1}. {question.text}
                          </Typography>
                          <Typography variant="body2" color="textSecondary" gutterBottom>
                            Type: {question.type === 'MULTIPLE_CHOICE' ? 'Multiple Choice' : 'True/False'} 
                            &nbsp;• Points: {question.points}
                          </Typography>
                          
                          <List dense disablePadding sx={{ pl: 2 }}>
                            {question.options.map((option, optIdx) => (
                              <ListItem key={optIdx} disablePadding>
                                <Typography 
                                  variant="body2" 
                                  color={option.correct ? 'success.main' : 'text.primary'}
                                >
                                  {option.correct && '✓ '}{option.text}
                                </Typography>
                              </ListItem>
                            ))}
                          </List>
                        </Box>
                        <Box>
                          <IconButton onClick={() => handleEditQuestion(index)}>
                            <EditIcon />
                          </IconButton>
                          <IconButton onClick={() => handleDeleteQuestion(index)}>
                            <DeleteIcon />
                          </IconButton>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </ListItem>
              ))}
            </List>
          )}
        </Box>
      </Paper>
      
      {/* Question Dialog */}
      <Dialog 
        open={openQuestionDialog} 
        onClose={handleCloseQuestionDialog}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>
          {editingQuestionIndex >= 0 ? 'Edit Question' : 'Add Question'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 0 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Question Text"
                name="text"
                value={currentQuestion?.text || ''}
                onChange={handleQuestionChange}
                multiline
                rows={2}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Question Type</InputLabel>
                <Select
                  name="type"
                  value={currentQuestion?.type || 'MULTIPLE_CHOICE'}
                  onChange={handleQuestionChange}
                  label="Question Type"
                >
                  <MenuItem value="MULTIPLE_CHOICE">Multiple Choice</MenuItem>
                  <MenuItem value="TRUE_FALSE">True/False</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Points"
                name="points"
                type="number"
                value={currentQuestion?.points || 1}
                onChange={handleQuestionChange}
                inputProps={{ min: 1 }}
              />
            </Grid>
            
            {/* Options Section */}
            {currentQuestion && currentQuestion.type === 'MULTIPLE_CHOICE' && (
              <Grid item xs={12}>
                <Box sx={{ mb: 1 }}>
                  <Typography variant="subtitle1">Answer Options</Typography>
                  <Typography variant="body2" color="textSecondary">
                    Select the correct answer
                  </Typography>
                </Box>
                
                <FormControl component="fieldset" fullWidth>
                  <RadioGroup>
                    {currentQuestion.options.map((option, index) => (
                      <Box key={index} display="flex" alignItems="center" mb={1}>
                        <Radio
                          checked={option.correct}
                          onChange={() => handleSetCorrect(index)}
                        />
                        <TextField
                          fullWidth
                          label={`Option ${index + 1}`}
                          name="text"
                          value={option.text}
                          onChange={(e) => handleOptionChange(index, e)}
                          size="small"
                          sx={{ mx: 1 }}
                        />
                        <IconButton onClick={() => handleDeleteOption(index)}>
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    ))}
                  </RadioGroup>
                </FormControl>
                
                <Button
                  startIcon={<AddIcon />}
                  onClick={handleAddOption}
                  sx={{ mt: 1 }}
                >
                  Add Option
                </Button>
              </Grid>
            )}
            
            {/* True/False Options */}
            {currentQuestion && currentQuestion.type === 'TRUE_FALSE' && (
              <Grid item xs={12}>
                <Box sx={{ mb: 1 }}>
                  <Typography variant="subtitle1">Correct Answer</Typography>
                </Box>
                
                <FormControl component="fieldset">
                  <RadioGroup row>
                    <FormControlLabel
                      value="true"
                      control={
                        <Radio
                          checked={currentQuestion.options[0]?.correct}
                          onChange={() => {
                            setCurrentQuestion({
                              ...currentQuestion,
                              options: [
                                { text: 'True', correct: true },
                                { text: 'False', correct: false }
                              ]
                            });
                          }}
                        />
                      }
                      label="True"
                    />
                    <FormControlLabel
                      value="false"
                      control={
                        <Radio
                          checked={currentQuestion.options[1]?.correct}
                          onChange={() => {
                            setCurrentQuestion({
                              ...currentQuestion,
                              options: [
                                { text: 'True', correct: false },
                                { text: 'False', correct: true }
                              ]
                            });
                          }}
                        />
                      }
                      label="False"
                    />
                  </RadioGroup>
                </FormControl>
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseQuestionDialog}>Cancel</Button>
          <Button 
            onClick={handleSaveQuestion}
            variant="contained"
          >
            Save Question
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AssessmentCreator;