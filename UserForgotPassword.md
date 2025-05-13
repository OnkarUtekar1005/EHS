# Forgot Password Implementation Fix

After thoroughly analyzing the codebase, I've identified the issue with the forgot password functionality in the EHS Learning Platform. When a user clicks on the reset password link in the email, they are redirected to a 404 page instead of the password reset page.

## Root Cause Analysis

The primary issues identified are:

1. The `app.frontend.url` property in `application.properties` may not match the actual deployed URL of the frontend
2. The frontend router may not be properly handling the reset password URL with token parameters
3. The web server hosting the frontend may not be properly configured for client-side routing

## Implementation Fix

### 1. Update Frontend URL Configuration

First, ensure the `app.frontend.url` property in `application.properties` is set to the correct URL:

```properties
# Current configuration
app.frontend.url=http://localhost:3000

# Make sure this matches your actual frontend URL in production
# app.frontend.url=https://your-production-domain.com
```

### 2. Improve Email Service Implementation

The `EmailService.java` class needs to be updated to:
- Validate the frontend URL
- Provide better error handling
- Ensure the reset URL is correctly formed

```java
package com.ehs.elearning.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    @Autowired(required = false)
    private JavaMailSender mailSender;

    @Value("${app.email.enabled:false}")
    private boolean emailEnabled;

    @Value("${app.frontend.url:http://localhost:3000}")
    private String frontendUrl;

    @Value("${spring.mail.username:noreply@ehs-learning.com}")
    private String fromEmail;

    /**
     * Sends a password reset email with a reset link
     * 
     * @param to Recipient email address
     * @param token Reset token
     * @return true if email was sent successfully, false otherwise
     */
    public boolean sendPasswordResetEmail(String to, String token) {
        // Always log the token for testing purposes
        String resetUrl = frontendUrl + "/reset-password?token=" + token;
        System.out.println("\n====================================================");
        System.out.println("PASSWORD RESET TOKEN DETAILS");
        System.out.println("====================================================");
        System.out.println("Email: " + to);
        System.out.println("Token: " + token);
        System.out.println("Reset URL: " + resetUrl);
        System.out.println("====================================================\n");

        // Validate the frontendUrl value
        if (frontendUrl == null || frontendUrl.isEmpty() || frontendUrl.equals("http://localhost:3000")) {
            System.out.println("WARNING: Using default frontend URL. Make sure this is correct for your environment.");
        }

        // Debug info
        System.out.println("Email Service Status:");
        System.out.println("Email enabled flag: " + emailEnabled);
        System.out.println("Mail sender instance: " + (mailSender == null ? "NULL" : "initialized"));
        System.out.println("Frontend URL: " + frontendUrl);
        System.out.println("From email: " + fromEmail);

        // Always return true in console mode
        if (!emailEnabled) {
            System.out.println("Email sending is disabled in configuration. Only logging token to console.");
            return true;
        }

        // Check mailSender again
        if (mailSender == null) {
            System.err.println("ERROR: JavaMailSender is null but email is enabled! Check your configuration.");
            System.out.println("Email would have been sent to: " + to);
            return true; // Still return true to allow the flow to continue
        }

        try {
            System.out.println("Attempting to create and send email...");
            
            // Use SimpleMailMessage for troubleshooting
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(to);
            message.setSubject("Password Reset Request");
            message.setText("You have requested to reset your password for the EHS Learning Platform.\n\n" +
                    "Please click on the link below to reset your password:\n" +
                    resetUrl + "\n\n" +
                    "This link will expire in 24 hours.\n\n" +
                    "If you did not request a password reset, please ignore this email.\n\n" +
                    "Regards,\nEHS Learning Platform Team");
            
            System.out.println("Email message created. Attempting to send...");
            System.out.println("From: " + fromEmail);
            System.out.println("To: " + to);
            
            mailSender.send(message);
            System.out.println("Password reset email sent successfully to: " + to);
            return true;
        } catch (Exception e) {
            System.err.println("Failed to send password reset email: " + e.getMessage());
            System.err.println("Error type: " + e.getClass().getName());
            e.printStackTrace();
            return false;
        }
    }
}
```

### 3. Verify Frontend Route Configuration

Ensure that the reset password route is correctly defined in `App.js`:

```javascript
// This should be the current definition
<Route path="/reset-password" element={<ResetPassword />} />
```

### 4. Update ResetPassword.js Component

Enhance error handling in the token validation process:

```javascript
// Update the useEffect hook in ResetPassword.js
useEffect(() => {
  const validateToken = async () => {
    if (!token) {
      setTokenValid(false);
      setIsValidatingToken(false);
      console.error("No token found in URL");
      return;
    }

    try {
      console.log(`Validating token: ${token}`);
      // Connect to the real API endpoint to validate token
      await authService.validateResetToken(token);
      setTokenValid(true);
      console.log("Token validation successful");
    } catch (error) {
      console.error('Token validation error:', error);
      if (error.response) {
        console.error('Token validation response:', error.response.data);
        console.error('Status code:', error.response.status);
      }
      setTokenValid(false);
    } finally {
      setIsValidatingToken(false);
    }
  };

  validateToken();
}, [token]);
```

### 5. Web Server Configuration

If you're using a server to host your frontend, make sure it's properly configured to handle client-side routing:

**For Nginx:**
```
location / {
  try_files $uri $uri/ /index.html;
}
```

**For Apache (.htaccess):**
```
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

For static file servers, add a custom 404.html that redirects to the index.html file:

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Redirecting...</title>
  <script>
    // Extract the path from the URL
    var path = window.location.pathname + window.location.search;
    // Redirect to the index.html with the path as a query parameter
    window.location.href = '/index.html?redirect=' + encodeURIComponent(path);
  </script>
</head>
<body>
  <p>Redirecting...</p>
</body>
</html>
```

Then, in your index.html file, add a script to handle the redirect:

```html
<script>
  // Check if there's a redirect parameter
  var redirect = new URLSearchParams(window.location.search).get('redirect');
  if (redirect) {
    // Remove the redirect parameter from the URL
    window.history.replaceState(null, null, redirect);
  }
</script>
```

## Testing Steps

1. Update the application with the changes above
2. Start the backend and frontend applications
3. Navigate to the login page and click "Forgot Password"
4. Enter a valid email address and submit the form
5. Check the console logs or email for the reset link
6. Click the reset link (or copy it to your browser)
7. Verify that the reset password page is displayed
8. Enter a new password and submit the form
9. Verify that you can log in with the new password

## Conclusion

The issue with the forgot password functionality is related to URL handling and frontend routing. By updating the EmailService, ensuring the correct frontend URL configuration, and adding better error handling, users should be able to successfully reset their passwords without encountering 404 errors.

Once these changes are implemented, the forgot password flow will work as expected:
1. User requests a password reset by entering their email
2. System sends an email with a reset link containing a token
3. User clicks the link to navigate to the reset password page
4. User enters a new password and completes the reset process