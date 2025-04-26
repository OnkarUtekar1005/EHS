package com.ehs.elearning.controller;

import com.ehs.elearning.model.ModuleComponent;
import com.ehs.elearning.model.TrainingModule;
import com.ehs.elearning.model.UserProgress;
import com.ehs.elearning.model.Users;
import com.ehs.elearning.payload.response.MessageResponse;
import com.ehs.elearning.repository.ModuleComponentRepository;
import com.ehs.elearning.repository.TrainingModuleRepository;
import com.ehs.elearning.repository.UserProgressRepository;
import com.ehs.elearning.repository.UserRepository;
import com.ehs.elearning.security.UserDetailsImpl;
import com.ehs.elearning.service.ProgressTrackingService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/progress")
public class ProgressController {

    @Autowired
    private UserProgressRepository progressRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private TrainingModuleRepository moduleRepository;
    
    @Autowired
    private ModuleComponentRepository componentRepository;
    
    @Autowired
    private ProgressTrackingService progressService;
    
    // Get progress for current user
    @GetMapping("/user")
    public ResponseEntity<?> getCurrentUserProgress() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        
        Map<String, Object> progress = progressService.getUserProgress(userDetails.getId());
        return ResponseEntity.ok(progress);
    }
    
    // Get progress for specific user (admin only, or self)
    @GetMapping("/user/{userId}")
    public ResponseEntity<?> getUserProgress(@PathVariable UUID userId) {
        // Get current user
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        
        // Only allow admins or the user themselves to access
        if (!userDetails.getId().equals(userId)
                && !userDetails.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"))) {
            return ResponseEntity.status(403).body(new MessageResponse("Not authorized to access this user's progress"));
        }
        
        Map<String, Object> progress = progressService.getUserProgress(userId);
        return ResponseEntity.ok(progress);
    }
    
    // Get progress for a specific module for all users (admin only)
    @GetMapping("/module/{moduleId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getModuleProgress(@PathVariable UUID moduleId) {
        return moduleRepository.findById(moduleId)
                .map(module -> {
                    List<UserProgress> progressList = progressRepository.findByModuleIdOrderByTimestampDesc(moduleId);
                    
                    // Group by user
                    Map<UUID, List<UserProgress>> progressByUser = progressList.stream()
                            .collect(Collectors.groupingBy(progress -> progress.getUser().getId()));
                    
                    // Format response
                    Map<String, Object> response = new HashMap<>();
                    response.put("moduleId", moduleId);
                    response.put("moduleTitle", module.getTitle());
                    response.put("userCount", progressByUser.size());
                    response.put("userProgress", progressByUser);
                    
                    return ResponseEntity.ok(response);
                })
                .orElse(ResponseEntity.notFound().build());
    }
    
    // Get progress for a specific user and module
    @GetMapping("/user/{userId}/module/{moduleId}")
    public ResponseEntity<?> getUserModuleProgress(@PathVariable UUID userId, @PathVariable UUID moduleId) {
        // Get current user
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        
        // Only allow admins or the user themselves to access
        if (!userDetails.getId().equals(userId)
                && !userDetails.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"))) {
            return ResponseEntity.status(403).body(new MessageResponse("Not authorized to access this user's progress"));
        }
        
        Map<String, Object> progress = progressService.getUserModuleProgress(userId, moduleId);
        return ResponseEntity.ok(progress);
    }
    
    // Start a module
    @PostMapping("/module/{moduleId}/start")
    public ResponseEntity<?> startModule(@PathVariable UUID moduleId) {
        // Get current user
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        UUID userId = userDetails.getId();
        
        return userRepository.findById(userId)
                .flatMap(user -> moduleRepository.findById(moduleId)
                        .map(module -> {
                            // Check if module is already started but not completed
                            boolean alreadyStarted = progressRepository.existsByUserIdAndModuleIdAndProgressType(
                                    userId, moduleId, "MODULE_STARTED");
                            boolean alreadyCompleted = progressRepository.existsByUserIdAndModuleIdAndProgressType(
                                    userId, moduleId, "MODULE_COMPLETED");
                            
                            if (alreadyCompleted) {
                                return ResponseEntity.ok(new MessageResponse("Module already completed"));
                            } else if (alreadyStarted) {
                                return ResponseEntity.ok(new MessageResponse("Module already in progress"));
                            }
                            
                            // Create progress record
                            UserProgress progress = new UserProgress(user, module, "MODULE_STARTED");
                            progressRepository.save(progress);
                            
                            return ResponseEntity.ok(new MessageResponse("Module started successfully"));
                        }))
                .orElse(ResponseEntity.notFound().build());
    }
    
    // Complete a component
    @PostMapping("/module/{moduleId}/component/{componentId}/complete")
    public ResponseEntity<?> completeComponent(@PathVariable UUID moduleId, @PathVariable UUID componentId,
                                               @RequestBody(required = false) Map<String, Object> request) {
        // Get current user
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        UUID userId = userDetails.getId();
        
        // Extract parameters and store them in final variables
        final Integer timeSpentValue = request != null && request.containsKey("timeSpent") ? 
            (Integer) request.get("timeSpent") : null;
        final Integer scoreValueFinal = request != null && request.containsKey("scoreValue") ? 
            (Integer) request.get("scoreValue") : null;
        
        return userRepository.findById(userId)
                .flatMap(user -> componentRepository.findById(componentId)
                        .filter(component -> component.getTrainingModule().getId().equals(moduleId))
                        .map(component -> {
                            // Create progress record
                            UserProgress progress = new UserProgress(user, component.getTrainingModule(), 
                                                                    component, "COMPONENT_COMPLETED");
                        
                            if (timeSpentValue != null) {
                                progress.setTimeSpent(timeSpentValue);
                            }
                            
                            if (scoreValueFinal != null) {
                                progress.setScoreValue(scoreValueFinal);
                            }
                            
                            progressRepository.save(progress);
                            
                            // Check if all components are completed to mark module as complete
                            List<ModuleComponent> allComponents = componentRepository
                                    .findByTrainingModuleOrderBySequenceOrderAsc(component.getTrainingModule());
                            
                            long completedCount = progressRepository
                                    .countCompletedComponentsByUserAndModule(userId, moduleId);
                            
                            boolean allCompleted = false;
                            
                            // Only count required components
                            long requiredCount = allComponents.stream()
                                    .filter(ModuleComponent::getRequiredToAdvance)
                                    .count();
                            
                            if (completedCount >= requiredCount) {
                                allCompleted = true;
                                
                                // Mark module as completed if not already
                                boolean alreadyCompleted = progressRepository
                                        .existsByUserIdAndModuleIdAndProgressType(userId, moduleId, "MODULE_COMPLETED");
                                
                                if (!alreadyCompleted) {
                                    UserProgress moduleProgress = new UserProgress(
                                            user, component.getTrainingModule(), "MODULE_COMPLETED");
                                    progressRepository.save(moduleProgress);
                                }
                            }
                            
                            Map<String, Object> response = new HashMap<>();
                            response.put("status", "success");
                            response.put("message", "Component completed successfully");
                            response.put("allComponentsCompleted", allCompleted);
                            
                            return ResponseEntity.ok(response);
                        }))
                .orElse(ResponseEntity.notFound().build());
    }
    
    // Track progress on a material
    @PostMapping("/module/{moduleId}/component/{componentId}/material/{materialId}/track")
    public ResponseEntity<?> trackMaterialProgress(
            @PathVariable UUID moduleId, 
            @PathVariable UUID componentId,
            @PathVariable UUID materialId,
            @RequestBody Map<String, Object> request) {
        
        // Get current user
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        UUID userId = userDetails.getId();
        
        Double progressValue = null;
        Integer timeSpent = null;
        
        // Extract parameters
        if (request.containsKey("progress")) {
            Object progressObj = request.get("progress");
            if (progressObj instanceof Double) {
                progressValue = (Double) progressObj;
            } else if (progressObj instanceof Integer) {
                progressValue = ((Integer) progressObj).doubleValue();
            }
        }
        
        if (request.containsKey("timeSpent")) {
            timeSpent = (Integer) request.get("timeSpent");
        }
        
        // Validate progress value
        if (progressValue == null || progressValue < 0 || progressValue > 100) {
            return ResponseEntity.badRequest()
                    .body(new MessageResponse("Invalid progress value. Must be between 0 and 100."));
        }
        
        // Find user, module, component, and material
        Optional<Users> userOpt = userRepository.findById(userId);
        Optional<TrainingModule> moduleOpt = moduleRepository.findById(moduleId);
        Optional<ModuleComponent> componentOpt = componentRepository.findById(componentId);
        
        if (userOpt.isPresent() && moduleOpt.isPresent() && componentOpt.isPresent()) {
            Users user = userOpt.get();
            TrainingModule module = moduleOpt.get();
            ModuleComponent component = componentOpt.get();
            
            // Validate component belongs to module
            if (!component.getTrainingModule().getId().equals(moduleId)) {
                return ResponseEntity.badRequest()
                        .body(new MessageResponse("Component does not belong to the specified module"));
            }
            
            // Create progress record
            UserProgress progress = new UserProgress(
                    user, module, component, null, "MATERIAL_PROGRESS", progressValue);
            
            if (timeSpent != null) {
                progress.setTimeSpent(timeSpent);
            }
            
            progressRepository.save(progress);
            
            // Check if progress is 100% to mark material as completed
            if (progressValue >= 100.0) {
                UserProgress completionProgress = new UserProgress(
                        user, module, component, null, "MATERIAL_COMPLETED", 100.0);
                
                if (timeSpent != null) {
                    completionProgress.setTimeSpent(timeSpent);
                }
                
                progressRepository.save(completionProgress);
            }
            
            return ResponseEntity.ok(new MessageResponse("Progress tracked successfully"));
        } else {
            return ResponseEntity.notFound().build();
        }
    }
    
    // Get user dashboard data
    @GetMapping("/user/dashboard")
    public ResponseEntity<?> getUserDashboard() {
        // Get current user
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        
        Map<String, Object> dashboard = progressService.getUserDashboard(userDetails.getId());
        return ResponseEntity.ok(dashboard);
    }
}