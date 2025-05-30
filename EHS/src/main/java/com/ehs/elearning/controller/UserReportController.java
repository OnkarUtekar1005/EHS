package com.ehs.elearning.controller;

import com.ehs.elearning.model.Users;
import com.ehs.elearning.payload.response.MessageResponse;
import com.ehs.elearning.repository.UserRepository;
import com.ehs.elearning.service.UserReportService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * REST controller for user learning reports
 * Provides endpoints for retrieving personalized learning statistics for authenticated users
 */
@RestController
@RequestMapping("/api/user")
public class UserReportController {

    @Autowired
    private UserReportService userReportService;
    
    @Autowired
    private UserRepository userRepository;
    
    /**
     * Endpoint to get the authenticated user's learning report
     * This endpoint is accessible to any authenticated user with the USER role
     *
     * @param authentication The Spring Security Authentication object containing the authenticated user
     * @return ResponseEntity containing a detailed learning report
     */
    @GetMapping("/report")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<?> getUserReport(Authentication authentication) {
        try {
            // Extract current user from authentication
            String username = authentication.getName();
            Users user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
                
            // Get the user's report from the service
            Map<String, Object> report = userReportService.getUserReport(user.getId());
            
            return ResponseEntity.ok(report);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new MessageResponse("Error fetching user report: " + e.getMessage()));
        }
    }
    
    /**
     * Admin-only endpoint to get a report for any user by ID
     * 
     * @param userId ID of the user to get the report for
     * @return ResponseEntity containing a detailed learning report for the specified user
     */
    @GetMapping("/admin/reports/{userId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getUserReportById(@PathVariable String userId) {
        try {
            // Get the user's report from the service
            Map<String, Object> report = userReportService.getUserReport(java.util.UUID.fromString(userId));
            
            return ResponseEntity.ok(report);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new MessageResponse("Error fetching user report: " + e.getMessage()));
        }
    }
}