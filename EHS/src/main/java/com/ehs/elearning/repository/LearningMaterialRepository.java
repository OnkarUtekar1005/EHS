package com.ehs.elearning.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.ehs.elearning.model.LearningMaterial;
import com.ehs.elearning.model.ModuleComponent;

@Repository
public interface LearningMaterialRepository extends JpaRepository<LearningMaterial, UUID> {

    // Find materials by module component
    List<LearningMaterial> findByModuleComponent(ModuleComponent moduleComponent);
    
    // Find materials by module component ordered by sequence
    List<LearningMaterial> findByModuleComponentOrderBySequenceOrderAsc(ModuleComponent moduleComponent);
    
    // Find materials by file type
    List<LearningMaterial> findByFileType(String fileType);
    
    // Find materials by module component and file type
    List<LearningMaterial> findByModuleComponentAndFileType(ModuleComponent moduleComponent, String fileType);
    
    // Count materials by module component
    long countByModuleComponent(ModuleComponent moduleComponent);
    
    // Find highest sequence order in a component
    @Query("SELECT MAX(lm.sequenceOrder) FROM LearningMaterial lm WHERE lm.moduleComponent = :component")
    Integer findMaxSequenceOrderByComponent(@Param("component") ModuleComponent component);
    
    // Search materials by title
    List<LearningMaterial> findByTitleContainingIgnoreCase(String keyword);
}