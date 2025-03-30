package com.ehs.elearning.model;

import jakarta.persistence.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "user_module_progress")
public class UserModuleProgress {
    
    @Id
    @GeneratedValue
    private UUID id;
    
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id", nullable = false)
    private Users user;
    
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "module_id", nullable = false)
    private TrainingModule trainingModule;
    
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "current_component_id")
    private ModuleComponent currentComponent;
    
    @Enumerated(EnumType.STRING)
    private ProgressState state = ProgressState.NOT_STARTED;
    
    private Float preAssessmentScore;
    
    private Float postAssessmentScore;
    
    private Float improvementScore;
    
    @Column(nullable = false, updatable = false)
    private LocalDateTime startedAt;
    
    private LocalDateTime completedAt;
    
    private LocalDateTime lastAccessedAt;
    
    private Integer timeSpent = 0; // in minutes
    
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
    public UserModuleProgress() {
    }
    
    public UserModuleProgress(Users user, TrainingModule trainingModule) {
        this.user = user;
        this.trainingModule = trainingModule;
        this.state = ProgressState.NOT_STARTED;
    }
    
    // Helper method to update state based on component progress
    public void updateState() {
        if (state == ProgressState.NOT_STARTED && currentComponent != null) {
            state = ProgressState.IN_PROGRESS;
        }
        
        if (state == ProgressState.IN_PROGRESS && completedAt != null) {
            state = ProgressState.COMPLETED;
            
            // Calculate improvement if both scores are available
            if (preAssessmentScore != null && postAssessmentScore != null) {
                improvementScore = postAssessmentScore - preAssessmentScore;
            }
        }
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

    public TrainingModule getTrainingModule() {
        return trainingModule;
    }

    public void setTrainingModule(TrainingModule trainingModule) {
        this.trainingModule = trainingModule;
    }

    public ModuleComponent getCurrentComponent() {
        return currentComponent;
    }

    public void setCurrentComponent(ModuleComponent currentComponent) {
        this.currentComponent = currentComponent;
    }

    public ProgressState getState() {
        return state;
    }

    public void setState(ProgressState state) {
        this.state = state;
    }

    public Float getPreAssessmentScore() {
        return preAssessmentScore;
    }

    public void setPreAssessmentScore(Float preAssessmentScore) {
        this.preAssessmentScore = preAssessmentScore;
    }

    public Float getPostAssessmentScore() {
        return postAssessmentScore;
    }

    public void setPostAssessmentScore(Float postAssessmentScore) {
        this.postAssessmentScore = postAssessmentScore;
    }

    public Float getImprovementScore() {
        return improvementScore;
    }

    public void setImprovementScore(Float improvementScore) {
        this.improvementScore = improvementScore;
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
}