package com.ehs.elearning.repository;

import com.ehs.elearning.model.LearningMaterial;
import com.ehs.elearning.model.MaterialProgress;
import com.ehs.elearning.model.ModuleComponent;
import com.ehs.elearning.model.Users;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface MaterialProgressRepository extends JpaRepository<MaterialProgress, UUID> {
    Optional<MaterialProgress> findByMaterialAndUser(LearningMaterial material, Users user);
    
    List<MaterialProgress> findByUser(Users user);
    
    List<MaterialProgress> findByUserAndMaterialComponent(Users user, ModuleComponent component);
    
    @Query("SELECT COUNT(mp) FROM MaterialProgress mp WHERE mp.material.component = ?1 AND mp.user = ?2 AND mp.completed = true")
    Long countCompletedMaterialsInComponent(ModuleComponent component, Users user);
    
    @Query("SELECT COUNT(lm) FROM LearningMaterial lm WHERE lm.component = ?1")
    Long countTotalMaterialsInComponent(ModuleComponent component);
}