package com.ehs.elearning.controller;

import com.ehs.elearning.model.Certificate;
import com.ehs.elearning.model.Course;
import com.ehs.elearning.payload.response.MessageResponse;
import com.ehs.elearning.repository.CertificateRepository;
import com.ehs.elearning.security.UserDetailsImpl;
import com.ehs.elearning.service.CertificateService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v2/certificates")
@CrossOrigin(origins = "*", maxAge = 3600)
public class CertificateController {

    @Autowired
    private CertificateService certificateService;

    @Autowired
    private CertificateRepository certificateRepository;
    
    @PostMapping("/generate/{courseId}")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<?> generateCertificate(@PathVariable UUID courseId, Authentication authentication) {
        try {
            UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
            UUID userId = userDetails.getId();
            
            Certificate certificate = certificateService.generateCertificate(userId, courseId);
            
            Map<String, Object> response = new HashMap<>();
            response.put("certificateId", certificate.getId());
            response.put("certificateNumber", certificate.getCertificateNumber());
            response.put("issuedDate", certificate.getIssuedDate());
            response.put("expiryDate", certificate.getExpiryDate());
            response.put("message", "Certificate generated successfully");
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(new MessageResponse("Error generating certificate: " + e.getMessage()));
        }
    }
    
    @GetMapping("/user/{courseId}")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<?> getUserCourseCertificate(@PathVariable UUID courseId, Authentication authentication) {
        try {
            UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
            UUID userId = userDetails.getId();

            // First, get the course to check its status
            Course course = certificateService.getCourseById(courseId);
            boolean isPublished = course.getStatus() == Course.CourseStatus.PUBLISHED;

            // Log for debugging

            Optional<Certificate> certificate = certificateService.findByUserAndCourse(userId, courseId);

            if (certificate.isPresent()) {
                Map<String, Object> response = new HashMap<>();
                Certificate cert = certificate.get();
                response.put("certificateId", cert.getId());
                response.put("certificateNumber", cert.getCertificateNumber());
                response.put("issuedDate", cert.getIssuedDate());
                response.put("expiryDate", cert.getExpiryDate());
                response.put("status", cert.getStatus());
                response.put("exists", true);
                response.put("courseIsPublished", isPublished);

                return ResponseEntity.ok(response);
            } else {
                Map<String, Object> response = new HashMap<>();
                response.put("exists", false);
                response.put("courseIsPublished", isPublished);
                response.put("message", "Certificate not found for this course");
                return ResponseEntity.ok(response);
            }
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(new MessageResponse("Error fetching certificate: " + e.getMessage()));
        }
    }
    
    @GetMapping("/download/{certificateId}")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<?> downloadCertificate(@PathVariable UUID certificateId, Authentication authentication) {
        try {
            // First, get the certificate to verify the course status
            Certificate certificate = certificateRepository.findById(certificateId)
                .orElseThrow(() -> new RuntimeException("Certificate not found"));

            // If user is not an admin, verify that the course is published
            if (!authentication.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"))) {
                if (certificate.getCourse().getStatus() != Course.CourseStatus.PUBLISHED) {
                    return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(new MessageResponse("Certificate cannot be downloaded - course is not currently published"));
                }
            }

            byte[] pdfData = certificateService.getCertificatePDF(certificateId);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            headers.setContentDispositionFormData("attachment", "certificate.pdf");
            headers.setCacheControl("must-revalidate, post-check=0, pre-check=0");

            return new ResponseEntity<>(pdfData, headers, HttpStatus.OK);
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new MessageResponse("Error downloading certificate: " + e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(new MessageResponse("Error: " + e.getMessage()));
        }
    }
    
    @GetMapping("/verify/{certificateNumber}")
    public ResponseEntity<?> verifyCertificate(@PathVariable String certificateNumber) {
        try {
            Optional<Certificate> certificate = certificateService.findByCertificateNumber(certificateNumber);
            
            if (certificate.isPresent()) {
                Certificate cert = certificate.get();
                Map<String, Object> response = new HashMap<>();
                response.put("valid", cert.isValid());
                response.put("certificateNumber", cert.getCertificateNumber());
                String fullName = cert.getUser().getFirstName() + " " + cert.getUser().getLastName();
                response.put("userName", fullName);
                response.put("courseName", cert.getCourse().getTitle());
                response.put("issuedDate", cert.getIssuedDate());
                response.put("expiryDate", cert.getExpiryDate());
                response.put("status", cert.getStatus());
                
                return ResponseEntity.ok(response);
            } else {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new MessageResponse("Certificate not found"));
            }
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(new MessageResponse("Error verifying certificate: " + e.getMessage()));
        }
    }
    
    @GetMapping("/view/{certificateId}")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<?> viewCertificate(@PathVariable UUID certificateId) {
        try {
            byte[] pdfData = certificateService.getCertificatePDF(certificateId);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            headers.setContentDispositionFormData("inline", "certificate.pdf");

            return new ResponseEntity<>(pdfData, headers, HttpStatus.OK);
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new MessageResponse("Error viewing certificate: " + e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(new MessageResponse("Error: " + e.getMessage()));
        }
    }

    @GetMapping("/user/all")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<?> getAllUserCertificates(Authentication authentication) {
        try {
            UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
            UUID userId = userDetails.getId();

            List<Certificate> certificates = certificateService.getUserCertificates(userId);

            List<Map<String, Object>> certificatesData = certificates.stream()
                .map(cert -> {
                    Map<String, Object> certData = new HashMap<>();
                    certData.put("certificateId", cert.getId());
                    certData.put("certificateNumber", cert.getCertificateNumber());
                    certData.put("courseId", cert.getCourse().getId());
                    certData.put("courseName", cert.getCourse().getTitle());
                    certData.put("issuedDate", cert.getIssuedDate());
                    certData.put("expiryDate", cert.getExpiryDate());
                    certData.put("status", cert.getStatus());
                    return certData;
                })
                .collect(Collectors.toList());

            return ResponseEntity.ok(Map.of(
                "certificates", certificatesData,
                "count", certificatesData.size()
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(new MessageResponse("Error fetching certificates: " + e.getMessage()));
        }
    }
}