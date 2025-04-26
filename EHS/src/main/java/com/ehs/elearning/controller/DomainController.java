package com.ehs.elearning.controller;

import com.ehs.elearning.model.Domain;
import com.ehs.elearning.model.Users;
import com.ehs.elearning.payload.response.MessageResponse;
import com.ehs.elearning.repository.DomainRepository;
import com.ehs.elearning.repository.UserRepository;
import com.ehs.elearning.security.UserDetailsImpl;

import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/domains")
public class DomainController {
    
    @Autowired
    private DomainRepository domainRepository;
    
    @Autowired
    private UserRepository userRepository;

    // Get all domains - available to all users regardless of assignment
    @GetMapping
    public List<Domain> getAllDomains() {
        // All users can see all available domains
        return domainRepository.findAll();
    }
    
    // Get all domains with user assignment status
    @GetMapping("/with-status")
    public ResponseEntity<?> getAllDomainsWithStatus() {
        // Get current user
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        UUID userId = userDetails.getId();
        
        Optional<Users> userOpt = userRepository.findById(userId);
        if (!userOpt.isPresent()) {
            return ResponseEntity.notFound().build();
        }
        
        Users user = userOpt.get();
        List<Domain> allDomains = domainRepository.findAll();
        
        List<Map<String, Object>> domainsWithStatus = allDomains.stream().map(domain -> {
            Map<String, Object> domainInfo = new HashMap<>();
            domainInfo.put("id", domain.getId());
            domainInfo.put("name", domain.getName());
            domainInfo.put("description", domain.getDescription());
            domainInfo.put("isAssigned", user.getDomains().contains(domain));
            return domainInfo;
        }).collect(Collectors.toList());
        
        return ResponseEntity.ok(domainsWithStatus);
    }

    // Get domain by ID
    @GetMapping("/{id}")
    public ResponseEntity<?> getDomainById(@PathVariable UUID id) {
        return domainRepository.findById(id)
                .map(domain -> ResponseEntity.ok().body(domain))
                .orElse(ResponseEntity.notFound().build());
    }

    // Create domain (admin only)
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> createDomain(@Valid @RequestBody Domain domain) {
        if (domainRepository.existsByName(domain.getName())) {
            return ResponseEntity
                    .badRequest()
                    .body(new MessageResponse("Error: Domain name already exists!"));
        }

        Domain newDomain = domainRepository.save(domain);
        return ResponseEntity.ok(newDomain);
    }

    // Update domain (admin only)
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> updateDomain(@PathVariable UUID id, @Valid @RequestBody Domain domainDetails) {
        return domainRepository.findById(id)
                .map(domain -> {
                    domain.setName(domainDetails.getName());
                    domain.setDescription(domainDetails.getDescription());
                    Domain updatedDomain = domainRepository.save(domain);
                    return ResponseEntity.ok(updatedDomain);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    // Delete domain (admin only)
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deleteDomain(@PathVariable UUID id) {
        return domainRepository.findById(id)
                .map(domain -> {
                    // Check if domain is assigned to any users
                    if (!domain.getUsers().isEmpty()) {
                        return ResponseEntity.badRequest()
                                .body(new MessageResponse("Cannot delete domain assigned to users"));
                    }
                    
                    domainRepository.delete(domain);
                    return ResponseEntity.ok(new MessageResponse("Domain deleted successfully!"));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    // Search domains
    @GetMapping("/search")
    public ResponseEntity<?> searchDomains(@RequestParam String query) {
        List<Domain> matchingDomains = domainRepository.findByNameContainingIgnoreCase(query);
        return ResponseEntity.ok(matchingDomains);
    }
    
    // Get users assigned to a domain (admin only)
    @GetMapping("/{id}/users")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getDomainUsers(@PathVariable UUID id) {
        return domainRepository.findById(id)
                .map(domain -> {
                    List<Users> users = new ArrayList<>(domain.getUsers());
                    return ResponseEntity.ok(users);
                })
                .orElse(ResponseEntity.notFound().build());
    }
    
    // Get domain details with enrollment statistics (admin only)
    @GetMapping("/{id}/stats")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getDomainStats(@PathVariable UUID id) {
        return domainRepository.findById(id)
                .map(domain -> {
                    Map<String, Object> stats = new HashMap<>();
                    stats.put("id", domain.getId());
                    stats.put("name", domain.getName());
                    stats.put("description", domain.getDescription());
                    stats.put("enrolledUsers", domain.getUsers().size());
                    
                    return ResponseEntity.ok(stats);
                })
                .orElse(ResponseEntity.notFound().build());
    }
}