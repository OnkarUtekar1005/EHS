# Password Reset Flow Testing Guide

This document outlines the steps to test the password reset functionality implemented in the EHS Learning Platform.

## Prerequisites

- The EHS Learning Platform backend server must be running
- The EHS Learning Platform frontend application must be running
- SMTP settings must be configured in `application.properties` (or the app should be running in email-disabled mode for testing)

## Test Scenarios

### 1. Basic Password Reset Flow (Happy Path)

#### Steps:
1. Go to the login page
2. Click on "Forgot your password?" link
3. Enter a valid email address associated with an existing account
4. Verify that a success message is displayed
5. Check the console logs for the password reset token (in email-disabled mode)
6. Access the reset link from the console logs or email
7. Enter a new valid password and confirm it
8. Submit the form
9. Verify that a success message is displayed and you're redirected to the login page
10. Log in with the new password
11. Verify that you can access your account successfully

### 2. Security Test Cases

#### Scenario 2.1: Requesting Reset for Non-Existent Email
1. Go to the forgot password page
2. Enter an email that doesn't exist in the system
3. Verify that the same success message is shown as for valid emails (for security reasons)
4. Verify no reset token is generated in the backend logs

#### Scenario 2.2: Invalid Token
1. Attempt to access the password reset page with an invalid token: `/reset-password?token=invalidtoken123`
2. Verify that an error message is displayed
3. Verify that the password reset form is not shown

#### Scenario 2.3: Expired Token
1. Generate a password reset token
2. Wait for the token to expire (24 hours, or modify the token's expiry date in the database for testing)
3. Try to use the expired token
4. Verify that an error message is displayed
5. Verify that the password reset form is not shown

#### Scenario 2.4: Already Used Token
1. Generate a password reset token
2. Successfully reset the password using the token
3. Try to use the same token again
4. Verify that an error message is displayed
5. Verify that the password reset form is not shown

#### Scenario 2.5: Password Validation
1. Generate a valid password reset token
2. Access the reset page with the valid token
3. Enter passwords that fail validation rules:
   - Too short (less than 8 characters)
   - Missing uppercase letter
   - Missing lowercase letter
   - Missing number
   - Missing special character
   - Containing forbidden terms like "password", "ehs", "safety"
4. Verify that appropriate error messages are displayed
5. Verify that the form cannot be submitted

#### Scenario 2.6: Password Mismatch
1. Generate a valid password reset token
2. Access the reset page with the valid token
3. Enter a valid new password
4. Enter a different password in the confirm password field
5. Verify that an error message is displayed
6. Verify that the form cannot be submitted

### 3. Edge Cases

#### Scenario 3.1: Multiple Reset Requests
1. Request a password reset for an email
2. Without using the first token, request another reset for the same email
3. Verify that the first token is invalidated
4. Try to use the first token and verify it fails
5. Verify that the second token works correctly

#### Scenario 3.2: Network Issues
1. Start the password reset process
2. Disable network connection before submitting the form
3. Submit the form
4. Verify that appropriate error handling occurs
5. Re-enable network and retry
6. Verify that the process completes successfully

## Test Environment Setup Notes

### For Testing Without Email Server

In `application.properties`, set:
```properties
app.email.enabled=false
```

This will disable actual email sending. The tokens will be logged to the console, and you can manually navigate to the reset URL:
```
http://localhost:3000/reset-password?token=YOUR_TOKEN_HERE
```

### For Testing with Email Server

In `application.properties`, set:
```properties
app.email.enabled=true
spring.mail.host=your-smtp-server
spring.mail.port=587
spring.mail.username=your-username
spring.mail.password=your-password
spring.mail.properties.mail.smtp.auth=true
spring.mail.properties.mail.smtp.starttls.enable=true
app.frontend.url=http://localhost:3000
```

## Database Verification

You can verify the proper functioning of the system by checking the `password_reset_tokens` table in the database. Look for:

1. Token creation when a reset is requested
2. Token marked as "used" after successful password reset
3. New tokens invalidating old ones for the same user