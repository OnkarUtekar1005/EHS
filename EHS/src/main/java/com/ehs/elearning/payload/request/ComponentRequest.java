package com.ehs.elearning.payload.request;

import com.ehs.elearning.model.ComponentType;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.util.Map;

@JsonIgnoreProperties(ignoreUnknown = true)
public class ComponentRequest {
    private String title;
    private ComponentType type;
    private String description;
    private String content;
    private Integer sequenceOrder;
    private Boolean requiredToAdvance;
    private Integer estimatedDuration;
    private Map<String, Object> data;

    // Getters and setters for all fields
    public String getTitle() {
        return title;
    }
    
    public void setTitle(String title) {
        this.title = title;
    }
    
    public ComponentType getType() {
        return type;
    }
    
    public void setType(ComponentType type) {
        this.type = type;
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
    
    public Integer getSequenceOrder() {
        return sequenceOrder;
    }
    
    public void setSequenceOrder(Integer sequenceOrder) {
        this.sequenceOrder = sequenceOrder;
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
    
    public Map<String, Object> getData() {
        return data;
    }
    
    public void setData(Map<String, Object> data) {
        this.data = data;
    }
}