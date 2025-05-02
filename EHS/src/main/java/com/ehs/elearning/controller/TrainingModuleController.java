package com.ehs.elearning.controller;

import com.ehs.elearning.model.ComponentType;
import com.ehs.elearning.model.Domain;
import com.ehs.elearning.model.ModuleComponent;
import com.ehs.elearning.model.ModuleStatus;
import com.ehs.elearning.model.Question;
import com.ehs.elearning.model.QuestionType;
import com.ehs.elearning.model.Role;
import com.ehs.elearning.model.TrainingModule;
import com.ehs.elearning.model.Users;
import com.ehs.elearning.payload.request.ComponentRequest;
import com.ehs.elearning.payload.request.ModuleRequest;
import com.ehs.elearning.payload.response.MessageResponse;
import com.ehs.elearning.repository.DomainRepository;
import com.ehs.elearning.repository.ModuleComponentRepository;
import com.ehs.elearning.repository.QuestionRepository;
import com.ehs.elearning.repository.TrainingModuleRepository;
import com.ehs.elearning.repository.UserRepository;
import com.ehs.elearning.security.UserDetailsImpl;
import com.fasterxml.jackson.databind.ObjectMapper;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import jakarta.transaction.Transactional;
import jakarta.validation.Valid;

import java.util.*;
import java.util.stream.Collectors;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api")
public class TrainingModuleController {

    @Autowired
    private TrainingModuleRepository moduleRepository;
    
    @Autowired
    private DomainRepository domainRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private ModuleComponentRepository componentRepository;
    
    // Add this helper method to handle saving assessment questions
    @Autowired
    private QuestionRepository questionRepository;
    
    
    // Get all published modules (for all users)
    @GetMapping("/modules/all")
    public ResponseEntity<List<TrainingModule>> getAllPublishedModules(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "title") String sortBy) {
        
        try {
            // Create pageable object for pagination and sorting
            Pageable paging = PageRequest.of(page, size, Sort.by(sortBy));
            
            // Get current user
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
            UUID userId = userDetails.getId();
            
            Optional<Users> userOpt = userRepository.findById(userId);
            if (!userOpt.isPresent()) {
                return ResponseEntity.badRequest().body(new ArrayList<>());
            }
            
            Users user = userOpt.get();
            boolean isAdmin = user.getRole() == Role.ADMIN;
            
            Page<TrainingModule> pageModules;
            
            if (isAdmin) {
                // Admins can see all modules
                pageModules = moduleRepository.findAll(paging);
            } else {
                // Regular users can only see published modules
                pageModules = moduleRepository.findByStatus(ModuleStatus.PUBLISHED, paging);
            }
            
            return ResponseEntity.ok()
                    .header("X-Total-Pages", String.valueOf(pageModules.getTotalPages()))
                    .header("X-Total-Elements", String.valueOf(pageModules.getTotalElements()))
                    .body(pageModules.getContent());
            
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(new ArrayList<>());
        }
    }
    
    // Get all modules with filtering options (with domain access information)
    @GetMapping("/modules")
    public ResponseEntity<List<Map<String, Object>>> getAllModules(
            @RequestParam(required = false) String title,
            @RequestParam(required = false) UUID domainId,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "title") String sortBy) {
        
        try {
            // Get current authenticated user
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
            UUID userId = userDetails.getId();
            
            // Fetch the user to access their domains
            Optional<Users> userOpt = userRepository.findById(userId);
            if (!userOpt.isPresent()) {
                return ResponseEntity.badRequest().body(new ArrayList<>());
            }
            
            Users user = userOpt.get();
            boolean isAdmin = user.getRole() == Role.ADMIN;
            Set<Domain> userDomains = user.getDomains();
            
            // Create pageable object for pagination and sorting
            Pageable paging = PageRequest.of(page, size, Sort.by(sortBy));
            Page<TrainingModule> pageModules;
            
            // Apply filters if provided
            if (title != null && !title.isEmpty()) {
                if (domainId != null && status != null && !status.isEmpty()) {
                    // Filter by title, domain, and status
                    Optional<Domain> domain = domainRepository.findById(domainId);
                    if (domain.isPresent()) {
                        pageModules = moduleRepository.findByTitleContainingIgnoreCaseAndDomainAndStatus(
                                title, domain.get(), ModuleStatus.valueOf(status), paging);
                    } else {
                        return ResponseEntity.badRequest().body(new ArrayList<>());
                    }
                } else if (domainId != null) {
                    // Filter by title and domain
                    Optional<Domain> domain = domainRepository.findById(domainId);
                    if (domain.isPresent()) {
                        pageModules = moduleRepository.findByTitleContainingIgnoreCaseAndDomain(
                                title, domain.get(), paging);
                    } else {
                        return ResponseEntity.badRequest().body(new ArrayList<>());
                    }
                } else if (status != null && !status.isEmpty()) {
                    // Filter by title and status
                    pageModules = moduleRepository.findByTitleContainingIgnoreCaseAndStatus(
                            title, ModuleStatus.valueOf(status), paging);
                } else {
                    // Filter by title only
                    pageModules = moduleRepository.findByTitleContainingIgnoreCase(title, paging);
                }
            } else if (domainId != null) {
                Optional<Domain> domain = domainRepository.findById(domainId);
                if (domain.isPresent()) {
                    if (status != null && !status.isEmpty()) {
                        // Filter by domain and status
                        pageModules = moduleRepository.findByDomainAndStatus(
                                domain.get(), ModuleStatus.valueOf(status), paging);
                    } else {
                        // Filter by domain only
                        pageModules = moduleRepository.findByDomain(domain.get(), paging);
                    }
                } else {
                    return ResponseEntity.badRequest().body(new ArrayList<>());
                }
            } else if (status != null && !status.isEmpty()) {
                // Filter by status only
                pageModules = moduleRepository.findByStatus(ModuleStatus.valueOf(status), paging);
            } else {
                // No filters - get modules based on user role
                if (isAdmin) {
                    pageModules = moduleRepository.findAll(paging);
                } else {
                    // Regular users can see all published modules
                    pageModules = moduleRepository.findByStatus(ModuleStatus.PUBLISHED, paging);
                }
            }
            
            // Convert modules to include access information
            List<Map<String, Object>> modulesWithAccessInfo = pageModules.getContent().stream()
                    .map(module -> {
                        Map<String, Object> moduleInfo = new HashMap<>();
                        moduleInfo.put("id", module.getId());
                        moduleInfo.put("title", module.getTitle());
                        moduleInfo.put("description", module.getDescription());
                        moduleInfo.put("domain", module.getDomain());
                        moduleInfo.put("status", module.getStatus());
                        moduleInfo.put("createdAt", module.getCreatedAt());
                        moduleInfo.put("estimatedDuration", module.getEstimatedDuration());
                        moduleInfo.put("requiredCompletionScore", module.getRequiredCompletionScore());
                        
                        // Check if user has access to this module
                        boolean hasAccess = isAdmin || 
                                (module.getStatus() == ModuleStatus.PUBLISHED && 
                                 (userDomains.isEmpty() || userDomains.contains(module.getDomain())));
                        
                        moduleInfo.put("hasAccess", hasAccess);
                        return moduleInfo;
                    })
                    .collect(Collectors.toList());
            
            return ResponseEntity.ok()
                    .header("X-Total-Pages", String.valueOf(pageModules.getTotalPages()))
                    .header("X-Total-Elements", String.valueOf(pageModules.getTotalElements()))
                    .body(modulesWithAccessInfo);
            
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(new ArrayList<>());
        }
    }
    
    // Get modules by domain
    @GetMapping("/modules/domain/{domainId}")
    public ResponseEntity<?> getModulesByDomain(@PathVariable UUID domainId) {
        try {
            Optional<Domain> domain = domainRepository.findById(domainId);
            if (!domain.isPresent()) {
                return ResponseEntity.notFound().build();
            }
            
            // Get current user
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
            UUID userId = userDetails.getId();
            
            Optional<Users> userOpt = userRepository.findById(userId);
            if (!userOpt.isPresent()) {
                return ResponseEntity.badRequest().body(new ArrayList<>());
            }
            
            Users user = userOpt.get();
            boolean isAdmin = user.getRole() == Role.ADMIN;
            
            List<TrainingModule> modules;
            
            if (isAdmin) {
                // Admins can see all modules in the domain
                modules = moduleRepository.findByDomain(domain.get());
            } else {
                // Regular users can only see published modules
                modules = moduleRepository.findByDomainAndStatus(domain.get(), ModuleStatus.PUBLISHED);
            }
            
            // Add access information to modules
            List<Map<String, Object>> modulesWithAccess = modules.stream()
                    .map(module -> {
                        Map<String, Object> moduleInfo = new HashMap<>();
                        moduleInfo.put("module", module);
                        
                        // Check if user has access
                        boolean hasAccess = isAdmin || 
                                (module.getStatus() == ModuleStatus.PUBLISHED && 
                                 (user.getDomains().isEmpty() || user.getDomains().contains(module.getDomain())));
                        
                        moduleInfo.put("hasAccess", hasAccess);
                        return moduleInfo;
                    })
                    .collect(Collectors.toList());
            
            return ResponseEntity.ok(modulesWithAccess);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(new ArrayList<>());
        }
    }
    
    // Get module by ID
    @GetMapping("/modules/{id}")
    public ResponseEntity<?> getModuleById(@PathVariable UUID id) {
        Optional<TrainingModule> moduleData = moduleRepository.findById(id);
        
        if (!moduleData.isPresent()) {
            return ResponseEntity.notFound().build();
        }
        
        TrainingModule module = moduleData.get();
        
        // Get current user
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        UUID userId = userDetails.getId();
        
        Optional<Users> userOpt = userRepository.findById(userId);
        if (!userOpt.isPresent()) {
            return ResponseEntity.badRequest().build();
        }
        
        Users user = userOpt.get();
        boolean isAdmin = user.getRole() == Role.ADMIN;
        
        // Regular users can only access published modules
        if (!isAdmin && module.getStatus() != ModuleStatus.PUBLISHED) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(new MessageResponse("This module is not published"));
        }
        
        // Create response with module and access information
        Map<String, Object> response = new HashMap<>();
        response.put("module", module);
        
        // Check if user has access to this module
        boolean hasAccess = isAdmin || 
                (module.getStatus() == ModuleStatus.PUBLISHED && 
                 (user.getDomains().isEmpty() || user.getDomains().contains(module.getDomain())));
        
        // If user doesn't have domain access but module is public, they can still view it
        response.put("hasAccess", hasAccess);
        
        // If user doesn't have direct domain access, provide information about joining
        if (!isAdmin && module.getStatus() == ModuleStatus.PUBLISHED && 
            !user.getDomains().isEmpty() && !user.getDomains().contains(module.getDomain())) {
            response.put("requiresDomainAccess", true);
            response.put("domainName", module.getDomain().getName());
        } else {
            response.put("requiresDomainAccess", false);
        }
        
        return ResponseEntity.ok(response);
    }
    
    // Get available modules for the current user
    @GetMapping("/modules/available")
    public ResponseEntity<?> getAvailableModules(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        
        try {
            // Get current user
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
            UUID userId = userDetails.getId();
            
            Optional<Users> userOpt = userRepository.findById(userId);
            if (!userOpt.isPresent()) {
                return ResponseEntity.badRequest().body(new MessageResponse("User not found"));
            }
            
            Users user = userOpt.get();
            boolean isAdmin = user.getRole() == Role.ADMIN;
            
            Pageable pageable = PageRequest.of(page, size, Sort.by("title"));
            Page<TrainingModule> modules;
            
            // For admins, return all modules
            if (isAdmin) {
                modules = moduleRepository.findAll(pageable);
                return ResponseEntity.ok()
                        .header("X-Total-Count", String.valueOf(modules.getTotalElements()))
                        .header("X-Total-Pages", String.valueOf(modules.getTotalPages()))
                        .body(modules.getContent());
            }
            
            // For regular users, return all published modules
            modules = moduleRepository.findByStatus(ModuleStatus.PUBLISHED, pageable);
            
            // Add access information
            List<Map<String, Object>> modulesWithAccess = modules.getContent().stream()
                    .map(module -> {
                        Map<String, Object> moduleInfo = new HashMap<>();
                        moduleInfo.put("id", module.getId());
                        moduleInfo.put("title", module.getTitle());
                        moduleInfo.put("description", module.getDescription());
                        moduleInfo.put("domain", module.getDomain());
                        moduleInfo.put("status", module.getStatus());
                        moduleInfo.put("estimatedDuration", module.getEstimatedDuration());
                        
                        // Check if user has access to this module through domain assignment
                        boolean assignedAccess = user.getDomains().isEmpty() || user.getDomains().contains(module.getDomain());
                        moduleInfo.put("hasAssignedAccess", assignedAccess);
                        
                        // All published modules are available for browsing even without domain assignment
                        moduleInfo.put("canView", true);
                        
                        return moduleInfo;
                    })
                    .collect(Collectors.toList());
            
            return ResponseEntity.ok()
                    .header("X-Total-Count", String.valueOf(modules.getTotalElements()))
                    .body(modulesWithAccess);
            
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new MessageResponse("Error fetching available modules: " + e.getMessage()));
        }
    }
    

    @PostMapping("/modules")
    public ResponseEntity<?> createModule(@Valid @RequestBody ModuleRequest moduleRequest) {
        try {
            // Get current user as creator
        	System.out.println("Received module request: " + moduleRequest);
            UserDetailsImpl userDetails = (UserDetailsImpl) SecurityContextHolder.getContext()
                    .getAuthentication().getPrincipal();
            Optional<Users> user = userRepository.findById(userDetails.getId());
            
            if (!user.isPresent()) {
                return ResponseEntity.badRequest()
                        .body(new MessageResponse("Error: Invalid user."));
            }
            
            // Get domain
            Optional<Domain> domain = domainRepository.findById(moduleRequest.getDomainId());
            if (!domain.isPresent()) {
                return ResponseEntity.badRequest()
                        .body(new MessageResponse("Error: Domain not found."));
            }
            
            // Create new module
            TrainingModule module = new TrainingModule();
            module.setTitle(moduleRequest.getTitle());
            module.setDescription(moduleRequest.getDescription());
            module.setDomain(domain.get());
            module.setCreatedBy(user.get());
            module.setStatus(ModuleStatus.DRAFT);
            
            if (moduleRequest.getEstimatedDuration() != null) {
                module.setEstimatedDuration(moduleRequest.getEstimatedDuration());
            }
            
            if (moduleRequest.getRequiredCompletionScore() != null) {
                module.setRequiredCompletionScore(moduleRequest.getRequiredCompletionScore());
            }
            
            // Save module first to get the ID
            TrainingModule savedModule = moduleRepository.save(module);
            
            // Process components if they exist
            if (moduleRequest.getComponents() != null && !moduleRequest.getComponents().isEmpty()) {
                int seqOrder = 1;
                for (ComponentRequest compRequest : moduleRequest.getComponents()) {
                    ModuleComponent component = new ModuleComponent();
                    component.setTrainingModule(savedModule);
                    component.setTitle(compRequest.getTitle());
                    component.setType(compRequest.getType());
                    component.setDescription(compRequest.getDescription());
                    
                    // Set sequence order either from request or incrementally
                    if (compRequest.getSequenceOrder() != null) {
                        component.setSequenceOrder(compRequest.getSequenceOrder());
                    } else {
                        component.setSequenceOrder(seqOrder++);
                    }
                    
                    // Set other properties
                    if (compRequest.getRequiredToAdvance() != null) {
                        component.setRequiredToAdvance(compRequest.getRequiredToAdvance());
                    } else {
                        component.setRequiredToAdvance(true); // Default value
                    }
                    
                    if (compRequest.getEstimatedDuration() != null) {
                        component.setEstimatedDuration(compRequest.getEstimatedDuration());
                    }
                    
                    // Convert component data to JSON string if necessary
                    if (compRequest.getData() != null) {
                        ObjectMapper objectMapper = new ObjectMapper();
                        try {
                            // Store data as JSON in content field
                            component.setContent(objectMapper.writeValueAsString(compRequest.getData()));
                            
                            // Save the component first to get its ID
                            ModuleComponent savedComponent = componentRepository.save(component);
                            
                            // If this is an assessment component, extract and save questions
                            if (component.getType() == ComponentType.PRE_ASSESSMENT || 
                                component.getType() == ComponentType.POST_ASSESSMENT) {
                                saveAssessmentQuestions(savedComponent, compRequest.getData());
                            }
                        } catch (Exception e) {
                            System.err.println("Error serializing component data: " + e.getMessage());
                            e.printStackTrace();
                        }
                    } else {
                        // Use content field from request if data is null
                        component.setContent(compRequest.getContent());
                        
                        // Save the component without special processing
                        componentRepository.save(component);
                    }
                }
            }
            
            return ResponseEntity.status(HttpStatus.CREATED).body(savedModule);
            
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new MessageResponse("Error creating module: " + e.getMessage()));
        }
    }

    private void saveAssessmentQuestions(ModuleComponent component, Map<String, Object> data) {
        try {
            if (data == null || !data.containsKey("questions")) {
                return;
            }
            
            List<Map<String, Object>> questionsList = (List<Map<String, Object>>) data.get("questions");
            
            int sequenceOrder = 1;
            for (Map<String, Object> questionData : questionsList) {
                Question question = new Question();
                question.setComponent(component);
                question.setText((String) questionData.get("text"));
                question.setType(QuestionType.valueOf((String) questionData.get("type")));
                question.setSequenceOrder(sequenceOrder++);
                
                // Handle points
                if (questionData.containsKey("points")) {
                    question.setPoints((Integer) questionData.get("points"));
                } else {
                    question.setPoints(1); // Default points
                }
                
                // Handle options
                if (questionData.containsKey("options")) {
                    ObjectMapper objectMapper = new ObjectMapper();
                    question.setOptions(objectMapper.writeValueAsString(questionData.get("options")));
                    
                    // Find correct answer
                    List<Map<String, Object>> options = (List<Map<String, Object>>) questionData.get("options");
                    for (Map<String, Object> option : options) {
                        if (Boolean.TRUE.equals(option.get("correct"))) {
                            question.setCorrectAnswer((String) option.get("text"));
                            break;
                        }
                    }
                }
                
                // Handle explanation
                if (questionData.containsKey("explanation")) {
                    question.setExplanation((String) questionData.get("explanation"));
                }
                
                // Save the question
                questionRepository.save(question);
            }
        } catch (Exception e) {
            System.err.println("Error saving assessment questions: " + e.getMessage());
            e.printStackTrace();
        }
    }
    
    // Update module
    @PutMapping("/modules/{id}")
    public ResponseEntity<?> updateModule(
            @PathVariable UUID id,
            @Valid @RequestBody ModuleRequest moduleRequest) {
        
        Optional<TrainingModule> moduleData = moduleRepository.findById(id);
        
        if (moduleData.isPresent()) {
            TrainingModule module = moduleData.get();
            
            // Check if current user is authorized to edit this module
            UserDetailsImpl userDetails = (UserDetailsImpl) SecurityContextHolder.getContext()
                    .getAuthentication().getPrincipal();
            
            // Admin can edit any module, normal users can only edit their own
            if (!userDetails.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN")) && 
                    !module.getCreatedBy().getId().equals(userDetails.getId())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(new MessageResponse("Error: You are not authorized to edit this module."));
            }
            
            // Update basic properties
            module.setTitle(moduleRequest.getTitle());
            module.setDescription(moduleRequest.getDescription());
            
            if (moduleRequest.getEstimatedDuration() != null) {
                module.setEstimatedDuration(moduleRequest.getEstimatedDuration());
            }
            
            if (moduleRequest.getRequiredCompletionScore() != null) {
                module.setRequiredCompletionScore(moduleRequest.getRequiredCompletionScore());
            }
            
            // Update domain if provided
            if (moduleRequest.getDomainId() != null) {
                Optional<Domain> domain = domainRepository.findById(moduleRequest.getDomainId());
                if (domain.isPresent()) {
                    module.setDomain(domain.get());
                } else {
                    return ResponseEntity.badRequest()
                            .body(new MessageResponse("Error: Domain not found."));
                }
            }
            
            // Update status if provided and user is admin
            if (moduleRequest.getStatus() != null && 
                    userDetails.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"))) {
                try {
                    module.setStatus(ModuleStatus.valueOf(moduleRequest.getStatus()));
                } catch (IllegalArgumentException e) {
                    return ResponseEntity.badRequest()
                            .body(new MessageResponse("Error: Invalid status value."));
                }
            }
            
            TrainingModule updatedModule = moduleRepository.save(module);
            return ResponseEntity.ok(updatedModule);
            
        } else {
            return ResponseEntity.notFound().build();
        }
    }
    
    // Delete module
 // Delete module
    @DeleteMapping("/modules/{id}")
    @Transactional
    public ResponseEntity<MessageResponse> deleteModule(@PathVariable UUID id) {
        try {
            // Check if current user is authorized to delete this module
            UserDetailsImpl userDetails = (UserDetailsImpl) SecurityContextHolder.getContext()
                    .getAuthentication().getPrincipal();
            
            // Only admins can delete modules
            if (!userDetails.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"))) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(new MessageResponse("Error: You are not authorized to delete modules."));
            }
            
            // Check if module exists
            Optional<TrainingModule> moduleOpt = moduleRepository.findById(id);
            if (!moduleOpt.isPresent()) {
                return ResponseEntity.notFound().build();
            }
            
            TrainingModule module = moduleOpt.get();
            
            // Get all components
            List<ModuleComponent> components = componentRepository.findByTrainingModuleOrderBySequenceOrderAsc(module);
            
            // For each component, clean up related entities first
            for (ModuleComponent component : components) {
                // Delete questions for this component
                List<Question> questions = questionRepository.findByComponentOrderBySequenceOrderAsc(component);
                if (!questions.isEmpty()) {
                    // Delete each question explicitly
                    questionRepository.deleteAll(questions);
                }
                
                // If there are material associations, handle them too
                // You may need to inject the appropriate repository if not already present
                // materialAssociationRepository.deleteByComponent(component);
            }
            
            // Now delete components 
            componentRepository.deleteAll(components);
            
            // Finally delete the module itself
            moduleRepository.delete(module);
            
            return ResponseEntity.ok(new MessageResponse("Module deleted successfully."));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new MessageResponse("Error deleting module: " + e.getMessage()));
        }
    }
    
    // Publish module (change status to PUBLISHED)
    @PostMapping("/modules/{id}/publish")
    public ResponseEntity<?> publishModule(@PathVariable UUID id) {
        Optional<TrainingModule> moduleData = moduleRepository.findById(id);
        
        if (moduleData.isPresent()) {
            // Check if current user is authorized to publish this module
            UserDetailsImpl userDetails = (UserDetailsImpl) SecurityContextHolder.getContext()
                    .getAuthentication().getPrincipal();
            
            // Only admins can publish modules
            if (!userDetails.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"))) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(new MessageResponse("Error: You are not authorized to publish modules."));
            }
            
            TrainingModule module = moduleData.get();
            module.setStatus(ModuleStatus.PUBLISHED);
            
            moduleRepository.save(module);
            return ResponseEntity.ok(new MessageResponse("Module published successfully."));
        } else {
            return ResponseEntity.notFound().build();
        }
    }
    
    // Archive module (change status to ARCHIVED)
    @PostMapping("/modules/{id}/archive")
    public ResponseEntity<?> archiveModule(@PathVariable UUID id) {
        Optional<TrainingModule> moduleData = moduleRepository.findById(id);
        
        if (moduleData.isPresent()) {
            // Check if current user is authorized to archive this module
            UserDetailsImpl userDetails = (UserDetailsImpl) SecurityContextHolder.getContext()
                    .getAuthentication().getPrincipal();
            
            // Only admins can archive modules
            if (!userDetails.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"))) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(new MessageResponse("Error: You are not authorized to archive modules."));
            }
            
            TrainingModule module = moduleData.get();
            module.setStatus(ModuleStatus.ARCHIVED);
            
            moduleRepository.save(module);
            return ResponseEntity.ok(new MessageResponse("Module archived successfully."));
        } else {
            return ResponseEntity.notFound().build();
        }
    }
    
    // Clone module
    @PostMapping("/modules/{id}/clone")
    public ResponseEntity<?> cloneModule(@PathVariable UUID id) {
        Optional<TrainingModule> moduleData = moduleRepository.findById(id);
        
        if (moduleData.isPresent()) {
            TrainingModule originalModule = moduleData.get();
            
            // Get current user as creator for the clone
            UserDetailsImpl userDetails = (UserDetailsImpl) SecurityContextHolder.getContext()
                    .getAuthentication().getPrincipal();
            Optional<Users> user = userRepository.findById(userDetails.getId());
            
            if (!user.isPresent()) {
                return ResponseEntity.badRequest()
                        .body(new MessageResponse("Error: Invalid user."));
            }
            
            // Create new module as a clone
            TrainingModule clonedModule = new TrainingModule();
            clonedModule.setTitle(originalModule.getTitle() + " (Clone)");
            clonedModule.setDescription(originalModule.getDescription());
            clonedModule.setDomain(originalModule.getDomain());
            clonedModule.setCreatedBy(user.get());
            clonedModule.setStatus(ModuleStatus.DRAFT); // Always set cloned modules to DRAFT
            clonedModule.setEstimatedDuration(originalModule.getEstimatedDuration());
            clonedModule.setRequiredCompletionScore(originalModule.getRequiredCompletionScore());
            
            TrainingModule savedClone = moduleRepository.save(clonedModule);
            
            // TODO: Clone components and their associated data (questions, materials, etc.)
            // This would typically be handled by a service layer
            
            return ResponseEntity.status(HttpStatus.CREATED).body(savedClone);
        } else {
            return ResponseEntity.notFound().build();
        }
    }
    
    // Get module statistics
    @GetMapping("/modules/{id}/stats")
    public ResponseEntity<?> getModuleStats(@PathVariable UUID id) {
        // Check if current user is authorized to view module statistics
        UserDetailsImpl userDetails = (UserDetailsImpl) SecurityContextHolder.getContext()
                .getAuthentication().getPrincipal();
        
        // Only admins can view module statistics
        if (!userDetails.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"))) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(new MessageResponse("Error: You are not authorized to view module statistics."));
        }
        
        Optional<TrainingModule> moduleData = moduleRepository.findById(id);
        
        if (moduleData.isPresent()) {
            TrainingModule module = moduleData.get();
            
            // Create a response with module statistics
            Map<String, Object> stats = new HashMap<>();
            stats.put("id", module.getId());
            stats.put("title", module.getTitle());
            stats.put("status", module.getStatus());
            stats.put("domain", module.getDomain().getName());
            
            // In a real implementation, you would fetch actual statistics here
            // such as completion rates, average scores, etc.
            stats.put("enrolledUsers", 0); // Placeholder
            stats.put("completedUsers", 0); // Placeholder
            stats.put("averageScore", 0.0); // Placeholder
            
            return ResponseEntity.ok(stats);
        } else {
            return ResponseEntity.notFound().build();
        }
    }
    
    // Get modules for user's interest domains (even if not assigned)
    @GetMapping("/modules/interests")
    public ResponseEntity<?> getModulesByUserInterests(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        
        try {
            // Get current user
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
            UUID userId = userDetails.getId();
            
            Optional<Users> userOpt = userRepository.findById(userId);
            if (!userOpt.isPresent()) {
                return ResponseEntity.badRequest().body(new MessageResponse("User not found"));
            }
            
            // Get all published modules
            Pageable pageable = PageRequest.of(page, size, Sort.by("title"));
            Page<TrainingModule> modules = moduleRepository.findByStatus(ModuleStatus.PUBLISHED, pageable);
            
            // Group modules by domain for easier browsing
            Map<String, List<Map<String, Object>>> modulesByDomain = new HashMap<>();
            
            for (TrainingModule module : modules.getContent()) {
                String domainName = module.getDomain().getName();
                
                if (!modulesByDomain.containsKey(domainName)) {
                    modulesByDomain.put(domainName, new ArrayList<>());
                }
                
                Map<String, Object> moduleInfo = new HashMap<>();
                moduleInfo.put("id", module.getId());
                moduleInfo.put("title", module.getTitle());
                moduleInfo.put("description", module.getDescription());
                moduleInfo.put("estimatedDuration", module.getEstimatedDuration());
                moduleInfo.put("domainId", module.getDomain().getId());
                
                modulesByDomain.get(domainName).add(moduleInfo);
            }
            
            return ResponseEntity.ok()
                    .header("X-Total-Count", String.valueOf(modules.getTotalElements()))
                    .body(modulesByDomain);
            
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new MessageResponse("Error fetching modules by interests: " + e.getMessage()));
        }
    }
    
    // Request access to a module's domain
    @PostMapping("/modules/{id}/request-access")
    public ResponseEntity<?> requestModuleAccess(@PathVariable UUID id) {
        try {
            // Get current user
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
            UUID userId = userDetails.getId();
            
            Optional<Users> userOpt = userRepository.findById(userId);
            Optional<TrainingModule> moduleOpt = moduleRepository.findById(id);
            
            if (!userOpt.isPresent() || !moduleOpt.isPresent()) {
                return ResponseEntity.notFound().build();
            }
            
            Users user = userOpt.get();
            TrainingModule module = moduleOpt.get();
            Domain domain = module.getDomain();
            
            // Check if user already has access to this domain
            if (user.getDomains().contains(domain)) {
                return ResponseEntity.badRequest()
                        .body(new MessageResponse("You already have access to this domain"));
            }
            
            // In a real implementation, you would:
            // 1. Create a domain access request record
            // 2. Notify administrators
            // 3. Track the status of the request
            
            // Return a success message
            return ResponseEntity.ok(new MessageResponse(
                    "Access request submitted for domain: " + domain.getName() + 
                    ". An administrator will review your request."));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new MessageResponse("Error requesting module access: " + e.getMessage()));
        }
    }
    
    // Get recommended modules for the current user
    @GetMapping("/modules/recommended")
    public ResponseEntity<?> getRecommendedModules(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "5") int size) {
        
        try {
            // Get current user
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
            UUID userId = userDetails.getId();
            
            Optional<Users> userOpt = userRepository.findById(userId);
            if (!userOpt.isPresent()) {
                return ResponseEntity.badRequest().body(new MessageResponse("User not found"));
            }
            
            Users user = userOpt.get();
            
            // In a real implementation, you would have sophisticated recommendation logic
            // For now, simply return the most recent published modules
            Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
            Page<TrainingModule> modules = moduleRepository.findByStatus(ModuleStatus.PUBLISHED, pageable);
            
            // Add recommendation reason to each module
            List<Map<String, Object>> recommendedModules = modules.getContent().stream()
                    .map(module -> {
                        Map<String, Object> moduleInfo = new HashMap<>();
                        moduleInfo.put("id", module.getId());
                        moduleInfo.put("title", module.getTitle());
                        moduleInfo.put("description", module.getDescription());
                        moduleInfo.put("domain", module.getDomain().getName());
                        moduleInfo.put("estimatedDuration", module.getEstimatedDuration());
                        
                        // Determine recommendation reason (placeholder logic)
                        String reason = "Recently added";
                        if (user.getDomains().contains(module.getDomain())) {
                            reason = "Matches your domain interests";
                        }
                        
                        moduleInfo.put("recommendationReason", reason);
                        return moduleInfo;
                    })
                    .collect(Collectors.toList());
            
            return ResponseEntity.ok(recommendedModules);
            
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new MessageResponse("Error fetching recommended modules: " + e.getMessage()));
        }
    }
    
    // Get recently added modules
    @GetMapping("/modules/recent")
    public ResponseEntity<?> getRecentModules(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "5") int size) {
        
        try {
            // Get current user
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
            UUID userId = userDetails.getId();
            
            Optional<Users> userOpt = userRepository.findById(userId);
            if (!userOpt.isPresent()) {
                return ResponseEntity.badRequest().body(new MessageResponse("User not found"));
            }
            
            Users user = userOpt.get();
            boolean isAdmin = user.getRole() == Role.ADMIN;
            
            // Get recently added modules
            Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
            Page<TrainingModule> modules;
            
            if (isAdmin) {
                // Admins can see all recently added modules
                modules = moduleRepository.findAll(pageable);
            } else {
                // Regular users can only see recently added published modules
                modules = moduleRepository.findByStatus(ModuleStatus.PUBLISHED, pageable);
            }
            
            return ResponseEntity.ok()
                    .header("X-Total-Count", String.valueOf(modules.getTotalElements()))
                    .body(modules.getContent());
            
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new MessageResponse("Error fetching recent modules: " + e.getMessage()));
        }
    }
    
    // Get popular modules (placeholder - in a real implementation, this would be based on enrollment/completion data)
    @GetMapping("/modules/popular")
    public ResponseEntity<?> getPopularModules(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "5") int size) {
        
        try {
            // For now, this is the same implementation as recent modules
            // In a real application, you would track module popularity metrics
            
            // Get current user
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
            UUID userId = userDetails.getId();
            
            Optional<Users> userOpt = userRepository.findById(userId);
            if (!userOpt.isPresent()) {
                return ResponseEntity.badRequest().body(new MessageResponse("User not found"));
            }
            
            // Get published modules (the order would normally be by popularity metrics)
            Pageable pageable = PageRequest.of(page, size, Sort.by("title"));
            Page<TrainingModule> modules = moduleRepository.findByStatus(ModuleStatus.PUBLISHED, pageable);
            
            // Add placeholder popularity metrics
            List<Map<String, Object>> popularModules = modules.getContent().stream()
                    .map(module -> {
                        Map<String, Object> moduleInfo = new HashMap<>();
                        moduleInfo.put("id", module.getId());
                        moduleInfo.put("title", module.getTitle());
                        moduleInfo.put("description", module.getDescription());
                        moduleInfo.put("domain", module.getDomain().getName());
                        
                        // Placeholder metrics
                        moduleInfo.put("enrollments", new Random().nextInt(100) + 50);
                        moduleInfo.put("completionRate", (new Random().nextInt(60) + 40) + "%");
                        moduleInfo.put("averageRating", 4.0 + (new Random().nextDouble() * 1.0));
                        
                        return moduleInfo;
                    })
                    .collect(Collectors.toList());
            
            return ResponseEntity.ok(popularModules);
            
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new MessageResponse("Error fetching popular modules: " + e.getMessage()));
        }
    }
    
    // Get modules by specific category/tag (sample implementation)
    @GetMapping("/modules/category/{category}")
    public ResponseEntity<?> getModulesByCategory(
            @PathVariable String category,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        
        try {
            // Get current user
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
            UUID userId = userDetails.getId();
            
            Optional<Users> userOpt = userRepository.findById(userId);
            if (!userOpt.isPresent()) {
                return ResponseEntity.badRequest().body(new MessageResponse("User not found"));
            }
            
            Users user = userOpt.get();
            boolean isAdmin = user.getRole() == Role.ADMIN;
            
            // In a real implementation, you would have a module_category or module_tag relationship
            // For now, we'll just filter by title containing the category name
            Pageable pageable = PageRequest.of(page, size, Sort.by("title"));
            Page<TrainingModule> modules;
            
            if (isAdmin) {
                modules = moduleRepository.findByTitleContainingIgnoreCase(category, pageable);
            } else {
                modules = moduleRepository.findByTitleContainingIgnoreCaseAndStatus(
                        category, ModuleStatus.PUBLISHED, pageable);
            }
            
            return ResponseEntity.ok()
                    .header("X-Total-Count", String.valueOf(modules.getTotalElements()))
                    .body(modules.getContent());
            
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new MessageResponse("Error fetching modules by category: " + e.getMessage()));
        }
    }
    
    // Search modules with comprehensive filtering
    @GetMapping("/modules/search")
    public ResponseEntity<?> searchModules(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) UUID domainId,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "title") String sortBy) {
        
        try {
            // Get current authenticated user
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
            UUID userId = userDetails.getId();
            
            // Fetch the user to access their domains
            Optional<Users> userOpt = userRepository.findById(userId);
            if (!userOpt.isPresent()) {
                return ResponseEntity.badRequest().body(new ArrayList<>());
            }
            
            Users user = userOpt.get();
            boolean isAdmin = user.getRole() == Role.ADMIN;
            
            // Create pageable object for pagination and sorting
            Pageable paging = PageRequest.of(page, size, Sort.by(sortBy));
            Page<TrainingModule> pageModules;
            
            // Apply filters based on query parameters
            if (query != null && !query.isEmpty()) {
                if (domainId != null && status != null && !status.isEmpty()) {
                    // Search by query, domain, and status
                    Optional<Domain> domain = domainRepository.findById(domainId);
                    if (domain.isPresent()) {
                        pageModules = moduleRepository.findByTitleContainingIgnoreCaseAndDomainAndStatus(
                                query, domain.get(), ModuleStatus.valueOf(status), paging);
                    } else {
                        return ResponseEntity.badRequest().body(new ArrayList<>());
                    }
                } else if (domainId != null) {
                    // Search by query and domain
                    Optional<Domain> domain = domainRepository.findById(domainId);
                    if (domain.isPresent()) {
                        pageModules = moduleRepository.findByTitleContainingIgnoreCaseAndDomain(
                                query, domain.get(), paging);
                    } else {
                        return ResponseEntity.badRequest().body(new ArrayList<>());
                    }
                } else if (status != null && !status.isEmpty()) {
                    // Search by query and status
                    pageModules = moduleRepository.findByTitleContainingIgnoreCaseAndStatus(
                            query, ModuleStatus.valueOf(status), paging);
                } else {
                    // Search by query only
                    pageModules = moduleRepository.findByTitleContainingIgnoreCase(query, paging);
                }
            } else {
                // No search query provided, apply other filters
                if (domainId != null) {
                    Optional<Domain> domain = domainRepository.findById(domainId);
                    if (domain.isPresent()) {
                        if (status != null && !status.isEmpty()) {
                            // Filter by domain and status
                            pageModules = moduleRepository.findByDomainAndStatus(
                                    domain.get(), ModuleStatus.valueOf(status), paging);
                        } else {
                            // Filter by domain only
                            pageModules = moduleRepository.findByDomain(domain.get(), paging);
                        }
                    } else {
                        return ResponseEntity.badRequest().body(new ArrayList<>());
                    }
                } else if (status != null && !status.isEmpty()) {
                    // Filter by status only
                    pageModules = moduleRepository.findByStatus(ModuleStatus.valueOf(status), paging);
                } else {
                    // No filters - get all modules or published modules based on user role
                    if (isAdmin) {
                        pageModules = moduleRepository.findAll(paging);
                    } else {
                        pageModules = moduleRepository.findByStatus(ModuleStatus.PUBLISHED, paging);
                    }
                }
            }
            
            // If not admin, filter to only show published modules
            if (!isAdmin && pageModules.getContent().stream()
                    .anyMatch(module -> module.getStatus() != ModuleStatus.PUBLISHED)) {
                
                List<TrainingModule> filteredModules = pageModules.getContent().stream()
                        .filter(module -> module.getStatus() == ModuleStatus.PUBLISHED)
                        .collect(Collectors.toList());
                
                return ResponseEntity.ok()
                        .header("X-Total-Count", String.valueOf(filteredModules.size()))
                        .body(filteredModules);
            }
            
            return ResponseEntity.ok()
                    .header("X-Total-Pages", String.valueOf(pageModules.getTotalPages()))
                    .header("X-Total-Elements", String.valueOf(pageModules.getTotalElements()))
                    .body(pageModules.getContent());
            
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new MessageResponse("Error searching modules: " + e.getMessage()));
        }
    }
}