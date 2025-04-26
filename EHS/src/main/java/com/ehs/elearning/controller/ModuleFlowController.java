package com.ehs.elearning.controller;

import com.ehs.elearning.model.*;
import com.ehs.elearning.payload.response.MessageResponse;
import com.ehs.elearning.repository.*;
import com.ehs.elearning.security.UserDetailsImpl;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Controller for handling module progression flow for users
 */
@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/course/flow")
public class ModuleFlowController {

    @Autowired
    private TrainingModuleRepository moduleRepository;
    
    @Autowired
    private ModuleComponentRepository componentRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private MaterialProgressRepository materialProgressRepository;
    
    /**
     * Get the current state of a module for a user, including completion status
     * of each component and the next component to show
     */
    @GetMapping("/modules/{moduleId}/state")
    public ResponseEntity<?> getModuleState(@PathVariable UUID moduleId) {
        try {
            // Get current authenticated user
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
            UUID userId = userDetails.getId();
            
            Optional<TrainingModule> moduleOpt = moduleRepository.findById(moduleId);
            if (!moduleOpt.isPresent()) {
                return ResponseEntity.notFound().build();
            }
            
            TrainingModule module = moduleOpt.get();
            
            // Get all components in order
            List<ModuleComponent> components = componentRepository.findByTrainingModuleOrderBySequenceOrderAsc(module);
            
            // Get user
            Optional<Users> userOpt = userRepository.findById(userId);
            if (!userOpt.isPresent()) {
                return ResponseEntity.badRequest().body(new MessageResponse("User not found"));
            }
            
            Users user = userOpt.get();
            
            // Map to store component completion status
            Map<String, Object> result = new HashMap<>();
            result.put("moduleId", moduleId);
            result.put("moduleTitle", module.getTitle());
            
            List<Map<String, Object>> componentDataList = new ArrayList<>();
            
            // Track the next component that needs to be completed
            ModuleComponent nextComponent = null;
            boolean foundNextComponent = false;
            
            for (ModuleComponent component : components) {
                Map<String, Object> componentData = new HashMap<>();
                componentData.put("id", component.getId());
                componentData.put("title", component.getTitle());
                componentData.put("type", component.getType());
                componentData.put("sequenceOrder", component.getSequenceOrder());
                componentData.put("requiredToAdvance", component.getRequiredToAdvance());
                
                boolean isCompleted = false;
                
                // Check completion based on component type
                if (component.getType() == ComponentType.LEARNING_MATERIAL || 
                    component.getType() == ComponentType.LEARNING_MATERIALS) {
                    
                    // For learning materials, check if all materials are completed
                    Long completedMaterials = materialProgressRepository.countCompletedMaterialsInComponent(component, user);
                    Long totalMaterials = materialProgressRepository.countTotalMaterialsInComponent(component);
                    
                    componentData.put("completedMaterials", completedMaterials);
                    componentData.put("totalMaterials", totalMaterials);
                    
                    isCompleted = completedMaterials.equals(totalMaterials) && totalMaterials > 0;
                }
                // For assessments, we would check assessment completion
                // This would be implemented with another repository method
                
                componentData.put("completed", isCompleted);
                componentDataList.add(componentData);
                
                // Find the next component that needs to be completed
                if (!foundNextComponent && !isCompleted && component.getRequiredToAdvance()) {
                    nextComponent = component;
                    foundNextComponent = true;
                }
            }
            
            result.put("components", componentDataList);
            
            // Add next component info if found
            if (nextComponent != null) {
                result.put("nextComponentId", nextComponent.getId());
                result.put("nextComponentType", nextComponent.getType());
            } else {
                // All components completed or no required components
                result.put("moduleCompleted", true);
            }
            
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new MessageResponse("Error retrieving module state: " + e.getMessage()));
        }
    }
    
    /**
     * Get the next component that a user should view in a module
     */
    @GetMapping("/modules/{moduleId}/next")
    public ResponseEntity<?> getNextComponent(@PathVariable UUID moduleId) {
        try {
            // Get current authenticated user
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
            UUID userId = userDetails.getId();
            
            Optional<TrainingModule> moduleOpt = moduleRepository.findById(moduleId);
            if (!moduleOpt.isPresent()) {
                return ResponseEntity.notFound().build();
            }
            
            TrainingModule module = moduleOpt.get();
            
            // Get all components in order
            List<ModuleComponent> components = componentRepository.findByTrainingModuleOrderBySequenceOrderAsc(module);
            
            // Get user
            Optional<Users> userOpt = userRepository.findById(userId);
            if (!userOpt.isPresent()) {
                return ResponseEntity.badRequest().body(new MessageResponse("User not found"));
            }
            
            Users user = userOpt.get();
            
            // Find the next component that needs to be completed
            for (ModuleComponent component : components) {
                boolean isCompleted = false;
                
                // Check completion based on component type
                if (component.getType() == ComponentType.LEARNING_MATERIAL || 
                    component.getType() == ComponentType.LEARNING_MATERIALS) {
                    
                    // For learning materials, check if all materials are completed
                    Long completedMaterials = materialProgressRepository.countCompletedMaterialsInComponent(component, user);
                    Long totalMaterials = materialProgressRepository.countTotalMaterialsInComponent(component);
                    
                    isCompleted = completedMaterials.equals(totalMaterials) && totalMaterials > 0;
                }
                // For assessments, we would check assessment completion
                // This would be implemented with another repository method
                
                if (!isCompleted && component.getRequiredToAdvance()) {
                    // Return this component as the next one to complete
                    Map<String, Object> result = new HashMap<>();
                    result.put("componentId", component.getId());
                    result.put("componentType", component.getType());
                    result.put("title", component.getTitle());
                    
                    return ResponseEntity.ok(result);
                }
            }
            
            // If we get here, all required components are completed
            return ResponseEntity.ok(Map.of(
                "moduleCompleted", true,
                "message", "All required components have been completed"
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new MessageResponse("Error retrieving next component: " + e.getMessage()));
        }
    }
    
    /**
     * Mark a specific component as completed by a user
     */
    @PostMapping("/components/{componentId}/complete")
    public ResponseEntity<?> completeComponent(
            @PathVariable UUID componentId,
            @RequestBody(required = false) Map<String, Object> data) {
        
        try {
            // Get current authenticated user
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
            UUID userId = userDetails.getId();
            
            Optional<ModuleComponent> componentOpt = componentRepository.findById(componentId);
            if (!componentOpt.isPresent()) {
                return ResponseEntity.notFound().build();
            }
            
            ModuleComponent component = componentOpt.get();
            
            // Handle completion based on component type
            // For now this is a placeholder - in a real implementation you would:
            // 1. For learning materials: ensure all materials are marked complete
            // 2. For assessments: record the assessment results
            
            return ResponseEntity.ok(new MessageResponse("Component marked as completed"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new MessageResponse("Error completing component: " + e.getMessage()));
        }
    }
    
    /**
     * Get the learning flow for a module (what components to show and in what order)
     */
    @GetMapping("/modules/{moduleId}/flow")
    public ResponseEntity<?> getModuleFlow(@PathVariable UUID moduleId) {
        try {
            Optional<TrainingModule> moduleOpt = moduleRepository.findById(moduleId);
            if (!moduleOpt.isPresent()) {
                return ResponseEntity.notFound().build();
            }
            
            TrainingModule module = moduleOpt.get();
            
            // Get all components in order
            List<ModuleComponent> components = componentRepository.findByTrainingModuleOrderBySequenceOrderAsc(module);
            
            List<Map<String, Object>> componentList = components.stream()
                .map(component -> {
                    Map<String, Object> componentData = new HashMap<>();
                    componentData.put("id", component.getId());
                    componentData.put("title", component.getTitle());
                    componentData.put("type", component.getType().toString());
                    componentData.put("sequenceOrder", component.getSequenceOrder());
                    componentData.put("requiredToAdvance", component.getRequiredToAdvance());
                    componentData.put("estimatedDuration", component.getEstimatedDuration());
                    return componentData;
                })
                .collect(Collectors.toList());
            
            Map<String, Object> result = new HashMap<>();
            result.put("moduleId", moduleId);
            result.put("moduleTitle", module.getTitle());
            result.put("components", componentList);
            
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new MessageResponse("Error retrieving module flow: " + e.getMessage()));
        }
    }
}