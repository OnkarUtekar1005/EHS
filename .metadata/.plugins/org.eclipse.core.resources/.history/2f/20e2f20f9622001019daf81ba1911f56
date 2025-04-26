package com.ehs.elearning.controller;

import com.ehs.elearning.model.LearningMaterial;
import com.ehs.elearning.model.ModuleComponent;
import com.ehs.elearning.model.ComponentType;
import com.ehs.elearning.payload.request.LearningMaterialRequest;
import com.ehs.elearning.payload.response.MessageResponse;
import com.ehs.elearning.repository.LearningMaterialRepository;
import com.ehs.elearning.repository.ModuleComponentRepository;
import com.ehs.elearning.service.FileStorageService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import com.ehs.elearning.model.MaterialProgress;
import com.ehs.elearning.model.Users;
import com.ehs.elearning.payload.request.MaterialProgressRequest;
import com.ehs.elearning.repository.MaterialProgressRepository;
import com.ehs.elearning.repository.UserRepository;
import com.ehs.elearning.security.UserDetailsImpl;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import java.nio.file.Path;
import java.net.MalformedURLException;
import java.util.Optional;

import jakarta.validation.Valid;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api")
public class LearningMaterialController {

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
    
    
    @GetMapping("/components/{componentId}/materials/progress")
    public ResponseEntity<?> getMaterialsWithProgress(@PathVariable UUID componentId) {
        try {
            // Get current authenticated user
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
            UUID userId = userDetails.getId();
            
            return componentRepository.findById(componentId)
                    .map(component -> {
                        // Verify this is a learning material component
                        if (component.getType() != ComponentType.LEARNING_MATERIAL && 
                            component.getType() != ComponentType.LEARNING_MATERIALS) {
                            return ResponseEntity.badRequest()
                                .body(new MessageResponse("Component is not a learning material type"));
                        }
                        
                        List<LearningMaterial> materials = materialRepository.findByComponentOrderBySequenceOrderAsc(component);
                        
                        // Get user
                        Optional<Users> userOpt = userRepository.findById(userId);
                        if (!userOpt.isPresent()) {
                            return ResponseEntity.ok(materials); // Return materials without progress info
                        }
                        
                        Users user = userOpt.get();
                        
                        // Add progress information to each material
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
                        
                        return ResponseEntity.ok(materials);
                    })
                    .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(new MessageResponse("Error retrieving materials with progress: " + e.getMessage()));
        }
    }

    /**
     * Get material with user progress information
     */
    @GetMapping("/materials/{id}/progress")
    public ResponseEntity<?> getMaterialWithProgress(@PathVariable UUID id) {
        try {
            // Get current authenticated user
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
            UUID userId = userDetails.getId();
            
            return materialRepository.findById(id)
                    .map(material -> {
                        // Get user
                        Optional<Users> userOpt = userRepository.findById(userId);
                        if (!userOpt.isPresent()) {
                            return ResponseEntity.ok(material); // Return material without progress info
                        }
                        
                        Users user = userOpt.get();
                        
                        // Add progress information
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
                        
                        return ResponseEntity.ok(material);
                    })
                    .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(new MessageResponse("Error retrieving material with progress: " + e.getMessage()));
        }
    }

    /**
     * Update user progress for a learning material
     */
    @PostMapping("/materials/{id}/update-progress")
    public ResponseEntity<?> updateMaterialProgress(
            @PathVariable UUID id,
            @Valid @RequestBody MaterialProgressRequest request) {
        
        try {
            // Get current authenticated user
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
            UUID userId = userDetails.getId();
            
            Optional<LearningMaterial> materialOpt = materialRepository.findById(id);
            Optional<Users> userOpt = userRepository.findById(userId);
            
            if (!materialOpt.isPresent() || !userOpt.isPresent()) {
                return ResponseEntity.badRequest()
                    .body(new MessageResponse("Material or user not found"));
            }
            
            LearningMaterial material = materialOpt.get();
            Users user = userOpt.get();
            
            Optional<MaterialProgress> progressOpt = progressRepository.findByMaterialAndUser(material, user);
            MaterialProgress materialProgress;
            
            if (progressOpt.isPresent()) {
                materialProgress = progressOpt.get();
                // Update existing progress
                if (request.getProgress() != null) {
                    materialProgress.setProgress(request.getProgress());
                }
                if (request.getTimeSpent() != null) {
                    materialProgress.setTimeSpent(materialProgress.getTimeSpent() + request.getTimeSpent());
                }
                
                // Auto-mark as completed if progress reaches 100%
                if (materialProgress.getProgress() >= 100 && !materialProgress.getCompleted()) {
                    materialProgress.setCompleted(true);
                }
            } else {
                // Create new progress record
                materialProgress = new MaterialProgress(material, user);
                if (request.getProgress() != null) {
                    materialProgress.setProgress(request.getProgress());
                } else {
                    materialProgress.setProgress(0);
                }
                if (request.getTimeSpent() != null) {
                    materialProgress.setTimeSpent(request.getTimeSpent());
                } else {
                    materialProgress.setTimeSpent(0);
                }
            }
            
            progressRepository.save(materialProgress);
            
            // Return material with updated progress
            material.setProgress(materialProgress.getProgress());
            material.setTimeSpent(materialProgress.getTimeSpent());
            material.setCompleted(materialProgress.getCompleted());
            
            return ResponseEntity.ok(material);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(new MessageResponse("Failed to update progress: " + e.getMessage()));
        }
    }

    /**
     * Stream or download a learning material file
     */
    @GetMapping("/materials/{id}/stream")
    public ResponseEntity<?> streamFile(@PathVariable UUID id) {
        try {
            Optional<LearningMaterial> materialOpt = materialRepository.findById(id);
            if (!materialOpt.isPresent()) {
                return ResponseEntity.notFound().build();
            }
            
            LearningMaterial material = materialOpt.get();
            
            if (material.getFilePath() == null || material.getFilePath().isEmpty()) {
                return ResponseEntity.badRequest()
                    .body(new MessageResponse("No file associated with this material"));
            }
            
            // Check if file exists
            if (!fileStorageService.fileExists(material.getFilePath())) {
                return ResponseEntity.notFound().build();
            }
            
            // Get file resource
            Path filePath = fileStorageService.getFilePath(material.getFilePath());
            Resource resource = new UrlResource(filePath.toUri());
            
            // Determine content type
            String contentType = determineContentType(material.getFileType());
            
            // Build response headers
            HttpHeaders headers = new HttpHeaders();
            headers.add(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + material.getTitle() + "\"");
            
            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(contentType))
                    .headers(headers)
                    .body(resource);
        } catch (MalformedURLException e) {
            return ResponseEntity.badRequest()
                .body(new MessageResponse("Error: " + e.getMessage()));
        }
    }

    /**
     * Helper method to determine content type for HTTP response
     */
    private String determineContentType(String fileType) {
        switch (fileType) {
            case "PDF":
                return "application/pdf";
            case "PRESENTATION":
                return "application/vnd.ms-powerpoint";
            case "VIDEO":
                return "video/mp4";
            case "DOCUMENT":
                return "application/msword";
            case "HTML":
                return "text/html";
            case "IMAGE":
                return "image/jpeg";
            default:
                return "application/octet-stream";
        }
    }
    
    // Get all learning materials for a component
    @GetMapping("/components/{componentId}/materials")
    public ResponseEntity<?> getMaterialsByComponent(@PathVariable UUID componentId) {
        return componentRepository.findById(componentId)
                .map(component -> {
                    // Verify this is a learning material component
                    if (component.getType() != ComponentType.LEARNING_MATERIAL && 
                        component.getType() != ComponentType.LEARNING_MATERIALS) {
                        return ResponseEntity.badRequest()
                            .body(new MessageResponse("Component is not a learning material type"));
                    }
                    
                    List<LearningMaterial> materials = materialRepository.findByComponentOrderBySequenceOrderAsc(component);
                    return ResponseEntity.ok(materials);
                })
                .orElse(ResponseEntity.notFound().build());
    }
    
    // Get learning material by ID
    @GetMapping("/materials/{id}")
    public ResponseEntity<?> getMaterialById(@PathVariable UUID id) {
        return materialRepository.findById(id)
                .map(material -> ResponseEntity.ok(material))
                .orElse(ResponseEntity.notFound().build());
    }
    
    // Add file-based learning material
    @PostMapping("/components/{componentId}/materials/file")
    public ResponseEntity<?> addFileMaterial(
            @PathVariable UUID componentId,
            @RequestParam("file") MultipartFile file,
            @RequestParam("title") String title,
            @RequestParam(value = "description", required = false) String description,
            @RequestParam(value = "estimatedDuration", required = false) Integer estimatedDuration) {
        
        return componentRepository.findById(componentId)
                .map(component -> {
                    // Verify this is a learning material component
                    if (component.getType() != ComponentType.LEARNING_MATERIAL && 
                        component.getType() != ComponentType.LEARNING_MATERIALS) {
                        return ResponseEntity.badRequest()
                            .body(new MessageResponse("Component is not a learning material type"));
                    }
                    
                    try {
                        // Store the file
                        String fileName = fileStorageService.storeFile(file);
                        String fileType = determineFileType(file.getOriginalFilename());
                        
                        // Create learning material
                        LearningMaterial material = new LearningMaterial();
                        material.setComponent(component);
                        material.setTitle(title);
                        material.setDescription(description);
                        material.setFileType(fileType);
                        material.setFilePath(fileName);
                        material.setEstimatedDuration(estimatedDuration);
                        
                        // Set sequence order
                        List<LearningMaterial> existingMaterials = 
                            materialRepository.findByComponentOrderBySequenceOrderAsc(component);
                        material.setSequenceOrder(existingMaterials.size() + 1);
                        
                        LearningMaterial savedMaterial = materialRepository.save(material);
                        return ResponseEntity.ok(savedMaterial);
                    } catch (IOException e) {
                        return ResponseEntity.badRequest()
                            .body(new MessageResponse("Failed to store file: " + e.getMessage()));
                    }
                })
                .orElse(ResponseEntity.notFound().build());
    }
    
    // Add content-based learning material (HTML, text, etc.)
    @PostMapping("/components/{componentId}/materials/content")
    public ResponseEntity<?> addContentMaterial(
            @PathVariable UUID componentId,
            @Valid @RequestBody LearningMaterialRequest materialRequest) {
        
        return componentRepository.findById(componentId)
                .map(component -> {
                    // Verify this is a learning material component
                    if (component.getType() != ComponentType.LEARNING_MATERIAL && 
                        component.getType() != ComponentType.LEARNING_MATERIALS) {
                        return ResponseEntity.badRequest()
                            .body(new MessageResponse("Component is not a learning material type"));
                    }
                    
                    // Create learning material
                    LearningMaterial material = new LearningMaterial();
                    material.setComponent(component);
                    material.setTitle(materialRequest.getTitle());
                    material.setDescription(materialRequest.getDescription());
                    material.setFileType("HTML"); // Or TEXT, depending on content
                    material.setContent(materialRequest.getContent());
                    material.setEstimatedDuration(materialRequest.getEstimatedDuration());
                    
                    // Set sequence order
                    List<LearningMaterial> existingMaterials = 
                        materialRepository.findByComponentOrderBySequenceOrderAsc(component);
                    material.setSequenceOrder(existingMaterials.size() + 1);
                    
                    LearningMaterial savedMaterial = materialRepository.save(material);
                    return ResponseEntity.ok(savedMaterial);
                })
                .orElse(ResponseEntity.notFound().build());
    }
    
    // Add external URL learning material (videos, websites, etc.)
    @PostMapping("/components/{componentId}/materials/external")
    public ResponseEntity<?> addExternalMaterial(
            @PathVariable UUID componentId,
            @Valid @RequestBody LearningMaterialRequest materialRequest) {
        
        return componentRepository.findById(componentId)
                .map(component -> {
                    // Verify this is a learning material component
                    if (component.getType() != ComponentType.LEARNING_MATERIAL && 
                        component.getType() != ComponentType.LEARNING_MATERIALS) {
                        return ResponseEntity.badRequest()
                            .body(new MessageResponse("Component is not a learning material type"));
                    }
                    
                    // Create learning material
                    LearningMaterial material = new LearningMaterial();
                    material.setComponent(component);
                    material.setTitle(materialRequest.getTitle());
                    material.setDescription(materialRequest.getDescription());
                    material.setFileType(materialRequest.getFileType()); // E.g., "VIDEO", "EXTERNAL"
                    material.setExternalUrl(materialRequest.getExternalUrl());
                    material.setEstimatedDuration(materialRequest.getEstimatedDuration());
                    
                    // Set sequence order
                    List<LearningMaterial> existingMaterials = 
                        materialRepository.findByComponentOrderBySequenceOrderAsc(component);
                    material.setSequenceOrder(existingMaterials.size() + 1);
                    
                    LearningMaterial savedMaterial = materialRepository.save(material);
                    return ResponseEntity.ok(savedMaterial);
                })
                .orElse(ResponseEntity.notFound().build());
    }
    
    // Update learning material
    @PutMapping("/materials/{id}")
    public ResponseEntity<?> updateMaterial(
            @PathVariable UUID id,
            @Valid @RequestBody LearningMaterialRequest materialRequest) {
        
        return materialRepository.findById(id)
                .map(material -> {
                    // Update basic properties
                    if (materialRequest.getTitle() != null) {
                        material.setTitle(materialRequest.getTitle());
                    }
                    
                    if (materialRequest.getDescription() != null) {
                        material.setDescription(materialRequest.getDescription());
                    }
                    
                    if (materialRequest.getContent() != null) {
                        material.setContent(materialRequest.getContent());
                    }
                    
                    if (materialRequest.getExternalUrl() != null) {
                        material.setExternalUrl(materialRequest.getExternalUrl());
                    }
                    
                    if (materialRequest.getEstimatedDuration() != null) {
                        material.setEstimatedDuration(materialRequest.getEstimatedDuration());
                    }
                    
                    // Update sequence order if needed
                    if (materialRequest.getSequenceOrder() != null &&
                            !materialRequest.getSequenceOrder().equals(material.getSequenceOrder())) {
                        
                        ModuleComponent component = material.getComponent();
                        int oldOrder = material.getSequenceOrder();
                        int newOrder = materialRequest.getSequenceOrder();
                        
                        List<LearningMaterial> materials = 
                            materialRepository.findByComponentOrderBySequenceOrderAsc(component);
                        
                        // Reorder logic similar to components
                        for (LearningMaterial m : materials) {
                            if (m.getId().equals(material.getId())) {
                                continue; // Skip the material being updated
                            }
                            
                            if (oldOrder < newOrder) { // Moving down
                                if (m.getSequenceOrder() > oldOrder && m.getSequenceOrder() <= newOrder) {
                                    m.setSequenceOrder(m.getSequenceOrder() - 1);
                                    materialRepository.save(m);
                                }
                            } else { // Moving up
                                if (m.getSequenceOrder() >= newOrder && m.getSequenceOrder() < oldOrder) {
                                    m.setSequenceOrder(m.getSequenceOrder() + 1);
                                    materialRepository.save(m);
                                }
                            }
                        }
                        
                        material.setSequenceOrder(newOrder);
                    }
                    
                    LearningMaterial updatedMaterial = materialRepository.save(material);
                    return ResponseEntity.ok(updatedMaterial);
                })
                .orElse(ResponseEntity.notFound().build());
    }
    
    // Delete learning material
    @DeleteMapping("/materials/{id}")
    public ResponseEntity<?> deleteMaterial(@PathVariable UUID id) {
        return materialRepository.findById(id)
                .map(material -> {
                    // Get the component and sequence order before deletion
                    ModuleComponent component = material.getComponent();
                    int deletedOrder = material.getSequenceOrder();
                    
                    // If file-based, delete the file
                    if (material.getFilePath() != null && !material.getFilePath().isEmpty()) {
                        try {
                            fileStorageService.deleteFile(material.getFilePath());
                        } catch (IOException e) {
                            // Log error but continue with deletion
                            System.err.println("Error deleting file: " + e.getMessage());
                        }
                    }
                    
                    // Delete the material
                    materialRepository.delete(material);
                    
                    // Reorder remaining materials
                    List<LearningMaterial> remainingMaterials = 
                        materialRepository.findByComponentOrderBySequenceOrderAsc(component);
                    for (LearningMaterial m : remainingMaterials) {
                        if (m.getSequenceOrder() > deletedOrder) {
                            m.setSequenceOrder(m.getSequenceOrder() - 1);
                            materialRepository.save(m);
                        }
                    }
                    
                    return ResponseEntity.ok(new MessageResponse("Learning material deleted successfully."));
                })
                .orElse(ResponseEntity.notFound().build());
    }
    
    // Reorder learning materials
    @PutMapping("/components/{componentId}/materials/reorder")
    public ResponseEntity<?> reorderMaterials(
            @PathVariable UUID componentId,
            @RequestBody Map<String, List<UUID>> request) {
        
        List<UUID> materialOrder = request.get("materialOrder");
        if (materialOrder == null || materialOrder.isEmpty()) {
            return ResponseEntity.badRequest().body(new MessageResponse("Error: Material order not provided."));
        }
        
        return componentRepository.findById(componentId)
                .map(component -> {
                    // Validate all material IDs belong to this component
                    List<LearningMaterial> componentMaterials = 
                        materialRepository.findByComponentOrderBySequenceOrderAsc(component);
                    List<UUID> componentMaterialIds = componentMaterials.stream()
                            .map(LearningMaterial::getId)
                            .collect(Collectors.toList());
                    
                    if (!componentMaterialIds.containsAll(materialOrder) || 
                            componentMaterialIds.size() != materialOrder.size()) {
                        return ResponseEntity.badRequest()
                                .body(new MessageResponse("Error: Invalid material IDs provided."));
                    }
                    
                    // Update sequence order
                    for (int i = 0; i < materialOrder.size(); i++) {
                        final int newOrder = i + 1;
                        UUID materialId = materialOrder.get(i);
                        materialRepository.findById(materialId).ifPresent(material -> {
                            material.setSequenceOrder(newOrder);
                            materialRepository.save(material);
                        });
                    }
                    
                    return ResponseEntity.ok(new MessageResponse("Learning materials reordered successfully."));
                })
                .orElse(ResponseEntity.notFound().build());
    }
    
    // Track user progress on materials
    @PostMapping("/components/{componentId}/materials/track")
    public ResponseEntity<?> trackMaterialProgress(
            @PathVariable UUID componentId,
            @RequestBody Map<String, Object> request) {
        
        // This would integrate with a user progress tracking service
        // For now, just return success
        return ResponseEntity.ok(new MessageResponse("Progress tracked successfully."));
    }
    
    // Helper method to determine file type from filename
    private String determineFileType(String filename) {
        if (filename == null) return "UNKNOWN";
        
        String lowerCaseName = filename.toLowerCase();
        
        if (lowerCaseName.endsWith(".pdf")) {
            return "PDF";
        } else if (lowerCaseName.endsWith(".ppt") || lowerCaseName.endsWith(".pptx")) {
            return "PRESENTATION";
        } else if (lowerCaseName.endsWith(".mp4") || lowerCaseName.endsWith(".avi") || 
                  lowerCaseName.endsWith(".mov") || lowerCaseName.endsWith(".wmv")) {
            return "VIDEO";
        } else if (lowerCaseName.endsWith(".doc") || lowerCaseName.endsWith(".docx")) {
            return "DOCUMENT";
        } else if (lowerCaseName.endsWith(".html") || lowerCaseName.endsWith(".htm")) {
            return "HTML";
        } else if (lowerCaseName.endsWith(".jpg") || lowerCaseName.endsWith(".jpeg") || 
                  lowerCaseName.endsWith(".png") || lowerCaseName.endsWith(".gif")) {
            return "IMAGE";
        } else {
            return "OTHER";
        }
    }
 // Add this to LearningMaterialController.java
    @PostMapping("/components/learning/materials/upload")
    public ResponseEntity<?> uploadMaterial(
            @RequestParam("file") MultipartFile file,
            @RequestParam("componentId") UUID componentId,
            @RequestParam("title") String title,
            @RequestParam(value = "description", required = false) String description,
            @RequestParam(value = "estimatedDuration", required = false) Integer estimatedDuration) {
        
        return componentRepository.findById(componentId)
                .map(component -> {
                    // Verify this is a learning material component
                    if (component.getType() != ComponentType.LEARNING_MATERIAL && 
                        component.getType() != ComponentType.LEARNING_MATERIALS) {
                        return ResponseEntity.badRequest()
                            .body(new MessageResponse("Component is not a learning material type"));
                    }
                    
                    try {
                        // Store the file
                        String fileName = fileStorageService.storeFile(file);
                        String fileType = determineFileType(file.getOriginalFilename());
                        
                        // Create learning material
                        LearningMaterial material = new LearningMaterial();
                        material.setComponent(component);
                        material.setTitle(title);
                        material.setDescription(description);
                        material.setFileType(fileType);
                        material.setFilePath(fileName);
                        material.setEstimatedDuration(estimatedDuration);
                        
                        // Set sequence order
                        List<LearningMaterial> existingMaterials = 
                            materialRepository.findByComponentOrderBySequenceOrderAsc(component);
                        material.setSequenceOrder(existingMaterials.size() + 1);
                        
                        LearningMaterial savedMaterial = materialRepository.save(material);
                        return ResponseEntity.ok(savedMaterial);
                    } catch (IOException e) {
                        return ResponseEntity.badRequest()
                            .body(new MessageResponse("Failed to store file: " + e.getMessage()));
                    }
                })
                .orElse(ResponseEntity.notFound().build());
    }
}