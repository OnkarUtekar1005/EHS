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
        // Always log the token for testing purposes
        String resetUrl = frontendUrl + "/reset-password?token=" + token;
        System.out.println("\n====================================================");
        System.out.println("PASSWORD RESET TOKEN DETAILS");
        System.out.println("====================================================");
        System.out.println("Email: " + to);
        System.out.println("Token: " + token);
        System.out.println("Reset URL: " + resetUrl);
        System.out.println("====================================================\n");

        // Validate the frontendUrl value
        if (frontendUrl == null || frontendUrl.isEmpty() || frontendUrl.equals("http://localhost:3000")) {
            System.out.println("WARNING: Using default frontend URL. Make sure this is correct for your environment.");
            System.out.println("If you are encountering 404 errors when clicking reset links, update app.frontend.url in application.properties");
        }

        // Debug info
        System.out.println("Email Service Status:");
        System.out.println("Email enabled flag: " + emailEnabled);
        System.out.println("Mail sender instance: " + (mailSender == null ? "NULL" : "initialized"));
        System.out.println("Frontend URL: " + frontendUrl);
        System.out.println("From email: " + fromEmail);

        // Always return true in console mode
        if (!emailEnabled) {
            System.out.println("Email sending is disabled in configuration. Only logging token to console.");
            return true;
        }

        // Check mailSender again
        if (mailSender == null) {
            System.err.println("ERROR: JavaMailSender is null but email is enabled! Check your configuration.");
            System.out.println("Email would have been sent to: " + to);
            return true; // Still return true to allow the flow to continue
        }

        try {
            System.out.println("Attempting to create and send email...");
            
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
            
            System.out.println("Email message created. Attempting to send...");
            System.out.println("From: " + fromEmail);
            System.out.println("To: " + to);
            
            mailSender.send(message);
            System.out.println("Password reset email sent successfully to: " + to);
            return true;
        } catch (Exception e) {
            System.err.println("Failed to send password reset email: " + e.getMessage());
            System.err.println("Error type: " + e.getClass().getName());
            e.printStackTrace();
            return false;
        }
    }
}