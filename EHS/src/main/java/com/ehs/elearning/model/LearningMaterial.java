package com.ehs.elearning.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import com.fasterxml.jackson.annotation.JsonIgnore;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;
import com.fasterxml.jackson.annotation.JsonInclude;

@Entity
@Table(name = "learning_materials")
public class LearningMaterial {
    
	@Transient
	@JsonInclude(JsonInclude.Include.NON_NULL)
	private Integer progress;

	@Transient
	@JsonInclude(JsonInclude.Include.NON_NULL)
	private Integer timeSpent;

	@Transient
	@JsonInclude(JsonInclude.Include.NON_NULL)
	private Boolean completed;

	// Add these getter and setter methods
	public Integer getProgress() {
	    return progress;
	}

	public void setProgress(Integer progress) {
	    this.progress = progress;
	}

	public Integer getTimeSpent() {
	    return timeSpent;
	}

	public void setTimeSpent(Integer timeSpent) {
	    this.timeSpent = timeSpent;
	}

	public Boolean getCompleted() {
	    return completed;
	}

	public void setCompleted(Boolean completed) {
	    this.completed = completed;
	}
    @Id
    @GeneratedValue
    private UUID id;
    
    @OneToMany(mappedBy = "material", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private Set<ComponentMaterialAssociation> componentAssociations = new HashSet<>();
    
    @NotBlank
    @Size(max = 100)
    private String title;
    
    @Size(max = 500)
    private String description;
    
    @NotNull
    private String fileType; // e.g., PDF, VIDEO, PRESENTATION, HTML
    
    private String filePath; // Path to stored file
    
    @Column(columnDefinition = "text")
    private String content; // For direct HTML content
    
    private String externalUrl; // For external resources
    
    private Integer sequenceOrder;
    
    private Integer estimatedDuration; // in seconds
    
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
    
    // Constructors
    public LearningMaterial() {
    }
    
    // Getters and Setters
    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }
    
    public Set<ComponentMaterialAssociation> getComponentAssociations() {
        return componentAssociations;
    }

    public void setComponentAssociations(Set<ComponentMaterialAssociation> componentAssociations) {
        this.componentAssociations = componentAssociations;
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

    public String getFileType() {
        return fileType;
    }

    public void setFileType(String fileType) {
        this.fileType = fileType;
    }

    public String getFilePath() {
        return filePath;
    }

    public void setFilePath(String filePath) {
        this.filePath = filePath;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public String getExternalUrl() {
        return externalUrl;
    }

    public void setExternalUrl(String externalUrl) {
        this.externalUrl = externalUrl;
    }

    public Integer getSequenceOrder() {
        return sequenceOrder;
    }

    public void setSequenceOrder(Integer sequenceOrder) {
        this.sequenceOrder = sequenceOrder;
    }

    public Integer getEstimatedDuration() {
        return estimatedDuration;
    }

    public void setEstimatedDuration(Integer estimatedDuration) {
        this.estimatedDuration = estimatedDuration;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
    
    public void addComponentAssociation(ComponentMaterialAssociation association) {
        componentAssociations.add(association);
        association.setMaterial(this);
    }

    public void removeComponentAssociation(ComponentMaterialAssociation association) {
        componentAssociations.remove(association);
        association.setMaterial(null);
    }
}