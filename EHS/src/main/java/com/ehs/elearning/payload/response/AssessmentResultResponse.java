package com.ehs.elearning.payload.response;

import com.ehs.elearning.service.UserAssessmentService.AssessmentResult;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.UUID;

public class AssessmentResultResponse {
    private UUID attemptId;
    private BigDecimal score;
    private boolean passed;
    private int correctAnswers;
    private int totalQuestions;
    private List<Map<String, Object>> detailedResults;
    private int attemptsRemaining;
    private String message;
    
    // Constructors
    public AssessmentResultResponse() {
    }
    
    public AssessmentResultResponse(AssessmentResult result) {
        this.attemptId = result.getAttemptId();
        this.score = result.getScore();
        this.passed = result.isPassed();
        this.correctAnswers = result.getCorrectAnswers();
        this.totalQuestions = result.getTotalQuestions();
        this.detailedResults = result.getDetailedResults();
        this.attemptsRemaining = result.getAttemptsRemaining();
        
        // Generate message
        if (passed) {
            this.message = String.format("Congratulations! You passed with a score of %.2f%%", score);
        } else {
            if (attemptsRemaining > 0) {
                this.message = String.format("You scored %.2f%%. You have %d attempts remaining.", 
                    score, attemptsRemaining);
            } else {
                this.message = String.format("You scored %.2f%%. No attempts remaining.", score);
            }
        }
    }
    
    // Getters and Setters
    public UUID getAttemptId() {
        return attemptId;
    }

    public void setAttemptId(UUID attemptId) {
        this.attemptId = attemptId;
    }

    public BigDecimal getScore() {
        return score;
    }

    public void setScore(BigDecimal score) {
        this.score = score;
    }

    public boolean isPassed() {
        return passed;
    }

    public void setPassed(boolean passed) {
        this.passed = passed;
    }

    public int getCorrectAnswers() {
        return correctAnswers;
    }

    public void setCorrectAnswers(int correctAnswers) {
        this.correctAnswers = correctAnswers;
    }

    public int getTotalQuestions() {
        return totalQuestions;
    }

    public void setTotalQuestions(int totalQuestions) {
        this.totalQuestions = totalQuestions;
    }

    public List<Map<String, Object>> getDetailedResults() {
        return detailedResults;
    }

    public void setDetailedResults(List<Map<String, Object>> detailedResults) {
        this.detailedResults = detailedResults;
    }

    public int getAttemptsRemaining() {
        return attemptsRemaining;
    }

    public void setAttemptsRemaining(int attemptsRemaining) {
        this.attemptsRemaining = attemptsRemaining;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }
}