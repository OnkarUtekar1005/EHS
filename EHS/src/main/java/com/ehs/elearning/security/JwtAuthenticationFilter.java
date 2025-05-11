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
            response.setHeader("X-Frame-Options", "ALLOWALL");
            response.setHeader("Content-Security-Policy", "frame-ancestors *");

            filterChain.doFilter(request, response);
            return;
        }

        try {
            String jwt = jwtTokenProvider.resolveToken(request);

            // Debug token resolution process
            if (jwt != null) {
                if (jwtTokenProvider.validateToken(jwt)) {
                    Authentication auth = jwtTokenProvider.getAuthentication(jwt);

                    // Set authentication in context
                    SecurityContextHolder.getContext().setAuthentication(auth);

                    // Optional: You can also add token claims as request attributes for easier access in controllers
                    request.setAttribute("userId", jwtTokenProvider.getUserIdFromToken(jwt));
                    request.setAttribute("userRoles", jwtTokenProvider.getRolesFromToken(jwt));
                }
            } else {
                // Only log for non-OPTIONS requests to reduce noise
                if (!request.getMethod().equals("OPTIONS")) {
                    logger.debug("No JWT token found in request headers");
                }
            }
        } catch (Exception e) {
            logger.error("Could not set user authentication in security context", e);
        }

        filterChain.doFilter(request, response);
    }
}