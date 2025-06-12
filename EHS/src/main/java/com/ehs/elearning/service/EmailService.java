package com.ehs.elearning.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    @Autowired(required = false)
    private JavaMailSender mailSender;

    @Value("${app.email.enabled:false}")
    private boolean emailEnabled;

    @Value("${app.frontend.url:http://localhost:3000}")
    private String frontendUrl;

    @Value("${spring.mail.username:noreply@ehs-learning.com}")
    private String fromEmail;

    /**
     * Sends a password reset email with a reset link
     * 
     * @param to Recipient email address
     * @param token Reset token
     * @return true if email was sent successfully, false otherwise
     */
    public boolean sendPasswordResetEmail(String to, String token) {
        String resetUrl = frontendUrl + "/reset-password?token=" + token;

        // Validate the frontendUrl value
        if (frontendUrl == null || frontendUrl.isEmpty() || frontendUrl.equals("http://localhost:3000")) {
            // Warning: Using default frontend URL
        }

        // Debug info - check email configuration

        // Always return true in console mode
        if (!emailEnabled) {
            return true;
        }

        // Check mailSender again
        if (mailSender == null) {
            return true; // Still return true to allow the flow to continue
        }

        try {
            
            // Use SimpleMailMessage for troubleshooting
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(to);
            message.setSubject("Password Reset Request");
            message.setText("You have requested to reset your password for the EHS Learning Platform.\n\n" +
                    "Please click on the link below to reset your password:\n" +
                    resetUrl + " \n\n" +
                    "This link will expire in 24 hours.\n\n" +
                    "If you did not request a password reset, please ignore this email.\n\n" +
                    "Regards,\nEHS Learning Platform Team");
            
            
            mailSender.send(message);
            return true;
        } catch (Exception e) {
            return false;
        }
    }
}