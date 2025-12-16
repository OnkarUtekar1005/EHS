package com.ehs.elearning.controller;

import com.ehs.elearning.model.Course;
import com.ehs.elearning.model.Course.CourseStatus;
import com.ehs.elearning.model.Domain;
import com.ehs.elearning.model.Users;
import com.ehs.elearning.model.UserCourseProgress;
import com.ehs.elearning.payload.response.CourseResponse;
import com.ehs.elearning.payload.response.MessageResponse;
import com.ehs.elearning.repository.CourseRepository;
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
    private CourseRepository courseRepository;

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
            @RequestParam(defaultValue = "recent") String sortBy,
            Authentication authentication) {

        try {
            String currentUsername = authentication.getName();
            Users currentUser = userRepository.findByUsername(currentUsername)
                .orElseThrow(() -> new RuntimeException("Current user not found"));

            // Get user's domain IDs for lock status checking
            Set<UUID> userDomainIds = currentUser.getDomains().stream()
                .map(Domain::getId)
                .collect(Collectors.toSet());

            // Determine sort order based on sortBy parameter
            Sort sort;
            switch (sortBy) {
                case "alphabetical":
                    sort = Sort.by(Sort.Direction.ASC, "title");
                    break;
                case "popular":
                    // For popular, we'll sort after fetching (need enrollment counts)
                    sort = Sort.by(Sort.Direction.DESC, "publishedAt");
                    break;
                case "recent":
                default:
                    sort = Sort.by(Sort.Direction.DESC, "publishedAt");
                    break;
            }

            Pageable pageable = PageRequest.of(page - 1, limit, sort);

            List<Course> courses;
            Page<Course> coursePage;

            if (showAll) {
                // Show all published courses
                coursePage = courseService.searchCourses(search, null, CourseStatus.PUBLISHED, pageable);
            } else {
                // Show only courses from user's domains
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
                    List<Course> pageContent = start < courses.size() ? courses.subList(start, end) : new ArrayList<>();
                    coursePage = new org.springframework.data.domain.PageImpl<>(pageContent, pageable, courses.size());
                }
            }

            // Map courses to response DTOs with lock status and enrollment info
            List<CourseResponse> courseResponses = coursePage.getContent().stream()
                .map(course -> {
                    CourseResponse response = new CourseResponse(course);
                    response.setComponentCount(course.getComponents().size());

                    // Set isLocked based on domain access
                    boolean hasAccess = userDomainIds.contains(course.getDomain().getId());
                    response.setIsLocked(!hasAccess);

                    // Set enrollment count
                    Long enrollmentCount = courseProgressRepository.countByCourseId(course.getId());
                    response.setEnrolledUsers(enrollmentCount != null ? enrollmentCount.intValue() : 0);

                    // Check if user is already enrolled
                    boolean isEnrolled = courseProgressRepository
                        .findByUserIdAndCourseId(currentUser.getId(), course.getId())
                        .isPresent();
                    response.setEnrollmentStatus(isEnrolled ? "enrolled" : "not_enrolled");
                    response.setCanEnroll(hasAccess && !isEnrolled);

                    return response;
                })
                .collect(Collectors.toList());

            // If sorting by popular, sort by enrolledUsers descending
            if ("popular".equals(sortBy)) {
                courseResponses.sort((a, b) ->
                    Integer.compare(
                        b.getEnrolledUsers() != null ? b.getEnrolledUsers() : 0,
                        a.getEnrolledUsers() != null ? a.getEnrolledUsers() : 0
                    ));
            }

            Map<String, Object> response = new HashMap<>();
            response.put("courses", courseResponses);
            response.put("pagination", Map.of(
                "page", page,
                "totalPages", coursePage.getTotalPages(),
                "totalItems", coursePage.getTotalElements(),
                "itemsPerPage", limit
            ));
            response.put("showingAll", showAll);
            response.put("sortBy", sortBy);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
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

            // Set enrollment count
            Long enrollmentCount = courseProgressRepository.countByCourseId(course.getId());
            response.setEnrolledUsers(enrollmentCount != null ? enrollmentCount.intValue() : 0);

            // Include enrollment status and lock status if authenticated
            if (authentication != null) {
                String currentUsername = authentication.getName();
                Users currentUser = userRepository.findByUsername(currentUsername)
                    .orElse(null);

                if (currentUser != null) {
                    // Check enrollment status
                    Optional<UserCourseProgress> enrollment = courseProgressRepository
                        .findByUserIdAndCourseId(currentUser.getId(), courseId);
                    boolean isEnrolled = enrollment.isPresent();
                    response.setEnrollmentStatus(isEnrolled ? "enrolled" : "not_enrolled");

                    // Check lock status based on domain access
                    Set<UUID> userDomainIds = currentUser.getDomains().stream()
                        .map(Domain::getId)
                        .collect(Collectors.toSet());
                    boolean hasAccess = userDomainIds.contains(course.getDomain().getId());
                    response.setIsLocked(!hasAccess);
                    response.setCanEnroll(hasAccess && !isEnrolled);
                }
            }

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(new MessageResponse("Course not found: " + e.getMessage()));
        }
    }

    /**
     * GET /api/v2/user/courses/recommended
     * Returns top N most popular courses (by enrollment count)
     */
    @GetMapping("/courses/recommended")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<?> getRecommendedCourses(
            @RequestParam(defaultValue = "5") int limit,
            Authentication authentication) {

        try {
            String currentUsername = authentication.getName();
            Users currentUser = userRepository.findByUsername(currentUsername)
                .orElseThrow(() -> new RuntimeException("User not found"));

            Set<UUID> userDomainIds = currentUser.getDomains().stream()
                .map(Domain::getId)
                .collect(Collectors.toSet());

            // Get all published courses
            List<Course> allCourses = courseRepository.findByStatus(CourseStatus.PUBLISHED);

            // Map to response with enrollment counts and sort by popularity
            List<CourseResponse> recommended = allCourses.stream()
                .map(course -> {
                    CourseResponse response = new CourseResponse(course);
                    response.setComponentCount(course.getComponents() != null ? course.getComponents().size() : 0);

                    Long enrollmentCount = courseProgressRepository.countByCourseId(course.getId());
                    response.setEnrolledUsers(enrollmentCount != null ? enrollmentCount.intValue() : 0);
                    response.setIsLocked(!userDomainIds.contains(course.getDomain().getId()));

                    boolean isEnrolled = courseProgressRepository
                        .findByUserIdAndCourseId(currentUser.getId(), course.getId())
                        .isPresent();
                    response.setEnrollmentStatus(isEnrolled ? "enrolled" : "not_enrolled");
                    response.setCanEnroll(!response.getIsLocked() && !isEnrolled);

                    return response;
                })
                .sorted((a, b) -> Integer.compare(
                    b.getEnrolledUsers() != null ? b.getEnrolledUsers() : 0,
                    a.getEnrolledUsers() != null ? a.getEnrolledUsers() : 0
                ))
                .limit(limit)
                .collect(Collectors.toList());

            return ResponseEntity.ok(Map.of(
                "courses", recommended,
                "total", recommended.size()
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new MessageResponse("Error fetching recommended courses: " + e.getMessage()));
        }
    }
}