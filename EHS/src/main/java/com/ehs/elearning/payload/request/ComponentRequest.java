package com.ehs.elearning.payload.request;

import com.ehs.elearning.model.ComponentType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public class ComponentRequest {
    
    @NotNull
    private ComponentType type;
    
    @NotBlank
    @Size(max = 100)
    private String title;
    
    @Size(max = 500)
    private String description;
    
    private Integer sequenceOrder;
    
    private String content; // JSON content
    
    private Boolean requiredToAdvance = true;
    
    private Integer estimatedDuration;
    
    // Getters and Setters
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

    public Integer getSequenceOrder() {
        return sequenceOrder;
    }

    public void setSequenceOrder(Integer sequenceOrder) {
        this.sequenceOrder = sequenceOrder;
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