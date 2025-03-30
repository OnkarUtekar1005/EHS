package com.ehs.elearning.payload.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public class AssessmentSubmissionRequest {
    
    @NotNull
    @Valid
    private List<AnswerRequest> answers;
    
    private Integer timeSpent; // Time spent in seconds
    
    // Getters and Setters
    public List<AnswerRequest> getAnswers() {
        return answers;
    }

    public void setAnswers(List<AnswerRequest> answers) {
        this.answers = answers;
    }

    public Integer getTimeSpent() {
        return timeSpent;
    }

    public void setTimeSpent(Integer timeSpent) {
        this.timeSpent = timeSpent;
    }
}