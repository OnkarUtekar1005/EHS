# Assessment Component Flow

## Overview
This document outlines the complete flow for creating, storing, and evaluating assessment components (Pre-Assessment and Post-Assessment) in the EHS E-Learning Platform.

## Data Structure

### Assessment Component Model
```javascript
{
  "id": "UUID",
  "type": "PRE_ASSESSMENT | POST_ASSESSMENT",
  "orderIndex": 1,
  "required": true,
  "data": {
    "title": "Safety Knowledge Pre-Assessment",
    "passingScore": 70, // Percentage required to pass
    "timeLimit": 30, // Minutes allowed for completion
    "shuffleQuestions": true,
    "showResults": true,
    "allowRetake": true,
    "maxAttempts": 3,
    "questions": [
      {
        "id": "q1",
        "question": "What is the primary purpose of PPE?",
        "type": "MCQ",
        "points": 10,
        "required": true,
        "options": [
          {
            "id": "opt1",
            "text": "To look professional",
            "isCorrect": false
          },
          {
            "id": "opt2",
            "text": "To protect workers from hazards",
            "isCorrect": true
          },
          {
            "id": "opt3",
            "text": "To comply with regulations",
            "isCorrect": false
          },
          {
            "id": "opt4",
            "text": "To increase productivity",
            "isCorrect": false
          }
        ],
        "explanation": "PPE's primary purpose is to protect workers from workplace hazards."
      },
      {
        "id": "q2",
        "question": "Hard hats are required in construction zones",
        "type": "TRUE_FALSE",
        "points": 5,
        "required": true,
        "correctAnswer": true,
        "explanation": "Hard hats are mandatory PPE in construction zones to protect from falling objects."
      }
    ]
  }
}
```

## Database Schema Updates

### course_components table
```sql
CREATE TABLE course_components (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL REFERENCES courses(id),
    type VARCHAR(50) NOT NULL,
    order_index INTEGER NOT NULL,
    required BOOLEAN DEFAULT false,
    data JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for better performance
CREATE INDEX idx_course_components_course_id ON course_components(course_id);
CREATE INDEX idx_course_components_type ON course_components(type);
```

### assessment_results table
```sql
CREATE TABLE assessment_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    course_id UUID NOT NULL REFERENCES courses(id),
    component_id UUID NOT NULL REFERENCES course_components(id),
    attempt_number INTEGER NOT NULL DEFAULT 1,
    score DECIMAL(5,2) NOT NULL,
    total_points INTEGER NOT NULL,
    earned_points INTEGER NOT NULL,
    passed BOOLEAN NOT NULL,
    started_at TIMESTAMP NOT NULL,
    completed_at TIMESTAMP NOT NULL,
    time_spent INTEGER NOT NULL, -- in seconds
    answers JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_assessment_results_user_course ON assessment_results(user_id, course_id);
CREATE INDEX idx_assessment_results_component ON assessment_results(component_id);
```

## API Endpoints

### Backend Updates

#### 1. Create Assessment Component
```java
@PostMapping("/{courseId}/assessment")
public ResponseEntity<?> createAssessment(
    @PathVariable UUID courseId,
    @RequestBody AssessmentRequest request
) {
    // Validate assessment data structure
    validateAssessmentData(request);
    
    CourseComponent component = new CourseComponent();
    component.setType(request.getType());
    component.setRequired(request.isRequired());
    component.setData(convertToJsonData(request));
    
    CourseComponent saved = componentService.addComponent(courseId, component);
    return ResponseEntity.ok(new ComponentResponse(saved));
}
```

#### 2. Validate Assessment Data
```java
private void validateAssessmentData(AssessmentRequest request) {
    if (request.getQuestions().isEmpty()) {
        throw new ValidationException("Assessment must have at least one question");
    }
    
    int totalPoints = 0;
    for (Question question : request.getQuestions()) {
        if (question.getPoints() <= 0) {
            throw new ValidationException("Each question must have positive points");
        }
        totalPoints += question.getPoints();
        
        if (question.getType() == QuestionType.MCQ) {
            if (question.getOptions().size() < 2) {
                throw new ValidationException("MCQ must have at least 2 options");
            }
            
            long correctCount = question.getOptions().stream()
                .filter(Option::isCorrect)
                .count();
                
            if (correctCount != 1) {
                throw new ValidationException("MCQ must have exactly one correct answer");
            }
        }
    }
    
    if (request.getPassingScore() < 0 || request.getPassingScore() > 100) {
        throw new ValidationException("Passing score must be between 0 and 100");
    }
}
```

#### 3. Submit Assessment Attempt
```java
@PostMapping("/{courseId}/assessment/{componentId}/submit")
public ResponseEntity<?> submitAssessment(
    @PathVariable UUID courseId,
    @PathVariable UUID componentId,
    @RequestBody AssessmentSubmission submission,
    @AuthenticationPrincipal UserDetails userDetails
) {
    // Get the assessment component
    CourseComponent component = componentService.getComponent(componentId);
    
    // Validate submission
    validateSubmission(component, submission);
    
    // Calculate results
    AssessmentResult result = assessmentService.evaluateSubmission(
        component, 
        submission, 
        userDetails.getId()
    );
    
    // Save result
    AssessmentResult savedResult = assessmentService.saveResult(result);
    
    // Update course progress if applicable
    courseService.updateProgress(courseId, userDetails.getId(), savedResult);
    
    return ResponseEntity.ok(new AssessmentResultResponse(savedResult));
}
```

## Frontend Implementation

### Enhanced AssessmentForm Component
```javascript
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

  const addQuestion = () => {
    const newQuestion = {
      id: `q${Date.now()}`,
      question: '',
      type: 'MCQ',
      points: 10,
      required: true,
      options: [
        { id: `opt1_${Date.now()}`, text: '', isCorrect: false },
        { id: `opt2_${Date.now()}`, text: '', isCorrect: false },
        { id: `opt3_${Date.now()}`, text: '', isCorrect: false },
        { id: `opt4_${Date.now()}`, text: '', isCorrect: false }
      ],
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

  const handleSave = () => {
    if (validateAssessment()) {
      console.log('Saving assessment:', formData);
      onSave(formData);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        {component ? 'Edit' : 'Add'} {type === 'PRE_ASSESSMENT' ? 'Pre-Assessment' : 'Post-Assessment'}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          {/* Basic Settings */}
          <Typography variant="h6" gutterBottom>Assessment Settings</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Assessment Title"
                value={formData.data.title}
                onChange={(e) => handleFieldChange('title', e.target.value)}
                required
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Passing Score (%)"
                type="number"
                value={formData.data.passingScore}
                onChange={(e) => handleFieldChange('passingScore', parseInt(e.target.value))}
                InputProps={{ inputProps: { min: 0, max: 100 } }}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Time Limit (minutes)"
                type="number"
                value={formData.data.timeLimit}
                onChange={(e) => handleFieldChange('timeLimit', parseInt(e.target.value))}
                InputProps={{ inputProps: { min: 0 } }}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.data.allowRetake}
                    onChange={(e) => handleFieldChange('allowRetake', e.target.checked)}
                  />
                }
                label="Allow Retakes"
              />
              {formData.data.allowRetake && (
                <TextField
                  label="Maximum Attempts"
                  type="number"
                  value={formData.data.maxAttempts}
                  onChange={(e) => handleFieldChange('maxAttempts', parseInt(e.target.value))}
                  InputProps={{ inputProps: { min: 1 } }}
                  sx={{ ml: 2 }}
                />
              )}
            </Grid>
          </Grid>

          {/* Questions Section */}
          <Box sx={{ mt: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Questions</Typography>
              <Button
                startIcon={<AddIcon />}
                variant="outlined"
                onClick={addQuestion}
              >
                Add Question
              </Button>
            </Box>

            {formData.data.questions.map((question, qIndex) => (
              <QuestionCard
                key={question.id}
                question={question}
                index={qIndex}
                onUpdate={(updatedQuestion) => updateQuestion(qIndex, updatedQuestion)}
                onDelete={() => deleteQuestion(qIndex)}
              />
            ))}
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} variant="contained">
          Save Assessment
        </Button>
      </DialogActions>
    </Dialog>
  );
};
```

## User Experience Flow

### Taking an Assessment

1. **Start Assessment**
   - User clicks on assessment component
   - System checks attempt history
   - If allowed, creates new attempt record
   - Starts timer if time limit is set

2. **Answer Questions**
   - Questions displayed (shuffled if enabled)
   - User selects answers
   - Progress saved periodically (draft)

3. **Submit Assessment**
   - User submits answers
   - System calculates score
   - Results displayed (if enabled)
   - Progress updated

4. **View Results**
   - Score and pass/fail status
   - Correct answers (if enabled)
   - Explanations for questions
   - Retake option (if allowed)

## Course Completion Logic

### Course Passing Criteria
```javascript
function evaluateCourseCompletion(courseId, userId) {
  const courseProgress = getCourseProgress(courseId, userId);
  const course = getCourse(courseId);
  
  // Check all required components
  const requiredComponents = course.components.filter(c => c.required);
  const completedRequired = requiredComponents.every(component => {
    const progress = courseProgress.componentProgress[component.id];
    
    if (component.type === 'POST_ASSESSMENT') {
      // Must pass the post-assessment
      return progress?.passed === true;
    } else if (component.type === 'PRE_ASSESSMENT') {
      // Pre-assessment completion is enough (pass not required)
      return progress?.completed === true;
    } else {
      // Other components just need completion
      return progress?.completed === true;
    }
  });
  
  // Course is passed if:
  // 1. All required components are completed
  // 2. Post-assessment is passed (if exists and required)
  const postAssessment = requiredComponents.find(c => c.type === 'POST_ASSESSMENT');
  if (postAssessment) {
    const postProgress = courseProgress.componentProgress[postAssessment.id];
    return completedRequired && postProgress?.passed === true;
  }
  
  return completedRequired;
}
```

## Implementation Steps

1. **Update Backend Models**
   - Enhance CourseComponent entity
   - Create AssessmentResult entity
   - Add validation methods

2. **Create Service Layer**
   - AssessmentService for evaluation logic
   - ResultService for storing attempts
   - ProgressService for course completion

3. **Update Controllers**
   - Enhanced component endpoints
   - Assessment submission endpoint
   - Results retrieval endpoint

4. **Frontend Components**
   - Enhanced AssessmentForm
   - AssessmentTaker component
   - ResultsViewer component
   - ProgressTracker component

5. **Testing**
   - Unit tests for scoring logic
   - Integration tests for submission flow
   - E2E tests for user experience

## Security Considerations

1. **Attempt Validation**
   - Verify user enrollment
   - Check attempt limits
   - Validate time limits

2. **Data Integrity**
   - Sign submission data
   - Prevent answer tampering
   - Audit attempt history

3. **Result Protection**
   - Secure result storage
   - Access control for viewing
   - Prevent result modification