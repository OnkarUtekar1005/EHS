package com.ehs.elearning.security;

import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Filter to add Content Security Policy headers to all responses.
 * Simplified approach that prioritizes compatibility over strict security.
 * This implementation is heavily focused on allowing file viewing in iframes.
 */
public class ContentSecurityPolicyFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String requestURI = request.getRequestURI();
        
        // Check if this is a file/material request
        boolean isFileRequest = requestURI.contains("/files/") || requestURI.contains("/materials/");
        boolean isStreamRequest = requestURI.contains("/stream");

        // For all requests, set basic headers
        response.setHeader("Access-Control-Allow-Origin", "*");
        response.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
        response.setHeader("Access-Control-Allow-Headers", "Content-Type, Range, Authorization");
        
        // For file/material streaming requests, be extremely permissive
        if (isFileRequest && isStreamRequest) {
            // Allow embedding in iframes from any origin
            response.setHeader("X-Frame-Options", "ALLOWALL");
            
            // Completely permissive CSP for file viewing
            response.setHeader("Content-Security-Policy", "default-src * 'unsafe-inline' 'unsafe-eval'; frame-ancestors *;");
            
            // Add additional headers for range requests (important for video streaming and PDFs)
            response.setHeader("Access-Control-Expose-Headers", 
                "Accept-Ranges, Content-Range, Content-Length, Content-Type, Content-Disposition");
            
            // Disable cache control for development - remove this in production
            response.setHeader("Cache-Control", "no-store, must-revalidate");
            response.setHeader("Pragma", "no-cache");
            
            // Set X-Content-Type-Options to nosniff to ensure browser respects the content type
            response.setHeader("X-Content-Type-Options", "nosniff");
        } 
        // For regular file requests, still be permissive
        else if (isFileRequest) {
            // Allow embedding in iframes
            response.setHeader("X-Frame-Options", "ALLOWALL");
            
            // Very permissive CSP for file viewing
            response.setHeader("Content-Security-Policy", "frame-ancestors *;");
            
            // Add CORS headers for range requests
            response.setHeader("Access-Control-Expose-Headers", 
                "Content-Length, Content-Type, Content-Disposition");
        } 
        // For regular app requests, use a somewhat permissive policy
        else {
            response.setHeader(
                "Content-Security-Policy",
                "default-src * 'unsafe-inline' 'unsafe-eval'; " +
                "img-src * data: blob:; " +
                "media-src * blob:; " +
                "frame-src *; " +
                "connect-src *; " +
                "worker-src blob:;"
            );
            
            // Allow embedding from same origin for non-file resources
            response.setHeader("X-Frame-Options", "SAMEORIGIN");
        }

        // Continue with the filter chain
        filterChain.doFilter(request, response);
    }
}