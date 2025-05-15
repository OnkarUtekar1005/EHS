package com.ehs.elearning.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.ehs.elearning.model.ComponentType;
import com.ehs.elearning.model.ModuleComponent;
import com.ehs.elearning.model.TrainingModule;

@Repository
public interface ModuleComponentRepository extends JpaRepository<ModuleComponent, UUID> {

    // Find components by training module
    List<ModuleComponent> findByTrainingModule(TrainingModule trainingModule);
    
    // Find components by training module ordered by sequence
    List<ModuleComponent> findByTrainingModuleOrderBySequenceOrderAsc(TrainingModule trainingModule);
    
    // Find components by type
    List<ModuleComponent> findByType(ComponentType type);
    
    // Find components by training module and type
    List<ModuleComponent> findByTrainingModuleAndType(TrainingModule trainingModule, ComponentType type);
    
    // Find components by training module and type ordered by sequence
    List<ModuleComponent> findByTrainingModuleAndTypeOrderBySequenceOrderAsc(TrainingModule trainingModule, ComponentType type);
    
    // Count components by training module
    long countByTrainingModule(TrainingModule trainingModule);
    
    // Count components by training module and type
    long countByTrainingModuleAndType(TrainingModule trainingModule, ComponentType type);
    
    // Find highest sequence order in a module
    @Query("SELECT MAX(mc.sequenceOrder) FROM ModuleComponent mc WHERE mc.trainingModule = :module")
    Integer findMaxSequenceOrderByModule(@Param("module") TrainingModule module);
}