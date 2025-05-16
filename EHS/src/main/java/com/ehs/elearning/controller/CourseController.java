package com.ehs.elearning.controller;

import com.ehs.elearning.model.Course;
import com.ehs.elearning.model.Course.CourseStatus;
import com.ehs.elearning.model.Users;
import com.ehs.elearning.payload.request.CourseRequest;
import com.ehs.elearning.payload.response.CourseResponse;
import com.ehs.elearning.payload.response.MessageResponse;
import com.ehs.elearning.repository.DomainRepository;
import com.ehs.elearning.repository.UserRepository;
import com.ehs.elearning.service.CourseService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/v2/admin")
public class CourseController {
    
    @Autowired
    private CourseService courseService;
    
    @Autowired
    private DomainRepository domainRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    // Get all courses with pagination and filtering
    @GetMapping("/courses")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getCourses(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "5") int limit,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) UUID domainId,
            @RequestParam(required = false) String status) {
        
        try {
            CourseStatus courseStatus = null;
            if (status != null && !status.isEmpty()) {
                courseStatus = CourseStatus.valueOf(status.toUpperCase());
            }
            
            Pageable pageable = PageRequest.of(page - 1, limit, Sort.by(Sort.Direction.DESC, "createdAt"));
            Page<Course> coursePage = courseService.searchCourses(search, domainId, courseStatus, pageable);
            
            // Map courses to response DTOs with component count
            List<CourseResponse> courseResponses = coursePage.getContent().stream()
                .map(course -> {
                    CourseResponse response = new CourseResponse(course);
                    response.setComponentCount(course.getComponents().size());
                    return response;
                })
                .collect(Collectors.toList());
            
            Map<String, Object> response = new HashMap<>();
            response.put("courses", courseResponses);
            response.put("pagination", Map.of(
                "page", page,
                "totalPages", coursePage.getTotalPages(),
                "totalItems", coursePage.getTotalElements(),
                "itemsPerPage", limit
            ));
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new MessageResponse("Error fetching courses: " + e.getMessage()));
        }
    }
    
    // Create a new course
    @PostMapping("/courses")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> createCourse(@Valid @RequestBody CourseRequest courseRequest, Authentication authentication) {
        try {
            String currentUsername = authentication.getName();
            Users currentUser = userRepository.findByUsername(currentUsername)
                .orElseThrow(() -> new RuntimeException("Current user not found"));
            
            // Create course entity from request
            Course course = new Course();
            course.setTitle(courseRequest.getTitle());
            course.setDescription(courseRequest.getDescription());
            course.setDomain(domainRepository.findById(courseRequest.getDomainId())
                .orElseThrow(() -> new RuntimeException("Domain not found")));
            course.setIcon(courseRequest.getIcon());
            course.setTimeLimit(courseRequest.getTimeLimit());
            course.setPassingScore(courseRequest.getPassingScore());
            
            Course savedCourse = courseService.createCourse(course, currentUser);
            return ResponseEntity.ok(new CourseResponse(savedCourse));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new MessageResponse("Error creating course: " + e.getMessage()));
        }
    }
    
    // Update a course
    @PutMapping("/courses/{courseId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> updateCourse(@PathVariable UUID courseId, @Valid @RequestBody CourseRequest courseRequest) {
        try {
            Course course = new Course();
            course.setTitle(courseRequest.getTitle());
            course.setDescription(courseRequest.getDescription());
            course.setDomain(domainRepository.findById(courseRequest.getDomainId())
                .orElseThrow(() -> new RuntimeException("Domain not found")));
            course.setIcon(courseRequest.getIcon());
            course.setTimeLimit(courseRequest.getTimeLimit());
            course.setPassingScore(courseRequest.getPassingScore());
            
            Course updatedCourse = courseService.updateCourse(courseId, course);
            return ResponseEntity.ok(new CourseResponse(updatedCourse));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new MessageResponse("Error updating course: " + e.getMessage()));
        }
    }
    
    // Delete a course
    @DeleteMapping("/courses/{courseId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deleteCourse(@PathVariable UUID courseId) {
        try {
            courseService.deleteCourse(courseId);
            return ResponseEntity.ok(new MessageResponse("Course deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new MessageResponse("Error deleting course: " + e.getMessage()));
        }
    }
    
    // Publish a course
    @PostMapping("/courses/{courseId}/publish")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> publishCourse(@PathVariable UUID courseId) {
        try {
            Course publishedCourse = courseService.publishCourse(courseId);
            return ResponseEntity.ok(Map.of(
                "message", "Course published successfully",
                "publishedAt", publishedCourse.getPublishedAt()
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new MessageResponse("Error publishing course: " + e.getMessage()));
        }
    }
    
    // Take down a course
    @PostMapping("/courses/{courseId}/takedown")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> takeDownCourse(@PathVariable UUID courseId) {
        try {
            Course takenDownCourse = courseService.takeDownCourse(courseId);
            return ResponseEntity.ok(new MessageResponse("Course taken down successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new MessageResponse("Error taking down course: " + e.getMessage()));
        }
    }
    
    // Clone a course
    @PostMapping("/courses/{courseId}/clone")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> cloneCourse(@PathVariable UUID courseId, Authentication authentication) {
        try {
            String currentUsername = authentication.getName();
            Users currentUser = userRepository.findByUsername(currentUsername)
                .orElseThrow(() -> new RuntimeException("Current user not found"));
            
            Course clonedCourse = courseService.cloneCourse(courseId, currentUser);
            return ResponseEntity.ok(new CourseResponse(clonedCourse));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new MessageResponse("Error cloning course: " + e.getMessage()));
        }
    }
    
    // Get a specific course with its components
    @GetMapping("/courses/{courseId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getCourseDetail(@PathVariable UUID courseId) {
        try {
            Course course = courseService.getCourseWithComponents(courseId);
            CourseResponse response = new CourseResponse(course);
            response.setComponentCount(course.getComponents().size());
            response.setComponents(course.getComponents());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(new MessageResponse("Course not found: " + e.getMessage()));
        }
    }
}