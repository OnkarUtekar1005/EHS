package com.ehs.elearning.payload.response;

import java.util.List;
import java.util.Map;

public class DashboardResponse {
    
    private Integer inProgressCount;
    private Integer completedCount;
    private Integer totalModules;
    
    private List<Map<String, Object>> recentActivity;
    private List<Map<String, Object>> upcomingModules;
    
    private Map<String, Object> performanceSummary;
    
    // Constructors
    public DashboardResponse() {
    }
    
    // Getters and Setters
    public Integer getInProgressCount() {
        return inProgressCount;
    }

    public void setInProgressCount(Integer inProgressCount) {
        this.inProgressCount = inProgressCount;
    }

    public Integer getCompletedCount() {
        return completedCount;
    }

    public void setCompletedCount(Integer completedCount) {
        this.completedCount = completedCount;
    }

    public Integer getTotalModules() {
        return totalModules;
    }

    public void setTotalModules(Integer totalModules) {
        this.totalModules = totalModules;
    }

    public List<Map<String, Object>> getRecentActivity() {
        return recentActivity;
    }

    public void setRecentActivity(List<Map<String, Object>> recentActivity) {
        this.recentActivity = recentActivity;
    }

    public List<Map<String, Object>> getUpcomingModules() {
        return upcomingModules;
    }

    public void setUpcomingModules(List<Map<String, Object>> upcomingModules) {
        this.upcomingModules = upcomingModules;
    }

    public Map<String, Object> getPerformanceSummary() {
        return performanceSummary;
    }

    public void setPerformanceSummary(Map<String, Object> performanceSummary) {
        this.performanceSummary = performanceSummary;
    }
}