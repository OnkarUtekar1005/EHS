package com.ehs.elearning.repository;

import com.ehs.elearning.model.AssessmentAttempt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
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
}