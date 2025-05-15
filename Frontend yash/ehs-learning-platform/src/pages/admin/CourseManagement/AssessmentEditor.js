import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Button,
  Container,
  Grid,
  Typography,
  CircularProgress,
  Paper,
  Divider,
  Alert,
  Snackbar,
  Card,
  CardContent,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  FormHelperText,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Radio,
  RadioGroup,
  Checkbox,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Tooltip,
  Chip
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  DragIndicator as DragIcon,
  Quiz as QuizIcon,
  Save as SaveIcon,
  Check as CheckIcon,
  Clear as ClearIcon
} from '@mui/icons-material';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import AdminLayout from '../../../components/layout/AdminLayout';
import api from '../../../services/api';
import { useNavigate, useParams } from 'react-router-dom';

const QuestionTypes = {
  MULTIPLE_CHOICE: 'MULTIPLE_CHOICE',
  TRUE_FALSE: 'TRUE_FALSE'
};

const AssessmentEditor = () => {
  const navigate = useNavigate();
  const { componentId } = useParams();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  
  const [component, setComponent] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [showAddQuestion, setShowAddQuestion] = useState(false);
  const [questionForm, setQuestionForm] = useState({
    text: '',
    type: QuestionTypes.MULTIPLE_CHOICE,
    points: 1,
    answers: [
      { text: '', isCorrect: false },
      { text: '', isCorrect: false },
      { text: '', isCorrect: false },
      { text: '', isCorrect: false }
    ]
  });
  const [questionFormErrors, setQuestionFormErrors] = useState({});
  const [editingQuestionId, setEditingQuestionId] = useState(null);
  
  // Load component and questions
  const fetchComponentData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Get component details
      const componentResponse = await api.get(`/api/modules/components/${componentId}`);
      setComponent(componentResponse.data);
      
      // Get questions
      const questionsResponse = await api.get(`/api/modules/components/${componentId}/questions`);
      setQuestions(questionsResponse.data);
      
      setError(null);
    } catch (err) {
      console.error('Error fetching assessment data:', err);
      setError('Failed to load assessment data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [componentId]);
  
  useEffect(() => {
    fetchComponentData();
  }, [fetchComponentData]);
  
  const handleQuestionInputChange = (e) => {
    const { name, value } = e.target;
    setQuestionForm({
      ...questionForm,
      [name]: value
    });
    
    // Clear validation error when field is updated
    if (questionFormErrors[name]) {
      setQuestionFormErrors({
        ...questionFormErrors,
        [name]: null
      });
    }
  };
  
  const handleAnswerTextChange = (index, value) => {
    const updatedAnswers = [...questionForm.answers];
    updatedAnswers[index] = {
      ...updatedAnswers[index],
      text: value
    };
    
    setQuestionForm({
      ...questionForm,
      answers: updatedAnswers
    });
  };
  
  const handleAnswerCorrectChange = (index, value) => {
    const updatedAnswers = [...questionForm.answers];
    
    // For TRUE_FALSE, only one answer can be correct
    if (questionForm.type === QuestionTypes.TRUE_FALSE) {
      updatedAnswers.forEach((answer, i) => {
        updatedAnswers[i] = {
          ...answer,
          isCorrect: i === index
        };
      });
    } else {
      updatedAnswers[index] = {
        ...updatedAnswers[index],
        isCorrect: value
      };
    }
    
    setQuestionForm({
      ...questionForm,
      answers: updatedAnswers
    });
  };
  
  const handleQuestionTypeChange = (e) => {
    const newType = e.target.value;
    
    // Reset answers based on question type
    let newAnswers;
    
    if (newType === QuestionTypes.TRUE_FALSE) {
      newAnswers = [
        { text: 'True', isCorrect: false },
        { text: 'False', isCorrect: false }
      ];
    } else {
      // Keep existing answers if switching from TRUE_FALSE to MULTIPLE_CHOICE
      // But ensure we have at least 2 answers
      if (questionForm.answers.length < 2) {
        newAnswers = [
          { text: '', isCorrect: false },
          { text: '', isCorrect: false },
          { text: '', isCorrect: false },
          { text: '', isCorrect: false }
        ];
      } else {
        newAnswers = questionForm.answers;
      }
    }
    
    setQuestionForm({
      ...questionForm,
      type: newType,
      answers: newAnswers
    });
  };
  
  const addAnswerOption = () => {
    if (questionForm.type !== QuestionTypes.MULTIPLE_CHOICE) {
      return;
    }
    
    setQuestionForm({
      ...questionForm,
      answers: [...questionForm.answers, { text: '', isCorrect: false }]
    });
  };
  
  const removeAnswerOption = (index) => {
    if (questionForm.answers.length <= 2) {
      return; // Maintain at least 2 options
    }
    
    const updatedAnswers = [...questionForm.answers];
    updatedAnswers.splice(index, 1);
    
    setQuestionForm({
      ...questionForm,
      answers: updatedAnswers
    });
  };
  
  const validateQuestionForm = () => {
    const errors = {};
    
    if (!questionForm.text.trim()) {
      errors.text = 'Question text is required';
    }
    
    if (questionForm.points <= 0) {
      errors.points = 'Points must be greater than 0';
    }
    
    // Validate answers
    let hasEmptyAnswer = false;
    let hasCorrectAnswer = false;
    
    for (const answer of questionForm.answers) {
      if (!answer.text.trim()) {
        hasEmptyAnswer = true;
      }
      if (answer.isCorrect) {
        hasCorrectAnswer = true;
      }
    }
    
    if (hasEmptyAnswer) {
      errors.answers = 'All answer options must have text';
    }
    
    if (!hasCorrectAnswer) {
      if (errors.answers) {
        errors.answers += '. At least one answer must be marked as correct';
      } else {
        errors.answers = 'At least one answer must be marked as correct';
      }
    }
    
    setQuestionFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  const resetQuestionForm = () => {
    setQuestionForm({
      text: '',
      type: QuestionTypes.MULTIPLE_CHOICE,
      points: 1,
      answers: [
        { text: '', isCorrect: false },
        { text: '', isCorrect: false },
        { text: '', isCorrect: false },
        { text: '', isCorrect: false }
      ]
    });
    setQuestionFormErrors({});
    setEditingQuestionId(null);
  };
  
  const handleAddQuestion = () => {
    resetQuestionForm();
    setShowAddQuestion(true);
  };
  
  const handleEditQuestion = (question) => {
    // Format the question data for the form
    setQuestionForm({
      text: question.text,
      type: question.type,
      points: question.points || 1,
      answers: question.answers || []
    });
    setEditingQuestionId(question.id);
    setShowAddQuestion(true);
  };
  
  const handleCloseDialog = () => {
    setShowAddQuestion(false);
    resetQuestionForm();
  };
  
  const handleSaveQuestion = async () => {
    if (!validateQuestionForm()) {
      return;
    }
    
    setSaving(true);
    try {
      let response;
      
      if (editingQuestionId) {
        // Update existing question
        const updateData = {
          text: questionForm.text,
          type: questionForm.type,
          points: questionForm.points
        };
        
        response = await api.put(`/api/modules/questions/${editingQuestionId}`, updateData);
        
        // Update answers individually
        for (const answer of questionForm.answers) {
          if (answer.id) {
            // Update existing answer
            await api.put(`/api/modules/answers/${answer.id}`, {
              text: answer.text,
              isCorrect: answer.isCorrect
            });
          } else {
            // Create new answer
            await api.post(`/api/modules/questions/${editingQuestionId}/answers`, {
              text: answer.text,
              isCorrect: answer.isCorrect
            });
          }
        }
        
        // Refresh the data
        await fetchComponentData();
      } else {
        // Create new question with answers
        response = await api.post(`/api/modules/components/${componentId}/questions`, questionForm);
        
        // Add to local state
        setQuestions([...questions, response.data]);
      }
      
      setSuccess(true);
      handleCloseDialog();
    } catch (err) {
      console.error('Error saving question:', err);
      setError(err.response?.data?.message || 'Failed to save question');
    } finally {
      setSaving(false);
    }
  };
  
  const handleDeleteQuestion = async (questionId) => {
    if (window.confirm('Are you sure you want to delete this question? This action cannot be undone.')) {
      try {
        await api.delete(`/api/modules/questions/${questionId}`);
        
        // Update local state
        setQuestions(questions.filter(q => q.id !== questionId));
        setSuccess(true);
      } catch (err) {
        console.error('Error deleting question:', err);
        setError(err.response?.data?.message || 'Failed to delete question');
      }
    }
  };
  
  const handleDragEnd = async (result) => {
    if (!result.destination) {
      return;
    }
    
    // Reorder the questions in the local state
    const reordered = Array.from(questions);
    const [removed] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, removed);
    
    setQuestions(reordered);
    
    // Send the new order to the server
    try {
      await api.put(`/api/modules/components/${componentId}/questions/order`, reordered.map(q => q.id));
    } catch (err) {
      console.error('Error updating question order:', err);
      setError('Failed to save question order');
      // Revert to the original order if the API call fails
      fetchComponentData();
    }
  };
  
  const handleBackToModule = () => {
    // Extract moduleId from component and navigate back
    if (component?.trainingModule?.id) {
      navigate(`/admin/courses/edit/${component.trainingModule.id}`);
    } else {
      navigate('/admin/courses');
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
            <CircularProgress />
          </Box>
        </Container>
      </AdminLayout>
    );
  }

  const isPublished = component?.trainingModule?.status === 'PUBLISHED';

  return (
    <AdminLayout>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Box display="flex" alignItems="center" mb={3}>
              <Button
                startIcon={<ArrowBackIcon />}
                onClick={handleBackToModule}
                sx={{ mr: 2 }}
              >
                Back to Module
              </Button>
              <Typography variant="h4" component="h1">
                {component.type === 'PRE_ASSESSMENT' ? 'Pre-Assessment' : 'Post-Assessment'}: {component.title}
              </Typography>
            </Box>
          </Grid>
          
          {error && (
            <Grid item xs={12}>
              <Alert severity="error">{error}</Alert>
            </Grid>
          )}
          
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, height: '100%' }}>
              <Typography variant="h6" gutterBottom>
                Assessment Details
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Module
                </Typography>
                <Typography variant="body1">
                  {component.trainingModule?.title || 'Unknown Module'}
                </Typography>
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Description
                </Typography>
                <Typography variant="body1">
                  {component.description || 'No description available'}
                </Typography>
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Time Limit
                </Typography>
                <Typography variant="body1">
                  {component.timeLimit || 0} minutes
                </Typography>
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Passing Score
                </Typography>
                <Typography variant="body1">
                  {component.passingScore || 70}%
                </Typography>
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Questions
                </Typography>
                <Typography variant="body1">
                  {questions.length} question{questions.length !== 1 ? 's' : ''}
                </Typography>
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Total Points
                </Typography>
                <Typography variant="body1">
                  {questions.reduce((sum, q) => sum + (q.points || 1), 0)} points
                </Typography>
              </Box>
              
              {isPublished && (
                <Alert severity="warning" sx={{ mt: 3 }}>
                  This module is published. You cannot modify the assessment.
                </Alert>
              )}
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 3 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">
                  Questions
                </Typography>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<AddIcon />}
                  onClick={handleAddQuestion}
                  disabled={isPublished}
                >
                  Add Question
                </Button>
              </Box>
              <Divider sx={{ mb: 3 }} />
              
              {questions.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="body1" color="text.secondary" gutterBottom>
                    No questions added yet
                  </Typography>
                  <Button
                    variant="outlined"
                    startIcon={<AddIcon />}
                    onClick={handleAddQuestion}
                    disabled={isPublished}
                    sx={{ mt: 2 }}
                  >
                    Add Your First Question
                  </Button>
                </Box>
              ) : (
                <DragDropContext onDragEnd={handleDragEnd}>
                  <Droppable droppableId="questions">
                    {(provided) => (
                      <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                      >
                        {questions.map((question, index) => (
                          <Draggable
                            key={question.id}
                            draggableId={question.id}
                            index={index}
                            isDragDisabled={isPublished}
                          >
                            {(provided) => (
                              <Card
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                variant="outlined"
                                sx={{ mb: 3, position: 'relative' }}
                              >
                                <CardContent>
                                  <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                                    {!isPublished && (
                                      <Box {...provided.dragHandleProps} sx={{ mr: 1, color: 'text.secondary', mt: 0.5 }}>
                                        <DragIcon />
                                      </Box>
                                    )}
                                    <Box sx={{ flexGrow: 1 }}>
                                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                        <Typography variant="subtitle1" component="div" sx={{ fontWeight: 500 }}>
                                          Question {index + 1}
                                          <Chip
                                            label={question.type === QuestionTypes.MULTIPLE_CHOICE ? 'Multiple Choice' : 'True/False'}
                                            size="small"
                                            color="primary"
                                            sx={{ ml: 1 }}
                                          />
                                          <Chip
                                            label={`${question.points || 1} ${question.points === 1 ? 'point' : 'points'}`}
                                            size="small"
                                            variant="outlined"
                                            sx={{ ml: 1 }}
                                          />
                                        </Typography>
                                        {!isPublished && (
                                          <Box>
                                            <IconButton
                                              size="small"
                                              color="primary"
                                              onClick={() => handleEditQuestion(question)}
                                            >
                                              <EditIcon />
                                            </IconButton>
                                            <IconButton
                                              size="small"
                                              color="error"
                                              onClick={() => handleDeleteQuestion(question.id)}
                                            >
                                              <DeleteIcon />
                                            </IconButton>
                                          </Box>
                                        )}
                                      </Box>
                                      
                                      <Typography variant="body1" sx={{ mb: 2 }}>
                                        {question.text}
                                      </Typography>
                                      
                                      <Typography variant="subtitle2" sx={{ mt: 1, mb: 0.5 }}>
                                        Answer Options:
                                      </Typography>
                                      
                                      <List dense disablePadding>
                                        {question.answers?.map((answer, aIndex) => (
                                          <ListItem key={aIndex} disablePadding sx={{ py: 0.5 }}>
                                            <ListItemIcon sx={{ minWidth: 32 }}>
                                              {answer.isCorrect ? (
                                                <CheckIcon color="success" fontSize="small" />
                                              ) : (
                                                <ClearIcon color="error" fontSize="small" />
                                              )}
                                            </ListItemIcon>
                                            <ListItemText primary={answer.text} />
                                          </ListItem>
                                        ))}
                                      </List>
                                    </Box>
                                  </Box>
                                </CardContent>
                              </Card>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>
              )}
            </Paper>
          </Grid>
        </Grid>
      </Container>
      
      {/* Add/Edit Question Dialog */}
      <Dialog
        open={showAddQuestion}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingQuestionId ? 'Edit Question' : 'Add New Question'}
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={3}>
            <Grid item xs={12} md={9}>
              <TextField
                fullWidth
                required
                label="Question Text"
                name="text"
                value={questionForm.text}
                onChange={handleQuestionInputChange}
                error={!!questionFormErrors.text}
                helperText={questionFormErrors.text}
                multiline
                rows={2}
              />
            </Grid>
            
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                required
                type="number"
                label="Points"
                name="points"
                value={questionForm.points}
                onChange={handleQuestionInputChange}
                InputProps={{ inputProps: { min: 1 } }}
                error={!!questionFormErrors.points}
                helperText={questionFormErrors.points}
              />
            </Grid>
            
            <Grid item xs={12}>
              <FormControl fullWidth required disabled={!!editingQuestionId}>
                <InputLabel>Question Type</InputLabel>
                <Select
                  name="type"
                  value={questionForm.type}
                  onChange={handleQuestionTypeChange}
                  label="Question Type"
                >
                  <MenuItem value={QuestionTypes.MULTIPLE_CHOICE}>Multiple Choice</MenuItem>
                  <MenuItem value={QuestionTypes.TRUE_FALSE}>True/False</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                Answer Options
              </Typography>
              {questionFormErrors.answers && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {questionFormErrors.answers}
                </Alert>
              )}
              
              {questionForm.type === QuestionTypes.TRUE_FALSE ? (
                <RadioGroup
                  value={questionForm.answers.findIndex(a => a.isCorrect) || 0}
                  onChange={(e) => handleAnswerCorrectChange(parseInt(e.target.value, 10), true)}
                >
                  {questionForm.answers.map((answer, index) => (
                    <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Radio
                        value={index}
                        size="small"
                      />
                      <TextField
                        fullWidth
                        required
                        label={index === 0 ? 'True Option' : 'False Option'}
                        value={answer.text}
                        onChange={(e) => handleAnswerTextChange(index, e.target.value)}
                        disabled={questionForm.type === QuestionTypes.TRUE_FALSE}
                        size="small"
                        sx={{ ml: 1 }}
                      />
                    </Box>
                  ))}
                </RadioGroup>
              ) : (
                <>
                  {questionForm.answers.map((answer, index) => (
                    <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={answer.isCorrect}
                            onChange={(e) => handleAnswerCorrectChange(index, e.target.checked)}
                            size="small"
                          />
                        }
                        label=""
                      />
                      <TextField
                        fullWidth
                        required
                        label={`Option ${index + 1}`}
                        value={answer.text}
                        onChange={(e) => handleAnswerTextChange(index, e.target.value)}
                        size="small"
                      />
                      {questionForm.answers.length > 2 && (
                        <IconButton 
                          size="small" 
                          color="error" 
                          onClick={() => removeAnswerOption(index)}
                          sx={{ ml: 1 }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      )}
                    </Box>
                  ))}
                  
                  <Button
                    startIcon={<AddIcon />}
                    onClick={addAnswerOption}
                    variant="outlined"
                    size="small"
                    sx={{ mt: 1 }}
                  >
                    Add Option
                  </Button>
                </>
              )}
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={saving}>
            Cancel
          </Button>
          <Button 
            onClick={handleSaveQuestion} 
            variant="contained" 
            color="primary"
            disabled={saving}
            startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
          >
            {saving ? 'Saving...' : 'Save Question'}
          </Button>
        </DialogActions>
      </Dialog>
      
      <Snackbar
        open={success}
        autoHideDuration={3000}
        onClose={() => setSuccess(false)}
      >
        <Alert severity="success" sx={{ width: '100%' }}>
          Operation completed successfully!
        </Alert>
      </Snackbar>
    </AdminLayout>
  );
};

export default AssessmentEditor;