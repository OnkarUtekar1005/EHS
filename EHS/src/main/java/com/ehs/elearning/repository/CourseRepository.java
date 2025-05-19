package com.ehs.elearning.repository;

import com.ehs.elearning.model.Course;
import com.ehs.elearning.model.Course.CourseStatus;
import com.ehs.elearning.model.Domain;
import com.ehs.elearning.model.Users;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CourseRepository extends JpaRepository<Course, UUID> {
    
    // Find courses by status
    List<Course> findByStatus(CourseStatus status);
    
    // Find courses by domain
    List<Course> findByDomain(Domain domain);
    
    // Find courses by creator
    List<Course> findByCreatedBy(Users createdBy);
    
    // Find course with components
    @Query("SELECT c FROM Course c LEFT JOIN FETCH c.components WHERE c.id = :id")
    Optional<Course> findByIdWithComponents(@Param("id") UUID id);
    
    // Simple find by domain
    Page<Course> findByDomainId(UUID domainId, Pageable pageable);
    
    // Simple find by status
    Page<Course> findByStatus(CourseStatus status, Pageable pageable);
    
    // Simple find by domain and status
    Page<Course> findByDomainIdAndStatus(UUID domainId, CourseStatus status, Pageable pageable);
    
    // Check if course title exists
    boolean existsByTitle(String title);
    
    // Check if course title exists for another course (for updates)
    boolean existsByTitleAndIdNot(String title, UUID id);
    
    // Simple find all courses
    Page<Course> findAll(Pageable pageable);
    
    // Dashboard statistics methods
    List<Course> findTop5ByOrderByCreatedAtDesc();
}