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

@Service
@Transactional(readOnly = true)
public class UserReportsService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private UserCourseProgressRepository courseProgressRepository;

    @Autowired
    private ComponentProgressRepository componentProgressRepository;

    @Autowired
    private AssessmentAttemptRepository assessmentAttemptRepository;

    @Autowired
    private CertificateRepository certificateRepository;

    /**
     * Get summary metrics for a user
     */
    public Map<String, Object> getUserSummaryMetrics(UUID userId) {
        // Get user's course progress data
        List<UserCourseProgress> courseProgresses = courseProgressRepository.findByUserId(userId);
        
        // Total courses enrolled
        int totalCoursesEnrolled = courseProgresses.size();
        
        // Total courses completed
        long totalCoursesCompleted = courseProgresses.stream()
            .filter(cp -> cp.getStatus() == ProgressStatus.COMPLETED)
            .count();
        
        // Get all assessment attempts for the user
        List<AssessmentAttempt> assessmentAttempts = assessmentAttemptRepository.findByUserIdOrderByStartedAtDesc(userId);
        
        // Calculate average pre/post assessment score
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
        
        // Format time into hours, minutes, seconds
        long hours = totalTimeSpentSeconds / 3600;
        long minutes = (totalTimeSpentSeconds % 3600) / 60;
        long seconds = totalTimeSpentSeconds % 60;
        
        String totalTimeSpent = String.format("%d:%02d:%02d", hours, minutes, seconds);
        
        // Return summary metrics
        Map<String, Object> summaryMetrics = new HashMap<>();
        summaryMetrics.put("totalCoursesEnrolled", totalCoursesEnrolled);
        summaryMetrics.put("totalCoursesCompleted", totalCoursesCompleted);
        summaryMetrics.put("averageAssessmentScore", averageScore);
        summaryMetrics.put("totalTimeSpentSeconds", totalTimeSpentSeconds);
        summaryMetrics.put("totalTimeSpentFormatted", totalTimeSpent);
        
        return summaryMetrics;
    }
    
    /**
     * Get per-course progress details for a user
     */
    public List<Map<String, Object>> getUserCourseProgressDetails(UUID userId) {
        List<UserCourseProgress> courseProgresses = courseProgressRepository.findByUserId(userId);
        List<Map<String, Object>> courseProgressDetails = new ArrayList<>();
        
        for (UserCourseProgress progress : courseProgresses) {
            Map<String, Object> courseDetail = new HashMap<>();
            Course course = progress.getCourse();
            
            // Basic course information
            courseDetail.put("courseId", course.getId());
            courseDetail.put("courseTitle", course.getTitle());
            courseDetail.put("enrollmentDate", progress.getEnrollmentDate());
            courseDetail.put("progressPercentage", progress.getOverallProgress());
            courseDetail.put("status", progress.getStatus());
            
            // Last accessed date (find the most recent component access)
            List<ComponentProgress> componentProgresses = componentProgressRepository.findByUserIdAndCourseId(userId, course.getId());
            Optional<LocalDateTime> lastAccessedDate = componentProgresses.stream()
                .map(ComponentProgress::getLastAccessedAt)
                .filter(Objects::nonNull)
                .max(LocalDateTime::compareTo);
                
            courseDetail.put("lastAccessedDate", lastAccessedDate.orElse(null));
            
            // Pre and post assessment scores
            List<ComponentProgress> assessmentProgresses = componentProgresses.stream()
                .filter(cp -> cp.getComponent().getType() == CourseComponent.ComponentType.PRE_ASSESSMENT 
                          || cp.getComponent().getType() == CourseComponent.ComponentType.POST_ASSESSMENT)
                .collect(Collectors.toList());
                
            Map<String, Integer> assessmentScores = new HashMap<>();
            
            for (ComponentProgress assessmentProgress : assessmentProgresses) {
                String type = assessmentProgress.getComponent().getType().toString();
                assessmentScores.put(type, assessmentProgress.getScore());
            }
            
            courseDetail.put("preAssessmentScore", assessmentScores.getOrDefault("PRE_ASSESSMENT", null));
            courseDetail.put("postAssessmentScore", assessmentScores.getOrDefault("POST_ASSESSMENT", null));
            
            // Certificate information
            if (progress.getCertificateId() != null) {
                Optional<Certificate> certificate = certificateRepository.findById(progress.getCertificateId());
                if (certificate.isPresent()) {
                    courseDetail.put("certificateId", certificate.get().getId());
                    courseDetail.put("certificateNumber", certificate.get().getCertificateNumber());
                    courseDetail.put("certificateUrl", "/api/v2/certificates/" + certificate.get().getId() + "/download");
                    courseDetail.put("certificateIssueDate", certificate.get().getIssuedDate());
                    courseDetail.put("certificateExpiryDate", certificate.get().getExpiryDate());
                }
            }
            
            courseProgressDetails.add(courseDetail);
        }
        
        return courseProgressDetails;
    }
    
    /**
     * Get assessment statistics for a user
     */
    public List<Map<String, Object>> getUserAssessmentStats(UUID userId) {
        List<AssessmentAttempt> assessmentAttempts = assessmentAttemptRepository.findByUserIdOrderByStartedAtDesc(userId);
        Map<UUID, CourseComponent> componentCache = new HashMap<>();
        List<Map<String, Object>> assessmentStats = new ArrayList<>();
        
        for (AssessmentAttempt attempt : assessmentAttempts) {
            // Skip incomplete attempts
            if (attempt.getSubmittedAt() == null) {
                continue;
            }
            
            CourseComponent component = componentCache.computeIfAbsent(
                attempt.getComponent().getId(), 
                id -> attempt.getComponent()
            );
            
            Map<String, Object> assessmentStat = new HashMap<>();
            
            // Get assessment title from component data
            String assessmentTitle = "Assessment";
            if (component.getData() != null && component.getData().containsKey("title")) {
                assessmentTitle = (String) component.getData().get("title");
            }
            
            assessmentStat.put("assessmentId", attempt.getComponent().getId());
            assessmentStat.put("assessmentTitle", assessmentTitle);
            assessmentStat.put("courseId", component.getCourse().getId());
            assessmentStat.put("courseTitle", component.getCourse().getTitle());
            assessmentStat.put("assessmentType", component.getType().toString());
            assessmentStat.put("attemptId", attempt.getId());
            assessmentStat.put("attemptNumber", attempt.getAttemptNumber());
            assessmentStat.put("score", attempt.getScore());
            assessmentStat.put("passed", attempt.getPassed());
            assessmentStat.put("dateTaken", attempt.getSubmittedAt());
            assessmentStat.put("timeTakenSeconds", attempt.getTimeTakenSeconds());
            
            assessmentStats.add(assessmentStat);
        }
        
        return assessmentStats;
    }
    
    /**
     * Get chart data for a user's learning activity
     */
    public Map<String, Object> getUserChartData(UUID userId) {
        Map<String, Object> chartData = new HashMap<>();
        
        // Pie chart data for course statuses
        List<UserCourseProgress> courseProgresses = courseProgressRepository.findByUserId(userId);
        
        Map<ProgressStatus, Long> statusCounts = courseProgresses.stream()
            .collect(Collectors.groupingBy(UserCourseProgress::getStatus, Collectors.counting()));
            
        List<Map<String, Object>> pieChartData = new ArrayList<>();
        
        for (ProgressStatus status : ProgressStatus.values()) {
            Map<String, Object> dataPoint = new HashMap<>();
            dataPoint.put("status", status.toString());
            dataPoint.put("count", statusCounts.getOrDefault(status, 0L));
            pieChartData.add(dataPoint);
        }
        
        chartData.put("courseStatusDistribution", pieChartData);
        
        // Bar chart data for pre vs post assessment scores
        List<Map<String, Object>> barChartData = new ArrayList<>();
        
        for (UserCourseProgress progress : courseProgresses) {
            Map<String, Object> courseScores = new HashMap<>();
            Course course = progress.getCourse();
            
            courseScores.put("courseId", course.getId());
            courseScores.put("courseTitle", course.getTitle());
            
            // Find pre and post assessment scores
            List<ComponentProgress> componentProgresses = componentProgressRepository.findByUserIdAndCourseId(userId, course.getId());
            
            for (ComponentProgress cp : componentProgresses) {
                if (cp.getComponent().getType() == CourseComponent.ComponentType.PRE_ASSESSMENT) {
                    courseScores.put("preAssessmentScore", cp.getScore());
                } else if (cp.getComponent().getType() == CourseComponent.ComponentType.POST_ASSESSMENT) {
                    courseScores.put("postAssessmentScore", cp.getScore());
                }
            }
            
            if (courseScores.containsKey("preAssessmentScore") || courseScores.containsKey("postAssessmentScore")) {
                barChartData.add(courseScores);
            }
        }
        
        chartData.put("prePostAssessmentScores", barChartData);
        
        // Line chart data for learning activity over time (last 30 days)
        List<Map<String, Object>> lineChartData = new ArrayList<>();
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime thirtyDaysAgo = now.minusDays(30);
        
        // Get all component progress updates in the last 30 days
        List<ComponentProgress> recentProgressUpdates = componentProgressRepository.findByUserIdAndStatus(userId, ComponentProgressStatus.COMPLETED)
            .stream()
            .filter(cp -> cp.getCompletedAt() != null && cp.getCompletedAt().isAfter(thirtyDaysAgo))
            .collect(Collectors.toList());
            
        // Group by day
        Map<LocalDateTime, Long> activityByDay = new TreeMap<>();
        
        // Initialize all days with zero activity
        for (int i = 0; i < 30; i++) {
            LocalDateTime day = now.minusDays(i).truncatedTo(ChronoUnit.DAYS);
            activityByDay.put(day, 0L);
        }
        
        // Count activities per day
        for (ComponentProgress cp : recentProgressUpdates) {
            LocalDateTime day = cp.getCompletedAt().truncatedTo(ChronoUnit.DAYS);
            activityByDay.put(day, activityByDay.getOrDefault(day, 0L) + 1);
        }
        
        // Convert to list of data points
        for (Map.Entry<LocalDateTime, Long> entry : activityByDay.entrySet()) {
            Map<String, Object> dataPoint = new HashMap<>();
            dataPoint.put("date", entry.getKey());
            dataPoint.put("count", entry.getValue());
            lineChartData.add(dataPoint);
        }
        
        chartData.put("learningActivityOverTime", lineChartData);
        
        return chartData;
    }
    
    /**
     * Get complete user reports data
     * Formatted according to the required response structure
     */
    public Map<String, Object> getUserReports(UUID userId) {
        Map<String, Object> reports = new HashMap<>();

        // Get user details
        Users user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));

        // Get the data
        Map<String, Object> summaryMetrics = getUserSummaryMetrics(userId);
        List<Map<String, Object>> courseProgressDetails = getUserCourseProgressDetails(userId);
        List<Map<String, Object>> assessmentStats = getUserAssessmentStats(userId);
        Map<String, Object> chartData = getUserChartData(userId);

        // Format according to required structure
        Map<String, Object> summary = new HashMap<>();
        summary.put("coursesEnrolled", summaryMetrics.get("totalCoursesEnrolled"));
        summary.put("coursesCompleted", summaryMetrics.get("totalCoursesCompleted"));
        summary.put("averageScore", summaryMetrics.get("averageAssessmentScore"));
        summary.put("totalTimeSpent", summaryMetrics.get("totalTimeSpentFormatted"));

        // Format courses data
        List<Map<String, Object>> courses = courseProgressDetails.stream()
            .map(course -> {
                Map<String, Object> formattedCourse = new HashMap<>();
                formattedCourse.put("courseName", course.get("courseTitle"));
                formattedCourse.put("progress", course.get("progressPercentage"));
                formattedCourse.put("enrolledDate", course.get("enrollmentDate"));
                formattedCourse.put("lastAccessed", course.get("lastAccessedDate"));
                formattedCourse.put("preAssessmentScore", course.get("preAssessmentScore"));
                formattedCourse.put("postAssessmentScore", course.get("postAssessmentScore"));
                formattedCourse.put("certificateUrl", course.get("certificateUrl"));
                return formattedCourse;
            })
            .collect(Collectors.toList());

        // Format assessments data
        List<Map<String, Object>> assessments = assessmentStats.stream()
            .map(assessment -> {
                Map<String, Object> formattedAssessment = new HashMap<>();
                formattedAssessment.put("assessmentTitle", assessment.get("assessmentTitle"));
                formattedAssessment.put("score", assessment.get("score"));
                formattedAssessment.put("dateTaken", assessment.get("dateTaken"));
                formattedAssessment.put("status", (Boolean)assessment.get("passed") ? "Passed" : "Failed");
                return formattedAssessment;
            })
            .collect(Collectors.toList());

        // Format chart data
        Map<String, Object> charts = new HashMap<>();

        // Completion pie chart
        charts.put("completionPie",
            ((List<Map<String, Object>>) chartData.get("courseStatusDistribution")).stream()
                .map(item -> {
                    Map<String, Object> pieItem = new HashMap<>();
                    pieItem.put("label", item.get("status"));
                    pieItem.put("value", item.get("count"));
                    return pieItem;
                })
                .collect(Collectors.toList())
        );

        // Pre/post bar chart
        charts.put("prePostBar",
            ((List<Map<String, Object>>) chartData.get("prePostAssessmentScores")).stream()
                .map(item -> {
                    Map<String, Object> barItem = new HashMap<>();
                    barItem.put("course", item.get("courseTitle"));
                    barItem.put("pre", item.get("preAssessmentScore"));
                    barItem.put("post", item.get("postAssessmentScore"));
                    return barItem;
                })
                .collect(Collectors.toList())
        );

        // Assemble the final report
        reports.put("summary", summary);
        reports.put("courses", courses);
        reports.put("assessments", assessments);
        reports.put("charts", charts);

        // Also include the original format for backward compatibility
        reports.put("userInfo", Map.of(
            "id", user.getId(),
            "username", user.getUsername(),
            "email", user.getEmail(),
            "name", user.getFirstName() + " " + user.getLastName()
        ));
        reports.put("summaryMetrics", summaryMetrics);
        reports.put("courseProgressDetails", courseProgressDetails);
        reports.put("assessmentStats", assessmentStats);
        reports.put("chartData", chartData);

        return reports;
    }
}