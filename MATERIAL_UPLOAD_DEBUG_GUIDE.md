# Material Upload Debug Guide

## Logging Added

I've added comprehensive logging throughout the material upload process. Here's what to check when debugging:

### 1. Frontend Console (Browser)
When you try to upload a material, check the browser console for:

```
=== MATERIAL UPLOAD STARTED ===
Upload data: {...}
File details: {name, size, type}
FormData entries:
  file: [File object]
  title: [title value]
  description: [description value]
  type: [type value]
Sending request to server...
```

If there's an error:
```
=== MATERIAL UPLOAD ERROR ===
Full error: [error object]
Response data: [server response]
Response status: [HTTP status code]
Response headers: [response headers]
Error message to display: [error message]
```

### 2. Backend Console (Spring Boot)

#### Google Drive Configuration
When the application starts, you should see:
```
=== Google Drive Config Initialization ===
Service Account Key Path from properties: credentials/google-drive-service-account.json
Application Name from properties: EHS E-Learning Platform
```

When Google Drive bean is initialized:
```
=== Initializing Google Drive Configuration ===
Service Account Key Path: credentials/google-drive-service-account.json
Trying file system resource: [path]
Resource exists: true/false
Loading credentials from: [resource description]
Credentials loaded successfully
Google Drive service initialized successfully
```

#### Material Upload Process
When a file is uploaded:

1. **Controller Level:**
```
=== MATERIAL UPLOAD ENDPOINT CALLED ===
Title: [title]
Description: [description]
Type: [type]
File name: [filename]
File size: [size] bytes
Content type: [content type]
```

2. **Service Level:**
```
=== MATERIAL UPLOAD STARTED ===
Title: [title]
Description: [description]
Type: [type]
File name: [filename]
File size: [size] bytes
Current user: [username]
```

3. **Google Drive Service:**
```
=== GOOGLE DRIVE UPLOAD STARTED ===
Original filename: [filename]
File type: [type]
Content type: [content type]
File size: [size] bytes
Parent folder ID: [folder id]
Created temp file: [path]
Generated filename: [UUID-based name]
Starting upload to Google Drive...
File uploaded successfully!
Drive File ID: [id]
Drive File Name: [name]
Web View Link: [link]
Setting sharing permissions...
Generated view URL: [url]
=== GOOGLE DRIVE UPLOAD COMPLETED ===
```

### Common Issues to Check

1. **Authentication Issues:**
   - Check if service account key file exists
   - Verify the credentials are loaded properly
   - Ensure Google Drive API is enabled for the project

2. **Network Issues:**
   - Check if the server can reach Google APIs
   - Verify firewall/proxy settings

3. **Permission Issues:**
   - Check if the service account has the right permissions
   - Verify the parent folder ID is correct and accessible

4. **File Size Issues:**
   - Check if file size exceeds limits
   - Verify multipart configuration in application.properties

## Debug Steps

1. Try uploading a small test file (< 1MB) first
2. Check all console logs in the order they appear
3. Look for any exceptions or error messages
4. Verify the Google Drive service account has proper permissions
5. Check if the parent folder ID in application.properties is correct

## Quick Fixes

1. **If credentials are not loading:**
   - Check the path in application.properties
   - Ensure the JSON file is in the correct location
   - Verify the JSON file is valid

2. **If upload fails at Google Drive:**
   - Check API quotas
   - Verify service account permissions
   - Test with a different file type

3. **If frontend shows no error but upload fails:**
   - Check network tab in browser developer tools
   - Look for CORS issues
   - Verify JWT token is being sent correctly