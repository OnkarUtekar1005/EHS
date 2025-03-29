// DomainController.java
package com.ehs.elearning.controller;

import com.ehs.elearning.model.Domain;
import com.ehs.elearning.payload.response.MessageResponse;
import com.ehs.elearning.repository.DomainRepository;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/domains")
public class DomainController {
    @Autowired
    private DomainRepository domainRepository;

    @GetMapping
    public List<Domain> getAllDomains() {
        return domainRepository.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getDomainById(@PathVariable UUID id) {
        return domainRepository.findById(id)
                .map(domain -> ResponseEntity.ok().body(domain))
                .orElse(ResponseEntity.notFound().build());
    }

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

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deleteDomain(@PathVariable UUID id) {
        return domainRepository.findById(id)
                .map(domain -> {
                    domainRepository.delete(domain);
                    return ResponseEntity.ok(new MessageResponse("Domain deleted successfully!"));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/search")
    public List<Domain> searchDomains(@RequestParam String query) {
        return domainRepository.findByNameContainingIgnoreCase(query);
    }
}