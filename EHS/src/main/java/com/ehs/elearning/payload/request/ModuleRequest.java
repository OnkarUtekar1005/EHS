package com.ehs.elearning.payload.request;

import java.util.List;
import java.util.UUID;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class ModuleRequest {
    
    @NotBlank
    @Size(max = 100)
    private String title;
    
    @Size(max = 1000)
    private String description;
    
    private UUID domainId;
    
    private Integer estimatedDuration;
    
    private Integer requiredCompletionScore;
    
    private String status;
    
    private List<ComponentRequest> components;

    // Getters and setters
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

    public UUID getDomainId() {
        return domainId;
    }

    public void setDomainId(UUID domainId) {
        this.domainId = domainId;
    }

    public Integer getEstimatedDuration() {
        return estimatedDuration;
    }

    public void setEstimatedDuration(Integer estimatedDuration) {
        this.estimatedDuration = estimatedDuration;
    }

    public Integer getRequiredCompletionScore() {
        return requiredCompletionScore;
    }

    public void setRequiredCompletionScore(Integer requiredCompletionScore) {
        this.requiredCompletionScore = requiredCompletionScore;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public List<ComponentRequest> getComponents() {
        return components;
    }

    public void setComponents(List<ComponentRequest> components) {
        this.components = components;
    }
}