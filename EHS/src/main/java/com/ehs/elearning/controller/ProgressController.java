package com.ehs.elearning.controller;

import com.ehs.elearning.model.*;
import com.ehs.elearning.payload.request.ComponentCompletionRequest;
import com.ehs.elearning.payload.response.DashboardResponse;
import com.ehs.elearning.payload.response.MessageResponse;
import com.ehs.elearning.repository.*;
import com.ehs.elearning.security.UserDetailsImpl;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/progress")
public class ProgressController {

    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private TrainingModuleRepository moduleRepository;
    
    @Autowired
    private ModuleComponentRepository componentRepository;
    
    @Autowired
    private UserModuleProgressRepository moduleProgressRepository;
    
    @Autowired
    private UserComponentProgressRepository componentProgressRepository;
    
    // Get all module progress for a user
    @GetMapping("/user/{userId}")
    public ResponseEntity<?> getUserModuleProgress(@PathVariable UUID userId) {
        Optional<Users> userOpt = userRepository.findById(userId);
        if (!userOpt.isPresent()) {
            return ResponseEntity.notFound().build();
        }
        
        List<UserModuleProgress> progress = moduleProgressRepository.findByUser(userOpt.get());
        return ResponseEntity.ok(progress);
    }
    
    // Get all user progress for a module
    @GetMapping("/module/{moduleId}")
    public ResponseEntity<?> getModuleUserProgress(@PathVariable UUID moduleId) {
        Optional<TrainingModule> moduleOpt = moduleRepository.findById(moduleId);
        if (!moduleOpt.isPresent()) {
            return ResponseEntity.notFound().build();
        }
        
        List<UserModuleProgress> progress = moduleProgressRepository.findByTrainingModule(moduleOpt.get());
        return ResponseEntity.ok(progress);
    }
    
    // Get specific user-module progress
    @GetMapping("/user/{userId}/module/{moduleId}")
    public ResponseEntity<?> getUserModuleProgress(
            @PathVariable UUID userId, 
            @PathVariable UUID moduleId) {
        
        Optional<Users> userOpt = userRepository.findById(userId);
        if (!userOpt.isPresent()) {
            return ResponseEntity.notFound().build();
        }
        
        Optional<TrainingModule> moduleOpt = moduleRepository.findById(moduleId);
        if (!moduleOpt.isPresent()) {
            return ResponseEntity.notFound().build();
        }
        
        Users user = userOpt.get();
        TrainingModule module = moduleOpt.get();
        
        Optional<UserModuleProgress> progressOpt = moduleProgressRepository.findByUserAndTrainingModule(user, module);
        
        if (progressOpt.isPresent()) {
            return ResponseEntity.ok(progressOpt.get());
        } else {
            return ResponseEntity.ok(new UserModuleProgress(user, module));
        }
    }
    
    // Start module for current user - FIXED VERSION
    @PostMapping("/module/{moduleId}/start")
    public ResponseEntity<?> startModule(@PathVariable UUID moduleId) {
        // Get current user
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        
        // Find user
        Optional<Users> userOpt = userRepository.findById(userDetails.getId());
        if (!userOpt.isPresent()) {
            return ResponseEntity.badRequest().body(new MessageResponse("Error: User not found."));
        }
        
        // Find module
        Optional<TrainingModule> moduleOpt = moduleRepository.findById(moduleId);
        if (!moduleOpt.isPresent()) {
            return ResponseEntity.notFound().build();
        }
        
        Users user = userOpt.get();
        TrainingModule module = moduleOpt.get();
        
        // Check if progress already exists
        Optional<UserModuleProgress> existingProgressOpt = moduleProgressRepository.findByUserAndTrainingModule(user, module);
        
        UserModuleProgress progress;
        if (existingProgressOpt.isPresent()) {
            progress = existingProgressOpt.get();
        } else {
            progress = new UserModuleProgress(user, module);
        }
        
        // Update state if not already started
        if (progress.getState() == ProgressState.NOT_STARTED) {
            progress.setState(ProgressState.IN_PROGRESS);
        }
        
        // Find first component if not already set
        if (progress.getCurrentComponent() == null) {
            List<ModuleComponent> components = componentRepository.findByTrainingModuleOrderBySequenceOrderAsc(module);
            
            if (!components.isEmpty()) {
                progress.setCurrentComponent(components.get(0));
                
                // Create component progress for first component if it doesn't exist
                Optional<UserComponentProgress> existingComponentProgressOpt = 
                        componentProgressRepository.findByUserAndComponent(user, components.get(0));
                
                if (!existingComponentProgressOpt.isPresent()) {
                    UserComponentProgress componentProgress = new UserComponentProgress(user, components.get(0));
                    componentProgressRepository.save(componentProgress);
                }
            }
        }
        
        // Save progress
        UserModuleProgress savedProgress = moduleProgressRepository.save(progress);
        
        // Get all component progress for this module
        List<UserComponentProgress> componentProgresses = 
                componentProgressRepository.findByModuleAndUser(module, user);
        
        Map<UUID, UserComponentProgress> componentProgressMap = 
                componentProgresses.stream()
                        .collect(Collectors.toMap(
                                cp -> cp.getComponent().getId(), 
                                cp -> cp
                        ));
        
        // Return combined response
        Map<String, Object> response = new HashMap<>();
        response.put("moduleProgress", savedProgress);
        response.put("componentProgress", componentProgressMap);
        
        return ResponseEntity.ok(response);
    }
    
    // Mark component as complete
    @PostMapping("/module/{moduleId}/component/{componentId}/complete")
    public ResponseEntity<?> completeComponent(
            @PathVariable UUID moduleId,
            @PathVariable UUID componentId,
            @Valid @RequestBody ComponentCompletionRequest completionRequest) {
        
        // Get current user
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        
        // Find user
        Optional<Users> userOpt = userRepository.findById(userDetails.getId());
        if (!userOpt.isPresent()) {
            return ResponseEntity.badRequest().body(new MessageResponse("Error: User not found."));
        }
        
        // Find module
        Optional<TrainingModule> moduleOpt = moduleRepository.findById(moduleId);
        if (!moduleOpt.isPresent()) {
            return ResponseEntity.notFound().build();
        }
        
        // Find component
        Optional<ModuleComponent> componentOpt = componentRepository.findById(componentId);
        if (!componentOpt.isPresent()) {
            return ResponseEntity.notFound().build();
        }
        
        Users user = userOpt.get();
        TrainingModule module = moduleOpt.get();
        ModuleComponent component = componentOpt.get();
        
        // Verify component belongs to module
        if (!component.getTrainingModule().getId().equals(module.getId())) {
            return ResponseEntity.badRequest().body(
                    new MessageResponse("Component does not belong to the specified module"));
        }
        
        // Update/create component progress
        Optional<UserComponentProgress> existingComponentProgressOpt = 
                componentProgressRepository.findByUserAndComponent(user, component);
        
        UserComponentProgress componentProgress;
        if (existingComponentProgressOpt.isPresent()) {
            componentProgress = existingComponentProgressOpt.get();
        } else {
            componentProgress = new UserComponentProgress(user, component);
        }
        
        // Mark as completed
        componentProgress.setCompleted(true);
        
        // Update time spent
        if (completionRequest.getTimeSpent() != null) {
            componentProgress.addTimeSpent(completionRequest.getTimeSpent());
        }
        
        // Update score for assessment components
        if (component.getType() == ComponentType.PRE_ASSESSMENT || 
                component.getType() == ComponentType.POST_ASSESSMENT) {
            if (completionRequest.getScore() != null) {
                componentProgress.setScore(completionRequest.getScore());
            }
        }
        
        // Save component progress
        UserComponentProgress savedComponentProgress = 
                componentProgressRepository.save(componentProgress);
        
        // Update module progress
        Optional<UserModuleProgress> existingModuleProgressOpt = 
                moduleProgressRepository.findByUserAndTrainingModule(user, module);
        
        UserModuleProgress moduleProgress;
        if (existingModuleProgressOpt.isPresent()) {
            moduleProgress = existingModuleProgressOpt.get();
        } else {
            moduleProgress = new UserModuleProgress(user, module);
            moduleProgress.setState(ProgressState.IN_PROGRESS);
        }
        
        // Update time spent at module level
        if (completionRequest.getTimeSpent() != null) {
            moduleProgress.addTimeSpent(completionRequest.getTimeSpent());
        }
        
        // Store assessment scores
        if (component.getType() == ComponentType.PRE_ASSESSMENT && completionRequest.getScore() != null) {
            moduleProgress.setPreAssessmentScore(completionRequest.getScore().floatValue());
        } else if (component.getType() == ComponentType.POST_ASSESSMENT && completionRequest.getScore() != null) {
            moduleProgress.setPostAssessmentScore(completionRequest.getScore().floatValue());
        }
        
        // Find next component in sequence
        List<ModuleComponent> components = 
                componentRepository.findByTrainingModuleOrderBySequenceOrderAsc(module);
        
        int currentIndex = -1;
        for (int i = 0; i < components.size(); i++) {
            if (components.get(i).getId().equals(component.getId())) {
                currentIndex = i;
                break;
            }
        }
        
        // If there's a next component, set it as current
        boolean isLastComponent = currentIndex == components.size() - 1;
        ModuleComponent nextComponent = null;
        
        if (!isLastComponent) {
            nextComponent = components.get(currentIndex + 1);
            moduleProgress.setCurrentComponent(nextComponent);
            
            // Create component progress for next component if it doesn't exist
            Optional<UserComponentProgress> nextComponentProgressOpt = 
                    componentProgressRepository.findByUserAndComponent(user, nextComponent);
            
            if (!nextComponentProgressOpt.isPresent()) {
                UserComponentProgress newComponentProgress = new UserComponentProgress(user, nextComponent);
                componentProgressRepository.save(newComponentProgress);
            }
        }
        
        // Check if all components are completed
        Long completedComponents = 
                componentProgressRepository.countCompletedComponentsByModule(module, user);
        Long totalComponents = 
                componentProgressRepository.countTotalComponentsByModule(module);
        
        boolean allCompleted = completedComponents.equals(totalComponents);
        
        // Mark module as completed if all components are done
        if (allCompleted) {
            moduleProgress.setState(ProgressState.COMPLETED);
            moduleProgress.setCompletedAt(LocalDateTime.now());
        }
        
        // Save module progress
        UserModuleProgress savedModuleProgress = 
                moduleProgressRepository.save(moduleProgress);
        
        // Build response
        Map<String, Object> response = new HashMap<>();
        response.put("componentProgress", savedComponentProgress);
        response.put("moduleProgress", savedModuleProgress);
        response.put("isLastComponent", isLastComponent);
        response.put("nextComponent", nextComponent);
        response.put("allComponentsCompleted", allCompleted);
        
        return ResponseEntity.ok(response);
    }
    
    // Get progress summary for dashboard
    @GetMapping("/user/dashboard")
    public ResponseEntity<?> getDashboard() {
        // Get current user
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        
        Optional<Users> userOpt = userRepository.findById(userDetails.getId());
        if (!userOpt.isPresent()) {
            return ResponseEntity.badRequest().body(new MessageResponse("Error: User not found."));
        }
        
        Users user = userOpt.get();
        
        // Get all progress for user
        List<UserModuleProgress> allProgress = moduleProgressRepository.findByUser(user);
        
        // Count by state
        int inProgressCount = 0;
        int completedCount = 0;
        
        for (UserModuleProgress progress : allProgress) {
            if (progress.getState() == ProgressState.IN_PROGRESS) {
                inProgressCount++;
            } else if (progress.getState() == ProgressState.COMPLETED) {
                completedCount++;
            }
        }
        
        // Recent activity (last 5 updated)
        List<UserModuleProgress> recentProgress = allProgress.stream()
                .sorted(Comparator.comparing(UserModuleProgress::getLastAccessedAt).reversed())
                .limit(5)
                .collect(Collectors.toList());
        
        List<Map<String, Object>> recentActivity = new ArrayList<>();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("MMM dd, yyyy");
        
        for (UserModuleProgress progress : recentProgress) {
            Map<String, Object> activity = new HashMap<>();
            activity.put("moduleId", progress.getTrainingModule().getId());
            activity.put("title", progress.getTrainingModule().getTitle());
            activity.put("state", progress.getState());
            activity.put("lastAccessedAt", progress.getLastAccessedAt().format(formatter));
            
            // Calculate percentage complete based on components
            Long completedComponents = 
                    componentProgressRepository.countCompletedComponentsByModule(progress.getTrainingModule(), user);
            Long totalComponents = 
                    componentProgressRepository.countTotalComponentsByModule(progress.getTrainingModule());
            
            int percentComplete = totalComponents > 0 
                    ? (int) ((completedComponents * 100) / totalComponents) 
                    : 0;
            
            activity.put("percentComplete", percentComplete);
            activity.put("domainName", progress.getTrainingModule().getDomain().getName());
            
            recentActivity.add(activity);
        }
        
        // Upcoming/recommended modules
        List<TrainingModule> allModules = moduleRepository.findByStatus(ModuleStatus.PUBLISHED);
        List<UUID> inProgressModuleIds = allProgress.stream()
                .map(p -> p.getTrainingModule().getId())
                .collect(Collectors.toList());
        
        List<TrainingModule> recommendedModules = allModules.stream()
                .filter(m -> !inProgressModuleIds.contains(m.getId()))
                .limit(3)
                .collect(Collectors.toList());
        
        List<Map<String, Object>> upcomingModules = new ArrayList<>();
        
        for (TrainingModule module : recommendedModules) {
            Map<String, Object> upcoming = new HashMap<>();
            upcoming.put("moduleId", module.getId());
            upcoming.put("title", module.getTitle());
            upcoming.put("description", module.getDescription());
            upcoming.put("estimatedDuration", module.getEstimatedDuration());
            upcoming.put("domainName", module.getDomain().getName());
            
            upcomingModules.add(upcoming);
        }
        
        // Performance summary
        Map<String, Object> performanceSummary = new HashMap<>();
        
        // Average improvement across all completed modules
        double avgImprovement = allProgress.stream()
                .filter(p -> p.getImprovementScore() != null)
                .mapToDouble(p -> p.getImprovementScore())
                .average()
                .orElse(0.0);
        
        // Average post-assessment score
        double avgPostScore = allProgress.stream()
                .filter(p -> p.getPostAssessmentScore() != null)
                .mapToDouble(p -> p.getPostAssessmentScore())
                .average()
                .orElse(0.0);
        
        performanceSummary.put("averageImprovement", Math.round(avgImprovement * 10) / 10.0);
        performanceSummary.put("averagePostScore", Math.round(avgPostScore * 10) / 10.0);
        performanceSummary.put("totalModulesCompleted", completedCount);
        
        // Build response
        DashboardResponse dashboard = new DashboardResponse();
        dashboard.setInProgressCount(inProgressCount);
        dashboard.setCompletedCount(completedCount);
        dashboard.setTotalModules(allModules.size());
        dashboard.setRecentActivity(recentActivity);
        dashboard.setUpcomingModules(upcomingModules);
        dashboard.setPerformanceSummary(performanceSummary);
        
        return ResponseEntity.ok(dashboard);
    }
}