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

import java.security.SecureRandom;
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
        if (!userDetails.getId().equals(id)
                && !userDetails.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"))) {
            return ResponseEntity.status(403).body(new MessageResponse("Not authorized to access this user"));
        }

        return userRepository.findById(id).map(user -> ResponseEntity.ok(user))
                .orElse(ResponseEntity.notFound().build());
    }

    // Update user
    @PutMapping("/{id}")
    public ResponseEntity<?> updateUser(@PathVariable UUID id, @RequestBody Map<String, Object> updates) {
        // Get current user
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();

        // Only allow admins or the user themselves to update
        if (!userDetails.getId().equals(id)
                && !userDetails.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"))) {
            return ResponseEntity.status(403).body(new MessageResponse("Not authorized to update this user"));
        }

        return userRepository.findById(id).map(user -> {
            // Update fields if provided
            if (updates.containsKey("email")) {
                user.setEmail((String) updates.get("email"));
            }
            
            if (updates.containsKey("firstName")) {
                user.setFirstName((String) updates.get("firstName"));
            }
            
            if (updates.containsKey("lastName")) {
                user.setLastName((String) updates.get("lastName"));
            }
            
            if (updates.containsKey("jobTitle")) {
                user.setJobTitle((String) updates.get("jobTitle"));
            }
            
            if (updates.containsKey("department")) {
                user.setDepartment((String) updates.get("department"));
            }

            // Only admin can update role
            if (updates.containsKey("role")
                    && userDetails.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"))) {
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
        }).orElse(ResponseEntity.notFound().build());
    }

    // Delete user (admin only)
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deleteUser(@PathVariable UUID id) {
        return userRepository.findById(id).map(user -> {
            userRepository.delete(user);
            return ResponseEntity.ok(new MessageResponse("User deleted successfully"));
        }).orElse(ResponseEntity.notFound().build());
    }
    
    // Search users by criteria
    @GetMapping("/search")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> searchUsers(@RequestParam(required = false) String username,
            @RequestParam(required = false) String email, @RequestParam(required = false) String role) {

        List<Users> allUsers = userRepository.findAll();
        List<Users> filteredUsers = allUsers;

        if (username != null && !username.isEmpty()) {
            filteredUsers = filteredUsers.stream()
                    .filter(u -> u.getUsername().toLowerCase().contains(username.toLowerCase()))
                    .collect(Collectors.toList());
        }

        if (email != null && !email.isEmpty()) {
            filteredUsers = filteredUsers.stream().filter(u -> u.getEmail().toLowerCase().contains(email.toLowerCase()))
                    .collect(Collectors.toList());
        }

        if (role != null && !role.isEmpty()) {
            try {
                Role roleEnum = Role.valueOf(role.toUpperCase());
                filteredUsers = filteredUsers.stream().filter(u -> u.getRole() == roleEnum)
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
        return userRepository.findById(id).map(user -> {
            Set<Domain> domains = new HashSet<>();

            for (UUID domainId : domainIds) {
                domainRepository.findById(domainId).ifPresent(domains::add);
            }

            // Clear current domains and set new ones
            user.setDomains(domains);
            Users updatedUser = userRepository.save(user);

            return ResponseEntity.ok(updatedUser);
        }).orElse(ResponseEntity.notFound().build());
    }
    
    // Get all domains assigned to a user
    @GetMapping("/{id}/domains")
    public ResponseEntity<?> getUserDomains(@PathVariable UUID id) {
        // Get current user
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();

        // Only allow admins or the user themselves to access
        if (!userDetails.getId().equals(id)
                && !userDetails.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"))) {
            return ResponseEntity.status(403).body(new MessageResponse("Not authorized to access this user's domains"));
        }

        return userRepository.findById(id).map(user -> {
            Set<Domain> domains = user.getDomains();
            return ResponseEntity.ok(domains);
        }).orElse(ResponseEntity.notFound().build());
    }
    
    // Add domain to user
    @PostMapping("/{id}/domains/{domainId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> addDomainToUser(@PathVariable UUID id, @PathVariable UUID domainId) {
        Optional<Users> userOpt = userRepository.findById(id);
        Optional<Domain> domainOpt = domainRepository.findById(domainId);
        
        if (!userOpt.isPresent() || !domainOpt.isPresent()) {
            return ResponseEntity.notFound().build();
        }
        
        Users user = userOpt.get();
        Domain domain = domainOpt.get();
        
        // Check if domain is already assigned
        if (user.getDomains().contains(domain)) {
            return ResponseEntity.badRequest().body(new MessageResponse("Domain is already assigned to this user"));
        }
        
        // Add domain to user
        user.addDomain(domain);
        userRepository.save(user);
        
        return ResponseEntity.ok(new MessageResponse("Domain added to user successfully"));
    }
    
    // User requests access to a domain
    @PostMapping("/request-domain/{domainId}")
    public ResponseEntity<?> requestDomainAccess(@PathVariable UUID domainId) {
        // Get current user
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        UUID userId = userDetails.getId();
        
        Optional<Users> userOpt = userRepository.findById(userId);
        Optional<Domain> domainOpt = domainRepository.findById(domainId);
        
        if (!userOpt.isPresent() || !domainOpt.isPresent()) {
            return ResponseEntity.notFound().build();
        }
        
        Users user = userOpt.get();
        Domain domain = domainOpt.get();
        
        // Check if domain is already assigned
        if (user.getDomains().contains(domain)) {
            return ResponseEntity.badRequest().body(new MessageResponse("You already have access to this domain"));
        }
        
        // In a real implementation, you might:
        // 1. Store the request in a database
        // 2. Send a notification to admins
        // 3. Create a pending status
        
        // For now, we'll just return a success message
        return ResponseEntity.ok(new MessageResponse("Domain access request submitted to administrators"));
    }
    
    // Remove domain from user
    @DeleteMapping("/{id}/domains/{domainId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> removeDomainFromUser(@PathVariable UUID id, @PathVariable UUID domainId) {
        Optional<Users> userOpt = userRepository.findById(id);
        Optional<Domain> domainOpt = domainRepository.findById(domainId);
        
        if (!userOpt.isPresent() || !domainOpt.isPresent()) {
            return ResponseEntity.notFound().build();
        }
        
        Users user = userOpt.get();
        Domain domain = domainOpt.get();
        
        // Check if domain is assigned
        if (!user.getDomains().contains(domain)) {
            return ResponseEntity.badRequest().body(new MessageResponse("Domain is not assigned to this user"));
        }
        
        // Remove domain from user
        user.removeDomain(domain);
        userRepository.save(user);
        
        return ResponseEntity.ok(new MessageResponse("Domain removed from user successfully"));
    }
    
    // Create a single user
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> createUser(@RequestBody Map<String, String> userData) {
        String username = userData.get("username");
        String email = userData.get("email");
        
        // Validate input
        if (username == null || email == null || username.isEmpty() || email.isEmpty()) {
            return ResponseEntity.badRequest().body(new MessageResponse("Username and email are required"));
        }
        
        // Check if user already exists
        if (userRepository.existsByUsername(username)) {
            return ResponseEntity.badRequest().body(new MessageResponse("Username is already taken"));
        }
        
        if (userRepository.existsByEmail(email)) {
            return ResponseEntity.badRequest().body(new MessageResponse("Email is already in use"));
        }
        
        // Generate password
        String password = generateSecurePassword();
        
        // Create user
        Users user = new Users(username, email, passwordEncoder.encode(password));

        // After generating the password in createUser method
           user.setLastGeneratedPassword(password);
           user.setLastPasswordReset(new java.sql.Date(System.currentTimeMillis()));
        // Set role
        String role = userData.get("role");
        if (role == null || role.isEmpty()) {
            user.setRole(Role.USER);
        } else {
            try {
                user.setRole(Role.valueOf(role.toUpperCase()));
            } catch (IllegalArgumentException e) {
                user.setRole(Role.USER);
            }
        }
        
        // Set other fields if provided
        if (userData.containsKey("firstName")) {
            user.setFirstName(userData.get("firstName"));
        }
        
        if (userData.containsKey("lastName")) {
            user.setLastName(userData.get("lastName"));
        }
        
        if (userData.containsKey("jobTitle")) {
            user.setJobTitle(userData.get("jobTitle"));
        }
        
        if (userData.containsKey("department")) {
            user.setDepartment(userData.get("department"));
        }
        
        Users savedUser = userRepository.save(user);
        
        Map<String, Object> response = new HashMap<>();
        response.put("user", savedUser);
        response.put("password", password); // Return plaintext password in response
        
        return ResponseEntity.ok(response);
    }
    
    @PostMapping("/bulk")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> bulkCreateUsers(@RequestBody List<Map<String, String>> usersData) {
        List<Map<String, Object>> userResponses = new ArrayList<>();
        
        for (Map<String, String> userData : usersData) {
            String username = userData.get("username");
            String email = userData.get("email");
            String role = userData.get("role");
            
            // Validate input
            if (username == null || email == null || username.isEmpty() || email.isEmpty()) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("username", username);
                errorResponse.put("email", email);
                errorResponse.put("status", "error");
                errorResponse.put("message", "Username and email are required");
                userResponses.add(errorResponse);
                continue;
            }
            
            // Check if user already exists
            if (userRepository.existsByUsername(username) || userRepository.existsByEmail(email)) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("username", username);
                errorResponse.put("email", email);
                errorResponse.put("status", "error");
                errorResponse.put("message", "User already exists");
                userResponses.add(errorResponse);
                continue;
            }
            
            // Generate password
            String password = generateSecurePassword();
            
            // Create user
            Users user = new Users(username, email, passwordEncoder.encode(password));
     
            // After generating the password in createUser method
               user.setLastGeneratedPassword(password);
               user.setLastPasswordReset(new java.sql.Date(System.currentTimeMillis()));
            // Set role (default to USER)
            if (role == null || role.isEmpty()) {
                user.setRole(Role.USER);
            } else {
                try {
                    user.setRole(Role.valueOf(role.toUpperCase()));
                } catch (IllegalArgumentException e) {
                    user.setRole(Role.USER);
                }
            }
            
            // Set other fields if provided
            if (userData.containsKey("firstName")) {
                user.setFirstName(userData.get("firstName"));
            }
            
            if (userData.containsKey("lastName")) {
                user.setLastName(userData.get("lastName"));
            }
            
            if (userData.containsKey("jobTitle")) {
                user.setJobTitle(userData.get("jobTitle"));
            }
            
            if (userData.containsKey("department")) {
                user.setDepartment(userData.get("department"));
            }
            
            Users savedUser = userRepository.save(user);
            
            Map<String, Object> userResponse = new HashMap<>();
            userResponse.put("id", savedUser.getId());
            userResponse.put("username", savedUser.getUsername());
            userResponse.put("email", savedUser.getEmail());
            userResponse.put("role", savedUser.getRole());
            userResponse.put("password", password); // Return plaintext password in response
            userResponse.put("status", "success");
            userResponses.add(userResponse);
        }
        
        return ResponseEntity.ok(userResponses);
    }
    
    // Bulk assign domains to multiple users
    @PutMapping("/domains/assign")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> assignBulkDomains(@RequestBody Map<String, Object> request) {
        try {
            @SuppressWarnings("unchecked")
            List<String> userIdStrings = (List<String>) request.get("userIds");
            @SuppressWarnings("unchecked")
            List<String> domainIdStrings = (List<String>) request.get("domainIds");
            
            if (userIdStrings == null || domainIdStrings == null) {
                return ResponseEntity.badRequest().body(new MessageResponse("User IDs and Domain IDs are required"));
            }
            
            // Convert string IDs to UUID
            List<UUID> userIds = userIdStrings.stream()
                .map(UUID::fromString)
                .collect(Collectors.toList());
            
            List<UUID> domainIds = domainIdStrings.stream()
                .map(UUID::fromString)
                .collect(Collectors.toList());
            
            Set<Domain> domains = new HashSet<>();
            for (UUID domainId : domainIds) {
                domainRepository.findById(domainId).ifPresent(domains::add);
            }
            
            List<Users> updatedUsers = new ArrayList<>();
            for (UUID userId : userIds) {
                userRepository.findById(userId).ifPresent(user -> {
                    // Get existing domains and add new ones
                    Set<Domain> existingDomains = user.getDomains();
                    existingDomains.addAll(domains);
                    user.setDomains(existingDomains);
                    updatedUsers.add(userRepository.save(user));
                });
            }
            
            return ResponseEntity.ok(new MessageResponse(updatedUsers.size() + " users updated successfully"));
        } catch (IllegalArgumentException e) {
            // Handle invalid UUID format
            return ResponseEntity.badRequest().body(new MessageResponse("Invalid ID format: " + e.getMessage()));
        } catch (Exception e) {
            // Handle other exceptions
            return ResponseEntity.status(500).body(new MessageResponse("Error: " + e.getMessage()));
        }
    }
    
    // Bulk delete users
    @DeleteMapping("/bulk")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> bulkDeleteUsers(@RequestBody List<UUID> userIds) {
        int deletedCount = 0;
        for (UUID userId : userIds) {
            if (userRepository.existsById(userId)) {
                userRepository.deleteById(userId);
                deletedCount++;
            }
        }
        
        return ResponseEntity.ok(new MessageResponse(deletedCount + " users deleted successfully"));
    }
    
    // Helper method for password generation
    private String generateSecurePassword() {
        String chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
        StringBuilder password = new StringBuilder();
        SecureRandom random = new SecureRandom();
        for (int i = 0; i < 10; i++) {
            password.append(chars.charAt(random.nextInt(chars.length())));
        }
        return password.toString();
    }
    
    // Get current user's profile with their assigned domains
    @GetMapping("/profile")
    public ResponseEntity<?> getUserProfile() {
        // Get current user
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        UUID userId = userDetails.getId();

        return userRepository.findById(userId).map(user -> {
            Map<String, Object> profile = new HashMap<>();
            profile.put("id", user.getId());
            profile.put("username", user.getUsername());
            profile.put("email", user.getEmail());
            profile.put("firstName", user.getFirstName());
            profile.put("lastName", user.getLastName());
            profile.put("role", user.getRole());
            profile.put("assignedDomains", user.getDomains());

            return ResponseEntity.ok(profile);
        }).orElse(ResponseEntity.notFound().build());
    }

    // Generate a secure random password
    @GetMapping("/generate-password")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> generatePassword() {
        String password = generateSecurePassword();
        Map<String, String> response = new HashMap<>();
        response.put("password", password);
        return ResponseEntity.ok(response);
    }

    // Reset password for a specific user
    @PutMapping("/{id}/password")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> resetUserPassword(@PathVariable UUID id, @RequestBody Map<String, Object> resetData) {
        return userRepository.findById(id).map(user -> {
            boolean useRandomPassword = resetData.containsKey("useRandomPassword")
                && (Boolean) resetData.get("useRandomPassword");

            String password;

            if (useRandomPassword) {
                // Generate random password
                password = generateSecurePassword();
            } else if (resetData.containsKey("password") && resetData.get("password") != null) {
                // Use provided password
                password = (String) resetData.get("password");
            } else {
                return ResponseEntity.badRequest()
                    .body(new MessageResponse("Either password or useRandomPassword flag must be provided"));
            }

            // Encode and set the password
            user.setPassword(passwordEncoder.encode(password));

            // Store plaintext password for reference
            user.setLastGeneratedPassword(password);
            user.setLastPasswordReset(new java.sql.Date(System.currentTimeMillis()));

            // Save the user
            userRepository.save(user);

            // Handle email notification if requested
            boolean sendEmail = resetData.containsKey("sendEmail")
                && (Boolean) resetData.get("sendEmail");

            if (sendEmail) {
                // TODO: Implement email notification (can be added in a future implementation)
                // Example: emailService.sendPasswordResetNotification(user.getEmail(), password);
            }

            // Prepare response
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Password reset successfully");
            if (useRandomPassword) {
                response.put("generatedPassword", password);
            }

            return ResponseEntity.ok(response);
        }).orElse(ResponseEntity.notFound().build());
    }

      @GetMapping("/export")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> exportUsers() {
        List<Users> allUsers = userRepository.findAll();
        
        List<Map<String, Object>> exportData = new ArrayList<>();
        
        for (Users user : allUsers) {
            Map<String, Object> userData = new HashMap<>();
            userData.put("id", user.getId().toString());
            userData.put("username", user.getUsername());
            userData.put("email", user.getEmail());
            userData.put("firstName", user.getFirstName());
            userData.put("lastName", user.getLastName());
            userData.put("role", user.getRole().toString());
            userData.put("department", user.getDepartment());
            userData.put("jobTitle", user.getJobTitle());
            
            // Include the generated password in the export
            userData.put("password", user.getLastGeneratedPassword());
            userData.put("passwordCreatedAt", user.getLastPasswordReset());
            
            // Get domains
            List<String> domainNames = user.getDomains().stream()
                .map(Domain::getName)
                .collect(Collectors.toList());
            userData.put("domains", String.join(", ", domainNames));
            
            exportData.add(userData);
        }
        
        return ResponseEntity.ok(exportData);
    }

    // Emergency password reset endpoint for testing
    @PutMapping("/reset-password-by-email")
    @PreAuthorize("permitAll()")
    public ResponseEntity<?> resetPasswordByEmail(@RequestBody Map<String, String> resetData) {
        String email = resetData.get("email");
        String newPassword = resetData.get("password");

        if (email == null || email.isEmpty()) {
            return ResponseEntity.badRequest().body(new MessageResponse("Error: Email is required"));
        }

        if (newPassword == null || newPassword.isEmpty()) {
            return ResponseEntity.badRequest().body(new MessageResponse("Error: New password is required"));
        }

        // Find user by email
        Optional<Users> userOptional = userRepository.findByEmail(email);
        if (userOptional.isEmpty()) {
            return ResponseEntity.badRequest().body(new MessageResponse("Error: User not found with email: " + email));
        }

        // Update password
        Users user = userOptional.get();
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        return ResponseEntity.ok(new MessageResponse("Password has been reset successfully for: " + email));
    }
}