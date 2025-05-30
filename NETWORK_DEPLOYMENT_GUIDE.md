# 🌐 Network Deployment Guide - EHS E-Learning Platform

## 📋 Network Deployment Overview

This guide covers deploying your EHS E-Learning Platform on a Windows machine so that other users on the network can access it through their browsers.

## 🔧 Network Access Options

### Option 1: Local Network (LAN) Access
- **Best for**: Office/home networks with trusted users
- **Access**: `http://192.168.x.x:8080` or `http://computer-name:8080`
- **Security**: Basic network security

### Option 2: Public Network Access
- **Best for**: Internet-accessible deployment
- **Access**: `http://your-domain.com:8080` or `http://public-ip:8080`
- **Security**: Requires additional security measures

## 🚀 Quick Network Setup (Option 1 - Recommended)

### Step 1: Find Your Computer's IP Address
```cmd
ipconfig
```
Look for "IPv4 Address" (usually 192.168.x.x or 10.x.x.x)

### Step 2: Configure Windows Firewall
```cmd
# Run as Administrator
netsh advfirewall firewall add rule name="EHS-App-Port8080" dir=in action=allow protocol=TCP localport=8080
```

### Step 3: Use Network Configuration Files
Use the network-specific configuration files I'll create below.

## 📁 Network Configuration Files

### 1. Network Application Properties
File: `EHS\src\main\resources\application-network.properties`

```properties
spring.application.name=EHS

# Server Configuration - Network Access
server.port=8080
# IMPORTANT: Listen on all network interfaces
server.address=0.0.0.0

# Allow bean definition overriding
spring.main.allow-bean-definition-overriding=true

# File Upload Configuration
spring.servlet.multipart.enabled=true
spring.servlet.multipart.file-size-threshold=2KB
spring.servlet.multipart.max-file-size=200MB
spring.servlet.multipart.max-request-size=215MB

# File Storage Location (Windows path)
file.upload-dir=C:\\EHS-Production\\uploads

# Connection timeout
server.connection-timeout=300s
spring.mvc.async.request-timeout=300000
spring.transaction.default-timeout=300

# Database Configuration - PRODUCTION
spring.datasource.url=jdbc:postgresql://localhost:5432/ehs_elearning_prod
spring.datasource.username=${DB_USERNAME:postgres}
spring.datasource.password=${DB_PASSWORD:your_db_password}
spring.datasource.driver-class-name=org.postgresql.Driver

# JPA/Hibernate Configuration - PRODUCTION
spring.jpa.hibernate.ddl-auto=validate
spring.jpa.show-sql=false
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.PostgreSQLDialect
spring.jpa.properties.hibernate.format_sql=false

# JWT Configuration
jwt.secret=${JWT_SECRET:your_very_long_and_secure_jwt_secret_key_here_minimum_256_bits}
jwt.expiration=3600000
jwt.header=Authorization
jwt.prefix=Bearer 

# Logging - PRODUCTION LEVELS
logging.level.com.ehs.elearning=INFO
logging.level.org.springframework.security=WARN
logging.level.org.hibernate=WARN
logging.level.root=INFO

# CORS configuration - NETWORK ACCESS
# Replace YOUR_COMPUTER_IP with your actual IP address
spring.mvc.cors.allowed-origins=http://localhost:8080,http://YOUR_COMPUTER_IP:8080,http://YOUR_COMPUTER_NAME:8080,http://192.168.*:8080,http://10.*:8080
spring.mvc.cors.allowed-methods=GET,POST,PUT,DELETE,OPTIONS
spring.mvc.cors.allowed-headers=*
spring.mvc.cors.exposed-headers=Content-Security-Policy
spring.mvc.cors.allow-credentials=true

# CSP Configuration
csp.enable=true
csp.policy=default-src 'self' http://YOUR_COMPUTER_IP:8080 https://*.google.com; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.google.com; style-src 'self' 'unsafe-inline' https://*.google.com; img-src 'self' data: https://*.google.com https://*.googleusercontent.com; media-src 'self' blob: https://*.google.com; object-src 'self' https://*.google.com; frame-src 'self' https://drive.google.com https://accounts.google.com https://*.google.com; frame-ancestors 'self' https://drive.google.com

# Email Configuration - UPDATE WITH YOUR NETWORK INFO
app.email.enabled=true
app.frontend.url=http://YOUR_COMPUTER_IP:8080

# Gmail SMTP Configuration
spring.mail.host=smtp.gmail.com
spring.mail.port=587
spring.mail.username=${EMAIL_USERNAME:your_email@gmail.com}
spring.mail.password=${EMAIL_PASSWORD:your_app_password}
spring.mail.properties.mail.smtp.auth=true
spring.mail.properties.mail.smtp.starttls.enable=true
spring.mail.properties.mail.smtp.ssl.trust=smtp.gmail.com
spring.mail.properties.mail.smtp.timeout=30000
spring.mail.properties.mail.smtp.writetimeout=30000
spring.mail.properties.mail.smtp.connectiontimeout=30000
spring.mail.properties.mail.debug=false

# Google Drive Configuration
google.drive.service-account-key-path=credentials/google-drive-service-account.json
google.drive.folder-id=1zbwJEasf7bqp49V40DKP3bh8IBG0F66S
google.drive.enable-sharing=true
google.drive.application-name=EHS E-Learning Platform

# Health Check
management.endpoints.web.exposure.include=health,info
management.endpoint.health.show-details=when_authorized
```

### 2. Network Environment Variables
File: `environment-network.bat`

```batch
@echo off
REM Set environment variables for EHS Application - Network Deployment

REM Get computer's IP address automatically
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4 Address"') do set COMPUTER_IP=%%a
set COMPUTER_IP=%COMPUTER_IP: =%

REM Get computer name
set COMPUTER_NAME=%COMPUTERNAME%

echo.
echo ============================================
echo EHS Network Deployment Configuration
echo ============================================
echo Computer Name: %COMPUTER_NAME%
echo Computer IP: %COMPUTER_IP%
echo.
echo Users can access the application at:
echo   http://%COMPUTER_IP%:8080
echo   http://%COMPUTER_NAME%:8080
echo ============================================
echo.

REM Database Configuration
set DB_USERNAME=postgres
set DB_PASSWORD=your_secure_db_password_here

REM JWT Secret (Generate a secure 256-bit key)
set JWT_SECRET=your_very_long_and_secure_jwt_secret_key_here_please_generate_a_proper_256_bit_key

REM Email Configuration
set EMAIL_USERNAME=your_email@gmail.com
set EMAIL_PASSWORD=your_gmail_app_password

REM Application Environment
set SPRING_PROFILES_ACTIVE=network

echo Environment variables set for EHS Network Production
```

### 3. Network Deployment Script
File: `deploy-network.bat`

```batch
@echo off
echo ============================================
echo EHS E-Learning Platform - Network Deployment
echo ============================================

REM Set environment variables and get network info
call environment-network.bat

REM Create directories
if not exist "uploads" mkdir uploads
if not exist "logs" mkdir logs

echo.
echo [NETWORK SETUP] Configuring Windows Firewall...
echo Adding firewall rule for port 8080...
netsh advfirewall firewall delete rule name="EHS-App-Port8080" >nul 2>&1
netsh advfirewall firewall add rule name="EHS-App-Port8080" dir=in action=allow protocol=TCP localport=8080
if %errorlevel% equ 0 (
    echo Firewall rule added successfully!
) else (
    echo WARNING: Could not add firewall rule. You may need to run as Administrator.
    echo Or manually allow port 8080 in Windows Firewall.
)

echo.
echo [1/5] Building React Frontend...
cd "Frontend yash\ehs-learning-platform"
call npm install
if %errorlevel% neq 0 (
    echo ERROR: npm install failed
    pause
    exit /b 1
)

call npm run build
if %errorlevel% neq 0 (
    echo ERROR: React build failed
    pause
    exit /b 1
)

echo.
echo [2/5] Copying React build to Spring Boot static resources...
cd ..\..
if exist "EHS\src\main\resources\static" rmdir /s /q "EHS\src\main\resources\static"
mkdir "EHS\src\main\resources\static"
xcopy "Frontend yash\ehs-learning-platform\build\*" "EHS\src\main\resources\static\" /e /y

echo.
echo [3/5] Updating network configuration...
REM Update the application-network.properties with actual IP
powershell -Command "(Get-Content 'EHS\src\main\resources\application-network.properties') -replace 'YOUR_COMPUTER_IP', '%COMPUTER_IP%' -replace 'YOUR_COMPUTER_NAME', '%COMPUTER_NAME%' | Set-Content 'EHS\src\main\resources\application-network.properties'"

echo.
echo [4/5] Building Spring Boot Application...
cd EHS
call mvnw.cmd clean package -DskipTests -Pnetwork
if %errorlevel% neq 0 (
    echo ERROR: Spring Boot build failed
    pause
    exit /b 1
)

echo.
echo [5/5] Network deployment completed successfully!
echo JAR file location: EHS\target\EHS-0.0.1-SNAPSHOT.jar
echo.
echo ============================================
echo NETWORK ACCESS INFORMATION
echo ============================================
echo.
echo Users can access the application at:
echo   http://%COMPUTER_IP%:8080
echo   http://%COMPUTER_NAME%:8080
echo   http://localhost:8080 (from this computer)
echo.
echo To start the application, run: start-application-network.bat
echo.
echo IMPORTANT NOTES:
echo 1. Make sure this computer stays connected to the network
echo 2. Users need to be on the same network to access the application
echo 3. If IP address changes, you may need to redeploy
echo 4. Ensure Windows Firewall allows port 8080
echo.
pause
```

### 4. Network Startup Script
File: `start-application-network.bat`

```batch
@echo off
echo ============================================
echo Starting EHS E-Learning Platform (Network Mode)
echo ============================================

REM Set environment variables and get network info
call environment-network.bat

REM Check if JAR file exists
if not exist "EHS\target\EHS-0.0.1-SNAPSHOT.jar" (
    echo ERROR: Application JAR not found!
    echo Please run deploy-network.bat first to build the application.
    pause
    exit /b 1
)

echo.
echo ============================================
echo APPLICATION STARTING
echo ============================================
echo.
echo Local access: http://localhost:8080
echo Network access: http://%COMPUTER_IP%:8080
echo Computer name access: http://%COMPUTER_NAME%:8080
echo.
echo Share these URLs with other users on your network!
echo.
echo Press Ctrl+C to stop the application
echo ============================================
echo.

REM Start the application
java -jar EHS\target\EHS-0.0.1-SNAPSHOT.jar --spring.profiles.active=network

pause
```

### 5. Network Security Configuration Update
File: `EHS\src\main\java\com\ehs\elearning\security\SecurityConfig.java` (Network version)

Update the CORS configuration in SecurityConfig.java:

```java
@Bean
public CorsConfigurationSource corsConfigurationSource() {
    CorsConfiguration configuration = new CorsConfiguration();
    configuration.setAllowedOriginPatterns(Arrays.asList(
        "http://localhost:*",
        "http://127.0.0.1:*",
        "http://192.168.*:*",  // Local network range
        "http://10.*:*",       // Another common local network range
        "http://172.16.*:*",   // Private network range
        "http://172.17.*:*",
        "http://172.18.*:*",
        "http://172.19.*:*",
        "http://172.20.*:*",
        "http://172.21.*:*",
        "http://172.22.*:*",
        "http://172.23.*:*",
        "http://172.24.*:*",
        "http://172.25.*:*",
        "http://172.26.*:*",
        "http://172.27.*:*",
        "http://172.28.*:*",
        "http://172.29.*:*",
        "http://172.30.*:*",
        "http://172.31.*:*"
    ));
    configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
    configuration.setAllowedHeaders(Arrays.asList("*"));
    configuration.setExposedHeaders(Arrays.asList("x-auth-token", "Authorization", "Content-Type"));
    configuration.setAllowCredentials(true);
    configuration.setMaxAge(3600L);

    UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/**", configuration);
    return source;
}
```

## 🔒 Network Security Checklist

### Basic Security (Recommended):
- [ ] Change default database password
- [ ] Use strong JWT secret
- [ ] Configure Windows Firewall properly
- [ ] Limit network access to trusted users
- [ ] Regular application updates

### Advanced Security (For Public Access):
- [ ] Use HTTPS (SSL certificate)
- [ ] Implement rate limiting
- [ ] Set up reverse proxy (nginx/IIS)
- [ ] Use VPN for remote access
- [ ] Regular security audits

## 📱 User Access Instructions

Share these instructions with your users:

### For Windows Users:
1. Open any web browser
2. Go to: `http://[COMPUTER_IP]:8080`
3. Example: `http://192.168.1.100:8080`

### For Mobile Users:
1. Connect to the same WiFi network
2. Open mobile browser
3. Go to: `http://[COMPUTER_IP]:8080`

## 🔧 Troubleshooting Network Issues

### Can't Access from Other Computers:
1. **Check Windows Firewall:**
   ```cmd
   netsh advfirewall firewall show rule name="EHS-App-Port8080"
   ```

2. **Verify application is listening on all interfaces:**
   ```cmd
   netstat -an | findstr :8080
   ```
   Should show: `0.0.0.0:8080`

3. **Test network connectivity:**
   ```cmd
   ping [COMPUTER_IP]
   telnet [COMPUTER_IP] 8080
   ```

### Common Network Issues:

1. **IP Address Changed:**
   - Run `deploy-network.bat` again
   - Update users with new IP address

2. **Firewall Blocking:**
   - Disable Windows Firewall temporarily to test
   - Add proper firewall rules
   - Check router/network firewall

3. **Different Subnets:**
   - Ensure all users are on same network
   - Check router configuration
   - Consider VPN solution

## 📊 Network Deployment Summary

| Feature | Local Only | Network (LAN) | Public Access |
|---------|------------|---------------|---------------|
| Access | localhost:8080 | IP:8080 | Domain:8080 |
| Security | Basic | Medium | High Required |
| Setup Time | 5 min | 15 min | 60+ min |
| User Sharing | None | Same Network | Internet |

Choose the deployment option that best fits your needs!