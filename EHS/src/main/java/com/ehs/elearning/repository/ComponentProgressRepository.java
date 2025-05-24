package com.ehs.elearning.repository;

import com.ehs.elearning.model.ComponentProgress;
import com.ehs.elearning.model.ComponentProgressStatus;
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
public interface ComponentProgressRepository extends JpaRepository<ComponentProgress, UUID> {
    
    Optional<ComponentProgress> findByUserIdAndComponentId(UUID userId, UUID componentId);
    
    List<ComponentProgress> findByUserIdAndCourseId(UUID userId, UUID courseId);
    
    @Query("SELECT cp FROM ComponentProgress cp " +
           "WHERE cp.user.id = :userId " +
           "AND cp.course.id = :courseId " +
           "ORDER BY cp.component.orderIndex")
    List<ComponentProgress> findByUserIdAndCourseIdOrdered(@Param("userId") UUID userId, 
                                                          @Param("courseId") UUID courseId);
    
    @Query("SELECT COUNT(cp) FROM ComponentProgress cp " +
           "WHERE cp.user.id = :userId " +
           "AND cp.course.id = :courseId " +
           "AND cp.status = :status")
    Long countByUserIdAndCourseIdAndStatus(@Param("userId") UUID userId,
                                          @Param("courseId") UUID courseId,
                                          @Param("status") ComponentProgressStatus status);
    
    List<ComponentProgress> findByUserIdAndStatus(UUID userId, ComponentProgressStatus status);
    
    @Query("SELECT cp FROM ComponentProgress cp " +
           "WHERE cp.user.id = :userId " +
           "AND cp.component.type = :componentType " +
           "AND cp.status = :status")
    List<ComponentProgress> findByUserIdAndComponentTypeAndStatus(
            @Param("userId") UUID userId,
            @Param("componentType") String componentType,
            @Param("status") ComponentProgressStatus status);
    
    @Query("SELECT cp FROM ComponentProgress cp WHERE cp.component.id = :componentId")
    List<ComponentProgress> findByComponentId(@Param("componentId") UUID componentId);
    
    @Modifying
    @Transactional
    @Query("DELETE FROM ComponentProgress cp WHERE cp.component.id = :componentId")
    void deleteByComponentId(@Param("componentId") UUID componentId);
    
    @Modifying
    @Transactional
    @Query("DELETE FROM ComponentProgress cp WHERE cp.component.id IN :componentIds")
    void deleteByComponentIds(@Param("componentIds") List<UUID> componentIds);
    
    @Query("SELECT cp FROM ComponentProgress cp WHERE cp.course.id = :courseId")
    List<ComponentProgress> findByCourseId(@Param("courseId") UUID courseId);
}