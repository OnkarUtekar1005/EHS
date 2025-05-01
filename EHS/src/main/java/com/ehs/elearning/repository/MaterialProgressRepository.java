package com.ehs.elearning.repository;

import com.ehs.elearning.model.LearningMaterial;
import com.ehs.elearning.model.MaterialProgress;
import com.ehs.elearning.model.ModuleComponent;
import com.ehs.elearning.model.Users;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface MaterialProgressRepository extends JpaRepository<MaterialProgress, UUID> {
    
    List<MaterialProgress> findByUser(Users user);
    
    Optional<MaterialProgress> findByMaterialAndUser(LearningMaterial material, Users user);
    
    List<MaterialProgress> findByUserAndCompleted(Users user, Boolean completed);
    
    // Replace this method with a query that uses the association table
    @Query("SELECT mp FROM MaterialProgress mp " +
           "JOIN ComponentMaterialAssociation cma ON mp.material.id = cma.material.id " +
           "WHERE mp.user = :user AND cma.component = :component")
    List<MaterialProgress> findByUserAndComponentMaterial(@Param("user") Users user, @Param("component") ModuleComponent component);
    
    // Count completed materials in a component
    @Query("SELECT COUNT(mp) FROM MaterialProgress mp " +
           "JOIN ComponentMaterialAssociation cma ON mp.material.id = cma.material.id " +
           "WHERE cma.component = :component AND mp.user = :user AND mp.completed = true")
    Long countCompletedMaterialsInComponent(@Param("component") ModuleComponent component, @Param("user") Users user);
    
    // Count total materials in a component
    @Query("SELECT COUNT(cma) FROM ComponentMaterialAssociation cma " +
           "WHERE cma.component = :component")
    Long countTotalMaterialsInComponent(@Param("component") ModuleComponent component);
}