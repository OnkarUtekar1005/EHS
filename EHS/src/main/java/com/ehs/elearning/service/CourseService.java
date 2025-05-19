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
    
    // Delete course
    @Transactional(propagation = Propagation.REQUIRED)
    public void deleteCourse(UUID courseId) {
        logger.info("Starting deletion of course: {}", courseId);
        
        // Verify course exists
        if (!courseRepository.existsById(courseId)) {
            throw new RuntimeException("Course not found");
        }
        
        try {
            // Delete all related data using native SQL to avoid JPA cascade issues
            
            // 1. Delete assessment attempts
            int deletedAttempts = entityManager.createNativeQuery(
                "DELETE FROM assessment_attempts WHERE component_id IN " +
                "(SELECT id FROM course_components WHERE course_id = :courseId)")
                .setParameter("courseId", courseId)
                .executeUpdate();
            logger.info("Deleted {} assessment attempts", deletedAttempts);
            
            // 2. Delete component progress
            int deletedProgress = entityManager.createNativeQuery(
                "DELETE FROM component_progress WHERE component_id IN " +
                "(SELECT id FROM course_components WHERE course_id = :courseId)")
                .setParameter("courseId", courseId)
                .executeUpdate();
            logger.info("Deleted {} component progress records", deletedProgress);
            
            // 3. Delete user course progress if it exists
            try {
                int deletedUserProgress = entityManager.createNativeQuery(
                    "DELETE FROM user_course_progress WHERE course_id = :courseId")
                    .setParameter("courseId", courseId)
                    .executeUpdate();
                logger.info("Deleted {} user course progress records", deletedUserProgress);
            } catch (Exception e) {
                logger.debug("No user_course_progress to delete");
            }
            
            // 4. Delete course components
            int deletedComponents = entityManager.createNativeQuery(
                "DELETE FROM course_components WHERE course_id = :courseId")
                .setParameter("courseId", courseId)
                .executeUpdate();
            logger.info("Deleted {} course components", deletedComponents);
            
            // 5. Finally delete the course
            int deletedCourses = entityManager.createNativeQuery(
                "DELETE FROM courses WHERE id = :courseId")
                .setParameter("courseId", courseId)
                .executeUpdate();
            logger.info("Deleted {} courses", deletedCourses);
            
            // Clear persistence context to avoid any cached entities
            entityManager.clear();
            
        } catch (Exception e) {
            logger.error("Error during course deletion: ", e);
            throw new RuntimeException("Failed to delete course: " + e.getMessage(), e);
        }
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
    
    // Search courses with filters - SIMPLIFIED VERSION
    public Page<Course> searchCourses(String search, UUID domainId, CourseStatus status, Pageable pageable) {
        // For now, implement a simple filtering logic without complex queries
        if (domainId != null && status != null) {
            return courseRepository.findByDomainIdAndStatus(domainId, status, pageable);
        } else if (domainId != null) {
            return courseRepository.findByDomainId(domainId, pageable);
        } else if (status != null) {
            return courseRepository.findByStatus(status, pageable);
        } else {
            return courseRepository.findAll(pageable);
        }
        
        // TODO: Implement search functionality later
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
    
    // Get course count
    public long getCourseCount() {
        return courseRepository.count();
    }
    
    // Get first course for debugging
    public Course getFirstCourse() {
        return courseRepository.findAll().stream().findFirst().orElse(null);
    }
}