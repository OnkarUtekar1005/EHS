package com.ehs.elearning.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "materials")
public class Material {
    
    @Id
    @GeneratedValue
    private UUID id;
    
    @NotBlank
    private String title;
    
    @Column(columnDefinition = "TEXT")
    private String description;
    
    @NotNull
    @Enumerated(EnumType.STRING)
    private MaterialType type;
    
    // Google Drive fields
    @NotBlank
    @Column(name = "drive_file_id")
    private String driveFileId;
    
    @NotBlank
    @Column(name = "drive_file_url")
    private String driveFileUrl;
    
    @NotBlank
    @Column(name = "file_name")
    private String fileName;
    
    @Column(name = "file_size")
    private Long fileSize;
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Users createdBy;
    
    public enum MaterialType {
        PDF,
        VIDEO,
        PPT
    }
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
    
    // Constructors
    public Material() {
    }
    
    public Material(String title, MaterialType type, String driveFileId, String driveFileUrl, String fileName, Long fileSize, Users createdBy) {
        this.title = title;
        this.type = type;
        this.driveFileId = driveFileId;
        this.driveFileUrl = driveFileUrl;
        this.fileName = fileName;
        this.fileSize = fileSize;
        this.createdBy = createdBy;
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
    
    public Users getCreatedBy() {
        return createdBy;
    }
    
    public void setCreatedBy(Users createdBy) {
        this.createdBy = createdBy;
    }
}