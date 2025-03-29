package com.ehs.elearning.repository;

import com.ehs.elearning.model.ModuleStatus;
import com.ehs.elearning.model.TrainingModule;
import com.ehs.elearning.model.Users;
import com.ehs.elearning.model.Domain;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface TrainingModuleRepository extends JpaRepository<TrainingModule, UUID> {
    List<TrainingModule> findByDomain(Domain domain);
    List<TrainingModule> findByStatus(ModuleStatus status);
    List<TrainingModule> findByCreatedBy(Users createdBy);
    List<TrainingModule> findByDomainAndStatus(Domain domain, ModuleStatus status);
    List<TrainingModule> findByTitleContainingIgnoreCase(String title);
}