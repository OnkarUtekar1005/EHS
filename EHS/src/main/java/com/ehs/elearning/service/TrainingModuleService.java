package com.ehs.elearning.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.ehs.elearning.model.Domain;
import com.ehs.elearning.model.ModuleStatus;
import com.ehs.elearning.model.TrainingModule;
import com.ehs.elearning.repository.DomainRepository;
import com.ehs.elearning.repository.ModuleComponentRepository;
import com.ehs.elearning.repository.TrainingModuleRepository;

import jakarta.persistence.EntityNotFoundException;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class TrainingModuleService {

    @Autowired
    private TrainingModuleRepository trainingModuleRepository;
    
    @Autowired
    private DomainRepository domainRepository;
    
    @Autowired
    private ModuleComponentRepository moduleComponentRepository;

    // Create a new training module
    @Transactional
    public TrainingModule createTrainingModule(TrainingModule trainingModule) {
        // Validate domain
        if (trainingModule.getDomain() != null && trainingModule.getDomain().getId() != null) {
            Domain domain = domainRepository.findById(trainingModule.getDomain().getId())
                .orElseThrow(() -> new EntityNotFoundException("Domain not found with id: " + trainingModule.getDomain().getId()));
            trainingModule.setDomain(domain);
        }
        
        // Validate title uniqueness within the domain
        if (trainingModule.getDomain() != null && 
            trainingModuleRepository.existsByTitleIgnoreCaseAndDomain(trainingModule.getTitle(), trainingModule.getDomain())) {
            throw new IllegalArgumentException("A module with the title '" + trainingModule.getTitle() + 
                                              "' already exists in this domain");
        }
        
        // Set default status if not set
        if (trainingModule.getStatus() == null) {
            trainingModule.setStatus(ModuleStatus.DRAFT);
        }
        
        return trainingModuleRepository.save(trainingModule);
    }

    // Get all training modules
    public List<TrainingModule> getAllTrainingModules() {
        return trainingModuleRepository.findAll();
    }
    
    // Get a paginated list of training modules
    public Page<TrainingModule> getTrainingModules(String search, UUID domainId, ModuleStatus status, Pageable pageable) {
        Domain domain = null;
        if (domainId != null) {
            domain = domainRepository.findById(domainId)
                .orElseThrow(() -> new EntityNotFoundException("Domain not found with id: " + domainId));
        }
        
        if (search != null && !search.trim().isEmpty()) {
            if (domain != null) {
                if (status != null) {
                    return trainingModuleRepository.findByTitleContainingIgnoreCaseAndDomainAndStatus(search, domain, status, pageable);
                } else {
                    return trainingModuleRepository.findByTitleContainingIgnoreCaseAndDomain(search, domain, pageable);
                }
            } else {
                if (status != null) {
                    return trainingModuleRepository.findByTitleContainingIgnoreCaseAndStatus(search, status, pageable);
                } else {
                    return trainingModuleRepository.findByTitleContainingIgnoreCase(search, pageable);
                }
            }
        } else {
            if (domain != null) {
                if (status != null) {
                    return trainingModuleRepository.findByDomainAndStatus(domain, status, pageable);
                } else {
                    return trainingModuleRepository.findByDomain(domain, pageable);
                }
            } else {
                if (status != null) {
                    return trainingModuleRepository.findByStatus(status, pageable);
                } else {
                    return trainingModuleRepository.findAll(pageable);
                }
            }
        }
    }

    // Get a training module by ID
    public TrainingModule getTrainingModuleById(UUID id) {
        return trainingModuleRepository.findById(id)
            .orElseThrow(() -> new EntityNotFoundException("Training module not found with id: " + id));
    }

    // Update a training module
    @Transactional
    public TrainingModule updateTrainingModule(UUID id, TrainingModule updatedModule) {
        TrainingModule existingModule = trainingModuleRepository.findById(id)
            .orElseThrow(() -> new EntityNotFoundException("Training module not found with id: " + id));
        
        // Validate status transition
        if (existingModule.getStatus() == ModuleStatus.PUBLISHED && 
            updatedModule.getStatus() != ModuleStatus.PUBLISHED && 
            updatedModule.getStatus() != ModuleStatus.ARCHIVED) {
            throw new IllegalStateException("Published modules can only be archived, not returned to draft");
        }
        
        // Validate domain
        if (updatedModule.getDomain() != null && updatedModule.getDomain().getId() != null) {
            Domain domain = domainRepository.findById(updatedModule.getDomain().getId())
                .orElseThrow(() -> new EntityNotFoundException("Domain not found with id: " + updatedModule.getDomain().getId()));
            existingModule.setDomain(domain);
        }
        
        // Validate title uniqueness if title changes
        if (updatedModule.getTitle() != null && 
            !updatedModule.getTitle().equals(existingModule.getTitle()) && 
            existingModule.getDomain() != null) {
            Optional<TrainingModule> duplicate = trainingModuleRepository.findByTitleIgnoreCaseAndDomainExcludingSelf(
                updatedModule.getTitle(), existingModule.getDomain(), existingModule.getId());
            if (duplicate.isPresent()) {
                throw new IllegalArgumentException("A module with the title '" + updatedModule.getTitle() + 
                                                  "' already exists in this domain");
            }
        }
        
        // Update fields
        if (updatedModule.getTitle() != null) {
            existingModule.setTitle(updatedModule.getTitle());
        }
        if (updatedModule.getDescription() != null) {
            existingModule.setDescription(updatedModule.getDescription());
        }
        if (updatedModule.getStatus() != null) {
            existingModule.setStatus(updatedModule.getStatus());
        }
        if (updatedModule.getPassingScore() != null) {
            existingModule.setPassingScore(updatedModule.getPassingScore());
        }
        if (updatedModule.getEstimatedDuration() != null) {
            existingModule.setEstimatedDuration(updatedModule.getEstimatedDuration());
        }
        if (updatedModule.getIconUrl() != null) {
            existingModule.setIconUrl(updatedModule.getIconUrl());
        }
        
        return trainingModuleRepository.save(existingModule);
    }

    // Delete a training module
    @Transactional
    public void deleteTrainingModule(UUID id) {
        TrainingModule module = trainingModuleRepository.findById(id)
            .orElseThrow(() -> new EntityNotFoundException("Training module not found with id: " + id));
        
        // Can't delete published modules
        if (module.getStatus() == ModuleStatus.PUBLISHED) {
            throw new IllegalStateException("Cannot delete a published module. Archive it first.");
        }
        
        trainingModuleRepository.deleteById(id);
    }
    
    // Publish a module
    @Transactional
    public TrainingModule publishModule(UUID id) {
        TrainingModule module = trainingModuleRepository.findById(id)
            .orElseThrow(() -> new EntityNotFoundException("Training module not found with id: " + id));
        
        // Validate module has at least one component
        if (moduleComponentRepository.countByTrainingModule(module) == 0) {
            throw new IllegalStateException("Cannot publish a module with no components");
        }
        
        module.setStatus(ModuleStatus.PUBLISHED);
        return trainingModuleRepository.save(module);
    }
    
    // Archive a module
    @Transactional
    public TrainingModule archiveModule(UUID id) {
        TrainingModule module = trainingModuleRepository.findById(id)
            .orElseThrow(() -> new EntityNotFoundException("Training module not found with id: " + id));
        
        module.setStatus(ModuleStatus.ARCHIVED);
        return trainingModuleRepository.save(module);
    }
    
    // Clone a module
    @Transactional
    public TrainingModule cloneModule(UUID id) {
        TrainingModule sourceModule = trainingModuleRepository.findById(id)
            .orElseThrow(() -> new EntityNotFoundException("Training module not found with id: " + id));
        
        // Create a new module with same properties
        TrainingModule clonedModule = new TrainingModule();
        clonedModule.setTitle(sourceModule.getTitle() + " (Clone)");
        clonedModule.setDescription(sourceModule.getDescription());
        clonedModule.setDomain(sourceModule.getDomain());
        clonedModule.setStatus(ModuleStatus.DRAFT);
        clonedModule.setPassingScore(sourceModule.getPassingScore());
        clonedModule.setEstimatedDuration(sourceModule.getEstimatedDuration());
        clonedModule.setIconUrl(sourceModule.getIconUrl());
        
        // Save the cloned module
        clonedModule = trainingModuleRepository.save(clonedModule);
        
        // TODO: Clone components and questions in a separate service method
        
        return clonedModule;
    }
}