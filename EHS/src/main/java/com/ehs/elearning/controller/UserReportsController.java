package com.ehs.elearning.controller;

import com.ehs.elearning.model.Users;
import com.ehs.elearning.payload.response.MessageResponse;
import com.ehs.elearning.repository.UserRepository;
import com.ehs.elearning.service.UserReportsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

/**
 * Controller for the original user reports endpoints
 * Note: The /api/user/me/report endpoint is in UserReportController
 */
@RestController
@RequestMapping("/api/v2/user/reports")
@PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
public class UserReportsController {

    @Autowired
    private UserReportsService userReportsService;
    
    @Autowired
    private UserRepository userRepository;
    
    /**
     * Get complete user reports for the authenticated user
     */
    @GetMapping
    public ResponseEntity<?> getUserReports(Authentication authentication) {
        try {
            String username = authentication.getName();
            Users user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
                
            Map<String, Object> reports = userReportsService.getUserReports(user.getId());
            
            return ResponseEntity.ok(reports);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new MessageResponse("Error fetching user reports: " + e.getMessage()));
        }
    }
    
    /**
     * Get summary metrics only
     */
    @GetMapping("/summary")
    public ResponseEntity<?> getSummaryMetrics(Authentication authentication) {
        try {
            String username = authentication.getName();
            Users user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
                
            Map<String, Object> summaryMetrics = userReportsService.getUserSummaryMetrics(user.getId());
            
            return ResponseEntity.ok(summaryMetrics);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new MessageResponse("Error fetching summary metrics: " + e.getMessage()));
        }
    }
    
    /**
     * Get course progress details only
     */
    @GetMapping("/courses")
    public ResponseEntity<?> getCourseProgressDetails(Authentication authentication) {
        try {
            String username = authentication.getName();
            Users user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
                
            return ResponseEntity.ok(userReportsService.getUserCourseProgressDetails(user.getId()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new MessageResponse("Error fetching course progress details: " + e.getMessage()));
        }
    }
    
    /**
     * Get assessment statistics only
     */
    @GetMapping("/assessments")
    public ResponseEntity<?> getAssessmentStats(Authentication authentication) {
        try {
            String username = authentication.getName();
            Users user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
                
            return ResponseEntity.ok(userReportsService.getUserAssessmentStats(user.getId()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new MessageResponse("Error fetching assessment statistics: " + e.getMessage()));
        }
    }
    
    /**
     * Get chart data only
     */
    @GetMapping("/charts")
    public ResponseEntity<?> getChartData(Authentication authentication) {
        try {
            String username = authentication.getName();
            Users user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
                
            return ResponseEntity.ok(userReportsService.getUserChartData(user.getId()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new MessageResponse("Error fetching chart data: " + e.getMessage()));
        }
    }
    
    /**
     * Admin access to view reports for any user
     */
    @GetMapping("/admin/user/{userId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getUserReportsAsAdmin(@PathVariable UUID userId) {
        try {
            return ResponseEntity.ok(userReportsService.getUserReports(userId));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new MessageResponse("Error fetching user reports: " + e.getMessage()));
        }
    }
}