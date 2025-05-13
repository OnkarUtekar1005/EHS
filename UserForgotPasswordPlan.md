# User Forgot Password Implementation Plan

## Problem Overview

The forgot password functionality in the EHS Learning Platform is currently not working properly. When a user clicks the "Forgot Password" link on the login page and enters their email, the system sends an email with a reset link. However, when the user clicks on this reset link, they are redirected to a 404 page instead of the password reset page.

## Root Cause Analysis

After examining the codebase, several potential issues have been identified:

1. **Frontend URL Configuration**: The backend is using `app.frontend.url=http://localhost:3000` in the application.properties, which may not match the actual deployed URL of the frontend application.

2. **Email Reset Link Format**: The EmailService generates a reset link in the format `frontendUrl + "/reset-password?token=" + token`, which may not be correctly handled by the frontend routing.

3. **Route Configuration**: The React Router configuration in App.js includes a route for `/reset-password`, but it may not be correctly handling the token parameter or may be affected by other routing issues.

4. **Token Validation**: While the token validation appears to be correctly implemented in both the frontend and backend, the issue occurs before this step when the user is trying to access the reset password page.

## Implementation Plan

### 1. Fix Frontend URL Configuration

**Changes needed:**
- Update the `app.frontend.url` in application.properties to match the actual deployed URL of the frontend application
- Ensure this value is correctly passed to the EmailService

### 2. Verify Email Service Implementation

**Changes needed:**
- Review the EmailService implementation to ensure emails are being sent correctly
- Verify the reset link format is correct for the frontend routing
- Test the email sending functionality with actual email addresses

### 3. Update Frontend Routes and Token Handling

**Changes needed:**
- Ensure the Reset Password component correctly handles URL parameters
- Verify that the token extraction logic correctly parses the token from the URL
- Test the token validation logic to ensure it works with valid tokens

### 4. Testing the Complete Flow

1. **Reset Request Testing**:
   - Submit a forgot password request
   - Verify the email is sent with the correct reset link
   - Confirm the token is stored in the database

2. **Reset Link Testing**:
   - Click the reset link in the email
   - Verify the user is directed to the reset password page
   - Confirm the token is correctly extracted from the URL

3. **Password Reset Testing**:
   - Submit a new password
   - Verify the password is updated in the database
   - Confirm the token is marked as used
   - Test logging in with the new password

### 5. Security Considerations

- Ensure tokens expire after a reasonable time (currently set to 24 hours)
- Verify tokens can only be used once
- Validate password strength requirements
- Implement rate limiting for password reset requests

## Implementation Details

### Backend Changes

1. **Email Service Configuration**:
   - Verify the `app.frontend.url` is correctly set
   - Log the complete reset URL for debugging purposes

2. **Token Validation Endpoint**:
   - Verify the `/api/auth/reset-password/validate` endpoint correctly validates tokens
   - Ensure error responses are clear and helpful

3. **Password Reset Endpoint**:
   - Verify the `/api/auth/reset-password` endpoint correctly updates passwords
   - Ensure tokens are marked as used after password reset

### Frontend Changes

1. **Reset Password Component**:
   - Verify the URL parameter extraction logic
   - Ensure token validation is performed immediately on page load
   - Provide clear error messages for invalid or expired tokens

2. **API Service**:
   - Verify the `resetPassword` function correctly sends the token and new password
   - Ensure error handling is robust

## Timeline

1. **Investigation and Analysis**: Complete (current document)
2. **Implementation of Fixes**: 1-2 days
3. **Testing**: 1 day
4. **Deployment**: 1 day

## Conclusion

The forgot password functionality is not working due to issues with the reset link URL and routing. By updating the frontend URL configuration and ensuring the reset link is correctly formatted and handled, we can fix this functionality and provide users with a working password reset flow.

This implementation plan covers the necessary changes to both the backend and frontend components to ensure a seamless password reset experience for users.