package com.ehs.elearning.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.UUID;

@RequiredArgsConstructor
@Slf4j
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        // Get path and query for analysis
        String requestURI = request.getRequestURI();
        String queryString = request.getQueryString();

        // Simplified check for preview endpoints - any request to these endpoints bypasses JWT
        boolean isStreamRequest = requestURI.contains("/materials/") && requestURI.endsWith("/stream");
        boolean isPreviewInfoRequest = requestURI.contains("/materials/") && requestURI.endsWith("/preview-info");
        boolean isOptionsRequest = request.getMethod().equals("OPTIONS");

        // Check if this is a preview endpoint access
        if (isStreamRequest || isPreviewInfoRequest || isOptionsRequest) {
            logger.info("Preview or OPTIONS request detected, skipping JWT validation: " + requestURI);

            // Set headers for CORS
            response.setHeader("Access-Control-Allow-Origin", "*");
            response.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
            response.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
            response.setHeader("Access-Control-Max-Age", "3600");

            // Headers for iframe embedding
            response.setHeader("X-Frame-Options", "SAMEORIGIN");
            response.setHeader("Content-Security-Policy", 
                "frame-src https://drive.google.com https://accounts.google.com https://*.google.com; " +
                "frame-ancestors 'self' https://drive.google.com");

            filterChain.doFilter(request, response);
            return;
        }

        try {
            String authHeader = request.getHeader("Authorization");
//            logger.debug("Authorization header: {}", authHeader);
            
            String jwt = jwtTokenProvider.resolveToken(request);
//            logger.debug("Resolved JWT token: {}", jwt != null ? "Token found" : "No token");

            if (jwt != null) {
                logger.debug("Validating JWT token...");
                if (jwtTokenProvider.validateToken(jwt)) {
                    logger.debug("JWT token is valid");
                    Authentication auth = jwtTokenProvider.getAuthentication(jwt);
                    
                    // Set authentication in context
                    SecurityContextHolder.getContext().setAuthentication(auth);
//                    logger.debug("Authentication set in security context for user: {}", auth.getName());
                    
                    // Optional: You can also add token claims as request attributes for easier access in controllers
                    UUID userId = jwtTokenProvider.getUserIdFromToken(jwt);
                    String userRoles = jwtTokenProvider.getRolesFromToken(jwt);
                    request.setAttribute("userId", userId);
                    request.setAttribute("userRoles", userRoles);
//                    logger.debug("Set request attributes - User ID: {}, Roles: {}", userId, userRoles);
                } else {
//                    logger.warn("JWT token validation failed for URI: {}", requestURI);
                }
            } else {
                // Only log for non-OPTIONS requests to reduce noise
                if (!request.getMethod().equals("OPTIONS")) {
//                    logger.warn("No JWT token found in request headers for URI: {}", requestURI);
                }
            }
        } catch (Exception e) {
//            logger.error("Could not set user authentication in security context for URI: {}", requestURI, e);
        }

        filterChain.doFilter(request, response);
    }
}