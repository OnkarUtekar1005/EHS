package com.ehs.elearning.controller;

import com.ehs.elearning.model.*;
import com.ehs.elearning.payload.request.LearningMaterialRequest;
import com.ehs.elearning.payload.request.MaterialProgressRequest;
import com.ehs.elearning.payload.response.MessageResponse;
import com.ehs.elearning.repository.LearningMaterialRepository;
import com.ehs.elearning.repository.MaterialProgressRepository;
import com.ehs.elearning.repository.ModuleComponentRepository;
import com.ehs.elearning.repository.UserRepository;
import com.ehs.elearning.security.UserDetailsImpl;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import jakarta.validation.Valid;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api")
public class LearningMaterialController {

    @Value("${file.upload-dir:./uploads}")
    private String uploadDir;

    @Autowired
    private ModuleComponentRepository componentRepository;
    
    @Autowired
    private LearningMaterialRepository materialRepository;
    
    @Autowired
    private MaterialProgressRepository progressRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    // Get materials for a component
    @GetMapping("/components/{id}/materials")
    public ResponseEntity<?> getMaterials(@PathVariable UUID id) {
        Optional<ModuleComponent> componentOpt = componentRepository.findById(id);
        if (!componentOpt.isPresent()) {
            return ResponseEntity.notFound().build();
        }
        
        ModuleComponent component = componentOpt.get();
        if (component.getType() != ComponentType.LEARNING_MATERIAL) {
            return ResponseEntity.badRequest().body(
                new MessageResponse("Component is not a learning material type"));
        }
        
        List<LearningMaterial> materials = materialRepository.findByComponentOrderBySequenceOrderAsc(component);
        return ResponseEntity.ok(materials);
    }
    
    // Add HTML/URL content to component
    @PostMapping("/components/{id}/materials")
    public ResponseEntity<?> addMaterial(
            @PathVariable UUID id,
            @Valid @RequestBody LearningMaterialRequest materialRequest) {
        
        Optional<ModuleComponent> componentOpt = componentRepository.findById(id);
        if (!componentOpt.isPresent()) {
            return ResponseEntity.notFound().build();
        }
        
        ModuleComponent component = componentOpt.get();
        if (component.getType() != ComponentType.LEARNING_MATERIAL) {
            return ResponseEntity.badRequest().body(
                new MessageResponse("Component is not a learning material type"));
        }
        
        // Create new material
        LearningMaterial material = new LearningMaterial();
        material.setComponent(component);
        material.setTitle(materialRequest.getTitle());
        material.setDescription(materialRequest.getDescription());
        material.setFileType(materialRequest.getFileType());
        material.setContent(materialRequest.getContent());
        material.setExternalUrl(materialRequest.getExternalUrl());
        material.setEstimatedDuration(materialRequest.getEstimatedDuration());
        
        // If sequence order not specified, add to end
        if (materialRequest.getSequenceOrder() == null) {
            Long count = materialRepository.countByComponent(component);
            material.setSequenceOrder(count.intValue() + 1);
        } else {
            material.setSequenceOrder(materialRequest.getSequenceOrder());
        }
        
        LearningMaterial savedMaterial = materialRepository.save(material);
        return ResponseEntity.ok(savedMaterial);
    }
    
    // Upload file material to component
    @PostMapping("/components/{id}/materials/upload")
    public ResponseEntity<?> uploadMaterial(
            @PathVariable UUID id,
            @RequestParam("file") MultipartFile file,
            @RequestParam("title") String title,
            @RequestParam(value = "description", required = false) String description,
            @RequestParam(value = "sequenceOrder", required = false) Integer sequenceOrder,
            @RequestParam(value = "estimatedDuration", required = false) Integer estimatedDuration) {
        
        Optional<ModuleComponent> componentOpt = componentRepository.findById(id);
        if (!componentOpt.isPresent()) {
            return ResponseEntity.notFound().build();
        }
        
        ModuleComponent component = componentOpt.get();
        if (component.getType() != ComponentType.LEARNING_MATERIAL) {
            return ResponseEntity.badRequest().body(
                new MessageResponse("Component is not a learning material type"));
        }
        
        try {
            // Create directory if it doesn't exist
            Path uploadPath = Paths.get(uploadDir, component.getId().toString());
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }
            
            // Generate unique filename
            String filename = UUID.randomUUID().toString() + "_" + file.getOriginalFilename();
            Path filePath = uploadPath.resolve(filename);
            
            // Copy file to the target location
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);
            
            // Determine file type based on content type
            String fileType = determineFileType(file.getContentType());
            
            // Create new material
            LearningMaterial material = new LearningMaterial();
            material.setComponent(component);
            material.setTitle(title);
            material.setDescription(description);
            material.setFileType(fileType);
            material.setFilePath(filePath.toString());
            material.setEstimatedDuration(estimatedDuration);
            
            // If sequence order not specified, add to end
            if (sequenceOrder == null) {
                Long count = materialRepository.countByComponent(component);
                material.setSequenceOrder(count.intValue() + 1);
            } else {
                material.setSequenceOrder(sequenceOrder);
            }
            
            LearningMaterial savedMaterial = materialRepository.save(material);
            return ResponseEntity.ok(savedMaterial);
        } catch (IOException e) {
            return ResponseEntity.badRequest().body(
                new MessageResponse("Failed to upload file: " + e.getMessage()));
        }
    }
    
    // Update material
    @PutMapping("/materials/{id}")
    public ResponseEntity<?> updateMaterial(
            @PathVariable UUID id,
            @Valid @RequestBody LearningMaterialRequest materialRequest) {
        
        Optional<LearningMaterial> materialOpt = materialRepository.findById(id);
        if (!materialOpt.isPresent()) {
            return ResponseEntity.notFound().build();
        }
        
        LearningMaterial material = materialOpt.get();
        material.setTitle(materialRequest.getTitle());
        material.setDescription(materialRequest.getDescription());
        
        if (materialRequest.getContent() != null) {
            material.setContent(materialRequest.getContent());
        }
        
        if (materialRequest.getExternalUrl() != null) {
            material.setExternalUrl(materialRequest.getExternalUrl());
        }
        
        if (materialRequest.getEstimatedDuration() != null) {
            material.setEstimatedDuration(materialRequest.getEstimatedDuration());
        }
        
        // Handle sequence order change if needed
        if (materialRequest.getSequenceOrder() != null && 
                !materialRequest.getSequenceOrder().equals(material.getSequenceOrder())) {
            
            // Update sequence order logic here
            material.setSequenceOrder(materialRequest.getSequenceOrder());
        }
        
        LearningMaterial updatedMaterial = materialRepository.save(material);
        return ResponseEntity.ok(updatedMaterial);
    }
    
    // Delete material
    @DeleteMapping("/materials/{id}")
    public ResponseEntity<?> deleteMaterial(@PathVariable UUID id) {
        Optional<LearningMaterial> materialOpt = materialRepository.findById(id);
        if (!materialOpt.isPresent()) {
            return ResponseEntity.notFound().build();
        }
        
        LearningMaterial material = materialOpt.get();
        
        // Delete file if exists
        if (material.getFilePath() != null) {
            try {
                Path filePath = Paths.get(material.getFilePath());
                Files.deleteIfExists(filePath);
            } catch (IOException e) {
                // Log error but continue with deletion
                System.err.println("Error deleting file: " + e.getMessage());
            }
        }
        
        materialRepository.delete(material);
        return ResponseEntity.ok(new MessageResponse("Material deleted successfully."));
    }
    
    // Reorder materials - FIXED VERSION
    @PutMapping("/materials/reorder")
    public ResponseEntity<?> reorderMaterials(@RequestBody Map<String, List<UUID>> request) {
        List<UUID> materialOrder = request.get("materialOrder");
        if (materialOrder == null || materialOrder.isEmpty()) {
            return ResponseEntity.badRequest().body(new MessageResponse("Error: Material order not provided."));
        }
        
        for (int i = 0; i < materialOrder.size(); i++) {
            final int orderIndex = i + 1;  // Make this effectively final for the lambda
            UUID materialId = materialOrder.get(i);
            Optional<LearningMaterial> materialOpt = materialRepository.findById(materialId);
            if (materialOpt.isPresent()) {
                LearningMaterial material = materialOpt.get();
                material.setSequenceOrder(orderIndex);
                materialRepository.save(material);
            }
        }
        
        return ResponseEntity.ok(new MessageResponse("Materials reordered successfully."));
    }
    
    // Track material progress
    @PostMapping("/components/{id}/materials/track")
    public ResponseEntity<?> trackMaterialProgress(
            @PathVariable UUID id,
            @Valid @RequestBody MaterialProgressRequest progressRequest) {
        
        // Get current user
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        
        Optional<LearningMaterial> materialOpt = materialRepository.findById(progressRequest.getMaterialId());
        if (!materialOpt.isPresent()) {
            return ResponseEntity.notFound().build();
        }
        
        LearningMaterial material = materialOpt.get();
        
        if (!material.getComponent().getId().equals(id)) {
            return ResponseEntity.badRequest().body(
                new MessageResponse("Material does not belong to the specified component"));
        }
        
        Optional<Users> userOpt = userRepository.findById(userDetails.getId());
        if (!userOpt.isPresent()) {
            return ResponseEntity.badRequest().body(new MessageResponse("User not found."));
        }
        
        Users user = userOpt.get();
        
        // Find existing progress or create new one
        Optional<MaterialProgress> progressOpt = progressRepository.findByMaterialAndUser(material, user);
        MaterialProgress progress;
        
        if (progressOpt.isPresent()) {
            progress = progressOpt.get();
        } else {
            progress = new MaterialProgress(material, user);
        }
        
        // Update progress
        progress.setProgress(progressRequest.getProgress());
        
        // Update time spent if provided
        if (progressRequest.getTimeSpent() != null) {
            Integer currentTimeSpent = progress.getTimeSpent() != null ? progress.getTimeSpent() : 0;
            progress.setTimeSpent(currentTimeSpent + progressRequest.getTimeSpent());
        }
        
        // Save progress
        MaterialProgress savedProgress = progressRepository.save(progress);
        
        // Check if component is completed
        if (progress.getCompleted() && material.getComponent().getType() == ComponentType.LEARNING_MATERIAL) {
            Long completedCount = progressRepository.countCompletedMaterialsInComponent(
                    material.getComponent(), user);
            Long totalCount = progressRepository.countTotalMaterialsInComponent(
                    material.getComponent());
            
            if (completedCount.equals(totalCount)) {
                Map<String, Object> response = new HashMap<>();
                response.put("progress", savedProgress);
                response.put("componentCompleted", true);
                return ResponseEntity.ok(response);
            }
        }
        
        Map<String, Object> response = new HashMap<>();
        response.put("progress", savedProgress);
        response.put("componentCompleted", false);
        return ResponseEntity.ok(response);
    }
    
    // Get user progress for a component
    @GetMapping("/components/{id}/progress")
    public ResponseEntity<?> getUserProgressForComponent(@PathVariable UUID id) {
        // Get current user
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        
        Optional<ModuleComponent> componentOpt = componentRepository.findById(id);
        if (!componentOpt.isPresent()) {
            return ResponseEntity.notFound().build();
        }
        
        ModuleComponent component = componentOpt.get();
        
        Optional<Users> userOpt = userRepository.findById(userDetails.getId());
        if (!userOpt.isPresent()) {
            return ResponseEntity.badRequest().body(new MessageResponse("User not found."));
        }
        
        Users user = userOpt.get();
        
        if (component.getType() != ComponentType.LEARNING_MATERIAL) {
            return ResponseEntity.badRequest().body(
                new MessageResponse("Component is not a learning material type"));
        }
        
        List<LearningMaterial> materials = materialRepository.findByComponentOrderBySequenceOrderAsc(component);
        List<MaterialProgress> progresses = progressRepository.findByUserAndMaterialComponent(user, component);
        
        // Map progress to materials
        Map<UUID, MaterialProgress> progressMap = progresses.stream()
                .collect(Collectors.toMap(
                    p -> p.getMaterial().getId(),
                    p -> p
                ));
        
        // Calculate overall progress
        int totalMaterials = materials.size();
        int completedMaterials = (int) progresses.stream()
                .filter(MaterialProgress::getCompleted)
                .count();
        
        int overallProgress = totalMaterials > 0 
                ? (completedMaterials * 100) / totalMaterials 
                : 0;
        
        Map<String, Object> response = new HashMap<>();
        response.put("materials", materials);
        response.put("progress", progressMap);
        response.put("overallProgress", overallProgress);
        response.put("completed", overallProgress == 100);
        
        return ResponseEntity.ok(response);
    }
    
    // Helper method to determine file type from content type
    private String determineFileType(String contentType) {
        if (contentType == null) return "FILE";
        
        if (contentType.startsWith("image/")) {
            return "IMAGE";
        } else if (contentType.startsWith("video/")) {
            return "VIDEO";
        } else if (contentType.startsWith("audio/")) {
            return "AUDIO";
        } else if (contentType.equals("application/pdf")) {
            return "PDF";
        } else if (contentType.contains("powerpoint") || contentType.contains("presentation")) {
            return "PRESENTATION";
        } else if (contentType.contains("word") || contentType.contains("document")) {
            return "DOCUMENT";
        } else if (contentType.contains("spreadsheet") || contentType.contains("excel")) {
            return "SPREADSHEET";
        } else {
            return "FILE";
        }
    }
}