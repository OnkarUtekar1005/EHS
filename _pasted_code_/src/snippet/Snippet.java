package snippet;

public class Snippet {
	@GetMapping("/{id}/stream")
	public ResponseEntity<Resource> streamMaterial(@PathVariable String id) {
	    try {
	        // Find the material by ID
	        Optional<LearningMaterial> materialOptional = materialService.findById(id);
	        
	        if (!materialOptional.isPresent()) {
	            return ResponseEntity.notFound().build();
	        }
	        
	        LearningMaterial material = materialOptional.get();
	        
	        // If it's content-based or external, we can't stream it
	        if (material.getFileType().equals("HTML") || material.getFileType().equals("EXTERNAL")) {
	            return ResponseEntity.badRequest().build();
	        }
	        
	        // Get the file path
	        String filePath = material.getFilePath();
	        if (filePath == null || filePath.isEmpty()) {
	            return ResponseEntity.notFound().build();
	        }
	        
	        // Get the file resource
	        Path path = fileStorageService.getFilePath(filePath);
	        Resource resource = new UrlResource(path.toUri());
	        
	        if (!resource.exists() || !resource.isReadable()) {
	            return ResponseEntity.notFound().build();
	        }
	        
	        // Determine content type based on file type
	        String contentType = determineContentType(material.getFileType(), filePath);
	        
	        // Add cache control headers to improve performance
	        return ResponseEntity.ok()
	            .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + resource.getFilename() + "\"")
	            .header(HttpHeaders.CACHE_CONTROL, "no-cache, no-store, must-revalidate")
	            .header(HttpHeaders.PRAGMA, "no-cache")
	            .header(HttpHeaders.EXPIRES, "0")
	            .contentType(MediaType.parseMediaType(contentType))
	            .body(resource);
	            
	    } catch (Exception e) {
	        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
	    }
	}
	
	/**
	 * Determine content type based on material type and file extension
	 */
	private String determineContentType(String materialType, String filePath) {
	    switch (materialType) {
	        case "PDF":
	            return "application/pdf";
	        case "VIDEO":
	            return filePath.toLowerCase().endsWith(".mp4") ? "video/mp4" : "video/quicktime";
	        case "IMAGE":
	            if (filePath.toLowerCase().endsWith(".jpg") || filePath.toLowerCase().endsWith(".jpeg")) {
	                return "image/jpeg";
	            } else if (filePath.toLowerCase().endsWith(".png")) {
	                return "image/png";
	            } else if (filePath.toLowerCase().endsWith(".gif")) {
	                return "image/gif";
	            } else {
	                return "image/*";
	            }
	        case "DOCUMENT":
	            if (filePath.toLowerCase().endsWith(".docx")) {
	                return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
	            } else if (filePath.toLowerCase().endsWith(".doc")) {
	                return "application/msword";
	            } else {
	                return "application/octet-stream";
	            }
	        case "PRESENTATION":
	            if (filePath.toLowerCase().endsWith(".pptx")) {
	                return "application/vnd.openxmlformats-officedocument.presentationml.presentation";
	            } else if (filePath.toLowerCase().endsWith(".ppt")) {
	                return "application/vnd.ms-powerpoint";
	            } else {
	                return "application/octet-stream";
	            }
	        default:
	            return "application/octet-stream";
	    }
	}
}

