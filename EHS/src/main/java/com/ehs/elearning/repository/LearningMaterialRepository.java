package com.ehs.elearning.repository;

import com.ehs.elearning.model.LearningMaterial;
import com.ehs.elearning.model.ModuleComponent;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface LearningMaterialRepository extends JpaRepository<LearningMaterial, UUID> {
    List<LearningMaterial> findByComponentOrderBySequenceOrderAsc(ModuleComponent component);
    LearningMaterial findByComponentAndSequenceOrder(ModuleComponent component, Integer sequenceOrder);
    Long countByComponent(ModuleComponent component);
}