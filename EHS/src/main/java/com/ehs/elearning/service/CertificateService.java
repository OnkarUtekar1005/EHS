// REPLACE YOUR EXISTING CertificateService.java WITH THIS ENHANCED VERSION
package com.ehs.elearning.service;

import com.ehs.elearning.model.*;
import com.ehs.elearning.repository.CertificateRepository;
import com.ehs.elearning.repository.UserCourseProgressRepository;
import com.openhtmltopdf.pdfboxout.PdfRendererBuilder;
import com.openhtmltopdf.util.XRLog;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.core.io.ResourceLoader;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.annotation.PostConstruct;
import java.io.ByteArrayOutputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.Base64;
import java.util.List;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Optional;
import java.util.UUID;
import java.util.logging.Level;
import java.util.logging.Logger;

@Service
public class CertificateService {
    
    private static final Logger logger = Logger.getLogger(CertificateService.class.getName());
    private static final DateTimeFormatter DATE_FORMAT = DateTimeFormatter.ofPattern("dd MMMM yyyy");
    
    @Autowired
    private CertificateRepository certificateRepository;

    @Autowired
    private UserCourseProgressRepository userCourseProgressRepository;

    @Autowired
    private com.ehs.elearning.repository.CourseRepository courseRepository;

    @Autowired
    private ResourceLoader resourceLoader;

    @Value("${certificate.storage.path:uploads/certificates}")
    private String certificateStoragePath;
    
    @Value("${certificate.expiry.years:1}")
    private int certificateExpiryYears;
    
    // Configurable signature details - now single signature
    @Value("${certificate.program.director.name:MANISH SHILOTE}")
    private String programDirectorName;
    
    @Value("${certificate.program.director.title:Program Director}")
    private String programDirectorTitle;
    
    @Value("${certificate.verification.url:yoursite.com/verify}")
    private String verificationUrl;

    @Value("${certificate.logo.path:static/images/logo.jpeg}")
    private String logoPath;

    private String certificateTemplate;
    private String logoBase64;
    
    @PostConstruct
    public void init() {
        logger.info("🚀 INITIALIZING ENHANCED CERTIFICATE SERVICE");
        try {
            Path certificatePath = Paths.get(certificateStoragePath);
            if (!Files.exists(certificatePath)) {
                Files.createDirectories(certificatePath);
                logger.info("Certificate directory created: " + certificateStoragePath);
            }

            loadCertificateTemplate();
            loadLogoAsBase64();
        } catch (IOException e) {
            logger.log(Level.SEVERE, "Failed to initialize certificate service", e);
        }
    }

    private void loadLogoAsBase64() throws IOException {
        logger.info("🖼️ LOADING LOGO AS BASE64");
        try {
            Resource logoResource = resourceLoader.getResource("classpath:" + logoPath);
            if (!logoResource.exists()) {
                logger.severe("❌ LOGO NOT FOUND: " + logoPath);
                throw new IOException("Logo not found");
            }

            try (InputStream inputStream = logoResource.getInputStream()) {
                byte[] logoBytes = inputStream.readAllBytes();
                logoBase64 = Base64.getEncoder().encodeToString(logoBytes);
                logger.info("✅ LOGO LOADED SUCCESSFULLY. Size: " + logoBytes.length + " bytes");
            }
        } catch (Exception e) {
            logger.log(Level.SEVERE, "Failed to load logo", e);
            // Provide empty base64 string to avoid null pointer exceptions
            logoBase64 = "";
            throw new IOException("Logo loading failed: " + e.getMessage(), e);
        }
    }
    
    private void loadCertificateTemplate() throws IOException {
        logger.info("🎨 LOADING ENHANCED CERTIFICATE TEMPLATE");
        try {
            ClassPathResource templateResource = new ClassPathResource("templates/certificate.html");
            if (!templateResource.exists()) {
                logger.severe("❌ TEMPLATE NOT FOUND: templates/certificate.html");
                throw new IOException("Certificate template not found");
            }
            
            try (InputStream inputStream = templateResource.getInputStream()) {
                certificateTemplate = new String(inputStream.readAllBytes(), StandardCharsets.UTF_8);
            }
            
            if (certificateTemplate == null || certificateTemplate.trim().isEmpty()) {
                throw new IOException("Certificate template is empty");
            }
            
            logger.info("✅ ENHANCED TEMPLATE LOADED SUCCESSFULLY. Size: " + certificateTemplate.length() + " characters");
            
            // Verify critical elements from the new design
            if (certificateTemplate.contains("bg-triangle-tl")) {
                logger.info("✅ TRIANGULAR GEOMETRIC SHAPES FOUND IN TEMPLATE");
            } else {
                logger.warning("❌ TRIANGULAR GEOMETRIC SHAPES NOT FOUND");
            }
            
            if (certificateTemplate.contains("MANISH SHILOTE") || certificateTemplate.contains("{{PROGRAM_DIRECTOR_NAME}}")) {
                logger.info("✅ PROGRAM DIRECTOR SIGNATURE SECTION FOUND IN TEMPLATE");
            } else {
                logger.warning("❌ PROGRAM DIRECTOR SIGNATURE SECTION NOT PROPERLY CONFIGURED");
            }
            
        } catch (Exception e) {
            logger.log(Level.SEVERE, "Failed to load certificate template", e);
            throw new IOException("Template loading failed: " + e.getMessage(), e);
        }
    }
    
    @Transactional
    public Certificate generateCertificate(UUID userId, UUID courseId) {
        logger.info("🎯 GENERATING CERTIFICATE WITH ENHANCED DESIGN");

        // Check if certificate already exists
        Optional<Certificate> existingCert = certificateRepository.findByUserIdAndCourseId(userId, courseId);
        if (existingCert.isPresent()) {
            logger.info("Certificate already exists, returning existing one");
            return existingCert.get();
        }

        // Get user course progress
        UserCourseProgress progress = userCourseProgressRepository.findByUserIdAndCourseId(userId, courseId)
            .orElseThrow(() -> new RuntimeException("User course progress not found"));

        // Verify course is completed
        if (progress.getStatus() != ProgressStatus.COMPLETED) {
            throw new RuntimeException("Course not completed");
        }

        // Verify course is currently published
        if (progress.getCourse().getStatus() != Course.CourseStatus.PUBLISHED) {
            throw new RuntimeException("Certificate cannot be generated - course is not currently published");
        }
        
        // Generate certificate number
        String certificateNumber = generateCertificateNumber();
        
        // Create certificate entity
        Certificate certificate = new Certificate();
        certificate.setUser(progress.getUser());
        certificate.setCourse(progress.getCourse());
        certificate.setCertificateNumber(certificateNumber);
        certificate.setVerificationCode(UUID.randomUUID().toString());
        certificate.setIssuedDate(LocalDateTime.now());
        certificate.setExpiryDate(LocalDateTime.now().plusYears(certificateExpiryYears));
        certificate.setStatus(CertificateStatus.ACTIVE);
        
        // Save certificate to database first
        certificate = certificateRepository.save(certificate);
        
        // Generate PDF with enhanced design
        try {
            logger.info("🔧 GENERATING PDF WITH ENHANCED DESIGN");
            String pdfPath = generateEnhancedCertificatePDF(certificate);
            certificate.setFilePath(pdfPath);
            certificate = certificateRepository.save(certificate);
            logger.info("✅ ENHANCED CERTIFICATE GENERATED SUCCESSFULLY");
        } catch (Exception e) {
            logger.log(Level.SEVERE, "❌ FAILED TO GENERATE ENHANCED CERTIFICATE", e);
            throw new RuntimeException("Failed to generate certificate PDF: " + e.getMessage());
        }
        
        return certificate;
    }
    
    // We're using base64 embedded images, so we don't need URI resolvers or stream factories

    private String generateEnhancedCertificatePDF(Certificate certificate) throws IOException {
        logger.info("🎨 CREATING ENHANCED CERTIFICATE PDF");

        String fileName = certificate.getId() + ".pdf";
        String filePath = certificateStoragePath + "/" + fileName;

        try {
            // Prepare HTML content with enhanced styling
            String htmlContent = prepareEnhancedCertificateHtml(certificate);
            logger.info("📝 Enhanced HTML content prepared. Length: " + htmlContent.length());

            // Validate critical elements
            validateTemplateElements(htmlContent);

            // Generate PDF using OpenHTMLtoPDF with enhanced settings
            try (ByteArrayOutputStream outputStream = new ByteArrayOutputStream()) {
                logger.info("🔧 STARTING ENHANCED PDF RENDERING");

                PdfRendererBuilder builder = new PdfRendererBuilder();
                builder.withHtmlContent(htmlContent, null);
                builder.useFastMode();

                // No need for resource handlers since we're using base64 embedded images

                builder.useFont(() -> {
                    try {
                        // You can add custom fonts here if needed
                        return CertificateService.class.getResourceAsStream("/fonts/arial.ttf");
                    } catch (Exception e) {
                        return null;
                    }
                }, "Arial");
                builder.toStream(outputStream);
                
                builder.run();
                logger.info("✅ ENHANCED PDF RENDERING COMPLETED");
                
                byte[] pdfData = outputStream.toByteArray();
                if (pdfData.length == 0) {
                    throw new IOException("Generated PDF is empty");
                }
                
                // Save to file
                try (FileOutputStream fos = new FileOutputStream(filePath)) {
                    fos.write(pdfData);
                }
                
                logger.info("✅ ENHANCED CERTIFICATE SAVED: " + filePath + " (size: " + pdfData.length + " bytes)");
            }
            
            return filePath;
            
        } catch (Exception e) {
            logger.log(Level.SEVERE, "❌ FAILED TO GENERATE ENHANCED CERTIFICATE", e);
            throw new IOException("Enhanced certificate generation failed: " + e.getMessage(), e);
        }
    }
    
    private void validateTemplateElements(String htmlContent) {
        logger.info("🔍 VALIDATING TEMPLATE ELEMENTS");

        String[] requiredElements = {
            "bg-triangle-tl", "bg-triangle-tr", "bg-triangle-bl", "bg-triangle-br",
            "certificate-title", "signatures", "signature-name", "company-logo"
        };
        
        for (String element : requiredElements) {
            if (htmlContent.contains(element)) {
                logger.info("✅ Found required element: " + element);
            } else {
                logger.warning("❌ Missing required element: " + element);
            }
        }
    }
    
    private String prepareEnhancedCertificateHtml(Certificate certificate) {
        logger.info("📝 PREPARING ENHANCED CERTIFICATE HTML");
        
        // Handle null values safely
        String firstName = certificate.getUser().getFirstName() != null ? certificate.getUser().getFirstName() : "";
        String lastName = certificate.getUser().getLastName() != null ? certificate.getUser().getLastName() : "";
        String fullName = (firstName + " " + lastName).trim();
        if (fullName.isEmpty()) {
            fullName = "Certificate Holder";
        }
        
        String courseName = certificate.getCourse().getTitle() != null ? certificate.getCourse().getTitle() : "Course";
        String issueDate = certificate.getIssuedDate().format(DATE_FORMAT);
        String certificateNumber = certificate.getCertificateNumber() != null ? certificate.getCertificateNumber() : "";
        
        // Enhanced description based on course type
        String description = generateCourseDescription(certificate.getCourse(), courseName);
        
        // Replace placeholders with enhanced content - ensuring proper escaping and formatting
        String htmlContent = certificateTemplate
                .replace("{{RECIPIENT_NAME}}", escapeHtml(fullName.toUpperCase()))
                .replace("{{COURSE_NAME}}", escapeHtml(courseName))
                .replace("{{ISSUE_DATE}}", escapeHtml(issueDate))
                .replace("{{CERTIFICATE_NUMBER}}", escapeHtml(certificateNumber))
                .replace("{{PROGRAM_DIRECTOR_NAME}}", escapeHtml(programDirectorName))
                .replace("{{PROGRAM_DIRECTOR_TITLE}}", escapeHtml(programDirectorTitle))
                .replace("{{VERIFICATION_URL}}", escapeHtml(verificationUrl))
                .replace("{{COURSE_DESCRIPTION}}", escapeHtml(description))
                .replace("{{LOGO_BASE64}}", logoBase64);
        
        logger.info("✅ ENHANCED HTML PLACEHOLDERS REPLACED");
        logger.info("📊 Final HTML length: " + htmlContent.length() + " characters");
        return htmlContent;
    }
    
    // Helper method to escape HTML special characters
    private String escapeHtml(String text) {
        if (text == null) return "";
        return text.replace("&", "&amp;")
                  .replace("<", "&lt;")
                  .replace(">", "&gt;")
                  .replace("\"", "&quot;")
                  .replace("'", "&#39;");
    }
    
    private String generateCourseDescription(Course course, String courseName) {
        // Generate more specific descriptions based on course content
        String baseDescription = "For successfully completing the comprehensive training course \"%s\" " +
                "and demonstrating exceptional skill and dedication in mastering " +
                "Environment Health Safety protocols and practices. This achievement represents " +
                "commitment to workplace safety excellence and professional development.";
        
        return String.format(baseDescription, courseName);
    }
    
    private String generateCertificateNumber() {
        int year = LocalDateTime.now().getYear();
        Long yearCount = certificateRepository.countByYear(year);
        if (yearCount == null || yearCount == 0) {
            Long totalCount = certificateRepository.countAllCertificates();
            yearCount = (totalCount != null ? totalCount : 0L);
        }
        
        long sequenceNumber = yearCount + 1;
        String certificateNumber = String.format("CERT-%d-%06d", year, sequenceNumber);
        
        // Ensure uniqueness
        while (certificateRepository.existsByCertificateNumber(certificateNumber)) {
            sequenceNumber++;
            certificateNumber = String.format("CERT-%d-%06d", year, sequenceNumber);
            if (sequenceNumber > yearCount + 1000) {
                certificateNumber = String.format("CERT-%d-%d", year, System.currentTimeMillis());
                break;
            }
        }
        
        logger.info("Generated certificate number: " + certificateNumber);
        return certificateNumber;
    }
    
    public Optional<Certificate> findByCertificateNumber(String certificateNumber) {
        return certificateRepository.findByCertificateNumber(certificateNumber);
    }
    
    public Optional<Certificate> findByUserAndCourse(UUID userId, UUID courseId) {
        return certificateRepository.findByUserIdAndCourseId(userId, courseId);
    }

    public List<Certificate> getUserCertificates(UUID userId) {
        return certificateRepository.findByUserId(userId);
    }

    public Course getCourseById(UUID courseId) {
        return courseRepository.findById(courseId)
            .orElseThrow(() -> new RuntimeException("Course not found"));
    }

    public byte[] getCertificatePDF(UUID certificateId) throws IOException {
        Certificate certificate = certificateRepository.findById(certificateId)
            .orElseThrow(() -> new RuntimeException("Certificate not found"));

        if (certificate.getFilePath() == null) {
            throw new RuntimeException("Certificate PDF not found");
        }

        Path path = Paths.get(certificate.getFilePath());
        if (!Files.exists(path)) {
            // Regenerate PDF if file is missing
            logger.info("Certificate PDF file missing, regenerating...");
            String newPath = generateEnhancedCertificatePDF(certificate);
            certificate.setFilePath(newPath);
            certificateRepository.save(certificate);
            path = Paths.get(newPath);
        }

        return Files.readAllBytes(path);
    }
    
    @Transactional
    public void updateExpiredCertificates() {
        certificateRepository.findExpiredCertificates(LocalDateTime.now())
            .forEach(cert -> {
                cert.setStatus(CertificateStatus.EXPIRED);
                certificateRepository.save(cert);
            });
    }
    
    // New method to regenerate certificate with latest template
    @Transactional
    public Certificate regenerateCertificate(UUID certificateId) throws IOException {
        Certificate certificate = certificateRepository.findById(certificateId)
            .orElseThrow(() -> new RuntimeException("Certificate not found"));
        
        logger.info("🔄 REGENERATING CERTIFICATE WITH LATEST TEMPLATE");
        
        // Delete old file if exists
        if (certificate.getFilePath() != null) {
            try {
                Files.deleteIfExists(Paths.get(certificate.getFilePath()));
            } catch (IOException e) {
                logger.warning("Could not delete old certificate file: " + e.getMessage());
            }
        }
        
        // Generate new PDF
        String pdfPath = generateEnhancedCertificatePDF(certificate);
        certificate.setFilePath(pdfPath);
        
        return certificateRepository.save(certificate);
    }
}