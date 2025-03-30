package com.ehs.elearning.payload.response;

import java.util.List;
import java.util.Map;
import java.util.UUID;

public class AssessmentResultResponse {
    
    private UUID componentId;
    private Integer score; // Overall percentage score
    private Integer totalPoints;
    private Integer earnedPoints;
    private Integer correctAnswers;
    private Integer totalQuestions;
    private Boolean passed;
    private List<Map<String, Object>> questionResults; // Detailed breakdown by question
    
    // Constructors
    public AssessmentResultResponse() {
    }

    public AssessmentResultResponse(UUID componentId, Integer score, Integer totalPoints, Integer earnedPoints,
                                   Integer correctAnswers, Integer totalQuestions, Boolean passed,
                                   List<Map<String, Object>> questionResults) {
        this.componentId = componentId;
        this.score = score;
        this.totalPoints = totalPoints;
        this.earnedPoints = earnedPoints;
        this.correctAnswers = correctAnswers;
        this.totalQuestions = totalQuestions;
        this.passed = passed;
        this.questionResults = questionResults;
    }

    // Getters and Setters
    public UUID getComponentId() {
        return componentId;
    }

    public void setComponentId(UUID componentId) {
        this.componentId = componentId;
    }

    public Integer getScore() {
        return score;
    }

    public void setScore(Integer score) {
        this.score = score;
    }

    public Integer getTotalPoints() {
        return totalPoints;
    }

    public void setTotalPoints(Integer totalPoints) {
        this.totalPoints = totalPoints;
    }

    public Integer getEarnedPoints() {
        return earnedPoints;
    }

    public void setEarnedPoints(Integer earnedPoints) {
        this.earnedPoints = earnedPoints;
    }

    public Integer getCorrectAnswers() {
        return correctAnswers;
    }

    public void setCorrectAnswers(Integer correctAnswers) {
        this.correctAnswers = correctAnswers;
    }

    public Integer getTotalQuestions() {
        return totalQuestions;
    }

    public void setTotalQuestions(Integer totalQuestions) {
        this.totalQuestions = totalQuestions;
    }

    public Boolean getPassed() {
        return passed;
    }

    public void setPassed(Boolean passed) {
        this.passed = passed;
    }

    public List<Map<String, Object>> getQuestionResults() {
        return questionResults;
    }

    public void setQuestionResults(List<Map<String, Object>> questionResults) {
        this.questionResults = questionResults;
    }
}