package com.ehs.elearning.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.ehs.elearning.service.EmailService;

@RestController
@RequestMapping("/api/test")
public class TestController {

    @Autowired
    private EmailService emailService;

    @GetMapping("/send-email")
    public ResponseEntity<String> testEmail(@RequestParam String email) {
        try {
            System.out.println("Test email endpoint called for: " + email);
            boolean sent = emailService.sendPasswordResetEmail(email, "test-token-123456");
            
            if (sent) {
                return ResponseEntity.ok("Email sent successfully to: " + email);
            } else {
                return ResponseEntity.internalServerError().body("Failed to send email. Check server logs for details.");
            }
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body("Error: " + e.getMessage());
        }
    }
}