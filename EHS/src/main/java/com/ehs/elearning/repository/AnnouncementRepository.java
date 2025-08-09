package com.ehs.elearning.repository;

import com.ehs.elearning.model.Announcement;
import com.ehs.elearning.model.Announcement.Priority;
import com.ehs.elearning.model.Users;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface AnnouncementRepository extends JpaRepository<Announcement, UUID> {
    
    List<Announcement> findByIsActiveTrueOrderByCreatedAtDesc();
    
    List<Announcement> findByIsActiveTrueAndPriorityOrderByCreatedAtDesc(Priority priority);
    
    @Query("SELECT a FROM Announcement a WHERE a.isActive = true AND (a.expiresAt IS NULL OR a.expiresAt > :now) ORDER BY a.priority DESC, a.createdAt DESC")
    List<Announcement> findActiveNonExpiredAnnouncements(@Param("now") LocalDateTime now);
    
    @Query("SELECT a FROM Announcement a WHERE a.isActive = true AND a.priority = :priority AND (a.expiresAt IS NULL OR a.expiresAt > :now) ORDER BY a.createdAt DESC")
    List<Announcement> findActiveNonExpiredAnnouncementsByPriority(@Param("priority") Priority priority, @Param("now") LocalDateTime now);
    
    List<Announcement> findByCreatedByOrderByCreatedAtDesc(Users createdBy);
    
    @Query("SELECT a FROM Announcement a WHERE a.createdAt BETWEEN :startDate AND :endDate ORDER BY a.createdAt DESC")
    List<Announcement> findByDateRange(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);
    
    @Query("SELECT COUNT(a) FROM Announcement a WHERE a.isActive = true")
    Long countActiveAnnouncements();
    
    @Query("SELECT COUNT(a) FROM Announcement a WHERE a.priority = :priority AND a.isActive = true")
    Long countByPriorityAndActive(@Param("priority") Priority priority);
    
    List<Announcement> findAllByOrderByCreatedAtDesc();
    
    @Query("SELECT a FROM Announcement a WHERE a.title LIKE %:searchTerm% OR a.content LIKE %:searchTerm% OR a.authorName LIKE %:searchTerm% ORDER BY a.createdAt DESC")
    List<Announcement> searchAnnouncements(@Param("searchTerm") String searchTerm);
}