# Certificate System Design

## Certificate Template Design

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│                    EHS E-LEARNING PLATFORM                          │
│                                                                     │
│                   CERTIFICATE OF COMPLETION                         │
│                                                                     │
│  ═══════════════════════════════════════════════════════════════   │
│                                                                     │
│                     This is to certify that                         │
│                                                                     │
│                        [EMPLOYEE NAME]                              │
│                                                                     │
│              has successfully completed the course                  │
│                                                                     │
│                       [COURSE TITLE]                                │
│                                                                     │
│                    Domain: [DOMAIN NAME]                            │
│                                                                     │
│                  With a score of [SCORE]%                           │
│                                                                     │
│  ─────────────────────────────────────────────────────────────────  │
│                                                                     │
│   Certificate ID: [CERT-2024-001234]                               │
│   Issue Date: [January 15, 2024]                                   │
│   Valid Until: [January 15, 2025]                                  │
│                                                                     │
│   ┌─────────┐                                                      │
│   │ QR CODE │  Scan to verify certificate                          │
│   │         │  https://ehs.com/verify/CERT-2024-001234            │
│   └─────────┘                                                      │
│                                                                     │
│   _____________________            _____________________           │
│   Authorized Signature              Platform Administrator         │
│                                                                     │
│  ═══════════════════════════════════════════════════════════════   │
│                                                                     │
│              © 2024 EHS E-Learning Platform                         │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

## Certificate Generation Process

### 1. Certificate Number Format
```
CERT-[YEAR]-[SEQUENTIAL_NUMBER]
Example: CERT-2024-001234
```

### 2. PDF Generation Implementation

```java
@Service
public class CertificatePDFGenerator {
    
    private static final String TEMPLATE_PATH = "/templates/certificate-template.pdf";
    private static final String FONT_PATH = "/fonts/certificate-font.ttf";
    
    public byte[] generateCertificate(CertificateData data) throws Exception {
        // Load PDF template
        PDDocument document = PDDocument.load(getClass().getResourceAsStream(TEMPLATE_PATH));
        PDPage page = document.getPage(0);
        
        // Create content stream
        PDPageContentStream contentStream = new PDPageContentStream(
            document, page, PDPageContentStream.AppendMode.APPEND, true
        );
        
        // Add text elements
        addText(contentStream, data.getUserName(), 300, 400, 24);
        addText(contentStream, data.getCourseName(), 300, 350, 20);
        addText(contentStream, data.getScore() + "%", 300, 300, 18);
        addText(contentStream, data.getIssueDate(), 150, 200, 14);
        addText(contentStream, data.getCertificateNumber(), 150, 180, 14);
        
        // Add QR code
        BufferedImage qrCode = generateQRCode(data.getVerificationUrl());
        PDImageXObject qrImage = LosslessFactory.createFromImage(document, qrCode);
        contentStream.drawImage(qrImage, 100, 100, 100, 100);
        
        contentStream.close();
        
        // Convert to byte array
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        document.save(baos);
        document.close();
        
        return baos.toByteArray();
    }
    
    private BufferedImage generateQRCode(String text) throws Exception {
        QRCodeWriter qrCodeWriter = new QRCodeWriter();
        BitMatrix bitMatrix = qrCodeWriter.encode(
            text, BarcodeFormat.QR_CODE, 200, 200
        );
        return MatrixToImageWriter.toBufferedImage(bitMatrix);
    }
}
```

### 3. Certificate Service Implementation

```java
@Service
@Transactional
public class CertificateService {
    
    @Autowired
    private CertificateRepository certificateRepository;
    
    @Autowired
    private UserCourseProgressRepository progressRepository;
    
    @Autowired
    private CertificatePDFGenerator pdfGenerator;
    
    @Autowired
    private FileStorageService fileStorageService;
    
    public Certificate generateCertificate(UUID userId, UUID courseId) {
        // Verify completion
        UserCourseProgress progress = progressRepository
            .findByUserIdAndCourseId(userId, courseId)
            .orElseThrow(() -> new RuntimeException("Progress not found"));
            
        if (progress.getOverallProgress().compareTo(new BigDecimal("100")) < 0) {
            throw new RuntimeException("Course not completed");
        }
        
        // Check if certificate already exists
        Optional<Certificate> existing = certificateRepository
            .findByUserIdAndCourseId(userId, courseId);
            
        if (existing.isPresent()) {
            return existing.get();
        }
        
        // Generate certificate number
        String certificateNumber = generateCertificateNumber();
        
        // Create certificate record
        Certificate certificate = new Certificate();
        certificate.setUser(progress.getUser());
        certificate.setCourse(progress.getCourse());
        certificate.setCertificateNumber(certificateNumber);
        certificate.setIssuedDate(LocalDateTime.now());
        certificate.setExpiryDate(LocalDateTime.now().plusYears(1));
        certificate.setVerificationUrl(generateVerificationUrl(certificateNumber));
        certificate.setStatus(CertificateStatus.ACTIVE);
        
        // Generate PDF
        CertificateData data = buildCertificateData(certificate, progress);
        byte[] pdfBytes = pdfGenerator.generateCertificate(data);
        
        // Store PDF
        String filePath = fileStorageService.storeCertificate(
            pdfBytes, certificateNumber + ".pdf"
        );
        certificate.setFilePath(filePath);
        
        // Save certificate
        certificate = certificateRepository.save(certificate);
        
        // Update progress with certificate ID
        progress.setCertificateId(certificate.getId());
        progressRepository.save(progress);
        
        return certificate;
    }
    
    private String generateCertificateNumber() {
        int year = LocalDate.now().getYear();
        Long count = certificateRepository.countByYear(year) + 1;
        return String.format("CERT-%d-%06d", year, count);
    }
    
    private String generateVerificationUrl(String certificateNumber) {
        return String.format("%s/verify/%s", 
            applicationProperties.getBaseUrl(), certificateNumber);
    }
}
```

### 4. Certificate Verification System

```java
@RestController
@RequestMapping("/api/public/certificates")
public class CertificateVerificationController {
    
    @Autowired
    private CertificateService certificateService;
    
    @GetMapping("/verify/{certificateNumber}")
    public ResponseEntity<CertificateVerificationResponse> verifyCertificate(
            @PathVariable String certificateNumber) {
        
        try {
            Certificate certificate = certificateService
                .findByCertificateNumber(certificateNumber)
                .orElseThrow(() -> new NotFoundException("Certificate not found"));
            
            boolean isValid = certificate.getStatus() == CertificateStatus.ACTIVE &&
                             (certificate.getExpiryDate() == null || 
                              certificate.getExpiryDate().isAfter(LocalDateTime.now()));
            
            return ResponseEntity.ok(CertificateVerificationResponse.builder()
                .valid(isValid)
                .certificateNumber(certificateNumber)
                .holderName(certificate.getUser().getFullName())
                .courseName(certificate.getCourse().getTitle())
                .issueDate(certificate.getIssuedDate())
                .expiryDate(certificate.getExpiryDate())
                .status(certificate.getStatus().toString())
                .build());
                
        } catch (NotFoundException e) {
            return ResponseEntity.ok(CertificateVerificationResponse.builder()
                .valid(false)
                .message("Certificate not found")
                .build());
        }
    }
}
```

### 5. Frontend Certificate Management

```jsx
// CertificateList.js
const CertificateList = () => {
    const [certificates, setCertificates] = useState([]);
    const [loading, setLoading] = useState(true);
    
    useEffect(() => {
        loadCertificates();
    }, []);
    
    const loadCertificates = async () => {
        try {
            const response = await certificateService.getUserCertificates();
            setCertificates(response.data);
        } catch (error) {
            console.error('Error loading certificates:', error);
        } finally {
            setLoading(false);
        }
    };
    
    const downloadCertificate = async (certificateId) => {
        try {
            const blob = await certificateService.downloadCertificate(certificateId);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `certificate-${certificateId}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error('Error downloading certificate:', error);
        }
    };
    
    return (
        <Container>
            <Typography variant="h4" gutterBottom>My Certificates</Typography>
            
            <Grid container spacing={3}>
                {certificates.map(cert => (
                    <Grid item xs={12} sm={6} md={4} key={cert.id}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6">{cert.courseName}</Typography>
                                <Typography color="textSecondary">
                                    Issued: {formatDate(cert.issuedDate)}
                                </Typography>
                                <Typography variant="body2">
                                    Certificate ID: {cert.certificateNumber}
                                </Typography>
                                
                                <Box mt={2}>
                                    <Button
                                        variant="contained"
                                        startIcon={<Download />}
                                        onClick={() => downloadCertificate(cert.id)}
                                        fullWidth
                                    >
                                        Download
                                    </Button>
                                </Box>
                                
                                <Box mt={2} textAlign="center">
                                    <QRCode 
                                        value={cert.verificationUrl} 
                                        size={100}
                                    />
                                    <Typography variant="caption" display="block">
                                        Scan to verify
                                    </Typography>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>
        </Container>
    );
};
```

### 6. Certificate API Endpoints

```java
@RestController
@RequestMapping("/api/v2/user/certificates")
@PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
public class UserCertificateController {
    
    @Autowired
    private CertificateService certificateService;
    
    @GetMapping
    public ResponseEntity<List<CertificateDTO>> getUserCertificates(
            Authentication authentication) {
        String username = authentication.getName();
        List<Certificate> certificates = certificateService
            .getUserCertificates(username);
        return ResponseEntity.ok(
            certificates.stream()
                .map(CertificateDTO::from)
                .collect(Collectors.toList())
        );
    }
    
    @GetMapping("/{certificateId}")
    public ResponseEntity<CertificateDTO> getCertificate(
            @PathVariable UUID certificateId,
            Authentication authentication) {
        // Verify user owns this certificate
        Certificate certificate = certificateService
            .getCertificate(certificateId, authentication.getName());
        return ResponseEntity.ok(CertificateDTO.from(certificate));
    }
    
    @GetMapping("/{certificateId}/download")
    public ResponseEntity<Resource> downloadCertificate(
            @PathVariable UUID certificateId,
            Authentication authentication) {
        // Verify ownership and get file
        byte[] pdfBytes = certificateService
            .getCertificatePDF(certificateId, authentication.getName());
            
        ByteArrayResource resource = new ByteArrayResource(pdfBytes);
        
        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, 
                    "attachment; filename=certificate.pdf")
            .contentType(MediaType.APPLICATION_PDF)
            .contentLength(pdfBytes.length)
            .body(resource);
    }
    
    @PostMapping("/generate")
    public ResponseEntity<CertificateDTO> generateCertificate(
            @RequestBody GenerateCertificateRequest request,
            Authentication authentication) {
        Certificate certificate = certificateService
            .generateCertificate(
                authentication.getName(), 
                request.getCourseId()
            );
        return ResponseEntity.ok(CertificateDTO.from(certificate));
    }
}
```

## Security Considerations

1. **Certificate Verification**
   - Public endpoint for verification
   - No authentication required
   - Limited information exposed

2. **Download Security**
   - Verify user ownership
   - Time-limited download URLs
   - Watermarking for sensitive certificates

3. **Generation Security**
   - Verify course completion
   - Prevent duplicate generation
   - Audit trail for all certificates

## Storage Considerations

1. **PDF Storage**
   - Store in secure file system
   - Backup regularly
   - Consider cloud storage (S3)

2. **Database Storage**
   - Index certificate numbers
   - Archive old certificates
   - Regular cleanup of expired certificates

## Performance Optimization

1. **PDF Generation**
   - Use template caching
   - Async generation for bulk certificates
   - Queue system for high load

2. **QR Code Generation**
   - Cache QR codes
   - Generate on-demand
   - Optimize image size