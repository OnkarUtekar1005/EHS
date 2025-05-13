package com.ehs.elearning.security;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.util.matcher.AntPathRequestMatcher;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {
    @Autowired
    private UserDetailsServiceImpl userDetailsService;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @Autowired
    private JwtAuthenticationEntryPoint unauthorizedHandler;

    @Bean
    public JwtAuthenticationFilter jwtAuthenticationFilter() {
        return new JwtAuthenticationFilter();
    }

    @Bean
    public PreviewRequestFilter previewRequestFilter() {
        return new PreviewRequestFilter();
    }

    @Bean
    public DaoAuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider();
        authProvider.setUserDetailsService(userDetailsService);
        authProvider.setPasswordEncoder(passwordEncoder());
        return authProvider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authConfig) throws Exception {
        return authConfig.getAuthenticationManager();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(Arrays.asList(
            "http://localhost:3000",  // React frontend
            "http://localhost:8080",  // Spring Boot backend
            "https://your-production-domain.com"
        ));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList(
            "authorization", 
            "content-type", 
            "x-auth-token"
        ));
        configuration.setExposedHeaders(Arrays.asList("x-auth-token"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable)
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .exceptionHandling(exception -> exception.authenticationEntryPoint(unauthorizedHandler))
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> 
                auth
                    // Public endpoints (no authentication)
                    .requestMatchers("/api/auth/**").permitAll()
                    .requestMatchers("/api/auth/forgot-password").permitAll()
                    .requestMatchers("/api/auth/reset-password").permitAll()
                    .requestMatchers("/api/auth/reset-password/validate").permitAll()
                    .requestMatchers("/api/test/**").permitAll() // Test endpoints
                    .requestMatchers("/v3/api-docs/**").permitAll()
                    .requestMatchers("/swagger-ui/**").permitAll()
                    
                    // Domain management endpoints
                    .requestMatchers(HttpMethod.GET, "/api/domains/**").authenticated()  // All authenticated users can read
                    .requestMatchers(HttpMethod.POST, "/api/domains/**").hasAuthority("ROLE_ADMIN")  // Only ADMIN can create
                    .requestMatchers(HttpMethod.PUT, "/api/domains/**").hasAuthority("ROLE_ADMIN")   // Only ADMIN can update
                    .requestMatchers(HttpMethod.DELETE, "/api/domains/**").hasAuthority("ROLE_ADMIN")  // Only ADMIN can delete
                    
                    // User management endpoints
                    .requestMatchers(HttpMethod.GET, "/api/users").hasAuthority("ROLE_ADMIN")  // Only ADMIN can list all users
                    .requestMatchers(HttpMethod.POST, "/api/users").hasAuthority("ROLE_ADMIN")  // Only ADMIN can create users
                    .requestMatchers(HttpMethod.DELETE, "/api/users/**").hasAuthority("ROLE_ADMIN")  // Only ADMIN can delete users
                    .requestMatchers(HttpMethod.PUT, "/api/users/{id}/domains").hasAuthority("ROLE_ADMIN") // Only ADMIN can assign domains
                    .requestMatchers("/api/users/search").hasAuthority("ROLE_ADMIN") // Only ADMIN can search users
                    .requestMatchers("/api/users/{id}").authenticated()  // Users can access their own profile, admins can access any
                    
                    // Module management endpoints
                    .requestMatchers(HttpMethod.GET, "/api/modules/**").authenticated()  // All users can view modules
                    .requestMatchers(HttpMethod.POST, "/api/modules").authenticated()  // All users can create modules (will be filtered by service)
                    .requestMatchers(HttpMethod.PUT, "/api/modules/**").authenticated()  // Update modules (filtered by service)
                    .requestMatchers(HttpMethod.DELETE, "/api/modules/**").hasAuthority("ROLE_ADMIN")  // Only ADMIN can delete modules
                    .requestMatchers("/api/modules/{id}/publish").hasAuthority("ROLE_ADMIN")  // Only ADMIN can publish modules
                    .requestMatchers("/api/modules/{id}/archive").hasAuthority("ROLE_ADMIN")  // Only ADMIN can archive modules
                    .requestMatchers("/api/modules/{id}/clone").authenticated()  // All users can clone modules
                    
                    // Component management endpoints
                    .requestMatchers(HttpMethod.GET, "/api/modules/{moduleId}/components").authenticated()  // All users can view components
                    .requestMatchers(HttpMethod.GET, "/api/components/**").authenticated()  // All users can view specific components
                    .requestMatchers(HttpMethod.POST, "/api/modules/{moduleId}/components").authenticated()  // All users can add components
                    .requestMatchers(HttpMethod.PUT, "/api/components/**").authenticated()  // Update components
                    .requestMatchers(HttpMethod.DELETE, "/api/components/**").authenticated()  // Delete components
                    .requestMatchers("/api/modules/{moduleId}/components/reorder").authenticated()  // Reorder components
                    
                    // Question/Assessment endpoints
                    .requestMatchers(HttpMethod.GET, "/api/components/{id}/questions").authenticated()  // All users can view questions
                    .requestMatchers(HttpMethod.POST, "/api/components/{id}/questions").authenticated()  // Add questions
                    .requestMatchers(HttpMethod.PUT, "/api/questions/**").authenticated()  // Update questions
                    .requestMatchers(HttpMethod.DELETE, "/api/questions/**").authenticated()  // Delete questions
                    .requestMatchers("/api/components/{id}/submit").authenticated()  // Submit assessment answers
                    
                    // Learning Materials endpoints
                    .requestMatchers(HttpMethod.GET, "/api/components/{id}/materials").permitAll()  // View materials
                    .requestMatchers(HttpMethod.POST, "/api/components/{id}/materials/**").authenticated()  // Add materials
                    .requestMatchers(HttpMethod.PUT, "/api/materials/**").authenticated()  // Update materials
                    .requestMatchers(HttpMethod.DELETE, "/api/materials/**").authenticated()  // Delete materials
                    .requestMatchers("/api/materials/reorder").authenticated()  // Reorder materials
                    .requestMatchers("/api/components/{id}/materials/track").authenticated()  // Track material progress
                    .requestMatchers("/api/components/{id}/progress").authenticated()  // Get user progress
                    // Preview endpoints - allow anonymous access with simpler configuration
                    .requestMatchers("/api/materials/*/stream").permitAll()
                    .requestMatchers("/api/materials/*/preview-info").permitAll()
                    // Add this to your security configuration
                    .requestMatchers(HttpMethod.POST,"/api/components/learning/materials/upload").permitAll()
                    
                    // Progress tracking endpoints
                    .requestMatchers(HttpMethod.GET, "/api/progress/user/{userId}").authenticated()  // View user progress
                    .requestMatchers(HttpMethod.GET, "/api/progress/module/{moduleId}").hasAuthority("ROLE_ADMIN")  // Admin can view all user progress
                    .requestMatchers("/api/progress/user/{userId}/module/{moduleId}").authenticated()  // View specific progress
                    .requestMatchers("/api/progress/module/{moduleId}/start").authenticated()  // Start module
                    .requestMatchers("/api/progress/module/{moduleId}/component/{componentId}/complete").authenticated()  // Complete component
                    .requestMatchers("/api/progress/user/dashboard").authenticated()  // Get dashboard data
                    
                    // Reports endpoints
                    .requestMatchers("/api/reports/user/{userId}").authenticated()  // User can access own reports, admin can access any
                    .requestMatchers("/api/reports/module/**").hasAuthority("ROLE_ADMIN")  // Admin only
                    .requestMatchers("/api/reports/domain/**").hasAuthority("ROLE_ADMIN")  // Admin only
                    .requestMatchers("/api/reports/comparison").hasAuthority("ROLE_ADMIN")  // Admin only
                    .requestMatchers("/api/reports/export/**").hasAuthority("ROLE_ADMIN")  // Admin only
                    
                    // AI content generation endpoints
                    .requestMatchers("/api/ai/**").hasAuthority("ROLE_ADMIN")  // All AI endpoints are admin only
                    
                    // Fallback: all other requests require authentication
                    .anyRequest().authenticated()
            );

        http.authenticationProvider(authenticationProvider());

        // Add the PreviewRequestFilter before the JWT filter to ensure it's applied early in the chain
        http.addFilterBefore(previewRequestFilter(), UsernamePasswordAuthenticationFilter.class);

        // Add the JWT authentication filter
        http.addFilterBefore(jwtAuthenticationFilter(), UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}