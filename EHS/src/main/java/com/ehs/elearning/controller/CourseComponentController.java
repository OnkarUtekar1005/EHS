package com.ehs.elearning.controller;

import com.ehs.elearning.model.CourseComponent;
import com.ehs.elearning.model.CourseComponent.ComponentType;
import com.ehs.elearning.payload.response.MessageResponse;
import com.ehs.elearning.service.CourseComponentService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v2/admin/courses/{courseId}/components")
@PreAuthorize("hasRole('ADMIN')")
public class CourseComponentController {
    
    private static final Logger logger = LoggerFactory.getLogger(CourseComponentController.class);
    
    @Autowired
    private CourseComponentService componentService;
    
    // Get all components for a course
    @GetMapping
    public ResponseEntity<?> getComponents(@PathVariable UUID courseId) {
        try {
            List<CourseComponent> components = componentService.getComponentsByCourse(courseId);
            return ResponseEntity.ok(Map.of("components", components));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new MessageResponse("Error fetching components: " + e.getMessage()));
        }
    }
    
    // Add a new component to a course
    @PostMapping
    public ResponseEntity<?> addComponent(@PathVariable UUID courseId, @RequestBody Map<String, Object> componentData) {
        logger.info("Received component data: {}", componentData);
        
        try {
            // Create CourseComponent from the request data
            CourseComponent component = new CourseComponent();
            
            // Set type
            String typeStr = (String) componentData.get("type");
            if (typeStr == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new MessageResponse("Component type is required"));
            }
            component.setType(ComponentType.valueOf(typeStr));
            
            // Set required
            Boolean required = (Boolean) componentData.get("required");
            component.setRequired(required != null ? required : false);
            
            // Set orderIndex if provided
            Integer orderIndex = null;
            if (componentData.get("orderIndex") != null) {
                Number orderNum = (Number) componentData.get("orderIndex");
                orderIndex = orderNum != null ? orderNum.intValue() : null;
            }
            component.setOrderIndex(orderIndex);
            
            // Set data
            @SuppressWarnings("unchecked")
            Map<String, Object> data = (Map<String, Object>) componentData.get("data");
            if (data == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new MessageResponse("Component data is required"));
            }
            component.setData(data);
            
            // Validate data based on component type
            if (!validateComponentData(component)) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new MessageResponse("Invalid component data for type: " + component.getType()));
            }
            
            CourseComponent savedComponent = componentService.addComponent(courseId, component);
            return ResponseEntity.ok(savedComponent);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new MessageResponse("Error adding component: " + e.getMessage()));
        }
    }
    
    // Update a component
    @PutMapping("/{componentId}")
    public ResponseEntity<?> updateComponent(
            @PathVariable UUID courseId, 
            @PathVariable UUID componentId, 
            @RequestBody Map<String, Object> componentData) {
        try {
            // Get existing component
            CourseComponent existingComponent = componentService.getComponentsByCourse(courseId).stream()
                .filter(c -> c.getId().equals(componentId))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Component not found"));
            
            // Update type if provided
            String typeStr = (String) componentData.get("type");
            if (typeStr != null) {
                existingComponent.setType(ComponentType.valueOf(typeStr));
            }
            
            // Update required if provided
            Boolean required = (Boolean) componentData.get("required");
            if (required != null) {
                existingComponent.setRequired(required);
            }
            
            // Update data
            @SuppressWarnings("unchecked")
            Map<String, Object> data = (Map<String, Object>) componentData.get("data");
            if (data != null) {
                existingComponent.setData(data);
            }
            
            // Validate component data
            if (!validateComponentData(existingComponent)) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new MessageResponse("Invalid component data for type: " + existingComponent.getType()));
            }
            
            CourseComponent updatedComponent = componentService.updateComponent(courseId, componentId, existingComponent);
            return ResponseEntity.ok(updatedComponent);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new MessageResponse("Error updating component: " + e.getMessage()));
        }
    }
    
    // Delete a component
    @DeleteMapping("/{componentId}")
    public ResponseEntity<?> deleteComponent(@PathVariable UUID courseId, @PathVariable UUID componentId) {
        try {
            componentService.deleteComponent(courseId, componentId);
            return ResponseEntity.ok(new MessageResponse("Component deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new MessageResponse("Error deleting component: " + e.getMessage()));
        }
    }
    
    // Reorder components
    @PutMapping("/reorder")
    public ResponseEntity<?> reorderComponents(
            @PathVariable UUID courseId, 
            @RequestBody Map<String, Object> reorderRequest) {
        try {
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> componentOrders = 
                (List<Map<String, Object>>) reorderRequest.get("componentOrders");
            
            if (componentOrders == null || componentOrders.isEmpty()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new MessageResponse("Component orders are required"));
            }
            
            componentService.reorderComponents(courseId, componentOrders);
            return ResponseEntity.ok(new MessageResponse("Components reordered successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new MessageResponse("Error reordering components: " + e.getMessage()));
        }
    }
    
    // Private helper method to validate component data
    private boolean validateComponentData(CourseComponent component) {
        if (component.getData() == null) {
            return false;
        }
        
        Map<String, Object> data = component.getData();
        
        switch (component.getType()) {
            case PRE_ASSESSMENT:
            case POST_ASSESSMENT:
                // Validate assessment data
                return data.containsKey("title") &&
                       data.containsKey("questions") && 
                       data.get("questions") instanceof List &&
                       !((List<?>) data.get("questions")).isEmpty();
                
            case MATERIAL:
                // Validate material data
                return data.containsKey("title") && 
                       (data.containsKey("materialId") || data.containsKey("materialUrl"));
                
            default:
                return false;
        }
    }
}