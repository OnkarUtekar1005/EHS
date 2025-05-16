package com.ehs.elearning.service;

import com.ehs.elearning.model.Material;
import com.ehs.elearning.model.Material.MaterialType;
import com.ehs.elearning.model.Users;
import com.ehs.elearning.repository.MaterialRepository;
import com.ehs.elearning.repository.UserRepository;
import com.ehs.elearning.service.GoogleDriveService.DriveFileData;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class MaterialService {
    
    private static final Logger logger = LoggerFactory.getLogger(MaterialService.class);
    
    @Autowired
    private MaterialRepository materialRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private GoogleDriveService googleDriveService;
    
    public Material uploadMaterial(String title, String description, MultipartFile file, String type) throws IOException {
        Users currentUser = getCurrentUser();
        
        // Upload file to Google Drive
        DriveFileData driveData = googleDriveService.uploadFile(file, type);
        
        // Create material entity
        Material material = new Material();
        material.setTitle(title);
        material.setDescription(description);
        material.setType(MaterialType.valueOf(type));
        material.setDriveFileId(driveData.getDriveFileId());
        material.setDriveFileUrl(driveData.getDriveFileUrl());
        material.setFileName(driveData.getFileName());
        material.setFileSize(driveData.getFileSize());
        material.setCreatedBy(currentUser);
        
        Material savedMaterial = materialRepository.save(material);
        logger.info("Material created successfully: {}", savedMaterial.getId());
        return savedMaterial;
    }
    
    public Material updateMaterial(UUID id, String title, String description) {
        Material material = materialRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Material not found"));
        
        material.setTitle(title);
        material.setDescription(description);
        
        Material updatedMaterial = materialRepository.save(material);
        logger.info("Material updated successfully: {}", updatedMaterial.getId());
        return updatedMaterial;
    }
    
    public void deleteMaterial(UUID id) {
        Material material = materialRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Material not found"));
        
        try {
            // Delete file from Google Drive
            googleDriveService.deleteFile(material.getDriveFileId());
        } catch (IOException e) {
            logger.error("Error deleting file from Google Drive: ", e);
            // Continue with database deletion even if Drive deletion fails
        }
        
        materialRepository.delete(material);
        logger.info("Material deleted successfully: {}", id);
    }
    
    public Material getMaterial(UUID id) {
        return materialRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Material not found"));
    }
    
    public List<Material> getAllMaterials() {
        List<Material> materials = materialRepository.findAllByOrderByCreatedAtDesc();
        // Initialize the user to avoid lazy loading issues
        materials.forEach(material -> {
            if (material.getCreatedBy() != null) {
                material.getCreatedBy().getUsername();
            }
        });
        return materials;
    }
    
    public List<Material> getMaterialsByType(MaterialType type) {
        return materialRepository.findByTypeOrderByCreatedAtDesc(type);
    }
    
    public List<Material> searchMaterials(String query) {
        List<Material> materials = materialRepository.findByTitleContainingIgnoreCaseOrDescriptionContainingIgnoreCase(query, query);
        // Initialize the user to avoid lazy loading issues
        materials.forEach(material -> {
            if (material.getCreatedBy() != null) {
                material.getCreatedBy().getUsername();
            }
        });
        return materials;
    }
    
    private Users getCurrentUser() {
        String username = ((UserDetails) SecurityContextHolder.getContext()
                .getAuthentication().getPrincipal()).getUsername();
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }
}