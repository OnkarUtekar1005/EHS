package com.ehs.elearning.service;

import com.ehs.elearning.model.Domain;
import com.ehs.elearning.model.ModuleStatus;
import com.ehs.elearning.model.TrainingModule;
import com.ehs.elearning.model.Users;
import com.ehs.elearning.repository.DomainRepository;
import com.ehs.elearning.repository.TrainingModuleRepository;
import com.ehs.elearning.repository.UserRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class DomainService {

    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private DomainRepository domainRepository;
    
    @Autowired
    private TrainingModuleRepository moduleRepository;
    
    /**
     * Get all domains in the system
     * 
     * @return List of all domains
     */
    public List<Domain> getAllDomains() {
        return domainRepository.findAll();
    }
    
    /**
     * Get all domains with information about whether a user is assigned to them
     * 
     * @param userId The ID of the user
     * @return List of domains with assignment status
     */
    public List<Map<String, Object>> getAllDomainsWithStatus(UUID userId) {
        Optional<Users> userOpt = userRepository.findById(userId);
        if (!userOpt.isPresent()) {
            return new ArrayList<>();
        }
        
        Users user = userOpt.get();
        List<Domain> allDomains = domainRepository.findAll();
        
        return allDomains.stream().map(domain -> {
            Map<String, Object> domainInfo = new HashMap<>();
            domainInfo.put("id", domain.getId());
            domainInfo.put("name", domain.getName());
            domainInfo.put("description", domain.getDescription());
            domainInfo.put("isAssigned", user.getDomains().contains(domain));
            
            // Get count of published modules in this domain
            long moduleCount = moduleRepository.findByDomainAndStatus(domain, ModuleStatus.PUBLISHED).size();
            domainInfo.put("moduleCount", moduleCount);
            
            return domainInfo;
        }).collect(Collectors.toList());
    }
    
    /**
     * Get domains assigned to a specific user
     * 
     * @param userId The ID of the user
     * @return List of domains assigned to the user
     */
    public List<Domain> getUserDomains(UUID userId) {
        Optional<Users> userOpt = userRepository.findById(userId);
        if (userOpt.isPresent()) {
            return new ArrayList<>(userOpt.get().getDomains());
        }
        return new ArrayList<>();
    }
    
    /**
     * Assign domains to a user
     * 
     * @param userId The ID of the user
     * @param domainIds List of domain IDs to assign
     * @return Updated user with assigned domains
     */
    public Users assignDomainsToUser(UUID userId, List<UUID> domainIds) {
        Optional<Users> userOpt = userRepository.findById(userId);
        if (!userOpt.isPresent()) {
            throw new RuntimeException("User not found with ID: " + userId);
        }
        
        Users user = userOpt.get();
        Set<Domain> domains = new HashSet<>();
        
        for (UUID domainId : domainIds) {
            domainRepository.findById(domainId).ifPresent(domains::add);
        }
        
        user.setDomains(domains);
        return userRepository.save(user);
    }
    
    /**
     * Add a domain to a user
     * 
     * @param userId The ID of the user
     * @param domainId The ID of the domain to add
     * @return Updated user with the new domain
     */
    public Users addDomainToUser(UUID userId, UUID domainId) {
        Optional<Users> userOpt = userRepository.findById(userId);
        Optional<Domain> domainOpt = domainRepository.findById(domainId);
        
        if (!userOpt.isPresent() || !domainOpt.isPresent()) {
            throw new RuntimeException("User or domain not found");
        }
        
        Users user = userOpt.get();
        Domain domain = domainOpt.get();
        
        if (user.getDomains().contains(domain)) {
            // Domain already assigned
            return user;
        }
        
        user.addDomain(domain);
        return userRepository.save(user);
    }
    
    /**
     * Remove a domain from a user
     * 
     * @param userId The ID of the user
     * @param domainId The ID of the domain to remove
     * @return Updated user without the domain
     */
    public Users removeDomainFromUser(UUID userId, UUID domainId) {
        Optional<Users> userOpt = userRepository.findById(userId);
        Optional<Domain> domainOpt = domainRepository.findById(domainId);
        
        if (!userOpt.isPresent() || !domainOpt.isPresent()) {
            throw new RuntimeException("User or domain not found");
        }
        
        Users user = userOpt.get();
        Domain domain = domainOpt.get();
        
        if (!user.getDomains().contains(domain)) {
            // Domain not assigned
            return user;
        }
        
        user.removeDomain(domain);
        return userRepository.save(user);
    }
    
    /**
     * Get published training modules from a specific domain
     * 
     * @param domainId The ID of the domain
     * @return List of published modules in the domain
     */
    public List<TrainingModule> getPublishedModulesForDomain(UUID domainId) {
        Optional<Domain> domainOpt = domainRepository.findById(domainId);
        if (!domainOpt.isPresent()) {
            throw new RuntimeException("Domain not found with ID: " + domainId);
        }
        
        Domain domain = domainOpt.get();
        return moduleRepository.findByDomainAndStatus(domain, ModuleStatus.PUBLISHED);
    }
    
    /**
     * Get all published training modules (across all domains)
     * 
     * @return List of all published modules
     */
    public List<TrainingModule> getAllPublishedModules() {
        return moduleRepository.findByStatus(ModuleStatus.PUBLISHED);
    }
    
    /**
     * Get published training modules for a user based on their assigned domains
     * 
     * @param userId The ID of the user
     * @return List of modules accessible to the user
     */
    public List<TrainingModule> getModulesForUserDomains(UUID userId) {
        Optional<Users> userOpt = userRepository.findById(userId);
        if (!userOpt.isPresent()) {
            throw new RuntimeException("User not found with ID: " + userId);
        }
        
        Users user = userOpt.get();
        Set<Domain> userDomains = user.getDomains();
        
        if (userDomains.isEmpty()) {
            // If user has no domain assignments, return all published modules
            return moduleRepository.findByStatus(ModuleStatus.PUBLISHED);
        }
        
        // Get all published modules
        List<TrainingModule> publishedModules = moduleRepository.findByStatus(ModuleStatus.PUBLISHED);
        
        // Filter to include only modules from user's domains
        return publishedModules.stream()
                .filter(module -> userDomains.contains(module.getDomain()))
                .collect(Collectors.toList());
    }
    
    /**
     * Get all domains with module counts for browsing
     * 
     * @return List of domains with module counts
     */
    public List<Map<String, Object>> getDomainsWithModuleCounts() {
        List<Domain> allDomains = domainRepository.findAll();
        
        return allDomains.stream().map(domain -> {
            Map<String, Object> domainInfo = new HashMap<>();
            domainInfo.put("id", domain.getId());
            domainInfo.put("name", domain.getName());
            domainInfo.put("description", domain.getDescription());
            
            // Get count of published modules in this domain
            long moduleCount = moduleRepository.findByDomainAndStatus(domain, ModuleStatus.PUBLISHED).size();
            domainInfo.put("moduleCount", moduleCount);
            
            return domainInfo;
        }).collect(Collectors.toList());
    }
    
    /**
     * Get users assigned to a domain
     * 
     * @param domainId The ID of the domain
     * @return List of users assigned to the domain
     */
    public List<Users> getUsersForDomain(UUID domainId) {
        Optional<Domain> domainOpt = domainRepository.findById(domainId);
        if (!domainOpt.isPresent()) {
            throw new RuntimeException("Domain not found with ID: " + domainId);
        }
        
        Domain domain = domainOpt.get();
        return new ArrayList<>(domain.getUsers());
    }
    
    /**
     * Check if a user has access to a specific domain
     * 
     * @param userId The ID of the user
     * @param domainId The ID of the domain
     * @return true if the user has access, false otherwise
     */
    public boolean userHasAccessToDomain(UUID userId, UUID domainId) {
        Optional<Users> userOpt = userRepository.findById(userId);
        Optional<Domain> domainOpt = domainRepository.findById(domainId);
        
        if (!userOpt.isPresent() || !domainOpt.isPresent()) {
            return false;
        }
        
        Users user = userOpt.get();
        Domain domain = domainOpt.get();
        
        return user.getDomains().isEmpty() || user.getDomains().contains(domain);
    }
}