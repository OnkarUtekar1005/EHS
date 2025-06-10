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
      questions: []
    }
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (component) {
      // Process the component data to ensure options are in the right format
      const processedComponent = {
        ...component,
        data: {
          ...component.data,
          questions: component.data.questions?.map(q => {
            if (q.type === 'MCQ' && q.options) {
              // Convert options from object format to string format for form display
              return {
                ...q,
                options: q.options.map(opt =>
                  typeof opt === 'object' ? opt.text : opt
                ),
                // Ensure correctAnswer is set properly
                correctAnswer: q.correctAnswer || ''
              };
            }
            return q;
          }) || []
        }
      };
      setFormData(processedComponent);
    } else {
      setFormData({
        type: type,
        required: true,
        data: {
          title: '',
          passingScore: 70,
          timeLimit: 30,
          shuffleQuestions: false,
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
    const question = updatedQuestions[questionIndex];
    const options = [...(question.options || [])];

    // Get the old option value to check if it was the correct answer
    const oldOptionValue = typeof options[optionIndex] === 'object' ? options[optionIndex].text : options[optionIndex];

    // Handle both string and object options
    if (typeof options[optionIndex] === 'object' && options[optionIndex] !== null) {
      options[optionIndex] = { ...options[optionIndex], text: value };
    } else {
      options[optionIndex] = value;
    }

    question.options = options;

    // If this option was the correct answer AND it wasn't empty, update the correct answer to the new value
    if (question.correctAnswer && question.correctAnswer === oldOptionValue) {
      question.correctAnswer = value;
    }

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
      // Transform the questions data to the expected format
      const transformedQuestions = formData.data.questions.map(q => {
        const transformedQuestion = {
          id: q.id || `q${Date.now()}_${Math.random()}`,
          question: q.question,
          type: q.type,
          points: q.points || 10,
          required: q.required !== false,
          explanation: q.explanation || ''
        };

        if (q.type === 'MCQ') {
          // Transform options to objects with id and text
          transformedQuestion.options = q.options.map((option, index) => {
            const optionText = typeof option === 'object' ? option.text : option;
            return {
              id: `opt${Date.now()}_${index}_${Math.random()}`,
              text: optionText,
              isCorrect: optionText === q.correctAnswer
            };
          });
          transformedQuestion.correctAnswer = q.correctAnswer;
        } else if (q.type === 'TRUE_FALSE') {
          transformedQuestion.correctAnswer = q.correctAnswer;
        }

        return transformedQuestion;
      });

      // Add orderIndex if not present
      const dataToSave = {
        ...formData,
        orderIndex: formData.orderIndex || null,
        data: {
          ...formData.data,
          questions: transformedQuestions
        }
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
          </Box>

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
                    {question.options.map((option, oIndex) => {
                      const optionText = typeof option === 'object' ? option.text : option;
                      const isChecked = question.correctAnswer && question.correctAnswer === optionText;

                      return (
                        <Box key={oIndex} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <Radio
                            checked={isChecked}
                            onChange={() => {
                              // Only set as correct answer if the option has text
                              const currentText = typeof option === 'object' ? option.text : option;
                              if (currentText || optionText) {
                                handleQuestionChange(qIndex, 'correctAnswer', currentText || optionText);
                              }
                            }}
                            value={optionText}
                          />
                          <TextField
                            fullWidth
                            size="small"
                            value={optionText}
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
                      );
                    })}
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
                    value={String(question.correctAnswer)}
                    onChange={(e) => handleQuestionChange(qIndex, 'correctAnswer', e.target.value)}
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