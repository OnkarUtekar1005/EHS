package com.ehs.elearning.service;

import com.ehs.elearning.model.*;
import com.ehs.elearning.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import com.ehs.elearning.service.CertificateService;

@Service
@Transactional
public class ProgressService {
    
    @Autowired
    private UserCourseProgressRepository courseProgressRepository;
    
    @Autowired
    private ComponentProgressRepository componentProgressRepository;
    
    @Autowired
    private CourseRepository courseRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private CourseComponentRepository componentRepository;
    
    @Autowired
    private CertificateService certificateService;
    
    // Constants for component weights
    private static final BigDecimal PRE_ASSESSMENT_WEIGHT = new BigDecimal("20");
    private static final BigDecimal MATERIAL_WEIGHT = new BigDecimal("50");
    private static final BigDecimal POST_ASSESSMENT_WEIGHT = new BigDecimal("30");
    
    /**
     * Enroll a user in a course
     */
    @Transactional
    public UserCourseProgress enrollInCourse(UUID userId, UUID courseId) {
        // Check if already enrolled
        Optional<UserCourseProgress> existingProgress = courseProgressRepository
            .findByUserIdAndCourseId(userId, courseId);
            
        if (existingProgress.isPresent()) {
            // Ensure all component progress entries exist
            ensureAllComponentProgressExists(userId, courseId);
            return existingProgress.get();
        }
        
        // Get user and course
        Users user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));
        Course course = courseRepository.findById(courseId)
            .orElseThrow(() -> new RuntimeException("Course not found"));
            
        // Check if course is published
        if (course.getStatus() != Course.CourseStatus.PUBLISHED) {
            throw new RuntimeException("Cannot enroll in unpublished course");
        }
        
        // Create enrollment
        UserCourseProgress progress = new UserCourseProgress(user, course);
        progress = courseProgressRepository.save(progress);
        
        // Initialize component progress for each course component
        for (CourseComponent component : course.getComponents()) {
            // Check if component progress already exists before creating
            Optional<ComponentProgress> existingComponentProgress = componentProgressRepository
                .findByUserIdAndComponentId(userId, component.getId());
            
            if (!existingComponentProgress.isPresent()) {
                ComponentProgress componentProgress = new ComponentProgress(user, component, course);
                componentProgressRepository.save(componentProgress);
            }
        }
        
        return progress;
    }
    
    /**
     * Start a course (mark as in progress)
     */
    public UserCourseProgress startCourse(UUID userId, UUID courseId) {
        UserCourseProgress progress = courseProgressRepository
            .findByUserIdAndCourseId(userId, courseId)
            .orElseThrow(() -> new RuntimeException("Course progress not found"));
            
        if (progress.getStatus() == ProgressStatus.ENROLLED) {
            progress.setStatus(ProgressStatus.IN_PROGRESS);
            progress.setStartedDate(LocalDateTime.now());
            progress = courseProgressRepository.save(progress);
        }
        
        return progress;
    }
    
    /**
     * Start a component
     */
    @Transactional
    public ComponentProgress startComponent(UUID userId, UUID componentId) {
        ComponentProgress progress = componentProgressRepository
            .findByUserIdAndComponentId(userId, componentId)
            .orElseGet(() -> {
                // If component progress doesn't exist, create it
                CourseComponent component = componentRepository.findById(componentId)
                    .orElseThrow(() -> new RuntimeException("Component not found"));
                Users user = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("User not found"));
                
                // First ensure user is enrolled in the course
                enrollInCourse(userId, component.getCourse().getId());
                
                // Try to find the progress again after enrollment
                return componentProgressRepository
                    .findByUserIdAndComponentId(userId, componentId)
                    .orElseThrow(() -> new RuntimeException("Failed to create component progress"));
            });
            
        // Mark component as started
        progress.markAsStarted();
        
        // Update course progress if needed
        if (progress.getCourse() != null) {
            startCourse(userId, progress.getCourse().getId());
        }
        
        return componentProgressRepository.save(progress);
    }
    
    /**
     * Update component progress (for materials)
     */
    public ComponentProgress updateComponentProgress(UUID userId, UUID componentId, BigDecimal progressPercentage) {
        ComponentProgress progress = componentProgressRepository
            .findByUserIdAndComponentId(userId, componentId)
            .orElseThrow(() -> new RuntimeException("Component progress not found"));
            
        progress.setProgressPercentage(progressPercentage);
        progress.setLastAccessedAt(LocalDateTime.now());
        
        if (progressPercentage.compareTo(new BigDecimal("100")) >= 0) {
            progress.markAsCompleted();
        }
        
        progress = componentProgressRepository.save(progress);
        
        // Update overall course progress
        updateCourseProgress(userId, progress.getCourse().getId());
        
        return progress;
    }
    
    /**
     * Complete a component
     */
    public ComponentProgress completeComponent(UUID userId, UUID componentId, Integer score) {
        ComponentProgress progress = componentProgressRepository
            .findByUserIdAndComponentId(userId, componentId)
            .orElseThrow(() -> new RuntimeException("Component progress not found"));
            
        progress.markAsCompleted();
        
        if (score != null) {
            progress.setScore(score);
        }
        
        progress = componentProgressRepository.save(progress);
        
        // Update overall course progress
        updateCourseProgress(userId, progress.getCourse().getId());
        
        return progress;
    }
    
    /**
     * Update time spent on a component
     */
    public ComponentProgress updateTimeSpent(UUID userId, UUID componentId, Long additionalSeconds) {
        ComponentProgress progress = componentProgressRepository
            .findByUserIdAndComponentId(userId, componentId)
            .orElseThrow(() -> new RuntimeException("Component progress not found"));
            
        Long currentTime = progress.getTimeSpentSeconds();
        progress.setTimeSpentSeconds(currentTime + additionalSeconds);
        progress.setLastAccessedAt(LocalDateTime.now());
        
        return componentProgressRepository.save(progress);
    }
    
    /**
     * Get course progress
     */
    public UserCourseProgress getCourseProgress(UUID userId, UUID courseId) {
        return courseProgressRepository
            .findByUserIdAndCourseId(userId, courseId)
            .orElse(null);
    }
    
    /**
     * Get component progress
     */
    public ComponentProgress getComponentProgress(UUID userId, UUID componentId) {
        return componentProgressRepository
            .findByUserIdAndComponentId(userId, componentId)
            .orElse(null);
    }
    
    /**
     * Get all component progress for a course
     */
    public List<ComponentProgress> getCourseComponentProgress(UUID userId, UUID courseId) {
        return componentProgressRepository
            .findByUserIdAndCourseIdOrdered(userId, courseId);
    }
    
    /**
     * Calculate and update overall course progress
     */
    private void updateCourseProgress(UUID userId, UUID courseId) {
        UserCourseProgress courseProgress = courseProgressRepository
            .findByUserIdAndCourseId(userId, courseId)
            .orElseThrow(() -> new RuntimeException("Course progress not found"));
            
        List<ComponentProgress> componentProgresses = componentProgressRepository
            .findByUserIdAndCourseId(userId, courseId);
            
        // Calculate overall progress
        BigDecimal totalWeight = BigDecimal.ZERO;
        BigDecimal weightedProgress = BigDecimal.ZERO;
        int completedComponents = 0;
        int totalComponents = componentProgresses.size();
        
        for (ComponentProgress cp : componentProgresses) {
            CourseComponent component = cp.getComponent();
            BigDecimal weight = getComponentWeight(component.getType());
            totalWeight = totalWeight.add(weight);
            
            if (cp.getStatus() == ComponentProgressStatus.COMPLETED) {
                weightedProgress = weightedProgress.add(weight);
                completedComponents++;
            } else if (cp.getStatus() == ComponentProgressStatus.IN_PROGRESS) {
                // For in-progress components, add partial weight based on progress percentage
                BigDecimal partialWeight = weight.multiply(cp.getProgressPercentage())
                    .divide(new BigDecimal("100"), 2, RoundingMode.HALF_UP);
                weightedProgress = weightedProgress.add(partialWeight);
            }
        }
        
        // Calculate overall percentage
        BigDecimal overallProgress = BigDecimal.ZERO;
        if (totalWeight.compareTo(BigDecimal.ZERO) > 0) {
            overallProgress = weightedProgress.multiply(new BigDecimal("100"))
                .divide(totalWeight, 2, RoundingMode.HALF_UP);
        }
        
        courseProgress.setOverallProgress(overallProgress);
        
        // Update status based on progress
        if (overallProgress.compareTo(new BigDecimal("100")) >= 0) {
            courseProgress.setStatus(ProgressStatus.COMPLETED);
            courseProgress.setCompletedDate(LocalDateTime.now());
            
            // Generate certificate on course completion
            try {
                certificateService.generateCertificate(userId, courseId);
            } catch (Exception e) {
                // Log the error but don't fail the progress update
                System.err.println("Failed to generate certificate: " + e.getMessage());
            }
        } else if (overallProgress.compareTo(BigDecimal.ZERO) > 0) {
            courseProgress.setStatus(ProgressStatus.IN_PROGRESS);
            if (courseProgress.getStartedDate() == null) {
                courseProgress.setStartedDate(LocalDateTime.now());
            }
        }
        
        courseProgressRepository.save(courseProgress);
    }
    
    /**
     * Get component weight based on type
     */
    private BigDecimal getComponentWeight(CourseComponent.ComponentType type) {
        switch (type) {
            case PRE_ASSESSMENT:
                return PRE_ASSESSMENT_WEIGHT;
            case MATERIAL:
                return MATERIAL_WEIGHT;
            case POST_ASSESSMENT:
                return POST_ASSESSMENT_WEIGHT;
            default:
                return BigDecimal.ZERO;
        }
    }
    
    /**
     * Check if user can access a component
     */
    public boolean canAccessComponent(UUID userId, UUID componentId) {
        ComponentProgress progress = componentProgressRepository
            .findByUserIdAndComponentId(userId, componentId)
            .orElse(null);
            
        if (progress == null) {
            // Try to check if user is enrolled in the course
            CourseComponent component = componentRepository.findById(componentId)
                .orElse(null);
            if (component == null) {
                return false;
            }
            
            UserCourseProgress courseProgress = courseProgressRepository
                .findByUserIdAndCourseId(userId, component.getCourse().getId())
                .orElse(null);
            
            if (courseProgress == null) {
                return false;
            }
            
            // If user is enrolled but component progress doesn't exist, create it
            ensureComponentProgressExists(userId, componentId);
            
            progress = componentProgressRepository
                .findByUserIdAndComponentId(userId, componentId)
                .orElse(null);
                
            if (progress == null) {
                return false;
            }
        }
        
        CourseComponent component = progress.getComponent();
        
        // For pre-assessment, always accessible
        if (component.getType() == CourseComponent.ComponentType.PRE_ASSESSMENT) {
            return true;
        }
        
        // For other components, check if previous components are completed
        List<ComponentProgress> allProgress = componentProgressRepository
            .findByUserIdAndCourseIdOrdered(userId, progress.getCourse().getId());
            
        for (ComponentProgress cp : allProgress) {
            if (cp.getComponent().getOrderIndex() < component.getOrderIndex()) {
                // Check if required components are completed
                if (cp.getComponent().getRequired() && 
                    cp.getStatus() != ComponentProgressStatus.COMPLETED) {
                    return false;
                }
            }
        }
        
        return true;
    }
    
    /**
     * Get user's enrolled courses
     */
    public List<UserCourseProgress> getUserEnrolledCourses(UUID userId) {
        return courseProgressRepository.findByUserId(userId);
    }
    
    /**
     * Get user's courses by status
     */
    public List<UserCourseProgress> getUserCoursesByStatus(UUID userId, ProgressStatus status) {
        return courseProgressRepository.findByUserIdAndStatus(userId, status);
    }
    
    /**
     * Check if course is completed
     */
    public boolean isCourseCompleted(UUID userId, UUID courseId) {
        UserCourseProgress progress = getCourseProgress(userId, courseId);
        return progress != null && progress.getStatus() == ProgressStatus.COMPLETED;
    }
    
    /**
     * Ensure all component progress entries exist for a user's enrolled course
     */
    private void ensureAllComponentProgressExists(UUID userId, UUID courseId) {
        Users user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));
        Course course = courseRepository.findById(courseId)
            .orElseThrow(() -> new RuntimeException("Course not found"));
        
        for (CourseComponent component : course.getComponents()) {
            Optional<ComponentProgress> existingProgress = componentProgressRepository
                .findByUserIdAndComponentId(userId, component.getId());
            
            if (!existingProgress.isPresent()) {
                ComponentProgress componentProgress = new ComponentProgress(user, component, course);
                componentProgressRepository.save(componentProgress);
            }
        }
    }
    
    /**
     * Ensure component progress exists for a specific component
     * This is needed to handle race conditions during enrollment
     */
    @Transactional
    public void ensureComponentProgressExists(UUID userId, UUID componentId) {
        Optional<ComponentProgress> existingProgress = componentProgressRepository
            .findByUserIdAndComponentId(userId, componentId);
            
        if (!existingProgress.isPresent()) {
            Users user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
            CourseComponent component = componentRepository.findById(componentId)
                .orElseThrow(() -> new RuntimeException("Component not found"));
            Course course = component.getCourse();
            
            // Check if user is enrolled in the course
            Optional<UserCourseProgress> courseProgress = courseProgressRepository
                .findByUserIdAndCourseId(userId, course.getId());
                
            if (!courseProgress.isPresent()) {
                // User is not enrolled, enroll them first
                enrollInCourse(userId, course.getId());
            } else {
                // Create just this component's progress
                ComponentProgress componentProgress = new ComponentProgress(user, component, course);
                componentProgressRepository.save(componentProgress);
            }
        }
    }
}