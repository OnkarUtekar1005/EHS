package com.ehs.elearning.controller;

import com.ehs.elearning.model.ComponentProgress;
import com.ehs.elearning.model.ComponentProgressStatus;
import com.ehs.elearning.model.ProgressStatus;
import com.ehs.elearning.model.UserCourseProgress;
import com.ehs.elearning.model.Users;
import com.ehs.elearning.payload.response.ComponentProgressResponse;
import com.ehs.elearning.payload.response.MessageResponse;
import com.ehs.elearning.payload.response.ProgressResponse;
import com.ehs.elearning.repository.UserRepository;
import com.ehs.elearning.service.ProgressService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v2/user/progress")
@PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
public class UserProgressController {
    
    @Autowired
    private ProgressService progressService;
    
    @Autowired
    private UserRepository userRepository;
    
    /**
     * Get all user's course progress
     */
    @GetMapping("/courses")
    public ResponseEntity<?> getUserCourseProgress(Authentication authentication) {
        try {
            String username = authentication.getName();
            Users user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
                
            List<UserCourseProgress> progresses = progressService.getUserEnrolledCourses(user.getId());
            
            List<ProgressResponse> responses = progresses.stream()
                .map(progress -> {
                    ProgressResponse response = new ProgressResponse(progress);
                    // Add component counts
                    List<ComponentProgress> components = progressService
                        .getCourseComponentProgress(user.getId(), progress.getCourse().getId());
                    response.setTotalComponents(components.size());
                    response.setCompletedComponents((int) components.stream()
                        .filter(cp -> cp.getStatus() == ComponentProgressStatus.COMPLETED)
                        .count());
                    return response;
                })
                .collect(Collectors.toList());
                
            return ResponseEntity.ok(Map.of(
                "progresses", responses,
                "count", responses.size()
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new MessageResponse("Error fetching progress: " + e.getMessage()));
        }
    }
    
    /**
     * Get specific course progress with component details
     */
    @GetMapping("/courses/{courseId}")
    public ResponseEntity<?> getCourseProgress(
            @PathVariable UUID courseId,
            Authentication authentication) {
        try {
            String username = authentication.getName();
            Users user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
                
            UserCourseProgress courseProgress = progressService.getCourseProgress(user.getId(), courseId);
            if (courseProgress == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new MessageResponse("Course progress not found"));
            }
            
            List<ComponentProgress> componentProgresses = progressService
                .getCourseComponentProgress(user.getId(), courseId);
                
            ProgressResponse progressResponse = new ProgressResponse(courseProgress);
            progressResponse.setTotalComponents(componentProgresses.size());
            progressResponse.setCompletedComponents((int) componentProgresses.stream()
                .filter(cp -> cp.getStatus() == ComponentProgressStatus.COMPLETED)
                .count());
                
            List<ComponentProgressResponse> componentResponses = componentProgresses.stream()
                .map(ComponentProgressResponse::new)
                .collect(Collectors.toList());
                
            return ResponseEntity.ok(Map.of(
                "courseProgress", progressResponse,
                "componentProgresses", componentResponses
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new MessageResponse("Error fetching course progress: " + e.getMessage()));
        }
    }
    
    /**
     * Enroll in a course
     */
    @PostMapping("/courses/{courseId}/enroll")
    public ResponseEntity<?> enrollInCourse(
            @PathVariable UUID courseId,
            Authentication authentication) {
        try {
            String username = authentication.getName();
            Users user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
                
            UserCourseProgress progress = progressService.enrollInCourse(user.getId(), courseId);
            
            // Verify component progress exists
            List<ComponentProgress> componentProgresses = progressService
                .getCourseComponentProgress(user.getId(), courseId);
            
            return ResponseEntity.ok(Map.of(
                "message", "Successfully enrolled in course",
                "progress", new ProgressResponse(progress),
                "componentCount", componentProgresses.size()
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new MessageResponse("Error enrolling in course: " + e.getMessage()));
        }
    }
    
    /**
     * Start a component
     */
    @PostMapping("/components/{componentId}/start")
    public ResponseEntity<?> startComponent(
            @PathVariable UUID componentId,
            Authentication authentication) {
        try {
            String username = authentication.getName();
            Users user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
                
            ComponentProgress progress = progressService.startComponent(user.getId(), componentId);
            
            return ResponseEntity.ok(Map.of(
                "message", "Component started",
                "progress", new ComponentProgressResponse(progress)
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new MessageResponse("Error starting component: " + e.getMessage()));
        }
    }
    
    /**
     * Update component progress (for materials)
     */
    @PutMapping("/components/{componentId}/progress")
    public ResponseEntity<?> updateComponentProgress(
            @PathVariable UUID componentId,
            @RequestBody Map<String, Object> request,
            Authentication authentication) {
        try {
            String username = authentication.getName();
            Users user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
                
            BigDecimal progressPercentage = new BigDecimal(request.get("progressPercentage").toString());
            
            ComponentProgress progress = progressService
                .updateComponentProgress(user.getId(), componentId, progressPercentage);
            
            return ResponseEntity.ok(Map.of(
                "message", "Progress updated",
                "progress", new ComponentProgressResponse(progress)
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new MessageResponse("Error updating progress: " + e.getMessage()));
        }
    }
    
    /**
     * Complete a component
     */
    @PostMapping("/components/{componentId}/complete")
    public ResponseEntity<?> completeComponent(
            @PathVariable UUID componentId,
            @RequestBody(required = false) Map<String, Object> request,
            Authentication authentication) {
        try {
            String username = authentication.getName();
            Users user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
                
            Integer score = null;
            if (request != null && request.containsKey("score")) {
                score = Integer.valueOf(request.get("score").toString());
            }
            
            ComponentProgress progress = progressService.completeComponent(user.getId(), componentId, score);
            
            return ResponseEntity.ok(Map.of(
                "message", "Component completed",
                "progress", new ComponentProgressResponse(progress)
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new MessageResponse("Error completing component: " + e.getMessage()));
        }
    }
    
    /**
     * Update time spent on a component
     */
    @PutMapping("/components/{componentId}/time")
    public ResponseEntity<?> updateTimeSpent(
            @PathVariable UUID componentId,
            @RequestBody Map<String, Object> request,
            Authentication authentication) {
        try {
            String username = authentication.getName();
            Users user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
                
            Long additionalSeconds = Long.valueOf(request.get("additionalSeconds").toString());
            
            ComponentProgress progress = progressService
                .updateTimeSpent(user.getId(), componentId, additionalSeconds);
            
            return ResponseEntity.ok(Map.of(
                "message", "Time updated",
                "progress", new ComponentProgressResponse(progress)
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new MessageResponse("Error updating time: " + e.getMessage()));
        }
    }
    
    /**
     * Get courses by status
     */
    @GetMapping("/courses/status/{status}")
    public ResponseEntity<?> getCoursesByStatus(
            @PathVariable String status,
            Authentication authentication) {
        try {
            String username = authentication.getName();
            Users user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
                
            ProgressStatus progressStatus = ProgressStatus.valueOf(status.toUpperCase());
            List<UserCourseProgress> progresses = progressService
                .getUserCoursesByStatus(user.getId(), progressStatus);
                
            List<ProgressResponse> responses = progresses.stream()
                .map(ProgressResponse::new)
                .collect(Collectors.toList());
                
            return ResponseEntity.ok(Map.of(
                "progresses", responses,
                "count", responses.size()
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new MessageResponse("Error fetching courses: " + e.getMessage()));
        }
    }
    
    /**
     * Check if user can access a component
     */
    @GetMapping("/components/{componentId}/access")
    public ResponseEntity<?> checkComponentAccess(
            @PathVariable UUID componentId,
            Authentication authentication) {
        try {
            String username = authentication.getName();
            Users user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
                
            boolean canAccess = progressService.canAccessComponent(user.getId(), componentId);
            
            return ResponseEntity.ok(Map.of(
                "canAccess", canAccess,
                "componentId", componentId
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new MessageResponse("Error checking access: " + e.getMessage()));
        }
    }
}