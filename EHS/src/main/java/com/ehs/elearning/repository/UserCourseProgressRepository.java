package com.ehs.elearning.repository;

import com.ehs.elearning.model.Domain;
import com.ehs.elearning.model.ProgressStatus;
import com.ehs.elearning.model.UserCourseProgress;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

@Repository
public interface UserCourseProgressRepository extends JpaRepository<UserCourseProgress, UUID> {
    
    Optional<UserCourseProgress> findByUserIdAndCourseId(UUID userId, UUID courseId);
    
    List<UserCourseProgress> findByUserId(UUID userId);
    
    Page<UserCourseProgress> findByUserId(UUID userId, Pageable pageable);
    
    List<UserCourseProgress> findByUserIdAndStatus(UUID userId, ProgressStatus status);
    
    @Query("SELECT ucp FROM UserCourseProgress ucp " +
           "WHERE ucp.user.id = :userId " +
           "AND ucp.course.domain IN :domains")
    List<UserCourseProgress> findByUserIdAndDomains(@Param("userId") UUID userId, 
                                                   @Param("domains") Set<Domain> domains);
    
    @Query("SELECT ucp FROM UserCourseProgress ucp " +
           "WHERE ucp.user.id = :userId " +
           "AND ucp.course.status = 'PUBLISHED' " +
           "ORDER BY ucp.enrollmentDate DESC")
    List<UserCourseProgress> findEnrolledCoursesByUserId(@Param("userId") UUID userId);
    
    @Query("SELECT COUNT(ucp) FROM UserCourseProgress ucp " +
           "WHERE ucp.course.id = :courseId " +
           "AND ucp.status = :status")
    Long countByCourseIdAndStatus(@Param("courseId") UUID courseId, 
                                  @Param("status") ProgressStatus status);
    
    // Dashboard query methods
    List<UserCourseProgress> findTop5ByOrderByUpdatedAtDesc();
    
    @Query(value = "SELECT u.username, " +
           "COUNT(CASE WHEN ucp.status = 'COMPLETED' THEN 1 END) as completed, " +
           "COUNT(ucp.id) as total " +
           "FROM users u " +
           "JOIN user_course_progress ucp ON u.id = ucp.user_id " +
           "GROUP BY u.username " +
           "ORDER BY completed DESC " +
           "LIMIT :limit", nativeQuery = true)
    List<Object[]> findTopPerformers(@Param("limit") int limit);
    
    List<UserCourseProgress> findByCourseId(UUID courseId);
}