# JWT Debug Guide

## Issue
You're getting a 401 Unauthorized error when trying to access the Materials page, even though the JWT token is being sent in the Authorization header.

## Changes Made

1. **Added enhanced logging** in:
   - `JwtTokenProvider.java` - Now logs specific JWT validation errors
   - `JwtAuthenticationFilter.java` - Logs token processing steps
   - `application.properties` - Added DEBUG logging for security

2. **Fixed Security Configuration**:
   - Updated materials endpoint mapping to `/api/admin/materials/**`
   - Added debug endpoints that don't require authentication

3. **Created Debug Controller**:
   - `/api/debug/jwt-info` - Analyzes JWT token without authentication
   - `/api/debug/test-auth` - Simple test endpoint

## Debug Steps

1. **Restart Backend**:
   ```bash
   cd EHS
   mvn spring-boot:run
   ```

2. **Check Debug Endpoint** (in browser console or Postman):
   ```javascript
   // In browser console while logged in
   fetch('http://localhost:8080/api/debug/jwt-info', {
     headers: {
       'Authorization': localStorage.getItem('token') ? `Bearer ${localStorage.getItem('token')}` : ''
     }
   }).then(r => r.json()).then(console.log)
   ```

3. **Check Console Logs**:
   Look for:
   - JWT validation errors
   - Security filter chain processing
   - Authentication success/failure messages

## Common JWT Issues

1. **Token Format**:
   - Should be: `Bearer <token>`
   - Check for extra spaces or missing "Bearer" prefix

2. **Token Expiry**:
   - Default is 24 hours (86400000ms)
   - Check if token has expired

3. **Secret Key Mismatch**:
   - Verify JWT secret in application.properties matches
   - Check if secret changed between token creation and validation

4. **Role Format**:
   - Should be "ROLE_ADMIN" not just "ADMIN"
   - Check role extraction in token

## Quick Test

```javascript
// Test if it's a general auth issue or specific to materials
fetch('http://localhost:8080/api/v2/user/courses', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  }
}).then(r => console.log('Status:', r.status))
```

## Next Steps

1. Run the application with the new logging
2. Try accessing the Materials page
3. Check backend console for detailed JWT validation logs
4. Use the debug endpoint to analyze the token
5. Share the logs to identify the exact issue