package com.ehs.elearning.controller;

import com.ehs.elearning.model.Announcement;
import com.ehs.elearning.model.Announcement.Priority;
import com.ehs.elearning.payload.request.AnnouncementRequest;
import com.ehs.elearning.payload.response.AnnouncementResponse;
import com.ehs.elearning.payload.response.MessageResponse;
import com.ehs.elearning.security.UserDetailsImpl;
import com.ehs.elearning.service.AnnouncementService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/announcements")
@CrossOrigin(origins = "*", maxAge = 3600)
public class AnnouncementController {
    
    @Autowired
    private AnnouncementService announcementService;
    
    @GetMapping("/active")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<?> getActiveAnnouncements() {
        try {
            List<Announcement> announcements = announcementService.getActiveAnnouncements();
            List<AnnouncementResponse> responses = announcements.stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
            
            return ResponseEntity.ok(responses);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new MessageResponse("Error fetching announcements: " + e.getMessage()));
        }
    }
    
    @GetMapping("/active/priority/{priority}")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<?> getActiveAnnouncementsByPriority(@PathVariable String priority) {
        try {
            Priority priorityEnum = Priority.valueOf(priority.toUpperCase());
            List<Announcement> announcements = announcementService.getActiveAnnouncementsByPriority(priorityEnum);
            List<AnnouncementResponse> responses = announcements.stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
            
            return ResponseEntity.ok(responses);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new MessageResponse("Invalid priority"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new MessageResponse("Error fetching announcements: " + e.getMessage()));
        }
    }
    
    @PostMapping("/admin/create")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> createAnnouncement(@Valid @RequestBody AnnouncementRequest request) {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
            UUID adminId = userDetails.getId();
            
            Priority priority = Priority.valueOf(request.getPriority().toUpperCase());
            
            Announcement announcement = announcementService.createAnnouncement(
                request.getTitle(),
                request.getContent(),
                request.getAuthorName(),
                priority,
                request.getExpiresAt(),
                adminId
            );
            
            return ResponseEntity.ok(new MessageResponse("Announcement created successfully"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new MessageResponse("Invalid priority"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new MessageResponse("Error creating announcement: " + e.getMessage()));
        }
    }
    
    @GetMapping("/admin/all")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getAllAnnouncements() {
        try {
            List<Announcement> announcements = announcementService.getAllAnnouncements();
            List<AnnouncementResponse> responses = announcements.stream()
                .map(this::convertToResponseForAdmin)
                .collect(Collectors.toList());
            
            return ResponseEntity.ok(responses);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new MessageResponse("Error fetching announcements: " + e.getMessage()));
        }
    }
    
    @PutMapping("/admin/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> updateAnnouncement(@PathVariable UUID id, @Valid @RequestBody AnnouncementRequest request) {
        try {
            Priority priority = Priority.valueOf(request.getPriority().toUpperCase());
            
            Announcement announcement = announcementService.updateAnnouncement(
                id,
                request.getTitle(),
                request.getContent(),
                request.getAuthorName(),
                priority,
                request.getExpiresAt(),
                request.getIsActive()
            );
            
            if (announcement != null) {
                return ResponseEntity.ok(new MessageResponse("Announcement updated successfully"));
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new MessageResponse("Invalid priority"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new MessageResponse("Error updating announcement: " + e.getMessage()));
        }
    }
    
    @PutMapping("/admin/{id}/toggle")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> toggleAnnouncementStatus(@PathVariable UUID id) {
        try {
            Announcement announcement = announcementService.toggleAnnouncementStatus(id);
            
            if (announcement != null) {
                String status = announcement.isActive() ? "activated" : "deactivated";
                return ResponseEntity.ok(new MessageResponse("Announcement " + status + " successfully"));
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new MessageResponse("Error updating announcement status: " + e.getMessage()));
        }
    }
    
    @DeleteMapping("/admin/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deleteAnnouncement(@PathVariable UUID id) {
        try {
            announcementService.deleteAnnouncement(id);
            return ResponseEntity.ok(new MessageResponse("Announcement deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new MessageResponse("Error deleting announcement: " + e.getMessage()));
        }
    }
    
    @GetMapping("/admin/search")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> searchAnnouncements(@RequestParam String q) {
        try {
            List<Announcement> announcements = announcementService.searchAnnouncements(q);
            List<AnnouncementResponse> responses = announcements.stream()
                .map(this::convertToResponseForAdmin)
                .collect(Collectors.toList());
            
            return ResponseEntity.ok(responses);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new MessageResponse("Error searching announcements: " + e.getMessage()));
        }
    }
    
    @GetMapping("/admin/stats")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getAnnouncementStats() {
        try {
            return ResponseEntity.ok(new AnnouncementStats(
                announcementService.getActiveAnnouncementCount(),
                announcementService.getAnnouncementCountByPriority(Priority.URGENT),
                announcementService.getAnnouncementCountByPriority(Priority.HIGH),
                announcementService.getAnnouncementCountByPriority(Priority.MEDIUM),
                announcementService.getAnnouncementCountByPriority(Priority.LOW)
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new MessageResponse("Error fetching statistics: " + e.getMessage()));
        }
    }
    
    private AnnouncementResponse convertToResponse(Announcement announcement) {
        AnnouncementResponse response = new AnnouncementResponse();
        response.setId(announcement.getId() != null ? announcement.getId().toString() : null);
        response.setTitle(announcement.getTitle());
        response.setContent(announcement.getContent());
        response.setAuthorName(announcement.getAuthorName());
        response.setCreatedAt(announcement.getCreatedAt());
        response.setActive(announcement.isActive());
        response.setPriority(announcement.getPriority().toString());
        response.setExpiresAt(announcement.getExpiresAt());
        response.setExpired(announcement.getExpiresAt() != null && LocalDateTime.now().isAfter(announcement.getExpiresAt()));
        
        return response;
    }
    
    private AnnouncementResponse convertToResponseForAdmin(Announcement announcement) {
        AnnouncementResponse response = convertToResponse(announcement);
        
        if (announcement.getCreatedBy() != null) {
            response.setCreatedByUsername(announcement.getCreatedBy().getUsername());
        }
        
        return response;
    }
    
    static class AnnouncementStats {
        private Long totalActive;
        private Long urgentCount;
        private Long highCount;
        private Long mediumCount;
        private Long lowCount;
        
        public AnnouncementStats(Long totalActive, Long urgentCount, Long highCount, 
                                Long mediumCount, Long lowCount) {
            this.totalActive = totalActive;
            this.urgentCount = urgentCount;
            this.highCount = highCount;
            this.mediumCount = mediumCount;
            this.lowCount = lowCount;
        }
        
        public Long getTotalActive() { return totalActive; }
        public Long getUrgentCount() { return urgentCount; }
        public Long getHighCount() { return highCount; }
        public Long getMediumCount() { return mediumCount; }
        public Long getLowCount() { return lowCount; }
    }
}