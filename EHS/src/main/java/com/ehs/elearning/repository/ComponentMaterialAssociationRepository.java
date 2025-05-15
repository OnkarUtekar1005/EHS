package com.ehs.elearning.repository;

import com.ehs.elearning.model.ComponentMaterialAssociation;
import com.ehs.elearning.model.LearningMaterial;
import com.ehs.elearning.model.ModuleComponent;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ComponentMaterialAssociationRepository extends JpaRepository<ComponentMaterialAssociation, UUID> {
    
    List<ComponentMaterialAssociation> findByComponentOrderBySequenceOrderAsc(ModuleComponent component);
    
    List<ComponentMaterialAssociation> findByMaterial(LearningMaterial material);
    
    // Added this method to fix the deleteModule functionality
    List<ComponentMaterialAssociation> findByComponent(ModuleComponent component);
    
    @Query("SELECT cma FROM ComponentMaterialAssociation cma WHERE cma.component.id = :componentId ORDER BY cma.sequenceOrder ASC")
    List<ComponentMaterialAssociation> findByComponentIdOrderBySequenceOrderAsc(@Param("componentId") UUID componentId);
    
    @Query("SELECT cma FROM ComponentMaterialAssociation cma WHERE cma.material.id = :materialId")
    List<ComponentMaterialAssociation> findByMaterialId(@Param("materialId") UUID materialId);
    
    void deleteByComponentAndMaterial(ModuleComponent component, LearningMaterial material);
    
    @Query("DELETE FROM ComponentMaterialAssociation cma WHERE cma.component.id = :componentId AND cma.material.id = :materialId")
    void deleteByComponentIdAndMaterialId(@Param("componentId") UUID componentId, @Param("materialId") UUID materialId);
    
    boolean existsByComponentAndMaterial(ModuleComponent component, LearningMaterial material);
    
    @Query("SELECT COUNT(cma) > 0 FROM ComponentMaterialAssociation cma WHERE cma.component.id = :componentId AND cma.material.id = :materialId")
    boolean existsByComponentIdAndMaterialId(@Param("componentId") UUID componentId, @Param("materialId") UUID materialId);
}