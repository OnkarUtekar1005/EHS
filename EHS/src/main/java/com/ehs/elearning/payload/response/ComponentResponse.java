package com.ehs.elearning.payload.response;

import com.ehs.elearning.model.CourseComponent;
import com.ehs.elearning.model.CourseComponent.ComponentType;

import java.util.Map;
import java.util.UUID;

public class ComponentResponse {
    
    private UUID id;
    private ComponentType type;
    private Integer orderIndex;
    private Boolean required;
    private Map<String, Object> data;
    
    // Constructor
    public ComponentResponse() {
    }
    
    public ComponentResponse(CourseComponent component) {
        this.id = component.getId();
        this.type = component.getType();
        this.orderIndex = component.getOrderIndex();
        this.required = component.getRequired();
        this.data = component.getData();
    }
    
    // Getters and Setters
    public UUID getId() {
        return id;
    }
    
    public void setId(UUID id) {
        this.id = id;
    }
    
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