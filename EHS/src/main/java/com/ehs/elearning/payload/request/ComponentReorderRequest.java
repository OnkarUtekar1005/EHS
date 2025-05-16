package com.ehs.elearning.payload.request;

import jakarta.validation.constraints.NotEmpty;

import java.util.List;
import java.util.Map;

public class ComponentReorderRequest {
    
    @NotEmpty
    private List<Map<String, Object>> componentOrders;
    
    // Constructor
    public ComponentReorderRequest() {
    }
    
    public ComponentReorderRequest(List<Map<String, Object>> componentOrders) {
        this.componentOrders = componentOrders;
    }
    
    // Getter and Setter
    public List<Map<String, Object>> getComponentOrders() {
        return componentOrders;
    }
    
    public void setComponentOrders(List<Map<String, Object>> componentOrders) {
        this.componentOrders = componentOrders;
    }
}