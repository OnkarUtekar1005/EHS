package com.ehs.elearning.model;

import jakarta.persistence.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "user_progress")
public class UserProgress {
    
    @Id
    @GeneratedValue
    private UUID id;
    
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id", nullable = false)
    private Users user;
    
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "module_id", nullable = false)
    private TrainingModule module;
    
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "component_id")
    private ModuleComponent component;
    
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "material_id")
    private LearningMaterial material;
    
    @Column(nullable = false)
    private String progressType; // MODULE_STARTED, COMPONENT_COMPLETED, MATERIAL_VIEWED
    
    private Double progressValue; // For partial progress tracking (0-100)
    
    @Column(nullable = false)
    private LocalDateTime timestamp;
    
    private Integer scoreValue; // For assessment scores
    
    private Integer timeSpent; // Time spent in seconds
    
    @PrePersist
    protected void onCreate() {
        timestamp = LocalDateTime.now();
    }
    
    // Constructors
    public UserProgress() {
    }
    
    // For tracking module start
    public UserProgress(Users user, TrainingModule module, String progressType) {
        this.user = user;
        this.module = module;
        this.progressType = progressType;
    }
    
    // For tracking component completion
    public UserProgress(Users user, TrainingModule module, ModuleComponent component, String progressType) {
        this.user = user;
        this.module = module;
        this.component = component;
        this.progressType = progressType;
    }
    
    // For tracking material progress
    public UserProgress(Users user, TrainingModule module, ModuleComponent component, 
                      LearningMaterial material, String progressType, Double progressValue) {
        this.user = user;
        this.module = module;
        this.component = component;
        this.material = material;
        this.progressType = progressType;
        this.progressValue = progressValue;
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

    public TrainingModule getModule() {
        return module;
    }

    public void setModule(TrainingModule module) {
        this.module = module;
    }

    public ModuleComponent getComponent() {
        return component;
    }

    public void setComponent(ModuleComponent component) {
        this.component = component;
    }

    public LearningMaterial getMaterial() {
        return material;
    }

    public void setMaterial(LearningMaterial material) {
        this.material = material;
    }

    public String getProgressType() {
        return progressType;
    }

    public void setProgressType(String progressType) {
        this.progressType = progressType;
    }

    public Double getProgressValue() {
        return progressValue;
    }

    public void setProgressValue(Double progressValue) {
        this.progressValue = progressValue;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }

    public Integer getScoreValue() {
        return scoreValue;
    }

    public void setScoreValue(Integer scoreValue) {
        this.scoreValue = scoreValue;
    }

    public Integer getTimeSpent() {
        return timeSpent;
    }

    public void setTimeSpent(Integer timeSpent) {
        this.timeSpent = timeSpent;
    }
}