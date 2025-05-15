package com.ehs.elearning.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.ehs.elearning.model.Domain;
import com.ehs.elearning.model.ModuleStatus;
import com.ehs.elearning.model.TrainingModule;

@Repository
public interface TrainingModuleRepository extends JpaRepository<TrainingModule, UUID> {

    // Find modules by domain
    List<TrainingModule> findByDomain(Domain domain);
    
    // Find modules by status
    List<TrainingModule> findByStatus(ModuleStatus status);
    
    // Find modules by domain and status
    List<TrainingModule> findByDomainAndStatus(Domain domain, ModuleStatus status);
    
    // Search modules by title containing keyword
    List<TrainingModule> findByTitleContainingIgnoreCase(String keyword);
    
    // Search modules by title containing keyword and domain
    List<TrainingModule> findByTitleContainingIgnoreCaseAndDomain(String keyword, Domain domain);
    
    // Search modules by title containing keyword and status
    List<TrainingModule> findByTitleContainingIgnoreCaseAndStatus(String keyword, ModuleStatus status);
    
    // Search modules by title containing keyword, domain, and status
    List<TrainingModule> findByTitleContainingIgnoreCaseAndDomainAndStatus(String keyword, Domain domain, ModuleStatus status);
    
    // Paginated versions of the above queries
    Page<TrainingModule> findByDomain(Domain domain, Pageable pageable);
    
    Page<TrainingModule> findByStatus(ModuleStatus status, Pageable pageable);
    
    Page<TrainingModule> findByDomainAndStatus(Domain domain, ModuleStatus status, Pageable pageable);
    
    Page<TrainingModule> findByTitleContainingIgnoreCase(String keyword, Pageable pageable);
    
    Page<TrainingModule> findByTitleContainingIgnoreCaseAndDomain(String keyword, Domain domain, Pageable pageable);
    
    Page<TrainingModule> findByTitleContainingIgnoreCaseAndStatus(String keyword, ModuleStatus status, Pageable pageable);
    
    Page<TrainingModule> findByTitleContainingIgnoreCaseAndDomainAndStatus(String keyword, Domain domain, ModuleStatus status, Pageable pageable);
    
    // Check if a module exists with the same title in the same domain
    boolean existsByTitleIgnoreCaseAndDomain(String title, Domain domain);
    
    @Query("SELECT tm FROM TrainingModule tm WHERE tm.domain = :domain AND tm.id <> :excludeId AND LOWER(tm.title) = LOWER(:title)")
    Optional<TrainingModule> findByTitleIgnoreCaseAndDomainExcludingSelf(@Param("title") String title, @Param("domain") Domain domain, @Param("excludeId") UUID excludeId);
}