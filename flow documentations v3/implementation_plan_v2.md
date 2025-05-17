# Implementation Plan v2 - Compatible with Existing Codebase

## Overview
This implementation plan is designed to work seamlessly with the existing EHS platform architecture, utilizing the current patterns and structures already in place.

## Phase 1: Database Schema Extensions (Week 1)

### 1.1 New Tables (Compatible with Existing Structure)

```sql
-- User Course Enrollment/Progress
CREATE TABLE user_course_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    course_id UUID NOT NULL REFERENCES courses(id),
    enrollment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    started_date TIMESTAMP,
    completed_date TIMESTAMP,
    overall_progress DECIMAL(5,2) DEFAULT 0.00,
    status VARCHAR(20) DEFAULT 'ENROLLED', -- ENROLLED, IN_PROGRESS, COMPLETED
    certificate_id UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_user_course UNIQUE(user_id, course_id)
);

-- Component Progress Tracking
CREATE TABLE component_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    component_id UUID NOT NULL REFERENCES course_components(id),
    course_id UUID NOT NULL REFERENCES courses(id),
    status VARCHAR(20) DEFAULT 'NOT_STARTED', -- NOT_STARTED, IN_PROGRESS, COMPLETED, FAILED
    progress_percentage DECIMAL(5,2) DEFAULT 0.00,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    last_accessed_at TIMESTAMP,
    time_spent_seconds BIGINT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_user_component UNIQUE(user_id, component_id)
);

-- Assessment Attempts (Works with existing component data)
CREATE TABLE assessment_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    component_id UUID NOT NULL REFERENCES course_components(id),
    attempt_number INTEGER DEFAULT 1,
    score DECIMAL(5,2),
    passed BOOLEAN DEFAULT FALSE,
    answers JSONB, -- Store user's answers as JSON
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    submitted_at TIMESTAMP,
    time_taken_seconds BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_user_component_attempt UNIQUE(user_id, component_id, attempt_number)
);

-- Certificates
CREATE TABLE certificates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    course_id UUID NOT NULL REFERENCES courses(id),
    certificate_number VARCHAR(50) UNIQUE NOT NULL,
    issued_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expiry_date TIMESTAMP,
    file_path TEXT,
    verification_code VARCHAR(100) UNIQUE,
    status VARCHAR(20) DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 1.2 Java Entity Models (Following Existing Patterns)

```java
// UserCourseProgress.java
@Entity
@Table(name = "user_course_progress")
public class UserCourseProgress {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private Users user;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "course_id", nullable = false)
    private Course course;
    
    @Column(name = "enrollment_date")
    private LocalDateTime enrollmentDate;
    
    @Column(name = "started_date")
    private LocalDateTime startedDate;
    
    @Column(name = "completed_date")
    private LocalDateTime completedDate;
    
    @Column(name = "overall_progress", precision = 5, scale = 2)
    private BigDecimal overallProgress = BigDecimal.ZERO;
    
    @Enumerated(EnumType.STRING)
    private ProgressStatus status = ProgressStatus.ENROLLED;
    
    @Column(name = "certificate_id")
    private UUID certificateId;
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        enrollmentDate = LocalDateTime.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
    
    // Getters, setters, etc.
}

// ComponentProgress.java
@Entity
@Table(name = "component_progress")
public class ComponentProgress {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private Users user;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "component_id", nullable = false)
    private CourseComponent component;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "course_id", nullable = false)
    private Course course;
    
    @Enumerated(EnumType.STRING)
    private ComponentProgressStatus status = ComponentProgressStatus.NOT_STARTED;
    
    @Column(name = "progress_percentage", precision = 5, scale = 2)
    private BigDecimal progressPercentage = BigDecimal.ZERO;
    
    @Column(name = "started_at")
    private LocalDateTime startedAt;
    
    @Column(name = "completed_at")
    private LocalDateTime completedAt;
    
    @Column(name = "last_accessed_at")
    private LocalDateTime lastAccessedAt;
    
    @Column(name = "time_spent_seconds")
    private Long timeSpentSeconds = 0L;
    
    // Standard timestamps and lifecycle methods
}

// AssessmentAttempt.java
@Entity
@Table(name = "assessment_attempts")
public class AssessmentAttempt {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private Users user;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "component_id", nullable = false)
    private CourseComponent component;
    
    @Column(name = "attempt_number")
    private Integer attemptNumber = 1;
    
    @Column(precision = 5, scale = 2)
    private BigDecimal score;
    
    private Boolean passed = false;
    
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private Map<String, Object> answers;
    
    @Column(name = "started_at")
    private LocalDateTime startedAt;
    
    @Column(name = "submitted_at")
    private LocalDateTime submittedAt;
    
    @Column(name = "time_taken_seconds")
    private Long timeTakenSeconds;
    
    // Standard timestamps
}
```

## Phase 2: Repository Layer (Week 1)

```java
// UserCourseProgressRepository.java
@Repository
public interface UserCourseProgressRepository extends JpaRepository<UserCourseProgress, UUID> {
    Optional<UserCourseProgress> findByUserIdAndCourseId(UUID userId, UUID courseId);
    List<UserCourseProgress> findByUserId(UUID userId);
    Page<UserCourseProgress> findByUserId(UUID userId, Pageable pageable);
    List<UserCourseProgress> findByUserIdAndStatus(UUID userId, ProgressStatus status);
    
    @Query("SELECT ucp FROM UserCourseProgress ucp WHERE ucp.user.id = :userId " +
           "AND ucp.course.domain IN :domains")
    List<UserCourseProgress> findByUserIdAndDomains(@Param("userId") UUID userId, 
                                                   @Param("domains") Set<Domain> domains);
}

// ComponentProgressRepository.java
@Repository
public interface ComponentProgressRepository extends JpaRepository<ComponentProgress, UUID> {
    Optional<ComponentProgress> findByUserIdAndComponentId(UUID userId, UUID componentId);
    List<ComponentProgress> findByUserIdAndCourseId(UUID userId, UUID courseId);
    
    @Query("SELECT cp FROM ComponentProgress cp WHERE cp.user.id = :userId " +
           "AND cp.course.id = :courseId ORDER BY cp.component.orderIndex")
    List<ComponentProgress> findByUserIdAndCourseIdOrdered(@Param("userId") UUID userId, 
                                                          @Param("courseId") UUID courseId);
}

// AssessmentAttemptRepository.java
@Repository
public interface AssessmentAttemptRepository extends JpaRepository<AssessmentAttempt, UUID> {
    List<AssessmentAttempt> findByUserIdAndComponentId(UUID userId, UUID componentId);
    Optional<AssessmentAttempt> findTopByUserIdAndComponentIdOrderByAttemptNumberDesc(
        UUID userId, UUID componentId);
    Integer countByUserIdAndComponentId(UUID userId, UUID componentId);
}
```

## Phase 3: Service Layer (Week 2)

### 3.1 Progress Service

```java
@Service
@Transactional
public class ProgressService {
    
    @Autowired
    private UserCourseProgressRepository courseProgressRepository;
    
    @Autowired
    private ComponentProgressRepository componentProgressRepository;
    
    @Autowired
    private CourseRepository courseRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    // Start a course (enrollment)
    public UserCourseProgress enrollInCourse(UUID userId, UUID courseId) {
        // Check if already enrolled
        Optional<UserCourseProgress> existing = courseProgressRepository
            .findByUserIdAndCourseId(userId, courseId);
            
        if (existing.isPresent()) {
            return existing.get();
        }
        
        // Create enrollment
        Users user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));
        Course course = courseRepository.findById(courseId)
            .orElseThrow(() -> new RuntimeException("Course not found"));
            
        UserCourseProgress progress = new UserCourseProgress();
        progress.setUser(user);
        progress.setCourse(course);
        progress.setStatus(ProgressStatus.ENROLLED);
        
        // Initialize component progress
        for (CourseComponent component : course.getComponents()) {
            ComponentProgress componentProgress = new ComponentProgress();
            componentProgress.setUser(user);
            componentProgress.setComponent(component);
            componentProgress.setCourse(course);
            componentProgress.setStatus(ComponentProgressStatus.NOT_STARTED);
            componentProgressRepository.save(componentProgress);
        }
        
        return courseProgressRepository.save(progress);
    }
    
    // Start a component
    public ComponentProgress startComponent(UUID userId, UUID componentId) {
        ComponentProgress progress = componentProgressRepository
            .findByUserIdAndComponentId(userId, componentId)
            .orElseThrow(() -> new RuntimeException("Component progress not found"));
            
        if (progress.getStatus() == ComponentProgressStatus.NOT_STARTED) {
            progress.setStatus(ComponentProgressStatus.IN_PROGRESS);
            progress.setStartedAt(LocalDateTime.now());
            
            // Update course progress
            updateCourseProgress(userId, progress.getCourse().getId());
        }
        
        progress.setLastAccessedAt(LocalDateTime.now());
        return componentProgressRepository.save(progress);
    }
    
    // Complete a component
    public ComponentProgress completeComponent(UUID userId, UUID componentId, BigDecimal score) {
        ComponentProgress progress = componentProgressRepository
            .findByUserIdAndComponentId(userId, componentId)
            .orElseThrow(() -> new RuntimeException("Component progress not found"));
            
        progress.setStatus(ComponentProgressStatus.COMPLETED);
        progress.setCompletedAt(LocalDateTime.now());
        progress.setProgressPercentage(new BigDecimal("100"));
        
        // Update overall course progress
        updateCourseProgress(userId, progress.getCourse().getId());
        
        return componentProgressRepository.save(progress);
    }
    
    // Calculate and update course progress
    private void updateCourseProgress(UUID userId, UUID courseId) {
        UserCourseProgress courseProgress = courseProgressRepository
            .findByUserIdAndCourseId(userId, courseId)
            .orElseThrow(() -> new RuntimeException("Course progress not found"));
            
        List<ComponentProgress> componentProgresses = componentProgressRepository
            .findByUserIdAndCourseId(userId, courseId);
            
        // Calculate overall progress
        BigDecimal totalProgress = BigDecimal.ZERO;
        int completedComponents = 0;
        
        for (ComponentProgress cp : componentProgresses) {
            CourseComponent component = cp.getComponent();
            BigDecimal weight = getComponentWeight(component.getType());
            
            if (cp.getStatus() == ComponentProgressStatus.COMPLETED) {
                totalProgress = totalProgress.add(weight);
                completedComponents++;
            } else if (cp.getStatus() == ComponentProgressStatus.IN_PROGRESS) {
                totalProgress = totalProgress.add(weight.multiply(new BigDecimal("0.5")));
            }
        }
        
        courseProgress.setOverallProgress(totalProgress);
        
        // Update status
        if (totalProgress.compareTo(new BigDecimal("100")) >= 0) {
            courseProgress.setStatus(ProgressStatus.COMPLETED);
            courseProgress.setCompletedDate(LocalDateTime.now());
        } else if (totalProgress.compareTo(BigDecimal.ZERO) > 0) {
            courseProgress.setStatus(ProgressStatus.IN_PROGRESS);
            if (courseProgress.getStartedDate() == null) {
                courseProgress.setStartedDate(LocalDateTime.now());
            }
        }
        
        courseProgressRepository.save(courseProgress);
    }
    
    private BigDecimal getComponentWeight(CourseComponent.ComponentType type) {
        switch (type) {
            case PRE_ASSESSMENT:
                return new BigDecimal("20");
            case MATERIAL:
                return new BigDecimal("50");
            case POST_ASSESSMENT:
                return new BigDecimal("30");
            default:
                return BigDecimal.ZERO;
        }
    }
}
```

### 3.2 User Assessment Service

```java
@Service
@Transactional
public class UserAssessmentService {
    
    @Autowired
    private AssessmentAttemptRepository attemptRepository;
    
    @Autowired
    private ComponentProgressRepository componentProgressRepository;
    
    @Autowired
    private CourseComponentRepository componentRepository;
    
    @Autowired
    private ProgressService progressService;
    
    // Start an assessment
    public AssessmentAttempt startAssessment(UUID userId, UUID componentId) {
        // Check attempt limits
        Integer attemptCount = attemptRepository.countByUserIdAndComponentId(userId, componentId);
        
        if (attemptCount >= 3) { // Max 3 attempts
            throw new RuntimeException("Maximum attempts reached");
        }
        
        // Start component progress
        progressService.startComponent(userId, componentId);
        
        // Create new attempt
        CourseComponent component = componentRepository.findById(componentId)
            .orElseThrow(() -> new RuntimeException("Component not found"));
            
        AssessmentAttempt attempt = new AssessmentAttempt();
        attempt.setUser(new Users()); // Get from repo
        attempt.setComponent(component);
        attempt.setAttemptNumber(attemptCount + 1);
        attempt.setStartedAt(LocalDateTime.now());
        
        return attemptRepository.save(attempt);
    }
    
    // Submit assessment
    public AssessmentResult submitAssessment(UUID attemptId, Map<String, Object> answers) {
        AssessmentAttempt attempt = attemptRepository.findById(attemptId)
            .orElseThrow(() -> new RuntimeException("Attempt not found"));
            
        CourseComponent component = attempt.getComponent();
        Map<String, Object> componentData = component.getData();
        
        // Extract questions from component data
        List<Map<String, Object>> questions = (List<Map<String, Object>>) componentData.get("questions");
        Integer passingScore = (Integer) componentData.get("passingScore");
        
        // Calculate score
        int correctAnswers = 0;
        int totalQuestions = questions.size();
        
        for (Map<String, Object> question : questions) {
            String questionId = (String) question.get("id");
            Object userAnswer = answers.get(questionId);
            
            if (isCorrectAnswer(question, userAnswer)) {
                correctAnswers++;
            }
        }
        
        BigDecimal score = BigDecimal.valueOf((correctAnswers * 100.0) / totalQuestions);
        boolean passed = score.compareTo(BigDecimal.valueOf(passingScore)) >= 0;
        
        // Update attempt
        attempt.setScore(score);
        attempt.setPassed(passed);
        attempt.setAnswers(answers);
        attempt.setSubmittedAt(LocalDateTime.now());
        attempt.setTimeTakenSeconds(
            ChronoUnit.SECONDS.between(attempt.getStartedAt(), LocalDateTime.now())
        );
        
        attemptRepository.save(attempt);
        
        // Update component progress if passed
        if (passed) {
            progressService.completeComponent(
                attempt.getUser().getId(), 
                component.getId(), 
                score
            );
        }
        
        return AssessmentResult.builder()
            .attemptId(attemptId)
            .score(score)
            .passed(passed)
            .correctAnswers(correctAnswers)
            .totalQuestions(totalQuestions)
            .build();
    }
    
    private boolean isCorrectAnswer(Map<String, Object> question, Object userAnswer) {
        String type = (String) question.get("type");
        
        if ("MCQ".equals(type)) {
            List<Map<String, Object>> options = (List<Map<String, Object>>) question.get("options");
            for (Map<String, Object> option : options) {
                if (option.get("value").equals(userAnswer) && (Boolean) option.get("isCorrect")) {
                    return true;
                }
            }
            return false;
        } else if ("TRUE_FALSE".equals(type)) {
            return question.get("correctAnswer").equals(userAnswer);
        }
        
        return false;
    }
}
```

## Phase 4: REST Controllers (Week 2)

### 4.1 User Progress Controller

```java
@RestController
@RequestMapping("/api/v2/user/progress")
@PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
public class UserProgressController {
    
    @Autowired
    private ProgressService progressService;
    
    @Autowired
    private UserCourseProgressRepository courseProgressRepository;
    
    // Get user's course progress
    @GetMapping("/courses")
    public ResponseEntity<?> getUserCourseProgress(Authentication authentication) {
        String username = authentication.getName();
        Users user = userRepository.findByUsername(username)
            .orElseThrow(() -> new RuntimeException("User not found"));
            
        List<UserCourseProgress> progresses = courseProgressRepository
            .findByUserId(user.getId());
            
        return ResponseEntity.ok(Map.of(
            "progresses", progresses.stream()
                .map(ProgressResponseDTO::from)
                .collect(Collectors.toList())
        ));
    }
    
    // Get specific course progress
    @GetMapping("/courses/{courseId}")
    public ResponseEntity<?> getCourseProgress(
            @PathVariable UUID courseId,
            Authentication authentication) {
        String username = authentication.getName();
        Users user = userRepository.findByUsername(username)
            .orElseThrow(() -> new RuntimeException("User not found"));
            
        UserCourseProgress progress = courseProgressRepository
            .findByUserIdAndCourseId(user.getId(), courseId)
            .orElseThrow(() -> new RuntimeException("Progress not found"));
            
        List<ComponentProgress> componentProgresses = componentProgressRepository
            .findByUserIdAndCourseIdOrdered(user.getId(), courseId);
            
        return ResponseEntity.ok(Map.of(
            "courseProgress", ProgressResponseDTO.from(progress),
            "componentProgresses", componentProgresses.stream()
                .map(ComponentProgressDTO::from)
                .collect(Collectors.toList())
        ));
    }
    
    // Enroll in a course
    @PostMapping("/courses/{courseId}/enroll")
    public ResponseEntity<?> enrollInCourse(
            @PathVariable UUID courseId,
            Authentication authentication) {
        String username = authentication.getName();
        Users user = userRepository.findByUsername(username)
            .orElseThrow(() -> new RuntimeException("User not found"));
            
        UserCourseProgress progress = progressService.enrollInCourse(user.getId(), courseId);
        
        return ResponseEntity.ok(Map.of(
            "message", "Successfully enrolled in course",
            "progress", ProgressResponseDTO.from(progress)
        ));
    }
    
    // Start a component
    @PostMapping("/components/{componentId}/start")
    public ResponseEntity<?> startComponent(
            @PathVariable UUID componentId,
            Authentication authentication) {
        String username = authentication.getName();
        Users user = userRepository.findByUsername(username)
            .orElseThrow(() -> new RuntimeException("User not found"));
            
        ComponentProgress progress = progressService.startComponent(user.getId(), componentId);
        
        return ResponseEntity.ok(Map.of(
            "message", "Component started",
            "progress", ComponentProgressDTO.from(progress)
        ));
    }
}
```

### 4.2 User Assessment Controller

```java
@RestController
@RequestMapping("/api/v2/user/assessments")
@PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
public class UserAssessmentController {
    
    @Autowired
    private UserAssessmentService assessmentService;
    
    // Get assessment questions
    @GetMapping("/{componentId}/questions")
    public ResponseEntity<?> getAssessmentQuestions(
            @PathVariable UUID componentId,
            Authentication authentication) {
        CourseComponent component = componentRepository.findById(componentId)
            .orElseThrow(() -> new RuntimeException("Component not found"));
            
        Map<String, Object> data = component.getData();
        List<Map<String, Object>> questions = (List<Map<String, Object>>) data.get("questions");
        
        // Randomize questions
        Collections.shuffle(questions);
        
        // Remove correct answer information
        List<Map<String, Object>> cleanedQuestions = questions.stream()
            .map(this::removeCorrectAnswers)
            .collect(Collectors.toList());
            
        return ResponseEntity.ok(Map.of(
            "componentId", componentId,
            "timeLimit", data.get("timeLimit"),
            "questions", cleanedQuestions
        ));
    }
    
    // Start assessment attempt
    @PostMapping("/{componentId}/start")
    public ResponseEntity<?> startAssessment(
            @PathVariable UUID componentId,
            Authentication authentication) {
        String username = authentication.getName();
        Users user = userRepository.findByUsername(username)
            .orElseThrow(() -> new RuntimeException("User not found"));
            
        AssessmentAttempt attempt = assessmentService.startAssessment(user.getId(), componentId);
        
        return ResponseEntity.ok(Map.of(
            "attemptId", attempt.getId(),
            "attemptNumber", attempt.getAttemptNumber(),
            "startedAt", attempt.getStartedAt()
        ));
    }
    
    // Submit assessment
    @PostMapping("/attempts/{attemptId}/submit")
    public ResponseEntity<?> submitAssessment(
            @PathVariable UUID attemptId,
            @RequestBody Map<String, Object> answers,
            Authentication authentication) {
        AssessmentResult result = assessmentService.submitAssessment(attemptId, answers);
        
        return ResponseEntity.ok(Map.of(
            "score", result.getScore(),
            "passed", result.isPassed(),
            "correctAnswers", result.getCorrectAnswers(),
            "totalQuestions", result.getTotalQuestions()
        ));
    }
    
    private Map<String, Object> removeCorrectAnswers(Map<String, Object> question) {
        Map<String, Object> cleaned = new HashMap<>(question);
        
        if ("MCQ".equals(question.get("type"))) {
            List<Map<String, Object>> options = (List<Map<String, Object>>) question.get("options");
            List<Map<String, Object>> cleanedOptions = options.stream()
                .map(option -> {
                    Map<String, Object> cleanOption = new HashMap<>(option);
                    cleanOption.remove("isCorrect");
                    return cleanOption;
                })
                .collect(Collectors.toList());
            cleaned.put("options", cleanedOptions);
        } else {
            cleaned.remove("correctAnswer");
        }
        
        return cleaned;
    }
}
```

## Phase 5: Frontend Implementation (Week 3)

### 5.1 Assessment Taking Component

```jsx
// UserAssessment.js
import React, { useState, useEffect } from 'react';
import { 
    Box, 
    Paper, 
    Typography, 
    Button, 
    Radio, 
    RadioGroup, 
    FormControlLabel,
    LinearProgress,
    Chip
} from '@mui/material';
import { assessmentService } from '../../../services/api';

const UserAssessment = ({ componentId, onComplete }) => {
    const [questions, setQuestions] = useState([]);
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [answers, setAnswers] = useState({});
    const [attemptId, setAttemptId] = useState(null);
    const [timeRemaining, setTimeRemaining] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadAssessment();
    }, [componentId]);

    const loadAssessment = async () => {
        try {
            // Get questions
            const questionsResponse = await assessmentService.getQuestions(componentId);
            setQuestions(questionsResponse.data.questions);
            setTimeRemaining(questionsResponse.data.timeLimit * 60); // Convert to seconds
            
            // Start attempt
            const attemptResponse = await assessmentService.startAttempt(componentId);
            setAttemptId(attemptResponse.data.attemptId);
            
            setLoading(false);
        } catch (error) {
            console.error('Error loading assessment:', error);
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
            const result = await assessmentService.submitAttempt(attemptId, answers);
            onComplete(result.data);
        } catch (error) {
            console.error('Error submitting assessment:', error);
        }
    };

    if (loading) return <CircularProgress />;

    const question = questions[currentQuestion];
    const progress = ((currentQuestion + 1) / questions.length) * 100;

    return (
        <Paper sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
            {/* Progress and timer */}
            <Box display="flex" justifyContent="space-between" mb={3}>
                <Box flex={1} mr={2}>
                    <Typography variant="caption">
                        Question {currentQuestion + 1} of {questions.length}
                    </Typography>
                    <LinearProgress variant="determinate" value={progress} />
                </Box>
                <Chip 
                    label={`Time: ${Math.floor(timeRemaining / 60)}:${(timeRemaining % 60).toString().padStart(2, '0')}`}
                    color={timeRemaining < 300 ? 'error' : 'primary'}
                />
            </Box>

            {/* Question */}
            <Box mb={4}>
                <Typography variant="h6" gutterBottom>
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
                            />
                        ))}
                    </RadioGroup>
                )}
                
                {question.type === 'TRUE_FALSE' && (
                    <RadioGroup
                        value={answers[question.id] || ''}
                        onChange={(e) => handleAnswerChange(question.id, e.target.value === 'true')}
                    >
                        <FormControlLabel value="true" control={<Radio />} label="True" />
                        <FormControlLabel value="false" control={<Radio />} label="False" />
                    </RadioGroup>
                )}
            </Box>

            {/* Navigation */}
            <Box display="flex" justifyContent="space-between">
                <Button 
                    onClick={handlePrevious} 
                    disabled={currentQuestion === 0}
                >
                    Previous
                </Button>
                
                {currentQuestion === questions.length - 1 ? (
                    <Button 
                        variant="contained" 
                        color="primary" 
                        onClick={handleSubmit}
                    >
                        Submit Assessment
                    </Button>
                ) : (
                    <Button 
                        variant="contained" 
                        onClick={handleNext}
                    >
                        Next
                    </Button>
                )}
            </Box>
        </Paper>
    );
};

export default UserAssessment;
```

### 5.2 Course Progress Display

```jsx
// CourseProgressView.js
import React, { useState, useEffect } from 'react';
import { 
    Box, 
    Card, 
    CardContent, 
    Typography, 
    LinearProgress,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Chip
} from '@mui/material';
import { 
    Assessment as AssessmentIcon,
    Description as MaterialIcon,
    CheckCircle as CompletedIcon,
    RadioButtonUnchecked as PendingIcon
} from '@mui/icons-material';
import { progressService } from '../../../services/api';

const CourseProgressView = ({ courseId }) => {
    const [courseProgress, setCourseProgress] = useState(null);
    const [componentProgresses, setComponentProgresses] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadProgress();
    }, [courseId]);

    const loadProgress = async () => {
        try {
            const response = await progressService.getCourseProgress(courseId);
            setCourseProgress(response.data.courseProgress);
            setComponentProgresses(response.data.componentProgresses);
            setLoading(false);
        } catch (error) {
            console.error('Error loading progress:', error);
            setLoading(false);
        }
    };

    const getComponentIcon = (type) => {
        switch (type) {
            case 'PRE_ASSESSMENT':
            case 'POST_ASSESSMENT':
                return <AssessmentIcon />;
            case 'MATERIAL':
                return <MaterialIcon />;
            default:
                return <PendingIcon />;
        }
    };

    const getStatusIcon = (status) => {
        return status === 'COMPLETED' ? <CompletedIcon color="success" /> : <PendingIcon />;
    };

    const getStatusChip = (status) => {
        const statusConfig = {
            'NOT_STARTED': { label: 'Not Started', color: 'default' },
            'IN_PROGRESS': { label: 'In Progress', color: 'primary' },
            'COMPLETED': { label: 'Completed', color: 'success' },
            'FAILED': { label: 'Failed', color: 'error' }
        };
        
        const config = statusConfig[status] || statusConfig['NOT_STARTED'];
        return <Chip size="small" label={config.label} color={config.color} />;
    };

    if (loading) return <CircularProgress />;

    return (
        <Card>
            <CardContent>
                <Typography variant="h6" gutterBottom>
                    Course Progress
                </Typography>
                
                <Box mb={3}>
                    <Box display="flex" justifyContent="space-between" mb={1}>
                        <Typography variant="body2">
                            Overall Progress
                        </Typography>
                        <Typography variant="body2" fontWeight="bold">
                            {courseProgress?.overallProgress || 0}%
                        </Typography>
                    </Box>
                    <LinearProgress 
                        variant="determinate" 
                        value={courseProgress?.overallProgress || 0}
                        sx={{ height: 8, borderRadius: 4 }}
                    />
                </Box>
                
                <Typography variant="subtitle2" gutterBottom>
                    Components
                </Typography>
                
                <List>
                    {componentProgresses.map((cp) => (
                        <ListItem key={cp.id}>
                            <ListItemIcon>
                                {getStatusIcon(cp.status)}
                            </ListItemIcon>
                            <ListItemIcon>
                                {getComponentIcon(cp.component.type)}
                            </ListItemIcon>
                            <ListItemText 
                                primary={cp.component.data.title || cp.component.type}
                                secondary={`Progress: ${cp.progressPercentage}%`}
                            />
                            {getStatusChip(cp.status)}
                        </ListItem>
                    ))}
                </List>
            </CardContent>
        </Card>
    );
};

export default CourseProgressView;
```

## Implementation Timeline

### Week 1
- Set up database schema and migrations
- Create entity models and repositories
- Basic service layer implementation

### Week 2
- Complete service layer with business logic
- Implement REST controllers
- Create DTOs and response objects
- Basic error handling

### Week 3
- Frontend components for assessment taking
- Progress tracking UI components
- Integration with existing course views

### Week 4
- Certificate generation implementation
- Performance optimization
- Documentation updates

## Key Differences from Original Plan

1. **Uses existing CourseComponent structure** - No separate assessment tables
2. **Follows existing patterns** - UUID generation, entity relationships, service structure
3. **Compatible with current auth** - Uses existing role-based security
4. **Leverages JSON data field** - Stores assessment questions in existing JSONB column
5. **Maintains consistency** - Similar DTOs, response patterns, and API structure

## Migration Strategy

1. Run database migrations to add new tables
2. Deploy backend changes
3. Deploy frontend changes
4. Enable features progressively

This implementation plan is fully compatible with the existing codebase and follows established patterns throughout the application.