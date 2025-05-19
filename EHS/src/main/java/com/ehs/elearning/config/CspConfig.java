package com.ehs.elearning.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpHeaders;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class CspConfig implements WebMvcConfigurer {

    // CORS is already configured in SecurityConfig - no need to duplicate here
    // @Override
    // public void addCorsMappings(CorsRegistry registry) {
    //     registry.addMapping("/**")
    //         .allowedOriginPatterns("http://localhost:*", "https://localhost:*", "http://127.0.0.1:*", "https://127.0.0.1:*", "https://drive.google.com", "https://accounts.google.com")
    //         .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
    //         .allowedHeaders("*")
    //         .exposedHeaders(HttpHeaders.CONTENT_TYPE, HttpHeaders.CONTENT_DISPOSITION, "Content-Security-Policy", "Authorization")
    //         .allowCredentials(true)
    //         .maxAge(3600);
    // }
}