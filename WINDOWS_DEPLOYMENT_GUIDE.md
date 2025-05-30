# Windows Production Deployment Guide - EHS E-Learning Platform

## 📋 Prerequisites Installation

### 1. Install Java 17
- Download from: https://www.oracle.com/java/technologies/javase/jdk17-archive-downloads.html
- Or use OpenJDK: https://adoptium.net/temurin/releases/?version=17
- Add to PATH: `C:\Program Files\Java\jdk-17\bin`
- Verify: `java -version`

### 2. Install PostgreSQL for Windows
- Download from: https://www.postgresql.org/download/windows/
- During installation:
  - Set password for `postgres` user (remember this!)
  - Port: 5432 (default)
  - Note the installation directory
- Verify: `psql --version`

### 3. Install Node.js (for building React)
- Download from: https://nodejs.org/en/download/
- Choose LTS version
- Verify: `node --version` and `npm --version`

### 4. Install Git (if not present)
- Download from: https://git-scm.com/download/win
- Choose "Git for Windows"

## 🗄️ Database Setup

### 1. Create Production Database
Open Command Prompt as Administrator and run:
```cmd
# Connect to PostgreSQL
psql -U postgres -h localhost

# Create database
CREATE DATABASE ehs_elearning_prod;

# Create user (optional, for security)
CREATE USER ehs_user WITH PASSWORD 'your_secure_password_here';
GRANT ALL PRIVILEGES ON DATABASE ehs_elearning_prod TO ehs_user;

# Exit
\q
```

### 2. Test Database Connection
```cmd
psql -U postgres -d ehs_elearning_prod -h localhost
```

## 📁 Project Setup

### 1. Copy Project to Windows Machine
- Copy the entire EHS project folder to: `C:\EHS-Production\`
- Ensure you have both backend and frontend code

### 2. Directory Structure Should Look Like:
```
C:\EHS-Production\
├── EHS\                          (Spring Boot backend)
├── Frontend yash\                (React frontend)
├── WINDOWS_DEPLOYMENT_GUIDE.md   (this file)
├── deploy.bat                    (deployment script)
└── start-application.bat         (startup script)
```

## ⚙️ Configuration Files

### 1. Production Application Properties
File: `EHS\src\main\resources\application-prod.properties`

```properties
spring.application.name=EHS

# Server Configuration
server.port=8080
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

# JWT Configuration - USE ENVIRONMENT VARIABLES
jwt.secret=${JWT_SECRET:your_very_long_and_secure_jwt_secret_key_here_minimum_256_bits}
jwt.expiration=3600000
jwt.header=Authorization
jwt.prefix=Bearer 

# Logging - PRODUCTION LEVELS
logging.level.com.ehs.elearning=INFO
logging.level.org.springframework.security=WARN
logging.level.org.hibernate=WARN
logging.level.root=INFO

# CORS configuration - UPDATE WITH YOUR ACTUAL DOMAIN
spring.mvc.cors.allowed-origins=http://localhost:8080,http://your-domain.com
spring.mvc.cors.allowed-methods=GET,POST,PUT,DELETE,OPTIONS
spring.mvc.cors.allowed-headers=*
spring.mvc.cors.exposed-headers=Content-Security-Policy

# CSP Configuration
csp.enable=true
csp.policy=default-src 'self' https://*.google.com; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.google.com; style-src 'self' 'unsafe-inline' https://*.google.com; img-src 'self' data: https://*.google.com https://*.googleusercontent.com; media-src 'self' blob: https://*.google.com; object-src 'self' https://*.google.com; frame-src 'self' https://drive.google.com https://accounts.google.com https://*.google.com; frame-ancestors 'self' https://drive.google.com

# Email Configuration
app.email.enabled=true
app.frontend.url=http://localhost:8080

# Gmail SMTP Configuration - USE ENVIRONMENT VARIABLES
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

### 2. Environment Variables File
File: `C:\EHS-Production\environment.bat`

```batch
@echo off
REM Set environment variables for EHS Application

REM Database Configuration
set DB_USERNAME=postgres
set DB_PASSWORD=your_secure_db_password_here

REM JWT Secret (Generate a secure 256-bit key)
set JWT_SECRET=your_very_long_and_secure_jwt_secret_key_here_please_generate_a_proper_256_bit_key

REM Email Configuration
set EMAIL_USERNAME=your_email@gmail.com
set EMAIL_PASSWORD=your_gmail_app_password

REM Application Environment
set SPRING_PROFILES_ACTIVE=prod

echo Environment variables set for EHS Production
```

## 🔨 Build and Deployment Scripts

### 1. Main Deployment Script
File: `C:\EHS-Production\deploy.bat`

```batch
@echo off
echo ============================================
echo EHS E-Learning Platform - Windows Deployment
echo ============================================

REM Set environment variables
call environment.bat

REM Create directories
if not exist "uploads" mkdir uploads
if not exist "logs" mkdir logs

echo.
echo [1/4] Building React Frontend...
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
echo [2/4] Copying React build to Spring Boot static resources...
cd ..\..
if exist "EHS\src\main\resources\static" rmdir /s /q "EHS\src\main\resources\static"
mkdir "EHS\src\main\resources\static"
xcopy "Frontend yash\ehs-learning-platform\build\*" "EHS\src\main\resources\static\" /e /y

echo.
echo [3/4] Building Spring Boot Application...
cd EHS
call mvnw.cmd clean package -DskipTests -Pprod
if %errorlevel% neq 0 (
    echo ERROR: Spring Boot build failed
    pause
    exit /b 1
)

echo.
echo [4/4] Build completed successfully!
echo JAR file location: EHS\target\EHS-0.0.1-SNAPSHOT.jar
echo.
echo To start the application, run: start-application.bat
echo.
pause
```

### 2. Application Startup Script
File: `C:\EHS-Production\start-application.bat`

```batch
@echo off
echo ============================================
echo Starting EHS E-Learning Platform
echo ============================================

REM Set environment variables
call environment.bat

REM Check if JAR file exists
if not exist "EHS\target\EHS-0.0.1-SNAPSHOT.jar" (
    echo ERROR: Application JAR not found!
    echo Please run deploy.bat first to build the application.
    pause
    exit /b 1
)

echo Starting application on http://localhost:8080
echo Press Ctrl+C to stop the application
echo.

REM Start the application
java -jar EHS\target\EHS-0.0.1-SNAPSHOT.jar --spring.profiles.active=prod

pause
```

### 3. Service Installation Script (Optional)
File: `C:\EHS-Production\install-service.bat`

```batch
@echo off
echo Installing EHS as Windows Service...

REM Download NSSM (Non-Sucking Service Manager)
echo Please download NSSM from: https://nssm.cc/download
echo Extract nssm.exe to C:\EHS-Production\

if not exist "nssm.exe" (
    echo ERROR: nssm.exe not found!
    echo Please download and extract NSSM first.
    pause
    exit /b 1
)

REM Install service
nssm install EHS-ELearning "C:\Program Files\Java\jdk-17\bin\java.exe"
nssm set EHS-ELearning Arguments "-jar C:\EHS-Production\EHS\target\EHS-0.0.1-SNAPSHOT.jar --spring.profiles.active=prod"
nssm set EHS-ELearning AppDirectory "C:\EHS-Production"
nssm set EHS-ELearning DisplayName "EHS E-Learning Platform"
nssm set EHS-ELearning Description "EHS E-Learning Platform Web Application"
nssm set EHS-ELearning Start SERVICE_AUTO_START

echo Service installed successfully!
echo Use 'net start EHS-ELearning' to start the service
echo Use 'net stop EHS-ELearning' to stop the service
pause
```

## 🚀 Deployment Steps

### Step 1: Initial Setup
1. Copy all project files to `C:\EHS-Production\`
2. Edit `environment.bat` with your actual credentials
3. Create uploads directory: `mkdir C:\EHS-Production\uploads`

### Step 2: Database Setup
1. Install PostgreSQL
2. Create database using the SQL commands above
3. Test connection

### Step 3: Build and Deploy
1. Open Command Prompt as Administrator
2. Navigate to: `cd C:\EHS-Production`
3. Run: `deploy.bat`
4. Wait for build to complete

### Step 4: Start Application
1. Run: `start-application.bat`
2. Open browser: http://localhost:8080
3. Test login and functionality

### Step 5: Windows Service (Optional)
1. Download NSSM from https://nssm.cc/download
2. Extract `nssm.exe` to `C:\EHS-Production\`
3. Run: `install-service.bat`
4. Start service: `net start EHS-ELearning`

## 🔒 Security Checklist

- [ ] Change default database password
- [ ] Generate secure JWT secret (256-bit)
- [ ] Set up Gmail app password for email
- [ ] Configure Windows Firewall
- [ ] Update CORS origins in application-prod.properties
- [ ] Secure uploads directory permissions
- [ ] Enable Windows automatic updates
- [ ] Set up regular database backups

## 🔧 Troubleshooting

### Common Issues:

1. **Port 8080 already in use:**
   ```cmd
   netstat -ano | findstr :8080
   taskkill /PID <PID_NUMBER> /F
   ```

2. **Database connection failed:**
   - Check PostgreSQL service is running
   - Verify credentials in environment.bat
   - Test with: `psql -U postgres -d ehs_elearning_prod`

3. **Java not found:**
   - Verify JAVA_HOME is set
   - Add Java to PATH: `C:\Program Files\Java\jdk-17\bin`

4. **Build fails:**
   - Check Node.js and npm are installed
   - Clear npm cache: `npm cache clean --force`
   - Delete node_modules and reinstall

## 📞 Support

- Application runs on: http://localhost:8080
- Database runs on: localhost:5432
- Logs location: Check console output or configure file logging
- Uploads directory: C:\EHS-Production\uploads

Remember to backup your database regularly and keep your environment variables secure!