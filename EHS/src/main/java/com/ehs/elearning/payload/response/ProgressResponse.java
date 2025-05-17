package com.ehs.elearning.payload.response;

import com.ehs.elearning.model.ProgressStatus;
import com.ehs.elearning.model.UserCourseProgress;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

public class ProgressResponse {
    private UUID id;
    private UUID courseId;
    private String courseTitle;
    private String courseDomain;
    private BigDecimal overallProgress;
    private ProgressStatus status;
    private LocalDateTime enrollmentDate;
    private LocalDateTime startedDate;
    private LocalDateTime completedDate;
    private UUID certificateId;
    private Integer totalComponents;
    private Integer completedComponents;
    
    // Constructors
    public ProgressResponse() {
    }
    
    public ProgressResponse(UserCourseProgress progress) {
        this.id = progress.getId();
        this.courseId = progress.getCourse().getId();
        this.courseTitle = progress.getCourse().getTitle();
        this.courseDomain = progress.getCourse().getDomain().getName();
        this.overallProgress = progress.getOverallProgress();
        this.status = progress.getStatus();
        this.enrollmentDate = progress.getEnrollmentDate();
        this.startedDate = progress.getStartedDate();
        this.completedDate = progress.getCompletedDate();
        this.certificateId = progress.getCertificateId();
    }
    
    // Getters and Setters
    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public UUID getCourseId() {
        return courseId;
    }

    public void setCourseId(UUID courseId) {
        this.courseId = courseId;
    }

    public String getCourseTitle() {
        return courseTitle;
    }

    public void setCourseTitle(String courseTitle) {
        this.courseTitle = courseTitle;
    }

    public String getCourseDomain() {
        return courseDomain;
    }

    public void setCourseDomain(String courseDomain) {
        this.courseDomain = courseDomain;
    }

    public BigDecimal getOverallProgress() {
        return overallProgress;
    }

    public void setOverallProgress(BigDecimal overallProgress) {
        this.overallProgress = overallProgress;
    }

    public ProgressStatus getStatus() {
        return status;
    }

    public void setStatus(ProgressStatus status) {
        this.status = status;
    }

    public LocalDateTime getEnrollmentDate() {
        return enrollmentDate;
    }

    public void setEnrollmentDate(LocalDateTime enrollmentDate) {
        this.enrollmentDate = enrollmentDate;
    }

    public LocalDateTime getStartedDate() {
        return startedDate;
    }

    public void setStartedDate(LocalDateTime startedDate) {
        this.startedDate = startedDate;
    }

    public LocalDateTime getCompletedDate() {
        return completedDate;
    }

    public void setCompletedDate(LocalDateTime completedDate) {
        this.completedDate = completedDate;
    }

    public UUID getCertificateId() {
        return certificateId;
    }

    public void setCertificateId(UUID certificateId) {
        this.certificateId = certificateId;
    }

    public Integer getTotalComponents() {
        return totalComponents;
    }

    public void setTotalComponents(Integer totalComponents) {
        this.totalComponents = totalComponents;
    }

    public Integer getCompletedComponents() {
        return completedComponents;
    }

    public void setCompletedComponents(Integer completedComponents) {
        this.completedComponents = completedComponents;
    }
}