package com.ehs.elearning.controller;

import com.ehs.elearning.model.AssessmentAttempt;
import com.ehs.elearning.model.ComponentProgress;
import com.ehs.elearning.model.ComponentProgressStatus;
import com.ehs.elearning.model.Users;
import com.ehs.elearning.payload.response.MessageResponse;
import com.ehs.elearning.repository.AssessmentAttemptRepository;
import com.ehs.elearning.repository.ComponentProgressRepository;
import com.ehs.elearning.repository.CourseComponentRepository;
import com.ehs.elearning.repository.UserRepository;
import com.ehs.elearning.service.ProgressService;
import com.ehs.elearning.service.UserAssessmentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v2/admin/assessments")
@CrossOrigin(origins = "*", maxAge = 3600)
@PreAuthorize("hasRole('ADMIN')")
public class AdminAssessmentController {

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

    @Autowired
    private UserAssessmentService assessmentService;

    /**
     * Get all assessment attempts with filtering options
     */
    @GetMapping("/attempts")
    public ResponseEntity<?> getAllAttempts(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) UUID userId,
            @RequestParam(required = false) UUID componentId,
            @RequestParam(required = false) UUID courseId,
            @RequestParam(required = false) UUID domainId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        
        try {
            List<Map<String, Object>> attempts = new ArrayList<>();
            
            // Get all attempts from repository
            List<AssessmentAttempt> allAttempts;
            
            if (userId != null) {
                allAttempts = attemptRepository.findByUserIdOrderByStartedAtDesc(userId);
            } else if (componentId != null) {
                allAttempts = attemptRepository.findByComponentIdOrderByStartedAtDesc(componentId);
            } else {
                allAttempts = attemptRepository.findAllOrderByStartedAtDesc();
            }
            
            // Apply filters
            for (AssessmentAttempt attempt : allAttempts) {
                // Skip if no status match
                if (status != null) {
                    boolean passed = attempt.getPassed() != null && attempt.getPassed();
                    if ("PASSED".equals(status) && !passed) continue;
                    if ("FAILED".equals(status) && passed) continue;
                }
                
                // Skip if no course match
                if (courseId != null && !attempt.getComponent().getCourse().getId().equals(courseId)) {
                    continue;
                }
                
                // Skip if no domain match
                if (domainId != null && !attempt.getComponent().getCourse().getDomain().getId().equals(domainId)) {
                    continue;
                }
                
                // Create response object
                Map<String, Object> attemptData = new HashMap<>();
                attemptData.put("id", attempt.getId());
                attemptData.put("userId", attempt.getUser().getId());
                attemptData.put("username", attempt.getUser().getUsername());
                attemptData.put("email", attempt.getUser().getEmail());
                attemptData.put("componentId", attempt.getComponent().getId());
                attemptData.put("componentTitle", attempt.getComponent().getData().get("title"));
                attemptData.put("componentType", attempt.getComponent().getType());
                attemptData.put("courseId", attempt.getComponent().getCourse().getId());
                attemptData.put("courseTitle", attempt.getComponent().getCourse().getTitle());
                attemptData.put("domainId", attempt.getComponent().getCourse().getDomain().getId());
                attemptData.put("domainName", attempt.getComponent().getCourse().getDomain().getName());
                attemptData.put("attemptNumber", attempt.getAttemptNumber());
                attemptData.put("startedAt", attempt.getStartedAt());
                attemptData.put("submittedAt", attempt.getSubmittedAt());
                attemptData.put("score", attempt.getScore());
                attemptData.put("passed", attempt.getPassed());
                
                // Get component progress
                componentProgressRepository.findByUserIdAndComponentId(
                    attempt.getUser().getId(), attempt.getComponent().getId()
                ).ifPresent(progress -> {
                    attemptData.put("progressStatus", progress.getStatus());
                    attemptData.put("progressScore", progress.getScore());
                    attemptData.put("attempts", progress.getAttempts());
                });
                
                // Get remaining attempts
                int remainingAttempts = assessmentService.getRemainingAttempts(
                    attempt.getUser().getId(), attempt.getComponent().getId());
                attemptData.put("remainingAttempts", remainingAttempts);
                
                attempts.add(attemptData);
            }
            
            // Pagination
            int total = attempts.size();
            int fromIndex = Math.min(page * size, total);
            int toIndex = Math.min(fromIndex + size, total);
            
            List<Map<String, Object>> paginatedAttempts = 
                attempts.subList(fromIndex, toIndex);
            
            Map<String, Object> response = new HashMap<>();
            response.put("attempts", paginatedAttempts);
            response.put("totalItems", total);
            response.put("totalPages", (int) Math.ceil((double) total / size));
            response.put("currentPage", page);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new MessageResponse("Error retrieving assessment attempts: " + e.getMessage()));
        }
    }
    
    /**
     * Get user assessment summary - for admin dashboard
     */
    @GetMapping("/summary")
    public ResponseEntity<?> getAssessmentSummary() {
        try {
            // Get counts
            long totalAttempts = attemptRepository.count();
            long passedAttempts = attemptRepository.countByPassedTrue();
            long failedAttempts = attemptRepository.countByPassedFalse();
            
            // Top failing components
            List<Map<String, Object>> topFailingComponents = attemptRepository.findTopFailingComponents();
            
            Map<String, Object> summary = new HashMap<>();
            summary.put("totalAttempts", totalAttempts);
            summary.put("passedAttempts", passedAttempts);
            summary.put("failedAttempts", failedAttempts);
            summary.put("topFailingComponents", topFailingComponents);
            
            return ResponseEntity.ok(summary);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new MessageResponse("Error retrieving assessment summary: " + e.getMessage()));
        }
    }
    
    /**
     * Reset user assessment attempts
     */
    @PostMapping("/{componentId}/users/{userId}/reset")
    public ResponseEntity<?> resetAttempts(
            @PathVariable UUID componentId,
            @PathVariable UUID userId) {
        try {
            // Get user and component
            Users user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
                
            // Delete all attempts for this user and component
            List<AssessmentAttempt> attempts = attemptRepository.findByUserIdAndComponentId(userId, componentId);
            attemptRepository.deleteAll(attempts);
            
            // Reset component progress
            ComponentProgress progress = componentProgressRepository
                .findByUserIdAndComponentId(userId, componentId)
                .orElse(null);
                
            if (progress != null) {
                progress.setStatus(ComponentProgressStatus.NOT_STARTED);
                progress.setAttempts(0);
                progress.setScore(null);
                progress.setProgressPercentage(BigDecimal.ZERO);
                componentProgressRepository.save(progress);
            }
            
            return ResponseEntity.ok(new MessageResponse("Assessment attempts reset successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new MessageResponse("Error resetting attempts: " + e.getMessage()));
        }
    }
    
    /**
     * Manually mark assessment as passed
     */
    @PostMapping("/{componentId}/users/{userId}/pass")
    public ResponseEntity<?> markAsPassed(
            @PathVariable UUID componentId,
            @PathVariable UUID userId,
            @RequestParam(defaultValue = "70") int score) {
        try {
            // Get user and component
            Users user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
                
            // Get component progress
            ComponentProgress progress = componentProgressRepository
                .findByUserIdAndComponentId(userId, componentId)
                .orElseThrow(() -> new RuntimeException("Component progress not found"));
                
            // Mark as completed with the given score
            progress.setStatus(ComponentProgressStatus.COMPLETED);
            progress.setScore(score);
            progress.markAsCompleted(); // This sets progressPercentage to 100 
            componentProgressRepository.save(progress);
            
            // Call the progress service to update course progress as well
            progressService.completeComponent(userId, componentId, score);
            
            return ResponseEntity.ok(new MessageResponse("Assessment marked as passed successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new MessageResponse("Error marking assessment as passed: " + e.getMessage()));
        }
    }
}