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

import java.io.IOException;
import java.nio.file.Path;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/files")
@CrossOrigin(origins = "*", maxAge = 3600)
public class FileController {

    @Autowired
    private FileStorageService fileStorageService;
    
    /**
     * Serve a stored file
     */
    @GetMapping("/{fileName:.+}")
    public ResponseEntity<Resource> serveFile(@PathVariable String fileName) {
        try {
            // Sanitize file name to prevent path traversal
            fileName = sanitizeFileName(fileName);
            
            // Check if file exists
            if (!fileStorageService.fileExists(fileName)) {
                return ResponseEntity.notFound().build();
            }
            
            Path filePath = fileStorageService.getFilePath(fileName);
            Resource resource = new UrlResource(filePath.toUri());
            
            if (resource.exists() && resource.isReadable()) {
                // Determine content type
                String contentType = determineContentType(fileName);
                
                return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(contentType))
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + resource.getFilename() + "\"")
                    .body(resource);
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
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
            
            Map<String, String> response = new HashMap<>();
            response.put("fileName", fileName);
            response.put("fileType", determineFileType(file.getOriginalFilename()));
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
}