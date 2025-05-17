package com.ehs.elearning.controller;

import com.ehs.elearning.model.AssessmentAttempt;
import com.ehs.elearning.model.Users;
import com.ehs.elearning.payload.response.AssessmentResultResponse;
import com.ehs.elearning.payload.response.MessageResponse;
import com.ehs.elearning.repository.UserRepository;
import com.ehs.elearning.service.UserAssessmentService;
import com.ehs.elearning.service.UserAssessmentService.AssessmentResult;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v2/user/assessments")
@CrossOrigin(origins = "*", maxAge = 3600)
@PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
public class UserAssessmentController {
    
    @Autowired
    private UserAssessmentService assessmentService;
    
    @Autowired
    private UserRepository userRepository;
    
    /**
     * Get assessment questions
     */
    @GetMapping("/{componentId}/questions")
    public ResponseEntity<?> getAssessmentQuestions(
            @PathVariable UUID componentId) {
        try {
            Map<String, Object> assessmentData = assessmentService.getAssessmentQuestions(componentId);
            
            return ResponseEntity.ok(assessmentData);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new MessageResponse("Error loading assessment: " + e.getMessage()));
        }
    }
    
    /**
     * Start assessment attempt
     */
    @PostMapping("/{componentId}/start")
    public ResponseEntity<?> startAssessment(
            @PathVariable UUID componentId,
            Authentication authentication) {
        try {
            String username = authentication.getName();
            Users user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
                
            AssessmentAttempt attempt = assessmentService.startAssessment(user.getId(), componentId);
            
            return ResponseEntity.ok(Map.of(
                "attemptId", attempt.getId(),
                "attemptNumber", attempt.getAttemptNumber(),
                "startedAt", attempt.getStartedAt(),
                "message", "Assessment started"
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new MessageResponse("Error starting assessment: " + e.getMessage()));
        }
    }
    
    /**
     * Submit assessment
     */
    @PostMapping("/attempts/{attemptId}/submit")
    public ResponseEntity<?> submitAssessment(
            @PathVariable UUID attemptId,
            @RequestBody Map<String, Object> answers) {
        try {
            AssessmentResult result = assessmentService.submitAssessment(attemptId, answers);
            AssessmentResultResponse response = new AssessmentResultResponse(result);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new MessageResponse("Error submitting assessment: " + e.getMessage()));
        }
    }
    
    /**
     * Get user's assessment attempts
     */
    @GetMapping("/{componentId}/attempts")
    public ResponseEntity<?> getUserAttempts(
            @PathVariable UUID componentId,
            Authentication authentication) {
        try {
            String username = authentication.getName();
            Users user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
                
            List<AssessmentAttempt> attempts = assessmentService
                .getUserAttempts(user.getId(), componentId);
                
            List<Map<String, Object>> attemptResponses = attempts.stream()
                .map(attempt -> {
                    Map<String, Object> response = new HashMap<>();
                    response.put("attemptId", attempt.getId());
                    response.put("attemptNumber", attempt.getAttemptNumber());
                    response.put("score", attempt.getScore());
                    response.put("passed", attempt.getPassed());
                    response.put("startedAt", attempt.getStartedAt());
                    response.put("submittedAt", attempt.getSubmittedAt());
                    response.put("timeTakenSeconds", attempt.getTimeTakenSeconds());
                    return response;
                })
                .collect(Collectors.toList());
                
            return ResponseEntity.ok(Map.of(
                "attempts", attemptResponses,
                "totalAttempts", attempts.size(),
                "remainingAttempts", assessmentService.getRemainingAttempts(user.getId(), componentId)
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new MessageResponse("Error fetching attempts: " + e.getMessage()));
        }
    }
    
    /**
     * Get latest attempt
     */
    @GetMapping("/{componentId}/latest-attempt")
    public ResponseEntity<?> getLatestAttempt(
            @PathVariable UUID componentId,
            Authentication authentication) {
        try {
            String username = authentication.getName();
            Users user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
                
            AssessmentAttempt attempt = assessmentService
                .getLatestAttempt(user.getId(), componentId);
                
            if (attempt == null) {
                return ResponseEntity.ok(Map.of(
                    "hasAttempt", false,
                    "canRetry", true,
                    "remainingAttempts", assessmentService.getRemainingAttempts(user.getId(), componentId)
                ));
            }
            
            return ResponseEntity.ok(Map.of(
                "hasAttempt", true,
                "attemptId", attempt.getId(),
                "attemptNumber", attempt.getAttemptNumber(),
                "score", attempt.getScore(),
                "passed", attempt.getPassed(),
                "canRetry", assessmentService.canRetryAssessment(user.getId(), componentId),
                "remainingAttempts", assessmentService.getRemainingAttempts(user.getId(), componentId)
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new MessageResponse("Error fetching latest attempt: " + e.getMessage()));
        }
    }
    
    /**
     * Check if user can retry assessment
     */
    @GetMapping("/{componentId}/can-retry")
    public ResponseEntity<?> canRetryAssessment(
            @PathVariable UUID componentId,
            Authentication authentication) {
        try {
            String username = authentication.getName();
            Users user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
                
            boolean canRetry = assessmentService.canRetryAssessment(user.getId(), componentId);
            int remainingAttempts = assessmentService.getRemainingAttempts(user.getId(), componentId);
            
            return ResponseEntity.ok(Map.of(
                "canRetry", canRetry,
                "remainingAttempts", remainingAttempts
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new MessageResponse("Error checking retry status: " + e.getMessage()));
        }
    }
    
    /**
     * Check for incomplete attempts
     */
    @GetMapping("/incomplete")
    public ResponseEntity<?> getIncompleteAttempts(Authentication authentication) {
        try {
            String username = authentication.getName();
            Users user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
                
            List<Map<String, Object>> incompleteAttempts = assessmentService.getIncompleteAttempts(user.getId());
            
            return ResponseEntity.ok(Map.of(
                "incompleteAttempts", incompleteAttempts,
                "hasIncomplete", !incompleteAttempts.isEmpty()
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new MessageResponse("Error fetching incomplete attempts: " + e.getMessage()));
        }
    }
    
    /**
     * Auto-submit incomplete attempt
     */
    @PostMapping("/attempts/{attemptId}/auto-submit")
    public ResponseEntity<?> autoSubmitAssessment(
            @PathVariable UUID attemptId,
            Authentication authentication) {
        try {
            String username = authentication.getName();
            Users user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
                
            AssessmentResult result = assessmentService.autoSubmitAssessment(attemptId, user.getId());
            AssessmentResultResponse response = new AssessmentResultResponse(result);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new MessageResponse("Error auto-submitting assessment: " + e.getMessage()));
        }
    }
}