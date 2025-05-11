package com.ehs.elearning.security;

import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Filter specifically for handling preview requests.
 * This filter runs before any other security filters to ensure headers are set correctly.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class PreviewRequestFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        
        String requestURI = request.getRequestURI();
        String queryString = request.getQueryString();
        
        boolean isPreviewRequest = requestURI.contains("/materials/") &&
                                  (requestURI.endsWith("/stream") || requestURI.endsWith("/preview-info")) &&
                                  (queryString != null && queryString.contains("preview=true"));

        // Flag for API requests to ensure CORS headers are set properly
        boolean isApiRequest = requestURI.startsWith("/api/");
        
        // Handle CORS preflight requests
        boolean isPreflight = request.getMethod().equals("OPTIONS");
        
        // Set appropriate headers for preview requests, API requests, and preflight requests
        if (isPreviewRequest || isPreflight || isApiRequest) {
            // Log the request
            logger.info("Preview or preflight request detected: " + requestURI + 
                      (queryString != null ? "?" + queryString : ""));
            
            // Set CORS headers
            response.setHeader("Access-Control-Allow-Origin", "*");
            response.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, HEAD, OPTIONS");
            response.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
            response.setHeader("Access-Control-Max-Age", "3600");
            
            // Set headers for iframe embedding
            response.setHeader("X-Frame-Options", "ALLOWALL");
            response.setHeader("Content-Security-Policy", "frame-ancestors *");
            
            // Add caching headers for preview requests
            if (isPreviewRequest) {
                response.setHeader("Cache-Control", "max-age=3600"); // Cache for 1 hour
            }
            
            // Handle preflight requests
            if (isPreflight) {
                response.setStatus(HttpServletResponse.SC_OK);
                return; // Don't continue filter chain for preflight
            }
        }
        
        // Continue with the filter chain
        filterChain.doFilter(request, response);
    }
}