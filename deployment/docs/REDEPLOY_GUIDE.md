# Protecther E-Learning Platform - Redeployment Guide

## Overview
This guide covers how to redeploy the Protecther E-Learning Platform after making changes to backend, frontend, database, or configuration.

## Table of Contents
1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Backend Redeployment](#backend-redeployment)
3. [Frontend Redeployment](#frontend-redeployment)
4. [Database Changes](#database-changes)
5. [Configuration Updates](#configuration-updates)
6. [Complete Redeployment](#complete-redeployment)
7. [First Admin User Setup](#first-admin-user-setup)
8. [Verification Steps](#verification-steps)
9. [Troubleshooting](#troubleshooting)

---

## Pre-Deployment Checklist

### Before Starting:
- [ ] Backup current database
- [ ] Note current version/commit
- [ ] Ensure no users are actively using the system
- [ ] Have rollback plan ready

### Backup Commands:
```cmd
# Backup database
pg_dump -U ehs_user -d ehs_elearning_production > C:\deployment\backups\backup-%date%.sql

# Backup current JAR
copy C:\deployment\backend\EHS-0.0.1-SNAPSHOT.jar C:\deployment\backups\EHS-backup-%date%.jar

# Backup frontend
xcopy C:\deployment\frontend C:\deployment\backups\frontend-backup-%date%\ /s /e /i
```

---

## Backend Redeployment

### Step 1: Build New Backend
```cmd
# Navigate to backend source
cd "path\to\EHS\EHS"

# Clean previous build
mvn clean

# Build new JAR
mvn package -DskipTests

# Verify JAR was created
dir target\EHS-0.0.1-SNAPSHOT.jar
```

### Step 2: Stop Current Backend
```cmd
# Method 1: If running as service
net stop EHS-Backend

# Method 2: If running manually (Ctrl+C in the terminal)
# Or find and kill process:
tasklist | findstr java
taskkill /f /pid [PROCESS_ID]
```

### Step 3: Deploy New Backend
```cmd
# Backup current JAR
copy C:\deployment\backend\EHS-0.0.1-SNAPSHOT.jar C:\deployment\backend\EHS-backup.jar

# Copy new JAR
copy target\EHS-0.0.1-SNAPSHOT.jar C:\deployment\backend\

# Verify file was copied
dir C:\deployment\backend\EHS-0.0.1-SNAPSHOT.jar
```

### Step 4: Start New Backend
```cmd
# Method 1: If running as service
net start EHS-Backend

# Method 2: Manual start
cd C:\deployment\backend
java -jar EHS-0.0.1-SNAPSHOT.jar

# Check if started successfully
curl http://localhost:8080/actuator/health
```

---

## Frontend Redeployment

### Step 1: Build New Frontend
```cmd
# Navigate to frontend source
cd "Frontend yash\ehs-learning-platform"

# Install dependencies (if package.json changed)
npm install

# Build production version
npm run build

# Verify build folder was created
dir build\
```

### Step 2: Stop Nginx
```cmd
cd C:\nginx
nginx.exe -s stop

# Verify nginx stopped
tasklist | findstr nginx
```

### Step 3: Deploy New Frontend
```cmd
# Backup current frontend
xcopy C:\deployment\frontend C:\deployment\backups\frontend-backup\ /s /e /i

# Clear current frontend
del C:\deployment\frontend\* /q /s

# Copy new frontend files
xcopy build\* C:\deployment\frontend\ /s /e /i

# Verify files copied
dir C:\deployment\frontend\
```

### Step 4: Start Nginx
```cmd
cd C:\nginx

# Test configuration
nginx.exe -t

# Start nginx
nginx.exe

# Verify nginx started
tasklist | findstr nginx
```

---

## Database Changes

### Step 1: Connect to Database
```cmd
# Connect as admin
psql -U ehs_user -d ehs_elearning_production
```

### Step 2: Apply Schema Changes
```sql
-- Example: Adding new table
CREATE TABLE IF NOT EXISTS new_feature (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Example: Modifying existing table
ALTER TABLE users ADD COLUMN IF NOT EXISTS new_field VARCHAR(100);

-- Example: Creating indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Exit
\q
```

### Step 3: Verify Database Changes
```sql
-- Check tables
\dt

-- Check specific table structure
\d users

-- Verify data integrity
SELECT COUNT(*) FROM users WHERE user_type = 'ADMIN';
```

---

## Configuration Updates

### Environment Variables (.env)
```cmd
# Edit environment file
notepad C:\deployment\backend\.env

# Common updates:
# - Database connection strings
# - Email configurations
# - Google Drive settings
# - Frontend URL changes
```

### Nginx Configuration
```cmd
# Edit nginx configuration
notepad C:\nginx\conf\sites\ehs-clean.conf

# Test configuration
cd C:\nginx
nginx.exe -t

# Reload configuration (without stopping)
nginx.exe -s reload
```

### SSL Certificate Updates
```cmd
# If certificate expired or changed
cd "C:\Program Files\OpenSSL-Win64\bin"

# Regenerate certificate
openssl genrsa -out C:\deployment\ssl\nginx.key 2048
openssl req -new -key C:\deployment\ssl\nginx.key -out C:\deployment\ssl\nginx.csr -subj "/C=US/ST=State/L=City/O=Protecther/CN=192.168.222.216"
openssl x509 -req -days 365 -in C:\deployment\ssl\nginx.csr -signkey C:\deployment\ssl\nginx.key -out C:\deployment\ssl\nginx.crt

# Reload nginx
cd C:\nginx
nginx.exe -s reload
```

---

## Complete Redeployment

### Step 1: Stop All Services
```cmd
# Stop backend
net stop EHS-Backend
# OR if manual: Ctrl+C in backend terminal

# Stop nginx
cd C:\nginx
nginx.exe -s stop

# Verify all stopped
tasklist | findstr nginx
tasklist | findstr java
```

### Step 2: Update All Components
```cmd
# Update backend
copy new-jar-path\EHS-0.0.1-SNAPSHOT.jar C:\deployment\backend\

# Update frontend
del C:\deployment\frontend\* /q /s
xcopy new-build-path\* C:\deployment\frontend\ /s /e /i

# Update configuration if needed
copy new-env-file C:\deployment\backend\.env
```

### Step 3: Start All Services
```cmd
# Start nginx
cd C:\nginx
nginx.exe

# Start backend
net start EHS-Backend
# OR manual: cd C:\deployment\backend && java -jar EHS-0.0.1-SNAPSHOT.jar
```

---

## First Admin User Setup

### Method 1: Database Insert (Recommended)
```cmd
# Connect to database
psql -U ehs_user -d ehs_elearning_production
```

```sql
-- Wait for application to start and create tables
-- Check if tables exist
\dt

-- Insert admin user
-- Username: admin, Password: admin123 (change after first login)
INSERT INTO users (
    id, 
    username, 
    password, 
    email, 
    first_name, 
    last_name, 
    user_type, 
    created_at, 
    updated_at
) VALUES (
    gen_random_uuid(), 
    'admin', 
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 
    'admin@protecther.com', 
    'System', 
    'Administrator', 
    'ADMIN', 
    NOW(), 
    NOW()
);

-- Verify user was created
SELECT username, email, user_type, created_at FROM users WHERE username = 'admin';

-- Exit
\q
```

### Method 2: Using Application API (Alternative)
```cmd
# Create admin via API call (if registration endpoint exists)
curl -X POST http://localhost:8080/api/auth/register ^
  -H "Content-Type: application/json" ^
  -d "{\"username\":\"admin\",\"password\":\"admin123\",\"email\":\"admin@protecther.com\",\"firstName\":\"System\",\"lastName\":\"Administrator\",\"userType\":\"ADMIN\"}"
```

### Method 3: Batch Script for Admin Creation
Create `C:\deployment\scripts\create-admin.bat`:
```batch
@echo off
echo Creating admin user...

psql -U ehs_user -d ehs_elearning_production -c "INSERT INTO users (id, username, password, email, first_name, last_name, user_type, created_at, updated_at) VALUES (gen_random_uuid(), 'admin', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin@protecther.com', 'System', 'Administrator', 'ADMIN', NOW(), NOW()) ON CONFLICT (username) DO NOTHING;"

if %errorlevel% == 0 (
    echo Admin user created successfully!
    echo Username: admin
    echo Password: admin123
    echo Please change password after first login!
) else (
    echo Failed to create admin user!
)

pause
```

### Admin User Credentials
- **Username**: `admin`
- **Password**: `admin123`
- **Email**: `admin@protecther.com`
- **⚠️ CRITICAL**: Change password immediately after first login!

---

## Verification Steps

### Step 1: Service Status
```cmd
# Check backend service
sc query EHS-Backend
# OR check process: tasklist | findstr java

# Check nginx service
tasklist | findstr nginx

# Check database
sc query postgresql-x64-15
```

### Step 2: Network Connectivity
```cmd
# Test backend health
curl http://localhost:8080/actuator/health

# Test frontend (HTTP)
curl http://192.168.222.216

# Test frontend (HTTPS)
curl -k https://192.168.222.216

# Check API endpoints
curl http://localhost:8080/api/public/health
```

### Step 3: Application Testing
1. **Open browser**: Navigate to `http://192.168.222.216` or `https://192.168.222.216`
2. **Login test**: Use admin credentials
3. **Dashboard access**: Verify admin dashboard loads
4. **User management**: Check if you can view users
5. **Course management**: Check if you can create/view courses
6. **File upload**: Test file upload functionality

### Step 4: Database Verification
```sql
-- Connect to database
psql -U ehs_user -d ehs_elearning_production

-- Check admin user exists
SELECT username, email, user_type FROM users WHERE user_type = 'ADMIN';

-- Check table structure
\dt

-- Check recent activity
SELECT username, created_at FROM users ORDER BY created_at DESC LIMIT 5;

-- Exit
\q
```

---

## Troubleshooting

### Backend Issues

#### Service Won't Start
```cmd
# Check Java version
java -version

# Check port conflicts
netstat -ano | findstr :8080

# Check logs
type C:\deployment\logs\backend-error.log

# Manual start for debugging
cd C:\deployment\backend
java -jar EHS-0.0.1-SNAPSHOT.jar
```

#### Database Connection Errors
```cmd
# Test database connection
psql -U ehs_user -d ehs_elearning_production -c "SELECT 1;"

# Check PostgreSQL service
sc query postgresql-x64-15

# Verify environment variables
type C:\deployment\backend\.env | findstr DB_
```

### Frontend Issues

#### Nginx Won't Start
```cmd
# Check configuration
cd C:\nginx
nginx.exe -t

# Check port conflicts
netstat -ano | findstr :80
netstat -ano | findstr :443

# Check error logs
type C:\nginx\logs\error.log
```

#### Pages Not Loading
```cmd
# Verify frontend files exist
dir C:\deployment\frontend\

# Check if index.html exists
type C:\deployment\frontend\index.html

# Clear browser cache
# Try incognito/private mode
```

### Network Issues

#### Can't Access from Other Devices
```cmd
# Check Windows Firewall
netsh advfirewall firewall show rule name="EHS-HTTP"
netsh advfirewall firewall show rule name="EHS-HTTPS"

# Test local access first
curl http://localhost
curl https://localhost

# Check IP configuration
ipconfig
```

#### SSL Certificate Issues
```cmd
# Check certificate validity
openssl x509 -in C:\deployment\ssl\nginx.crt -text -noout

# Verify certificate matches key
openssl x509 -noout -modulus -in C:\deployment\ssl\nginx.crt | openssl md5
openssl rsa -noout -modulus -in C:\deployment\ssl\nginx.key | openssl md5
```

---

## Quick Reference Commands

### Start All Services
```cmd
# Start PostgreSQL (if not auto-start)
net start postgresql-x64-15

# Start Nginx
cd C:\nginx && nginx.exe

# Start Backend
net start EHS-Backend
# OR: cd C:\deployment\backend && java -jar EHS-0.0.1-SNAPSHOT.jar
```

### Stop All Services
```cmd
# Stop Backend
net stop EHS-Backend
# OR: Ctrl+C in backend terminal

# Stop Nginx
cd C:\nginx && nginx.exe -s stop

# Stop PostgreSQL (optional)
net stop postgresql-x64-15
```

### Quick Health Check
```cmd
# Check all services
tasklist | findstr nginx
tasklist | findstr java
sc query postgresql-x64-15

# Test connectivity
curl http://localhost:8080/actuator/health
curl http://192.168.222.216
```

### Emergency Rollback
```cmd
# Restore previous JAR
copy C:\deployment\backend\EHS-backup.jar C:\deployment\backend\EHS-0.0.1-SNAPSHOT.jar

# Restore previous frontend
del C:\deployment\frontend\* /q /s
xcopy C:\deployment\backups\frontend-backup\* C:\deployment\frontend\ /s /e /i

# Restart services
net restart EHS-Backend
cd C:\nginx && nginx.exe -s reload
```

---

## Post-Deployment Checklist

### Immediate Tasks (Within 10 minutes)
- [ ] Verify all services are running
- [ ] Test admin login
- [ ] Check dashboard loads properly
- [ ] Verify network access from other devices
- [ ] Test one core feature (e.g., user creation)

### Short-term Tasks (Within 1 hour)
- [ ] Test all major features
- [ ] Verify file uploads work
- [ ] Check email functionality
- [ ] Test course creation/management
- [ ] Verify reports generation

### Follow-up Tasks (Within 24 hours)
- [ ] Monitor application logs for errors
- [ ] Check system performance
- [ ] Verify automatic backups
- [ ] Update documentation if needed
- [ ] Notify users of any changes

---

## Support Information

### Log Locations
- **Backend Logs**: `C:\deployment\logs\backend-error.log`
- **Nginx Logs**: `C:\nginx\logs\error.log`
- **Nginx Access**: `C:\nginx\logs\access.log`

### Configuration Files
- **Backend Environment**: `C:\deployment\backend\.env`
- **Nginx Config**: `C:\nginx\conf\sites\ehs-clean.conf`
- **Main Nginx**: `C:\nginx\conf\nginx.conf`

### Access Information
- **Application URL**: `http://192.168.222.216` or `https://192.168.222.216`
- **Admin Login**: `admin` / `admin123` (change immediately)
- **Database**: `localhost:5432/ehs_elearning_production`

---

**📝 Remember**: Always test in a staging environment before production deployment!