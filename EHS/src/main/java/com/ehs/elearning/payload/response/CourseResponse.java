package com.ehs.elearning.payload.response;

import com.ehs.elearning.model.Course;
import com.ehs.elearning.model.Course.CourseStatus;
import com.ehs.elearning.model.CourseComponent;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public class CourseResponse {
    
    private UUID id;
    private String title;
    private String description;
    private DomainResponse domain;
    private String icon;
    private Integer timeLimit;
    private Integer passingScore;
    private CourseStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime publishedAt;
    private Integer componentCount;
    private Integer enrolledUsers;
    private Double completionRate;
    private List<CourseComponent> components;
    
    // Constructor from Course entity
    public CourseResponse(Course course) {
        this.id = course.getId();
        this.title = course.getTitle();
        this.description = course.getDescription();
        this.domain = new DomainResponse(course.getDomain().getId(), course.getDomain().getName());
        this.icon = course.getIcon();
        this.timeLimit = course.getTimeLimit();
        this.passingScore = course.getPassingScore();
        this.status = course.getStatus();
        this.createdAt = course.getCreatedAt();
        this.updatedAt = course.getUpdatedAt();
        this.publishedAt = course.getPublishedAt();
        this.componentCount = course.getComponents() != null ? course.getComponents().size() : 0;
    }
    
    // Nested Domain Response
    public static class DomainResponse {
        private UUID id;
        private String name;
        
        public DomainResponse() {
        }
        
        public DomainResponse(UUID id, String name) {
            this.id = id;
            this.name = name;
        }
        
        // Getters and Setters
        public UUID getId() {
            return id;
        }

        public void setId(UUID id) {
            this.id = id;
        }

        public String getName() {
            return name;
        }

        public void setName(String name) {
            this.name = name;
        }
    }
    
    // Getters and Setters
    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public DomainResponse getDomain() {
        return domain;
    }

    public void setDomain(DomainResponse domain) {
        this.domain = domain;
    }

    public String getIcon() {
        return icon;
    }

    public void setIcon(String icon) {
        this.icon = icon;
    }

    public Integer getTimeLimit() {
        return timeLimit;
    }

    public void setTimeLimit(Integer timeLimit) {
        this.timeLimit = timeLimit;
    }

    public Integer getPassingScore() {
        return passingScore;
    }

    public void setPassingScore(Integer passingScore) {
        this.passingScore = passingScore;
    }

    public CourseStatus getStatus() {
        return status;
    }

    public void setStatus(CourseStatus status) {
        this.status = status;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    public LocalDateTime getPublishedAt() {
        return publishedAt;
    }

    public void setPublishedAt(LocalDateTime publishedAt) {
        this.publishedAt = publishedAt;
    }

    public Integer getComponentCount() {
        return componentCount;
    }

    public void setComponentCount(Integer componentCount) {
        this.componentCount = componentCount;
    }

    public Integer getEnrolledUsers() {
        return enrolledUsers;
    }

    public void setEnrolledUsers(Integer enrolledUsers) {
        this.enrolledUsers = enrolledUsers;
    }

    public Double getCompletionRate() {
        return completionRate;
    }

    public void setCompletionRate(Double completionRate) {
        this.completionRate = completionRate;
    }
    
    public List<CourseComponent> getComponents() {
        return components;
    }

    public void setComponents(List<CourseComponent> components) {
        this.components = components;
    }

	public CourseResponse() {
		super();
	}

	public CourseResponse(UUID id, String title, String description, DomainResponse domain, String icon,
			Integer timeLimit, Integer passingScore, CourseStatus status, LocalDateTime createdAt,
			LocalDateTime updatedAt, LocalDateTime publishedAt, Integer componentCount, Integer enrolledUsers,
			Double completionRate) {
		super();
		this.id = id;
		this.title = title;
		this.description = description;
		this.domain = domain;
		this.icon = icon;
		this.timeLimit = timeLimit;
		this.passingScore = passingScore;
		this.status = status;
		this.createdAt = createdAt;
		this.updatedAt = updatedAt;
		this.publishedAt = publishedAt;
		this.componentCount = componentCount;
		this.enrolledUsers = enrolledUsers;
		this.completionRate = completionRate;
	}
	
    
}