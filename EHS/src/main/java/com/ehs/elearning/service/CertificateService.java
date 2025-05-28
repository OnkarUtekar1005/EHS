package com.ehs.elearning.service;

import com.ehs.elearning.model.*;
import com.ehs.elearning.repository.CertificateRepository;
import com.ehs.elearning.repository.UserCourseProgressRepository;
import com.itextpdf.kernel.colors.ColorConstants;
import com.itextpdf.kernel.colors.DeviceRgb;
import com.itextpdf.kernel.font.PdfFont;
import com.itextpdf.kernel.font.PdfFontFactory;
import com.itextpdf.kernel.geom.PageSize;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.borders.Border;
import com.itextpdf.layout.borders.SolidBorder;
import com.itextpdf.layout.borders.DoubleBorder;
import com.itextpdf.layout.element.Cell;
import com.itextpdf.layout.properties.BorderRadius;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.element.Table;
import com.itextpdf.layout.properties.HorizontalAlignment;
import com.itextpdf.layout.properties.TextAlignment;
import com.itextpdf.layout.properties.UnitValue;
import com.itextpdf.layout.properties.VerticalAlignment;
import com.itextpdf.io.font.constants.StandardFonts;
import com.itextpdf.io.image.ImageData;
import com.itextpdf.io.image.ImageDataFactory;
import com.itextpdf.layout.element.Image;
import com.itextpdf.barcodes.BarcodeQRCode;
import com.itextpdf.kernel.pdf.xobject.PdfFormXObject;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.annotation.PostConstruct;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Optional;
import java.util.UUID;
import java.util.logging.Level;
import java.util.logging.Logger;

// OpenHTML imports
import com.openhtmltopdf.pdfboxout.PdfRendererBuilder;
import org.springframework.core.io.ClassPathResource;
import java.nio.charset.StandardCharsets;

// QR Code imports
import com.google.zxing.BarcodeFormat;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import java.awt.image.BufferedImage;
import javax.imageio.ImageIO;
import java.util.Base64;

@Service
public class CertificateService {
    
    private static final Logger logger = Logger.getLogger(CertificateService.class.getName());
    private static final DateTimeFormatter DATE_FORMAT = DateTimeFormatter.ofPattern("dd MMMM yyyy");
    private static final DateTimeFormatter CERT_NUMBER_FORMAT = DateTimeFormatter.ofPattern("yyyy");
    
    @Autowired
    private CertificateRepository certificateRepository;
    
    @Autowired
    private UserCourseProgressRepository userCourseProgressRepository;
    
    @Value("${certificate.storage.path:uploads/certificates}")
    private String certificateStoragePath;
    
    @Value("${certificate.expiry.years:1}")
    private int certificateExpiryYears;
    
    @Value("${app.frontend.url:http://localhost:3000}")
    private String frontendUrl;
    
    @PostConstruct
    public void init() {
        try {
            Path certificatePath = Paths.get(certificateStoragePath);
            if (!Files.exists(certificatePath)) {
                Files.createDirectories(certificatePath);
                logger.info("Certificate directory created: " + certificateStoragePath);
            }
        } catch (IOException e) {
            logger.log(Level.SEVERE, "Failed to create certificate directory", e);
        }
    }
    
    @Transactional
    public Certificate generateCertificate(UUID userId, UUID courseId) {
        // Check if certificate already exists
        Optional<Certificate> existingCert = certificateRepository.findByUserIdAndCourseId(userId, courseId);
        if (existingCert.isPresent()) {
            return existingCert.get();
        }
        
        // Get user course progress with all required data loaded
        UserCourseProgress progress = userCourseProgressRepository.findByUserIdAndCourseIdWithDetails(userId, courseId)
            .orElseThrow(() -> new RuntimeException("User course progress not found"));
        
        // Verify course is completed
        if (progress.getStatus() != ProgressStatus.COMPLETED) {
            throw new RuntimeException("Course not completed");
        }
        
        // Generate certificate number
        String certificateNumber = generateCertificateNumber();
        
        // Generate verification code
        String verificationCode = UUID.randomUUID().toString();
        
        // Create certificate entity
        Certificate certificate = new Certificate();
        certificate.setUser(progress.getUser());
        certificate.setCourse(progress.getCourse());
        certificate.setCertificateNumber(certificateNumber);
        certificate.setVerificationCode(verificationCode);
        certificate.setIssuedDate(LocalDateTime.now());
        certificate.setExpiryDate(LocalDateTime.now().plusYears(certificateExpiryYears));
        certificate.setStatus(CertificateStatus.ACTIVE);
        
        // Save certificate to database first to get ID
        certificate = certificateRepository.save(certificate);
        
        // Generate PDF using modern HTML template with fallback
        try {
            logger.info("Attempting to generate modern certificate PDF for certificate ID: " + certificate.getId());
            String pdfPath = generateModernCertificatePDF(certificate);
            certificate.setFilePath(pdfPath);
            certificate = certificateRepository.save(certificate);
            logger.info("Successfully generated modern certificate PDF");
        } catch (Exception e) {
            logger.log(Level.SEVERE, "Modern certificate generation failed: " + e.getMessage(), e);
            // Fallback to iText method if HTML template fails
            try {
                logger.info("Falling back to iText certificate generation");
                String pdfPath = generateCertificatePDF(certificate);
                certificate.setFilePath(pdfPath);
                certificate = certificateRepository.save(certificate);
                logger.info("Successfully generated iText certificate PDF as fallback");
            } catch (Exception fallbackE) {
                logger.log(Level.SEVERE, "Both certificate generation methods failed", fallbackE);
                throw new RuntimeException("Failed to generate certificate PDF with both methods");
            }
        }
        
        return certificate;
    }
    
    private String generateCertificateNumber() {
        int year = LocalDateTime.now().getYear();
        
        // Try to get count by year first
        Long yearCount = certificateRepository.countByYear(year);
        
        // If the year-based query doesn't work, use total count as fallback
        if (yearCount == null || yearCount == 0) {
            // Get total count of all certificates
            Long totalCount = certificateRepository.countAllCertificates();
            yearCount = (totalCount != null ? totalCount : 0L);
        }
        
        // Start from the next number
        long sequenceNumber = yearCount + 1;
        
        // Generate the certificate number
        String certificateNumber = String.format("CERT-%d-%06d", year, sequenceNumber);
        
        // Ensure uniqueness - if this number exists, keep incrementing
        while (certificateRepository.existsByCertificateNumber(certificateNumber)) {
            sequenceNumber++;
            certificateNumber = String.format("CERT-%d-%06d", year, sequenceNumber);
            
            // Safety check to avoid infinite loop
            if (sequenceNumber > yearCount + 1000) {
                // Use timestamp as last resort for uniqueness
                certificateNumber = String.format("CERT-%d-%d", year, System.currentTimeMillis());
                break;
            }
        }
        
        logger.info("Generated certificate number: " + certificateNumber);
        return certificateNumber;
    }
    
    private String generateCertificatePDF(Certificate certificate) throws IOException {
        String fileName = certificate.getId() + ".pdf";
        String filePath = certificateStoragePath + "/" + fileName;
        
        try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            PdfWriter writer = new PdfWriter(baos);
            PdfDocument pdf = new PdfDocument(writer);
            Document document = new Document(pdf, PageSize.A4.rotate());
            
            // Set tight margins to maximize space
            document.setMargins(20, 30, 20, 30);
            
            // Background color for the entire certificate
            Table backgroundTable = new Table(UnitValue.createPercentArray(1)).useAllAvailableWidth();
            Cell backgroundCell = new Cell();
            backgroundCell.setBackgroundColor(new DeviceRgb(252, 252, 252)); // Very light gray
            backgroundCell.setBorder(Border.NO_BORDER);
            backgroundCell.setPadding(0);
            
            // Create main content area with modern border design
            Table mainFrame = new Table(UnitValue.createPercentArray(1)).useAllAvailableWidth();
            Cell frameCell = new Cell();
            frameCell.setBorder(new SolidBorder(new DeviceRgb(218, 165, 32), 2)); // Gold border
            frameCell.setBackgroundColor(ColorConstants.WHITE);
            frameCell.setPadding(25);
            
            // Add decorative elements
            PdfFont regularFont = PdfFontFactory.createFont(StandardFonts.HELVETICA);
            PdfFont boldFont = PdfFontFactory.createFont(StandardFonts.HELVETICA_BOLD);
            PdfFont italicFont = PdfFontFactory.createFont(StandardFonts.HELVETICA_OBLIQUE);
            
            // Top ornamental line
            Table topLine = new Table(UnitValue.createPercentArray(new float[]{1, 2, 1})).useAllAvailableWidth();
            Cell leftLine = new Cell().setBorder(Border.NO_BORDER);
            Cell centerDecor = new Cell().setBorder(Border.NO_BORDER);
            Cell rightLine = new Cell().setBorder(Border.NO_BORDER);
            
            // Add decorative lines
            Paragraph leftDash = new Paragraph("━━━━━━━━━━━━━━━")
                .setFontColor(new DeviceRgb(218, 165, 32))
                .setTextAlignment(TextAlignment.RIGHT);
            leftLine.add(leftDash);
            
            Paragraph centerStar = new Paragraph("✦")
                .setFontColor(new DeviceRgb(218, 165, 32))
                .setFontSize(20)
                .setTextAlignment(TextAlignment.CENTER);
            centerDecor.add(centerStar);
            
            Paragraph rightDash = new Paragraph("━━━━━━━━━━━━━━━")
                .setFontColor(new DeviceRgb(218, 165, 32))
                .setTextAlignment(TextAlignment.LEFT);
            rightLine.add(rightDash);
            
            topLine.addCell(leftLine);
            topLine.addCell(centerDecor);
            topLine.addCell(rightLine);
            frameCell.add(topLine);
            
            // Certificate header
            Paragraph certHeader = new Paragraph("CERTIFICATE")
                .setFont(boldFont)
                .setFontSize(16)
                .setTextAlignment(TextAlignment.CENTER)
                .setFontColor(new DeviceRgb(101, 101, 101))
                .setMarginTop(10)
                .setCharacterSpacing(3);
            frameCell.add(certHeader);
            
            Paragraph ofAchievement = new Paragraph("of Achievement")
                .setFont(italicFont)
                .setFontSize(28)
                .setTextAlignment(TextAlignment.CENTER)
                .setFontColor(new DeviceRgb(218, 165, 32))
                .setMarginTop(-5)
                .setMarginBottom(15);
            frameCell.add(ofAchievement);
            
            // This is to certify that
            Paragraph certifyText = new Paragraph("This is to certify that")
                .setFont(italicFont)
                .setFontSize(14)
                .setTextAlignment(TextAlignment.CENTER)
                .setFontColor(new DeviceRgb(128, 128, 128))
                .setMarginBottom(5);
            frameCell.add(certifyText);
            
            // User name with decorative underline
            String fullName = certificate.getUser().getFirstName() + " " + certificate.getUser().getLastName();
            Paragraph userName = new Paragraph(fullName)
                .setFont(boldFont)
                .setFontSize(36)
                .setTextAlignment(TextAlignment.CENTER)
                .setFontColor(new DeviceRgb(51, 51, 51))
                .setMarginBottom(5);
            frameCell.add(userName);
            
            // Decorative underline for name
            Paragraph nameUnderline = new Paragraph("_________________")
                .setFontSize(20)
                .setTextAlignment(TextAlignment.CENTER)
                .setFontColor(new DeviceRgb(218, 165, 32))
                .setMarginTop(-15)
                .setMarginBottom(10);
            frameCell.add(nameUnderline);
            
            // Has successfully completed
            Paragraph hasCompleted = new Paragraph("has successfully completed the course")
                .setFont(regularFont)
                .setFontSize(14)
                .setTextAlignment(TextAlignment.CENTER)
                .setFontColor(new DeviceRgb(101, 101, 101))
                .setMarginBottom(5);
            frameCell.add(hasCompleted);
            
            // Course name in quotes
            Paragraph courseName = new Paragraph("\"" + certificate.getCourse().getTitle() + "\"")
                .setFont(boldFont)
                .setFontSize(22)
                .setTextAlignment(TextAlignment.CENTER)
                .setFontColor(new DeviceRgb(51, 51, 51))
                .setMarginBottom(10);
            frameCell.add(courseName);
            
            // Date with decorative elements
            String completionDate = certificate.getIssuedDate().format(DateTimeFormatter.ofPattern("dd MMMM yyyy"));
            Paragraph dateText = new Paragraph("on " + completionDate)
                .setFont(italicFont)
                .setFontSize(14)
                .setTextAlignment(TextAlignment.CENTER)
                .setFontColor(new DeviceRgb(101, 101, 101))
                .setMarginBottom(20);
            frameCell.add(dateText);
            
            // Signature section with modern layout
            Table signatureTable = new Table(UnitValue.createPercentArray(new float[]{1, 1.5f, 1})).useAllAvailableWidth();
            signatureTable.setMarginTop(5);
            
            // Left signature
            Cell leftSig = new Cell().setBorder(Border.NO_BORDER);
            Table leftSigLine = new Table(UnitValue.createPercentArray(1)).setWidth(140);
            Cell leftLine1 = new Cell()
                .setBorderTop(new SolidBorder(new DeviceRgb(200, 200, 200), 1))
                .setBorderBottom(Border.NO_BORDER)
                .setBorderLeft(Border.NO_BORDER)
                .setBorderRight(Border.NO_BORDER)
                .setHeight(25);
            leftSigLine.addCell(leftLine1);
            leftSig.add(leftSigLine);
            
            Paragraph director = new Paragraph("Program Director")
                .setFont(italicFont)
                .setFontSize(11)
                .setTextAlignment(TextAlignment.CENTER)
                .setFontColor(new DeviceRgb(128, 128, 128));
            leftSig.add(director);
            signatureTable.addCell(leftSig);
            
            // Center - Certificate details
            Cell centerDetails = new Cell().setBorder(Border.NO_BORDER);
            
            // Add seal-like design with QR code
            Table sealTable = new Table(UnitValue.createPercentArray(1)).setWidth(80);
            Cell sealCell = new Cell();
            sealCell.setBorder(new DoubleBorder(new DeviceRgb(218, 165, 32), 2));
            sealCell.setBorderRadius(new BorderRadius(40));
            sealCell.setPadding(10);
            
            // QR Code in seal
            String verificationUrl = frontendUrl + "/certificate/verify/" + certificate.getCertificateNumber();
            BarcodeQRCode qrCode = new BarcodeQRCode(verificationUrl);
            PdfFormXObject qrCodeObject = qrCode.createFormXObject(ColorConstants.BLACK, pdf);
            Image qrCodeImage = new Image(qrCodeObject).setWidth(50).setHeight(50);
            qrCodeImage.setHorizontalAlignment(HorizontalAlignment.CENTER);
            sealCell.add(qrCodeImage);
            
            sealTable.addCell(sealCell);
            sealTable.setHorizontalAlignment(HorizontalAlignment.CENTER);
            centerDetails.add(sealTable);
            
            // Certificate number below seal
            Paragraph certNum = new Paragraph(certificate.getCertificateNumber())
                .setFont(regularFont)
                .setFontSize(9)
                .setTextAlignment(TextAlignment.CENTER)
                .setFontColor(new DeviceRgb(128, 128, 128))
                .setMarginTop(5);
            centerDetails.add(certNum);
            
            signatureTable.addCell(centerDetails);
            
            // Right signature
            Cell rightSig = new Cell().setBorder(Border.NO_BORDER);
            Table rightSigLine = new Table(UnitValue.createPercentArray(1)).setWidth(140);
            Cell rightLine1 = new Cell()
                .setBorderTop(new SolidBorder(new DeviceRgb(200, 200, 200), 1))
                .setBorderBottom(Border.NO_BORDER)
                .setBorderLeft(Border.NO_BORDER)
                .setBorderRight(Border.NO_BORDER)
                .setHeight(25);
            rightSigLine.addCell(rightLine1);
            rightSig.add(rightSigLine);
            
            Paragraph instructor = new Paragraph("Course Instructor")
                .setFont(italicFont)
                .setFontSize(11)
                .setTextAlignment(TextAlignment.CENTER)
                .setFontColor(new DeviceRgb(128, 128, 128));
            rightSig.add(instructor);
            signatureTable.addCell(rightSig);
            
            frameCell.add(signatureTable);
            
            // Bottom decorative line
            Table bottomLine = new Table(UnitValue.createPercentArray(new float[]{1, 2, 1})).useAllAvailableWidth();
            bottomLine.setMarginTop(15);
            Cell leftLine2 = new Cell().setBorder(Border.NO_BORDER);
            Cell centerDecor2 = new Cell().setBorder(Border.NO_BORDER);
            Cell rightLine2 = new Cell().setBorder(Border.NO_BORDER);
            
            leftLine2.add(new Paragraph("━━━━━━━━━━━━━━━")
                .setFontColor(new DeviceRgb(218, 165, 32))
                .setTextAlignment(TextAlignment.RIGHT));
            
            centerDecor2.add(new Paragraph("✦")
                .setFontColor(new DeviceRgb(218, 165, 32))
                .setFontSize(20)
                .setTextAlignment(TextAlignment.CENTER));
            
            rightLine2.add(new Paragraph("━━━━━━━━━━━━━━━")
                .setFontColor(new DeviceRgb(218, 165, 32))
                .setTextAlignment(TextAlignment.LEFT));
            
            bottomLine.addCell(leftLine2);
            bottomLine.addCell(centerDecor2);
            bottomLine.addCell(rightLine2);
            frameCell.add(bottomLine);
            
            // Organization name at bottom
            Paragraph orgName = new Paragraph("Environment Health Safety E-Learning Platform")
                .setFont(regularFont)
                .setFontSize(10)
                .setTextAlignment(TextAlignment.CENTER)
                .setFontColor(new DeviceRgb(128, 128, 128))
                .setMarginTop(10);
            frameCell.add(orgName);
            
            mainFrame.addCell(frameCell);
            backgroundCell.add(mainFrame);
            backgroundTable.addCell(backgroundCell);
            
            document.add(backgroundTable);
            document.close();
            
            // Save to file
            try (FileOutputStream fos = new FileOutputStream(filePath)) {
                fos.write(baos.toByteArray());
            }
        }
        
        return filePath;
    }
    
    private Cell createCell(Object content) {
        Cell cell = new Cell();
        cell.setBorder(Border.NO_BORDER);
        if (content instanceof Paragraph) {
            cell.add((Paragraph) content);
        } else if (content instanceof Table) {
            cell.add((Table) content);
        }
        return cell;
    }
    
    public Optional<Certificate> findByCertificateNumber(String certificateNumber) {
        return certificateRepository.findByCertificateNumber(certificateNumber);
    }
    
    public Optional<Certificate> findByUserAndCourse(UUID userId, UUID courseId) {
        return certificateRepository.findByUserIdAndCourseId(userId, courseId);
    }
    
    public byte[] getCertificatePDF(UUID certificateId) throws IOException {
        Certificate certificate = certificateRepository.findById(certificateId)
            .orElseThrow(() -> new RuntimeException("Certificate not found"));
        
        if (certificate.getFilePath() == null) {
            throw new RuntimeException("Certificate PDF not found");
        }
        
        Path path = Paths.get(certificate.getFilePath());
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
    
    private String generateModernCertificatePDF(Certificate certificate) throws IOException {
        String fileName = certificate.getId() + "_modern.pdf";
        String filePath = certificateStoragePath + "/" + fileName;
        
        // Load HTML template (try basic XHTML version first for better compatibility)
        ClassPathResource templateResource;
        String htmlTemplate;
        try {
            templateResource = new ClassPathResource("templates/certificate-basic.html");
            htmlTemplate = new String(templateResource.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
            logger.info("Using basic XHTML certificate template");
        } catch (Exception e) {
            logger.log(Level.WARNING, "Basic template not found, trying simple template", e);
            try {
                templateResource = new ClassPathResource("templates/certificate-template-simple.html");
                htmlTemplate = new String(templateResource.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
                logger.info("Using simple certificate template");
            } catch (Exception e2) {
                logger.log(Level.WARNING, "Simple template not found, using complex template", e2);
                templateResource = new ClassPathResource("templates/certificate-template.html");
                htmlTemplate = new String(templateResource.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
            }
        }
        
        // Replace placeholders in HTML template
        String fullName = (certificate.getUser().getFirstName() != null ? certificate.getUser().getFirstName() : "") + 
                         " " + (certificate.getUser().getLastName() != null ? certificate.getUser().getLastName() : "");
        fullName = fullName.trim();
        if (fullName.isEmpty()) {
            fullName = "Student";
        }
        
        String courseName = certificate.getCourse().getTitle() != null ? certificate.getCourse().getTitle() : "Course";
        String completionDate = certificate.getIssuedDate().format(DateTimeFormatter.ofPattern("MMMM dd, yyyy"));
        String certificateNumber = certificate.getCertificateNumber();
        
        // Get course creator name (admin who created the course)
        String courseCreator = "Admin";
        if (certificate.getCourse().getCreatedBy() != null) {
            String firstName = certificate.getCourse().getCreatedBy().getFirstName();
            String lastName = certificate.getCourse().getCreatedBy().getLastName();
            courseCreator = ((firstName != null ? firstName : "") + " " + (lastName != null ? lastName : "")).trim();
            if (courseCreator.isEmpty()) {
                courseCreator = "Admin";
            }
        }
        
        // Enhanced debug logging
        logger.info("=== Certificate Generation Debug ===");
        logger.info("Certificate ID: " + certificate.getId());
        logger.info("User object: " + (certificate.getUser() != null ? "Present" : "NULL"));
        logger.info("Course object: " + (certificate.getCourse() != null ? "Present" : "NULL"));
        
        if (certificate.getUser() != null) {
            logger.info("User firstName: '" + certificate.getUser().getFirstName() + "'");
            logger.info("User lastName: '" + certificate.getUser().getLastName() + "'");
        }
        
        if (certificate.getCourse() != null) {
            logger.info("Course title: '" + certificate.getCourse().getTitle() + "'");
            logger.info("Course.createdBy: " + (certificate.getCourse().getCreatedBy() != null ? "Present" : "NULL"));
            if (certificate.getCourse().getCreatedBy() != null) {
                logger.info("Creator firstName: '" + certificate.getCourse().getCreatedBy().getFirstName() + "'");
                logger.info("Creator lastName: '" + certificate.getCourse().getCreatedBy().getLastName() + "'");
            }
        }
        
        logger.info("Final values - User: '" + fullName + "', Course: '" + courseName + "', Creator: '" + courseCreator + "'");
        logger.info("=======================================");
        
        // Generate QR code as base64 image
        String verificationUrl = frontendUrl + "/certificate/verify/" + certificate.getCertificateNumber();
        String qrCodeBase64 = generateQRCodeBase64(verificationUrl);
        
        // Replace placeholders
        htmlTemplate = htmlTemplate.replace("{{userName}}", fullName)
                                  .replace("{{courseName}}", courseName)
                                  .replace("{{completionDate}}", completionDate)
                                  .replace("{{certificateNumber}}", certificateNumber)
                                  .replace("{{courseCreator}}", courseCreator)
                                  .replace("{{qrCodePlaceholder}}", qrCodeBase64);
        
        // Debug: Log a snippet of the replaced template
        logger.info("Template after replacement (first 500 chars): " + htmlTemplate.substring(0, Math.min(500, htmlTemplate.length())));
        
        // Generate PDF using openhtmltopdf
        try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            logger.info("Creating PDF renderer with HTML content");
            PdfRendererBuilder builder = new PdfRendererBuilder();
            
            // Configure for better HTML handling
            builder.withHtmlContent(htmlTemplate, null);
            builder.toStream(baos);
            builder.useFastMode();
            
            // Add better error handling and rendering options
            try {
                builder.testMode(false);
            } catch (Exception configException) {
                logger.log(Level.WARNING, "Could not set test mode", configException);
            }
            
            logger.info("Running PDF generation");
            builder.run();
            
            logger.info("PDF generated in memory, writing to file");
            // Write to file
            try (FileOutputStream fos = new FileOutputStream(filePath)) {
                fos.write(baos.toByteArray());
            }
            
            logger.info("Modern certificate PDF generated: " + filePath);
            return filePath;
        } catch (Exception e) {
            logger.log(Level.SEVERE, "Failed to generate modern certificate PDF: " + e.getMessage(), e);
            throw new IOException("Failed to generate modern certificate PDF: " + e.getMessage(), e);
        }
    }
    
    private String generateQRCodeBase64(String text) {
        try {
            QRCodeWriter qrCodeWriter = new QRCodeWriter();
            BitMatrix bitMatrix = qrCodeWriter.encode(text, BarcodeFormat.QR_CODE, 200, 200);
            BufferedImage qrImage = MatrixToImageWriter.toBufferedImage(bitMatrix);
            
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            ImageIO.write(qrImage, "PNG", baos);
            byte[] imageBytes = baos.toByteArray();
            
            return "data:image/png;base64," + Base64.getEncoder().encodeToString(imageBytes);
        } catch (Exception e) {
            logger.log(Level.WARNING, "Failed to generate QR code", e);
            return "data:image/svg+xml;base64," + Base64.getEncoder().encodeToString(
                "<svg width='80' height='80' xmlns='http://www.w3.org/2000/svg'><rect width='80' height='80' fill='#f0f0f0'/><text x='40' y='40' text-anchor='middle' fill='#666' font-size='8'>QR CODE</text></svg>".getBytes()
            );
        }
    }
}