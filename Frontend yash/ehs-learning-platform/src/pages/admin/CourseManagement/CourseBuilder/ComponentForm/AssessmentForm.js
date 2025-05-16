import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  IconButton,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  Checkbox,
  Divider,
  Switch,
  Grid
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Close as CloseIcon
} from '@mui/icons-material';

const AssessmentForm = ({ open, onClose, onSave, component, type }) => {
  const [formData, setFormData] = useState({
    type: type,
    required: true,
    data: {
      title: '',
      passingScore: 70,
      timeLimit: 30,
      shuffleQuestions: false,
      showResults: true,
      allowRetake: true,
      maxAttempts: 3,
      questions: []
    }
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (component) {
      setFormData(component);
    } else {
      setFormData({
        type: type,
        required: true,
        data: {
          title: '',
          passingScore: 70,
          timeLimit: 30,
          shuffleQuestions: false,
          showResults: true,
          allowRetake: true,
          maxAttempts: 3,
          questions: []
        }
      });
    }
  }, [component, type]);

  const handleQuestionChange = (index, field, value) => {
    const updatedQuestions = [...formData.data.questions];
    updatedQuestions[index] = {
      ...updatedQuestions[index],
      [field]: value
    };
    setFormData(prev => ({
      ...prev,
      data: {
        ...prev.data,
        questions: updatedQuestions
      }
    }));
  };

  const handleOptionChange = (questionIndex, optionIndex, value) => {
    const updatedQuestions = [...formData.data.questions];
    const options = [...(updatedQuestions[questionIndex].options || [])];
    options[optionIndex] = value;
    updatedQuestions[questionIndex].options = options;
    setFormData(prev => ({
      ...prev,
      data: {
        ...prev.data,
        questions: updatedQuestions
      }
    }));
  };

  const addQuestion = () => {
    const newQuestion = {
      id: `q${Date.now()}`,
      question: '',
      type: 'MCQ',
      points: 10,
      required: true,
      options: ['', '', '', ''],
      correctAnswer: '',
      explanation: ''
    };
    setFormData(prev => ({
      ...prev,
      data: {
        ...prev.data,
        questions: [...prev.data.questions, newQuestion]
      }
    }));
  };

  const removeQuestion = (index) => {
    const updatedQuestions = formData.data.questions.filter((_, i) => i !== index);
    setFormData(prev => ({
      ...prev,
      data: {
        ...prev.data,
        questions: updatedQuestions
      }
    }));
  };

  const addOption = (questionIndex) => {
    const updatedQuestions = [...formData.data.questions];
    const question = updatedQuestions[questionIndex];
    question.options = [...(question.options || []), ''];
    setFormData(prev => ({
      ...prev,
      data: {
        ...prev.data,
        questions: updatedQuestions
      }
    }));
  };

  const removeOption = (questionIndex, optionIndex) => {
    const updatedQuestions = [...formData.data.questions];
    const question = updatedQuestions[questionIndex];
    question.options = question.options.filter((_, i) => i !== optionIndex);
    setFormData(prev => ({
      ...prev,
      data: {
        ...prev.data,
        questions: updatedQuestions
      }
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.data.title.trim()) {
      newErrors.title = 'Assessment title is required';
    }
    
    if (!formData.data.questions || formData.data.questions.length === 0) {
      newErrors.questions = 'At least one question is required';
    } else {
      formData.data.questions.forEach((question, index) => {
        if (!question.question.trim()) {
          newErrors[`question_${index}`] = 'Question text is required';
        }
        if (question.type === 'MCQ') {
          if (!question.options || question.options.filter(opt => opt.trim()).length < 2) {
            newErrors[`options_${index}`] = 'At least 2 options are required';
          }
          if (!question.correctAnswer) {
            newErrors[`answer_${index}`] = 'Correct answer is required';
          }
        }
        if (question.type === 'TRUE_FALSE' && question.correctAnswer === undefined) {
          newErrors[`answer_${index}`] = 'Correct answer is required';
        }
      });
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      // Add orderIndex if not present
      const dataToSave = {
        ...formData,
        orderIndex: formData.orderIndex || null
      };
      console.log('Assessment form data being saved:', dataToSave);
      onSave(dataToSave);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {component ? 'Edit' : 'Add'} {type === 'PRE_ASSESSMENT' ? 'Pre-Assessment' : 'Post-Assessment'}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          {/* Assessment Settings */}
          <TextField
            fullWidth
            label="Assessment Title"
            value={formData.data.title}
            onChange={(e) => setFormData(prev => ({
              ...prev,
              data: { ...prev.data, title: e.target.value }
            }))}
            error={!!errors.title}
            helperText={errors.title}
            sx={{ mb: 2 }}
          />

          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <TextField
              label="Passing Score (%)"
              type="number"
              value={formData.data.passingScore}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                data: { ...prev.data, passingScore: parseInt(e.target.value) || 0 }
              }))}
              InputProps={{ inputProps: { min: 0, max: 100 } }}
              sx={{ width: '50%' }}
            />
            <TextField
              label="Time Limit (minutes)"
              type="number"
              value={formData.data.timeLimit}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                data: { ...prev.data, timeLimit: parseInt(e.target.value) || 0 }
              }))}
              InputProps={{ inputProps: { min: 0 } }}
              sx={{ width: '50%' }}
            />
          </Box>

          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.required}
                  onChange={(e) => setFormData(prev => ({ ...prev, required: e.target.checked }))}
                />
              }
              label="Required Component"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={formData.data.showResults}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    data: { ...prev.data, showResults: e.target.checked }
                  }))}
                />
              }
              label="Show Results After Submission"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={formData.data.allowRetake}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    data: { ...prev.data, allowRetake: e.target.checked }
                  }))}
                />
              }
              label="Allow Retakes"
            />
          </Box>

          {formData.data.allowRetake && (
            <TextField
              label="Maximum Attempts"
              type="number"
              value={formData.data.maxAttempts}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                data: { ...prev.data, maxAttempts: parseInt(e.target.value) || 1 }
              }))}
              InputProps={{ inputProps: { min: 1 } }}
              sx={{ mb: 2, width: 200 }}
            />
          )}

          <Divider sx={{ my: 2 }} />

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Questions</Typography>
            <Button
              startIcon={<AddIcon />}
              variant="outlined"
              size="small"
              onClick={addQuestion}
            >
              Add Question
            </Button>
          </Box>

          {errors.questions && (
            <Typography color="error" variant="body2" sx={{ mb: 2 }}>
              {errors.questions}
            </Typography>
          )}

          {formData.data.questions.map((question, qIndex) => (
            <Box key={qIndex} sx={{ mb: 3, p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 2 }}>
                <TextField
                  fullWidth
                  label={`Question ${qIndex + 1}`}
                  value={question.question}
                  onChange={(e) => handleQuestionChange(qIndex, 'question', e.target.value)}
                  error={!!errors[`question_${qIndex}`]}
                  helperText={errors[`question_${qIndex}`]}
                  multiline
                  rows={2}
                />
                <IconButton
                  color="error"
                  onClick={() => removeQuestion(qIndex)}
                  title="Remove question"
                >
                  <DeleteIcon />
                </IconButton>
              </Box>

              <FormControl sx={{ mb: 2 }}>
                <FormLabel>Question Type</FormLabel>
                <RadioGroup
                  row
                  value={question.type}
                  onChange={(e) => handleQuestionChange(qIndex, 'type', e.target.value)}
                >
                  <FormControlLabel value="MCQ" control={<Radio />} label="Multiple Choice" />
                  <FormControlLabel value="TRUE_FALSE" control={<Radio />} label="True/False" />
                </RadioGroup>
              </FormControl>

              {question.type === 'MCQ' && (
                <>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>
                      Options
                      {errors[`options_${qIndex}`] && (
                        <Typography component="span" color="error" variant="body2" sx={{ ml: 1 }}>
                          {errors[`options_${qIndex}`]}
                        </Typography>
                      )}
                    </Typography>
                    {question.options.map((option, oIndex) => (
                      <Box key={oIndex} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Radio
                          checked={question.correctAnswer === option}
                          onChange={() => handleQuestionChange(qIndex, 'correctAnswer', option)}
                          value={option}
                        />
                        <TextField
                          fullWidth
                          size="small"
                          value={option}
                          onChange={(e) => handleOptionChange(qIndex, oIndex, e.target.value)}
                          placeholder={`Option ${oIndex + 1}`}
                        />
                        {question.options.length > 2 && (
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => removeOption(qIndex, oIndex)}
                          >
                            <CloseIcon fontSize="small" />
                          </IconButton>
                        )}
                      </Box>
                    ))}
                    <Button
                      size="small"
                      onClick={() => addOption(qIndex)}
                      sx={{ mt: 1 }}
                    >
                      Add Option
                    </Button>
                  </Box>
                  {errors[`answer_${qIndex}`] && (
                    <Typography color="error" variant="body2">
                      {errors[`answer_${qIndex}`]}
                    </Typography>
                  )}
                </>
              )}

              {question.type === 'TRUE_FALSE' && (
                <FormControl error={!!errors[`answer_${qIndex}`]}>
                  <FormLabel>Correct Answer</FormLabel>
                  <RadioGroup
                    row
                    value={question.correctAnswer}
                    onChange={(e) => handleQuestionChange(qIndex, 'correctAnswer', e.target.value === 'true')}
                  >
                    <FormControlLabel value="true" control={<Radio />} label="True" />
                    <FormControlLabel value="false" control={<Radio />} label="False" />
                  </RadioGroup>
                  {errors[`answer_${qIndex}`] && (
                    <Typography color="error" variant="body2">
                      {errors[`answer_${qIndex}`]}
                    </Typography>
                  )}
                </FormControl>
              )}
            </Box>
          ))}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained">
          {component ? 'Update' : 'Add'} Assessment
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AssessmentForm;