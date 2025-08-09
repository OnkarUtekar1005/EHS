package com.ehs.elearning.controller;

import com.ehs.elearning.model.Think;
import com.ehs.elearning.model.Think.ThinkType;
import com.ehs.elearning.model.Think.ThinkStatus;
import com.ehs.elearning.model.Users;
import com.ehs.elearning.payload.request.AdminResponseRequest;
import com.ehs.elearning.payload.request.ThinkRequest;
import com.ehs.elearning.payload.response.MessageResponse;
import com.ehs.elearning.payload.response.ThinkResponse;
import com.ehs.elearning.repository.UserRepository;
import com.ehs.elearning.security.UserDetailsImpl;
import com.ehs.elearning.service.ThinkService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/think")
@CrossOrigin(origins = "*", maxAge = 3600)
public class ThinkController {
    
    @Autowired
    private ThinkService thinkService;
    
    @Autowired
    private UserRepository userRepository;
    
    @PostMapping("/public/submit")
    public ResponseEntity<?> submitPublic(@Valid @RequestBody ThinkRequest request) {
        try {
            ThinkType type = ThinkType.valueOf(request.getType().toUpperCase());
            Think submission = thinkService.createAnonymousSubmission(
                type, 
                request.getSubject(), 
                request.getDescription()
            );
            
            return ResponseEntity.ok(new MessageResponse("Thank you for your submission. Your feedback has been received."));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new MessageResponse("Invalid submission type"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new MessageResponse("Error submitting feedback: " + e.getMessage()));
        }
    }
    
    @PostMapping("/submit")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<?> submitAuthenticated(@Valid @RequestBody ThinkRequest request) {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
            UUID userId = userDetails.getId();
            
            ThinkType type = ThinkType.valueOf(request.getType().toUpperCase());
            Think submission = thinkService.createUserSubmission(
                type,
                request.getSubject(),
                request.getDescription(),
                userId,
                request.getIsAnonymous() != null ? request.getIsAnonymous() : false
            );
            
            return ResponseEntity.ok(new MessageResponse("Your submission has been received successfully."));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new MessageResponse("Invalid submission type"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new MessageResponse("Error submitting feedback: " + e.getMessage()));
        }
    }
    
    @GetMapping("/user/submissions")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<?> getUserSubmissions() {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
            UUID userId = userDetails.getId();
            
            List<Think> submissions = thinkService.getUserSubmissions(userId);
            List<ThinkResponse> responses = submissions.stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
            
            return ResponseEntity.ok(responses);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new MessageResponse("Error fetching submissions: " + e.getMessage()));
        }
    }
    
    @GetMapping("/admin/all")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getAllSubmissions() {
        try {
            List<Think> submissions = thinkService.getAllSubmissions();
            List<ThinkResponse> responses = submissions.stream()
                .map(this::convertToResponseForAdmin)
                .collect(Collectors.toList());
            
            return ResponseEntity.ok(responses);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new MessageResponse("Error fetching submissions: " + e.getMessage()));
        }
    }
    
    @GetMapping("/admin/type/{type}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getSubmissionsByType(@PathVariable String type) {
        try {
            ThinkType thinkType = ThinkType.valueOf(type.toUpperCase());
            List<Think> submissions = thinkService.getSubmissionsByType(thinkType);
            List<ThinkResponse> responses = submissions.stream()
                .map(this::convertToResponseForAdmin)
                .collect(Collectors.toList());
            
            return ResponseEntity.ok(responses);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new MessageResponse("Invalid type"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new MessageResponse("Error fetching submissions: " + e.getMessage()));
        }
    }
    
    @PostMapping("/admin/{id}/respond")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> respondToSubmission(@PathVariable UUID id, 
                                                 @Valid @RequestBody AdminResponseRequest request) {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
            UUID adminId = userDetails.getId();
            
            Think submission = thinkService.addAdminResponse(id, request.getResponse(), adminId);
            
            if (request.getStatus() != null) {
                ThinkStatus status = ThinkStatus.valueOf(request.getStatus().toUpperCase());
                thinkService.updateStatus(id, status);
            }
            
            if (submission != null) {
                return ResponseEntity.ok(new MessageResponse("Response added successfully"));
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new MessageResponse("Invalid status"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new MessageResponse("Error adding response: " + e.getMessage()));
        }
    }
    
    @PutMapping("/admin/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> updateStatus(@PathVariable UUID id, @RequestParam String status) {
        try {
            ThinkStatus thinkStatus = ThinkStatus.valueOf(status.toUpperCase());
            Think submission = thinkService.updateStatus(id, thinkStatus);
            
            if (submission != null) {
                return ResponseEntity.ok(new MessageResponse("Status updated successfully"));
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new MessageResponse("Invalid status"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new MessageResponse("Error updating status: " + e.getMessage()));
        }
    }
    
    @GetMapping("/admin/stats")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getStatistics() {
        try {
            return ResponseEntity.ok(new ThinkStatistics(
                thinkService.getCountByType(ThinkType.QUERY),
                thinkService.getCountByType(ThinkType.COMPLAINT),
                thinkService.getCountByType(ThinkType.NEW_IDEA),
                thinkService.getCountByStatus(ThinkStatus.OPEN),
                thinkService.getCountByStatus(ThinkStatus.IN_PROGRESS),
                thinkService.getCountByStatus(ThinkStatus.RESOLVED)
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new MessageResponse("Error fetching statistics: " + e.getMessage()));
        }
    }
    
    private ThinkResponse convertToResponse(Think think) {
        ThinkResponse response = new ThinkResponse();
        response.setId(think.getId() != null ? think.getId().toString() : null);
        response.setType(think.getType().toString());
        response.setSubject(think.getSubject());
        response.setDescription(think.getDescription());
        response.setAnonymous(think.isAnonymous());
        response.setCreatedAt(think.getCreatedAt());
        response.setStatus(think.getStatus().toString());
        response.setAdminResponse(think.getAdminResponse());
        response.setRespondedAt(think.getRespondedAt());
        
        if (!think.isAnonymous() && think.getUser() != null) {
            response.setUserName(think.getUser().getUsername());
        }
        
        if (think.getRespondedBy() != null) {
            response.setRespondedBy(think.getRespondedBy().getUsername());
        }
        
        return response;
    }
    
    private ThinkResponse convertToResponseForAdmin(Think think) {
        ThinkResponse response = convertToResponse(think);
        
        if (think.getUser() != null && !think.isAnonymous()) {
            response.setUserName(think.getUser().getUsername());
        } else if (think.isAnonymous()) {
            response.setUserName("Anonymous");
        }
        
        return response;
    }
    
    static class ThinkStatistics {
        private Long queries;
        private Long complaints;
        private Long newIdeas;
        private Long openCount;
        private Long inProgressCount;
        private Long resolvedCount;
        
        public ThinkStatistics(Long queries, Long complaints, Long newIdeas,
                              Long openCount, Long inProgressCount, Long resolvedCount) {
            this.queries = queries;
            this.complaints = complaints;
            this.newIdeas = newIdeas;
            this.openCount = openCount;
            this.inProgressCount = inProgressCount;
            this.resolvedCount = resolvedCount;
        }
        
        public Long getQueries() { return queries; }
        public Long getComplaints() { return complaints; }
        public Long getNewIdeas() { return newIdeas; }
        public Long getOpenCount() { return openCount; }
        public Long getInProgressCount() { return inProgressCount; }
        public Long getResolvedCount() { return resolvedCount; }
    }
}