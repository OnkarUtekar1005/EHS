package com.ehs.elearning.controller;

import com.ehs.elearning.model.CourseComponent;
import com.ehs.elearning.payload.request.AssessmentComponentRequest;
import com.ehs.elearning.payload.response.ComponentResponse;
import com.ehs.elearning.payload.response.MessageResponse;
import com.ehs.elearning.service.AssessmentService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin/courses/{courseId}/assessments")
@CrossOrigin(origins = "*", maxAge = 3600)
@PreAuthorize("hasRole('ADMIN')")
public class AssessmentController {
    
    @Autowired
    private AssessmentService assessmentService;
    
    @PostMapping
    public ResponseEntity<?> createAssessment(
            @PathVariable UUID courseId,
            @Valid @RequestBody AssessmentComponentRequest request) {
        try {
            CourseComponent component = assessmentService.createAssessmentComponent(courseId, request);
            return ResponseEntity.status(HttpStatus.CREATED).body(new ComponentResponse(component));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(new MessageResponse("Error: " + e.getMessage()));
        }
    }
    
    @PutMapping("/{componentId}")
    public ResponseEntity<?> updateAssessment(
            @PathVariable UUID courseId,
            @PathVariable UUID componentId,
            @Valid @RequestBody AssessmentComponentRequest request) {
        try {
            CourseComponent component = assessmentService.updateAssessmentComponent(courseId, componentId, request);
            return ResponseEntity.ok(new ComponentResponse(component));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(new MessageResponse("Error: " + e.getMessage()));
        }
    }
}