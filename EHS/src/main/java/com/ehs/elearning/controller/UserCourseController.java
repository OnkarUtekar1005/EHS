package com.ehs.elearning.controller;

import com.ehs.elearning.model.Course;
import com.ehs.elearning.model.Course.CourseStatus;
import com.ehs.elearning.model.Users;
import com.ehs.elearning.model.UserCourseProgress;
import com.ehs.elearning.payload.response.CourseResponse;
import com.ehs.elearning.payload.response.MessageResponse;
import com.ehs.elearning.repository.UserRepository;
import com.ehs.elearning.repository.UserCourseProgressRepository;
import com.ehs.elearning.service.CourseService;
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

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v2/user")
public class UserCourseController {
    
    @Autowired
    private CourseService courseService;
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private UserCourseProgressRepository courseProgressRepository;
    
    // Get courses for the current user based on their domains
    @GetMapping("/courses")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<?> getUserCourses(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int limit,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "false") boolean showAll,
            Authentication authentication) {
        
        try {
            String currentUsername = authentication.getName();
            Users currentUser = userRepository.findByUsername(currentUsername)
                .orElseThrow(() -> new RuntimeException("Current user not found"));
            
            System.out.println("Current user: " + currentUsername);
            System.out.println("User domains: " + currentUser.getDomains().size());
            System.out.println("Show all: " + showAll);
            
            Pageable pageable = PageRequest.of(page - 1, limit, Sort.by(Sort.Direction.DESC, "publishedAt"));
            
            List<Course> courses;
            Page<Course> coursePage;
            
            if (showAll) {
                // Show all published courses
                coursePage = courseService.searchCourses(search, null, CourseStatus.PUBLISHED, pageable);
            } else {
                // Show only courses from user's domains
                List<UUID> userDomainIds = currentUser.getDomains().stream()
                    .map(domain -> domain.getId())
                    .collect(Collectors.toList());
                
                if (userDomainIds.isEmpty()) {
                    // User has no domains assigned, return empty list
                    coursePage = Page.empty(pageable);
                } else {
                    // Get courses from user's domains
                    courses = new ArrayList<>();
                    for (UUID domainId : userDomainIds) {
                        Page<Course> domainCourses = courseService.searchCourses(search, domainId, CourseStatus.PUBLISHED, pageable);
                        courses.addAll(domainCourses.getContent());
                    }
                    
                    // Remove duplicates
                    courses = courses.stream().distinct().collect(Collectors.toList());
                    
                    // Create a page from the list
                    int start = (int) pageable.getOffset();
                    int end = Math.min((start + pageable.getPageSize()), courses.size());
                    List<Course> pageContent = courses.subList(start, end);
                    coursePage = new org.springframework.data.domain.PageImpl<>(pageContent, pageable, courses.size());
                }
            }
            
            // Map courses to response DTOs
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
            response.put("showingAll", showAll);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new MessageResponse("Error fetching courses: " + e.getMessage()));
        }
    }
    
    // Get a specific course detail
    @GetMapping("/courses/{courseId}")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<?> getCourseDetail(@PathVariable UUID courseId, Authentication authentication) {
        try {
            Course course = courseService.getCourseWithComponents(courseId);
            
            // Check if course is published
            if (course.getStatus() != CourseStatus.PUBLISHED) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(new MessageResponse("Course is not available"));
            }
            
            CourseResponse response = new CourseResponse(course);
            response.setComponentCount(course.getComponents().size());
            response.setComponents(course.getComponents());
            
            // Include enrollment status if authenticated
            if (authentication != null) {
                String currentUsername = authentication.getName();
                Users currentUser = userRepository.findByUsername(currentUsername)
                    .orElse(null);
                    
                if (currentUser != null) {
                    Optional<UserCourseProgress> enrollment = courseProgressRepository
                        .findByUserIdAndCourseId(currentUser.getId(), courseId);
                    response.setEnrollmentStatus(enrollment.isPresent() ? "enrolled" : "not_enrolled");
                }
            }
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(new MessageResponse("Course not found: " + e.getMessage()));
        }
    }
}