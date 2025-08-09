package com.ehs.elearning.repository;

import com.ehs.elearning.model.Think;
import com.ehs.elearning.model.Think.ThinkType;
import com.ehs.elearning.model.Think.ThinkStatus;
import com.ehs.elearning.model.Users;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface ThinkRepository extends JpaRepository<Think, UUID> {
    
    List<Think> findByTypeOrderByCreatedAtDesc(ThinkType type);
    
    List<Think> findByStatusOrderByCreatedAtDesc(ThinkStatus status);
    
    List<Think> findByUserOrderByCreatedAtDesc(Users user);
    
    List<Think> findByUserAndTypeOrderByCreatedAtDesc(Users user, ThinkType type);
    
    @Query("SELECT t FROM Think t WHERE t.user = :user OR t.isAnonymous = false ORDER BY t.createdAt DESC")
    List<Think> findUserSubmissions(@Param("user") Users user);
    
    @Query("SELECT t FROM Think t WHERE t.createdAt BETWEEN :startDate AND :endDate ORDER BY t.createdAt DESC")
    List<Think> findByDateRange(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);
    
    @Query("SELECT COUNT(t) FROM Think t WHERE t.type = :type")
    Long countByType(@Param("type") ThinkType type);
    
    @Query("SELECT COUNT(t) FROM Think t WHERE t.status = :status")
    Long countByStatus(@Param("status") ThinkStatus status);
    
    List<Think> findAllByOrderByCreatedAtDesc();
}