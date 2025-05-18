package com.ehs.elearning.controller;

import com.ehs.elearning.model.Material;
import com.ehs.elearning.payload.response.MaterialResponse;
import com.ehs.elearning.payload.response.MessageResponse;
import com.ehs.elearning.service.MaterialService;
import com.ehs.elearning.service.GoogleDriveService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v2/materials")
@CrossOrigin(origins = "*", maxAge = 3600)
public class MaterialController {
    
    private static final Logger logger = LoggerFactory.getLogger(MaterialController.class);
    
    @Autowired
    private MaterialService materialService;
    
    @Autowired
    private GoogleDriveService googleDriveService;
    
    @PostMapping("/upload")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> uploadMaterial(
            @RequestParam("file") MultipartFile file,
            @RequestParam("title") String title,
            @RequestParam(value = "description", required = false) String description,
            @RequestParam("type") String type) {
        
        try {
            Material material = materialService.uploadMaterial(title, description, file, type);
            return ResponseEntity.ok(new MaterialResponse(material));
        } catch (Exception e) {
            logger.error("Error uploading material: ", e);
            return ResponseEntity.badRequest()
                    .body(new MessageResponse("Failed to upload material: " + e.getMessage()));
        }
    }
    
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> updateMaterial(
            @PathVariable UUID id,
            @RequestParam("title") String title,
            @RequestParam(value = "description", required = false) String description) {
        
        try {
            Material material = materialService.updateMaterial(id, title, description);
            return ResponseEntity.ok(new MaterialResponse(material));
        } catch (Exception e) {
            logger.error("Error updating material: ", e);
            return ResponseEntity.badRequest()
                    .body(new MessageResponse("Failed to update material: " + e.getMessage()));
        }
    }
    
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deleteMaterial(@PathVariable UUID id) {
        try {
            materialService.deleteMaterial(id);
            return ResponseEntity.ok(new MessageResponse("Material deleted successfully"));
        } catch (Exception e) {
            logger.error("Error deleting material: ", e);
            return ResponseEntity.badRequest()
                    .body(new MessageResponse("Failed to delete material: " + e.getMessage()));
        }
    }
    
    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('USER')")
    public ResponseEntity<?> getMaterial(@PathVariable UUID id) {
        try {
            Material material = materialService.getMaterial(id);
            return ResponseEntity.ok(new MaterialResponse(material));
        } catch (Exception e) {
            logger.error("Error fetching material: ", e);
            return ResponseEntity.badRequest()
                    .body(new MessageResponse("Material not found"));
        }
    }
    
    @GetMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('USER')")
    public ResponseEntity<List<MaterialResponse>> getAllMaterials() {
        List<Material> materials = materialService.getAllMaterials();
        List<MaterialResponse> responses = materials.stream()
                .map(MaterialResponse::new)
                .collect(Collectors.toList());
        return ResponseEntity.ok(responses);
    }
    
    @PostMapping("/{id}/fix-permissions")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> fixMaterialPermissions(@PathVariable UUID id) {
        try {
            Material material = materialService.getMaterial(id);
            
            // Fix Google Drive permissions using the service
            googleDriveService.fixFilePermissions(material.getDriveFileId());
            
            logger.info("Fixed permissions for material: {} (Drive ID: {})", 
                material.getTitle(), material.getDriveFileId());
            
            return ResponseEntity.ok(new MessageResponse("Permissions updated successfully"));
        } catch (Exception e) {
            logger.error("Error fixing permissions: ", e);
            return ResponseEntity.badRequest()
                    .body(new MessageResponse("Failed to fix permissions: " + e.getMessage()));
        }
    }
    
    @GetMapping("/search")
    @PreAuthorize("hasRole('ADMIN') or hasRole('USER')")
    public ResponseEntity<List<MaterialResponse>> searchMaterials(@RequestParam("query") String query) {
        List<Material> materials = materialService.searchMaterials(query);
        List<MaterialResponse> responses = materials.stream()
                .map(MaterialResponse::new)
                .collect(Collectors.toList());
        return ResponseEntity.ok(responses);
    }
}