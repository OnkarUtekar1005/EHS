package com.ehs.elearning.model;

import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

@Entity
@Table(name = "assessment_attempts",
    uniqueConstraints = {
        @UniqueConstraint(columnNames = {"user_id", "component_id", "attempt_number"})
    })
public class AssessmentAttempt {
    
    @Id
    @GeneratedValue
    private UUID id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private Users user;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "component_id", nullable = false)
    private CourseComponent component;
    
    @Column(name = "attempt_number")
    private Integer attemptNumber = 1;
    
    @Column(precision = 5, scale = 2)
    private BigDecimal score;
    
    private Boolean passed = false;
    
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private Map<String, Object> answers;
    
    @Column(name = "started_at")
    private LocalDateTime startedAt;
    
    @Column(name = "submitted_at")
    private LocalDateTime submittedAt;
    
    @Column(name = "time_taken_seconds")
    private Long timeTakenSeconds;
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    // Lifecycle methods
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        startedAt = LocalDateTime.now();
    }
    
    // Constructors
    public AssessmentAttempt() {
    }
    
    public AssessmentAttempt(Users user, CourseComponent component, Integer attemptNumber) {
        this.user = user;
        this.component = component;
        this.attemptNumber = attemptNumber;
        this.startedAt = LocalDateTime.now();
    }
    
    // Helper methods
    public void submit(Map<String, Object> answers, BigDecimal score, boolean passed) {
        this.answers = answers;
        this.score = score;
        this.passed = passed;
        this.submittedAt = LocalDateTime.now();
        this.timeTakenSeconds = java.time.Duration.between(startedAt, submittedAt).getSeconds();
    }
    
    // Getters and Setters
    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public Users getUser() {
        return user;
    }

    public void setUser(Users user) {
        this.user = user;
    }

    public CourseComponent getComponent() {
        return component;
    }

    public void setComponent(CourseComponent component) {
        this.component = component;
    }

    public Integer getAttemptNumber() {
        return attemptNumber;
    }

    public void setAttemptNumber(Integer attemptNumber) {
        this.attemptNumber = attemptNumber;
    }

    public BigDecimal getScore() {
        return score;
    }

    public void setScore(BigDecimal score) {
        this.score = score;
    }

    public Boolean getPassed() {
        return passed;
    }

    public void setPassed(Boolean passed) {
        this.passed = passed;
    }

    public Map<String, Object> getAnswers() {
        return answers;
    }

    public void setAnswers(Map<String, Object> answers) {
        this.answers = answers;
    }

    public LocalDateTime getStartedAt() {
        return startedAt;
    }

    public void setStartedAt(LocalDateTime startedAt) {
        this.startedAt = startedAt;
    }

    public LocalDateTime getSubmittedAt() {
        return submittedAt;
    }

    public void setSubmittedAt(LocalDateTime submittedAt) {
        this.submittedAt = submittedAt;
    }

    public Long getTimeTakenSeconds() {
        return timeTakenSeconds;
    }

    public void setTimeTakenSeconds(Long timeTakenSeconds) {
        this.timeTakenSeconds = timeTakenSeconds;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}