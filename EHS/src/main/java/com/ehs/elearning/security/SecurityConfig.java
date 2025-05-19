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
        configuration.setAllowedOriginPatterns(Arrays.asList(
            "http://localhost:*",  // Any localhost port
            "https://localhost:*",
            "http://127.0.0.1:*",
            "https://127.0.0.1:*",
            "https://your-production-domain.com",
            "https://*.your-production-domain.com"
        ));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList("*"));
        configuration.setExposedHeaders(Arrays.asList("x-auth-token", "Authorization", "Content-Type"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);

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
                    .requestMatchers("/error").permitAll() // Allow error endpoint
                    
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
                    
                    // Reports endpoints
                    .requestMatchers("/api/reports/user/{userId}").authenticated()  // User can access own reports, admin can access any
                    .requestMatchers("/api/reports/domain/**").hasAuthority("ROLE_ADMIN")  // Admin only
                    .requestMatchers("/api/reports/export/**").hasAuthority("ROLE_ADMIN")  // Admin only
                    
                    // AI content generation endpoints
                    .requestMatchers("/api/ai/**").hasAuthority("ROLE_ADMIN")  // All AI endpoints are admin only
                    
                    // V2 Course management endpoints
                    .requestMatchers("/api/v2/admin/courses/**").hasAuthority("ROLE_ADMIN")  // Course admin endpoints
                    
                    // V2 User course endpoints
                    .requestMatchers("/api/v2/user/courses/**").hasAnyAuthority("ROLE_USER", "ROLE_ADMIN")  // User course endpoints
                    .requestMatchers("/api/v2/user/progress/**").hasAnyAuthority("ROLE_USER", "ROLE_ADMIN")  // User progress endpoints
                    .requestMatchers("/api/v2/user/assessment/**").hasAnyAuthority("ROLE_USER", "ROLE_ADMIN")  // User assessment endpoints
                    
                    // Module management endpoints
                    .requestMatchers(HttpMethod.GET, "/api/modules/**").authenticated()  // All users can read
                    .requestMatchers(HttpMethod.POST, "/api/modules/**").hasAuthority("ROLE_ADMIN")  // Only ADMIN can create
                    .requestMatchers(HttpMethod.PUT, "/api/modules/**").hasAuthority("ROLE_ADMIN")  // Only ADMIN can update
                    .requestMatchers(HttpMethod.DELETE, "/api/modules/**").hasAuthority("ROLE_ADMIN")  // Only ADMIN can delete
                    
                    // Materials endpoints - using v2 API
                    .requestMatchers(HttpMethod.GET, "/api/v2/materials").hasAnyAuthority("ROLE_ADMIN", "ROLE_USER")  // All users can view materials list
                    .requestMatchers(HttpMethod.GET, "/api/v2/materials/**").hasAnyAuthority("ROLE_ADMIN", "ROLE_USER")  // All users can view specific materials
                    .requestMatchers(HttpMethod.POST, "/api/v2/materials/upload").hasAuthority("ROLE_ADMIN")  // Only ADMIN can upload
                    .requestMatchers(HttpMethod.PUT, "/api/v2/materials/**").hasAuthority("ROLE_ADMIN")  // Only ADMIN can update
                    .requestMatchers(HttpMethod.DELETE, "/api/v2/materials/**").hasAuthority("ROLE_ADMIN")  // Only ADMIN can delete
                    
                    // Add debug endpoints
                    .requestMatchers("/api/debug/**").permitAll()
                    
                    // Fallback: all other requests require authentication
                    .anyRequest().authenticated()
            );

        http.authenticationProvider(authenticationProvider());

        // Add the JWT authentication filter
        http.addFilterBefore(jwtAuthenticationFilter(), UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}