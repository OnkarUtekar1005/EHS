package com.ehs.elearning.payload.response;

import com.ehs.elearning.model.Material;
import com.ehs.elearning.model.Material.MaterialType;

import java.time.LocalDateTime;
import java.util.UUID;

public class MaterialResponse {
    
    private UUID id;
    private String title;
    private String description;
    private MaterialType type;
    private String driveFileId;
    private String driveFileUrl;
    private String fileName;
    private Long fileSize;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private String createdByUsername;
    
    // Constructor to create from Material entity
    public MaterialResponse(Material material) {
        this.id = material.getId();
        this.title = material.getTitle();
        this.description = material.getDescription();
        this.type = material.getType();
        this.driveFileId = material.getDriveFileId();
        this.driveFileUrl = material.getDriveFileUrl();
        this.fileName = material.getFileName();
        this.fileSize = material.getFileSize();
        this.createdAt = material.getCreatedAt();
        this.updatedAt = material.getUpdatedAt();
        // Safely access the username to avoid lazy loading issues
        this.createdByUsername = material.getCreatedBy() != null ? material.getCreatedBy().getUsername() : null;
    }
    
    // Default constructor
    public MaterialResponse() {
    }
    
    // Getters and Setters
    public UUID getId() {
        return id;
    }
    
    public void setId(UUID id) {
        this.id = id;
    }
    
    public String getTitle() {
        return title;
    }
    
    public void setTitle(String title) {
        this.title = title;
    }
    
    public String getDescription() {
        return description;
    }
    
    public void setDescription(String description) {
        this.description = description;
    }
    
    public MaterialType getType() {
        return type;
    }
    
    public void setType(MaterialType type) {
        this.type = type;
    }
    
    public String getDriveFileId() {
        return driveFileId;
    }
    
    public void setDriveFileId(String driveFileId) {
        this.driveFileId = driveFileId;
    }
    
    public String getDriveFileUrl() {
        return driveFileUrl;
    }
    
    public void setDriveFileUrl(String driveFileUrl) {
        this.driveFileUrl = driveFileUrl;
    }
    
    public String getFileName() {
        return fileName;
    }
    
    public void setFileName(String fileName) {
        this.fileName = fileName;
    }
    
    public Long getFileSize() {
        return fileSize;
    }
    
    public void setFileSize(Long fileSize) {
        this.fileSize = fileSize;
    }
    
    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
    
    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
    
    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
    
    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
    
    public String getCreatedByUsername() {
        return createdByUsername;
    }
    
    public void setCreatedByUsername(String createdByUsername) {
        this.createdByUsername = createdByUsername;
    }
}