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
        logger.info("Uploading file to Google Drive: {} of type: {}", file.getOriginalFilename(), type);
        
        // Create temporary file to upload
        java.io.File tempFile = java.io.File.createTempFile("upload", null);
        file.transferTo(tempFile);
        
        try {
            // Create file metadata
            File fileMetadata = new File();
            fileMetadata.setName(generateFileName(file.getOriginalFilename()));
            
            // Set parent folder if configured
            if (parentFolderId != null && !parentFolderId.isEmpty()) {
                fileMetadata.setParents(Collections.singletonList(parentFolderId));
            }
            
            // Create media content
            FileContent mediaContent = new FileContent(file.getContentType(), tempFile);
            
            // Upload file to Drive
            File uploadedFile = driveService.files().create(fileMetadata, mediaContent)
                    .setFields("id, name, webViewLink, webContentLink, size")
                    .execute();
            
            logger.info("File uploaded successfully. ID: {}", uploadedFile.getId());
            
            // Always set sharing permissions for embeddable preview
            Permission permission = new Permission();
            permission.setType("anyone");
            permission.setRole("reader");
            permission.setAllowFileDiscovery(false); // This makes it accessible only with the link
            driveService.permissions().create(uploadedFile.getId(), permission).execute();
            logger.info("Sharing permissions set for file: {}", uploadedFile.getId());
            
            // Also update file metadata to ensure it's viewable
            File updatedFile = new File();
            updatedFile.setViewersCanCopyContent(true);
            driveService.files().update(uploadedFile.getId(), updatedFile).execute();
            
            // Get the proper view URL based on file type
            String viewUrl = getViewUrl(uploadedFile, type);
            
            return new DriveFileData(
                uploadedFile.getId(),
                viewUrl,
                uploadedFile.getName(),
                uploadedFile.getSize()
            );
        } finally {
            // Clean up temp file
            tempFile.delete();
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
                // For videos, also use the preview URL for consistent embedding
                return "https://drive.google.com/file/d/" + fileId + "/preview";
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