package com.ehs.elearning.security;

import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Filter to add Content Security Policy headers to all responses.
 * This allows 'unsafe-eval' for JavaScript which is required by
 * some libraries like chart.js, video players, and other dynamic components.
 */
public class ContentSecurityPolicyFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String requestURI = request.getRequestURI();
        boolean isPreviewRequest = requestURI.contains("/materials/") &&
                                  (requestURI.endsWith("/stream") || requestURI.endsWith("/preview-info")) &&
                                  "true".equals(request.getParameter("preview"));

        if (isPreviewRequest) {
            // For preview requests, allow embedding in iframes from any origin
            response.setHeader("X-Frame-Options", "ALLOWALL");
            response.setHeader("Content-Security-Policy", "frame-ancestors *");

            // Add CORS headers for preview requests
            response.setHeader("Access-Control-Allow-Origin", "*");
            response.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
            response.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
        } else {
            // Add Content Security Policy header to allow unsafe-eval
            response.setHeader(
                "Content-Security-Policy",
                "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
                "style-src 'self' 'unsafe-inline'; img-src 'self' data:; " +
                "media-src 'self' blob:; object-src 'self'; frame-src 'self'"
            );

            // Default deny iframe embedding for non-preview requests
            response.setHeader("X-Frame-Options", "DENY");
        }

        // Continue with the filter chain
        filterChain.doFilter(request, response);
    }
}