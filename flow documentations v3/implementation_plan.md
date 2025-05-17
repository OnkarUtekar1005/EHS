# Technical Implementation Plan

## Phase 1: Database Schema & Models (Week 1)

### 1.1 New Database Tables

```sql
-- User Course Progress
CREATE TABLE user_course_progress (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id),
    course_id UUID NOT NULL REFERENCES courses(id),
    overall_progress DECIMAL(5,2) DEFAULT 0.00,
    status VARCHAR(20) DEFAULT 'NOT_STARTED',
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    certificate_id UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, course_id)
);

-- Component Progress
CREATE TABLE component_progress (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id),
    component_id UUID NOT NULL REFERENCES course_components(id),
    course_id UUID NOT NULL REFERENCES courses(id),
    status VARCHAR(20) DEFAULT 'NOT_STARTED',
    score INTEGER,
    attempts INTEGER DEFAULT 0,
    time_spent_seconds BIGINT DEFAULT 0,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    last_accessed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, component_id)
);

-- Assessment Questions
CREATE TABLE assessment_questions (
    id UUID PRIMARY KEY,
    component_id UUID NOT NULL REFERENCES course_components(id),
    question_text TEXT NOT NULL,
    question_type VARCHAR(20) NOT NULL, -- MULTIPLE_CHOICE, TRUE_FALSE
    points INTEGER DEFAULT 1,
    order_index INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Assessment Options
CREATE TABLE assessment_options (
    id UUID PRIMARY KEY,
    question_id UUID NOT NULL REFERENCES assessment_questions(id),
    option_text TEXT NOT NULL,
    is_correct BOOLEAN DEFAULT FALSE,
    order_index INTEGER
);

-- User Assessment Attempts
CREATE TABLE user_assessment_attempts (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id),
    component_id UUID NOT NULL REFERENCES course_components(id),
    attempt_number INTEGER NOT NULL,
    score DECIMAL(5,2),
    passed BOOLEAN,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    answers JSONB, -- Store user's answers
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Certificates
CREATE TABLE certificates (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id),
    course_id UUID NOT NULL REFERENCES courses(id),
    certificate_number VARCHAR(50) UNIQUE NOT NULL,
    issued_date TIMESTAMP NOT NULL,
    expiry_date TIMESTAMP,
    verification_url TEXT,
    status VARCHAR(20) DEFAULT 'ACTIVE',
    file_path TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 1.2 Java Entity Models

```java
// UserCourseProgress.java
@Entity
@Table(name = "user_course_progress")
public class UserCourseProgress {
    @Id
    @GeneratedValue
    private UUID id;
    
    @ManyToOne
    @JoinColumn(name = "user_id")
    private Users user;
    
    @ManyToOne
    @JoinColumn(name = "course_id")
    private Course course;
    
    private BigDecimal overallProgress = BigDecimal.ZERO;
    
    @Enumerated(EnumType.STRING)
    private ProgressStatus status = ProgressStatus.NOT_STARTED;
    
    private LocalDateTime startedAt;
    private LocalDateTime completedAt;
    private UUID certificateId;
    
    // Getters, setters, lifecycle methods
}

// Similar entities for other tables...
```

## Phase 2: Backend Services (Week 1-2)

### 2.1 Progress Tracking Service

```java
@Service
public class ProgressTrackingService {
    
    public UserCourseProgress startCourse(UUID userId, UUID courseId) {
        // Initialize course progress
        // Create component progress records
        // Return progress object
    }
    
    public ComponentProgress startComponent(UUID userId, UUID componentId) {
        // Mark component as started
        // Update timestamps
        // Calculate and update overall progress
    }
    
    public ComponentProgress completeComponent(UUID userId, UUID componentId, Integer score) {
        // Mark component as completed
        // Update score if assessment
        // Recalculate overall progress
        // Check if course is complete
    }
    
    public BigDecimal calculateOverallProgress(UUID userId, UUID courseId) {
        // Get all component progress
        // Apply weights (Pre: 20%, Materials: 50%, Post: 30%)
        // Return calculated percentage
    }
}
```

### 2.2 Assessment Service

```java
@Service
public class AssessmentService {
    
    public AssessmentAttempt startAssessment(UUID userId, UUID componentId) {
        // Create new attempt record
        // Get randomized questions
        // Start timer
        // Return assessment data
    }
    
    public AssessmentResult submitAssessment(UUID attemptId, List<Answer> answers) {
        // Validate answers
        // Calculate score
        // Update progress
        // Determine pass/fail
        // Return result
    }
    
    public List<Question> getAssessmentQuestions(UUID componentId, boolean randomize) {
        // Fetch questions
        // Randomize if needed
        // Include options
        // Return question list
    }
}
```

### 2.3 Certificate Service

```java
@Service
public class CertificateService {
    
    public Certificate generateCertificate(UUID userId, UUID courseId) {
        // Verify course completion
        // Generate unique certificate number
        // Create certificate record
        // Generate PDF
        // Return certificate
    }
    
    public byte[] generateCertificatePDF(Certificate certificate) {
        // Load template
        // Fill user data
        // Add QR code
        // Convert to PDF
        // Return byte array
    }
    
    public boolean verifyCertificate(String certificateNumber) {
        // Lookup certificate
        // Check validity
        // Return verification result
    }
}
```

## Phase 3: REST Controllers (Week 2)

### 3.1 Progress Controller

```java
@RestController
@RequestMapping("/api/v2/user/progress")
public class ProgressController {
    
    @GetMapping("/courses/{courseId}")
    public ResponseEntity<UserCourseProgress> getCourseProgress(
            @PathVariable UUID courseId,
            Authentication auth) {
        // Get user progress for course
    }
    
    @PostMapping("/courses/{courseId}/start")
    public ResponseEntity<UserCourseProgress> startCourse(
            @PathVariable UUID courseId,
            Authentication auth) {
        // Start course tracking
    }
    
    @PostMapping("/components/{componentId}/start")
    public ResponseEntity<ComponentProgress> startComponent(
            @PathVariable UUID componentId,
            Authentication auth) {
        // Start component tracking
    }
    
    @PostMapping("/components/{componentId}/complete")
    public ResponseEntity<ComponentProgress> completeComponent(
            @PathVariable UUID componentId,
            @RequestBody ComponentCompletionRequest request,
            Authentication auth) {
        // Complete component with score
    }
}
```

## Phase 4: Frontend Implementation (Week 2-3)

### 4.1 Assessment Components

```jsx
// AssessmentView.js
const AssessmentView = ({ componentId, type }) => {
    const [questions, setQuestions] = useState([]);
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [answers, setAnswers] = useState({});
    const [timeRemaining, setTimeRemaining] = useState(0);
    
    const loadAssessment = async () => {
        // Fetch questions
        // Initialize timer
        // Set up state
    };
    
    const submitAnswer = (questionId, answer) => {
        // Store answer
        // Move to next question
    };
    
    const submitAssessment = async () => {
        // Submit all answers
        // Get results
        // Update progress
    };
    
    return (
        <AssessmentContainer>
            <ProgressBar value={(currentQuestion + 1) / questions.length * 100} />
            <Timer seconds={timeRemaining} />
            <QuestionDisplay question={questions[currentQuestion]} />
            <AnswerOptions onSelect={submitAnswer} />
            <NavigationButtons />
        </AssessmentContainer>
    );
};
```

### 4.2 Progress Tracking Component

```jsx
// CourseProgress.js
const CourseProgress = ({ courseId }) => {
    const [progress, setProgress] = useState(null);
    
    useEffect(() => {
        fetchProgress();
    }, [courseId]);
    
    const fetchProgress = async () => {
        const response = await progressService.getCourseProgress(courseId);
        setProgress(response.data);
    };
    
    return (
        <Card>
            <Typography variant="h6">Course Progress</Typography>
            <LinearProgress variant="determinate" value={progress?.overallProgress || 0} />
            <Typography>{progress?.overallProgress || 0}% Complete</Typography>
            
            <List>
                {progress?.componentProgress.map(comp => (
                    <ListItem key={comp.id}>
                        <ListItemIcon>
                            {getComponentIcon(comp.type)}
                        </ListItemIcon>
                        <ListItemText 
                            primary={comp.title}
                            secondary={comp.status}
                        />
                        {comp.score && <Typography>{comp.score}%</Typography>}
                    </ListItem>
                ))}
            </List>
        </Card>
    );
};
```

### 4.3 Certificate Component

```jsx
// CertificateView.js
const CertificateView = ({ certificateId }) => {
    const [certificate, setCertificate] = useState(null);
    const [preview, setPreview] = useState(null);
    
    const loadCertificate = async () => {
        const response = await certificateService.getCertificate(certificateId);
        setCertificate(response.data);
        const previewUrl = await certificateService.getPreview(certificateId);
        setPreview(previewUrl);
    };
    
    const downloadCertificate = async () => {
        const blob = await certificateService.download(certificateId);
        // Trigger download
    };
    
    return (
        <Paper>
            <Typography variant="h5">Certificate of Completion</Typography>
            <Box sx={{ my: 2 }}>
                <img src={preview} alt="Certificate Preview" style={{ width: '100%' }} />
            </Box>
            <Button 
                variant="contained" 
                startIcon={<Download />}
                onClick={downloadCertificate}
            >
                Download Certificate
            </Button>
            <QRCode value={certificate?.verificationUrl} />
        </Paper>
    );
};
```

## Phase 5: Integration & Testing (Week 3-4)

### 5.1 Integration Points

1. **Course Component Integration**
   - Update CourseDetail to show progress
   - Add start/resume buttons
   - Show completion status

2. **Material Viewer Integration**
   - Add progress tracking
   - Auto-complete on time spent
   - Update progress on close

3. **Dashboard Integration**
   - Show course progress cards
   - Display certificates
   - Add learning statistics

### 5.2 Testing Strategy

1. **Unit Tests**
   - Service layer tests
   - Progress calculation tests
   - Certificate generation tests

2. **Integration Tests**
   - API endpoint tests
   - Progress flow tests
   - Assessment submission tests

3. **E2E Tests**
   - Complete user journey
   - Assessment flow
   - Certificate download

## Timeline Summary

- **Week 1**: Database schema, entity models, basic services
- **Week 2**: Complete backend services, REST controllers
- **Week 3**: Frontend components, integration
- **Week 4**: Testing, refinement, documentation

## Key Considerations

1. **Performance**
   - Cache progress calculations
   - Optimize assessment loading
   - Batch progress updates

2. **Security**
   - Validate assessment submissions
   - Prevent cheating (time limits, single submission)
   - Secure certificate generation

3. **User Experience**
   - Smooth progress updates
   - Clear feedback on actions
   - Intuitive navigation

4. **Data Integrity**
   - Transaction management for progress updates
   - Prevent duplicate submissions
   - Handle concurrent access