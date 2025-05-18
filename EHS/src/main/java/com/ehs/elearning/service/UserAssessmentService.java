package com.ehs.elearning.service;

import com.ehs.elearning.model.*;
import com.ehs.elearning.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
@Transactional
public class UserAssessmentService {
    
    private static final Logger logger = LoggerFactory.getLogger(UserAssessmentService.class);
    
    @Autowired
    private AssessmentAttemptRepository attemptRepository;
    
    @Autowired
    private ComponentProgressRepository componentProgressRepository;
    
    @Autowired
    private CourseComponentRepository componentRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private ProgressService progressService;
    
    // Maximum attempts allowed
    private static final int MAX_ATTEMPTS = 3;
    
    /**
     * Start an assessment attempt
     */
    @Transactional
    public AssessmentAttempt startAssessment(UUID userId, UUID componentId) {
        // Get user and component
        Users user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));
        CourseComponent component = componentRepository.findById(componentId)
            .orElseThrow(() -> new RuntimeException("Component not found"));
            
        // Verify it's an assessment component
        if (component.getType() != CourseComponent.ComponentType.PRE_ASSESSMENT &&
            component.getType() != CourseComponent.ComponentType.POST_ASSESSMENT) {
            throw new RuntimeException("Component is not an assessment");
        }
        
        // Ensure component progress exists
        try {
            progressService.startComponent(userId, componentId);
        } catch (Exception e) {
            logger.warn("Error starting component progress: {}", e.getMessage());
            // Continue - component progress may already exist
        }
        
        // Check if user can access this component
        if (!progressService.canAccessComponent(userId, componentId)) {
            throw new RuntimeException("Cannot access this component yet");
        }
        
        // Ensure component progress exists (handle enrollment race condition)
        progressService.ensureComponentProgressExists(userId, componentId);
        
        // Use a locked query to prevent concurrent access
        List<AssessmentAttempt> existingAttempts = attemptRepository
            .findByUserIdAndComponentIdWithLock(userId, componentId);
            
        // Check for incomplete attempts first
        for (AssessmentAttempt attempt : existingAttempts) {
            if (attempt.getSubmittedAt() == null) {
                logger.info("Returning existing incomplete attempt {} for user {} and component {}", 
                    attempt.getId(), userId, componentId);
                return attempt;
            }
        }
        
        // Check if maximum attempts reached
        if (existingAttempts.size() >= MAX_ATTEMPTS) {
            logger.warn("Maximum attempts reached for user {} and component {}. Total: {}, Max: {}", 
                userId, componentId, existingAttempts.size(), MAX_ATTEMPTS);
            throw new RuntimeException("Maximum attempts reached for this assessment");
        }
        
        // Find the highest attempt number
        int maxAttemptNumber = existingAttempts.stream()
            .mapToInt(AssessmentAttempt::getAttemptNumber)
            .max()
            .orElse(0);
            
        int nextAttemptNumber = maxAttemptNumber + 1;
        
        logger.info("Creating new attempt {} for user {} and component {}", nextAttemptNumber, userId, componentId);
        
        try {
            // Use synchronized method to handle concurrent creation
            return findOrCreateAttempt(user, component, nextAttemptNumber);
            
        } catch (Exception e) {
            logger.error("Error creating assessment attempt: {}", e.getMessage());
            
            // If there's still somehow a duplicate key error, find and return the existing attempt
            if (e.getMessage().contains("duplicate key")) {
                // Try one more time with the synchronized method
                try {
                    return findOrCreateAttempt(user, component, nextAttemptNumber);
                } catch (Exception retryError) {
                    logger.error("Failed even with synchronized retry: {}", retryError.getMessage());
                }
            }
            
            throw new RuntimeException("Error starting assessment: " + e.getMessage());
        }
    }
    
    /**
     * Alternative synchronized method to handle duplicate key issues
     */
    private synchronized AssessmentAttempt findOrCreateAttempt(Users user, CourseComponent component, 
                                                              int attemptNumber) {
        // Check if attempt already exists
        Optional<AssessmentAttempt> existingAttempt = attemptRepository
            .findByUserIdAndComponentIdAndAttemptNumber(user.getId(), component.getId(), attemptNumber);
            
        if (existingAttempt.isPresent()) {
            logger.info("Found existing attempt through synchronized check");
            return existingAttempt.get();
        }
        
        // Create new attempt
        AssessmentAttempt attempt = new AssessmentAttempt(user, component, attemptNumber);
        return attemptRepository.save(attempt);
    }
    
    /**
     * Get assessment questions (without answers)
     */
    public Map<String, Object> getAssessmentQuestions(UUID componentId) {
        CourseComponent component = componentRepository.findById(componentId)
            .orElseThrow(() -> new RuntimeException("Component not found"));
            
        Map<String, Object> componentData = component.getData();
        
        // Extract assessment data
        Map<String, Object> assessmentData = new HashMap<>();
        assessmentData.put("title", componentData.get("title"));
        assessmentData.put("timeLimit", componentData.get("timeLimit"));
        assessmentData.put("passingScore", componentData.get("passingScore"));
        
        // Get questions and remove correct answers
        Object questionsObj = componentData.get("questions");
        if (questionsObj == null) {
            logger.warn("No questions found in assessment data");
            assessmentData.put("questions", new ArrayList<>());
            return assessmentData;
        }
        
        logger.debug("Questions object type: {}", questionsObj.getClass().getName());
        List<Map<String, Object>> questions = new ArrayList<>();
        
        // Handle different possible formats of questions data
        if (questionsObj instanceof List) {
            try {
                @SuppressWarnings("unchecked")
                List<Map<String, Object>> questionsList = (List<Map<String, Object>>) questionsObj;
                questions = questionsList;
                logger.debug("Questions successfully cast to List<Map>");
            } catch (ClassCastException e) {
                logger.warn("Failed to cast questions to List<Map>, attempting item-by-item conversion", e);
                // If list contains non-map objects, skip them
                @SuppressWarnings("unchecked")
                List<?> rawList = (List<?>) questionsObj;
                for (Object item : rawList) {
                    if (item instanceof Map) {
                        @SuppressWarnings("unchecked")
                        Map<String, Object> mapItem = (Map<String, Object>) item;
                        questions.add(mapItem);
                    }
                }
            }
        } else if (questionsObj instanceof Map) {
            logger.debug("Questions object is a Map, checking for nested 'questions' key");
            // If questions is a map with a "questions" key
            @SuppressWarnings("unchecked")
            Map<String, Object> questionsMap = (Map<String, Object>) questionsObj;
            Object innerQuestions = questionsMap.get("questions");
            if (innerQuestions instanceof List) {
                @SuppressWarnings("unchecked")
                List<Map<String, Object>> questionsList = (List<Map<String, Object>>) innerQuestions;
                questions = questionsList;
                logger.debug("Found nested questions list");
            }
        } else {
            logger.error("Invalid questions format: {}", questionsObj.getClass().getName());
            throw new RuntimeException("Invalid questions format in assessment data: expected List or Map, got " + 
                questionsObj.getClass().getName());
        }
        
        List<Map<String, Object>> cleanedQuestions = new ArrayList<>();
        
        for (Object questionObj : questions) {
            if (!(questionObj instanceof Map)) {
                continue;
            }
            
            @SuppressWarnings("unchecked")
            Map<String, Object> question = (Map<String, Object>) questionObj;
            Map<String, Object> cleanedQuestion = new HashMap<>(question);
            
            // Remove correct answer information
            if ("MCQ".equals(question.get("type"))) {
                Object optionsObj = question.get("options");
                if (optionsObj instanceof List) {
                    @SuppressWarnings("unchecked")
                    List<Map<String, Object>> options = (List<Map<String, Object>>) optionsObj;
                    List<Map<String, Object>> cleanedOptions = new ArrayList<>();
                    
                    for (Object optionObj : options) {
                        if (optionObj instanceof Map) {
                            @SuppressWarnings("unchecked")
                            Map<String, Object> option = (Map<String, Object>) optionObj;
                            Map<String, Object> cleanedOption = new HashMap<>(option);
                            cleanedOption.remove("isCorrect");
                            cleanedOptions.add(cleanedOption);
                        }
                    }
                    
                    cleanedQuestion.put("options", cleanedOptions);
                }
            } else if ("TRUE_FALSE".equals(question.get("type"))) {
                cleanedQuestion.remove("correctAnswer");
            }
            
            cleanedQuestions.add(cleanedQuestion);
        }
        
        // Shuffle questions if needed
        Collections.shuffle(cleanedQuestions);
        assessmentData.put("questions", cleanedQuestions);
        
        return assessmentData;
    }
    
    /**
     * Submit assessment attempt
     */
    public AssessmentResult submitAssessment(UUID attemptId, Map<String, Object> userAnswers) {
        AssessmentAttempt attempt = attemptRepository.findById(attemptId)
            .orElseThrow(() -> new RuntimeException("Attempt not found"));
            
        // Check if already submitted
        if (attempt.getSubmittedAt() != null) {
            throw new RuntimeException("Assessment already submitted");
        }
        
        CourseComponent component = attempt.getComponent();
        Map<String, Object> componentData = component.getData();
        
        // Extract questions safely
        Object questionsObj = componentData.get("questions");
        List<Map<String, Object>> questions = new ArrayList<>();
        
        // Handle different possible formats of questions data
        if (questionsObj instanceof List) {
            try {
                @SuppressWarnings("unchecked")
                List<Map<String, Object>> questionsList = (List<Map<String, Object>>) questionsObj;
                questions = questionsList;
            } catch (ClassCastException e) {
                // If list contains non-map objects, skip them
                @SuppressWarnings("unchecked")
                List<?> rawList = (List<?>) questionsObj;
                for (Object item : rawList) {
                    if (item instanceof Map) {
                        @SuppressWarnings("unchecked")
                        Map<String, Object> mapItem = (Map<String, Object>) item;
                        questions.add(mapItem);
                    }
                }
            }
        } else if (questionsObj instanceof Map) {
            // If questions is a map with a "questions" key
            @SuppressWarnings("unchecked")
            Map<String, Object> questionsMap = (Map<String, Object>) questionsObj;
            Object innerQuestions = questionsMap.get("questions");
            if (innerQuestions instanceof List) {
                @SuppressWarnings("unchecked")
                List<Map<String, Object>> questionsList = (List<Map<String, Object>>) innerQuestions;
                questions = questionsList;
            }
        }
        
        Integer passingScore = (Integer) componentData.get("passingScore");
        
        // Calculate score
        int correctAnswers = 0;
        int totalQuestions = questions.size();
        
        if (totalQuestions == 0) {
            throw new RuntimeException("No questions found in the assessment");
        }
        
        // Detailed results for feedback
        List<Map<String, Object>> detailedResults = new ArrayList<>();
        
        for (Map<String, Object> question : questions) {
            String questionId = (String) question.get("id");
            if (questionId == null) {
                logger.error("Question without ID found: {}", question);
                continue;
            }
            Object userAnswer = userAnswers.get(questionId);
            
            boolean isCorrect = false;
            Object correctAnswer = null;
            
            if ("MCQ".equals(question.get("type"))) {
                Object optionsObj = question.get("options");
                if (optionsObj instanceof List) {
                    @SuppressWarnings("unchecked")
                    List<Map<String, Object>> options = (List<Map<String, Object>>) optionsObj;
                    for (Map<String, Object> option : options) {
                        if (Boolean.TRUE.equals(option.get("isCorrect"))) {
                            correctAnswer = option.get("value");
                            if (correctAnswer != null && correctAnswer.equals(userAnswer)) {
                                isCorrect = true;
                                correctAnswers++;
                            }
                            break;
                        }
                    }
                }
            } else if ("TRUE_FALSE".equals(question.get("type"))) {
                correctAnswer = question.get("correctAnswer");
                if (correctAnswer != null && correctAnswer.equals(userAnswer)) {
                    isCorrect = true;
                    correctAnswers++;
                }
            }
            
            // Add to detailed results (can be used for feedback)
            Map<String, Object> result = new HashMap<>();
            result.put("questionId", questionId);
            result.put("isCorrect", isCorrect);
            result.put("userAnswer", userAnswer);
            result.put("correctAnswer", correctAnswer);
            detailedResults.add(result);
        }
        
        // Calculate percentage score
        BigDecimal score = BigDecimal.valueOf((correctAnswers * 100.0) / totalQuestions)
            .setScale(2, RoundingMode.HALF_UP);
        boolean passed = score.compareTo(BigDecimal.valueOf(passingScore)) >= 0;
        
        logger.info("Assessment scoring - Correct: {}/{}, Score: {}%, Passing: {}%, Passed: {}", 
            correctAnswers, totalQuestions, score, passingScore, passed);
        
        // Update attempt
        attempt.submit(userAnswers, score, passed);
        attemptRepository.save(attempt);
        
        // Update component progress
        ComponentProgress componentProgress = componentProgressRepository
            .findByUserIdAndComponentId(attempt.getUser().getId(), component.getId())
            .orElseThrow(() -> new RuntimeException("Component progress not found"));
            
        componentProgress.setScore(score.intValue());
        componentProgress.setAttempts(attempt.getAttemptNumber());
        
        if (passed) {
            componentProgress.markAsCompleted();
            progressService.completeComponent(attempt.getUser().getId(), component.getId(), score.intValue());
        } else {
            componentProgress.setStatus(ComponentProgressStatus.FAILED);
        }
        
        componentProgressRepository.save(componentProgress);
        
        // Create result object
        return AssessmentResult.builder()
            .attemptId(attemptId)
            .score(score)
            .passed(passed)
            .correctAnswers(correctAnswers)
            .totalQuestions(totalQuestions)
            .detailedResults(detailedResults)
            .attemptsRemaining(MAX_ATTEMPTS - attempt.getAttemptNumber())
            .build();
    }
    
    /**
     * Get user's assessment attempts
     */
    public List<AssessmentAttempt> getUserAttempts(UUID userId, UUID componentId) {
        return attemptRepository.findByUserIdAndComponentId(userId, componentId);
    }
    
    /**
     * Get latest attempt
     */
    public AssessmentAttempt getLatestAttempt(UUID userId, UUID componentId) {
        return attemptRepository
            .findTopByUserIdAndComponentIdOrderByAttemptNumberDesc(userId, componentId)
            .orElse(null);
    }
    
    /**
     * Check if user can retry assessment
     */
    public boolean canRetryAssessment(UUID userId, UUID componentId) {
        Integer completedAttemptCount = attemptRepository.countCompletedAttempts(userId, componentId);
        return completedAttemptCount < MAX_ATTEMPTS;
    }
    
    /**
     * Get remaining attempts
     */
    public int getRemainingAttempts(UUID userId, UUID componentId) {
        Integer completedAttemptCount = attemptRepository.countCompletedAttempts(userId, componentId);
        return Math.max(0, MAX_ATTEMPTS - completedAttemptCount);
    }
    
    /**
     * Get all incomplete attempts for a user
     */
    public List<Map<String, Object>> getIncompleteAttempts(UUID userId) {
        List<AssessmentAttempt> incompleteAttempts = attemptRepository.findIncompleteAttemptsByUserId(userId);
        
        return incompleteAttempts.stream()
            .map(attempt -> {
                Map<String, Object> attemptInfo = new HashMap<>();
                attemptInfo.put("attemptId", attempt.getId());
                attemptInfo.put("componentId", attempt.getComponent().getId());
                attemptInfo.put("componentType", attempt.getComponent().getType());
                attemptInfo.put("componentTitle", attempt.getComponent().getData().get("title"));
                attemptInfo.put("courseId", attempt.getComponent().getCourse().getId());
                attemptInfo.put("courseTitle", attempt.getComponent().getCourse().getTitle());
                attemptInfo.put("startedAt", attempt.getStartedAt());
                attemptInfo.put("attemptNumber", attempt.getAttemptNumber());
                
                // Calculate time elapsed
                LocalDateTime now = LocalDateTime.now();
                Duration elapsed = Duration.between(attempt.getStartedAt(), now);
                attemptInfo.put("elapsedMinutes", elapsed.toMinutes());
                
                return attemptInfo;
            })
            .collect(Collectors.toList());
    }
    
    /**
     * Auto-submit an incomplete assessment with zero scores for unanswered questions
     */
    public AssessmentResult autoSubmitAssessment(UUID attemptId, UUID userId) {
        AssessmentAttempt attempt = attemptRepository.findById(attemptId)
            .orElseThrow(() -> new RuntimeException("Attempt not found"));
            
        // Verify the attempt belongs to the user
        if (!attempt.getUser().getId().equals(userId)) {
            throw new RuntimeException("Attempt does not belong to the user");
        }
        
        // Check if already submitted
        if (attempt.getSubmittedAt() != null) {
            throw new RuntimeException("Assessment already submitted");
        }
        
        // Prepare empty answers map for auto-submission
        Map<String, Object> emptyAnswers = new HashMap<>();
        
        // Auto-submit with empty answers (will score as 0)
        return submitAssessment(attemptId, emptyAnswers);
    }
    
    /**
     * Assessment result class
     */
    public static class AssessmentResult {
        private UUID attemptId;
        private BigDecimal score;
        private boolean passed;
        private int correctAnswers;
        private int totalQuestions;
        private List<Map<String, Object>> detailedResults;
        private int attemptsRemaining;
        
        // Builder pattern
        public static AssessmentResultBuilder builder() {
            return new AssessmentResultBuilder();
        }
        
        public static class AssessmentResultBuilder {
            private AssessmentResult result = new AssessmentResult();
            
            public AssessmentResultBuilder attemptId(UUID attemptId) {
                result.attemptId = attemptId;
                return this;
            }
            
            public AssessmentResultBuilder score(BigDecimal score) {
                result.score = score;
                return this;
            }
            
            public AssessmentResultBuilder passed(boolean passed) {
                result.passed = passed;
                return this;
            }
            
            public AssessmentResultBuilder correctAnswers(int correctAnswers) {
                result.correctAnswers = correctAnswers;
                return this;
            }
            
            public AssessmentResultBuilder totalQuestions(int totalQuestions) {
                result.totalQuestions = totalQuestions;
                return this;
            }
            
            public AssessmentResultBuilder detailedResults(List<Map<String, Object>> detailedResults) {
                result.detailedResults = detailedResults;
                return this;
            }
            
            public AssessmentResultBuilder attemptsRemaining(int attemptsRemaining) {
                result.attemptsRemaining = attemptsRemaining;
                return this;
            }
            
            public AssessmentResult build() {
                return result;
            }
        }
        
        // Getters
        public UUID getAttemptId() { return attemptId; }
        public BigDecimal getScore() { return score; }
        public boolean isPassed() { return passed; }
        public int getCorrectAnswers() { return correctAnswers; }
        public int getTotalQuestions() { return totalQuestions; }
        public List<Map<String, Object>> getDetailedResults() { return detailedResults; }
        public int getAttemptsRemaining() { return attemptsRemaining; }
    }
}