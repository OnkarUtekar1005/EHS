package com.ehs.elearning.controller;

import com.ehs.elearning.model.*;
import com.ehs.elearning.payload.request.ModuleRequest;
import com.ehs.elearning.payload.response.MessageResponse;
import com.ehs.elearning.repository.DomainRepository;
import com.ehs.elearning.repository.TrainingModuleRepository;
import com.ehs.elearning.repository.UserRepository;
import com.ehs.elearning.security.UserDetailsImpl;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/modules")
public class TrainingModuleController {

    @Autowired
    private TrainingModuleRepository moduleRepository;
    
    @Autowired
    private DomainRepository domainRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    // Get all modules with optional filtering
    @GetMapping
    public ResponseEntity<?> getAllModules(
            @RequestParam(required = false) UUID domainId,
            @RequestParam(required = false) ModuleStatus status,
            @RequestParam(required = false) UUID createdBy) {
        
        if (domainId != null && status != null) {
            return domainRepository.findById(domainId)
                    .map(domain -> ResponseEntity.ok(moduleRepository.findByDomainAndStatus(domain, status)))
                    .orElse(ResponseEntity.notFound().build());
        } else if (domainId != null) {
            return domainRepository.findById(domainId)
                    .map(domain -> ResponseEntity.ok(moduleRepository.findByDomain(domain)))
                    .orElse(ResponseEntity.notFound().build());
        } else if (status != null) {
            return ResponseEntity.ok(moduleRepository.findByStatus(status));
        } else if (createdBy != null) {
            return userRepository.findById(createdBy)
                    .map(user -> ResponseEntity.ok(moduleRepository.findByCreatedBy(user)))
                    .orElse(ResponseEntity.notFound().build());
        } else {
            return ResponseEntity.ok(moduleRepository.findAll());
        }
    }
    
    // Get module by ID
    @GetMapping("/{id}")
    public ResponseEntity<?> getModuleById(@PathVariable UUID id) {
        return moduleRepository.findById(id)
                .map(module -> ResponseEntity.ok(module))
                .orElse(ResponseEntity.notFound().build());
    }
    
    // Create new module - FIXED VERSION
    @PostMapping
    public ResponseEntity<?> createModule(@Valid @RequestBody ModuleRequest moduleRequest) {
        // Get current user
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        
        // Find user first
        Optional<Users> userOpt = userRepository.findById(userDetails.getId());
        if (!userOpt.isPresent()) {
            return ResponseEntity.badRequest().body(new MessageResponse("Error: User not found."));
        }
        
        // Find domain
        Optional<Domain> domainOpt = domainRepository.findById(moduleRequest.getDomainId());
        if (!domainOpt.isPresent()) {
            return ResponseEntity.badRequest().body(new MessageResponse("Error: Domain not found."));
        }
        
        // Create the module
        Users user = userOpt.get();
        Domain domain = domainOpt.get();
        
        TrainingModule module = new TrainingModule(
                moduleRequest.getTitle(),
                moduleRequest.getDescription(),
                domain,
                user
        );
        
        module.setRequiredCompletionScore(moduleRequest.getRequiredCompletionScore());
        module.setEstimatedDuration(moduleRequest.getEstimatedDuration());
        
        if (moduleRequest.getStatus() != null) {
            module.setStatus(moduleRequest.getStatus());
        }
        
        TrainingModule newModule = moduleRepository.save(module);
        return ResponseEntity.ok(newModule);
    }
    
    // Update module
    @PutMapping("/{id}")
    public ResponseEntity<?> updateModule(@PathVariable UUID id, @Valid @RequestBody ModuleRequest moduleRequest) {
        Optional<TrainingModule> moduleOpt = moduleRepository.findById(id);
        if (!moduleOpt.isPresent()) {
            return ResponseEntity.notFound().build();
        }
        
        Optional<Domain> domainOpt = domainRepository.findById(moduleRequest.getDomainId());
        if (!domainOpt.isPresent()) {
            return ResponseEntity.badRequest().body(new MessageResponse("Error: Domain not found."));
        }
        
        TrainingModule module = moduleOpt.get();
        Domain domain = domainOpt.get();
        
        module.setTitle(moduleRequest.getTitle());
        module.setDescription(moduleRequest.getDescription());
        module.setDomain(domain);
        
        if (moduleRequest.getRequiredCompletionScore() != null) {
            module.setRequiredCompletionScore(moduleRequest.getRequiredCompletionScore());
        }
        
        if (moduleRequest.getEstimatedDuration() != null) {
            module.setEstimatedDuration(moduleRequest.getEstimatedDuration());
        }
        
        if (moduleRequest.getStatus() != null) {
            module.setStatus(moduleRequest.getStatus());
        }
        
        TrainingModule updatedModule = moduleRepository.save(module);
        return ResponseEntity.ok(updatedModule);
    }
    
    // Delete module
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteModule(@PathVariable UUID id) {
        return moduleRepository.findById(id)
                .map(module -> {
                    moduleRepository.delete(module);
                    return ResponseEntity.ok(new MessageResponse("Module deleted successfully."));
                })
                .orElse(ResponseEntity.notFound().build());
    }
    
    // Get modules by domain
    @GetMapping("/domain/{domainId}")
    public ResponseEntity<?> getModulesByDomain(@PathVariable UUID domainId) {
        return domainRepository.findById(domainId)
                .map(domain -> ResponseEntity.ok(moduleRepository.findByDomain(domain)))
                .orElse(ResponseEntity.notFound().build());
    }
    
    // Publish draft module
    @PostMapping("/{id}/publish")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> publishModule(@PathVariable UUID id) {
        return moduleRepository.findById(id)
                .map(module -> {
                    if (module.getStatus() != ModuleStatus.DRAFT) {
                        return ResponseEntity.badRequest().body(new MessageResponse("Error: Only draft modules can be published."));
                    }
                    
                    module.setStatus(ModuleStatus.PUBLISHED);
                    TrainingModule publishedModule = moduleRepository.save(module);
                    return ResponseEntity.ok(publishedModule);
                })
                .orElse(ResponseEntity.notFound().build());
    }
    
    // Archive published module
    @PostMapping("/{id}/archive")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> archiveModule(@PathVariable UUID id) {
        return moduleRepository.findById(id)
                .map(module -> {
                    if (module.getStatus() != ModuleStatus.PUBLISHED) {
                        return ResponseEntity.badRequest().body(new MessageResponse("Error: Only published modules can be archived."));
                    }
                    
                    module.setStatus(ModuleStatus.ARCHIVED);
                    TrainingModule archivedModule = moduleRepository.save(module);
                    return ResponseEntity.ok(archivedModule);
                })
                .orElse(ResponseEntity.notFound().build());
    }
    
    // Clone existing module - FIXED VERSION
    @PostMapping("/{id}/clone")
    public ResponseEntity<?> cloneModule(@PathVariable UUID id) {
        Optional<TrainingModule> sourceModuleOpt = moduleRepository.findById(id);
        if (!sourceModuleOpt.isPresent()) {
            return ResponseEntity.notFound().build();
        }
        
        // Get current user
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        
        Optional<Users> userOpt = userRepository.findById(userDetails.getId());
        if (!userOpt.isPresent()) {
            return ResponseEntity.badRequest().body(new MessageResponse("Error: User not found."));
        }
        
        TrainingModule sourceModule = sourceModuleOpt.get();
        Users user = userOpt.get();
        
        // Create new module with copied properties
        TrainingModule clonedModule = new TrainingModule(
                sourceModule.getTitle() + " (Clone)",
                sourceModule.getDescription(),
                sourceModule.getDomain(),
                user
        );
        
        clonedModule.setRequiredCompletionScore(sourceModule.getRequiredCompletionScore());
        clonedModule.setEstimatedDuration(sourceModule.getEstimatedDuration());
        clonedModule.setStatus(ModuleStatus.DRAFT); // Always start as draft
        
        // Save new module
        TrainingModule savedModule = moduleRepository.save(clonedModule);
        return ResponseEntity.ok(savedModule);
    }
    
    // Search modules by title
    @GetMapping("/search")
    public ResponseEntity<?> searchModules(@RequestParam String query) {
        List<TrainingModule> modules = moduleRepository.findByTitleContainingIgnoreCase(query);
        return ResponseEntity.ok(modules);
    }
}