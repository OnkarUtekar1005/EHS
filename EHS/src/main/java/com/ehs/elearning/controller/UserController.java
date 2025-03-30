package com.ehs.elearning.controller;

import com.ehs.elearning.model.Domain;
import com.ehs.elearning.model.Role;
import com.ehs.elearning.model.Users;
import com.ehs.elearning.payload.response.MessageResponse;
import com.ehs.elearning.repository.DomainRepository;
import com.ehs.elearning.repository.UserRepository;
import com.ehs.elearning.security.UserDetailsImpl;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/users")
public class UserController {
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private DomainRepository domainRepository;
    
    @Autowired
    private PasswordEncoder passwordEncoder;
    
    // Get all users (admin only)
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public List<Users> getAllUsers() {
        return userRepository.findAll();
    }
    
    // Get user by ID
    @GetMapping("/{id}")
    public ResponseEntity<?> getUserById(@PathVariable UUID id) {
        // Get current user
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        
        // Only allow admins or the user themselves to access
        if (!userDetails.getId().equals(id) && 
                !userDetails.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"))) {
            return ResponseEntity.status(403).body(new MessageResponse("Not authorized to access this user"));
        }
        
        return userRepository.findById(id)
                .map(user -> ResponseEntity.ok(user))
                .orElse(ResponseEntity.notFound().build());
    }
    
    // Update user
    @PutMapping("/{id}")
    public ResponseEntity<?> updateUser(@PathVariable UUID id, @RequestBody Map<String, Object> updates) {
        // Get current user
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        
        // Only allow admins or the user themselves to update
        if (!userDetails.getId().equals(id) && 
                !userDetails.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"))) {
            return ResponseEntity.status(403).body(new MessageResponse("Not authorized to update this user"));
        }
        
        return userRepository.findById(id)
                .map(user -> {
                    // Update fields if provided
                    if (updates.containsKey("email")) {
                        user.setEmail((String) updates.get("email"));
                    }
                    
                    // Only admin can update role
                    if (updates.containsKey("role") && 
                            userDetails.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"))) {
                        try {
                            Role role = Role.valueOf(((String) updates.get("role")).toUpperCase());
                            user.setRole(role);
                        } catch (IllegalArgumentException e) {
                            return ResponseEntity.badRequest().body(new MessageResponse("Invalid role"));
                        }
                    }
                    
                    // Update password if provided
                    if (updates.containsKey("password") && updates.get("password") != null) {
                        user.setPassword(passwordEncoder.encode((String) updates.get("password")));
                    }
                    
                    Users updatedUser = userRepository.save(user);
                    return ResponseEntity.ok(updatedUser);
                })
                .orElse(ResponseEntity.notFound().build());
    }
    
    // Delete user (admin only)
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deleteUser(@PathVariable UUID id) {
        return userRepository.findById(id)
                .map(user -> {
                    userRepository.delete(user);
                    return ResponseEntity.ok(new MessageResponse("User deleted successfully"));
                })
                .orElse(ResponseEntity.notFound().build());
    }
    
    // Search users by criteria
    @GetMapping("/search")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> searchUsers(@RequestParam(required = false) String username, 
                                         @RequestParam(required = false) String email,
                                         @RequestParam(required = false) String role) {
        
        List<Users> allUsers = userRepository.findAll();
        List<Users> filteredUsers = allUsers;
        
        if (username != null && !username.isEmpty()) {
            filteredUsers = filteredUsers.stream()
                    .filter(u -> u.getUsername().toLowerCase().contains(username.toLowerCase()))
                    .collect(Collectors.toList());
        }
        
        if (email != null && !email.isEmpty()) {
            filteredUsers = filteredUsers.stream()
                    .filter(u -> u.getEmail().toLowerCase().contains(email.toLowerCase()))
                    .collect(Collectors.toList());
        }
        
        if (role != null && !role.isEmpty()) {
            try {
                Role roleEnum = Role.valueOf(role.toUpperCase());
                filteredUsers = filteredUsers.stream()
                        .filter(u -> u.getRole() == roleEnum)
                        .collect(Collectors.toList());
            } catch (IllegalArgumentException e) {
                return ResponseEntity.badRequest().body(new MessageResponse("Invalid role"));
            }
        }
        
        return ResponseEntity.ok(filteredUsers);
    }
    
    // Assign domains to user
    @PutMapping("/{id}/domains")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> assignDomains(@PathVariable UUID id, @RequestBody List<UUID> domainIds) {
        return userRepository.findById(id)
                .map(user -> {
                    Set<Domain> domains = new HashSet<>();
                    
                    for (UUID domainId : domainIds) {
                        domainRepository.findById(domainId).ifPresent(domains::add);
                    }
                    
                    user.setDomains(domains);
                    Users updatedUser = userRepository.save(user);
                    
                    return ResponseEntity.ok(updatedUser);
                })
                .orElse(ResponseEntity.notFound().build());
    }
}