package com.ehs.elearning.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.ehs.elearning.model.PasswordResetToken;
import com.ehs.elearning.model.Role;
import com.ehs.elearning.model.Users;
import com.ehs.elearning.payload.request.LoginRequest;
import com.ehs.elearning.payload.request.RegisterRequest;
import com.ehs.elearning.payload.response.JwtResponse;
import com.ehs.elearning.payload.response.MessageResponse;
import com.ehs.elearning.repository.PasswordResetTokenRepository;
import com.ehs.elearning.repository.UserRepository;
import com.ehs.elearning.security.JwtTokenProvider;
import com.ehs.elearning.security.UserDetailsImpl;
import com.ehs.elearning.service.EmailService;

import jakarta.validation.Valid;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping(value = "/api/auth", produces = "application/json")
public class AuthController {
    @Autowired
    private AuthenticationManager authenticationManager;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private PasswordEncoder passwordEncoder;
    @Autowired
    private JwtTokenProvider jwtTokenProvider;
    @Autowired
    private PasswordResetTokenRepository passwordResetTokenRepository;
    @Autowired
    private EmailService emailService;

    @PostMapping(path = "/login", produces = "application/json")
    public ResponseEntity<?> authenticateUser(@Valid @RequestBody LoginRequest loginRequest) {
        Authentication authentication = authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(loginRequest.getUsername(), loginRequest.getPassword())
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);
        String jwt = jwtTokenProvider.generateToken(authentication);

        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        String role = userDetails.getAuthorities().stream()
                .findFirst()
                .map(item -> item.getAuthority().replace("ROLE_", ""))
                .orElse("");

        return ResponseEntity.ok(new JwtResponse(
            jwt,
            userDetails.getId(),
            userDetails.getUsername(),
            userDetails.getEmail(),
            role
        ));
    }

    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@Valid @RequestBody RegisterRequest registerRequest) {
        if (userRepository.existsByUsername(registerRequest.getUsername())) {
            return ResponseEntity
                .badRequest()
                .body(new MessageResponse("Error: Username is already taken!"));
        }

        if (userRepository.existsByEmail(registerRequest.getEmail())) {
            return ResponseEntity
                .badRequest()
                .body(new MessageResponse("Error: Email is already in use!"));
        }

        // Create new user's account
        Users user = new Users(
            registerRequest.getUsername(),
            registerRequest.getEmail(),
            passwordEncoder.encode(registerRequest.getPassword())
        );

        // Set role
  
        String strRole = registerRequest.getRole();
        if (strRole == null || strRole.isEmpty()) {
            user.setRole(Role.USER);
        } else {
            try {
                user.setRole(Role.valueOf(strRole.toUpperCase()));
            } catch (IllegalArgumentException e) {
                user.setRole(Role.USER); // Default to USER if invalid role
            }
        }

        userRepository.save(user);

        return ResponseEntity.ok(new MessageResponse("User registered successfully!"));
    }
    
    @GetMapping("/user")
    public ResponseEntity<?> getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();

        String role = userDetails.getAuthorities().stream()
                .findFirst()
                .map(item -> item.getAuthority().replace("ROLE_", ""))
                .orElse("");

        return ResponseEntity.ok(new JwtResponse
        		(
            null,
            userDetails.getId(),
            userDetails.getUsername(),
            userDetails.getEmail(),
            role
        ));
    }

    /**
     * Request a password reset by email
     */
    @PostMapping("/forgot-password")
    public ResponseEntity<?> requestPasswordReset(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        if (email == null || email.isEmpty()) {
            return ResponseEntity.badRequest()
                .body(new MessageResponse("Error: Email is required"));
        }

        Optional<Users> userOptional = userRepository.findByEmail(email);
        if (userOptional.isEmpty()) {
            // For security reasons, don't reveal that the email doesn't exist
            return ResponseEntity.ok(new MessageResponse(
                "If your email exists in our system, you will receive a password reset link shortly."));
        }

        Users user = userOptional.get();

        // Clean up any existing tokens for this user
        passwordResetTokenRepository.findByUser(user).ifPresent(token ->
            passwordResetTokenRepository.delete(token));

        // Create a new token
        String token = UUID.randomUUID().toString();
        PasswordResetToken resetToken = new PasswordResetToken(token, user);
        passwordResetTokenRepository.save(resetToken);

        // Send email with reset link
        boolean emailSent = emailService.sendPasswordResetEmail(user.getEmail(), token);

        if (!emailSent) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new MessageResponse("Error: Failed to send password reset email"));
        }

        return ResponseEntity.ok(new MessageResponse(
            "If your email exists in our system, you will receive a password reset link shortly."));
    }

    /**
     * Validate a password reset token
     */
    @GetMapping("/reset-password/validate")
    public ResponseEntity<?> validatePasswordResetToken(@RequestParam("token") String token) {
        Optional<PasswordResetToken> tokenOptional = passwordResetTokenRepository.findByToken(token);

        if (tokenOptional.isEmpty() || !tokenOptional.get().isValid()) {
            return ResponseEntity.badRequest()
                .body(new MessageResponse("Error: Invalid or expired password reset token"));
        }

        return ResponseEntity.ok(new MessageResponse("Token is valid"));
    }

    /**
     * Reset password using token
     */
    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody Map<String, String> request) {
        String token = request.get("token");
        String password = request.get("password");

        if (token == null || token.isEmpty()) {
            return ResponseEntity.badRequest()
                .body(new MessageResponse("Error: Token is required"));
        }

        if (password == null || password.isEmpty()) {
            return ResponseEntity.badRequest()
                .body(new MessageResponse("Error: Password is required"));
        }

        Optional<PasswordResetToken> tokenOptional = passwordResetTokenRepository.findByToken(token);

        if (tokenOptional.isEmpty() || !tokenOptional.get().isValid()) {
            return ResponseEntity.badRequest()
                .body(new MessageResponse("Error: Invalid or expired password reset token"));
        }

        PasswordResetToken resetToken = tokenOptional.get();
        Users user = resetToken.getUser();

        // Update password
        user.setPassword(passwordEncoder.encode(password));
        userRepository.save(user);

        // Mark token as used
        resetToken.setUsed(true);
        passwordResetTokenRepository.save(resetToken);

        return ResponseEntity.ok(new MessageResponse("Password has been reset successfully"));
    }
}