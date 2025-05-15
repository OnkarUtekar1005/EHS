package com.ehs.elearning.controller;

import com.ehs.elearning.payload.response.MessageResponse;
import com.ehs.elearning.service.FileStorageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.io.RandomAccessFile;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.apache.tika.Tika;
import org.apache.tika.mime.MimeType;
import org.apache.tika.mime.MimeTypeException;
import org.apache.tika.mime.MimeTypes;
import org.springframework.http.HttpRange;

@RestController
@RequestMapping("/api/files")
@CrossOrigin(origins = "*", maxAge = 3600)
public class FileController {

    @Autowired
    private FileStorageService fileStorageService;
    
    private final Tika tika = new Tika();
    
    /**
     * Serve a stored file with support for byte-range requests (needed for video streaming and PDF viewing)
     */
    @GetMapping("/{fileName:.+}")
    public ResponseEntity<Resource> serveFile(
            @PathVariable String fileName,
            @RequestHeader(value = "Range", required = false) String rangeHeader,
            @RequestParam(value = "preview", required = false, defaultValue = "false") boolean preview) {
        try {
            // Sanitize file name to prevent path traversal
            fileName = sanitizeFileName(fileName);
            
            // Check if file exists
            if (!fileStorageService.fileExists(fileName)) {
                return ResponseEntity.notFound().build();
            }
            
            Path filePath = fileStorageService.getFilePath(fileName);
            File file = filePath.toFile();
            Resource resource = new UrlResource(filePath.toUri());
            
            if (resource.exists() && resource.isReadable()) {
                // Determine content type with Apache Tika for more accurate detection
                String contentType;
                try (InputStream is = Files.newInputStream(filePath)) {
                    contentType = tika.detect(is, fileName);
                }
                
                HttpHeaders headers = new HttpHeaders();
                
                // Set CORS headers
                headers.add(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN, "*");
                headers.add(HttpHeaders.ACCESS_CONTROL_ALLOW_METHODS, "GET, HEAD, OPTIONS");
                headers.add(HttpHeaders.ACCESS_CONTROL_ALLOW_HEADERS, "Content-Type, Range, Authorization");
                headers.add(HttpHeaders.ACCESS_CONTROL_EXPOSE_HEADERS, 
                        "Accept-Ranges, Content-Range, Content-Length, Content-Type");
                
                // Allow embedding in iframes
                headers.add("X-Frame-Options", "ALLOWALL");
                headers.add("Content-Security-Policy", "frame-ancestors *");
                
                // Set caching headers for preview requests
                if (preview) {
                    headers.setCacheControl("max-age=3600"); // Cache for 1 hour
                } else {
                    headers.setCacheControl("no-cache, no-store, must-revalidate");
                }
                
                long contentLength = file.length();
                long start = 0;
                long end = contentLength - 1;
                
                headers.add(HttpHeaders.ACCEPT_RANGES, "bytes");
                
                // Handle byte-range requests for video streaming and PDF viewing
                if (rangeHeader != null && rangeHeader.startsWith("bytes=")) {
                    // Parse range header
                    Pattern pattern = Pattern.compile("bytes=(\\d+)-(\\d*)");
                    Matcher matcher = pattern.matcher(rangeHeader);
                    
                    if (matcher.matches()) {
                        start = Long.parseLong(matcher.group(1));
                        String endGroup = matcher.group(2);
                        if (endGroup != null && !endGroup.isEmpty()) {
                            end = Long.parseLong(endGroup);
                        }
                        
                        // Limit the end to the actual file size
                        if (end >= contentLength) {
                            end = contentLength - 1;
                        }
                        
                        // Calculate the actual content length to be sent
                        long contentLengthToSend = end - start + 1;
                        
                        // Create a custom resource for the range
                        RandomAccessFile randomAccessFile = new RandomAccessFile(file, "r");
                        randomAccessFile.seek(start);
                        byte[] data = new byte[(int) contentLengthToSend];
                        randomAccessFile.read(data);
                        
                        // Set Content-Range header
                        headers.add(HttpHeaders.CONTENT_RANGE, 
                                String.format("bytes %d-%d/%d", start, end, contentLength));
                        headers.setContentLength(contentLengthToSend);
                        
                        // Set disposition header
                        headers.add(HttpHeaders.CONTENT_DISPOSITION, 
                                "inline; filename=\"" + resource.getFilename() + "\"");
                        
                        return ResponseEntity.status(HttpStatus.PARTIAL_CONTENT)
                                .headers(headers)
                                .contentType(MediaType.parseMediaType(contentType))
                                .body(new ByteArrayResource(data, resource.getFilename()));
                    }
                }
                
                // If not a range request, return the full resource
                headers.setContentLength(contentLength);
                headers.add(HttpHeaders.CONTENT_DISPOSITION, 
                        "inline; filename=\"" + resource.getFilename() + "\"");
                
                return ResponseEntity.ok()
                        .headers(headers)
                        .contentType(MediaType.parseMediaType(contentType))
                        .body(resource);
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }
    
    /**
     * Upload a generic file (not associated with any learning material)
     */
    @PostMapping("/upload")
    public ResponseEntity<?> uploadFile(@RequestParam("file") MultipartFile file) {
        try {
            if (file.isEmpty()) {
                return ResponseEntity.badRequest().body(new MessageResponse("File is empty"));
            }
            
            String fileName = fileStorageService.storeFile(file);
            
            // Get actual MIME type using Apache Tika
            String mimeType = tika.detect(file.getInputStream(), file.getOriginalFilename());
            
            Map<String, String> response = new HashMap<>();
            response.put("fileName", fileName);
            response.put("fileType", determineFileType(file.getOriginalFilename()));
            response.put("mimeType", mimeType);
            response.put("size", String.valueOf(file.getSize()));
            
            return ResponseEntity.ok(response);
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new MessageResponse("Failed to upload file: " + e.getMessage()));
        }
    }
    
    /**
     * Delete a file
     */
    @DeleteMapping("/{fileName:.+}")
    public ResponseEntity<?> deleteFile(@PathVariable String fileName) {
        try {
            // Sanitize file name to prevent path traversal
            fileName = sanitizeFileName(fileName);
            
            if (!fileStorageService.fileExists(fileName)) {
                return ResponseEntity.notFound().build();
            }
            
            fileStorageService.deleteFile(fileName);
            return ResponseEntity.ok(new MessageResponse("File deleted successfully"));
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new MessageResponse("Failed to delete file: " + e.getMessage()));
        }
    }
    
    /**
     * Get info about a file (for previewing)
     */
    @GetMapping("/{fileName:.+}/info")
    public ResponseEntity<?> getFileInfo(@PathVariable String fileName) {
        try {
            // Sanitize file name to prevent path traversal
            fileName = sanitizeFileName(fileName);
            
            if (!fileStorageService.fileExists(fileName)) {
                return ResponseEntity.notFound().build();
            }
            
            Path filePath = fileStorageService.getFilePath(fileName);
            File file = filePath.toFile();
            
            // Detect MIME type
            String mimeType;
            try (InputStream is = Files.newInputStream(filePath)) {
                mimeType = tika.detect(is, fileName);
            }
            
            Map<String, Object> fileInfo = new HashMap<>();
            fileInfo.put("fileName", fileName);
            fileInfo.put("size", file.length());
            fileInfo.put("mimeType", mimeType);
            fileInfo.put("fileType", determineFileType(fileName));
            fileInfo.put("lastModified", file.lastModified());
            
            return ResponseEntity.ok(fileInfo);
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new MessageResponse("Failed to get file info: " + e.getMessage()));
        }
    }
    
    /**
     * Sanitize a filename to prevent path traversal
     */
    private String sanitizeFileName(String fileName) {
        if (fileName == null) {
            return null;
        }
        
        // Remove any path components (directory traversal protection)
        return fileName.replaceAll("[/\\\\]", "");
    }
    
    /**
     * Determine content type from file extension
     */
    private String determineContentType(String fileName) {
        if (fileName == null) {
            return "application/octet-stream";
        }
        
        String lowerCaseName = fileName.toLowerCase();
        
        if (lowerCaseName.endsWith(".mp4")) {
            return "video/mp4";
        } else if (lowerCaseName.endsWith(".pdf")) {
            return "application/pdf";
        } else if (lowerCaseName.endsWith(".jpg") || lowerCaseName.endsWith(".jpeg")) {
            return "image/jpeg";
        } else if (lowerCaseName.endsWith(".png")) {
            return "image/png";
        } else if (lowerCaseName.endsWith(".gif")) {
            return "image/gif";
        } else if (lowerCaseName.endsWith(".html") || lowerCaseName.endsWith(".htm")) {
            return "text/html";
        } else if (lowerCaseName.endsWith(".txt")) {
            return "text/plain";
        } else if (lowerCaseName.endsWith(".docx")) {
            return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
        } else if (lowerCaseName.endsWith(".doc")) {
            return "application/msword";
        } else if (lowerCaseName.endsWith(".pptx")) {
            return "application/vnd.openxmlformats-officedocument.presentationml.presentation";
        } else if (lowerCaseName.endsWith(".ppt")) {
            return "application/vnd.ms-powerpoint";
        } else {
            return "application/octet-stream";
        }
    }
    
    /**
     * Determine file type from filename
     */
    private String determineFileType(String filename) {
        if (filename == null) return "UNKNOWN";
        
        String lowerCaseName = filename.toLowerCase();
        
        if (lowerCaseName.endsWith(".pdf")) {
            return "PDF";
        } else if (lowerCaseName.endsWith(".ppt") || lowerCaseName.endsWith(".pptx")) {
            return "PRESENTATION";
        } else if (lowerCaseName.endsWith(".mp4") || lowerCaseName.endsWith(".avi") || 
                 lowerCaseName.endsWith(".mov") || lowerCaseName.endsWith(".wmv")) {
            return "VIDEO";
        } else if (lowerCaseName.endsWith(".doc") || lowerCaseName.endsWith(".docx")) {
            return "DOCUMENT";
        } else if (lowerCaseName.endsWith(".html") || lowerCaseName.endsWith(".htm")) {
            return "HTML";
        } else if (lowerCaseName.endsWith(".jpg") || lowerCaseName.endsWith(".jpeg") || 
                 lowerCaseName.endsWith(".png") || lowerCaseName.endsWith(".gif")) {
            return "IMAGE";
        } else {
            return "OTHER";
        }
    }
    
    /**
     * Custom resource class for byte range responses
     */
    private static class ByteArrayResource extends Resource {
        private final byte[] data;
        private final String filename;
        
        public ByteArrayResource(byte[] data, String filename) {
            this.data = data;
            this.filename = filename;
        }
        
        @Override
        public InputStream getInputStream() throws IOException {
            return new java.io.ByteArrayInputStream(data);
        }
        
        @Override
        public boolean exists() {
            return true;
        }
        
        @Override
        public long contentLength() {
            return data.length;
        }
        
        @Override
        public String getFilename() {
            return filename;
        }
        
        @Override
        public String getDescription() {
            return "Byte array resource for " + filename;
        }
    }
}