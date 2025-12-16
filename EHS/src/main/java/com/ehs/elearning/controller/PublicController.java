package com.ehs.elearning.controller;

import com.ehs.elearning.model.Course;
import com.ehs.elearning.model.Course.CourseStatus;
import com.ehs.elearning.payload.request.CourseEnquiryRequest;
import com.ehs.elearning.repository.CourseRepository;
import com.ehs.elearning.service.EmailService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Public controller for endpoints that don't require authentication.
 * Used for landing page data like published courses.
 */
@RestController
@RequestMapping("/api/public")
@CrossOrigin(origins = "*")
public class PublicController {

    @Autowired
    private CourseRepository courseRepository;

    @Autowired
    private EmailService emailService;

    /**
     * Get published courses for landing page marquee.
     * Only returns PUBLISHED courses with limited fields for security.
     */
    @GetMapping("/courses")
    public ResponseEntity<?> getPublishedCourses(
            @RequestParam(defaultValue = "10") int limit) {
        try {
            // Get only published courses
            List<Course> publishedCourses = courseRepository.findByStatus(CourseStatus.PUBLISHED);

            // Limit the number of courses
            if (publishedCourses.size() > limit) {
                publishedCourses = publishedCourses.subList(0, limit);
            }

            // Map to simplified response (only public-safe fields)
            List<Map<String, Object>> courseList = publishedCourses.stream()
                .map(course -> {
                    Map<String, Object> courseMap = new HashMap<>();
                    courseMap.put("id", course.getId());
                    courseMap.put("title", course.getTitle());
                    courseMap.put("description", course.getDescription());
                    courseMap.put("icon", course.getIcon());
                    courseMap.put("timeLimit", course.getTimeLimit());
                    courseMap.put("componentCount", course.getComponents() != null ? course.getComponents().size() : 0);
                    if (course.getDomain() != null) {
                        courseMap.put("domainName", course.getDomain().getName());
                    }
                    return courseMap;
                })
                .collect(Collectors.toList());

            Map<String, Object> response = new HashMap<>();
            response.put("courses", courseList);
            response.put("total", courseList.size());

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            e.printStackTrace();
            Map<String, String> error = new HashMap<>();
            error.put("message", "Error fetching courses");
            return ResponseEntity.internalServerError().body(error);
        }
    }

    /**
     * Submit a course enquiry from the landing page.
     * Sends an email notification to staff with enquiry details.
     */
    @PostMapping("/course-enquiry")
    public ResponseEntity<?> submitCourseEnquiry(@Valid @RequestBody CourseEnquiryRequest request) {
        try {
            // Send email notification
            boolean emailSent = emailService.sendCourseEnquiryEmail(
                request.getCourseName(),
                request.getFullName(),
                request.getEmail(),
                request.getPhone(),
                request.getMessage()
            );

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Your enquiry has been submitted successfully. We will get back to you soon.");

            if (!emailSent) {
                response.put("message", "Your enquiry has been received. Our team will contact you shortly.");
            }

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            e.printStackTrace();
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Failed to submit enquiry. Please try again later.");
            return ResponseEntity.internalServerError().body(error);
        }
    }
}
