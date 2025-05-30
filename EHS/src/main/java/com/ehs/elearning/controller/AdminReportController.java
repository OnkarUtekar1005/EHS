package com.ehs.elearning.controller;

import com.ehs.elearning.payload.response.MessageResponse;
import com.ehs.elearning.service.UserReportService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

/**
 * Admin controller for accessing user reports
 */
@RestController
@RequestMapping("/api/v2/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminReportController {

    @Autowired
    private UserReportService userReportService;
    
    /**
     * Get reports for a specific user
     */
    @GetMapping("/users/{userId}/reports")
    public ResponseEntity<?> getUserReport(@PathVariable UUID userId) {
        try {
            Map<String, Object> report = userReportService.getUserReport(userId);
            return ResponseEntity.ok(report);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new MessageResponse("Error fetching user report: " + e.getMessage()));
        }
    }
}