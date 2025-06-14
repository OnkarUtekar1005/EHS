package com.ehs.elearning.service;

import com.ehs.elearning.model.Course;
import com.ehs.elearning.model.Course.CourseStatus;
import com.ehs.elearning.model.CourseComponent;
import com.ehs.elearning.model.Domain;
import com.ehs.elearning.model.Users;
import com.ehs.elearning.model.AssessmentAttempt;
import com.ehs.elearning.model.ComponentProgress;
import com.ehs.elearning.repository.CourseComponentRepository;
import com.ehs.elearning.repository.CourseRepository;
import com.ehs.elearning.repository.DomainRepository;
import com.ehs.elearning.repository.AssessmentAttemptRepository;
import com.ehs.elearning.repository.ComponentProgressRepository;
import com.ehs.elearning.repository.CertificateRepository;
import com.ehs.elearning.repository.UserCourseProgressRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.annotation.Propagation;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Transactional
public class CourseService {
    
    private static final Logger logger = LoggerFactory.getLogger(CourseService.class);
    
    @Autowired
    private CourseRepository courseRepository;
    
    @Autowired
    private CourseComponentRepository componentRepository;
    
    @Autowired
    private DomainRepository domainRepository;
    
    @Autowired
    private AssessmentAttemptRepository assessmentAttemptRepository;
    
    @Autowired
    private ComponentProgressRepository componentProgressRepository;
    
    @Autowired
    private CertificateRepository certificateRepository;
    
    @Autowired
    private UserCourseProgressRepository userCourseProgressRepository;
    
    @PersistenceContext
    private EntityManager entityManager;
    
    // Create a new course
    public Course createCourse(Course course, Users creator) {
        course.setCreatedBy(creator);
        course.setStatus(CourseStatus.DRAFT);
        return courseRepository.save(course);
    }
    
    // Update course
    public Course updateCourse(UUID courseId, Course updatedCourse) {
        Course existingCourse = courseRepository.findById(courseId)
            .orElseThrow(() -> new RuntimeException("Course not found"));
        
        // Only allow updates if course is in DRAFT status
        if (existingCourse.getStatus() != CourseStatus.DRAFT) {
            throw new RuntimeException("Cannot update published course");
        }
        
        existingCourse.setTitle(updatedCourse.getTitle());
        existingCourse.setDescription(updatedCourse.getDescription());
        existingCourse.setDomain(updatedCourse.getDomain());
        existingCourse.setIcon(updatedCourse.getIcon());
        existingCourse.setTimeLimit(updatedCourse.getTimeLimit());
        existingCourse.setPassingScore(updatedCourse.getPassingScore());
        
        return courseRepository.save(existingCourse);
    }
    
    // Publish course
    public Course publishCourse(UUID courseId) {
        logger.info("Attempting to publish course with ID: {}", courseId);
        
        Course course = courseRepository.findByIdWithComponents(courseId)
            .orElseThrow(() -> new RuntimeException("Course not found"));
        
        logger.info("Found course: {}, status: {}, hasBeenPublished: {}", 
            course.getTitle(), course.getStatus(), course.getHasBeenPublished());
        
        // Validate course has at least one component - TEMPORARILY DISABLED FOR TESTING
        // if (course.getComponents().isEmpty()) {
        //     throw new RuntimeException("Cannot publish course without components");
        // }
        
        course.publish();
        logger.info("Course publish method called, new status: {}", course.getStatus());
        
        try {
            Course savedCourse = courseRepository.save(course);
            logger.info("Course saved successfully");
            return savedCourse;
        } catch (Exception e) {
            logger.error("Error saving course during publish", e);
            throw new RuntimeException("Failed to save course: " + e.getMessage(), e);
        }
    }
    
    // Take down course
    public Course takeDownCourse(UUID courseId) {
        Course course = courseRepository.findById(courseId)
            .orElseThrow(() -> new RuntimeException("Course not found"));
        
        course.takeDown();
        return courseRepository.save(course);
    }
    
    // Clone course
    public Course cloneCourse(UUID courseId, Users creator) {
        Course originalCourse = courseRepository.findByIdWithComponents(courseId)
            .orElseThrow(() -> new RuntimeException("Course not found"));
        
        // Create new course with copied properties
        Course clonedCourse = new Course();
        clonedCourse.setTitle(originalCourse.getTitle() + " (Copy)");
        clonedCourse.setDescription(originalCourse.getDescription());
        clonedCourse.setDomain(originalCourse.getDomain());
        clonedCourse.setIcon(originalCourse.getIcon());
        clonedCourse.setTimeLimit(originalCourse.getTimeLimit());
        clonedCourse.setPassingScore(originalCourse.getPassingScore());
        clonedCourse.setCreatedBy(creator);
        clonedCourse.setStatus(CourseStatus.DRAFT);
        
        Course savedClone = courseRepository.save(clonedCourse);
        
        // Clone components
        for (CourseComponent originalComponent : originalCourse.getComponents()) {
            CourseComponent clonedComponent = new CourseComponent();
            clonedComponent.setCourse(savedClone);
            clonedComponent.setType(originalComponent.getType());
            clonedComponent.setOrderIndex(originalComponent.getOrderIndex());
            clonedComponent.setRequired(originalComponent.getRequired());
            clonedComponent.setData(originalComponent.getData());
            
            componentRepository.save(clonedComponent);
        }
        
        return savedClone;
    }
    
    
    // Get course with components
    public Course getCourseWithComponents(UUID courseId) {
        return courseRepository.findByIdWithComponents(courseId)
            .orElseThrow(() -> new RuntimeException("Course not found"));
    }
    
    // Check if course title is unique
    public boolean isTitleUnique(String title, UUID excludeId) {
        if (excludeId == null) {
            return !courseRepository.existsByTitle(title);
        }
        return !courseRepository.existsByTitleAndIdNot(title, excludeId);
    }
    
    // Get all courses without pagination
    public List<Course> getAllCourses() {
        return courseRepository.findAll();
    }
    
    // Search courses with optional filters
    public Page<Course> searchCourses(String search, UUID domainId, CourseStatus status, Pageable pageable) {
        if (search != null && !search.trim().isEmpty()) {
            // Search by title or description
            if (domainId != null && status != null) {
                return courseRepository.findByTitleContainingIgnoreCaseOrDescriptionContainingIgnoreCaseAndDomainIdAndStatus(
                    search.trim(), search.trim(), domainId, status, pageable);
            } else if (domainId != null) {
                return courseRepository.findByTitleContainingIgnoreCaseOrDescriptionContainingIgnoreCaseAndDomainId(
                    search.trim(), search.trim(), domainId, pageable);
            } else if (status != null) {
                return courseRepository.findByTitleContainingIgnoreCaseOrDescriptionContainingIgnoreCaseAndStatus(
                    search.trim(), search.trim(), status, pageable);
            } else {
                return courseRepository.findByTitleContainingIgnoreCaseOrDescriptionContainingIgnoreCase(
                    search.trim(), search.trim(), pageable);
            }
        } else {
            // No search term
            if (domainId != null && status != null) {
                return courseRepository.findByDomainIdAndStatus(domainId, status, pageable);
            } else if (domainId != null) {
                return courseRepository.findByDomainId(domainId, pageable);
            } else if (status != null) {
                return courseRepository.findByStatus(status, pageable);
            } else {
                return courseRepository.findAll(pageable);
            }
        }
    }
    
    // Get course count
    public long getCourseCount() {
        return courseRepository.count();
    }
    
    // Get first course for debugging
    public Course getFirstCourse() {
        return courseRepository.findAll().stream().findFirst().orElse(null);
    }
    
    // Delete a course and all related data
    @Transactional
    public void deleteCourse(UUID courseId) {
        logger.info("Starting deletion of course: " + courseId);
        
        // Use the method that loads components eagerly
        Course course = courseRepository.findByIdWithComponents(courseId)
            .orElseThrow(() -> new RuntimeException("Course not found"));
        
        // Check if course is taken down
        if (course.getStatus() != CourseStatus.DRAFT) {
            throw new RuntimeException("Course must be taken down before deletion. Current status: " + course.getStatus());
        }
        
        try {
            // 1. Delete all certificates for this course
            logger.info("Deleting certificates for course: " + courseId);
            certificateRepository.deleteByCourseId(courseId);
            
            // 2. Delete all assessment attempts for this course's components
            logger.info("Deleting assessment attempts for course: " + courseId);
            List<CourseComponent> components = course.getComponents();
            if (!components.isEmpty()) {
                List<UUID> componentIds = components.stream()
                    .map(CourseComponent::getId)
                    .collect(Collectors.toList());
                assessmentAttemptRepository.deleteByComponentIds(componentIds);
            }
            
            // 3. Delete all component progress records
            logger.info("Deleting component progress for course: " + courseId);
            componentProgressRepository.findByCourseId(courseId)
                .forEach(progress -> componentProgressRepository.delete(progress));
            
            // 4. Delete all user course progress records
            logger.info("Deleting user course progress for course: " + courseId);
            userCourseProgressRepository.findByCourseId(courseId)
                .forEach(progress -> userCourseProgressRepository.delete(progress));
            
            // 5. Delete all course components
            logger.info("Deleting course components for course: " + courseId);
            componentRepository.deleteAll(components);
            
            // 6. Finally delete the course itself
            logger.info("Deleting course: " + courseId);
            courseRepository.delete(course);
            
            logger.info("Successfully deleted course: " + courseId);
        } catch (Exception e) {
            logger.error("Error deleting course: " + e.getMessage(), e);
            throw new RuntimeException("Failed to delete course: " + e.getMessage());
        }
    }
}