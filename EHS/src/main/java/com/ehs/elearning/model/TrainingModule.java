package com.ehs.elearning.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "training_modules")
public class TrainingModule {
    
    @Id
    @GeneratedValue
    private UUID id;
    
    @NotBlank
    @Size(max = 100)
    private String title;
    
    @Size(max = 1000)
    @Column(length = 1000)
    private String description;
    
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "domain_id", nullable = false)
    private Domain domain;
    
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "created_by", nullable = false)
    private Users createdBy;
    
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @Enumerated(EnumType.STRING)
    private ModuleStatus status;
    
    @OneToMany(mappedBy = "trainingModule", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ModuleComponent> components = new ArrayList<>();
    
    private Integer requiredCompletionScore;
    
    private Integer estimatedDuration; // in minutes
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        // Set default status to DRAFT
        if (status == null) {
            status = ModuleStatus.DRAFT;
        }
    }
    
    // Utility method to add a component
    public void addComponent(ModuleComponent component) {
        components.add(component);
        component.setTrainingModule(this);
    }
    
    // Utility method to remove a component
    public void removeComponent(ModuleComponent component) {
        components.remove(component);
        component.setTrainingModule(null);
    }
    
    // Constructors
    public TrainingModule() {
    }
    
    public TrainingModule(String title, String description, Domain domain, Users createdBy) {
        this.title = title;
        this.description = description;
        this.domain = domain;
        this.createdBy = createdBy;
        this.status = ModuleStatus.DRAFT;
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

    public Domain getDomain() {
        return domain;
    }

    public void setDomain(Domain domain) {
        this.domain = domain;
    }

    public Users getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(Users createdBy) {
        this.createdBy = createdBy;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public ModuleStatus getStatus() {
        return status;
    }

    public void setStatus(ModuleStatus status) {
        this.status = status;
    }

    public List<ModuleComponent> getComponents() {
        return components;
    }

    public void setComponents(List<ModuleComponent> components) {
        this.components = components;
    }

    public Integer getRequiredCompletionScore() {
        return requiredCompletionScore;
    }

    public void setRequiredCompletionScore(Integer requiredCompletionScore) {
        this.requiredCompletionScore = requiredCompletionScore;
    }

    public Integer getEstimatedDuration() {
        return estimatedDuration;
    }

    public void setEstimatedDuration(Integer estimatedDuration) {
        this.estimatedDuration = estimatedDuration;
    }
}