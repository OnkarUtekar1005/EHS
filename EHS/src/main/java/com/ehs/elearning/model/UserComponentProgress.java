package com.ehs.elearning.model;

import jakarta.persistence.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "user_component_progress")
public class UserComponentProgress {
    
    @Id
    @GeneratedValue
    private UUID id;
    
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id", nullable = false)
    private Users user;
    
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "component_id", nullable = false)
    private ModuleComponent component;
    
    private Boolean completed = false;
    
    private Integer score; // For assessment components
    
    private Integer timeSpent = 0; // in minutes
    
    @Column(nullable = false, updatable = false)
    private LocalDateTime startedAt;
    
    private LocalDateTime completedAt;
    
    private LocalDateTime lastAccessedAt;
    
    @PrePersist
    protected void onCreate() {
        startedAt = LocalDateTime.now();
        lastAccessedAt = LocalDateTime.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        lastAccessedAt = LocalDateTime.now();
    }
    
    // Constructors
    public UserComponentProgress() {
    }
    
    public UserComponentProgress(Users user, ModuleComponent component) {
        this.user = user;
        this.component = component;
    }
    
    // Getters and Setters
    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public Users getUser() {
        return user;
    }

    public void setUser(Users user) {
        this.user = user;
    }

    public ModuleComponent getComponent() {
        return component;
    }

    public void setComponent(ModuleComponent component) {
        this.component = component;
    }

    public Boolean getCompleted() {
        return completed;
    }

    public void setCompleted(Boolean completed) {
        this.completed = completed;
        if (completed && completedAt == null) {
            completedAt = LocalDateTime.now();
        }
    }

    public Integer getScore() {
        return score;
    }

    public void setScore(Integer score) {
        this.score = score;
    }

    public Integer getTimeSpent() {
        return timeSpent;
    }

    public void setTimeSpent(Integer timeSpent) {
        this.timeSpent = timeSpent;
    }
    
    // Add time spent
    public void addTimeSpent(Integer additionalMinutes) {
        if (additionalMinutes != null && additionalMinutes > 0) {
            this.timeSpent = (this.timeSpent != null ? this.timeSpent : 0) + additionalMinutes;
        }
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

    public LocalDateTime getLastAccessedAt() {
        return lastAccessedAt;
    }

    public void setLastAccessedAt(LocalDateTime lastAccessedAt) {
        this.lastAccessedAt = lastAccessedAt;
    }
}