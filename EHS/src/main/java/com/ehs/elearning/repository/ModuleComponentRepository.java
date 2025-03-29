package com.ehs.elearning.repository;

import com.ehs.elearning.model.ComponentType;
import com.ehs.elearning.model.ModuleComponent;
import com.ehs.elearning.model.TrainingModule;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ModuleComponentRepository extends JpaRepository<ModuleComponent, UUID> {
    List<ModuleComponent> findByTrainingModuleOrderBySequenceOrderAsc(TrainingModule trainingModule);
    List<ModuleComponent> findByTrainingModuleAndType(TrainingModule trainingModule, ComponentType type);
    ModuleComponent findByTrainingModuleAndSequenceOrder(TrainingModule trainingModule, Integer sequenceOrder);
}