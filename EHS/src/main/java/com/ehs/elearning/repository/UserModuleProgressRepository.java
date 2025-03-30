package com.ehs.elearning.repository;

import com.ehs.elearning.model.ProgressState;
import com.ehs.elearning.model.TrainingModule;
import com.ehs.elearning.model.UserModuleProgress;
import com.ehs.elearning.model.Users;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserModuleProgressRepository extends JpaRepository<UserModuleProgress, UUID> {
    
    Optional<UserModuleProgress> findByUserAndTrainingModule(Users user, TrainingModule module);
    
    List<UserModuleProgress> findByUser(Users user);
    
    List<UserModuleProgress> findByUserAndState(Users user, ProgressState state);
    
    List<UserModuleProgress> findByTrainingModule(TrainingModule module);
    
    @Query("SELECT COUNT(p) FROM UserModuleProgress p WHERE p.trainingModule = ?1 AND p.state = 'COMPLETED'")
    Long countCompletedByModule(TrainingModule module);
    
    @Query("SELECT AVG(p.postAssessmentScore) FROM UserModuleProgress p WHERE p.trainingModule = ?1 AND p.postAssessmentScore IS NOT NULL")
    Float getAveragePostAssessmentScoreForModule(TrainingModule module);
    
    @Query("SELECT AVG(p.preAssessmentScore) FROM UserModuleProgress p WHERE p.trainingModule = ?1 AND p.preAssessmentScore IS NOT NULL")
    Float getAveragePreAssessmentScoreForModule(TrainingModule module);
    
    @Query("SELECT AVG(p.improvementScore) FROM UserModuleProgress p WHERE p.trainingModule = ?1 AND p.improvementScore IS NOT NULL")
    Float getAverageImprovementScoreForModule(TrainingModule module);
}