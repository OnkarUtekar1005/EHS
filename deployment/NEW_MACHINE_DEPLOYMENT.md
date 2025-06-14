# Complete Deployment Guide: New Machine Setup

Deploy EHS E-Learning Platform to protecther.site on any new machine.

## Prerequisites Software Installation

### 1. Install Java 17+
```cmd
# Download from: https://adoptium.net/
# Or use Chocolatey:
choco install openjdk17
```

### 2. Install PostgreSQL
```cmd
# Download from: https://www.postgresql.org/download/windows/
# During installation:
# - Username: postgres
# - Password: root
# - Port: 5432
```

### 3. Install Node.js
```cmd
# Download from: https://nodejs.org/
# Or use Chocolatey:
choco install nodejs
```

### 4. Install Nginx
```cmd
# Download from: http://nginx.org/en/download.html
# Extract to: C:\nginx\
```

### 5. Install Git (if not installed)
```cmd
# Download from: https://git-scm.com/
# Or use Chocolatey:
choco install git
```

### 6. Install Maven
```cmd
# Download from: https://maven.apache.org/download.cgi
# Extract and add to PATH
# Or use Chocolatey:
choco install maven
```

## Step 1: Get Project Files

### Clone Repository
```cmd
# Navigate to desired location
cd C:\projects

# Clone the repository
git clone [YOUR_REPOSITORY_URL]
cd EHS
```

### Or Copy Project Manually
```cmd
# Copy entire EHS project folder to:
C:\projects\EHS\
```

## Step 2: Check Network Configuration

### Get Your Public IP Addresses
```cmd
# Check IPv4
curl -4 ifconfig.me

# Check IPv6  
curl -6 ifconfig.me

# Check local network
ipconfig /all
```

**Save these IP addresses - you'll need them for DNS configuration!**

## Step 3: Configure DNS (Hostinger)

**Login to Hostinger DNS Management and configure:**

### If You Have IPv4 Address:
```
Type: A
Name: @
Content: YOUR_IPv4_ADDRESS
TTL: 300

Type: A
Name: www  
Content: YOUR_IPv4_ADDRESS
TTL: 300
```

### If You Have IPv6 Address:
```
Type: AAAA
Name: @
Content: YOUR_IPv6_ADDRESS
TTL: 300

Type: AAAA
Name: www
Content: YOUR_IPv6_ADDRESS  
TTL: 300
```

### For Dual Stack (Both IPv4 and IPv6):
```
# Add both A and AAAA records above
```

**Wait 5-15 minutes for DNS propagation**

## Step 4: Create Directory Structure

```cmd
# Create main deployment directories
mkdir C:\deployment
mkdir C:\deployment\backend
mkdir C:\deployment\frontend
mkdir C:\deployment\ssl
mkdir C:\deployment\config

# Create nginx directories
cd C:\nginx
mkdir conf\sites
mkdir temp
mkdir temp\client_body_temp
mkdir temp\proxy_temp
mkdir temp\fastcgi_temp  
mkdir temp\uwsgi_temp
mkdir temp\scgi_temp
mkdir logs
```

## Step 5: Database Setup

### Start PostgreSQL
```cmd
net start postgresql-x64-14
```

### Create Database
```cmd
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE ehs_elearning;

# Exit
\q
```

## Step 6: Configure Environment

### Create Environment File
**Create: `C:\deployment\backend\.env`**
```env
# Database Configuration
DB_URL=jdbc:postgresql://localhost:5432/ehs_elearning
DB_USERNAME=postgres
DB_PASSWORD=root

# JWT Configuration (12 hours)
JWT_SECRET=f61f00dc9cd61dc7dea69139d781d470f75b8fce3f9e674a06e365afda09423fb0d39099c4b538fc81679dad1a3b3f58cd48ec216f39998bd1ecb5b1693aaf4ac3249644b1db30dbf3795abd3426e5fe5123d947c2853f322ceb21644dcb2cf3bedf2268b2d2586c4fb59ef695ee35521eb77dddc4e0dd5e39cdbba0993bfc0ce049254967ec2f047b3de2742d27348a6a819022d100d3b1237873e932728dc4e22c70c7bd7e1b1c69e59cf6e7906f74cd3ece866f6d83825deea666837b2cef7f64f38342ad0327e7f884b96f6aa59802faa9b5e3afc8897fc0a65313b7c03aaf2cb0702ff260c701e7c77e556aacfd68178f2edab1c80599cafc6c98b9f4b3
JWT_EXPIRATION=43200000
JWT_HEADER=Authorization
JWT_PREFIX=Bearer 

# Email Configuration
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=techview@gmail.com
MAIL_PASSWORD=your-gmail-app-password

# Google Drive Configuration  
GOOGLE_DRIVE_SERVICE_ACCOUNT_KEY_PATH=credentials/google-drive-service-account.json
GOOGLE_DRIVE_FOLDER_ID=your-folder-id
GOOGLE_DRIVE_APPLICATION_NAME=Protecther E-Learning Platform

# Frontend URL
FRONTEND_URL=https://protecther.site
```

## Step 7: SSL Certificate Generation

### Create SSL Config File
**Create: `C:\deployment\config\ssl-config.txt`**
```ini
[req]
distinguished_name = req_distinguished_name
req_extensions = v3_req
prompt = no

[req_distinguished_name]
C = IN
ST = India
L = Mumbai
O = Protecther E-Learning
OU = IT Department
CN = protecther.site

[v3_req]
basicConstraints = CA:FALSE
keyUsage = critical, digitalSignature, keyEncipherment, keyAgreement
extendedKeyUsage = critical, serverAuth
subjectAltName = @alt_names

[alt_names]
DNS.1 = protecther.site
DNS.2 = www.protecther.site
```

### Create SSL Generation Script
**Create: `C:\deployment\config\generate-ssl.bat`**
```batch
@echo off
echo Generating SSL certificate for protecther.site...

:: Create SSL directory
mkdir C:\deployment\ssl 2>nul

:: Remove old certificates
del C:\deployment\ssl\protecther.* 2>nul

:: Generate private key with correct parameters
openssl genrsa -out C:\deployment\ssl\protecther.key 2048

:: Generate certificate signing request
openssl req -new -key C:\deployment\ssl\protecther.key -out C:\deployment\ssl\protecther.csr -config ssl-config.txt

:: Generate self-signed certificate with proper extensions
openssl x509 -req -days 365 -in C:\deployment\ssl\protecther.csr -signkey C:\deployment\ssl\protecther.key -out C:\deployment\ssl\protecther.crt -extensions v3_req -extfile ssl-config.txt

:: Verify certificate
echo.
echo Verifying certificate...
openssl x509 -in C:\deployment\ssl\protecther.crt -text -noout | findstr "Key Usage"
openssl x509 -in C:\deployment\ssl\protecther.crt -text -noout | findstr "Extended Key Usage"

echo.
echo SSL certificate generated successfully!
echo Files created:
echo - C:\deployment\ssl\protecther.key
echo - C:\deployment\ssl\protecther.crt
echo.
echo Certificate details verified above.
pause
```

### Generate SSL Certificate
```cmd
cd C:\deployment\config
generate-ssl.bat
```

## Step 8: Configure Nginx

### Main Nginx Config
**Replace: `C:\nginx\conf\nginx.conf`**
```nginx
worker_processes  auto;
error_log  logs/error.log;
pid        logs/nginx.pid;

events {
    worker_connections  1024;
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
    
    # Include EHS configuration
    include sites/protecther.conf;
}
```

### Site Configuration
**Create: `C:\nginx\conf\sites\protecther.conf`**
```nginx
# HTTP to HTTPS redirect (IPv4 and IPv6)
server {
    listen 80;
    listen [::]:80;
    server_name protecther.site www.protecther.site;
    return 301 https://protecther.site$request_uri;
}

# HTTPS server for Protecther E-Learning Platform (IPv4 and IPv6)
server {
    listen 443 ssl;
    listen [::]:443 ssl;
    http2 on;
    server_name protecther.site www.protecther.site;
    
    # SSL Configuration
    ssl_certificate C:/deployment/ssl/protecther.crt;
    ssl_certificate_key C:/deployment/ssl/protecther.key;
    
    # SSL Settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    
    # Document root for frontend
    root C:/deployment/frontend;
    index index.html;
    
    # File upload size
    client_max_body_size 200M;
    
    # Frontend SPA routing
    location / {
        try_files $uri $uri/ /index.html;
        
        # Cache static files
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
    
    # API proxy to Spring Boot backend
    location /api/ {
        proxy_pass http://127.0.0.1:8080/api/;
        
        # Proxy headers
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Port $server_port;
        
        # CORS headers
        add_header Access-Control-Allow-Origin "https://protecther.site" always;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
        add_header Access-Control-Allow-Headers "Origin, X-Requested-With, Content-Type, Accept, Authorization" always;
        add_header Access-Control-Allow-Credentials true always;
        
        # Handle preflight OPTIONS requests
        if ($request_method = OPTIONS) {
            add_header Access-Control-Allow-Origin "https://protecther.site";
            add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS";
            add_header Access-Control-Allow-Headers "Origin, X-Requested-With, Content-Type, Accept, Authorization";
            add_header Access-Control-Allow-Credentials true;
            add_header Access-Control-Max-Age 3600;
            add_header Content-Length 0;
            add_header Content-Type text/plain;
            return 204;
        }
        
        # WebSocket support
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        proxy_buffering off;
    }
    
    # Health check
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
    
    # Security - deny hidden files
    location ~ /\. {
        deny all;
        access_log off;
        log_not_found off;
    }
}
```

## Step 9: Firewall Configuration

```cmd
# Open Command Prompt as Administrator

# Allow HTTP (port 80)
netsh advfirewall firewall add rule name="Allow HTTP" dir=in action=allow protocol=TCP localport=80

# Allow HTTPS (port 443)
netsh advfirewall firewall add rule name="Allow HTTPS" dir=in action=allow protocol=TCP localport=443

# Allow PostgreSQL (port 5432) - if needed
netsh advfirewall firewall add rule name="Allow PostgreSQL" dir=in action=allow protocol=TCP localport=5432
```

## Step 10: Build and Deploy Backend

```cmd
# Navigate to project
cd C:\projects\EHS\EHS

# Build backend
mvn clean package -DskipTests

# Copy JAR to deployment
copy target\EHS-0.0.1-SNAPSHOT.jar C:\deployment\backend\
```

## Step 11: Build and Deploy Frontend

```cmd
# Navigate to frontend
cd "C:\projects\EHS\Frontend yash\ehs-learning-platform"

# Install dependencies
npm install

# Build frontend
npm run build

# Copy to deployment
rmdir /s /q C:\deployment\frontend
xcopy build C:\deployment\frontend /s /e /i
```

## Step 12: Start Services

### Test Nginx Configuration
```cmd
cd C:\nginx
nginx.exe -t
```

### Start Backend
```cmd
cd C:\deployment\backend
java -jar EHS-0.0.1-SNAPSHOT.jar
```

### Start Nginx (in new command prompt)
```cmd
cd C:\nginx
nginx.exe
```

## Step 13: Test Deployment

### Test DNS Resolution
```cmd
nslookup protecther.site
```

### Test HTTPS Access
```cmd
curl -k https://protecther.site/health
```

### Test in Browser
1. Open: https://protecther.site
2. Accept SSL warning (for self-signed certificate)
3. Test login functionality

## Step 14: Create Admin User

### Connect to Database
```cmd
psql -U postgres -d ehs_elearning
```

### Create Admin User
```sql
INSERT INTO users (id, username, email, password, role, created_at, updated_at) 
VALUES (
  gen_random_uuid(),
  'admin',
  'admin@protecther.site',
  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- password: password
  'ADMIN',
  NOW(),
  NOW()
);
```

## Troubleshooting

### Issue: "This site can't be reached"
1. Check DNS: `nslookup protecther.site`
2. Check firewall rules
3. Verify public IP accessibility

### Issue: "SSL Certificate Error"
1. Regenerate certificate: `generate-ssl.bat`
2. Check certificate paths in nginx config
3. Restart nginx

### Issue: "502 Bad Gateway"
1. Check backend is running: `netstat -ano | findstr :8080`
2. Check backend logs
3. Verify nginx proxy configuration

### Issue: "Database Connection Error"
1. Check PostgreSQL is running: `net query postgresql-x64-14`
2. Verify database credentials in .env
3. Check database exists: `psql -U postgres -l`

## Success Checklist

- [ ] All software installed (Java, PostgreSQL, Node.js, Nginx, Maven)
- [ ] DNS records configured (A/AAAA records)
- [ ] Firewall ports opened (80, 443)
- [ ] SSL certificate generated
- [ ] Environment file configured
- [ ] Backend built and deployed
- [ ] Frontend built and deployed
- [ ] Nginx configured and running
- [ ] Backend service running
- [ ] Database created and accessible
- [ ] HTTPS site accessible
- [ ] Login functionality working
- [ ] Admin user created

---

**🎉 Your EHS E-Learning Platform should now be live at https://protecther.site!**

## Optional: Set Up Windows Services

For production, set up services for auto-start:

### Install NSSM (Non-Sucking Service Manager)
```cmd
# Download from: https://nssm.cc/download
# Extract to C:\nssm\
```

### Create Backend Service
```cmd
C:\nssm\nssm.exe install EHS-Backend "C:\Program Files\Java\jdk-17\bin\java.exe"
C:\nssm\nssm.exe set EHS-Backend Arguments "-jar C:\deployment\backend\EHS-0.0.1-SNAPSHOT.jar"
C:\nssm\nssm.exe set EHS-Backend AppDirectory "C:\deployment\backend"
C:\nssm\nssm.exe set EHS-Backend DisplayName "EHS E-Learning Backend"

net start EHS-Backend
```

### Create Nginx Service
```cmd
C:\nssm\nssm.exe install Nginx "C:\nginx\nginx.exe"
C:\nssm\nssm.exe set Nginx AppDirectory "C:\nginx"
C:\nssm\nssm.exe set Nginx DisplayName "Nginx Web Server"

net start Nginx
```