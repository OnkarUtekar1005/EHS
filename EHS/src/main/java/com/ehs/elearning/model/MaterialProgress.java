package com.ehs.elearning.model;

import jakarta.persistence.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "material_progress")
public class MaterialProgress {
    
    @Id
    @GeneratedValue
    private UUID id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "material_id", nullable = false)
    private LearningMaterial material;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private Users user;
    
    private Integer progress; // Percentage (0-100)
    
    private Integer timeSpent; // Seconds spent on this material
    
    private Boolean completed = false;
    
    @Column(nullable = false)
    private LocalDateTime lastAccessedAt;
    
    @Column(nullable = false, updatable = false)
    private LocalDateTime startedAt;
    
    private LocalDateTime completedAt;
    
    @PrePersist
    protected void onCreate() {
        startedAt = LocalDateTime.now();
        lastAccessedAt = LocalDateTime.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        lastAccessedAt = LocalDateTime.now();
        
        // Auto-mark as completed if progress reaches 100%
        if (progress != null && progress >= 100 && !completed) {
            completed = true;
            completedAt = LocalDateTime.now();
        }
    }
    
    // Constructors
    public MaterialProgress() {
    }
    
    public MaterialProgress(LearningMaterial material, Users user) {
        this.material = material;
        this.user = user;
        this.progress = 0;
        this.timeSpent = 0;
    }
    
    // Getters and Setters
    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public LearningMaterial getMaterial() {
        return material;
    }

    public void setMaterial(LearningMaterial material) {
        this.material = material;
    }

    public Users getUser() {
        return user;
    }

    public void setUser(Users user) {
        this.user = user;
    }

    public Integer getProgress() {
        return progress;
    }

    public void setProgress(Integer progress) {
        this.progress = progress;
    }

    public Integer getTimeSpent() {
        return timeSpent;
    }

    public void setTimeSpent(Integer timeSpent) {
        this.timeSpent = timeSpent;
    }

    public Boolean getCompleted() {
        return completed;
    }

    public void setCompleted(Boolean completed) {
        this.completed = completed;
    }

    public LocalDateTime getLastAccessedAt() {
        return lastAccessedAt;
    }

    public void setLastAccessedAt(LocalDateTime lastAccessedAt) {
        this.lastAccessedAt = lastAccessedAt;
    }

    public LocalDateTime getStartedAt() {
        return startedAt;
    }

    public LocalDateTime getCompletedAt() {
        return completedAt;
    }

    public void setCompletedAt(LocalDateTime completedAt) {
        this.completedAt = completedAt;
    }
}