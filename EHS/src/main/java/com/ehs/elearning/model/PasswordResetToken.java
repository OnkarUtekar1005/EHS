package com.ehs.elearning.model;

import java.time.LocalDateTime;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "password_reset_tokens")
public class PasswordResetToken {
    
    private static final int EXPIRATION_HOURS = 24;
    
    @Id
    @GeneratedValue
    private UUID id;
    
    @Column(nullable = false, unique = true)
    private String token;
    
    @OneToOne(targetEntity = Users.class, fetch = FetchType.EAGER)
    @JoinColumn(nullable = false, name = "user_id")
    private Users user;
    
    @Column(nullable = false)
    private LocalDateTime expiryDate;
    
    @Column(nullable = false)
    private boolean used = false;

    public PasswordResetToken() {
        this.expiryDate = LocalDateTime.now().plusHours(EXPIRATION_HOURS);
    }

    public PasswordResetToken(String token, Users user) {
        this();
        this.token = token;
        this.user = user;
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public Users getUser() {
        return user;
    }

    public void setUser(Users user) {
        this.user = user;
    }

    public LocalDateTime getExpiryDate() {
        return expiryDate;
    }

    public void setExpiryDate(LocalDateTime expiryDate) {
        this.expiryDate = expiryDate;
    }

    public boolean isUsed() {
        return used;
    }

    public void setUsed(boolean used) {
        this.used = used;
    }
    
    public boolean isExpired() {
        return LocalDateTime.now().isAfter(this.expiryDate);
    }
    
    public boolean isValid() {
        return !isExpired() && !isUsed();
    }
}