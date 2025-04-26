package com.ehs.elearning.repository;

import com.ehs.elearning.model.LearningMaterial;
import com.ehs.elearning.model.ModuleComponent;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface LearningMaterialRepository extends JpaRepository<LearningMaterial, UUID> {
    
    /**
     * Find all learning materials for a specific component, ordered by sequence
     * 
     * @param component The module component
     * @return List of learning materials ordered by sequence
     */
    List<LearningMaterial> findByComponentOrderBySequenceOrderAsc(ModuleComponent component);
    
    /**
     * Find all learning materials for a component by component ID
     * 
     * @param componentId The component ID
     * @return List of learning materials
     */
    List<LearningMaterial> findByComponentId(UUID componentId);
    
    /**
     * Count the number of learning materials for a component
     * 
     * @param component The module component
     * @return Count of learning materials
     */
    long countByComponent(ModuleComponent component);
}