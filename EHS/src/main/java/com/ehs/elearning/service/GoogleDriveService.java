package com.ehs.elearning.service;

import com.google.api.client.http.FileContent;
import com.google.api.services.drive.Drive;
import com.google.api.services.drive.model.File;
import com.google.api.services.drive.model.Permission;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Collections;
import java.util.UUID;

@Service
public class GoogleDriveService {
    
    private static final Logger logger = LoggerFactory.getLogger(GoogleDriveService.class);
    
    @Value("${google.drive.folder-id:}")
    private String parentFolderId;
    
    @Value("${google.drive.enable-sharing:true}")
    private boolean enableSharing;
    
    @Autowired
    private Drive driveService;
    
    public DriveFileData uploadFile(MultipartFile file, String type) throws IOException {
        logger.info("=== GOOGLE DRIVE UPLOAD STARTED ===");
        logger.info("Original filename: {}", file.getOriginalFilename());
        logger.info("File type: {}", type);
        logger.info("Content type: {}", file.getContentType());
        logger.info("File size: {} bytes", file.getSize());
        logger.info("Parent folder ID: {}", parentFolderId);
        
        // Create temporary file to upload
        java.io.File tempFile = java.io.File.createTempFile("upload", null);
        logger.info("Created temp file: {}", tempFile.getAbsolutePath());
        
        file.transferTo(tempFile);
        logger.info("Transferred content to temp file");
        
        try {
            // Create file metadata
            File fileMetadata = new File();
            String generatedName = generateFileName(file.getOriginalFilename());
            fileMetadata.setName(generatedName);
            logger.info("Generated filename: {}", generatedName);
            
            // Set parent folder if configured
            if (parentFolderId != null && !parentFolderId.isEmpty()) {
                fileMetadata.setParents(Collections.singletonList(parentFolderId));
                logger.info("Set parent folder: {}", parentFolderId);
            } else {
                logger.warn("No parent folder ID configured");
            }
            
            // Create media content
            FileContent mediaContent = new FileContent(file.getContentType(), tempFile);
            logger.info("Created media content with type: {}", file.getContentType());
            
            // Upload file to Drive
            logger.info("Starting upload to Google Drive...");
            File uploadedFile = driveService.files().create(fileMetadata, mediaContent)
                    .setFields("id, name, webViewLink, webContentLink, size")
                    .execute();
            
            logger.info("File uploaded successfully!");
            logger.info("Drive File ID: {}", uploadedFile.getId());
            logger.info("Drive File Name: {}", uploadedFile.getName());
            logger.info("Drive File Size: {}", uploadedFile.getSize());
            logger.info("Web View Link: {}", uploadedFile.getWebViewLink());
            logger.info("Web Content Link: {}", uploadedFile.getWebContentLink());
            
            // Always set sharing permissions for embeddable preview
            logger.info("Setting sharing permissions...");
            Permission permission = new Permission();
            permission.setType("anyone");
            permission.setRole("reader");
            permission.setAllowFileDiscovery(false); // This makes it accessible only with the link
            driveService.permissions().create(uploadedFile.getId(), permission).execute();
            logger.info("Sharing permissions set successfully");
            
            // Also update file metadata to ensure it's viewable
            logger.info("Updating file metadata for viewability...");
            File updatedFile = new File();
            updatedFile.setViewersCanCopyContent(true);
            driveService.files().update(uploadedFile.getId(), updatedFile).execute();
            logger.info("File metadata updated");
            
            // Get the proper view URL based on file type
            String viewUrl = getViewUrl(uploadedFile, type);
            logger.info("Generated view URL: {}", viewUrl);
            
            DriveFileData result = new DriveFileData(
                uploadedFile.getId(),
                viewUrl,
                uploadedFile.getName(),
                uploadedFile.getSize()
            );
            
            logger.info("=== GOOGLE DRIVE UPLOAD COMPLETED ===");
            return result;
        } catch (Exception e) {
            logger.error("Error during Google Drive upload", e);
            throw e;
        } finally {
            // Clean up temp file
            boolean deleted = tempFile.delete();
            logger.info("Temp file deleted: {}", deleted);
        }
    }
    
    public void deleteFile(String fileId) throws IOException {
        logger.info("Deleting file from Google Drive: {}", fileId);
        
        try {
            driveService.files().delete(fileId).execute();
            logger.info("File deleted successfully: {}", fileId);
        } catch (IOException e) {
            logger.error("Error deleting file: {}", fileId, e);
            throw e;
        }
    }
    
    public void fixFilePermissions(String fileId) throws IOException {
        logger.info("Fixing permissions for file: {}", fileId);
        
        try {
            // Set permission to make the file accessible
            Permission permission = new Permission();
            permission.setType("anyone");
            permission.setRole("reader");
            permission.setAllowFileDiscovery(false);
            
            driveService.permissions().create(fileId, permission).execute();
            logger.info("Permissions fixed for file: {}", fileId);
        } catch (IOException e) {
            logger.error("Error fixing permissions for file: {}", fileId, e);
            throw e;
        }
    }
    
    private String generateFileName(String originalFilename) {
        // Generate unique filename to avoid collisions
        String extension = "";
        int lastDotIndex = originalFilename.lastIndexOf('.');
        if (lastDotIndex > 0) {
            extension = originalFilename.substring(lastDotIndex);
        }
        return UUID.randomUUID().toString() + extension;
    }
    
    private String getViewUrl(File file, String type) {
        // For different file types, use appropriate URLs
        String fileId = file.getId();
        
        switch (type.toUpperCase()) {
            case "PDF":
                // For PDFs, use the preview URL
                return "https://drive.google.com/file/d/" + fileId + "/preview";
            case "VIDEO":
                // For videos, use direct view URL with embed parameter to avoid CSP issues
                return "https://drive.google.com/file/d/" + fileId + "/preview?embedded=true";
            case "PPT":
                // For PowerPoint, use the preview URL for embedding
                return "https://drive.google.com/file/d/" + fileId + "/preview";
            default:
                // Default to preview URL for embedding
                return "https://drive.google.com/file/d/" + fileId + "/preview";
        }
    }
    
    // Data transfer object for drive file data
    public static class DriveFileData {
        private final String driveFileId;
        private final String driveFileUrl;
        private final String fileName;
        private final Long fileSize;
        
        public DriveFileData(String driveFileId, String driveFileUrl, String fileName, Long fileSize) {
            this.driveFileId = driveFileId;
            this.driveFileUrl = driveFileUrl;
            this.fileName = fileName;
            this.fileSize = fileSize;
        }
        
        public String getDriveFileId() {
            return driveFileId;
        }
        
        public String getDriveFileUrl() {
            return driveFileUrl;
        }
        
        public String getFileName() {
            return fileName;
        }
        
        public Long getFileSize() {
            return fileSize;
        }
    }
}