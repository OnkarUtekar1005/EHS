package com.ehs.elearning.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "certificates",
    uniqueConstraints = {
        @UniqueConstraint(columnNames = "certificate_number"),
        @UniqueConstraint(columnNames = "verification_code")
    })
public class Certificate {
    
    @Id
    @GeneratedValue
    private UUID id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private Users user;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "course_id", nullable = false)
    private Course course;
    
    @Column(name = "certificate_number", unique = true, nullable = false, length = 50)
    private String certificateNumber;
    
    @Column(name = "issued_date", nullable = false)
    private LocalDateTime issuedDate;
    
    @Column(name = "expiry_date")
    private LocalDateTime expiryDate;
    
    @Column(name = "file_path")
    private String filePath;
    
    @Column(name = "verification_code", unique = true, length = 100)
    private String verificationCode;
    
    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private CertificateStatus status = CertificateStatus.ACTIVE;
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    // Lifecycle methods
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        issuedDate = LocalDateTime.now();
    }
    
    // Constructors
    public Certificate() {
    }
    
    public Certificate(Users user, Course course, String certificateNumber) {
        this.user = user;
        this.course = course;
        this.certificateNumber = certificateNumber;
        this.issuedDate = LocalDateTime.now();
        this.status = CertificateStatus.ACTIVE;
    }
    
    // Helper methods
    public boolean isValid() {
        return status == CertificateStatus.ACTIVE && 
               (expiryDate == null || expiryDate.isAfter(LocalDateTime.now()));
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

    public Course getCourse() {
        return course;
    }

    public void setCourse(Course course) {
        this.course = course;
    }

    public String getCertificateNumber() {
        return certificateNumber;
    }

    public void setCertificateNumber(String certificateNumber) {
        this.certificateNumber = certificateNumber;
    }

    public LocalDateTime getIssuedDate() {
        return issuedDate;
    }

    public void setIssuedDate(LocalDateTime issuedDate) {
        this.issuedDate = issuedDate;
    }

    public LocalDateTime getExpiryDate() {
        return expiryDate;
    }

    public void setExpiryDate(LocalDateTime expiryDate) {
        this.expiryDate = expiryDate;
    }

    public String getFilePath() {
        return filePath;
    }

    public void setFilePath(String filePath) {
        this.filePath = filePath;
    }

    public String getVerificationCode() {
        return verificationCode;
    }

    public void setVerificationCode(String verificationCode) {
        this.verificationCode = verificationCode;
    }

    public CertificateStatus getStatus() {
        return status;
    }

    public void setStatus(CertificateStatus status) {
        this.status = status;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}