package com.ehs.elearning.service;

import com.ehs.elearning.model.Course;
import com.ehs.elearning.model.CourseComponent;
import com.ehs.elearning.model.CourseComponent.ComponentType;
import com.ehs.elearning.repository.CourseComponentRepository;
import com.ehs.elearning.repository.CourseRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@Transactional
public class CourseComponentService {
    
    @Autowired
    private CourseComponentRepository componentRepository;
    
    @Autowired
    private CourseRepository courseRepository;
    
    // Add a component to a course
    public CourseComponent addComponent(UUID courseId, CourseComponent component) {
        Course course = courseRepository.findById(courseId)
            .orElseThrow(() -> new RuntimeException("Course not found"));
        
        // Only allow adding components to DRAFT courses
        if (course.getStatus() != Course.CourseStatus.DRAFT) {
            throw new RuntimeException("Cannot add components to published course");
        }
        
        // Set the order index if not provided
        if (component.getOrderIndex() == null) {
            int maxOrder = course.getComponents().stream()
                .mapToInt(CourseComponent::getOrderIndex)
                .max()
                .orElse(0);
            component.setOrderIndex(maxOrder + 1);
        }
        
        course.addComponent(component);
        return componentRepository.save(component);
    }
    
    // Update a component
    public CourseComponent updateComponent(UUID courseId, UUID componentId, CourseComponent updatedComponent) {
        Course course = courseRepository.findById(courseId)
            .orElseThrow(() -> new RuntimeException("Course not found"));
        
        // Only allow updating components in DRAFT courses
        if (course.getStatus() != Course.CourseStatus.DRAFT) {
            throw new RuntimeException("Cannot update components in published course");
        }
        
        CourseComponent existingComponent = componentRepository.findById(componentId)
            .orElseThrow(() -> new RuntimeException("Component not found"));
        
        // Verify component belongs to the course
        if (!existingComponent.getCourse().getId().equals(courseId)) {
            throw new RuntimeException("Component does not belong to this course");
        }
        
        existingComponent.setType(updatedComponent.getType());
        existingComponent.setRequired(updatedComponent.getRequired());
        existingComponent.setData(updatedComponent.getData());
        
        // Update order index if provided
        if (updatedComponent.getOrderIndex() != null) {
            existingComponent.setOrderIndex(updatedComponent.getOrderIndex());
        }
        
        return componentRepository.save(existingComponent);
    }
    
    // Delete a component
    public void deleteComponent(UUID courseId, UUID componentId) {
        Course course = courseRepository.findById(courseId)
            .orElseThrow(() -> new RuntimeException("Course not found"));
        
        // Only allow deleting components from DRAFT courses
        if (course.getStatus() != Course.CourseStatus.DRAFT) {
            throw new RuntimeException("Cannot delete components from published course");
        }
        
        CourseComponent component = componentRepository.findById(componentId)
            .orElseThrow(() -> new RuntimeException("Component not found"));
        
        // Verify component belongs to the course
        if (!component.getCourse().getId().equals(courseId)) {
            throw new RuntimeException("Component does not belong to this course");
        }
        
        course.removeComponent(component);
        componentRepository.delete(component);
        
        // Reorder remaining components
        reorderComponents(course);
    }
    
    // Reorder components
    public void reorderComponents(UUID courseId, List<Map<String, Object>> componentOrders) {
        Course course = courseRepository.findById(courseId)
            .orElseThrow(() -> new RuntimeException("Course not found"));
        
        // Only allow reordering components in DRAFT courses
        if (course.getStatus() != Course.CourseStatus.DRAFT) {
            throw new RuntimeException("Cannot reorder components in published course");
        }
        
        for (Map<String, Object> order : componentOrders) {
            UUID componentId = UUID.fromString(order.get("componentId").toString());
            Integer newOrder = (Integer) order.get("newOrder");
            
            CourseComponent component = componentRepository.findById(componentId)
                .orElseThrow(() -> new RuntimeException("Component not found"));
            
            // Verify component belongs to the course
            if (!component.getCourse().getId().equals(courseId)) {
                throw new RuntimeException("Component does not belong to this course");
            }
            
            component.setOrderIndex(newOrder);
            componentRepository.save(component);
        }
    }
    
    // Get components by course
    public List<CourseComponent> getComponentsByCourse(UUID courseId) {
        Course course = courseRepository.findById(courseId)
            .orElseThrow(() -> new RuntimeException("Course not found"));
        
        return componentRepository.findByCourseOrderByOrderIndex(course);
    }
    
    // Private helper method to reorder components after deletion
    private void reorderComponents(Course course) {
        List<CourseComponent> components = componentRepository.findByCourseOrderByOrderIndex(course);
        for (int i = 0; i < components.size(); i++) {
            components.get(i).setOrderIndex(i + 1);
            componentRepository.save(components.get(i));
        }
    }
}