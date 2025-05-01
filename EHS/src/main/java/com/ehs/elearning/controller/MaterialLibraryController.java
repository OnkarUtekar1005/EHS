package com.ehs.elearning.controller;

import com.ehs.elearning.model.LearningMaterial;
import com.ehs.elearning.model.ComponentMaterialAssociation;
import com.ehs.elearning.model.ModuleComponent;
import com.ehs.elearning.payload.request.LearningMaterialRequest;
import com.ehs.elearning.payload.response.MessageResponse;
import com.ehs.elearning.repository.LearningMaterialRepository;
import com.ehs.elearning.repository.ComponentMaterialAssociationRepository;
import com.ehs.elearning.repository.ModuleComponentRepository;
import com.ehs.elearning.service.FileStorageService;
import com.ehs.elearning.service.LearningMaterialService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import jakarta.validation.Valid;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/material-library")
public class MaterialLibraryController {

    @Autowired
    private LearningMaterialService learningMaterialService;
    
    @Autowired
    private LearningMaterialRepository materialRepository;
    
    @Autowired
    private ModuleComponentRepository componentRepository;
    
    @Autowired
    private ComponentMaterialAssociationRepository associationRepository;
    
    @Autowired
    private FileStorageService fileStorageService;
    
    /**
     * Get all materials with pagination and filtering
     */
    @GetMapping
    public ResponseEntity<?> getAllMaterials(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "title") String sortBy,
            @RequestParam(required = false) String title,
            @RequestParam(required = false) String fileType) {
        
        try {
            Pageable pageable = PageRequest.of(page, size, Sort.by(sortBy));
            Page<LearningMaterial> materials;
            
            // Apply filters if provided
            if (title != null && !title.isEmpty() && fileType != null && !fileType.isEmpty()) {
                materials = materialRepository.findByTitleContainingIgnoreCaseAndFileType(title, fileType, pageable);
            } else if (title != null && !title.isEmpty()) {
                materials = materialRepository.findByTitleContainingIgnoreCase(title, pageable);
            } else if (fileType != null && !fileType.isEmpty()) {
                materials = materialRepository.findByFileType(fileType, pageable);
            } else {
                materials = materialRepository.findAll(pageable);
            }
            
            return ResponseEntity.ok()
                    .header("X-Total-Count", String.valueOf(materials.getTotalElements()))
                    .header("X-Total-Pages", String.valueOf(materials.getTotalPages()))
                    .body(materials.getContent());
                    
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(new MessageResponse("Error retrieving materials: " + e.getMessage()));
        }
    }
    
    /**
     * Get material by ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<?> getMaterialById(@PathVariable UUID id) {
        try {
            Optional<LearningMaterial> materialOpt = materialRepository.findById(id);
            if (!materialOpt.isPresent()) {
                return ResponseEntity.notFound().build();
            }
            
            return ResponseEntity.ok(materialOpt.get());
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(new MessageResponse("Error retrieving material: " + e.getMessage()));
        }
    }
    
    /**
     * Upload file-based learning material
     */
    @PostMapping("/file")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> createFileMaterial(
            @RequestParam("file") MultipartFile file,
            @RequestParam("title") String title,
            @RequestParam(value = "description", required = false) String description,
            @RequestParam(value = "estimatedDuration", required = false) Integer estimatedDuration) {
        
        try {
            // Determine file type based on filename
            String fileType = determineFileType(file.getOriginalFilename());
            
            // Create the material
            LearningMaterial material = new LearningMaterial();
            material.setTitle(title);
            material.setDescription(description);
            material.setFileType(fileType);
            material.setEstimatedDuration(estimatedDuration);
            
            // Save file to storage
            String filePath = fileStorageService.storeFile(file);
            material.setFilePath(filePath);
            
            LearningMaterial savedMaterial = materialRepository.save(material);
            return ResponseEntity.ok(savedMaterial);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(new MessageResponse("Failed to create file material: " + e.getMessage()));
        }
    }
    
    /**
     * Create content-based learning material
     */
    @PostMapping("/content")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> createContentMaterial(
            @Valid @RequestBody LearningMaterialRequest materialRequest) {
        
        try {
            LearningMaterial material = new LearningMaterial();
            material.setTitle(materialRequest.getTitle());
            material.setDescription(materialRequest.getDescription());
            material.setFileType("HTML");
            material.setContent(materialRequest.getContent());
            material.setEstimatedDuration(materialRequest.getEstimatedDuration());
            
            LearningMaterial savedMaterial = materialRepository.save(material);
            return ResponseEntity.ok(savedMaterial);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(new MessageResponse("Failed to create content material: " + e.getMessage()));
        }
    }
    
    /**
     * Create external URL learning material
     */
    @PostMapping("/external")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> createExternalMaterial(
            @Valid @RequestBody LearningMaterialRequest materialRequest) {
        
        try {
            LearningMaterial material = new LearningMaterial();
            material.setTitle(materialRequest.getTitle());
            material.setDescription(materialRequest.getDescription());
            material.setFileType(materialRequest.getFileType());
            material.setExternalUrl(materialRequest.getExternalUrl());
            material.setEstimatedDuration(materialRequest.getEstimatedDuration());
            
            LearningMaterial savedMaterial = materialRepository.save(material);
            return ResponseEntity.ok(savedMaterial);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(new MessageResponse("Failed to create external material: " + e.getMessage()));
        }
    }
    
    /**
     * Update learning material
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
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
                    
                    LearningMaterial updatedMaterial = materialRepository.save(material);
                    return ResponseEntity.ok(updatedMaterial);
                })
                .orElse(ResponseEntity.notFound().build());
    }
    
    /**
     * Delete learning material
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public ResponseEntity<?> deleteMaterial(@PathVariable UUID id) {
        try {
            Optional<LearningMaterial> materialOpt = materialRepository.findById(id);
            if (!materialOpt.isPresent()) {
                return ResponseEntity.notFound().build();
            }
            
            LearningMaterial material = materialOpt.get();
            
            // Remove all associations first
            List<ComponentMaterialAssociation> associations = associationRepository.findByMaterial(material);
            associationRepository.deleteAll(associations);
            
            // Delete file if exists
            if (material.getFilePath() != null && !material.getFilePath().isEmpty()) {
                try {
                    fileStorageService.deleteFile(material.getFilePath());
                } catch (Exception e) {
                    // Just log the error but continue with deletion
                    System.err.println("Error deleting file: " + e.getMessage());
                }
            }
            
            // Delete material
            materialRepository.delete(material);
            
            return ResponseEntity.ok(new MessageResponse("Material deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(new MessageResponse("Failed to delete material: " + e.getMessage()));
        }
    }
    
    /**
     * Get all components using a specific material
     */
    @GetMapping("/{id}/components")
    public ResponseEntity<?> getComponentsUsingMaterial(@PathVariable UUID id) {
        try {
            Optional<LearningMaterial> materialOpt = materialRepository.findById(id);
            if (!materialOpt.isPresent()) {
                return ResponseEntity.notFound().build();
            }
            
            List<ComponentMaterialAssociation> associations = associationRepository.findByMaterial(materialOpt.get());
            List<ModuleComponent> components = associations.stream()
                .map(ComponentMaterialAssociation::getComponent)
                .collect(Collectors.toList());
            
            return ResponseEntity.ok(components);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(new MessageResponse("Error retrieving components: " + e.getMessage()));
        }
    }
    
    /**
     * Associate material with a component
     */
    @PostMapping("/{materialId}/components/{componentId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> associateMaterialWithComponent(
            @PathVariable UUID materialId,
            @PathVariable UUID componentId,
            @RequestParam(defaultValue = "0") Integer sequenceOrder) {
        
        try {
            Optional<LearningMaterial> materialOpt = materialRepository.findById(materialId);
            Optional<ModuleComponent> componentOpt = componentRepository.findById(componentId);
            
            if (!materialOpt.isPresent() || !componentOpt.isPresent()) {
                return ResponseEntity.notFound().build();
            }
            
            // Check if association already exists
            if (associationRepository.existsByComponentAndMaterial(componentOpt.get(), materialOpt.get())) {
                return ResponseEntity.badRequest()
                    .body(new MessageResponse("Material is already associated with this component"));
            }
            
            // Determine sequence order if not provided
            if (sequenceOrder <= 0) {
                List<ComponentMaterialAssociation> existing = 
                    associationRepository.findByComponentOrderBySequenceOrderAsc(componentOpt.get());
                sequenceOrder = existing.size() + 1;
            }
            
            // Create association
            ComponentMaterialAssociation association = new ComponentMaterialAssociation(
                componentOpt.get(), materialOpt.get(), sequenceOrder);
            
            associationRepository.save(association);
            
            return ResponseEntity.ok(new MessageResponse("Material associated with component successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(new MessageResponse("Failed to associate material: " + e.getMessage()));
        }
    }
    
    /**
     * Disassociate material from a component
     */
    @DeleteMapping("/{materialId}/components/{componentId}")
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public ResponseEntity<?> disassociateMaterialFromComponent(
            @PathVariable UUID materialId,
            @PathVariable UUID componentId) {
        
        try {
            Optional<LearningMaterial> materialOpt = materialRepository.findById(materialId);
            Optional<ModuleComponent> componentOpt = componentRepository.findById(componentId);
            
            if (!materialOpt.isPresent() || !componentOpt.isPresent()) {
                return ResponseEntity.notFound().build();
            }
            
            // Find and delete the association
            associationRepository.deleteByComponentAndMaterial(componentOpt.get(), materialOpt.get());
            
            return ResponseEntity.ok(new MessageResponse("Material disassociated from component successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(new MessageResponse("Failed to disassociate material: " + e.getMessage()));
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