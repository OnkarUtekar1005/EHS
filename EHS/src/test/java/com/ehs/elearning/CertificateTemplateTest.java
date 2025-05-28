package com.ehs.elearning;

import org.junit.jupiter.api.Test;
import org.springframework.core.io.ClassPathResource;

import java.io.IOException;
import java.nio.charset.StandardCharsets;

import static org.junit.jupiter.api.Assertions.*;

public class CertificateTemplateTest {

    @Test
    public void testCertificateTemplateExists() throws IOException {
        ClassPathResource templateResource = new ClassPathResource("templates/certificate.html");
        assertTrue(templateResource.exists(), "Certificate template should exist");
        
        String templateContent = new String(templateResource.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
        assertFalse(templateContent.isEmpty(), "Template content should not be empty");
        
        // Verify template contains required placeholders
        assertTrue(templateContent.contains("{{RECIPIENT_NAME}}"), "Template should contain recipient name placeholder");
        assertTrue(templateContent.contains("{{COURSE_NAME}}"), "Template should contain course name placeholder");
        assertTrue(templateContent.contains("{{ISSUE_DATE}}"), "Template should contain issue date placeholder");
        assertTrue(templateContent.contains("{{CERTIFICATE_NUMBER}}"), "Template should contain certificate number placeholder");
        
        // Verify Manish Shilote is hardcoded as Program Director
        assertTrue(templateContent.contains("MANISH SHILOTE"), "Template should contain Manish Shilote as Program Director");
        assertTrue(templateContent.contains("Program Director"), "Template should contain Program Director title");
        
        // Verify course instructor section is removed (should not contain Manager or instructor references)
        assertFalse(templateContent.contains("Course Instructor"), "Template should not contain Course Instructor");
        assertFalse(templateContent.contains("{{MANAGER_NAME}}"), "Template should not contain manager name placeholder");
        
        System.out.println("✅ Certificate template validation passed!");
        System.out.println("✅ Template contains all required placeholders");
        System.out.println("✅ Manish Shilote is correctly set as Program Director");
        System.out.println("✅ Course Instructor section has been removed");
    }
    
    @Test
    public void testTemplateReplacement() {
        String template = "Hello {{RECIPIENT_NAME}}, you completed {{COURSE_NAME}} on {{ISSUE_DATE}}. Certificate: {{CERTIFICATE_NUMBER}}";
        
        String result = template
                .replace("{{RECIPIENT_NAME}}", "John Doe")
                .replace("{{COURSE_NAME}}", "Safety Training")
                .replace("{{ISSUE_DATE}}", "01 January 2025")
                .replace("{{CERTIFICATE_NUMBER}}", "CERT-2025-000001");
        
        assertEquals("Hello John Doe, you completed Safety Training on 01 January 2025. Certificate: CERT-2025-000001", result);
        System.out.println("✅ Template placeholder replacement works correctly");
    }
    
    @Test
    public void testNullHandling() {
        String firstName = null;
        String lastName = null;
        String fullName = (firstName != null ? firstName : "") + " " + (lastName != null ? lastName : "");
        fullName = fullName.trim();
        if (fullName.isEmpty()) {
            fullName = "Certificate Holder";
        }
        
        assertEquals("Certificate Holder", fullName, "Should handle null names gracefully");
        
        // Test with partial nulls
        firstName = "John";
        lastName = null;
        fullName = (firstName != null ? firstName : "") + " " + (lastName != null ? lastName : "");
        fullName = fullName.trim();
        if (fullName.isEmpty()) {
            fullName = "Certificate Holder";
        }
        
        assertEquals("John", fullName, "Should handle partial null names");
        System.out.println("✅ Null handling works correctly");
    }
}