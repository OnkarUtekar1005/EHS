package com.ehs.elearning.payload.response;

import com.ehs.elearning.model.ComponentProgress;
import com.ehs.elearning.model.ComponentProgressStatus;
import com.ehs.elearning.model.CourseComponent;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

public class ComponentProgressResponse {
    private UUID id;
    private UUID componentId;
    private CourseComponent.ComponentType componentType;
    private String componentTitle;
    private Integer orderIndex;
    private ComponentProgressStatus status;
    private BigDecimal progressPercentage;
    private Integer score;
    private Integer attempts;
    private LocalDateTime startedAt;
    private LocalDateTime completedAt;
    private LocalDateTime lastAccessedAt;
    private Long timeSpentSeconds;
    private boolean required;
    
    // Constructors
    public ComponentProgressResponse() {
    }
    
    public ComponentProgressResponse(ComponentProgress progress) {
        this.id = progress.getId();
        this.componentId = progress.getComponent().getId();
        this.componentType = progress.getComponent().getType();
        this.orderIndex = progress.getComponent().getOrderIndex();
        this.status = progress.getStatus();
        this.progressPercentage = progress.getProgressPercentage();
        this.score = progress.getScore();
        this.attempts = progress.getAttempts();
        this.startedAt = progress.getStartedAt();
        this.completedAt = progress.getCompletedAt();
        this.lastAccessedAt = progress.getLastAccessedAt();
        this.timeSpentSeconds = progress.getTimeSpentSeconds();
        this.required = progress.getComponent().getRequired();
        
        // Extract title from component data
        Map<String, Object> componentData = progress.getComponent().getData();
        if (componentData != null && componentData.containsKey("title")) {
            this.componentTitle = (String) componentData.get("title");
        } else {
            this.componentTitle = progress.getComponent().getType().toString();
        }
    }
    
    // Getters and Setters
    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public UUID getComponentId() {
        return componentId;
    }

    public void setComponentId(UUID componentId) {
        this.componentId = componentId;
    }

    public CourseComponent.ComponentType getComponentType() {
        return componentType;
    }

    public void setComponentType(CourseComponent.ComponentType componentType) {
        this.componentType = componentType;
    }

    public String getComponentTitle() {
        return componentTitle;
    }

    public void setComponentTitle(String componentTitle) {
        this.componentTitle = componentTitle;
    }

    public Integer getOrderIndex() {
        return orderIndex;
    }

    public void setOrderIndex(Integer orderIndex) {
        this.orderIndex = orderIndex;
    }

    public ComponentProgressStatus getStatus() {
        return status;
    }

    public void setStatus(ComponentProgressStatus status) {
        this.status = status;
    }

    public BigDecimal getProgressPercentage() {
        return progressPercentage;
    }

    public void setProgressPercentage(BigDecimal progressPercentage) {
        this.progressPercentage = progressPercentage;
    }

    public Integer getScore() {
        return score;
    }

    public void setScore(Integer score) {
        this.score = score;
    }

    public Integer getAttempts() {
        return attempts;
    }

    public void setAttempts(Integer attempts) {
        this.attempts = attempts;
    }

    public LocalDateTime getStartedAt() {
        return startedAt;
    }

    public void setStartedAt(LocalDateTime startedAt) {
        this.startedAt = startedAt;
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

    public Long getTimeSpentSeconds() {
        return timeSpentSeconds;
    }

    public void setTimeSpentSeconds(Long timeSpentSeconds) {
        this.timeSpentSeconds = timeSpentSeconds;
    }

    public boolean isRequired() {
        return required;
    }

    public void setRequired(boolean required) {
        this.required = required;
    }
}