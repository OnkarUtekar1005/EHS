package com.ehs.elearning.controller;

import com.ehs.elearning.model.ModuleComponent;
import com.ehs.elearning.model.TrainingModule;
import com.ehs.elearning.payload.request.ComponentRequest;
import com.ehs.elearning.payload.response.MessageResponse;
import com.ehs.elearning.repository.ModuleComponentRepository;
import com.ehs.elearning.repository.TrainingModuleRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api")
public class ModuleComponentController {

    @Autowired
    private ModuleComponentRepository componentRepository;
    
    @Autowired
    private TrainingModuleRepository moduleRepository;
    
    // Get all components for a module
    @GetMapping("/modules/{moduleId}/components")
    public ResponseEntity<?> getComponentsByModule(@PathVariable UUID moduleId) {
        return moduleRepository.findById(moduleId)
                .map(module -> {
                    List<ModuleComponent> components = componentRepository.findByTrainingModuleOrderBySequenceOrderAsc(module);
                    return ResponseEntity.ok(components);
                })
                .orElse(ResponseEntity.notFound().build());
    }
    
    // Get component by ID
    @GetMapping("/components/{id}")
    public ResponseEntity<?> getComponentById(@PathVariable UUID id) {
        return componentRepository.findById(id)
                .map(component -> ResponseEntity.ok(component))
                .orElse(ResponseEntity.notFound().build());
    }
    
    // Add component to module
    @PostMapping("/modules/{moduleId}/components")
    public ResponseEntity<?> addComponentToModule(
            @PathVariable UUID moduleId,
            @Valid @RequestBody ComponentRequest componentRequest) {
        
        return moduleRepository.findById(moduleId)
                .map(module -> {
                    // Create new component
                    ModuleComponent component = new ModuleComponent();
                    
                    // Set properties
                    component.setTrainingModule(module);
                    component.setType(componentRequest.getType());
                    component.setTitle(componentRequest.getTitle());
                    component.setDescription(componentRequest.getDescription());
                    component.setContent(componentRequest.getContent());
                    component.setRequiredToAdvance(componentRequest.getRequiredToAdvance() != null ? 
                                                  componentRequest.getRequiredToAdvance() : true);
                    component.setEstimatedDuration(componentRequest.getEstimatedDuration());
                    
                    // Handle sequence order
                    if (componentRequest.getSequenceOrder() == null) {
                        List<ModuleComponent> existingComponents = componentRepository.findByTrainingModuleOrderBySequenceOrderAsc(module);
                        component.setSequenceOrder(existingComponents.size() + 1);
                    } else {
                        component.setSequenceOrder(componentRequest.getSequenceOrder());
                        
                        // Shift other components if inserting in the middle
                        List<ModuleComponent> existingComponents = componentRepository.findByTrainingModuleOrderBySequenceOrderAsc(module);
                        for (ModuleComponent existing : existingComponents) {
                            if (existing.getSequenceOrder() >= component.getSequenceOrder()) {
                                existing.setSequenceOrder(existing.getSequenceOrder() + 1);
                                componentRepository.save(existing);
                            }
                        }
                    }
                    
                    ModuleComponent savedComponent = componentRepository.save(component);
                    return ResponseEntity.ok(savedComponent);
                })
                .orElse(ResponseEntity.notFound().build());
    }
    
    // Update component
    @PutMapping("/components/{id}")
    public ResponseEntity<?> updateComponent(
            @PathVariable UUID id,
            @Valid @RequestBody ComponentRequest componentRequest) {
        
        return componentRepository.findById(id)
                .map(component -> {
                    // Update basic properties
                    component.setTitle(componentRequest.getTitle());
                    component.setDescription(componentRequest.getDescription());
                    component.setType(componentRequest.getType());
                    component.setContent(componentRequest.getContent());
                    
                    if (componentRequest.getRequiredToAdvance() != null) {
                        component.setRequiredToAdvance(componentRequest.getRequiredToAdvance());
                    }
                    
                    if (componentRequest.getEstimatedDuration() != null) {
                        component.setEstimatedDuration(componentRequest.getEstimatedDuration());
                    }
                    
                    // Handle sequence order change if needed
                    if (componentRequest.getSequenceOrder() != null && 
                            !componentRequest.getSequenceOrder().equals(component.getSequenceOrder())) {
                        
                        TrainingModule module = component.getTrainingModule();
                        int oldOrder = component.getSequenceOrder();
                        int newOrder = componentRequest.getSequenceOrder();
                        
                        List<ModuleComponent> components = componentRepository.findByTrainingModuleOrderBySequenceOrderAsc(module);
                        
                        for (ModuleComponent c : components) {
                            if (c.getId().equals(component.getId())) {
                                continue; // Skip the component being updated
                            }
                            
                            if (oldOrder < newOrder) { // Moving down
                                if (c.getSequenceOrder() > oldOrder && c.getSequenceOrder() <= newOrder) {
                                    c.setSequenceOrder(c.getSequenceOrder() - 1);
                                    componentRepository.save(c);
                                }
                            } else { // Moving up
                                if (c.getSequenceOrder() >= newOrder && c.getSequenceOrder() < oldOrder) {
                                    c.setSequenceOrder(c.getSequenceOrder() + 1);
                                    componentRepository.save(c);
                                }
                            }
                        }
                        
                        component.setSequenceOrder(newOrder);
                    }
                    
                    ModuleComponent updatedComponent = componentRepository.save(component);
                    return ResponseEntity.ok(updatedComponent);
                })
                .orElse(ResponseEntity.notFound().build());
    }
    
    // Delete component
    @DeleteMapping("/components/{id}")
    public ResponseEntity<?> deleteComponent(@PathVariable UUID id) {
        return componentRepository.findById(id)
                .map(component -> {
                    // Get the module and sequence order before deletion
                    TrainingModule module = component.getTrainingModule();
                    int deletedOrder = component.getSequenceOrder();
                    
                    // Delete the component
                    componentRepository.delete(component);
                    
                    // Reorder remaining components
                    List<ModuleComponent> remainingComponents = componentRepository.findByTrainingModuleOrderBySequenceOrderAsc(module);
                    for (ModuleComponent c : remainingComponents) {
                        if (c.getSequenceOrder() > deletedOrder) {
                            c.setSequenceOrder(c.getSequenceOrder() - 1);
                            componentRepository.save(c);
                        }
                    }
                    
                    return ResponseEntity.ok(new MessageResponse("Component deleted successfully."));
                })
                .orElse(ResponseEntity.notFound().build());
    }
    
    // Reorder components - FIXED VERSION
    @PutMapping("/modules/{moduleId}/components/reorder")
    public ResponseEntity<?> reorderComponents(
            @PathVariable UUID moduleId,
            @RequestBody Map<String, List<UUID>> request) {
        
        List<UUID> componentOrder = request.get("componentOrder");
        if (componentOrder == null || componentOrder.isEmpty()) {
            return ResponseEntity.badRequest().body(new MessageResponse("Error: Component order not provided."));
        }
        
        Optional<TrainingModule> moduleOpt = moduleRepository.findById(moduleId);
        if (!moduleOpt.isPresent()) {
            return ResponseEntity.notFound().build();
        }
        
        TrainingModule module = moduleOpt.get();
        
        // Validate all component IDs belong to this module
        List<ModuleComponent> moduleComponents = componentRepository.findByTrainingModuleOrderBySequenceOrderAsc(module);
        List<UUID> moduleComponentIds = moduleComponents.stream()
                .map(ModuleComponent::getId)
                .collect(Collectors.toList());
        
        if (!moduleComponentIds.containsAll(componentOrder) || 
                moduleComponentIds.size() != componentOrder.size()) {
            return ResponseEntity.badRequest().body(new MessageResponse("Error: Invalid component IDs provided."));
        }
        
        // Update sequence order without using a lambda that references the loop variable
        for (int i = 0; i < componentOrder.size(); i++) {
            UUID componentId = componentOrder.get(i);
            Optional<ModuleComponent> componentOpt = componentRepository.findById(componentId);
            if (componentOpt.isPresent()) {
                ModuleComponent component = componentOpt.get();
                component.setSequenceOrder(i + 1);
                componentRepository.save(component);
            }
        }
        
        return ResponseEntity.ok(new MessageResponse("Components reordered successfully."));
    }
    
    
}

