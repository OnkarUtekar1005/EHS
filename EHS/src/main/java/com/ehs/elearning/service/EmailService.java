package com.ehs.elearning.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Service
public class EmailService {

    @Autowired(required = false)
    private JavaMailSender mailSender;

    @Value("${app.email.enabled:false}")
    private boolean emailEnabled;

    @Value("${app.frontend.url:http://localhost:3000/}")
    private String frontendUrl;

    @Value("${spring.mail.username}")
    private String fromEmail;

    @Value("${app.enquiry.email}")
    private String enquiryRecipientEmail;

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

    /**
     * Sends a course enquiry notification email to staff
     *
     * @param courseName Name of the course enquired about
     * @param fullName Full name of the enquirer
     * @param email Email of the enquirer
     * @param phone Phone number of the enquirer
     * @param enquiryMessage The enquiry message
     * @return true if email was sent successfully, false otherwise
     */
    public boolean sendCourseEnquiryEmail(String courseName, String fullName, String email,
                                          String phone, String enquiryMessage) {
        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));

        // Log to console (always)
        System.out.println("\n========================================");
        System.out.println("    NEW COURSE ENQUIRY RECEIVED");
        System.out.println("========================================");
        System.out.println("Timestamp: " + timestamp);
        System.out.println("Course: " + courseName);
        System.out.println("Name: " + fullName);
        System.out.println("Email: " + email);
        System.out.println("Phone: " + phone);
        System.out.println("Message: " + enquiryMessage);
        System.out.println("========================================\n");

        // If email is not enabled, just return true (console logging done above)
        if (!emailEnabled) {
            System.out.println("[Email Service] Email disabled - enquiry logged to console only");
            return true;
        }

        if (mailSender == null) {
            System.out.println("[Email Service] Mail sender not configured - enquiry logged to console only");
            return true;
        }

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(enquiryRecipientEmail);
            message.setSubject("New Course Enquiry: " + courseName);
            message.setText(
                "========================================\n" +
                "    NEW COURSE ENQUIRY RECEIVED\n" +
                "========================================\n\n" +
                "Course: " + courseName + "\n" +
                "Name: " + fullName + "\n" +
                "Email: " + email + "\n" +
                "Phone: " + phone + "\n\n" +
                "Message:\n" + enquiryMessage + "\n\n" +
                "----------------------------------------\n" +
                "Timestamp: " + timestamp + "\n" +
                "----------------------------------------\n\n" +
                "This is an automated message from the EHS Learning Platform."
            );

            mailSender.send(message);
            System.out.println("[Email Service] Course enquiry email sent successfully to " + enquiryRecipientEmail);
            return true;
        } catch (Exception e) {
            System.err.println("[Email Service] Failed to send course enquiry email: " + e.getMessage());
            return false;
        }
    }
}