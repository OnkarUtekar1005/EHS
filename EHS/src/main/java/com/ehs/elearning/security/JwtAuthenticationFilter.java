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
                    
                
                } else {
                  
                }
            } else {
                // Only log for non-OPTIONS requests to reduce noise
                if (!request.getMethod().equals("OPTIONS")) {
                
                }
            }
        } catch (Exception e) {
     
        }

        filterChain.doFilter(request, response);
    }
}