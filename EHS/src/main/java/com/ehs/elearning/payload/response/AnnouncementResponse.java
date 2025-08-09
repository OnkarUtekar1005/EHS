package com.ehs.elearning.payload.response;

import java.time.LocalDateTime;

public class AnnouncementResponse {
    
    private String id;
    private String title;
    private String content;
    private String authorName;
    private String createdByUsername;
    private LocalDateTime createdAt;
    private boolean isActive;
    private String priority;
    private LocalDateTime expiresAt;
    private boolean isExpired;
    
    public AnnouncementResponse() {}
    
    public AnnouncementResponse(String id, String title, String content, String authorName,
                              String createdByUsername, LocalDateTime createdAt, boolean isActive,
                              String priority, LocalDateTime expiresAt) {
        this.id = id;
        this.title = title;
        this.content = content;
        this.authorName = authorName;
        this.createdByUsername = createdByUsername;
        this.createdAt = createdAt;
        this.isActive = isActive;
        this.priority = priority;
        this.expiresAt = expiresAt;
        this.isExpired = expiresAt != null && LocalDateTime.now().isAfter(expiresAt);
    }
    
    public String getId() {
        return id;
    }
    
    public void setId(String id) {
        this.id = id;
    }
    
    public String getTitle() {
        return title;
    }
    
    public void setTitle(String title) {
        this.title = title;
    }
    
    public String getContent() {
        return content;
    }
    
    public void setContent(String content) {
        this.content = content;
    }
    
    public String getAuthorName() {
        return authorName;
    }
    
    public void setAuthorName(String authorName) {
        this.authorName = authorName;
    }
    
    public String getCreatedByUsername() {
        return createdByUsername;
    }
    
    public void setCreatedByUsername(String createdByUsername) {
        this.createdByUsername = createdByUsername;
    }
    
    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
    
    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
    
    public boolean isActive() {
        return isActive;
    }
    
    public void setActive(boolean active) {
        isActive = active;
    }
    
    public String getPriority() {
        return priority;
    }
    
    public void setPriority(String priority) {
        this.priority = priority;
    }
    
    public LocalDateTime getExpiresAt() {
        return expiresAt;
    }
    
    public void setExpiresAt(LocalDateTime expiresAt) {
        this.expiresAt = expiresAt;
        this.isExpired = expiresAt != null && LocalDateTime.now().isAfter(expiresAt);
    }
    
    public boolean isExpired() {
        return isExpired;
    }
    
    public void setExpired(boolean expired) {
        isExpired = expired;
    }
}