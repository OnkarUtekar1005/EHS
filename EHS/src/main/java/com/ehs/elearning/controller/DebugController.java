package com.ehs.elearning.controller;

import com.ehs.elearning.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/debug")
@CrossOrigin(origins = "*", maxAge = 3600)
@RequiredArgsConstructor
@Slf4j
public class DebugController {
    
    private final JwtTokenProvider jwtTokenProvider;
    
    @GetMapping("/jwt-info")
    public ResponseEntity<?> getJwtInfo(HttpServletRequest request) {
        Map<String, Object> response = new HashMap<>();
        
        String authHeader = request.getHeader("Authorization");
        response.put("authHeader", authHeader);
        
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            response.put("tokenLength", token.length());
            
            try {
                boolean isValid = jwtTokenProvider.validateToken(token);
                response.put("isValid", isValid);
                
                if (isValid) {
                    String username = jwtTokenProvider.getUsernameFromToken(token);
                    String roles = jwtTokenProvider.getRolesFromToken(token);
                    
                    response.put("username", username);
                    response.put("roles", roles);
                } else {
                    response.put("error", "Token validation failed");
                }
            } catch (Exception e) {
                response.put("error", e.getMessage());
                response.put("errorType", e.getClass().getSimpleName());
                log.error("Error processing JWT", e);
            }
        } else {
            response.put("error", "No Bearer token found");
        }
        
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/test-auth")
    public ResponseEntity<?> testAuth(HttpServletRequest request) {
        log.info("Test auth endpoint called");
        log.info("Authorization header: {}", request.getHeader("Authorization"));
        
        Map<String, Object> response = new HashMap<>();
        response.put("message", "Test endpoint reached");
        response.put("authHeader", request.getHeader("Authorization"));
        
        return ResponseEntity.ok(response);
    }
}