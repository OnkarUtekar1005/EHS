package com.ehs.elearning.payload.response;

import java.time.LocalDateTime;

public class ThinkResponse {
    
    private String id;
    private String type;
    private String subject;
    private String description;
    private String userName;
    private boolean isAnonymous;
    private LocalDateTime createdAt;
    private String status;
    private String adminResponse;
    private String respondedBy;
    private LocalDateTime respondedAt;
    
    public ThinkResponse() {}
    
    public ThinkResponse(String id, String type, String subject, String description, 
                        String userName, boolean isAnonymous, LocalDateTime createdAt, 
                        String status, String adminResponse, String respondedBy, 
                        LocalDateTime respondedAt) {
        this.id = id;
        this.type = type;
        this.subject = subject;
        this.description = description;
        this.userName = userName;
        this.isAnonymous = isAnonymous;
        this.createdAt = createdAt;
        this.status = status;
        this.adminResponse = adminResponse;
        this.respondedBy = respondedBy;
        this.respondedAt = respondedAt;
    }
    
    public String getId() {
        return id;
    }
    
    public void setId(String id) {
        this.id = id;
    }
    
    public String getType() {
        return type;
    }
    
    public void setType(String type) {
        this.type = type;
    }
    
    public String getSubject() {
        return subject;
    }
    
    public void setSubject(String subject) {
        this.subject = subject;
    }
    
    public String getDescription() {
        return description;
    }
    
    public void setDescription(String description) {
        this.description = description;
    }
    
    public String getUserName() {
        return userName;
    }
    
    public void setUserName(String userName) {
        this.userName = userName;
    }
    
    public boolean isAnonymous() {
        return isAnonymous;
    }
    
    public void setAnonymous(boolean anonymous) {
        isAnonymous = anonymous;
    }
    
    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
    
    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
    
    public String getStatus() {
        return status;
    }
    
    public void setStatus(String status) {
        this.status = status;
    }
    
    public String getAdminResponse() {
        return adminResponse;
    }
    
    public void setAdminResponse(String adminResponse) {
        this.adminResponse = adminResponse;
    }
    
    public String getRespondedBy() {
        return respondedBy;
    }
    
    public void setRespondedBy(String respondedBy) {
        this.respondedBy = respondedBy;
    }
    
    public LocalDateTime getRespondedAt() {
        return respondedAt;
    }
    
    public void setRespondedAt(LocalDateTime respondedAt) {
        this.respondedAt = respondedAt;
    }
}