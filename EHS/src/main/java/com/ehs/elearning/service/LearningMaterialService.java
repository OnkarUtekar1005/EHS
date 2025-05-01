package com.ehs.elearning.service;

import com.ehs.elearning.model.*;
import com.ehs.elearning.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collector;
import java.util.stream.Collectors;

@Service
public class LearningMaterialService {

    @Autowired
    private LearningMaterialRepository materialRepository;
    
    @Autowired
    private ModuleComponentRepository componentRepository;
    
    @Autowired
    private FileStorageService fileStorageService;
    
    @Autowired
    private MaterialProgressRepository progressRepository;
    
    @Autowired
    private UserRepository userRepository;
    


    /**
     * Get all materials for a component with optional user progress
     */

    
    /**
     * Get a specific material with optional user progress
     */
    public LearningMaterial getMaterialForDisplay(UUID materialId, UUID userId) {
        Optional<LearningMaterial> materialOpt = materialRepository.findById(materialId);
        if (!materialOpt.isPresent()) {
            throw new IllegalArgumentException("Material not found");
        }
        
        LearningMaterial material = materialOpt.get();
        
        // Add progress information if userId is provided
        if (userId != null) {
            Optional<Users> userOpt = userRepository.findById(userId);
            if (userOpt.isPresent()) {
                Users user = userOpt.get();
                Optional<MaterialProgress> progressOpt = progressRepository.findByMaterialAndUser(material, user);
                if (progressOpt.isPresent()) {
                    MaterialProgress progress = progressOpt.get();
                    material.setProgress(progress.getProgress());
                    material.setTimeSpent(progress.getTimeSpent());
                    material.setCompleted(progress.getCompleted());
                } else {
                    material.setProgress(0);
                    material.setTimeSpent(0);
                    material.setCompleted(false);
                }
            }
        }
        
        return material;
    }
    
    /**
     * Update user progress for a material
     */
    @Transactional
    public MaterialProgress updateProgress(UUID materialId, UUID userId, Integer progress, Integer timeSpent) {
        // Validate material and user exist
        Optional<LearningMaterial> materialOpt = materialRepository.findById(materialId);
        Optional<Users> userOpt = userRepository.findById(userId);
        
        if (!materialOpt.isPresent() || !userOpt.isPresent()) {
            throw new IllegalArgumentException("Material or user not found");
        }
        
        LearningMaterial material = materialOpt.get();
        Users user = userOpt.get();
        
        // Find existing progress or create new
        Optional<MaterialProgress> progressOpt = progressRepository.findByMaterialAndUser(material, user);
        MaterialProgress materialProgress;
        
        if (progressOpt.isPresent()) {
            // Update existing progress
            materialProgress = progressOpt.get();
            if (progress != null) {
                materialProgress.setProgress(progress);
            }
            if (timeSpent != null) {
                materialProgress.setTimeSpent(materialProgress.getTimeSpent() + timeSpent);
            }
            
            // Auto-mark as completed if progress reaches 100%
            if (materialProgress.getProgress() >= 100 && !materialProgress.getCompleted()) {
                materialProgress.setCompleted(true);
            }
        } else {
            // Create new progress record
            materialProgress = new MaterialProgress(material, user);
            if (progress != null) {
                materialProgress.setProgress(progress);
            } else {
                materialProgress.setProgress(0);
            }
            if (timeSpent != null) {
                materialProgress.setTimeSpent(timeSpent);
            } else {
            	materialProgress.setTimeSpent(0);
            }
        }
        
        return progressRepository.save(materialProgress);
    }
    
    /**
     * Delete a learning material
     */

    
    /**
     * Reorder learning materials within a component
     */

    
    /**
     * Helper method to validate component exists and is a learning material type
     */
    private ModuleComponent validateComponent(UUID componentId) {
        Optional<ModuleComponent> componentOpt = componentRepository.findById(componentId);
        if (!componentOpt.isPresent()) {
            throw new IllegalArgumentException("Component not found");
        }
        
        ModuleComponent component = componentOpt.get();
        if (component.getType() != ComponentType.LEARNING_MATERIAL ) {
            throw new IllegalArgumentException("Component is not a learning material type");
        }
        
        return component;
    }
    
    /**
     * Helper method to add progress information to a list of materials
     */
    private void addProgressInfoToMaterials(List<LearningMaterial> materials, Users user) {
        for (LearningMaterial material : materials) {
            Optional<MaterialProgress> progressOpt = progressRepository.findByMaterialAndUser(material, user);
            if (progressOpt.isPresent()) {
                MaterialProgress progress = progressOpt.get();
                material.setProgress(progress.getProgress());
                material.setTimeSpent(progress.getTimeSpent());
                material.setCompleted(progress.getCompleted());
            } else {
                material.setProgress(0);
                material.setTimeSpent(0);
                material.setCompleted(false);
            }
        }
    }
    
 // Modify LearningMaterialService.java

    @Autowired
    private ComponentMaterialAssociationRepository associationRepository;

    /**
     * Get all materials for a component with optional user progress
     */
    public List<LearningMaterial> getMaterialsWithProgress(UUID componentId, UUID userId) {
        // Validate component exists and is of correct type
        ModuleComponent component = validateComponent(componentId);
        
        // Get all materials associated with this component
        List<ComponentMaterialAssociation> associations = 
            associationRepository.findByComponentOrderBySequenceOrderAsc(component);
        
        List<LearningMaterial> materials = associations.stream()
            .map(ComponentMaterialAssociation::getMaterial)
            .collect(Collectors.toList());
        
        // Add progress information if userId is provided
        if (userId != null && !materials.isEmpty()) {
            Optional<Users> userOpt = userRepository.findById(userId);
            if (userOpt.isPresent()) {
                Users user = userOpt.get();
                addProgressInfoToMaterials(materials, user);
            }
        }
        
        return materials;
    }

    /**
     * Update the reorderMaterials method to use associations
     */
    @Transactional
    public void reorderMaterials(UUID componentId, List<UUID> orderedMaterialIds) {
        ModuleComponent component = validateComponent(componentId);
        
        // Validate all materials are associated with the component
        List<ComponentMaterialAssociation> associations = 
            associationRepository.findByComponentOrderBySequenceOrderAsc(component);
        
        Set<UUID> associatedMaterialIds = associations.stream()
            .map(assoc -> assoc.getMaterial().getId())
            .collect(Collectors.toSet());
        
        if (!associatedMaterialIds.containsAll(orderedMaterialIds)) {
            throw new IllegalArgumentException("Invalid material IDs provided");
        }
        
        // Update sequence order based on provided order
        for (int i = 0; i < orderedMaterialIds.size(); i++) {
            final UUID materialId = orderedMaterialIds.get(i);
            final int newOrder = i + 1;
            
            // Find the association for this material and update its sequence
            associations.stream()
                .filter(assoc -> assoc.getMaterial().getId().equals(materialId))
                .findFirst()
                .ifPresent(assoc -> {
                    assoc.setSequenceOrder(newOrder);
                    associationRepository.save(assoc);
                });
        }
    }

    /**
     * Create material and associate it with a component
     */
    @Transactional
    public LearningMaterial createMaterial(UUID componentId, String title, String description,
                                        String fileType, MultipartFile file, String content,
                                        String externalUrl, Integer estimatedDuration) throws IOException {
        
        // Create the learning material first
        LearningMaterial material = new LearningMaterial();
        material.setTitle(title);
        material.setDescription(description);
        material.setFileType(fileType);
        material.setEstimatedDuration(estimatedDuration);
        
        // Handle different content types
        if (file != null && !file.isEmpty()) {
            // File-based material
            String fileName = fileStorageService.storeFile(file);
            material.setFilePath(fileName);
        } else if (content != null && !content.isEmpty()) {
            // Content-based material (HTML, text)
            material.setContent(content);
        } else if (externalUrl != null && !externalUrl.isEmpty()) {
            // External URL material
            material.setExternalUrl(externalUrl);
        } else {
            throw new IllegalArgumentException("No content provided for learning material");
        }
        
        // Save the material
        LearningMaterial savedMaterial = materialRepository.save(material);
        
        // Associate it with the component if provided
        if (componentId != null) {
            ModuleComponent component = validateComponent(componentId);
            
            // Get the highest sequence order
            List<ComponentMaterialAssociation> existing = 
                associationRepository.findByComponentOrderBySequenceOrderAsc(component);
            int sequenceOrder = existing.size() + 1;
            
            // Create and save the association
            ComponentMaterialAssociation association = new ComponentMaterialAssociation(
                component, savedMaterial, sequenceOrder);
            associationRepository.save(association);
        }
        
        return savedMaterial;
    }

    /**
     * Delete a material and its associations
     */
    @Transactional
    public void deleteMaterial(UUID materialId) throws IOException {
        Optional<LearningMaterial> materialOpt = materialRepository.findById(materialId);
        if (!materialOpt.isPresent()) {
            throw new IllegalArgumentException("Material not found");
        }
        
        LearningMaterial material = materialOpt.get();
        
        // Delete all associations first
        List<ComponentMaterialAssociation> associations = associationRepository.findByMaterial(material);
        associationRepository.deleteAll(associations);
        
        // Delete associated file if exists
        if (material.getFilePath() != null && !material.getFilePath().isEmpty()) {
            fileStorageService.deleteFile(material.getFilePath());
        }
        
        // Delete the material from repository
        materialRepository.delete(material);
    }
    


    
    
}