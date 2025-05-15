package com.ehs.elearning.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import com.ehs.elearning.model.LearningMaterial;
import com.ehs.elearning.model.ModuleComponent;
import com.ehs.elearning.model.ModuleStatus;
import com.ehs.elearning.payload.response.MessageResponse;
import com.ehs.elearning.repository.LearningMaterialRepository;
import com.ehs.elearning.repository.ModuleComponentRepository;
import com.ehs.elearning.service.FileStorageService;

import jakarta.persistence.EntityNotFoundException;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/materials")
@CrossOrigin(origins = "*", maxAge = 3600)
public class LearningMaterialController {

    @Autowired
    private LearningMaterialRepository learningMaterialRepository;
    
    @Autowired
    private ModuleComponentRepository moduleComponentRepository;
    
    @Autowired
    private FileStorageService fileStorageService;
    
    // Upload a learning material file
    @PostMapping("/upload")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> uploadMaterial(
            @RequestParam("file") MultipartFile file,
            @RequestParam("title") String title,
            @RequestParam(value = "description", required = false) String description,
            @RequestParam("componentId") UUID componentId,
            @RequestParam(value = "estimatedDuration", required = false) Integer estimatedDuration) {
        
        try {
            ModuleComponent component = moduleComponentRepository.findById(componentId)
                .orElseThrow(() -> new EntityNotFoundException("Module component not found with id: " + componentId));
            
            // Can't modify published modules
            if (component.getTrainingModule().getStatus() == ModuleStatus.PUBLISHED) {
                throw new IllegalStateException("Cannot modify a published module");
            }
            
            // Save the file
            String fileName = fileStorageService.storeFile(file);
            
            // Detect file type
            String fileType = detectFileType(file.getOriginalFilename());
            
            // Create learning material
            LearningMaterial material = new LearningMaterial();
            material.setTitle(title);
            material.setDescription(description);
            material.setFileType(fileType);
            material.setFilePath(fileName);
            material.setEstimatedDuration(estimatedDuration);
            material.setModuleComponent(component);
            
            // Set sequence order
            Integer maxSequence = learningMaterialRepository.findMaxSequenceOrderByComponent(component);
            material.setSequenceOrder(maxSequence != null ? maxSequence + 1 : 1);
            
            LearningMaterial savedMaterial = learningMaterialRepository.save(material);
            
            return ResponseEntity.status(HttpStatus.CREATED).body(savedMaterial);
        } catch (EntityNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new MessageResponse(e.getMessage()));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(new MessageResponse(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new MessageResponse("Could not upload file: " + e.getMessage()));
        }
    }
    
    // Get all materials for a component
    @GetMapping("/component/{componentId}")
    public ResponseEntity<?> getMaterialsByComponent(@PathVariable UUID componentId) {
        try {
            ModuleComponent component = moduleComponentRepository.findById(componentId)
                .orElseThrow(() -> new EntityNotFoundException("Module component not found with id: " + componentId));
            
            List<LearningMaterial> materials = learningMaterialRepository.findByModuleComponentOrderBySequenceOrderAsc(component);
            
            return ResponseEntity.ok(materials);
        } catch (EntityNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new MessageResponse(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage()));
        }
    }
    
    // Get a material by ID
    @GetMapping("/{id}")
    public ResponseEntity<?> getMaterialById(@PathVariable UUID id) {
        try {
            LearningMaterial material = learningMaterialRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Learning material not found with id: " + id));
            
            return ResponseEntity.ok(material);
        } catch (EntityNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new MessageResponse(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage()));
        }
    }
    
    // Update a material
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> updateMaterial(
            @PathVariable UUID id,
            @RequestParam(value = "title", required = false) String title,
            @RequestParam(value = "description", required = false) String description,
            @RequestParam(value = "estimatedDuration", required = false) Integer estimatedDuration) {
        
        try {
            LearningMaterial material = learningMaterialRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Learning material not found with id: " + id));
            
            // Can't modify published modules
            if (material.getModuleComponent().getTrainingModule().getStatus() == ModuleStatus.PUBLISHED) {
                throw new IllegalStateException("Cannot modify a published module");
            }
            
            if (title != null) {
                material.setTitle(title);
            }
            if (description != null) {
                material.setDescription(description);
            }
            if (estimatedDuration != null) {
                material.setEstimatedDuration(estimatedDuration);
            }
            
            LearningMaterial updatedMaterial = learningMaterialRepository.save(material);
            
            return ResponseEntity.ok(updatedMaterial);
        } catch (EntityNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new MessageResponse(e.getMessage()));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(new MessageResponse(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage()));
        }
    }
    
    // Replace a material file
    @PutMapping("/{id}/file")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> replaceMaterialFile(
            @PathVariable UUID id,
            @RequestParam("file") MultipartFile file) {
        
        try {
            LearningMaterial material = learningMaterialRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Learning material not found with id: " + id));
            
            // Can't modify published modules
            if (material.getModuleComponent().getTrainingModule().getStatus() == ModuleStatus.PUBLISHED) {
                throw new IllegalStateException("Cannot modify a published module");
            }
            
            // Delete old file if it exists
            if (material.getFilePath() != null) {
                fileStorageService.deleteFile(material.getFilePath());
            }
            
            // Save the new file
            String fileName = fileStorageService.storeFile(file);
            
            // Update file type
            String fileType = detectFileType(file.getOriginalFilename());
            material.setFileType(fileType);
            material.setFilePath(fileName);
            
            LearningMaterial updatedMaterial = learningMaterialRepository.save(material);
            
            return ResponseEntity.ok(updatedMaterial);
        } catch (EntityNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new MessageResponse(e.getMessage()));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(new MessageResponse(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new MessageResponse("Could not update file: " + e.getMessage()));
        }
    }
    
    // Delete a material
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deleteMaterial(@PathVariable UUID id) {
        try {
            LearningMaterial material = learningMaterialRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Learning material not found with id: " + id));
            
            // Can't modify published modules
            if (material.getModuleComponent().getTrainingModule().getStatus() == ModuleStatus.PUBLISHED) {
                throw new IllegalStateException("Cannot modify a published module");
            }
            
            // Delete the file
            if (material.getFilePath() != null) {
                fileStorageService.deleteFile(material.getFilePath());
            }
            
            learningMaterialRepository.deleteById(id);
            
            return ResponseEntity.ok(new MessageResponse("Learning material deleted successfully"));
        } catch (EntityNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new MessageResponse(e.getMessage()));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(new MessageResponse(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage()));
        }
    }
    
    // Update material order
    @PutMapping("/component/{componentId}/order")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> updateMaterialOrder(
            @PathVariable UUID componentId,
            @RequestBody List<UUID> materialIds) {
        
        try {
            ModuleComponent component = moduleComponentRepository.findById(componentId)
                .orElseThrow(() -> new EntityNotFoundException("Module component not found with id: " + componentId));
            
            // Can't modify published modules
            if (component.getTrainingModule().getStatus() == ModuleStatus.PUBLISHED) {
                throw new IllegalStateException("Cannot modify a published module");
            }
            
            // Validate all material IDs belong to this component
            for (int i = 0; i < materialIds.size(); i++) {
                UUID materialId = materialIds.get(i);
                LearningMaterial material = learningMaterialRepository.findById(materialId)
                    .orElseThrow(() -> new EntityNotFoundException("Learning material not found with id: " + materialId));
                
                if (!material.getModuleComponent().getId().equals(componentId)) {
                    throw new IllegalArgumentException("Material with id " + materialId + 
                                                     " does not belong to component with id " + componentId);
                }
                
                // Update sequence order
                material.setSequenceOrder(i + 1);
                learningMaterialRepository.save(material);
            }
            
            return ResponseEntity.ok(new MessageResponse("Material order updated successfully"));
        } catch (EntityNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new MessageResponse(e.getMessage()));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(new MessageResponse(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage()));
        }
    }
    
    // Helper method to detect file type
    private String detectFileType(String fileName) {
        if (fileName == null) {
            return "UNKNOWN";
        }
        
        String extension = fileName.substring(fileName.lastIndexOf(".") + 1).toLowerCase();
        
        switch (extension) {
            case "pdf":
                return "PDF";
            case "mp4":
            case "avi":
            case "mov":
            case "wmv":
                return "VIDEO";
            case "ppt":
            case "pptx":
                return "PPT";
            case "doc":
            case "docx":
                return "DOC";
            case "xls":
            case "xlsx":
                return "XLS";
            case "jpg":
            case "jpeg":
            case "png":
            case "gif":
                return "IMAGE";
            default:
                return "OTHER";
        }
    }
}