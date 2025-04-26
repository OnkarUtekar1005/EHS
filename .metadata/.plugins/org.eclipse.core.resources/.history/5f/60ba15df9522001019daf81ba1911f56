package com.ehs.elearning.service;

import com.ehs.elearning.model.*;
import com.ehs.elearning.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

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
     * Create a new learning material for a component
     */
    public LearningMaterial createMaterial(UUID componentId, String title, String description,
                                        String fileType, MultipartFile file, String content,
                                        String externalUrl, Integer estimatedDuration) throws IOException {
        
        Optional<ModuleComponent> componentOpt = componentRepository.findById(componentId);
        if (!componentOpt.isPresent()) {
            throw new RuntimeException("Component not found");
        }
        
        ModuleComponent component = componentOpt.get();
        if (component.getType() != ComponentType.LEARNING_MATERIAL && 
            component.getType() != ComponentType.LEARNING_MATERIALS) {
            throw new RuntimeException("Component is not a learning material type");
        }
        
        LearningMaterial material = new LearningMaterial();
        material.setComponent(component);
        material.setTitle(title);
        material.setDescription(description);
        material.setFileType(fileType);
        material.setEstimatedDuration(estimatedDuration);
        
        // Set sequence order
        List<LearningMaterial> existingMaterials = 
            materialRepository.findByComponentOrderBySequenceOrderAsc(component);
        material.setSequenceOrder(existingMaterials.size() + 1);
        
        // Handle the file, content or external URL
        if (file != null && !file.isEmpty()) {
            String fileName = fileStorageService.storeFile(file);
            material.setFilePath(fileName);
        } else if (content != null && !content.isEmpty()) {
            material.setContent(content);
        } else if (externalUrl != null && !externalUrl.isEmpty()) {
            material.setExternalUrl(externalUrl);
        } else {
            throw new RuntimeException("No content provided for learning material");
        }
        
        return materialRepository.save(material);
    }
    
    /**
     * Get all materials for a component with user progress (if available)
     */
    public List<LearningMaterial> getMaterialsWithProgress(UUID componentId, UUID userId) {
        Optional<ModuleComponent> componentOpt = componentRepository.findById(componentId);
        if (!componentOpt.isPresent()) {
            throw new RuntimeException("Component not found");
        }
        
        ModuleComponent component = componentOpt.get();
        List<LearningMaterial> materials = materialRepository.findByComponentOrderBySequenceOrderAsc(component);
        
        // If userId is provided, fetch and attach progress information
        if (userId != null) {
            Optional<Users> userOpt = userRepository.findById(userId);
            if (userOpt.isPresent()) {
                Users user = userOpt.get();
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
        }
        
        return materials;
    }
    
    /**
     * Update user progress for a material
     */
    public MaterialProgress updateProgress(UUID materialId, UUID userId, Integer progress, Integer timeSpent) {
        Optional<LearningMaterial> materialOpt = materialRepository.findById(materialId);
        Optional<Users> userOpt = userRepository.findById(userId);
        
        if (!materialOpt.isPresent() || !userOpt.isPresent()) {
            throw new RuntimeException("Material or user not found");
        }
        
        LearningMaterial material = materialOpt.get();
        Users user = userOpt.get();
        
        Optional<MaterialProgress> progressOpt = progressRepository.findByMaterialAndUser(material, user);
        MaterialProgress materialProgress;
        
        if (progressOpt.isPresent()) {
            materialProgress = progressOpt.get();
            // Update existing progress
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
     * Get learning material by ID with appropriate data for display
     */
    public LearningMaterial getMaterialForDisplay(UUID materialId, UUID userId) {
        Optional<LearningMaterial> materialOpt = materialRepository.findById(materialId);
        if (!materialOpt.isPresent()) {
            throw new RuntimeException("Material not found");
        }
        
        LearningMaterial material = materialOpt.get();
        
        // If userId is provided, fetch progress information
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
     * Delete a learning material
     */
    public void deleteMaterial(UUID materialId) throws IOException {
        Optional<LearningMaterial> materialOpt = materialRepository.findById(materialId);
        if (!materialOpt.isPresent()) {
            throw new RuntimeException("Material not found");
        }
        
        LearningMaterial material = materialOpt.get();
        
        // Delete file if exists
        if (material.getFilePath() != null && !material.getFilePath().isEmpty()) {
            fileStorageService.deleteFile(material.getFilePath());
        }
        
        // Delete from database
        materialRepository.delete(material);
        
        // Update sequence orders of remaining materials
        ModuleComponent component = material.getComponent();
        List<LearningMaterial> materials = materialRepository.findByComponentOrderBySequenceOrderAsc(component);
        
        int i = 1;
        for (LearningMaterial m : materials) {
            m.setSequenceOrder(i++);
            materialRepository.save(m);
        }
    }
}