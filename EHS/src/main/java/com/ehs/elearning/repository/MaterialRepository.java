package com.ehs.elearning.repository;

import com.ehs.elearning.model.Material;
import com.ehs.elearning.model.Material.MaterialType;
import com.ehs.elearning.model.Users;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface MaterialRepository extends JpaRepository<Material, UUID> {
    
    List<Material> findByCreatedByOrderByCreatedAtDesc(Users createdBy);
    
    List<Material> findByTypeOrderByCreatedAtDesc(MaterialType type);
    
    List<Material> findByTitleContainingIgnoreCaseOrDescriptionContainingIgnoreCase(String title, String description);
    
    List<Material> findAllByOrderByCreatedAtDesc();
}