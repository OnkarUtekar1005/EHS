package com.ehs.elearning.repository;

import com.ehs.elearning.model.*;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface UserProgressRepository extends JpaRepository<UserProgress, UUID> {
    
    // Find all progress records for a specific user
    List<UserProgress> findByUserIdOrderByTimestampDesc(UUID userId);
    
    // Find all progress records for a specific module
    List<UserProgress> findByModuleIdOrderByTimestampDesc(UUID moduleId);
    
    // Find all progress records for a specific user and module
    List<UserProgress> findByUserIdAndModuleIdOrderByTimestampDesc(UUID userId, UUID moduleId);
    
    // Find progress records for a specific user, module, and component
    List<UserProgress> findByUserIdAndModuleIdAndComponentIdOrderByTimestampDesc(
        UUID userId, UUID moduleId, UUID componentId);
    
    // Find progress records for a specific user, module, component, and material
    List<UserProgress> findByUserIdAndModuleIdAndComponentIdAndMaterialIdOrderByTimestampDesc(
        UUID userId, UUID moduleId, UUID componentId, UUID materialId);
    
    // Check if a user has started a module
    boolean existsByUserIdAndModuleIdAndProgressType(UUID userId, UUID moduleId, String progressType);
    
    // Get latest progress record for a user and module
    UserProgress findFirstByUserIdAndModuleIdOrderByTimestampDesc(UUID userId, UUID moduleId);
    
    // Get latest progress record for a user, module, and component
    UserProgress findFirstByUserIdAndModuleIdAndComponentIdOrderByTimestampDesc(
        UUID userId, UUID moduleId, UUID componentId);
    
    // Count completed components in a module for a user
    @Query("SELECT COUNT(DISTINCT up.component.id) FROM UserProgress up " +
           "WHERE up.user.id = :userId AND up.module.id = :moduleId AND " +
           "up.progressType = 'COMPONENT_COMPLETED'")
    long countCompletedComponentsByUserAndModule(@Param("userId") UUID userId, @Param("moduleId") UUID moduleId);
    
    // Get assessment scores for a user and module
    @Query("SELECT up FROM UserProgress up " +
           "WHERE up.user.id = :userId AND up.module.id = :moduleId AND " +
           "up.scoreValue IS NOT NULL")
    List<UserProgress> findAssessmentScoresByUserAndModule(@Param("userId") UUID userId, @Param("moduleId") UUID moduleId);
    
    // Calculate total time spent by a user on a module
    @Query("SELECT SUM(up.timeSpent) FROM UserProgress up " +
           "WHERE up.user.id = :userId AND up.module.id = :moduleId AND " +
           "up.timeSpent IS NOT NULL")
    Integer getTotalTimeSpentByUserAndModule(@Param("userId") UUID userId, @Param("moduleId") UUID moduleId);
    
    // Find modules completed by a user
    @Query("SELECT DISTINCT up.module FROM UserProgress up " +
           "WHERE up.user.id = :userId AND up.progressType = 'MODULE_COMPLETED'")
    List<TrainingModule> findCompletedModulesByUser(@Param("userId") UUID userId);
    
    // Find modules in progress by a user (started but not completed)
    @Query("SELECT DISTINCT up.module FROM UserProgress up " +
           "WHERE up.user.id = :userId AND up.progressType = 'MODULE_STARTED' AND " +
           "up.module.id NOT IN (SELECT up2.module.id FROM UserProgress up2 " +
           "WHERE up2.user.id = :userId AND up2.progressType = 'MODULE_COMPLETED')")
    List<TrainingModule> findInProgressModulesByUser(@Param("userId") UUID userId);
}