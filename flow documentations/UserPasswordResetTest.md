# User Password Reset Testing Procedure

This document outlines the testing procedure for the password reset functionality in the EHS Learning Platform.

## Prerequisites

1. Access to a development or testing environment
2. Access to the application's database to verify user accounts
3. Access to browser developer tools (Chrome DevTools or Firefox Developer Tools)
4. A valid user account in the system

## Testing Procedure

### 1. Request Password Reset

1. Navigate to the login page
2. Click on the "Forgot Password" link
3. Enter a valid email address for an existing user account
4. Click the "Send Reset Link" button
5. Verify that the success message appears
6. **Console Check**: Open the browser console and verify:
   - The request to `/api/auth/forgot-password` is sent
   - The response is successful (200 OK)

### 2. Retrieve Reset Token

1. Check the application console logs for the password reset token
   - The token should be logged in a section like `PASSWORD RESET TOKEN DETAILS`
2. Copy the token and the reset URL for later use
3. **Note**: In a production environment, you would receive this link via email

### 3. Access Reset Page

1. Open the reset URL from the logs (or manually navigate to `/reset-password?token={token}`)
2. Verify that the page loads and shows the password reset form
3. **Console Check**: Verify that:
   - The token validation request is sent to `/api/auth/reset-password/validate`
   - The response is successful (200 OK)
   - The token is recognized as valid

### 4. Submit New Password

1. Enter a new password that meets the validation requirements:
   - At least 8 characters
   - Contains uppercase and lowercase letters
   - Contains numbers
   - Contains special characters
   - Does not contain common terms like "password" or "safety"
2. Confirm the password in the confirmation field
3. Click the "Reset Password" button
4. **Console Check**: Open the browser's network tab and verify:
   - The request to `/api/auth/reset-password` is sent
   - The request payload contains both `token` and `password` fields
   - The Content-Type header is set to `application/json`

### 5. Verify Success

1. Verify that the success message appears
2. Wait for the automatic redirect to the login page (or click "Back to Login")
3. **Console Check**: Verify that:
   - The response is successful (200 OK)
   - There are no error messages in the console

### 6. Test Login with New Password

1. On the login page, enter the user's username/email
2. Enter the new password you just set
3. Click "Sign In"
4. Verify that the login is successful and you are redirected to the dashboard

## Error Testing

Additionally, test these error scenarios:

1. **Invalid Token**:
   - Try to access `/reset-password?token=invalid-token`
   - Verify that the proper error message is displayed

2. **Expired Token**:
   - Modify your system clock to simulate token expiration
   - Or wait for more than 24 hours if using a real token
   - Verify the expiration error is displayed

3. **Already Used Token**:
   - After successfully resetting a password, try to use the same token again
   - Verify that the "already used" error is shown

4. **Password Validation**:
   - Try to submit a password that doesn't meet the requirements
   - Verify that appropriate validation errors are displayed

## Documentation

For each test, document:
1. The test procedure followed
2. Screenshots of key steps
3. Console logs showing requests and responses
4. Any errors encountered
5. The final outcome (success/failure)
EOF < /dev/null
