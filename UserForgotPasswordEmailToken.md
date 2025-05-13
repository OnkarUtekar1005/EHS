# Email-Based Password Reset Implementation Plan

## Overview

This plan outlines the implementation of an email-based password reset flow with secure tokens - the industry standard approach for password recovery. This approach offers strong security by verifying the user's email ownership before allowing a password change.

## Implementation Plan

### Phase 1: Backend Implementation

#### 1. Token Generation and Storage

First, we need to create the ability to generate and store password reset tokens:

1. **Create PasswordResetToken Entity:**

```java
package com.ehs.elearning.model;

import java.time.Instant;
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
    
    @Id
    @GeneratedValue
    private UUID id;
    
    @Column(nullable = false, unique = true)
    private String token;
    
    @OneToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id", nullable = false)
    private Users user;
    
    @Column(nullable = false)
    private Instant expiryDate;
    
    // 24 hours in seconds
    private static final long EXPIRATION_TIME = 86400;
    
    public PasswordResetToken() {}
    
    public PasswordResetToken(String token, Users user) {
        this.token = token;
        this.user = user;
        this.expiryDate = Instant.now().plusSeconds(EXPIRATION_TIME);
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
    
    public Instant getExpiryDate() {
        return expiryDate;
    }
    
    public void setExpiryDate(Instant expiryDate) {
        this.expiryDate = expiryDate;
    }
    
    public boolean isExpired() {
        return Instant.now().isAfter(this.expiryDate);
    }
}
```

2. **Create PasswordResetToken Repository:**

```java
package com.ehs.elearning.repository;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.ehs.elearning.model.PasswordResetToken;
import com.ehs.elearning.model.Users;

@Repository
public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, UUID> {
    Optional<PasswordResetToken> findByToken(String token);
    Optional<PasswordResetToken> findByUser(Users user);
    void deleteByUser(Users user);
}
```

#### 2. Email Service Implementation

For sending emails, we'll use Spring's JavaMailSender:

1. **Add Dependencies to pom.xml:**

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-mail</artifactId>
</dependency>
```

2. **Configure Email Settings in application.properties:**

```properties
# Email Configuration
spring.mail.host=smtp.gmail.com
spring.mail.port=587
spring.mail.username=your-email@gmail.com
spring.mail.password=your-app-password
spring.mail.properties.mail.smtp.auth=true
spring.mail.properties.mail.smtp.starttls.enable=true
```

3. **Create Email Service:**

```java
package com.ehs.elearning.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender emailSender;
    
    public void sendPasswordResetEmail(String to, String token, String appUrl) throws MessagingException {
        MimeMessage message = emailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true);
        
        helper.setFrom("noreply@ehs-learning.com");
        helper.setTo(to);
        helper.setSubject("Password Reset Request");
        
        String resetUrl = appUrl + "/reset-password/" + token;
        
        String emailContent = 
            "<div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;'>" +
            "<h2 style='color: #2E4053;'>EHS E-Learning Platform</h2>" +
            "<p>Hello,</p>" +
            "<p>You have requested to reset your password. Please click the button below to set a new password:</p>" +
            "<p style='text-align: center;'>" +
            "<a href='" + resetUrl + "' style='display: inline-block; padding: 10px 20px; color: white; background-color: #1976D2; text-decoration: none; border-radius: 4px;'>Reset Password</a>" +
            "</p>" +
            "<p>If you didn't request a password reset, please ignore this email or contact support if you have concerns.</p>" +
            "<p>This link will expire in 24 hours.</p>" +
            "<p>Regards,<br>EHS E-Learning Team</p>" +
            "</div>";
        
        helper.setText(emailContent, true);
        
        emailSender.send(message);
    }
}
```

#### 3. Password Reset Controller Endpoints

Update the AuthController to include password reset endpoints:

```java
// Add these imports
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import com.ehs.elearning.model.PasswordResetToken;
import com.ehs.elearning.repository.PasswordResetTokenRepository;
import com.ehs.elearning.service.EmailService;

// Add these fields to AuthController
@Autowired
private PasswordResetTokenRepository tokenRepository;

@Autowired
private EmailService emailService;

@Value("${app.url}")
private String appUrl;

// Add these methods to AuthController

@PostMapping("/password/reset-request")
public ResponseEntity<?> requestPasswordReset(@RequestBody Map<String, String> resetRequest) {
    String email = resetRequest.get("email");
    
    if (email == null || email.isEmpty()) {
        return ResponseEntity
            .badRequest()
            .body(new MessageResponse("Email is required"));
    }
    
    Optional<Users> userOpt = userRepository.findByEmail(email);
    if (!userOpt.isPresent()) {
        // For security reasons, don't reveal if the email exists or not
        return ResponseEntity.ok(new MessageResponse("If your email is registered, you will receive a password reset link"));
    }
    
    Users user = userOpt.get();
    
    // Delete any existing tokens for this user
    tokenRepository.findByUser(user).ifPresent(token -> tokenRepository.delete(token));
    
    // Generate a new token
    String token = UUID.randomUUID().toString();
    PasswordResetToken resetToken = new PasswordResetToken(token, user);
    tokenRepository.save(resetToken);
    
    try {
        // Send reset email
        emailService.sendPasswordResetEmail(user.getEmail(), token, appUrl);
        return ResponseEntity.ok(new MessageResponse("Password reset link has been sent to your email"));
    } catch (Exception e) {
        return ResponseEntity
            .status(500)
            .body(new MessageResponse("Failed to send password reset email"));
    }
}

@GetMapping("/password/validate-token/{token}")
public ResponseEntity<?> validateResetToken(@PathVariable String token) {
    Optional<PasswordResetToken> tokenOpt = tokenRepository.findByToken(token);
    
    if (!tokenOpt.isPresent()) {
        return ResponseEntity
            .status(400)
            .body(new MessageResponse("Invalid reset token"));
    }
    
    PasswordResetToken resetToken = tokenOpt.get();
    
    if (resetToken.isExpired()) {
        tokenRepository.delete(resetToken);
        return ResponseEntity
            .status(400)
            .body(new MessageResponse("Reset token has expired"));
    }
    
    return ResponseEntity.ok(new MessageResponse("Valid token"));
}

@PostMapping("/password/reset")
public ResponseEntity<?> resetPassword(@RequestBody Map<String, String> resetRequest) {
    String token = resetRequest.get("token");
    String newPassword = resetRequest.get("newPassword");
    
    if (token == null || newPassword == null) {
        return ResponseEntity
            .badRequest()
            .body(new MessageResponse("Token and new password are required"));
    }
    
    Optional<PasswordResetToken> tokenOpt = tokenRepository.findByToken(token);
    
    if (!tokenOpt.isPresent()) {
        return ResponseEntity
            .status(400)
            .body(new MessageResponse("Invalid reset token"));
    }
    
    PasswordResetToken resetToken = tokenOpt.get();
    
    if (resetToken.isExpired()) {
        tokenRepository.delete(resetToken);
        return ResponseEntity
            .status(400)
            .body(new MessageResponse("Reset token has expired"));
    }
    
    Users user = resetToken.getUser();
    user.setPassword(passwordEncoder.encode(newPassword));
    
    // Update password reset timestamp
    user.setLastPasswordReset(new java.sql.Date(System.currentTimeMillis()));
    
    userRepository.save(user);
    
    // Delete the used token
    tokenRepository.delete(resetToken);
    
    return ResponseEntity.ok(new MessageResponse("Password has been reset successfully"));
}
```

4. **Add Configuration Property:**

Add to application.properties:
```properties
app.url=http://localhost:3000
```

### Phase 2: Frontend Implementation

#### 1. Update the Forgot Password Component

Create a proper ForgotPassword.js component:

```jsx
// src/pages/ForgotPassword.js
import React, { useState } from 'react';
import {
  Container, Box, Typography, TextField, Button, Paper, Alert, Link,
  CircularProgress
} from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';
import { authService } from '../services/api';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [emailError, setEmailError] = useState('');
  
  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    if (emailError) setEmailError('');
    if (error) setError('');
  };
  
  const validateEmail = () => {
    if (!email.trim()) {
      setEmailError('Email is required');
      return false;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setEmailError('Please enter a valid email address');
      return false;
    }
    
    return true;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateEmail()) return;
    
    setIsSubmitting(true);
    setError('');
    
    try {
      await authService.requestPasswordReset({ email });
      setSuccess(true);
    } catch (error) {
      console.error('Error requesting password reset:', error);
      
      // Don't expose if email exists or not for security reasons
      // Just show a generic error message
      if (error.response && error.response.status !== 200) {
        setError('Failed to process your request. Please try again.');
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          py: 4
        }}
      >
        <Paper
          elevation={3}
          sx={{
            p: 4,
            width: '100%',
            borderRadius: 2
          }}
        >
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              mb: 4
            }}
          >
            <Typography variant="h4" component="h1" gutterBottom>
              Reset Password
            </Typography>
          </Box>
          
          {!success ? (
            <>
              <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 3, textAlign: 'center' }}>
                Enter your email address and we'll send you a link to reset your password
              </Typography>
              
              {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                  {error}
                </Alert>
              )}
              
              <Box component="form" onSubmit={handleSubmit} noValidate>
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  id="email"
                  label="Email Address"
                  name="email"
                  autoComplete="email"
                  autoFocus
                  value={email}
                  onChange={handleEmailChange}
                  error={!!emailError}
                  helperText={emailError}
                  disabled={isSubmitting}
                />
                
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  sx={{ mt: 3, mb: 2, py: 1.5 }}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <CircularProgress size={24} />
                  ) : (
                    'Send Reset Link'
                  )}
                </Button>
                
                <Box sx={{ mt: 2, textAlign: 'center' }}>
                  <Link 
                    component={RouterLink} 
                    to="/login"
                    variant="body2"
                    sx={{ display: 'inline-flex', alignItems: 'center' }}
                  >
                    <ArrowBack sx={{ fontSize: 16, mr: 0.5 }} /> Back to Login
                  </Link>
                </Box>
              </Box>
            </>
          ) : (
            <>
              <Alert severity="success" sx={{ mb: 3 }}>
                If your email address is registered in our system, you will receive a password reset link shortly.
              </Alert>
              
              <Typography variant="body2" paragraph>
                Please check your inbox (and spam folder) for an email with instructions to reset your password.
              </Typography>
              
              <Button
                component={RouterLink}
                to="/login"
                variant="contained"
                fullWidth
                sx={{ mt: 2 }}
              >
                Return to Login
              </Button>
            </>
          )}
        </Paper>
      </Box>
    </Container>
  );
};

export default ForgotPassword;
```

#### 2. Ensure the ResetPassword Component Works with Tokens

The existing ResetPassword.js component is already well-implemented to work with the token-based approach. It:
- Extracts the token from the URL
- Validates the token with the backend
- Allows the user to enter a new password if the token is valid
- Submits the new password along with the token

#### 3. Update API Services (if needed)

The authService already has the needed methods:
- `requestPasswordReset(email)`
- `validateResetToken(token)`
- `resetPassword(resetData)`

Just make sure the `requestPasswordReset` function is using the correct data format:

```javascript
// In src/services/api.js
requestPasswordReset: (data) => api.post('/auth/password/reset-request', data),
```

### Phase 3: Integration and Testing

#### 1. Integration Testing Checklist

- [ ] Email sending functionality works with your email provider
- [ ] Password reset tokens are correctly stored in the database
- [ ] The token validation endpoint works correctly
- [ ] The password reset endpoint successfully updates the user's password
- [ ] The frontend correctly displays success and error messages
- [ ] All error cases are handled gracefully

#### 2. Security Testing Checklist

- [ ] Password reset tokens are sufficiently random (using UUID)
- [ ] Tokens expire after a reasonable time (24 hours)
- [ ] Tokens are single-use only (deleted after use)
- [ ] The system doesn't reveal if an email exists or not
- [ ] Password complexity requirements are enforced for new passwords
- [ ] Email is sent over TLS (secure SMTP)
- [ ] Rate limiting is implemented to prevent brute force attacks

## Additional Security Considerations

1. **Rate Limiting:**
   Add a mechanism to prevent abuse by limiting the number of password reset requests per email address within a time period.

2. **IP Tracking:**
   Log IP addresses for password reset requests and password changes for security auditing.

3. **Notification on Password Change:**
   Send a confirmation email when a password is successfully changed.

## Conclusion

This implementation provides a secure, industry-standard approach to password reset using email verification with tokens. The solution includes:

1. A token-based verification system with 24-hour expiry
2. Secure email delivery of reset links
3. A clean user interface for requesting and completing password resets
4. Appropriate security measures to protect user accounts

This approach is more secure than username/email verification alone, as it requires access to the user's email account to complete the password reset process.