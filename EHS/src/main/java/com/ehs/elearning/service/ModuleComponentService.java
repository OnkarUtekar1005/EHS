package com.ehs.elearning.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.ehs.elearning.model.ComponentType;
import com.ehs.elearning.model.ModuleComponent;
import com.ehs.elearning.model.ModuleStatus;
import com.ehs.elearning.model.TrainingModule;
import com.ehs.elearning.repository.ModuleComponentRepository;
import com.ehs.elearning.repository.TrainingModuleRepository;

import jakarta.persistence.EntityNotFoundException;

import java.util.List;
import java.util.UUID;

@Service
public class ModuleComponentService {

    @Autowired
    private ModuleComponentRepository moduleComponentRepository;
    
    @Autowired
    private TrainingModuleRepository trainingModuleRepository;

    // Create a new module component
    @Transactional
    public ModuleComponent createModuleComponent(ModuleComponent component, UUID moduleId) {
        TrainingModule module = trainingModuleRepository.findById(moduleId)
            .orElseThrow(() -> new EntityNotFoundException("Training module not found with id: " + moduleId));
        
        // Can't modify published modules
        if (module.getStatus() == ModuleStatus.PUBLISHED) {
            throw new IllegalStateException("Cannot modify a published module");
        }
        
        component.setTrainingModule(module);
        
        // Set sequence order if not provided
        if (component.getSequenceOrder() == null) {
            Integer maxSequence = moduleComponentRepository.findMaxSequenceOrderByModule(module);
            component.setSequenceOrder(maxSequence != null ? maxSequence + 1 : 1);
        }
        
        // Validate component type-specific fields
        validateComponentByType(component);
        
        ModuleComponent savedComponent = moduleComponentRepository.save(component);
        
        // Update the bidirectional relationship
        module.addComponent(savedComponent);
        trainingModuleRepository.save(module);
        
        return savedComponent;
    }

    // Get all components for a module
    public List<ModuleComponent> getComponentsByModule(UUID moduleId) {
        TrainingModule module = trainingModuleRepository.findById(moduleId)
            .orElseThrow(() -> new EntityNotFoundException("Training module not found with id: " + moduleId));
        
        return moduleComponentRepository.findByTrainingModuleOrderBySequenceOrderAsc(module);
    }

    // Get a component by ID
    public ModuleComponent getComponentById(UUID id) {
        return moduleComponentRepository.findById(id)
            .orElseThrow(() -> new EntityNotFoundException("Module component not found with id: " + id));
    }

    // Update a component
    @Transactional
    public ModuleComponent updateComponent(UUID id, ModuleComponent updatedComponent) {
        ModuleComponent existingComponent = moduleComponentRepository.findById(id)
            .orElseThrow(() -> new EntityNotFoundException("Module component not found with id: " + id));
        
        // Can't modify published modules
        if (existingComponent.getTrainingModule().getStatus() == ModuleStatus.PUBLISHED) {
            throw new IllegalStateException("Cannot modify a published module");
        }
        
        // Update fields
        if (updatedComponent.getTitle() != null) {
            existingComponent.setTitle(updatedComponent.getTitle());
        }
        if (updatedComponent.getDescription() != null) {
            existingComponent.setDescription(updatedComponent.getDescription());
        }
        if (updatedComponent.getIsRequired() != null) {
            existingComponent.setIsRequired(updatedComponent.getIsRequired());
        }
        if (updatedComponent.getTimeLimit() != null) {
            existingComponent.setTimeLimit(updatedComponent.getTimeLimit());
        }
        if (updatedComponent.getPassingScore() != null) {
            existingComponent.setPassingScore(updatedComponent.getPassingScore());
        }
        
        // Cannot change component type after creation
        if (updatedComponent.getType() != null && updatedComponent.getType() != existingComponent.getType()) {
            throw new IllegalArgumentException("Cannot change component type after creation");
        }
        
        // Validate type-specific fields
        validateComponentByType(existingComponent);
        
        return moduleComponentRepository.save(existingComponent);
    }

    // Delete a component
    @Transactional
    public void deleteComponent(UUID id) {
        ModuleComponent component = moduleComponentRepository.findById(id)
            .orElseThrow(() -> new EntityNotFoundException("Module component not found with id: " + id));
        
        // Can't modify published modules
        if (component.getTrainingModule().getStatus() == ModuleStatus.PUBLISHED) {
            throw new IllegalStateException("Cannot modify a published module");
        }
        
        // Remove from module
        TrainingModule module = component.getTrainingModule();
        module.removeComponent(component);
        
        moduleComponentRepository.deleteById(id);
        
        // Reorder remaining components
        reorderComponents(module.getId());
    }
    
    // Update component sequence order
    @Transactional
    public void updateComponentOrder(UUID moduleId, List<UUID> componentIds) {
        TrainingModule module = trainingModuleRepository.findById(moduleId)
            .orElseThrow(() -> new EntityNotFoundException("Training module not found with id: " + moduleId));
        
        // Can't modify published modules
        if (module.getStatus() == ModuleStatus.PUBLISHED) {
            throw new IllegalStateException("Cannot modify a published module");
        }
        
        // Validate all component IDs belong to this module
        for (int i = 0; i < componentIds.size(); i++) {
            UUID componentId = componentIds.get(i);
            ModuleComponent component = moduleComponentRepository.findById(componentId)
                .orElseThrow(() -> new EntityNotFoundException("Module component not found with id: " + componentId));
            
            if (!component.getTrainingModule().getId().equals(moduleId)) {
                throw new IllegalArgumentException("Component with id " + componentId + " does not belong to module with id " + moduleId);
            }
            
            // Update sequence order
            component.setSequenceOrder(i + 1);
            moduleComponentRepository.save(component);
        }
    }
    
    // Helper method to reorder components after deletion
    private void reorderComponents(UUID moduleId) {
        TrainingModule module = trainingModuleRepository.findById(moduleId)
            .orElseThrow(() -> new EntityNotFoundException("Training module not found with id: " + moduleId));
        
        List<ModuleComponent> components = moduleComponentRepository.findByTrainingModuleOrderBySequenceOrderAsc(module);
        
        for (int i = 0; i < components.size(); i++) {
            ModuleComponent component = components.get(i);
            component.setSequenceOrder(i + 1);
            moduleComponentRepository.save(component);
        }
    }
    
    // Helper method to validate component by type
    private void validateComponentByType(ModuleComponent component) {
        if (component.getType() == ComponentType.PRE_ASSESSMENT || component.getType() == ComponentType.POST_ASSESSMENT) {
            // Assessment components should have time limit and passing score
            if (component.getTimeLimit() == null) {
                throw new IllegalArgumentException("Assessment components must have a time limit");
            }
            if (component.getPassingScore() == null) {
                component.setPassingScore(70); // Default passing score
            }
        } else if (component.getType() == ComponentType.LEARNING_MATERIAL) {
            // Learning material components shouldn't have assessment-specific fields
            component.setTimeLimit(null);
            component.setPassingScore(null);
        }
    }
}