package com.ehs.elearning.controller;

import com.ehs.elearning.model.*;
import com.ehs.elearning.payload.request.AnswerRequest;
import com.ehs.elearning.payload.request.AssessmentSubmissionRequest;
import com.ehs.elearning.payload.request.QuestionRequest;
import com.ehs.elearning.payload.response.AssessmentResultResponse;
import com.ehs.elearning.payload.response.MessageResponse;
import com.ehs.elearning.repository.AnswerRepository;
import com.ehs.elearning.repository.ModuleComponentRepository;
import com.ehs.elearning.repository.QuestionRepository;
import com.ehs.elearning.repository.UserRepository;
import com.ehs.elearning.security.UserDetailsImpl;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;

import java.util.*;
import java.util.stream.Collectors;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api")
public class AssessmentController {

    @Autowired
    private ModuleComponentRepository componentRepository;
    
    @Autowired
    private QuestionRepository questionRepository;
    
    @Autowired
    private AnswerRepository answerRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    // Get questions for a component
    @GetMapping("/components/{id}/questions")
    public ResponseEntity<?> getQuestions(@PathVariable UUID id) {
        Optional<ModuleComponent> componentOpt = componentRepository.findById(id);
        if (!componentOpt.isPresent()) {
            return ResponseEntity.notFound().build();
        }
        
        ModuleComponent component = componentOpt.get();
        if (component.getType() != ComponentType.PRE_ASSESSMENT && 
            component.getType() != ComponentType.POST_ASSESSMENT) {
            return ResponseEntity.badRequest().body(
                new MessageResponse("Component is not an assessment type"));
        }
        
        List<Question> questions = questionRepository.findByComponentOrderBySequenceOrderAsc(component);
        return ResponseEntity.ok(questions);
    }
    
    // Add question to assessment
    @PostMapping("/components/{id}/questions")
    public ResponseEntity<?> addQuestion(
            @PathVariable UUID id,
            @Valid @RequestBody QuestionRequest questionRequest) {
        
        Optional<ModuleComponent> componentOpt = componentRepository.findById(id);
        if (!componentOpt.isPresent()) {
            return ResponseEntity.notFound().build();
        }
        
        ModuleComponent component = componentOpt.get();
        if (component.getType() != ComponentType.PRE_ASSESSMENT && 
            component.getType() != ComponentType.POST_ASSESSMENT) {
            return ResponseEntity.badRequest().body(
                new MessageResponse("Component is not an assessment type"));
        }
        
        // Create new question
        Question question = new Question(
                component,
                questionRequest.getText(),
                questionRequest.getType(),
                questionRequest.getSequenceOrder()
        );
        
        // Set other properties
        question.setOptions(questionRequest.getOptions());
        question.setCorrectAnswer(questionRequest.getCorrectAnswer());
        question.setExplanation(questionRequest.getExplanation());
        
        if (questionRequest.getPoints() != null) {
            question.setPoints(questionRequest.getPoints());
        }
        
        // If sequence order not specified, add to end
        if (question.getSequenceOrder() == null) {
            Long count = questionRepository.countByComponent(component);
            question.setSequenceOrder(count.intValue() + 1);
        }
        
        Question savedQuestion = questionRepository.save(question);
        return ResponseEntity.ok(savedQuestion);
    }
    
    // Update question
    @PutMapping("/questions/{id}")
    public ResponseEntity<?> updateQuestion(
            @PathVariable UUID id,
            @Valid @RequestBody QuestionRequest questionRequest) {
        
        Optional<Question> questionOpt = questionRepository.findById(id);
        if (!questionOpt.isPresent()) {
            return ResponseEntity.notFound().build();
        }
        
        Question question = questionOpt.get();
        
        // Update question properties
        question.setText(questionRequest.getText());
        question.setType(questionRequest.getType());
        question.setOptions(questionRequest.getOptions());
        question.setCorrectAnswer(questionRequest.getCorrectAnswer());
        question.setExplanation(questionRequest.getExplanation());
        
        if (questionRequest.getPoints() != null) {
            question.setPoints(questionRequest.getPoints());
        }
        
        if (questionRequest.getSequenceOrder() != null) {
            question.setSequenceOrder(questionRequest.getSequenceOrder());
        }
        
        Question updatedQuestion = questionRepository.save(question);
        return ResponseEntity.ok(updatedQuestion);
    }
    
    // Delete question
    @DeleteMapping("/questions/{id}")
    public ResponseEntity<?> deleteQuestion(@PathVariable UUID id) {
        Optional<Question> questionOpt = questionRepository.findById(id);
        if (!questionOpt.isPresent()) {
            return ResponseEntity.notFound().build();
        }
        
        Question question = questionOpt.get();
        ModuleComponent component = question.getComponent();
        int deletedOrder = question.getSequenceOrder();
        
        // Delete the question
        questionRepository.delete(question);
        
        // Reorder remaining questions
        List<Question> remainingQuestions = questionRepository.findByComponentOrderBySequenceOrderAsc(component);
        for (Question q : remainingQuestions) {
            if (q.getSequenceOrder() > deletedOrder) {
                q.setSequenceOrder(q.getSequenceOrder() - 1);
                questionRepository.save(q);
            }
        }
        
        return ResponseEntity.ok(new MessageResponse("Question deleted successfully."));
    }
    
    // Submit assessment answers
    @PostMapping("/components/{id}/submit")
    public ResponseEntity<?> submitAssessment(
            @PathVariable UUID id,
            @Valid @RequestBody AssessmentSubmissionRequest submissionRequest) {
        
        // Get current user
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        
        Optional<ModuleComponent> componentOpt = componentRepository.findById(id);
        if (!componentOpt.isPresent()) {
            return ResponseEntity.notFound().build();
        }
        
        ModuleComponent component = componentOpt.get();
        if (component.getType() != ComponentType.PRE_ASSESSMENT && 
            component.getType() != ComponentType.POST_ASSESSMENT) {
            return ResponseEntity.badRequest().body(
                new MessageResponse("Component is not an assessment type"));
        }
        
        Optional<Users> userOpt = userRepository.findById(userDetails.getId());
        if (!userOpt.isPresent()) {
            return ResponseEntity.badRequest().body(new MessageResponse("User not found."));
        }
        
        Users user = userOpt.get();
        
        // Get all questions for this component
        List<Question> questions = questionRepository.findByComponentOrderBySequenceOrderAsc(component);
        Map<UUID, Question> questionMap = questions.stream()
                .collect(Collectors.toMap(Question::getId, q -> q));
        
        // Process each answer
        List<Answer> answers = new ArrayList<>();
        List<Map<String, Object>> questionResults = new ArrayList<>();
        
        int totalPoints = 0;
        int earnedPoints = 0;
        int correctAnswers = 0;
        
        for (AnswerRequest answerRequest : submissionRequest.getAnswers()) {
            Question question = questionMap.get(answerRequest.getQuestionId());
            if (question == null) {
                continue; // Skip if question not found
            }
            
            // Create answer
            Answer answer = new Answer(question, user, answerRequest.getUserAnswer());
            
            // Calculate if answer is correct and score
            boolean isCorrect = isAnswerCorrect(question, answerRequest.getUserAnswer());
            int score = isCorrect ? question.getPoints() : 0;
            
            answer.setIsCorrect(isCorrect);
            answer.setScore(score);
            
            // Add to answers list
            answers.add(answer);
            
            // Update totals
            totalPoints += question.getPoints();
            earnedPoints += score;
            if (isCorrect) {
                correctAnswers++;
            }
            
            // Add to results
            Map<String, Object> questionResult = new HashMap<>();
            questionResult.put("questionId", question.getId());
            questionResult.put("text", question.getText());
            questionResult.put("correctAnswer", question.getCorrectAnswer());
            questionResult.put("userAnswer", answerRequest.getUserAnswer());
            questionResult.put("isCorrect", isCorrect);
            questionResult.put("points", question.getPoints());
            questionResult.put("score", score);
            questionResult.put("explanation", question.getExplanation());
            questionResults.add(questionResult);
        }
        
        // Save all answers
        answerRepository.saveAll(answers);
        
        // Calculate overall score
        int overallScore = totalPoints > 0 ? (earnedPoints * 100) / totalPoints : 0;
        boolean passed = component.getTrainingModule().getRequiredCompletionScore() != null 
            ? overallScore >= component.getTrainingModule().getRequiredCompletionScore()
            : overallScore >= 70; // Default passing score is 70%
        
        // Return assessment result
        AssessmentResultResponse result = new AssessmentResultResponse(
                component.getId(),
                overallScore,
                totalPoints,
                earnedPoints,
                correctAnswers,
                questions.size(),
                passed,
                questionResults
        );
        
        return ResponseEntity.ok(result);
    }
    
    // Helper method to determine if an answer is correct
    private boolean isAnswerCorrect(Question question, String userAnswer) {
        // This is a simplified implementation
        // In a real application, you would compare based on question type
        
        switch(question.getType()) {
            case MULTIPLE_CHOICE:
            case TRUE_FALSE:
                return question.getCorrectAnswer().equals(userAnswer);
                
            case SHORT_ANSWER:
                // For short answer, we could do case-insensitive comparison
                return question.getCorrectAnswer().equalsIgnoreCase(userAnswer);
                
            case MATCHING:
            case FILL_IN_BLANK:
                // More complex logic for these types
                // For now, just do a direct comparison
                return question.getCorrectAnswer().equals(userAnswer);
                
            default:
                return false;
        }
    }
}