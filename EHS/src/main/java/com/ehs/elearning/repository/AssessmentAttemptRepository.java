package com.ehs.elearning.repository;

import com.ehs.elearning.model.AssessmentAttempt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;
import jakarta.persistence.LockModeType;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface AssessmentAttemptRepository extends JpaRepository<AssessmentAttempt, UUID> {
    
    List<AssessmentAttempt> findByUserIdAndComponentId(UUID userId, UUID componentId);
    
    Optional<AssessmentAttempt> findTopByUserIdAndComponentIdOrderByAttemptNumberDesc(
        UUID userId, UUID componentId);
    
    Integer countByUserIdAndComponentId(UUID userId, UUID componentId);
    
    @Query("SELECT COUNT(a) FROM AssessmentAttempt a " +
           "WHERE a.user.id = :userId " +
           "AND a.component.id = :componentId " +
           "AND a.submittedAt IS NOT NULL")
    Integer countCompletedAttempts(
        @Param("userId") UUID userId, 
        @Param("componentId") UUID componentId);
    
    @Query("SELECT a FROM AssessmentAttempt a " +
           "WHERE a.user.id = :userId " +
           "AND a.component.id = :componentId " +
           "AND a.passed = true " +
           "ORDER BY a.score DESC")
    List<AssessmentAttempt> findPassedAttemptsByUserIdAndComponentId(
        @Param("userId") UUID userId, 
        @Param("componentId") UUID componentId);
    
    @Query("SELECT a FROM AssessmentAttempt a " +
           "WHERE a.user.id = :userId " +
           "AND a.component.course.id = :courseId " +
           "ORDER BY a.startedAt DESC")
    List<AssessmentAttempt> findByUserIdAndCourseId(
        @Param("userId") UUID userId, 
        @Param("courseId") UUID courseId);
    
    @Query("SELECT MAX(a.attemptNumber) FROM AssessmentAttempt a " +
           "WHERE a.user.id = :userId " +
           "AND a.component.id = :componentId")
    Optional<Integer> findMaxAttemptNumber(
        @Param("userId") UUID userId, 
        @Param("componentId") UUID componentId);
    
    @Query("SELECT a FROM AssessmentAttempt a " +
           "WHERE a.user.id = :userId " +
           "AND a.component.id = :componentId " +
           "AND a.submittedAt IS NULL")
    Optional<AssessmentAttempt> findIncompleteAttempt(
        @Param("userId") UUID userId, 
        @Param("componentId") UUID componentId);
    
    @Query("SELECT a FROM AssessmentAttempt a WHERE a.component.id = :componentId")
    List<AssessmentAttempt> findByComponentId(@Param("componentId") UUID componentId);
    
    @Modifying
    @Transactional
    @Query("DELETE FROM AssessmentAttempt a WHERE a.component.id = :componentId")
    void deleteByComponentId(@Param("componentId") UUID componentId);
    
    @Modifying
    @Transactional
    @Query("DELETE FROM AssessmentAttempt a WHERE a.component.id IN :componentIds")
    void deleteByComponentIds(@Param("componentIds") List<UUID> componentIds);
    
    @Query("SELECT a FROM AssessmentAttempt a " +
           "WHERE a.user.id = :userId " +
           "AND a.submittedAt IS NULL " +
           "ORDER BY a.startedAt DESC")
    List<AssessmentAttempt> findIncompleteAttemptsByUserId(@Param("userId") UUID userId);
    
    @Query("SELECT a FROM AssessmentAttempt a " +
           "WHERE a.user.id = :userId " +
           "AND a.component.id = :componentId " +
           "ORDER BY a.attemptNumber")
    @org.springframework.data.jpa.repository.Lock(LockModeType.PESSIMISTIC_WRITE)
    List<AssessmentAttempt> findByUserIdAndComponentIdWithLock(
        @Param("userId") UUID userId, 
        @Param("componentId") UUID componentId);
    
    Optional<AssessmentAttempt> findByUserIdAndComponentIdAndAttemptNumber(
        UUID userId, UUID componentId, Integer attemptNumber);
        
    // Admin functionality methods
    @Query("SELECT a FROM AssessmentAttempt a ORDER BY a.startedAt DESC")
    List<AssessmentAttempt> findAllOrderByStartedAtDesc();
    
    @Query("SELECT a FROM AssessmentAttempt a WHERE a.user.id = :userId ORDER BY a.startedAt DESC")
    List<AssessmentAttempt> findByUserIdOrderByStartedAtDesc(@Param("userId") UUID userId);
    
    @Query("SELECT a FROM AssessmentAttempt a WHERE a.component.id = :componentId ORDER BY a.startedAt DESC")
    List<AssessmentAttempt> findByComponentIdOrderByStartedAtDesc(@Param("componentId") UUID componentId);
    
    // Count methods for dashboard
    Long countByPassedTrue();
    Long countByPassedFalse();
    
    // Top failing components
    @Query(value = 
        "SELECT c.id as componentId, " +
        "c.data->>'title' as componentTitle, " +
        "co.id as courseId, " +
        "co.title as courseTitle, " +
        "COUNT(a.id) as attemptCount, " +
        "COUNT(CASE WHEN a.passed = false THEN 1 END) as failCount, " +
        "ROUND(COUNT(CASE WHEN a.passed = false THEN 1 END) * 100.0 / COUNT(a.id), 2) as failRate " +
        "FROM assessment_attempts a " +
        "JOIN course_components c ON a.component_id = c.id " +
        "JOIN courses co ON c.course_id = co.id " +
        "WHERE a.submitted_at IS NOT NULL " +
        "GROUP BY c.id, c.data->>'title', co.id, co.title " +
        "HAVING COUNT(a.id) >= 5 " +
        "ORDER BY failRate DESC " +
        "LIMIT 10", 
        nativeQuery = true)
    List<Map<String, Object>> findTopFailingComponents();
}