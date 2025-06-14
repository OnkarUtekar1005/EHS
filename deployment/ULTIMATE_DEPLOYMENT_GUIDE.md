# EHS E-Learning Platform - Ultimate Deployment Guide
**Complete guide for IP (192.168.222.216) and Domain deployment**

## Table of Contents
1. [Prerequisites](#part-1-prerequisites)
2. [Build Application](#part-2-build-application)
3. [Prepare Files](#part-3-prepare-files)
4. [Database Setup](#part-4-database-setup)
5. [IP-Based Deployment](#part-5-ip-based-deployment)
6. [Domain Setup (Optional)](#part-6-domain-setup-optional)
7. [SSL Certificates](#part-7-ssl-certificates)
8. [Services Setup](#part-8-services-setup)
9. [Verification](#part-9-verification)
10. [Maintenance](#part-10-maintenance)
11. [Troubleshooting](#part-11-troubleshooting)

---

## Part 1: Prerequisites on Deployment Machine

### 1.1 Install Java 17
```cmd
# Download from: https://adoptium.net/temurin/releases/
# Install Java 17 LTS (Windows x64 Installer)
# After installation, verify:
java -version

# Should show: openjdk version "17.x.x"
```

### 1.2 Install PostgreSQL
```cmd
# Download from: https://www.postgresql.org/download/windows/
# Install PostgreSQL 15+ (recommended: Latest stable)
# During installation:
# - Set password for 'postgres' user (REMEMBER THIS!)
# - Use default port: 5432
# - Install Stack Builder: No (uncheck)

# Verify installation:
psql --version
```

### 1.3 Install OpenSSL
```cmd
# Download from: https://slproweb.com/products/Win32OpenSSL.html
# Choose: Win64 OpenSSL v3.x.x (NOT Light version)
# Install to default location: C:\Program Files\OpenSSL-Win64

# Verify installation:
"C:\Program Files\OpenSSL-Win64\bin\openssl.exe" version
```

### 1.4 Install Nginx
```cmd
# Method 1: Direct Download (Recommended)
# Go to: http://nginx.org/en/download.html
# Download: nginx/Windows (stable version)
# Extract to: C:\nginx

# Method 2: Using Chocolatey
# First install Chocolatey, then:
choco install nginx

# Verify installation:
cd C:\nginx
nginx.exe -v
```

### 1.5 Install NSSM (Windows Service Manager)
```cmd
# Download from: https://nssm.cc/download
# Extract nssm.exe to: C:\nssm\
# This allows running apps as Windows services
```

---

## Part 2: Build Application

### 2.1 Backend Build
```cmd
# Navigate to backend directory
cd "path\to\EHS\EHS"

# Clean and build
mvn clean package -DskipTests

# Result: target/EHS-0.0.1-SNAPSHOT.jar
```

### 2.2 Frontend Build
```cmd
# Navigate to frontend directory
cd "path\to\Frontend yash\ehs-learning-platform"

# Install dependencies (if not done)
npm install

# Build production version
npm run build

# Result: build/ folder with all static files
```

---

## Part 3: Prepare Files

### 3.1 Create Deployment Package
Create folder structure on deployment machine:
```
C:\deployment\
├── backend\
│   └── EHS-0.0.1-SNAPSHOT.jar
├── frontend\
│   ├── index.html
│   ├── static\
│   │   ├── css\
│   │   ├── js\
│   │   └── media\
│   └── [all other build files]
├── configs\
│   ├── .env
│   ├── server.conf
│   ├── ehs-ip.conf
│   └── ehs-domain.conf
├── credentials\
│   └── google-drive-service-account.json
├── ssl\
│   └── [SSL certificates will be generated here]
└── uploads\
    └── [File uploads will be stored here]
```

### 3.2 Copy Files
**From your build:**
- Copy `target/EHS-0.0.1-SNAPSHOT.jar` → `C:\deployment\backend\`
- Copy all `build/*` files → `C:\deployment\frontend\`
- Copy Google Drive JSON → `C:\deployment\credentials\`

---

## Part 4: Database Setup

### 4.1 Create Database and User
```cmd
# Open Command Prompt as Administrator
# Connect to PostgreSQL
psql -U postgres

# In PostgreSQL shell, run these commands:
```

```sql
-- Create database
CREATE DATABASE ehs_elearning_production;

-- Create dedicated user
CREATE USER ehs_user WITH PASSWORD 'EHS@2025!Secure';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE ehs_elearning_production TO ehs_user;

-- Grant schema privileges
\c ehs_elearning_production
GRANT ALL PRIVILEGES ON SCHEMA public TO ehs_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO ehs_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO ehs_user;

-- Exit
\q
```

### 4.2 Test Database Connection
```cmd
# Test connection
psql -U ehs_user -d ehs_elearning_production -h localhost

# Should connect successfully, then exit:
\q
```

---

## Part 5: IP-Based Deployment

### 5.1 Create Environment Configuration
Create `C:\deployment\configs\.env`:

```bash
# Database Configuration
DB_URL=jdbc:postgresql://localhost:5432/ehs_elearning_production
DB_USERNAME=ehs_user
DB_PASSWORD=EHS@2025!Secure

# JWT Configuration (12 hours)
JWT_SECRET=f61f00dc9cd61dc7dea69139d781d470f75b8fce3f9e674a06e365afda09423fb0d39099c4b538fc81679dad1a3b3f58cd48ec216f39998bd1ecb5b1693aaf4ac3249644b1db30dbf3795abd3426e5fe5123d947c2853f322ceb21644dcb2cf3bedf2268b2d2586c4fb59ef695ee35521eb77dddc4e0dd5e39cdbba0993bfc0ce049254967ec2f047b3de2742d27348a6a819022d100d3b1237873e932728dc4e22c70c7bd7e1b1c69e59cf6e7906f74cd3ece866f6d83825deea666837b2cef7f64f38342ad0327e7f884b96f6aa59802faa9b5e3afc8897fc0a65313b7c03aaf2cb0702ff260c701e7c77e556aacfd68178f2edab1c80599cafc6c98b9f4b3
JWT_EXPIRATION=43200000
JWT_HEADER=Authorization
JWT_PREFIX=Bearer 

# Email Configuration
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password

# Google Drive Configuration
GOOGLE_DRIVE_SERVICE_ACCOUNT_KEY_PATH=credentials/google-drive-service-account.json
GOOGLE_DRIVE_FOLDER_ID=your-folder-id
GOOGLE_DRIVE_APPLICATION_NAME=EHS E-Learning Platform

# Frontend URL (will be updated for domain later)
FRONTEND_URL=https://192.168.222.216
```

### 5.2 Create SSL Certificate Configuration
Create `C:\deployment\configs\server.conf`:

```ini
[req]
distinguished_name = req_distinguished_name
req_extensions = v3_req
prompt = no

[req_distinguished_name]
C=US
ST=State
L=City
O=EHS Learning Platform
OU=IT Department
CN=192.168.222.216

[v3_req]
keyUsage = keyEncipherment, dataEncipherment
extendedKeyUsage = serverAuth
subjectAltName = @alt_names

[alt_names]
DNS.1 = localhost
DNS.2 = ehs-learning.local
IP.1 = 192.168.222.216
IP.2 = 127.0.0.1
```

### 5.3 Create Nginx Configuration for IP
Create `C:\deployment\configs\ehs-ip.conf`:

```nginx
# HTTP to HTTPS redirect
server {
    listen 80;
    server_name 192.168.222.216 localhost;
    return 301 https://$server_name$request_uri;
}

# HTTPS server for EHS frontend
server {
    listen 443 ssl http2;
    server_name 192.168.222.216 localhost;
    
    # SSL Configuration
    ssl_certificate C:/deployment/ssl/nginx.crt;
    ssl_certificate_key C:/deployment/ssl/nginx.key;
    
    # SSL Settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES128-SHA256:ECDHE-RSA-AES256-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    
    # Document root
    root C:/deployment/frontend;
    index index.html;
    
    # File upload size
    client_max_body_size 200M;
    
    # Frontend routing (SPA)
    location / {
        try_files $uri $uri/ /index.html;
        
        # Cache control for HTML files
        location ~* \.html$ {
            add_header Cache-Control "no-cache, no-store, must-revalidate";
            add_header Pragma "no-cache";
            add_header Expires "0";
        }
    }
    
    # API proxy to backend
    location /api/ {
        proxy_pass http://127.0.0.1:8080/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Port $server_port;
        
        # CORS headers
        add_header Access-Control-Allow-Origin "https://192.168.222.216" always;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
        add_header Access-Control-Allow-Headers "Origin, X-Requested-With, Content-Type, Accept, Authorization" always;
        add_header Access-Control-Allow-Credentials true always;
        
        # Handle preflight requests
        if ($request_method = OPTIONS) {
            add_header Access-Control-Allow-Origin "https://192.168.222.216";
            add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS";
            add_header Access-Control-Allow-Headers "Origin, X-Requested-With, Content-Type, Accept, Authorization";
            add_header Access-Control-Allow-Credentials true;
            add_header Content-Length 0;
            add_header Content-Type text/plain;
            return 204;
        }
        
        # WebSocket support
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        
        # Timeouts
        proxy_connect_timeout 30s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
        
        # Buffer settings
        proxy_buffering on;
        proxy_buffer_size 128k;
        proxy_buffers 4 256k;
        proxy_busy_buffers_size 256k;
    }
    
    # Static file caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        add_header Vary "Accept-Encoding";
    }
    
    # Service worker
    location /service-worker.js {
        add_header Cache-Control "no-cache";
        expires off;
    }
    
    # Security - deny hidden files
    location ~ /\. {
        deny all;
        access_log off;
        log_not_found off;
    }
}
```

### 5.4 Setup Nginx for IP-Based Access

#### Create Nginx Directory Structure
```cmd
# Navigate to nginx directory
cd C:\nginx

# Create required directories
mkdir logs
mkdir conf\sites
mkdir temp
mkdir temp\client_body_temp
mkdir temp\proxy_temp
mkdir temp\fastcgi_temp
mkdir temp\uwsgi_temp
mkdir temp\scgi_temp

# Create SSL directory in deployment
mkdir C:\deployment\ssl
```

#### Update Main Nginx Configuration
Edit `C:\nginx\conf\nginx.conf`:

```nginx
worker_processes  auto;

events {
    worker_connections  1024;
    use select;
}

http {
    include       mime.types;
    default_type  application/octet-stream;
    
    # Logging
    access_log  logs/access.log;
    error_log   logs/error.log;
    
    # Basic settings
    sendfile        on;
    tcp_nopush      on;
    tcp_nodelay     on;
    keepalive_timeout  65;
    client_max_body_size 200M;
    
    # Temp directories
    client_body_temp_path temp/client_body_temp;
    proxy_temp_path temp/proxy_temp;
    fastcgi_temp_path temp/fastcgi_temp;
    uwsgi_temp_path temp/uwsgi_temp;
    scgi_temp_path temp/scgi_temp;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
    
    # Include site configurations
    include sites/*.conf;
}
```

#### Copy Configuration
```cmd
# Copy IP-based configuration
copy C:\deployment\configs\ehs-ip.conf C:\nginx\conf\sites\
```

### 5.5 Generate SSL Certificate for IP
```cmd
# Navigate to OpenSSL directory
cd "C:\Program Files\OpenSSL-Win64\bin"

# Generate private key
openssl genrsa -out C:\deployment\ssl\nginx.key 2048

# Generate certificate request
openssl req -new -key C:\deployment\ssl\nginx.key -out C:\deployment\ssl\nginx.csr -config C:\deployment\configs\server.conf

# Generate self-signed certificate
openssl x509 -req -days 365 -in C:\deployment\ssl\nginx.csr -signkey C:\deployment\ssl\nginx.key -out C:\deployment\ssl\nginx.crt -extensions v3_req -extfile C:\deployment\configs\server.conf
```

### 5.6 Configure Windows Firewall
```cmd
# Run Command Prompt as Administrator

# Allow HTTP traffic
netsh advfirewall firewall add rule name="EHS-HTTP" dir=in action=allow protocol=TCP localport=80

# Allow HTTPS traffic  
netsh advfirewall firewall add rule name="EHS-HTTPS" dir=in action=allow protocol=TCP localport=443

# Allow backend traffic (optional)
netsh advfirewall firewall add rule name="EHS-Backend" dir=in action=allow protocol=TCP localport=8080

# Verify rules
netsh advfirewall firewall show rule name="EHS-HTTPS"
```

### 5.7 Test IP-Based Setup
```cmd
# Test nginx configuration
cd C:\nginx
nginx.exe -t

# Start nginx
nginx.exe

# Copy environment file
copy C:\deployment\configs\.env C:\deployment\backend\

# Test backend
cd C:\deployment\backend
java -jar EHS-0.0.1-SNAPSHOT.jar

# In another terminal, test:
curl -k https://192.168.222.216
```

---

## Part 6: Domain Setup (Optional)

### 6.1 Domain Requirements
Before proceeding, ensure you have:
- A registered domain name (e.g., `ehslearning.com`)
- Access to domain DNS settings
- Public IP address or dynamic DNS service

### 6.2 DNS Configuration

#### Option A: Direct Public IP
If you have a static public IP:
```
A Record: @ → Your Public IP
A Record: www → Your Public IP
```

#### Option B: Dynamic DNS (Recommended for Home/Office)
Use services like:
- **No-IP**: https://www.noip.com/
- **DuckDNS**: https://www.duckdns.org/
- **Cloudflare**: https://www.cloudflare.com/

Example with No-IP:
1. Create account and choose hostname: `ehslearning.ddns.net`
2. Install No-IP DUC client on deployment machine
3. Configure automatic IP updates

### 6.3 Router Configuration
```
Port Forwarding Rules:
- External Port 80 → Internal 192.168.222.216:80
- External Port 443 → Internal 192.168.222.216:443
```

### 6.4 Create Domain-Specific Configuration

#### Update Environment for Domain
Create `C:\deployment\configs\.env-domain`:

```bash
# Database Configuration (same as IP version)
DB_URL=jdbc:postgresql://localhost:5432/ehs_elearning_production
DB_USERNAME=ehs_user
DB_PASSWORD=EHS@2025!Secure

# JWT Configuration (same as IP version)
JWT_SECRET=f61f00dc9cd61dc7dea69139d781d470f75b8fce3f9e674a06e365afda09423fb0d39099c4b538fc81679dad1a3b3f58cd48ec216f39998bd1ecb5b1693aaf4ac3249644b1db30dbf3795abd3426e5fe5123d947c2853f322ceb21644dcb2cf3bedf2268b2d2586c4fb59ef695ee35521eb77dddc4e0dd5e39cdbba0993bfc0ce049254967ec2f047b3de2742d27348a6a819022d100d3b1237873e932728dc4e22c70c7bd7e1b1c69e59cf6e7906f74cd3ece866f6d83825deea666837b2cef7f64f38342ad0327e7f884b96f6aa59802faa9b5e3afc8897fc0a65313b7c03aaf2cb0702ff260c701e7c77e556aacfd68178f2edab1c80599cafc6c98b9f4b3
JWT_EXPIRATION=43200000
JWT_HEADER=Authorization
JWT_PREFIX=Bearer 

# Email Configuration (same as IP version)
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password

# Google Drive Configuration (same as IP version)
GOOGLE_DRIVE_SERVICE_ACCOUNT_KEY_PATH=credentials/google-drive-service-account.json
GOOGLE_DRIVE_FOLDER_ID=your-folder-id
GOOGLE_DRIVE_APPLICATION_NAME=EHS E-Learning Platform

# Frontend URL - UPDATED FOR DOMAIN
FRONTEND_URL=https://ehslearning.ddns.net
```

#### Create Domain-Specific Nginx Configuration
Create `C:\deployment\configs\ehs-domain.conf`:

```nginx
# HTTP to HTTPS redirect
server {
    listen 80;
    server_name ehslearning.ddns.net www.ehslearning.ddns.net;
    return 301 https://ehslearning.ddns.net$request_uri;
}

# HTTPS server for EHS frontend
server {
    listen 443 ssl http2;
    server_name ehslearning.ddns.net www.ehslearning.ddns.net;
    
    # SSL Configuration (Let's Encrypt certificates)
    ssl_certificate C:/deployment/ssl/domain/fullchain.pem;
    ssl_certificate_key C:/deployment/ssl/domain/privkey.pem;
    
    # SSL Settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES128-SHA256:ECDHE-RSA-AES256-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # OCSP Stapling
    ssl_stapling on;
    ssl_stapling_verify on;
    ssl_trusted_certificate C:/deployment/ssl/domain/chain.pem;
    
    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self';" always;
    
    # Document root
    root C:/deployment/frontend;
    index index.html;
    
    # File upload size
    client_max_body_size 200M;
    
    # Frontend routing (SPA)
    location / {
        try_files $uri $uri/ /index.html;
        
        # Cache control for HTML files
        location ~* \.html$ {
            add_header Cache-Control "no-cache, no-store, must-revalidate";
            add_header Pragma "no-cache";
            add_header Expires "0";
        }
    }
    
    # API proxy to backend
    location /api/ {
        proxy_pass http://127.0.0.1:8080/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Port $server_port;
        
        # CORS headers for domain
        add_header Access-Control-Allow-Origin "https://ehslearning.ddns.net" always;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
        add_header Access-Control-Allow-Headers "Origin, X-Requested-With, Content-Type, Accept, Authorization" always;
        add_header Access-Control-Allow-Credentials true always;
        
        # Handle preflight requests
        if ($request_method = OPTIONS) {
            add_header Access-Control-Allow-Origin "https://ehslearning.ddns.net";
            add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS";
            add_header Access-Control-Allow-Headers "Origin, X-Requested-With, Content-Type, Accept, Authorization";
            add_header Access-Control-Allow-Credentials true;
            add_header Content-Length 0;
            add_header Content-Type text/plain;
            return 204;
        }
        
        # WebSocket support
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        
        # Timeouts
        proxy_connect_timeout 30s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
        
        # Buffer settings
        proxy_buffering on;
        proxy_buffer_size 128k;
        proxy_buffers 4 256k;
        proxy_busy_buffers_size 256k;
    }
    
    # Static file caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        add_header Vary "Accept-Encoding";
    }
    
    # Service worker
    location /service-worker.js {
        add_header Cache-Control "no-cache";
        expires off;
    }
    
    # Security - deny hidden files
    location ~ /\. {
        deny all;
        access_log off;
        log_not_found off;
    }
}
```

---

## Part 7: SSL Certificates

### 7.1 For IP-Based Access (Self-Signed)
Already covered in Part 5.5

### 7.2 For Domain-Based Access (Let's Encrypt)

#### Install win-acme
```cmd
# Download from: https://www.win-acme.com/
# Extract to: C:\win-acme\
```

#### Generate Let's Encrypt Certificate
```cmd
# Run as Administrator
cd C:\win-acme

# Run win-acme
wacs.exe

# Follow these options:
# - Select: N (Create certificate)
# - Select: 1 (Single binding)
# - Enter domain: ehslearning.ddns.net
# - Select validation method: 1 (File system)
# - Web root path: C:\deployment\frontend
# - Select store: 1 (Certificate store)
# - Select installation: 5 (No (additional) store steps)
```

#### Configure win-acme for Nginx
Create `C:\win-acme\Scripts\ImportEHS.ps1`:

```powershell
param($CertThumbprint, $CertFriendlyName)

# Create SSL directory for domain certificates
$sslDir = "C:\deployment\ssl\domain"
if (!(Test-Path $sslDir)) {
    New-Item -ItemType Directory -Path $sslDir -Force
}

# Export certificate files for nginx
$cert = Get-ChildItem -Path Cert:\LocalMachine\My\ | Where-Object {$_.Thumbprint -eq $CertThumbprint}

if ($cert) {
    # Export certificate
    $certPath = "$sslDir\fullchain.pem"
    $cert | Export-Certificate -FilePath "$sslDir\cert.crt" -Type CERT
    
    # Convert to PEM format (requires openssl)
    & "C:\Program Files\OpenSSL-Win64\bin\openssl.exe" x509 -inform DER -in "$sslDir\cert.crt" -out $certPath
    
    # Export private key (this is complex for Let's Encrypt certificates)
    # Use win-acme's built-in PEM export instead
    Write-Host "Certificate exported for nginx"
} else {
    Write-Host "Certificate not found"
}

# Reload nginx
try {
    & "C:\nginx\nginx.exe" -s reload
    Write-Host "Nginx reloaded successfully"
} catch {
    Write-Host "Failed to reload nginx: $_"
}
```

#### Alternative: Manual Certificate Export
```cmd
# After win-acme generates certificate, find it in certificate store
# Run this PowerShell script to export for nginx:

# Find the certificate
$cert = Get-ChildItem -Path Cert:\LocalMachine\My\ | Where-Object {$_.Subject -like "*ehslearning.ddns.net*"}

# Create directory
New-Item -ItemType Directory -Path "C:\deployment\ssl\domain" -Force

# Export certificate (manual process - requires additional tools)
# Alternatively, use win-acme PEM export plugin
```

#### Use win-acme PEM Export (Recommended)
```cmd
# Re-run win-acme and select:
# - M (Manage certificates)
# - Select your certificate
# - Choose: Change installation steps
# - Add: PEM files installation step
# - Set path: C:\deployment\ssl\domain\
# - Save configuration
```

---

## Part 8: Services Setup

### 8.1 Create Backend Service
```cmd
# Run as Administrator
cd C:\nssm

# Install EHS Backend service
nssm.exe install EHS-Backend "C:\Program Files\Eclipse Adoptium\jdk-17.0.9.9-hotspot\bin\java.exe"
nssm.exe set EHS-Backend AppParameters "-jar C:\deployment\backend\EHS-0.0.1-SNAPSHOT.jar"
nssm.exe set EHS-Backend AppDirectory "C:\deployment\backend"
nssm.exe set EHS-Backend DisplayName "EHS E-Learning Backend"
nssm.exe set EHS-Backend Description "EHS E-Learning Platform Backend Service"
nssm.exe set EHS-Backend Start SERVICE_AUTO_START

# Configure logging
nssm.exe set EHS-Backend AppStdout "C:\deployment\logs\backend-output.log"
nssm.exe set EHS-Backend AppStderr "C:\deployment\logs\backend-error.log"

# Create logs directory
mkdir C:\deployment\logs

# Start the service
nssm.exe start EHS-Backend
```

### 8.2 Create Nginx Service
```cmd
# Run as Administrator
cd C:\nssm

# Install EHS Nginx service
nssm.exe install EHS-Nginx "C:\nginx\nginx.exe"
nssm.exe set EHS-Nginx AppDirectory "C:\nginx"
nssm.exe set EHS-Nginx DisplayName "EHS Nginx Server"
nssm.exe set EHS-Nginx Description "EHS E-Learning Platform Web Server"
nssm.exe set EHS-Nginx Start SERVICE_AUTO_START

# Start the service
nssm.exe start EHS-Nginx
```

### 8.3 Service Management Commands
```cmd
# Check service status
sc query EHS-Backend
sc query EHS-Nginx

# Start services
net start EHS-Backend
net start EHS-Nginx

# Stop services
net stop EHS-Backend
net stop EHS-Nginx

# Restart services
nssm.exe restart EHS-Backend
nssm.exe restart EHS-Nginx
```

---

## Part 9: Verification

### 9.1 Service Verification
```cmd
# Check if services are running
tasklist | findstr java
tasklist | findstr nginx

# Check service status
sc query EHS-Backend
sc query EHS-Nginx
```

### 9.2 Network Verification
```cmd
# Check listening ports
netstat -ano | findstr :80
netstat -ano | findstr :443
netstat -ano | findstr :8080

# Test local connectivity
curl -k https://192.168.222.216
curl -k https://localhost
```

### 9.3 Database Verification
```cmd
# Test database connection
psql -U ehs_user -d ehs_elearning_production -c "SELECT 1;"

# Check if tables are created
psql -U ehs_user -d ehs_elearning_production -c "\dt"
```

### 9.4 Application Verification
```cmd
# Test backend health
curl http://localhost:8080/actuator/health

# Test frontend (IP-based)
curl -k https://192.168.222.216

# Test frontend (domain-based, if configured)
curl -k https://ehslearning.ddns.net
```

### 9.5 Browser Testing
1. **IP-based access**: Navigate to `https://192.168.222.216`
2. **Domain-based access**: Navigate to `https://ehslearning.ddns.net`
3. Accept SSL warnings for self-signed certificates
4. Verify login page appears
5. Test login functionality

---

## Part 10: Initial Setup and Admin User

### 10.1 Create Admin User
```cmd
# Connect to database
psql -U ehs_user -d ehs_elearning_production
```

```sql
-- Wait for application to create tables, then insert admin user
-- Check if tables exist first
\dt

-- Insert admin user (password: admin123)
INSERT INTO users (id, username, password, email, first_name, last_name, user_type, created_at, updated_at) 
VALUES (
    gen_random_uuid(), 
    'admin', 
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 
    'admin@ehslearning.com', 
    'System', 
    'Administrator', 
    'ADMIN', 
    NOW(), 
    NOW()
);

-- Verify user creation
SELECT username, email, user_type FROM users WHERE username = 'admin';

-- Exit
\q
```

### 10.2 First Login
1. Navigate to your application URL
2. Login with:
   - **Username**: `admin`
   - **Password**: `admin123`
3. **IMMEDIATELY** change the password
4. Configure additional settings as needed

---

## Part 11: Switching Between IP and Domain

### 11.1 Switch to Domain Configuration
```cmd
# Stop services
net stop EHS-Backend
net stop EHS-Nginx

# Update environment file
copy C:\deployment\configs\.env-domain C:\deployment\backend\.env

# Update nginx configuration
copy C:\deployment\configs\ehs-domain.conf C:\nginx\conf\sites\ehs-production.conf

# Ensure domain SSL certificates are in place
# (Should be done via win-acme)

# Test nginx configuration
cd C:\nginx
nginx.exe -t

# Start services
net start EHS-Nginx
net start EHS-Backend
```

### 11.2 Switch Back to IP Configuration
```cmd
# Stop services
net stop EHS-Backend
net stop EHS-Nginx

# Update environment file
copy C:\deployment\configs\.env C:\deployment\backend\.env

# Update nginx configuration
copy C:\deployment\configs\ehs-ip.conf C:\nginx\conf\sites\ehs-production.conf

# Test nginx configuration
cd C:\nginx
nginx.exe -t

# Start services
net start EHS-Nginx
net start EHS-Backend
```

---

## Part 12: Maintenance

### 12.1 Daily Tasks
```cmd
# Check service status
sc query EHS-Backend
sc query EHS-Nginx

# Check disk space
dir C:\deployment\uploads
```

### 12.2 Weekly Tasks
```cmd
# Backup database
pg_dump -U ehs_user -d ehs_elearning_production > C:\deployment\backups\backup_%date%.sql

# Check logs for errors
type C:\deployment\logs\backend-error.log | findstr ERROR
type C:\nginx\logs\error.log
```

### 12.3 Monthly Tasks
```cmd
# Check SSL certificate expiry
openssl x509 -in C:\deployment\ssl\nginx.crt -text -noout | findstr "Not After"

# Update system
# Check for Windows updates
# Check for Java updates
```

### 12.4 Certificate Renewal (Let's Encrypt)
```cmd
# win-acme automatically renews certificates
# Check renewal status:
cd C:\win-acme
wacs.exe --list

# Manual renewal if needed:
wacs.exe --renew --id [certificate-id]
```

---

## Part 13: Troubleshooting

### 13.1 Backend Issues

#### Service Won't Start
```cmd
# Check Java installation
java -version

# Check if port is in use
netstat -ano | findstr :8080

# Check service logs
type C:\deployment\logs\backend-error.log

# Manual start for debugging
cd C:\deployment\backend
java -jar EHS-0.0.1-SNAPSHOT.jar
```

#### Database Connection Errors
```cmd
# Test database connectivity
psql -U ehs_user -d ehs_elearning_production

# Check PostgreSQL service
sc query postgresql-x64-15

# Check database configuration in .env file
type C:\deployment\backend\.env
```

### 13.2 Nginx Issues

#### Configuration Errors
```cmd
# Test nginx configuration
cd C:\nginx
nginx.exe -t

# Check nginx logs
type logs\error.log

# Check if port 80/443 are in use
netstat -ano | findstr :80
netstat -ano | findstr :443
```

#### SSL Certificate Issues
```cmd
# Verify certificate files exist
dir C:\deployment\ssl\
dir C:\deployment\ssl\domain\

# Test certificate validity
openssl x509 -in C:\deployment\ssl\nginx.crt -text -noout

# Check certificate-key pair match
openssl x509 -noout -modulus -in C:\deployment\ssl\nginx.crt | openssl md5
openssl rsa -noout -modulus -in C:\deployment\ssl\nginx.key | openssl md5
```

### 13.3 Network Issues

#### Can't Access from External Devices
```cmd
# Check Windows Firewall
netsh advfirewall firewall show rule name="EHS-HTTPS"

# Test local access
curl -k https://localhost

# Check router port forwarding (for domain access)
# Verify DNS resolution
nslookup ehslearning.ddns.net
```

#### CORS Errors
```cmd
# Check backend CORS configuration
# Verify FRONTEND_URL in .env matches actual access URL
type C:\deployment\backend\.env | findstr FRONTEND_URL

# Check nginx CORS headers in configuration
type C:\nginx\conf\sites\ehs-production.conf | findstr Access-Control
```

### 13.4 Performance Issues

#### High Memory Usage
```cmd
# Check Java heap usage
# Add to service configuration:
# -Xmx2g -Xms512m

# Update service with memory limits
nssm.exe set EHS-Backend AppParameters "-Xmx2g -Xms512m -jar C:\deployment\backend\EHS-0.0.1-SNAPSHOT.jar"
nssm.exe restart EHS-Backend
```

#### Slow Database Queries
```sql
-- Connect to database and check slow queries
psql -U ehs_user -d ehs_elearning_production

-- Enable query logging (temporarily)
ALTER SYSTEM SET log_statement = 'all';
SELECT pg_reload_conf();

-- Check database size
SELECT pg_size_pretty(pg_database_size('ehs_elearning_production'));

-- Check table sizes
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

---

## Part 14: Security Considerations

### 14.1 Change Default Passwords
```cmd
# Change database password
psql -U postgres
ALTER USER ehs_user PASSWORD 'NewSecurePassword2025!';

# Update .env file with new password
# Restart backend service
```

### 14.2 Enable Additional Security

#### Windows Firewall Rules
```cmd
# Allow only specific IP ranges (example: only local network)
netsh advfirewall firewall set rule name="EHS-HTTPS" new remoteip=192.168.0.0/16,10.0.0.0/8,172.16.0.0/12

# Block specific IPs if needed
netsh advfirewall firewall add rule name="Block-IP" dir=in action=block remoteip=x.x.x.x
```

#### Nginx Security
Add to nginx configuration:
```nginx
# Rate limiting
limit_req_zone $binary_remote_addr zone=login:10m rate=5r/m;
limit_req_zone $binary_remote_addr zone=api:10m rate=30r/m;

# Apply limits
location /api/auth/ {
    limit_req zone=login burst=3 nodelay;
    # ... rest of config
}

location /api/ {
    limit_req zone=api burst=10 nodelay;
    # ... rest of config
}
```

### 14.3 Backup Strategy
```cmd
# Create backup script: C:\deployment\scripts\backup.bat
@echo off
set backup_dir=C:\deployment\backups\%date:~-4,4%-%date:~-10,2%-%date:~-7,2%
mkdir "%backup_dir%"

:: Database backup
pg_dump -U ehs_user -d ehs_elearning_production > "%backup_dir%\database.sql"

:: Files backup
xcopy "C:\deployment\uploads" "%backup_dir%\uploads\" /s /e /i

:: Configuration backup
xcopy "C:\deployment\configs" "%backup_dir%\configs\" /s /e /i

echo Backup completed: %backup_dir%
```

---

## Part 15: Quick Reference

### 15.1 Service Commands
```cmd
# Start all services
net start EHS-Backend
net start EHS-Nginx

# Stop all services
net stop EHS-Backend
net stop EHS-Nginx

# Restart all services
nssm.exe restart EHS-Backend
nssm.exe restart EHS-Nginx
```

### 15.2 Configuration Files
```
C:\deployment\configs\.env              # IP-based environment
C:\deployment\configs\.env-domain       # Domain-based environment
C:\deployment\configs\ehs-ip.conf       # IP-based nginx config
C:\deployment\configs\ehs-domain.conf   # Domain-based nginx config
C:\nginx\conf\nginx.conf                # Main nginx configuration
```

### 15.3 Log Files
```
C:\deployment\logs\backend-output.log   # Backend application logs
C:\deployment\logs\backend-error.log    # Backend error logs
C:\nginx\logs\access.log                # Nginx access logs
C:\nginx\logs\error.log                 # Nginx error logs
```

### 15.4 Access URLs

#### IP-Based Access:
- **Frontend**: `https://192.168.222.216`
- **Backend API**: `https://192.168.222.216/api/`
- **Health Check**: `http://192.168.222.216:8080/actuator/health`

#### Domain-Based Access:
- **Frontend**: `https://ehslearning.ddns.net`
- **Backend API**: `https://ehslearning.ddns.net/api/`

---

## Part 16: Final Checklist

### 16.1 Pre-Deployment Checklist
- [ ] Java 17 installed and verified
- [ ] PostgreSQL installed and running
- [ ] OpenSSL installed
- [ ] Nginx installed and configured
- [ ] NSSM installed for services
- [ ] Backend JAR file built and copied
- [ ] Frontend files built and copied
- [ ] Google Drive credentials copied
- [ ] Environment files configured
- [ ] Windows Firewall configured

### 16.2 IP-Based Deployment Checklist
- [ ] SSL certificates generated for IP
- [ ] Nginx configuration copied and tested
- [ ] Database created and configured
- [ ] Backend service installed and running
- [ ] Nginx service installed and running
- [ ] Admin user created in database
- [ ] Local access verified
- [ ] Network access verified

### 16.3 Domain-Based Deployment Checklist
- [ ] Domain DNS configured
- [ ] Router port forwarding configured
- [ ] Let's Encrypt certificates obtained
- [ ] Domain-specific nginx configuration deployed
- [ ] Domain-specific environment variables deployed
- [ ] Services restarted with domain configuration
- [ ] External access verified
- [ ] SSL certificate auto-renewal configured

### 16.4 Post-Deployment Checklist
- [ ] Default admin password changed
- [ ] Email configuration tested
- [ ] File upload functionality tested
- [ ] Course creation tested
- [ ] User registration tested
- [ ] Certificate generation tested
- [ ] Backup procedures documented
- [ ] Monitoring procedures documented

---

**🎯 DEPLOYMENT COMPLETE!**

Your EHS E-Learning Platform is now ready for production use.

**Access Information:**
- **IP-based**: `https://192.168.222.216`
- **Domain-based**: `https://ehslearning.ddns.net` (if configured)
- **Admin Login**: `admin` / `admin123` (change immediately)

**Support:** Keep this guide for maintenance and troubleshooting.