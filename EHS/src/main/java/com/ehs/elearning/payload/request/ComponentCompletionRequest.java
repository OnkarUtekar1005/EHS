package com.ehs.elearning.payload.request;

public class ComponentCompletionRequest {
    
    private Integer timeSpent; // Time spent in minutes
    
    private Integer score; // For assessment components
    
    // Getters and Setters
    public Integer getTimeSpent() {
        return timeSpent;
    }

    public void setTimeSpent(Integer timeSpent) {
        this.timeSpent = timeSpent;
    }

    public Integer getScore() {
        return score;
    }

    public void setScore(Integer score) {
        this.score = score;
    }
}