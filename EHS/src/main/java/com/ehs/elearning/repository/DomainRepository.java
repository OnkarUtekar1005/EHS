// DomainRepository.java
package com.ehs.elearning.repository;

import com.ehs.elearning.model.Domain;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface DomainRepository extends JpaRepository<Domain, UUID> {
    boolean existsByName(String name);
    List<Domain> findByNameContainingIgnoreCase(String name);
}