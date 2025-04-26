package com.ehs.elearning.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import com.fasterxml.jackson.annotation.JsonIgnore;
import java.util.UUID;

@Entity
@Table(name = "module_components")
public class ModuleComponent {
    
    @Id
    @GeneratedValue
    private UUID id;
    
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "module_id", nullable = false)
    @JsonIgnore
    private TrainingModule trainingModule;
    
    private Integer sequenceOrder;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ComponentType type;
    
    @NotBlank
    @Size(max = 100)
    private String title;
    
    @Size(max = 500)
    @Column(length = 500)
    private String description;
    
    @Column(columnDefinition = "text")
    private String content; // JSON data specific to component type stored as text
    
    private Boolean requiredToAdvance = true;
    
    private Integer estimatedDuration; // in minutes
    
    // Constructors
    public ModuleComponent() {
    }
    
    // Getters and Setters
    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public TrainingModule getTrainingModule() {
        return trainingModule;
    }

    public void setTrainingModule(TrainingModule trainingModule) {
        this.trainingModule = trainingModule;
    }

    public Integer getSequenceOrder() {
        return sequenceOrder;
    }

    public void setSequenceOrder(Integer sequenceOrder) {
        this.sequenceOrder = sequenceOrder;
    }

    public ComponentType getType() {
        return type;
    }

    public void setType(ComponentType type) {
        this.type = type;
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

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public Boolean getRequiredToAdvance() {
        return requiredToAdvance;
    }

    public void setRequiredToAdvance(Boolean requiredToAdvance) {
        this.requiredToAdvance = requiredToAdvance;
    }

    public Integer getEstimatedDuration() {
        return estimatedDuration;
    }

    public void setEstimatedDuration(Integer estimatedDuration) {
        this.estimatedDuration = estimatedDuration;
    }
}