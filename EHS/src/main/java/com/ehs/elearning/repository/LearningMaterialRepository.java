package com.ehs.elearning.repository;

import com.ehs.elearning.model.LearningMaterial;
import com.ehs.elearning.model.ModuleComponent;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface LearningMaterialRepository extends JpaRepository<LearningMaterial, UUID> {
    
    /**
     * Find all learning materials by title containing (case insensitive)
     */
    Page<LearningMaterial> findByTitleContainingIgnoreCase(String title, Pageable pageable);
    
    /**
     * Find all learning materials by file type
     */
    Page<LearningMaterial> findByFileType(String fileType, Pageable pageable);
    
    /**
     * Find all learning materials by title containing (case insensitive) and file type
     */
    Page<LearningMaterial> findByTitleContainingIgnoreCaseAndFileType(String title, String fileType, Pageable pageable);
    
    /**
     * Find all learning materials for a component using the association table
     */
    @Query("SELECT lm FROM LearningMaterial lm JOIN ComponentMaterialAssociation cma ON lm.id = cma.material.id " +
           "WHERE cma.component = :component ORDER BY cma.sequenceOrder ASC")
    List<LearningMaterial> findByComponentOrderBySequenceOrderAsc(@Param("component") ModuleComponent component);
    
    /**
     * Find all learning materials for a component by component ID using the association table
     */
    @Query("SELECT lm FROM LearningMaterial lm JOIN ComponentMaterialAssociation cma ON lm.id = cma.material.id " +
           "WHERE cma.component.id = :componentId ORDER BY cma.sequenceOrder ASC")
    List<LearningMaterial> findByComponentId(@Param("componentId") UUID componentId);
    
    /**
     * Count learning materials for a component using the association table
     */
    @Query("SELECT COUNT(lm) FROM LearningMaterial lm JOIN ComponentMaterialAssociation cma ON lm.id = cma.material.id " +
           "WHERE cma.component = :component")
    long countByComponent(@Param("component") ModuleComponent component);
}