package com.ehs.elearning.service;

import com.ehs.elearning.model.*;
import com.ehs.elearning.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Service for generating user learning reports and statistics
 * This service aggregates data from multiple repositories to provide
 * comprehensive learning analytics for the authenticated user.
 */
@Service
@Transactional(readOnly = true)
public class UserReportService {

    @Autowired
    private UserCourseProgressRepository courseProgressRepository;
    
    @Autowired
    private ComponentProgressRepository componentProgressRepository;
    
    @Autowired
    private AssessmentAttemptRepository assessmentAttemptRepository;
    
    @Autowired
    private CertificateRepository certificateRepository;
    
    /**
     * Retrieves a complete learning report for a specific user
     * 
     * @param userId The ID of the user
     * @return Map containing all report data including summary metrics, course progress, 
     *         assessment stats, and chart data
     */
    public Map<String, Object> getUserReport(UUID userId) {
        Map<String, Object> report = new HashMap<>();
        
        // Add summary section
        Map<String, Object> summary = getSummaryMetrics(userId);
        report.put("summary", summary);
        
        // Add courses section
        List<Map<String, Object>> courses = getCourseProgressDetails(userId);
        report.put("courses", courses);
        
        // Add assessments section
        List<Map<String, Object>> assessments = getAssessmentStats(userId);
        report.put("assessments", assessments);
        
        // Add charts section
        Map<String, Object> charts = getChartData(userId);
        report.put("charts", charts);
        
        return report;
    }
    
    /**
     * Calculates summary metrics for a user's learning progress
     * 
     * @param userId The ID of the user
     * @return Map containing key metrics like coursesEnrolled, coursesCompleted, etc.
     */
    private Map<String, Object> getSummaryMetrics(UUID userId) {
        // Get user's course progress data
        List<UserCourseProgress> courseProgresses = courseProgressRepository.findByUserId(userId);
        
        // Total courses enrolled
        int coursesEnrolled = courseProgresses.size();
        
        // Total courses completed
        long coursesCompleted = courseProgresses.stream()
            .filter(cp -> cp.getStatus() == ProgressStatus.COMPLETED)
            .count();
        
        // Get assessment attempts for average score calculation
        List<AssessmentAttempt> assessmentAttempts = assessmentAttemptRepository.findByUserIdOrderByStartedAtDesc(userId);
        
        // Calculate average assessment score
        OptionalDouble avgScore = assessmentAttempts.stream()
            .filter(a -> a.getScore() != null)
            .mapToDouble(a -> a.getScore().doubleValue())
            .average();
        
        BigDecimal averageScore = avgScore.isPresent() 
            ? new BigDecimal(avgScore.getAsDouble()).setScale(2, RoundingMode.HALF_UP) 
            : BigDecimal.ZERO;
        
        // Calculate total time spent learning
        List<ComponentProgress> componentProgresses = componentProgressRepository.findByUserIdAndStatus(userId, ComponentProgressStatus.COMPLETED);
        
        long totalTimeSpentSeconds = componentProgresses.stream()
            .mapToLong(cp -> cp.getTimeSpentSeconds() != null ? cp.getTimeSpentSeconds() : 0)
            .sum();
        
        // Format time spent
        String totalTimeSpent = formatTimeSpent(totalTimeSpentSeconds);
        
        // Compile summary metrics
        Map<String, Object> summary = new HashMap<>();
        summary.put("coursesEnrolled", coursesEnrolled);
        summary.put("coursesCompleted", coursesCompleted);
        summary.put("averageScore", averageScore);
        summary.put("totalTimeSpent", totalTimeSpent);
        
        return summary;
    }
    
    /**
     * Gets detailed progress information for all courses the user is enrolled in
     * 
     * @param userId The ID of the user
     * @return List of maps containing per-course progress details
     */
    private List<Map<String, Object>> getCourseProgressDetails(UUID userId) {
        List<UserCourseProgress> courseProgresses = courseProgressRepository.findByUserId(userId);
        List<Map<String, Object>> courseDetails = new ArrayList<>();
        
        for (UserCourseProgress progress : courseProgresses) {
            Map<String, Object> courseDetail = new HashMap<>();
            Course course = progress.getCourse();
            
            // Basic course information
            courseDetail.put("courseName", course.getTitle());
            courseDetail.put("progress", progress.getOverallProgress());
            courseDetail.put("enrolledDate", progress.getEnrollmentDate());
            
            // Get last accessed date from component progresses
            List<ComponentProgress> componentProgresses = componentProgressRepository.findByUserIdAndCourseId(userId, course.getId());
            Optional<LocalDateTime> lastAccessedDate = componentProgresses.stream()
                .map(ComponentProgress::getLastAccessedAt)
                .filter(Objects::nonNull)
                .max(LocalDateTime::compareTo);
            
            courseDetail.put("lastAccessed", lastAccessedDate.orElse(null));
            
            // Get pre/post assessment scores
            Map<String, Integer> assessmentScores = new HashMap<>();
            
            for (ComponentProgress componentProgress : componentProgresses) {
                CourseComponent component = componentProgress.getComponent();
                if (component.getType() == CourseComponent.ComponentType.PRE_ASSESSMENT) {
                    courseDetail.put("preAssessmentScore", componentProgress.getScore());
                } else if (component.getType() == CourseComponent.ComponentType.POST_ASSESSMENT) {
                    courseDetail.put("postAssessmentScore", componentProgress.getScore());
                }
            }
            
            // Certificate information
            if (progress.getCertificateId() != null) {
                Optional<Certificate> certificate = certificateRepository.findById(progress.getCertificateId());
                if (certificate.isPresent()) {
                    courseDetail.put("certificateUrl", "/api/v2/certificates/download/" + certificate.get().getId());
                }
            }
            
            courseDetails.add(courseDetail);
        }
        
        return courseDetails;
    }
    
    /**
     * Gets statistics for all assessments the user has taken
     * 
     * @param userId The ID of the user
     * @return List of maps containing assessment statistics
     */
    private List<Map<String, Object>> getAssessmentStats(UUID userId) {
        List<AssessmentAttempt> assessmentAttempts = assessmentAttemptRepository.findByUserIdOrderByStartedAtDesc(userId);
        List<Map<String, Object>> assessmentStats = new ArrayList<>();
        
        for (AssessmentAttempt attempt : assessmentAttempts) {
            // Skip incomplete attempts
            if (attempt.getSubmittedAt() == null) {
                continue;
            }
            
            Map<String, Object> assessmentStat = new HashMap<>();
            CourseComponent component = attempt.getComponent();
            
            // Get assessment title from component data
            String assessmentTitle = "Assessment";
            if (component.getData() != null && component.getData().containsKey("title")) {
                assessmentTitle = (String) component.getData().get("title");
            }
            
            assessmentStat.put("assessmentTitle", assessmentTitle);
            assessmentStat.put("score", attempt.getScore());
            assessmentStat.put("dateTaken", attempt.getSubmittedAt());
            assessmentStat.put("status", attempt.getPassed() ? "Passed" : "Failed");
            
            assessmentStats.add(assessmentStat);
        }
        
        return assessmentStats;
    }
    
    /**
     * Generates chart data for visualizing the user's learning progress
     * 
     * @param userId The ID of the user
     * @return Map containing data for different chart types
     */
    private Map<String, Object> getChartData(UUID userId) {
        Map<String, Object> chartData = new HashMap<>();
        
        // Completion pie chart data
        List<UserCourseProgress> courseProgresses = courseProgressRepository.findByUserId(userId);
        
        Map<ProgressStatus, Long> statusCounts = courseProgresses.stream()
            .collect(Collectors.groupingBy(UserCourseProgress::getStatus, Collectors.counting()));
            
        List<Map<String, Object>> completionPie = new ArrayList<>();
        
        // Add "Completed" status
        completionPie.add(Map.of(
            "label", "Completed", 
            "value", statusCounts.getOrDefault(ProgressStatus.COMPLETED, 0L)
        ));
        
        // Add "In Progress" status
        completionPie.add(Map.of(
            "label", "In Progress", 
            "value", statusCounts.getOrDefault(ProgressStatus.IN_PROGRESS, 0L)
        ));
        
        // Add "Not Started" status
        completionPie.add(Map.of(
            "label", "Not Started", 
            "value", statusCounts.getOrDefault(ProgressStatus.ENROLLED, 0L)
        ));
        
        chartData.put("completionPie", completionPie);
        
        // Pre vs Post assessment bar chart data
        List<Map<String, Object>> prePostBar = new ArrayList<>();
        
        for (UserCourseProgress progress : courseProgresses) {
            Course course = progress.getCourse();
            List<ComponentProgress> componentProgresses = componentProgressRepository.findByUserIdAndCourseId(userId, course.getId());
            
            Integer preScore = null;
            Integer postScore = null;
            
            for (ComponentProgress cp : componentProgresses) {
                if (cp.getComponent().getType() == CourseComponent.ComponentType.PRE_ASSESSMENT) {
                    preScore = cp.getScore();
                } else if (cp.getComponent().getType() == CourseComponent.ComponentType.POST_ASSESSMENT) {
                    postScore = cp.getScore();
                }
            }
            
            // Only add to chart if at least one score exists
            if (preScore != null || postScore != null) {
                Map<String, Object> courseScores = new HashMap<>();
                courseScores.put("course", course.getTitle());
                courseScores.put("pre", preScore);
                courseScores.put("post", postScore);
                prePostBar.add(courseScores);
            }
        }
        
        chartData.put("prePostBar", prePostBar);
        
        return chartData;
    }
    
    /**
     * Formats seconds into a human-readable time string (e.g., "12h 45m")
     * 
     * @param seconds Total seconds to format
     * @return Formatted time string
     */
    private String formatTimeSpent(long seconds) {
        long hours = seconds / 3600;
        long minutes = (seconds % 3600) / 60;
        return String.format("%dh %dm", hours, minutes);
    }
}