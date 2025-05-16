package com.ehs.elearning.payload.request;

import com.ehs.elearning.model.CourseComponent.ComponentType;
import jakarta.validation.constraints.NotNull;

import java.util.Map;

public class ComponentRequest {
    
    @NotNull
    private ComponentType type;
    
    private Integer orderIndex;
    
    private Boolean required = false;
    
    @NotNull
    private Map<String, Object> data;
    
    // Constructors
    public ComponentRequest() {
    }
    
    public ComponentRequest(ComponentType type, Map<String, Object> data) {
        this.type = type;
        this.data = data;
    }
    
    // Getters and Setters
    public ComponentType getType() {
        return type;
    }
    
    public void setType(ComponentType type) {
        this.type = type;
    }
    
    public Integer getOrderIndex() {
        return orderIndex;
    }
    
    public void setOrderIndex(Integer orderIndex) {
        this.orderIndex = orderIndex;
    }
    
    public Boolean getRequired() {
        return required;
    }
    
    public void setRequired(Boolean required) {
        this.required = required;
    }
    
    public Map<String, Object> getData() {
        return data;
    }
    
    public void setData(Map<String, Object> data) {
        this.data = data;
    }
}