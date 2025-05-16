package com.ehs.elearning.repository;

import com.ehs.elearning.model.Course;
import com.ehs.elearning.model.CourseComponent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface CourseComponentRepository extends JpaRepository<CourseComponent, UUID> {
    
    // Find components by course
    List<CourseComponent> findByCourseOrderByOrderIndex(Course course);
    
    // Find components by course ID
    List<CourseComponent> findByCourseIdOrderByOrderIndex(UUID courseId);
    
    // Get max order index for a course
    @Query("SELECT MAX(cc.orderIndex) FROM CourseComponent cc WHERE cc.course.id = :courseId")
    Integer findMaxOrderIndexByCourseId(@Param("courseId") UUID courseId);
    
    // Delete all components for a course
    void deleteAllByCourseId(UUID courseId);
}