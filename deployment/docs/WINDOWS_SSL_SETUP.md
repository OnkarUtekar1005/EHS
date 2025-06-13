# Windows Nginx SSL Setup Guide

## Overview
This guide covers SSL certificate setup for nginx on Windows for the EHS E-Learning Platform.

## Option 1: Self-Signed Certificate (Development/Testing)

### Step 1: Create SSL Directory
```cmd
# Create SSL directory in nginx folder
mkdir C:\nginx\ssl
cd C:\nginx\ssl
```

### Step 2: Generate Self-Signed Certificate

#### Using OpenSSL (Recommended)
**Install OpenSSL for Windows:**
1. Download from: https://slproweb.com/products/Win32OpenSSL.html
2. Install to default location: `C:\Program Files\OpenSSL-Win64`

**Generate Certificate:**
```cmd
# Navigate to OpenSSL bin directory
cd "C:\Program Files\OpenSSL-Win64\bin"

# Generate private key
openssl genrsa -out C:\nginx\ssl\nginx.key 2048

# Generate certificate signing request
openssl req -new -key C:\nginx\ssl\nginx.key -out C:\nginx\ssl\nginx.csr

# Generate self-signed certificate (valid for 365 days)
openssl x509 -req -days 365 -in C:\nginx\ssl\nginx.csr -signkey C:\nginx\ssl\nginx.key -out C:\nginx\ssl\nginx.crt
```

**When prompted, enter:**
- Country Name: `US`
- State: `Your State`
- City: `Your City`
- Organization: `EHS Learning`
- Organizational Unit: `IT`
- Common Name: `localhost` (or your server IP)
- Email: `your-email@domain.com`

#### Using PowerShell (Alternative)
```powershell
# Run as Administrator
New-SelfSignedCertificate -DnsName "localhost" -CertStoreLocation "cert:\LocalMachine\My" -KeyLength 2048 -KeyAlgorithm RSA -KeyExportPolicy Exportable

# Export certificate (replace thumbprint with actual value)
$cert = Get-ChildItem -Path cert:\LocalMachine\My\[THUMBPRINT]
Export-Certificate -Cert $cert -FilePath "C:\nginx\ssl\nginx.crt"
Export-PfxCertificate -Cert $cert -FilePath "C:\nginx\ssl\nginx.pfx" -Password (ConvertTo-SecureString -String "password" -Force -AsPlainText)
```

## Step 3: Configure Nginx for SSL

### Create EHS SSL Configuration
Create file: `C:\nginx\conf\sites\ehs-ssl.conf`

```nginx
# HTTP to HTTPS redirect
server {
    listen 80;
    server_name localhost;
    return 301 https://$server_name$request_uri;
}

# HTTPS server for EHS frontend
server {
    listen 443 ssl http2;
    server_name localhost;
    
    # SSL Configuration
    ssl_certificate C:/nginx/ssl/nginx.crt;
    ssl_certificate_key C:/nginx/ssl/nginx.key;
    
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
    
    # Document root for frontend files
    root C:/path/to/deployment/frontend;
    index index.html;
    
    # Frontend routing
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # API proxy to backend
    location /api/ {
        proxy_pass http://localhost:8080/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Port $server_port;
        
        # WebSocket support (if needed)
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        
        # Timeouts
        proxy_connect_timeout 30s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
    }
    
    # Static file handling
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### Update Main Nginx Configuration
Edit `C:\nginx\conf\nginx.conf`:

```nginx
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
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
    
    # Include site configurations
    include sites/*.conf;
}
```

## Step 4: Create Sites Directory and Test

```cmd
# Create sites directory
mkdir C:\nginx\conf\sites

# Copy the EHS SSL config to sites directory
copy C:\nginx\conf\sites\ehs-ssl.conf C:\nginx\conf\sites\

# Test nginx configuration
C:\nginx\nginx.exe -t

# If test passes, reload nginx
C:\nginx\nginx.exe -s reload
```

## Step 5: Update .env File

Update your deployment `.env` file:
```bash
# Change frontend URL to HTTPS
FRONTEND_URL=https://localhost
```

## Step 6: Windows Firewall Configuration

```cmd
# Run as Administrator
# Allow HTTPS traffic
netsh advfirewall firewall add rule name="HTTPS" dir=in action=allow protocol=TCP localport=443

# Allow HTTP traffic (for redirect)
netsh advfirewall firewall add rule name="HTTP" dir=in action=allow protocol=TCP localport=80
```

## Option 2: Let's Encrypt (Free Valid Certificate)

### Using win-acme (Recommended for Windows)

1. **Download win-acme:**
   - Go to: https://www.win-acme.com/
   - Download latest release
   - Extract to `C:\win-acme`

2. **Run win-acme:**
```cmd
# Run as Administrator
cd C:\win-acme
wacs.exe
```

3. **Follow the wizard:**
   - Choose option `N` for new certificate
   - Select `1` for single binding
   - Enter your domain name
   - Choose validation method (DNS or HTTP)
   - Select installation: nginx

4. **Automatic renewal:**
   - win-acme sets up automatic renewal via Task Scheduler

## Testing SSL Setup

### 1. Test Certificate
```cmd
# Test nginx configuration
C:\nginx\nginx.exe -t

# Check if nginx is running
tasklist | findstr nginx
```

### 2. Browser Test
- Navigate to: `https://localhost`
- For self-signed certificates, you'll see a security warning - click "Advanced" → "Proceed to localhost"

### 3. SSL Labs Test (for public certificates)
- Go to: https://www.ssllabs.com/ssltest/
- Enter your domain to test SSL configuration

## Troubleshooting

### Common Issues:

1. **Certificate not found:**
   - Check file paths in nginx config
   - Ensure certificates exist in `C:\nginx\ssl\`

2. **Nginx won't start:**
   - Check `C:\nginx\logs\error.log`
   - Verify configuration with `nginx -t`

3. **Browser shows "Not Secure":**
   - Normal for self-signed certificates
   - Add certificate to Windows certificate store for testing

4. **502 Bad Gateway:**
   - Ensure backend is running on port 8080
   - Check proxy_pass configuration

### Add Self-Signed Certificate to Windows Store:
```cmd
# Run as Administrator
certlm.msc
# Import C:\nginx\ssl\nginx.crt to "Trusted Root Certification Authorities"
```

## Security Notes

- **Self-signed certificates** are OK for development/internal use
- **For production**, use Let's Encrypt or commercial certificates
- **Never commit** certificate files to version control
- **Regular updates** - renew certificates before expiry

## Service Setup (Optional)

To run nginx as Windows service:

1. Download NSSM: https://nssm.cc/download
2. Install nginx as service:
```cmd
nssm install nginx C:\nginx\nginx.exe
nssm set nginx AppDirectory C:\nginx
nssm start nginx
```

---
**Note**: After SSL setup, access your EHS application at `https://localhost`

**Created**: 2025-06-12  
**Version**: 1.0