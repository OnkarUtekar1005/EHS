package com.ehs.elearning.controller;

import com.ehs.elearning.model.LearningMaterial;
import com.ehs.elearning.model.ModuleComponent;
import com.ehs.elearning.model.ComponentType;
import com.ehs.elearning.model.MaterialProgress;
import com.ehs.elearning.model.Users;
import com.ehs.elearning.payload.request.LearningMaterialRequest;
import com.ehs.elearning.payload.request.MaterialProgressRequest;
import com.ehs.elearning.payload.response.MessageResponse;
import com.ehs.elearning.repository.LearningMaterialRepository;
import com.ehs.elearning.repository.ModuleComponentRepository;
import com.ehs.elearning.repository.MaterialProgressRepository;
import com.ehs.elearning.repository.UserRepository;
import com.ehs.elearning.security.UserDetailsImpl;
import com.ehs.elearning.service.FileStorageService;
import com.ehs.elearning.service.LearningMaterialService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.transaction.annotation.Transactional;

import jakarta.validation.Valid;

import java.io.IOException;
import java.nio.file.Path;
import java.net.MalformedURLException;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api")
public class LearningMaterialController {

    @Autowired
    private LearningMaterialService learningMaterialService;
    
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
     * Get all materials for a component with user progress
     */
    @GetMapping("/components/{componentId}/materials/progress")
    public ResponseEntity<?> getMaterialsWithProgress(@PathVariable UUID componentId) {
        try {
            // Get current authenticated user
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
            UUID userId = userDetails.getId();
            
            List<LearningMaterial> materials = learningMaterialService.getMaterialsWithProgress(componentId, userId);
            return ResponseEntity.ok(materials);
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
            
            LearningMaterial material = learningMaterialService.getMaterialForDisplay(id, userId);
            return ResponseEntity.ok(material);
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
            
            // Update progress using service
            MaterialProgress progress = learningMaterialService.updateProgress(
                id, userId, request.getProgress(), request.getTimeSpent()
            );
            
            // Get updated material to return
            LearningMaterial material = learningMaterialService.getMaterialForDisplay(id, userId);
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
                .body(new MessageResponse("Error streaming file: " + e.getMessage()));
        }
    }

    /**
     * Get all learning materials for a component (without progress)
     */
    @GetMapping("/components/{componentId}/materials")
    public ResponseEntity<?> getMaterialsByComponent(@PathVariable UUID componentId) {
        try {
            List<LearningMaterial> materials = learningMaterialService.getMaterialsWithProgress(componentId, null);
            return ResponseEntity.ok(materials);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(new MessageResponse("Error retrieving materials: " + e.getMessage()));
        }
    }
    
    /**
     * Get learning material by ID (without progress)
     */
    @GetMapping("/materials/{id}")
    public ResponseEntity<?> getMaterialById(@PathVariable UUID id) {
        try {
            LearningMaterial material = learningMaterialService.getMaterialForDisplay(id, null);
            return ResponseEntity.ok(material);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(new MessageResponse("Error retrieving material: " + e.getMessage()));
        }
    }
    
    /**
     * Add file-based learning material
     */
    @PostMapping("/components/{componentId}/materials/file")
    public ResponseEntity<?> addFileMaterial(
            @PathVariable UUID componentId,
            @RequestParam("file") MultipartFile file,
            @RequestParam("title") String title,
            @RequestParam(value = "description", required = false) String description,
            @RequestParam(value = "estimatedDuration", required = false) Integer estimatedDuration) {
        
        try {
            // Determine file type based on filename
            String fileType = determineFileType(file.getOriginalFilename());
            
            // Use service to create material
            LearningMaterial material = learningMaterialService.createMaterial(
                componentId, title, description, fileType, file, null, null, estimatedDuration
            );
            
            return ResponseEntity.ok(material);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(new MessageResponse("Failed to create file material: " + e.getMessage()));
        }
    }
    
    /**
     * Add content-based learning material (HTML, text, etc.)
     */
    @PostMapping("/components/{componentId}/materials/content")
    public ResponseEntity<?> addContentMaterial(
            @PathVariable UUID componentId,
            @Valid @RequestBody LearningMaterialRequest materialRequest) {
        
        try {
            LearningMaterial material = learningMaterialService.createMaterial(
                componentId, 
                materialRequest.getTitle(),
                materialRequest.getDescription(),
                "HTML", // Default for content-based materials
                null,
                materialRequest.getContent(),
                null,
                materialRequest.getEstimatedDuration()
            );
            
            return ResponseEntity.ok(material);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(new MessageResponse("Failed to create content material: " + e.getMessage()));
        }
    }
    
    /**
     * Add external URL learning material (videos, websites, etc.)
     */
    @PostMapping("/components/{componentId}/materials/external")
    public ResponseEntity<?> addExternalMaterial(
            @PathVariable UUID componentId,
            @Valid @RequestBody LearningMaterialRequest materialRequest) {
        
        try {
            LearningMaterial material = learningMaterialService.createMaterial(
                componentId, 
                materialRequest.getTitle(),
                materialRequest.getDescription(),
                materialRequest.getFileType(), 
                null,
                null,
                materialRequest.getExternalUrl(),
                materialRequest.getEstimatedDuration()
            );
            
            return ResponseEntity.ok(material);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(new MessageResponse("Failed to create external material: " + e.getMessage()));
        }
    }
    
    /**
     * Update learning material
     */
//    @PutMapping("/materials/{id}")
//    @Transactional
//    public ResponseEntity<?> updateMaterial(
//            @PathVariable UUID id,
//            @Valid @RequestBody LearningMaterialRequest materialRequest) {
//        
//        return materialRepository.findById(id)
//                .map(material -> {
//                    // Update basic properties
//                    if (materialRequest.getTitle() != null) {
//                        material.setTitle(materialRequest.getTitle());
//                    }
//                    
//                    if (materialRequest.getDescription() != null) {
//                        material.setDescription(materialRequest.getDescription());
//                    }
//                    
//                    if (materialRequest.getContent() != null) {
//                        material.setContent(materialRequest.getContent());
//                    }
//                    
//                    if (materialRequest.getExternalUrl() != null) {
//                        material.setExternalUrl(materialRequest.getExternalUrl());
//                    }
//                    
//                    if (materialRequest.getEstimatedDuration() != null) {
//                        material.setEstimatedDuration(materialRequest.getEstimatedDuration());
//                    }
//                    
//                    // Update sequence order if needed
//                    if (materialRequest.getSequenceOrder() != null &&
//                            !materialRequest.getSequenceOrder().equals(material.getSequenceOrder())) {
//                        
//                        ModuleComponent component = material.getComponent();
//                        int oldOrder = material.getSequenceOrder();
//                        int newOrder = materialRequest.getSequenceOrder();
//                        
//                        List<LearningMaterial> materials = 
//                            materialRepository.findByComponentOrderBySequenceOrderAsc(component);
//                        
//                        // Reorder logic similar to components
//                        for (LearningMaterial m : materials) {
//                            if (m.getId().equals(material.getId())) {
//                                continue; // Skip the material being updated
//                            }
//                            
//                            if (oldOrder < newOrder) { // Moving down
//                                if (m.getSequenceOrder() > oldOrder && m.getSequenceOrder() <= newOrder) {
//                                    m.setSequenceOrder(m.getSequenceOrder() - 1);
//                                    materialRepository.save(m);
//                                }
//                            } else { // Moving up
//                                if (m.getSequenceOrder() >= newOrder && m.getSequenceOrder() < oldOrder) {
//                                    m.setSequenceOrder(m.getSequenceOrder() + 1);
//                                    materialRepository.save(m);
//                                }
//                            }
//                        }
//                        
//                        material.setSequenceOrder(newOrder);
//                    }
//                    
//                    LearningMaterial updatedMaterial = materialRepository.save(material);
//                    return ResponseEntity.ok(updatedMaterial);
//                })
//                .orElse(ResponseEntity.notFound().build());
//    }
//    
    /**
     * Delete learning material
     */
    @DeleteMapping("/materials/{id}")
    public ResponseEntity<?> deleteMaterial(@PathVariable UUID id) {
        try {
            learningMaterialService.deleteMaterial(id);
            return ResponseEntity.ok(new MessageResponse("Learning material deleted successfully."));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(new MessageResponse("Failed to delete material: " + e.getMessage()));
        }
    }
    
    /**
     * Reorder learning materials
     */
    @PutMapping("/components/{componentId}/materials/reorder")
    @Transactional
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
    
    /**
     * Helper method to determine content type for HTTP response
     */
    private String determineContentType(String fileType) {
        if (fileType == null) return "application/octet-stream";
        
        switch (fileType.toUpperCase()) {
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
    
    /**
     * Helper method to determine file type from filename
     */
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
}