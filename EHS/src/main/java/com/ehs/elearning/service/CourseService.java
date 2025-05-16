package com.ehs.elearning.service;

import com.ehs.elearning.model.Course;
import com.ehs.elearning.model.Course.CourseStatus;
import com.ehs.elearning.model.CourseComponent;
import com.ehs.elearning.model.Domain;
import com.ehs.elearning.model.Users;
import com.ehs.elearning.repository.CourseComponentRepository;
import com.ehs.elearning.repository.CourseRepository;
import com.ehs.elearning.repository.DomainRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class CourseService {
    
    @Autowired
    private CourseRepository courseRepository;
    
    @Autowired
    private CourseComponentRepository componentRepository;
    
    @Autowired
    private DomainRepository domainRepository;
    
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
    public void deleteCourse(UUID courseId) {
        Course course = courseRepository.findById(courseId)
            .orElseThrow(() -> new RuntimeException("Course not found"));
        
        // Only allow deletion if course is in DRAFT status
        if (course.getStatus() != CourseStatus.DRAFT) {
            throw new RuntimeException("Cannot delete published course");
        }
        
        courseRepository.delete(course);
    }
    
    // Publish course
    public Course publishCourse(UUID courseId) {
        Course course = courseRepository.findByIdWithComponents(courseId)
            .orElseThrow(() -> new RuntimeException("Course not found"));
        
        // Validate course has at least one component
        if (course.getComponents().isEmpty()) {
            throw new RuntimeException("Cannot publish course without components");
        }
        
        course.publish();
        return courseRepository.save(course);
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