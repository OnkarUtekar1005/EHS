package com.ehs.elearning.repository;

import com.ehs.elearning.model.Domain;
import com.ehs.elearning.model.ModuleStatus;
import com.ehs.elearning.model.TrainingModule;
import com.ehs.elearning.model.Users;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface TrainingModuleRepository extends JpaRepository<TrainingModule, UUID> {
    // Basic query methods
    List<TrainingModule> findByDomain(Domain domain);
    List<TrainingModule> findByStatus(ModuleStatus status);
    List<TrainingModule> findByCreatedBy(Users createdBy);
    List<TrainingModule> findByDomainAndStatus(Domain domain, ModuleStatus status);
    List<TrainingModule> findByTitleContainingIgnoreCase(String title);
    
    // Paged query methods for better pagination support
    Page<TrainingModule> findAll(Pageable pageable);
    Page<TrainingModule> findByDomain(Domain domain, Pageable pageable);
    Page<TrainingModule> findByStatus(ModuleStatus status, Pageable pageable);
    Page<TrainingModule> findByDomainAndStatus(Domain domain, ModuleStatus status, Pageable pageable);
    Page<TrainingModule> findByTitleContainingIgnoreCase(String title, Pageable pageable);
    Page<TrainingModule> findByTitleContainingIgnoreCaseAndDomain(String title, Domain domain, Pageable pageable);
    Page<TrainingModule> findByTitleContainingIgnoreCaseAndStatus(String title, ModuleStatus status, Pageable pageable);
    Page<TrainingModule> findByTitleContainingIgnoreCaseAndDomainAndStatus(String title, Domain domain, ModuleStatus status, Pageable pageable);
    
    // Additional query methods that might be useful
    List<TrainingModule> findByCreatedByAndStatus(Users createdBy, ModuleStatus status);
    Page<TrainingModule> findByCreatedBy(Users createdBy, Pageable pageable);
}