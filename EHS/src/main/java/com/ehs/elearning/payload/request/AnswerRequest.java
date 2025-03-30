package com.ehs.elearning.payload.request;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public class AnswerRequest {
    
    @NotNull
    private UUID questionId;
    
    private String userAnswer; // JSON string of user's answer
    
    // Getters and Setters
    public UUID getQuestionId() {
        return questionId;
    }

    public void setQuestionId(UUID questionId) {
        this.questionId = questionId;
    }

    public String getUserAnswer() {
        return userAnswer;
    }

    public void setUserAnswer(String userAnswer) {
        this.userAnswer = userAnswer;
    }
}