package com.ehs.elearning.repository;

import com.ehs.elearning.model.ModuleComponent;
import com.ehs.elearning.model.TrainingModule;
import com.ehs.elearning.model.UserComponentProgress;
import com.ehs.elearning.model.Users;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserComponentProgressRepository extends JpaRepository<UserComponentProgress, UUID> {
    
    Optional<UserComponentProgress> findByUserAndComponent(Users user, ModuleComponent component);
    
    List<UserComponentProgress> findByUser(Users user);
    
    List<UserComponentProgress> findByComponent(ModuleComponent component);
    
    @Query("SELECT p FROM UserComponentProgress p WHERE p.component.trainingModule = ?1 AND p.user = ?2")
    List<UserComponentProgress> findByModuleAndUser(TrainingModule module, Users user);
    
    @Query("SELECT COUNT(p) FROM UserComponentProgress p WHERE p.component.trainingModule = ?1 AND p.user = ?2 AND p.completed = true")
    Long countCompletedComponentsByModule(TrainingModule module, Users user);
    
    @Query("SELECT COUNT(c) FROM ModuleComponent c WHERE c.trainingModule = ?1")
    Long countTotalComponentsByModule(TrainingModule module);
    
    @Query("SELECT AVG(p.score) FROM UserComponentProgress p WHERE p.component = ?1 AND p.score IS NOT NULL")
    Float getAverageScoreForComponent(ModuleComponent component);
}